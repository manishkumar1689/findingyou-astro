<template>
  <nav class="chart-subjects" :class="wrapperClasses">
    <div class="suggested">
      <div v-if="showFilter" class="form-row actions top">
        <b-input
          v-model="searchName"
          placeholder="Search by name"
          class="search"
          icon-right="magnify"
        />
      </div>
      <ol v-if="hasSuggestions">
          <li
            v-for="(sug, si) in suggestions"
            :key="['suggestion', index, si, sug.id].join('-')"
            @click="preselectChart(sug)"
          >{{sug.name}}
          </li>
        </ol>
    </div>
    <h3 class="list-title">Recent charts</h3>
    <div class="items recent-charts">
        <ol>
        <li
          v-for="(opt, oi) in chartOptions"
          :key="opt.itemKey"
          @mouseenter="highlightItem(oi)"
          :class="itemClasses(oi)"
        >
          <b-tooltip class="info name" :label="opt.label" type="is-info" :multilined="true" position="is-bottom"
              @click.native="preselectChart(opt)">
            {{ opt.name }}
          </b-tooltip>
          <span v-if="showControls(oi)" class="edit-controls">
            <div class="remove" @click="handleDelete(opt)">
              <b-icon icon="trash-can-outline" />
            </div>
          </span>
        </li>
      </ol>
    </div>
  </nav>
</template>
<script lang="ts">
import { State, Action } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ChartFormSetState, UserState } from "../../store/types";
import { notEmptyString, isNumeric } from "../../api/validators";
import { Chart } from "../../api/models/Chart";
import { bus } from "../../main";
import { FilterSet } from "../../api/composables/FilterSet";
import {
  julToISODateObj
} from "../../api/converters";
import { matchChartNamesByUser, deleteUserChart, fetchChartById } from "../../api/methods";
import { addChartToList } from "@/store/local";

@Component({
  filters: FilterSet
})
export default class ChartManager extends Vue {
  @Prop({ default: 0 }) index: number;
  @Prop({ default: "chart" }) context: string;
  @Prop({ default: new Chart(null) }) chart: Chart;
  @Prop({ default: () => [] }) selectedIds: Array<string>;
  @Prop({ default: false }) editMode: boolean;
  @Prop({ default: false }) maySelectSecondChart: boolean;
  @Prop({ default: false }) showFilter: boolean;
  @Prop({ default: 20 }) limit: number;
  @Prop({ default: 10 }) maxFiltered: number;
  @State("chartForms") chartForms: ChartFormSetState;
  @State("user") user: UserState;
  @Action("removeForm", { namespace: "chartForms" }) removeForm: any;

  private selectedChartId = "";

  private searchName = "";

  private refresh = false;

  private highlightIndex = -1;

  private targetIndex = -1;

  private suggestions = [];

  private dateRgx = /^\s*((19|20)\d\d)\s*(-\s*((19|20)?\d\d))?\b/;

  get hasChartOptions() {
    return this.chartOptions.length > 0;
  }

  get wrapperClasses() {
    const cls = [this.context];
    if (this.editMode) {
      cls.push("edit-mode");
    }
    return cls;
  }

  get chartOptions() {
    return this.refresh
      ? []
      : this.listChartItems();
  }

  get hasSuggestions() {
    return this.suggestions.length > 0;
  }

  get searchRgx() {
    return new RegExp("\\b" + this.searchName, "i");
  }

  dateMatch() {
    return this.searchName.match(this.dateRgx);
  }

  get isFiltered() {
    return notEmptyString(this.searchName, 1);
  }

  get max() {
    return this.isFiltered ? this.maxFiltered : this.limit;
  }

  listChartItems() {
    let items = [];
    const stored = this.$ls.get('chart-items');
    if (stored instanceof Array && this.chart instanceof Chart) {
      items = stored.filter(co => co.id !== this.chart._id);
    }
    return items.map((item, ci) => {
      const birthString = `Born on ${item.localDt} in ${item.locality}`;
      const label = [birthString, item.lastEditInfo].join(", ");
      const year = item.datetime.split('-').shift();
      const itemKey = ['chart-opt', item.id, this.index, ci].join('-');
      return {...item, itemKey, year, label};
    });
  }

  maySelectChart(opt, set = 1) {
    return (
      //this.getChartId(set) !== opt.id &&
      set === 1 || this.maySelectSecondChart
    );
  }

  getChartId(set = 1) {
    const id = this.$ls.get("c" + set.toString());
    return notEmptyString(id) ? id : "";
  }

  resetSuggested() {
    this.suggestions = [];
    this.searchName = "";
  }

  preselectChart(item) {
    if (item instanceof Object) {
      const {id} = item;
      this.selectedChartId = id;
      fetchChartById(id).then(data => {
        if (data.valid) {
          const chart = new Chart(data.chart);
          this.refresh = true;
          addChartToList(chart);
          setTimeout(() =>{
            const index = this.targetIndex >= 0 ? this.targetIndex : this.index;
            bus.$emit("switch-chart", {
              index,
              context: this.context,
              chart
            });
            this.refresh = false;
            this.resetSuggested();
          }, 500);
        }
      })
    }
  }

  handleDelete(opt) {
    const { id, name, localDt, locality, lastEditInfo } = opt;
    let message = `Do you want to delete this chart for ${name} - ${localDt} / ${locality}`;
    if (lastEditInfo) {
      message += ` (${lastEditInfo})`;
    }
    this.$buefy.dialog.confirm({
      message,
      cancelText: "Keep",
      confirmText: "Delete",
      type: "is-danger",
      onConfirm: () => this.delete(id)
    });
  }

  filterByNames(chart: Chart) {
    return (
      this.searchRgx.test(chart.subject.name) ||
      chart.placenames.some(
        pl => this.searchRgx.test(pl.fullName) || this.searchRgx.test(pl.name)
      )
    );
  }

  filterByYears(dm, chart: Chart) {
    if (dm instanceof Array) {
      let numYrs = 0;
      const years = [];
      if (dm[1]) {
        years.push(parseInt(dm[1]));
      }
      if (years.length > 0 && isNumeric(dm[4])) {
        let toYear = parseInt(dm[4]);
        if (toYear < 100) {
          if (years[0] < 1999) {
            toYear += 1900;
          } else {
            toYear += 2000;
          }
        }
        if (toYear > years[0]) {
          years.push(toYear);
        }
      }
      numYrs = years.length;
      if (numYrs > 0) {
        const dt = julToISODateObj(chart.jd, chart.tzOffset);
        if (dt) {
          const cy = dt.getFullYear();
          return numYrs < 2
            ? cy === years[0]
            : cy >= years[0] && cy <= years[1];
        }
      }
    }

    return false;
  }

  filterSearchPattern(cf) {
    const { chart } = cf;
    const dm = this.dateMatch();
    if (dm) {
      return this.filterByYears(dm, chart);
    } else {
      return this.filterByNames(chart);
    }
  }

  delete(id: string) {
    deleteUserChart(this.user._id, id).then(data => {
      this.removeForm(id);
      this.removeFromLists(id);
      if (data.valid) {
        this.$buefy.toast.open({
          duration: 3000,
          message: `Chart deleted`,
          position: "is-bottom",
          type: "is-success"
        });
      }
    });
    setTimeout(() =>{
      this.removeFromLists(id)
    }, 500);
  }

  removeFromLists(id: string) {
    const stored = this.$ls.get("chart-items");
    if (stored instanceof Array) {
      if (stored.length > 0) {
        const index = stored.findIndex(c => c.id === id);
        if (index >= 0) {
          stored.splice(index, 1);
          this.$ls.set("chart-items", stored, 3600 * 1000);
          this.refresh = true;
        }
      }
      const sugIndex = this.suggestions.findIndex(c => c.id === id);
      if (sugIndex >= 0) {
        this.suggestions.splice(sugIndex, 1);
      }
      setTimeout(() => {
          this.refresh = false;
        }, 500);
    }
  }

  highlightItem(index) {
    if (index >= 0 && index < this.chartOptions.length) {
      this.highlightIndex = index;
    }
  }

  showControls(index: number) {
    return this.editMode && (this.limit < 15 || this.highlightIndex === index);
  }

  itemClasses(index: number) {
    const cls = [["item", index].join("-")];
    if (this.showControls(index)) {
      cls.push("controls-active");
    }
    return cls;
  }

  hide() {
    bus.$emit("show-form", { index: this.index });
  }

  @Watch("searchName")
  changeSearchName(newVal) {
    this.suggestions = [];
    if (notEmptyString(newVal, 1)) {
      matchChartNamesByUser(this.user._id, newVal).then(data => {
        if (data instanceof Array) {
          this.suggestions = data;
        }
      });
    }
    
  }
}
</script>
