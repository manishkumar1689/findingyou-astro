<template>
  <form class="paired-charts chart-subjects edit-form collapsible" :class="wrapperClasses">
    <h3 class="form-title" v-if="showTitle" @click="toggleCollapse">Connected Charts</h3>
    <div class="inner">
      <div v-if="showSearch" class="form-row actions top">
        <b-input
          v-model="searchName"
          placeholder="Search by name"
          class="search"
          icon-right="magnify"
        />
      </div>
      <div class="matched-items">
        <ol>
          <li
            v-for="(matched, mi) in matchedItems"
            :key="['match-item-paired', mi, matched._id].join('-')"
            @click="selectPaired(matched)"
          >
            <span class="info" :title="matched.lastEditInfo">
              <span class="name" v-html="matched.title"></span>
              <span class="relation">{{ matched.relType | expandRelType }}</span>
            </span>
          </li>
        </ol>
      </div>
      <div v-if="showList" class="items collapsible">
        <h4 v-if="showSearch" class="list-title">Connections</h4>
        <ol>
          <li
            v-for="(opt, pi) in items"
            :key="['paired-chart', pi, opt._id].join('-')"
            class="connection"
          >
            <b-tooltip class="info" :label="opt.label" position="is-bottom">
              <span class="name" v-html="opt.title" @click="select(opt)"></span>
              <span class="relationship" @click="select(opt)">{{ opt.relType|expandRelType }}</span>
            </b-tooltip>
            <b-tooltip class="edit-controls" :label="opt.label" position="is-bottom">
              <b-icon icon="eye" class="load" @click.native="select(opt)" />
              <b-icon v-if="mayShowControls(opt)" class="remove" @click.native="handleDelete(opt)" icon="trash-can-outline" />
            </b-tooltip>
          </li>
        </ol>
      </div>
      <div v-if="showPartnerMatch" class="new-connection" @mouseleave="resetSuggestions" @mouseenter="triggerSearchByPairedName">
        <b-field class="row" :type="pairedStatus">
          <b-input
            v-model="pairedName"
            placeholder="Search by name"
            class="search"
            icon-right="magnify"
          />
          <b-select class="dropdown" v-model="relType" :error="linkError">
            <option v-for="(opt, oi) in typeOptions" :value="opt.slug" :key="[opt.slug, oi].join('-')">{{
              opt.name
            }}</option>
          </b-select>
          <div v-if="linkError" class="relationship-error">
            {{errorMsg}}
          </div>
        </b-field>
        <ol v-if="hasSuggestions">
          <li
            v-for="(sug, si) in suggestions"
            :key="['partner', si, sug.id].join('-')"
            @click="selectPartner(sug)"
          >{{sug.name}}
          </li>
        </ol>
      </div>
    </div>
  </form>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { UserState } from "../../store/types";
import { emptyString, isNumeric, notEmptyString } from "../../api/validators";
import { Chart, PairedChart } from "../../api/models/Chart";
import { bus } from "../../main";
import { FilterSet } from "../../api/composables/FilterSet";
import { mediumDate, julToMediumDate, sanitize } from "../../api/converters";
import {
  savePairedChart,
  deletePairedChart,
  searchPaired,
  getPairedByChartIds,
  getPairedByChart,
  matchChartNamesByUser,
  fetchPairedTagOptions,
} from "../../api/methods";
import { KeyName, SlugName, TagOptionSet } from "@/api/interfaces";
import { toWords } from "@/api/helpers";

@Component({
  filters: FilterSet,
})
export default class PairedChartList extends Vue {
  @Prop({ default: new Chart(null) }) chart: Chart;
  @Prop({ default: "chart" }) mode: string;
  @Prop({ default: "short" }) listing: string;
  @State("user") user: UserState;

  private items: Array<any> = [];

  private matchedItems: Array<any> = [];

  private suggestions: Array<any> = [];

  private searchName = "";

  private pairedName = "";

  private expanded = false;

  private refreshing = false;

  private searching = false;

  private pairedNameId = "";

  private relType = "-";

  private typeOptions: SlugName[] = [];

  created() {
    this.sync();
    this.changeRoute();
    this.expanded = this.mode !== "short";
  }

  sync() {
    if (this.chart instanceof Object) {
      const { _id } = this.chart;
      const cacheKey = ["related-paired-charts", _id].join("-");
      const items = this.$ls.get(cacheKey);
      fetchPairedTagOptions().then(rows => {
        if (rows instanceof Array) {
          this.buildTypeOptions(rows);
        }
      });
      if (items instanceof Array && items.length > 0) {
        this.items = items;
      } else {
        getPairedByChart(this.chart._id).then((result) => {
          if (result.valid) {
            this.items = result.items.filter(this.isPaireItem).map(item => this.mapPairedItems(item, this.chart._id));
          }
        });
      }
    }
  }

  select(item) {
    if (item instanceof Object) {
      getPairedByChartIds(item.c1, item.c2).then(data => {
        const {item} = data;
        if (item instanceof Object) {
          const paired = new PairedChart(item);
          this.$ls.set("selected-pc", paired);
          this.$ls.set("c1", item.c1);
          this.$ls.set("c2", item.c2);
          setTimeout(()=> {
            bus.$emit("set-paired-chart", paired, true);
          }, 375);
        }
        /*  */
      });
    }
  }

  selectMatched(chart) {
    if (chart instanceof Object) {
      const inData = {
        user: this.user._id,
        c1: this.chart._id,
        c2: chart._id,
        midMode: "midpoint",
      };
      if (chart.new) {
        savePairedChart(inData).then((result) => {
          if (result.valid) {
            const { paired } = result;
            if (paired instanceof Object) {
              this.loadPaired(paired);
            }
          }
        });
      } else {
        const paired = this.items.find(
          (p) => p.c1._id === chart._id || p.c2._id === chart._id
        );
        if (paired) {
          this.initPaired(paired, 500);
        }
      }
    }
  }

  loadPaired(paired) {
    const items = this.$ls.get("paired-charts");
    if (items instanceof Array) {
      items.push(paired);
      items.sort((a, b) => b.modifiedAt - a.modifiedAt);
    }
    setTimeout(this.sync, 500);
    this.searchName = "";
    this.initPaired(paired, 250);
  }

  mapPairedItems(item, id: string) {
    const {_id, c1, c2, user, startYear, relType, lastEditInfo, localDt } = this.mapItem(item);
    const other = c1._id === id? c2 : c1;
    const partnerName = other.subject.name;
    const startYearStr = typeof startYear === 'number'? Math.floor(startYear).toString() : '';
    const label = [c1.subject.name, c2.subject.name].join(" / ") + ` (${toWords(relType)})`;
    return {_id, c1: c1._id, c2: c2._id, user, title: partnerName, label, relType, startYear: startYearStr};
  }

  mapItem(p) {
    const lastEditInfo = "Last edited on " + mediumDate(p.modifiedAt);
    const { jd, tzOffset } = p.timespace;
    const localDt = julToMediumDate(jd, tzOffset);
    return { ...p, lastEditInfo, localDt };
  }

  initPaired(paired, timeoutMs) {
    this.$ls.set("selected-pc", paired);
    bus.$emit("set-paired-chart", paired, false);
    bus.$emit("refresh-paired-chart", true);
    setTimeout(this.sync, timeoutMs);
    this.searchName = "";
  }

  toast(message: string, duration = 3000) {
    this.$buefy.toast.open({
      duration,
      message,
      position: "is-bottom",
      type: "is-success"
    });
  }

  get wrapperClasses() {
    const cls = [["num-items", this.items.length].join("-"), this.expanded? 'open' : 'closed'];
    if (this.mode === "chart") {
      cls.push("collapsible");
    }
    return cls;
  }

  get showSearch() {
    return this.listing === 'long';
  }

  get showPartnerMatch() {
    return this.listing === 'short';
  }

  get showTitle() {
    return this.mode !== "user";
  }

  get showList() {
    return this.mode !== "user" || this.listing === "long";
  }

  get selectedId() {
    let id = "";
    const pc = this.$ls.get("selected-pc");
    if (pc instanceof Object) {
      id = pc._id;
    }
    return id;
  }

  get hasSuggestions() {
    return this.suggestions.length > 0;
  }

  get hasPairedNameId() {
    return this.pairedNameId.length > 8;
  }

  get hasRelType() {
    return this.relType.length > 2;
  }

  get pairedStatus() {
    const valid = this.hasPairedNameId && this.hasRelType;
    const showWarning = this.hasPairedNameId || this.hasRelType;
    const score = valid? 2 : showWarning? 0 : 1;
    switch (score) {
      case 0: 
        return "is-danger";
      case 2: 
        return "is-success";
      default:
        return "is-normal";
    }
  }

  get linkError() {
    return this.pairedStatus === "is-danger";
  }

  get errorMsg() {
    if (!this.hasRelType) {
      return "Please select a relationship type";
    } else if (!this.hasPairedNameId) {
      return "Please select a partner";
    } else {
      return "";
    }
  }

  mayShowControls(paired) {
    return paired.user === this.user._id || this.user.isAdmin();
  }

  isCurrent(paired) {
    let valid = false;
    if (paired instanceof Object) {
      const { _id, surfaceTzOffset } = paired;
      valid = _id === this.selectedId && isNumeric(surfaceTzOffset);
    }
    return valid;
  }
  

  updateMatchedItems() {
    this.refreshing = true;
    this.matchedItems = [];
    searchPaired(this.user._id, this.searchName).then((items) => {
      
      this.matchedItems = items
        .map((item) => {
          const { _id, c1, c2, year, relType, timespace, modifiedAt } = item;
          return {
            _id,
            timespace,
            chartIds: [c1._id, c2._id],
            title: [c1.name, c2.name].join(" / "),
            relType,
            year,
            modifiedAt,
          };
        })
        .map(this.mapItem);
      setTimeout(() => {
        this.refreshing = false;
      }, 125);
    });
    setTimeout(() => {
      this.refreshing = false;
    }, 2000);
  }

  handleDelete(paired) {
    if (paired instanceof Object) {
      const coupleName = [paired.title, this.chart.subject.name].join(' / ')
      const { _id } = paired;
      this.$buefy.dialog.confirm({
        message: `Are you sure you wish to delete the paired chart for "${coupleName}"`,
        cancelText: "Keep",
        confirmText: "Delete",
        type: "is-danger",
        onConfirm: () => this.deletePaired(paired),
      });
    }
  }

  deletePaired(paired) {
    const { _id } = paired;
    deletePairedChart(_id, this.user._id).then((data) => {
      if (data.valid) {
        const items = this.$ls.get("paired-charts");
        if (items instanceof Array && items.length > 0) {
            this.$ls.set(
            "paired-charts",
            items.filter((p) => p._id !== data.paired)
          );
          setTimeout(this.sync, 500);
        }
        const pIndex = this.items.findIndex(item => item._id === _id);
        if (pIndex >= 0) {
          this.items.splice(pIndex, 1);
        }
      }
    });
  }

  selectPaired(matched = null) {
    if (matched instanceof Object) {
      const [id1, id2] = matched.chartIds;
      getPairedByChartIds(id1, id2).then((data) => {
        if (data.valid) {
          this.loadPaired(data.item);
        }
      });
    }
  }

  selectPartner(suggestion) {
    this.pairedNameId = "";
    if (suggestion instanceof Object) {
      this.pairedName = suggestion.name.split(/\(\w\w?\),/).shift();
      if (notEmptyString(this.relType, 2)) {
        const {id} = suggestion;
        this.savePartner(id);
      } else {
        this.suggestions = [];
        this.pairedNameId = suggestion.id;
        this.relType = "-";
      }
    }
  }

  savePartner(id: string) {
    const tags = this.typeOptions.filter(tg =>tg.slug === this.relType);
    const inData = {
      c1: this.chart._id,
      c2: id,
      user: this.user._id,
      relType: this.relType,
      tags
    };
    const relTag = this.typeOptions.find(tg => tg.slug === this.relType);
    const relName = relTag instanceof Object ? relTag.name : "";
    const { name } = this.chart.subject;
    this.toast(`Saving a new paired chart for ${name} and ${this.pairedName} (${relName})`);
    setTimeout(() =>{
      savePairedChart(inData).then((data) => {
        if (data.valid) {
          this.loadPaired(data.paired);
          this.suggestions = [];
          this.pairedNameId = "";
          this.relType = "-";
        }
      });
    }, 750);
  }

  resetSuggestions() {
    const hasSuggestions = this.suggestions.length > 0;
    if (hasSuggestions && this.hasPairedNameId) {
      this.suggestions = [];
      setTimeout(() =>{
        if (!this.searching) {
          this.pairedName = "";
        }
      }, 1500);
    }
  }

  isPaireItem(item = null) {
    if (item instanceof Object) {
      const { c1, c2} = item;
      return c1 instanceof Object && c2 instanceof Object
    } else {
      return false;
    }
  }

  toggleCollapse() {
    this.expanded = !this.expanded;
  }

  buildTypeOptions(rows: TagOptionSet[] = []) {
    const firstRow = { slug: "-", name: "... relationship" };
    const typeSet = rows.find(tg => tg.key === "type");
    const typeTags = typeSet instanceof Object ? typeSet.options : [];
    this.typeOptions = [firstRow, ...typeTags];
  }

  searchByPairedName() {
    const cId = this.chart._id;
    this.suggestions = [];
    if (notEmptyString(this.pairedName, 1) && notEmptyString(cId, 12)) {
      if (!this.searching) {
        this.suggestions = [];
        const currNameStr = sanitize(this.chart.nameGenderYear);
        this.searching = true;
        matchChartNamesByUser(this.user._id, this.pairedName).then(data => {
          if (data instanceof Array) {
            for (const item of data) {
              const itemNameStr = sanitize(item.name);
              if (item.id !== cId && this.suggestions.some(sug => sanitize(sug.name) === itemNameStr) === false && itemNameStr !== currNameStr) { 
                this.suggestions.push(item);
              }
            }
            this.searching = false;
          }
      });
    }
   }
  }

  triggerSearchByPairedName() {
    if (notEmptyString(this.pairedName) && this.suggestions.length < 1 && this.hasPairedNameId) {
      this.searchByPairedName();
    }
  }

  @Watch("pairedName")
  changePairedName() {
    this.searchByPairedName();
  }

  @Watch("searchName")
  changeSearchName() {
    if (!this.refreshing) {
      this.updateMatchedItems();
    }
    if (emptyString(this.searchName)) {
      this.matchedItems = [];
    }
  }

  @Watch("relType")
  changeRelType() {
    if (!this.refreshing && this.hasPairedNameId && this.hasRelType) {
      this.savePartner(this.pairedNameId);
    }
  }

  @Watch("chart")
  changeChart() {
    if (!this.refreshing) {
      this.sync();
    }
  }

  @Watch("$route")
  changeRoute() {
    const { path } = this.$route;
    const endSection = path.split("/").pop();
    this.expanded = endSection === "single";
  }

}
</script>
