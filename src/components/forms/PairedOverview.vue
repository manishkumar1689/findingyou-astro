<template>
  <div class="paired-charts-overview" :class="wrapperClasses">
    <form class="edit-form compability-overview" @submit.prevent="fetchResults">
      <header class="section top vertical">
        <h2>All Paired Charts</h2>
        <div class="top-bar horizontal">
          <b-field class="horizontal">
            <b-input
              type="text"
              placeholder="Search"
              icon-right="magnify"
              v-model="search"
              class="search long"
            />
          </b-field>
          <slot></slot>
          <b-button
            v-if="hasId"
            type="is-success"
            class="submit"
            @click="fetchResults"
            :title="totalText"
            >Show results</b-button
          >
        </div>
      </header>
      <div class="section top horizontal">
        <fieldset class="column top left">
          <legend>Paired Charts Ratings Settings</legend>
          <div class="column vertical">
            <legend>Only use Chart Pairs where ...</legend>
            <b-radio
              v-for="(setting, si) in pairedOpts"
              :key="['paired-opt', si].join('-')"
              v-model="pairedChartRating"
              :native-value="setting.key"
              >{{ setting.name }}
            </b-radio>
          </div>
        </fieldset>
        <div class="horizontal search-filter wide right">
          <fieldset class="vertical type">
            <legend>Type</legend>
            <b-select class="dropdown" v-model="relType">
              <option
                v-for="(opt, oi) in typeOptions"
                :value="opt.slug"
                :key="['reltyp', opt.slug, oi].join('-')"
                >{{ opt.name }}</option
              >
            </b-select>
          </fieldset>
          <fieldset class="vertical duration">
            <legend>Duration</legend>
            <b-select v-model="durationMode">
              <option
                v-for="(opt, oi) in durationOpts"
                :value="opt.key"
                :key="['dur-opt', opt.key, oi].join('-')"
                >{{ opt.name }}</option
              >
            </b-select>
            <b-field
              v-if="filterByDuration"
              class="year horizontal"
              label="Years"
            >
              <b-input type="number" v-model="duration" :min="0" :max="100" />
            </b-field>
          </fieldset>
          <fieldset class="vertical traits">
            <legend>
              <span class="text">Quality</span>
              <span class="switch-label">Any</span>
              <b-switch v-model="traitAndLogic">All</b-switch>
            </legend>
            <div class="checkboxes">
              <b-checkbox
                v-for="(opt, oi) in qualityOptions"
                :key="['quality', opt.key, oi].join('-')"
                v-model="quality"
                :native-value="opt.slug"
                >{{ opt.name }}</b-checkbox
              >
            </div>
          </fieldset>
          <fieldset class="vertical end-who-how dropdowns">
            <legend>How did it end?</legend>
            <b-switch v-model="endHowDisabled">N/A</b-switch>
            <b-checkbox v-model="ongoing" :disabled="endHowDisabled"
              >ongoing</b-checkbox
            >
            <b-select class="dropdown" v-model="endHow" :disabled="!showEndHow">
              <option
                v-for="(opt, oi) in endHowOptions"
                :value="opt.slug"
                :key="[opt.slug, oi].join('-')"
                >{{ opt.name }}</option
              >
            </b-select>
            <legend>Who ended it?</legend>
            <b-select class="dropdown" v-model="endWho" :disabled="!showEndWho">
              <option
                v-for="(opt, oi) in endWhoOptions"
                :value="opt.slug"
                :key="[opt.slug, oi].join('-')"
                >{{ opt.name }}</option
              >
            </b-select>
          </fieldset>
        </div>
      </div>
    </form>

    <div class="results">
      <b-table
        v-if="hasResults"
        :data="results"
        :mobile-cards="false"
        :row-class="rowClassNames"
        :paginated="true"
        backend-pagination
        :current-page="page"
        :per-page="perPage"
        :total="numPairedCharts"
        @page-change="changePage"
      >
        <template slot-scope="props">
          <b-table-column class="scores" field="totals" label="Total">
            <strong class="value">{{ extractTotal(props.row.totals) }}</strong>
            <b-icon
              icon="information-outline"
              @click.native="toggleInfoRow(props.index)"
              title="View detailed analysis"
            />
            <div v-if="showInfo(props.index)" class="info-panel" @mouseleave="resetInfo">
              <ul class="totals">
                <li v-for="row in totalRows(props.row.totals)" :key="row.key">
                  <span class="label">{{ row.head }}</span>
                  <strong class="value">{{ row.value }}</strong>
                </li>
              </ul>
              <ul class="subtotals">
                <li v-for="row in props.row.subtotalsByPane" :key="row.key">
                  <span class="label">{{ row.label }}</span>
                  <strong class="value">{{ row.percVal }}</strong>
                  <ul v-if="row.details.length > 0" class="details">
                    <li v-for="dr in row.details" :key="dr.rowKey">
                      <span class="label">{{ dr.label }}</span>
                      <strong class="value">{{ dr.percVal }}</strong>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </b-table-column>
          <b-table-column class="names" field="name_a" label="Person 1">
            <b-tooltip :label="props.row.fullNameGenderDob1">{{
            props.row.nameGender1
          }}</b-tooltip>
          </b-table-column>
          <b-table-column class="names" field="rodden_a" label="Rodden 1">{{
            roddenKey(props.row.rodden1)
          }}</b-table-column>
          <b-table-column class="names" field="name_b" label="Person 2"><b-tooltip :label="props.row.fullNameGenderDob2">{{
            props.row.nameGender2
          }}</b-tooltip>
          </b-table-column>
          <b-table-column class="names" field="rodden_b" label="Rodden 2">{{
            roddenKey(props.row.rodden2)
          }}</b-table-column>
          <b-table-column class="names" field="relType" label="Relationship">
            <b-tooltip :label="props.row.relInfo" multilined>{{
              props.row.info.relType|toWords
            }}</b-tooltip>
          </b-table-column>
          <b-table-column field="duration" label="Duration">{{
            props.row.durationString
          }}</b-table-column>
          <b-table-column
            class="quality attribute"
            field="quality"
            label="Quality"
            >{{ props.row.qualityNames }}</b-table-column
          >
          <b-table-column
            class="end-how attribute"
            field="end_how"
            label="How did it end?"
            >{{ props.row.endHow.name }}</b-table-column
          >
          <b-table-column class="names" field="end_who" label="Who ended it?">{{
            props.row.endWho.name
          }}</b-table-column>
          <b-table-column class="edit view" field="edit" label="Edit / View">
            <b-icon
              icon="trash-can-outline"
              type="is-danger"
              @click.native="removeRow(props.row)"
              title="Delete paired chart"
            />
            <b-icon
              icon="square-edit-outline"
              type="is-success"
              @click.native="editRow(props.row)"
              title="Edit relationship attributes"
            />
            <b-icon
              icon="eye"
              type="is-info"
              @click.native="openFullChart(props.row)"
              title="Open paired chart widgets in new tab"
            />
          </b-table-column>
        </template>
      </b-table>
      <b-progress class="loading-progress" type="is-success" size="is-large" :show-value="true">Loading results</b-progress>
      <div class="editing-overlay relationship-overlay" @click.prevent.stop="handleCloseForm">
        <div class="inner-panel">
          <b-icon class="close" icon="close" @click.native="close" />
          
          <relationship-form
            v-if="pairedExpanded"
            :paired="selectedPaired"
            :label="selectedLabel"
            :autosubmit="false"
          >
            <b-button
            @click="savePaired"
            icon-left="content-save"
            class="save"
            type="is-success"
            >Save details</b-button
          >
            <subject-details :chart="selectedPaired.c1" />
            <subject-details :chart="selectedPaired.c2" />
          </relationship-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Watch, Vue } from "vue-property-decorator";
import {
  analysePaired,
  fetchPairedTagOptions,
  fetchRoddenValues,
  findPairings,
  getNumPaired,
  getPairedByChartIds,
  removePaired,
  savePairedChart,
} from "../../api/methods";
import { isNumeric, notEmptyString } from "../../api/validators";
import { bus } from "../../main";
import { asPerc, smartCastInt } from "../../api/converters";
import {
  DictionaryState,
  SettingState,
  UserState,
} from "../../store/types";
import { FilterSet } from "../../api/composables/FilterSet";
import { Chart, PairedChart } from "../../api/models/Chart";
import { ProtocolSearchResult } from "../../api/models/ProtocolSearchResult";
import { Protocol } from "../../api/models/Condition";
import { pairedChartRatings } from "../../api/mappings/compatibility-sets";
import RelationshipForm from "./RelationshipForm.vue";
import SubjectDetails from "./SubjectDetails.vue";
import { SlugName } from "@/api/interfaces";

@Component({
  components: {
    RelationshipForm,
    SubjectDetails,
  },
  filters: FilterSet,
})
export default class PairedOverview extends Vue {
  @Prop({ default: () => new Protocol() })
  readonly protocol: Protocol;
  @State("dictionary") dictionary: DictionaryState;
  @State("user") user: UserState;
  @State("settings") settings: SettingState;

  private pairedChartRating = "";

  private initialised = false;

  private search = "";

  private relType = "-";

  private tagOptions = [];

  private quality: Array<string> = [];

  private endHow = "ongoing";

  private endHowDisabled = true;

  private ongoing = true;

  private endWho = "-";

  private endWhoDisabled = true;

  private duration = 5;

  private durationMode = "-";

  private traitAndLogic = false;

  private results: Array<ProtocolSearchResult> = [];

  private selectedPaired: PairedChart = new PairedChart();

  private showEdit = false;

  private infoIndex = -1;

  private showProgress = false;

  private roddenValues = [];

  private numPairedCharts = -1;

  private page = 1;

  created() {
    //this.sync();
    setTimeout(() => {
      this.sync();
    }, 500);
    bus.$on("edited-paired-settings", (data) => {
      savePairedChart(data).then((result) => {
        if (result.valid) {
          const { paired } = result;
          const matchedRow = this.results.find((row) => {
            return row.c1Id === paired.c1._id && row.c2Id === paired.c2._id;
          });
          if (matchedRow instanceof ProtocolSearchResult) {
            matchedRow.updateInfo(paired);
            setTimeout(this.close, 500);
          }
        }
      });
    });
    bus.$on("chart-edited", (cData) => {
      if (cData instanceof Object) {
        const { _id } = cData;
        const chart = new Chart(cData);
        this.results
          .filter((row) => {
            return row.c1Id === _id || row.c2Id === _id;
          })
          .forEach((row) => {
            row.updateChart(chart);
          });
      }
    });
    bus.$on("escape", this.close);
  }

  mounted() {
    this.sync();
  }

  sync() {
    fetchPairedTagOptions().then(rows => {
      if (rows instanceof Array) { 
        this.tagOptions = rows.map(row => {
          const keys: string[] = [];
          const options: SlugName[] = [];
          row.options.forEach((row) => {
            if (keys.indexOf(row.slug) < 0) {
              keys.push(row.slug);
              options.push(row);
            }
          });
          return { ...row, options};
        });
        
        
        this.syncData();
      }
    })
    getNumPaired().then(num => {
      if (num > 0) {
        if (!this.hasResults) {
          this.numPairedCharts = num;
        }
      }
    })
  }

  async syncData() {
    fetchRoddenValues().then((items) => {
      this.roddenValues = items;
      this.initialised = true;
    });
  }

  get wrapperClasses() {
    const cls = [];
    if (this.results.length > 0) {
      cls.push("has-results");
    }
    if (this.pairedExpanded) {
      cls.push("show-editing-overlay");
    }
    if (this.showProgress) {
      cls.push("show-progress");
    }
    return cls;
  }

  get totalText() {
    return this.numPairedCharts > 0? `Total ${this.numPairedCharts} paired charts available` : "";
  }

  get pairedOpts() {
    return pairedChartRatings;
  }

  get filterByDuration() {
    return this.durationMode.length > 1;
  }

  get hasId() {
    return notEmptyString(this.protocol._id, 12);
  }

  get id() {
    return this.hasId ? this.protocol._id : "";
  }

  get typeOptions() {
    return [{slug: "-", name: "Any"}, ...this.attributeOptions("type")];
  }

  get selectedLabel() {
    let str = "";
    if (this.pairedExpanded) {
      const { c1, c2 } = this.selectedPaired;
      str = [c1.nameGender, c2.nameGender].join(" & ");
    }
    return str;
  }

  get durationOpts() {
    return [
      {
        key: "-",
        name: "Any length",
      },
      {
        key: "gt",
        name: "Greater than",
      },
      {
        key: "lt",
        name: "Less than",
      },
    ];
  }

  get qualityOptions() {
    return this.attributeOptions("quality");
  }

  attributeTagOpts(key = ""): SlugName[] {
    let opts = [];
    const optSet = this.tagOptions.find(os => os.key === key);
    if (optSet instanceof Object) {
      const {options} = optSet;
      if (options instanceof Array) {
        opts = options.filter(os => os instanceof Object);
      }
    }
    return opts;
  }

  attributeOptions(key = ""): SlugName[] {
    return this.attributeTagOpts(key).map(opt => {
      const {slug, name} = opt;
      return {
        slug,
        name
      }
    });
  }

  get endHowOptions() {
    return this.attributeOptions("end_how").filter(tg => this.endHowDisabled? true : tg.slug !== "ongoing");
  }

  get endWhoOptions() {
    const opts = this.attributeTagOpts("end_who").filter(opt => {
      let valid = false;
      const { parents } = opt;
      if (parents instanceof Array) {
        valid = parents.includes(this.endHow);
      }
      return valid;
    });
    return [{ slug: "", name: "any"}, ...opts];
  }

  get pairedExpanded() {
    return (
      this.selectedPaired instanceof PairedChart &&
      notEmptyString(this.selectedPaired._id, 12) &&
      this.showEdit
    );
  }

  get showEndHow() {
    return !this.endHowDisabled && !this.ongoing;
  }

  get showEndWho() {
    return this.showEndHow && notEmptyString(this.endHow, 2);
  }

  fetchResults() {
    const criteria: Map<string, any> = new Map();
    criteria.set("status", "reference");
    if (notEmptyString(this.search)) {
      criteria.set("search", this.search);
    } else {
      if (notEmptyString(this.relType, 2)) {
        criteria.set("relType", this.relType);
      }
      if (this.quality.length > 0) {
        criteria.set("tags", this.quality.join(","));
        criteria.set("tagsOp", this.traitAndLogic ? "and" : "or");
      }
      if (!this.endHowDisabled && notEmptyString(this.endHow, 2)) {
        criteria.set("endHow", this.endHow);
      }
      if (this.ongoing && !this.endHowDisabled) {
        criteria.set("ongoing", true);
      }
      if (!this.endWhoDisabled && notEmptyString(this.endWho, 2)) {
        criteria.set("endWho", this.endWho);
      }
      if (this.duration > 0 && this.durationMode.length > 1) {
        criteria.set(this.durationMode, this.duration);
      }
      if (
        notEmptyString(this.pairedChartRating, 2) &&
        this.pairedChartRating !== "both_any"
      ) {
        criteria.set("rating", this.pairedChartRating);
      }
    }
    const filterParams = Object.fromEntries(criteria.entries());
    this.showProgress = true;
    const {start,limit} = this.startLimit();
    analysePaired(this.id, start, limit, filterParams).then((data) => {
      if (data.valid) {
        this.results = data.items.map((row) => new ProtocolSearchResult(row, this.tagOptions));
        this.numPairedCharts = data.total;
      }
      this.showProgress = false;
    });
  }

  startLimit() {
    const limitRef = this.$ls.get("max-pc-analyse-limit");
    const limit = isNumeric(limitRef)? smartCastInt(limitRef) : 100;
    const start = (this.page - 1) * limit;
    return {
      start,
      limit
    }
  }

  get perPage() {
    return this.startLimit().limit;
  }

  get hasResults() {
    return this.results.length > 0;
  }

  rowClassNames(row: ProtocolSearchResult, index: number) {
    const cls = index % 2 === 0 ? ["even"] : ["odd"];
    if (
      this.selectedPaired.c1 instanceof Chart &&
      row.c1Id === this.selectedPaired.c1._id &&
      this.selectedPaired.c2 instanceof Chart &&
      row.c2Id === this.selectedPaired.c2._id
    ) {
      cls.push("selected");
    }
    if (this.infoIndex === index) {
      cls.push("highlighted");
    }
    return cls.join(" ");
  }

  roddenKey(numVal: number) {
    const row = this.roddenValues.find((rv) => rv.value === numVal);
    let key = "";
    if (row instanceof Object) {
      key = row.key;
    }
    return key;
  }

  totalRows(totals: Array<any>) {
    let rows = [];
    const sourceRows = totals.filter((r) => r.key !== "total");
    if (sourceRows.length > 0) {
      rows = sourceRows.map((sr, ri) => {
        const [mult, denom] = sr.pair;
        return {
          key: ["total-col", ri, sr.key].join("-"),
          field: sr.key,
          head: sr.key.split("_").join(" "),
          value: asPerc(mult / denom, 2),
        };
      });
    }
    return rows;
  }

  extractTotal(totals: Array<any>) {
    let str = "";
    const row = totals.find((r) => r.key === "total");
    if (row instanceof Object) {
      if (row.pair.length === 2) {
        const [mult, denom] = row.pair;
        str = asPerc(mult / denom, 2);
      }
    }
    return str;
  }

  @Watch("endHow")
  changeEndHow(newVal) {
    switch (newVal) {
      case "divorce":
      case "separation":
      case "murder":
        this.endWhoDisabled = false;
        break;
      default:
        this.endWhoDisabled = true;
        this.endWho = "-";
        break;
    }
  }

  @Watch("ongoing")
  changeOngoing(newVal) {
    if (newVal) {
      this.endHow = "neither";
      this.endWho = "-";
    }
  }

  editRow(row) {
    if (row instanceof ProtocolSearchResult) {
      getPairedByChartIds(row.c1Id, row.c2Id).then((data) => {
        if (data.valid) {
          this.selectedPaired = new PairedChart(data.item);
          this.showEdit = true;
        }
      });
    }
  }

  removeRow(row) {
    if (row instanceof ProtocolSearchResult) {
      const title = `Remove paired chart`;
      const phrases = [
        `Do you want to remove the paired chart for ${row.names}?`,
      ];
      findPairings(row.c1Id, row.c2Id).then((data) => {
        const promptDeleteCharts = data.pc1 < 1 && data.pc2 < 1;
        const delMethod = promptDeleteCharts
          ? this.handleDeleteRow
          : this.deletePairedOnly;
        if (!promptDeleteCharts) {
          phrases.push(
            `Other pairings:`,
            `${row.info.shortName1}: ${data.pc1}`,
            `${row.info.shortName2}: ${data.pc2}`
          );
        }
        const message = phrases.join("<br />");
        this.$buefy.dialog.confirm({
          title,
          message,
          hasIcon: true,
          type: "is-danger",
          onConfirm: () => delMethod(row),
        });
      });
    }
  }

  handleDeleteRow(row: ProtocolSearchResult) {
    const title = `Delete paired chart?`;
    const message = `Do you want to eleted the paired chart only for ${row.names} or related individual charts to? (Press escape or click outside to cancel both)`;
    this.$buefy.dialog.confirm({
      title,
      message,
      hasIcon: true,
      type: "is-info",
      cancelText: "Paired chart only",
      confirmText: "Single charts too",
      onConfirm: () => this.deleteRow(row, true, "button"),
      onCancel: () => this.deleteRow(row, false),
    });
  }

  deleteRow(row: ProtocolSearchResult, delCharts = false, handler = null) {
    if (handler === "button" || delCharts === false) {
      removePaired(row.c1Id, row.c2Id, this.user._id, delCharts).then(
        (data) => {
          if (data.valid) {
            const index = this.results.findIndex(
              (item) =>
                item.c1Id.toString() === row.c1Id.toString() &&
                item.c2Id.toString() === row.c2Id.toString()
            );
            this.results.splice(index, 1);
            const message = delCharts
              ? "Paired chart and related single charts deleted"
              : "Paired chart only deleted";
            bus.$emit("show-message", { message, duration: 2000 });
            this.numPairedCharts--;
          }
        }
      );
    }
  }

  deletePairedOnly(row: ProtocolSearchResult) {
    this.deleteRow(row, false, "button");
  }

  save() {
    this.protocol.settings.set("pairedChartRating", this.pairedChartRating);
  }

  handleCloseForm(e) {
    const { target } = e;
    if (
      target.classList.contains("relationship-overlay") ||
      target.classList.contains("close")
    ) {
      this.close();
    }
  }

  close() {
    this.showEdit = false;
    this.infoIndex = -1;
  }

  resetInfo() {
    this.infoIndex = -1;
  }

  toggleInfoRow(rowIndex) {
    this.infoIndex = rowIndex === this.infoIndex ? -1 : rowIndex;
  }

  showInfo(rowIndex: number) {
    return this.infoIndex === rowIndex;
  }

  savePaired() {
    if (this.pairedExpanded) {
      bus.$emit("save-paired-form");
      bus.$emit("save-chart-meta");
    }
  }

  openFullChart(row: ProtocolSearchResult) {
    if (row.c1Id.length > 8 && row.c2Id.length > 8) {
      const pids = [row.c1Id, row.c2Id].join(",");
      window.open("/astro/paired?pids=" + pids, "_blank");
    }
  }
  changePage(num: number) {
    this.page = num;
    this.fetchResults();
  }
}
</script>
