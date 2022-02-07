<template>
  <GridItem class="dasha-tree" :showSettings="true" :chart="chart" :class="outerClasses">
    <h4>{{ title }}</h4>
    
    <div class="dasha-set widget">
      <div class="controls">
        <b-field v-if="hasChartOptions" class="chart-options">
          <b-radio
            v-for="opt in chartOptions"
            name="selectedChart"
            v-model="selectedChart"
            :native-value="opt.key"
            :key="['dasha',opt.key,paneIndex].join('-')"
          >{{ opt.name }}</b-radio>
        </b-field>
        <b-field class="dasha-options">
          <b-select placeholder="Graha" v-model="grahaKey">
            <option
              v-for="opt in grahaOptions"
              :value="opt.key"
              :key="[opt.key,paneIndex].join('-')"
            >
              {{
              opt.name
              }}
            </option>
          </b-select>
          <b-select placeholder="System" v-model="type">
            <option
              v-for="opt in systemOptions"
              :value="opt.key"
              :key="[opt.key,paneIndex].join('-')"
            >{{ opt.name }}</option>
          </b-select>
          <b-select placeholder="Year" v-model="yearScale">
            <option
              v-for="opt in yearScaleOptions"
              :value="opt.key"
              :key="[opt.key,paneIndex].join('-')"
            >{{ opt.name }}</option>
          </b-select>
        </b-field>
      </div>
      <slot name="selection"></slot>
      <div v-if="!refreshing" class="dasha-list">
        <DashaTreeItemList
          v-if="getRefChart().jd > 0"
          :items="dashaTree"
          :depth="1"
          :jd="getRefChart().jd"
          :tzOffset="getRefChart().tzOffset"
          :maxDepth="maxDepth"
          :index="paneIndex"
          :context="context"
        />
      </div>
      <div v-if="hasDashaPoint" class="dasha-point">
        <SignDegree :deg="dashaPoint" :seconds="true" />
      </div>
      <div class="info-pane">
        <ul v-if="dashaAspects.length > 0" class="dash-aspects">
          <li
            v-for="(aspectSpan, ai) in dashaAspects"
            :key="['aspect', aspectSpan.key, ai, paneIndex].join('-')"
          >
            <span class="dasha-point-graha icon" :class="grahaKey|toGrahaClass"></span>
            <SignDegree :deg="aspectSpan.degree" :seconds="true" />
            <div class="aspect">
              <span :class="aspectClasses(aspectSpan.type)"></span>
              <span class="graha icon" :class="aspectSpan.key|toGrahaClass"></span>
            </div>
            <span>{{aspectSpan.startDate}}</span>
          </li>
        </ul>
        <div v-else class="loading">
          <b-progress size="is-large" type="is-primary" :show-value="true">Loading Dasha Aspects</b-progress>
        </div>
        <ul>
          <li v-for="(balance, bi) in balances" :key="['balance', balance.graha.key, bi].join('-')">
            <strong
              class="icon"
              :class="balance.graha.key | toGrahaClass"
              :title="balance.graha.longitude | toDMS0"
            ></strong>
            <SignDegree :deg="balance.graha.longitude" />
            <span
              v-for="(level, lvi) in balance.levels"
              :key="['level', balance.graha.key, bi, lvi].join('-')"
              class="icon"
              :class="level.key | toGrahaClass"
              :title="level | levelInfo"
            ></span>
          </li>
        </ul>
      </div>

      <div class="info-trigger" @click.stop="showBalances">
        <b-icon icon="dots-horizontal-circle-outline"></b-icon>
      </div>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import GridItem from "../widgets/GridItem.vue";
import SignDegree from "../widgets/SignDegree.vue";
import DashaTreeItemList from "../widgets/DashaTreeItemList.vue";
import { capitalize } from "../../api/converters";
import { DictionaryState, SettingState } from "../../store/types";
import { Chart, combineCharts, fetchCurrentTimespace } from "../../api/models/Chart";
import { setWidgetOption } from "../../store/local";
import { isNumeric, notEmptyString } from "../../api/validators";
import { deepClone } from "../../api/helpers";
import { degAsDms } from "../../api/converters";
import { bus } from "../../main";

import {
  DashaSpan,
  calcDashaSetByKey,
  calcDashaBalanceByKey,
  DashaSet,
  mapDashaItem,
  nakshatraTrailToDegree,
  fetchDashaSet,
  mapDashaPointAspects,
} from "../../api/models/DashaSet";
import { SurfaceTSData } from "../../api/interfaces";
import { dashaSystemKeySets, mapDashaSystemOption } from "@/api/mappings/dasha-sets";
@Component({
  name: "DashaTree",
  components: {
    GridItem,
    DashaTreeItemList,
    SignDegree,
  },
  filters: {
    ...FilterSet,
    levelInfo(val) {
      let str = "";
      if (val instanceof Object) {
        const { startDeg, endDeg, level } = val;
        str =
          ["level", level].join(": ") +
          " - " +
          degAsDms(startDeg, "raw", 0) +
          " to " +
          degAsDms(endDeg, "raw", 0);
      }
      return str;
    },
  },
})
export default class DashaTree extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: () => new Chart() }) readonly timespace: Chart;
  @Prop({ default: 0 }) readonly offset: number;
  @Prop({ default: 0 }) readonly paneIndex: number;
  @Prop({ default: "p1" }) readonly context: string;
  @State("settings") settings: SettingState;
  @State("dictionary") dictionary: DictionaryState;

  private c1: Chart;

  private c2: Chart;

  private cMid: Chart;

  private surface: SurfaceTSData;

  private midMode: "midpoint";

  private type = "vimshottari";

  private grahaKey = "mo";

  private vargaNum = 1;

  private dashas: Array<DashaSpan> = [];

  private dashaSet: DashaSet = null;

  private maxDepth = 3;

  private balances: Array<any> = [];

  private showBalanceData = false;

  private grahaOpts = [
    "as",
    "su",
    "mo",
    "ma",
    "me",
    "ju",
    "ve",
    "sa",
    "ra",
    "ke",
  ];

  private systems = dashaSystemKeySets;

  dashaAspects = [];

  yearScale = 120;

  selectedChart = "c1";

  dashaPoint = -1;

  yearLength = 365.242199;

  refreshing = false;

  created() {
    this.c1 = deepClone(this.chart);
    if (this.context === "p3") {
      if (this.chart2 instanceof Chart) {
        this.c2 = deepClone(this.chart2);
        this.assignMidMode();
      }
    }
    this.build();
    bus.$on("dasha-span-item", (data) => {
      const graha = this.graha();
      const { trail, index, context } = data;
      if (index === this.paneIndex && context === this.context) {
        const spotDeg = nakshatraTrailToDegree(this.dashaSet, trail, graha);
        this.dashaPoint = spotDeg;
      }
    });
  }

  graha() {
    const graha = this.getRefChart().graha(this.grahaKey);
    graha.setAyanamshaItem(this.ayanamsha);
    graha.setVarga(this.vargaNum);
    return graha;
  }

  getRefChart() {
    const selected = this.context === "p3" ? this.selectedChart : "c1";
    switch (selected) {
      case "c2":
        return this.c2;
      case "timespace":
      case "midpoint":
        return this.cMid;
      default:
        return this.c1;
    }
  }

  get hasDashaPoint() {
    return this.dashaPoint >= 0;
  }

  build() {
    this.dashaAspects = [];
    this.getRefChart().setAyanamshaItem(this.ayanamsha);
    const dashaData = calcDashaSetByKey(
      this.type,
      this.graha(),
      this.getRefChart().jd,
      this.yearLength,
      this.yearScale
    );
    
    this.dashas = dashaData.dashas;
    this.dashaSet = dashaData.set;
    bus.$emit('dasha-set-built', {
      chartId: this.c1._id,
      ds: this.dashas,
      set: this.dashaSet
    })
    if (this.showBalanceData) {
      this.buildOverlay();
    }
  }

  buildOverlay() {
    this.calcDashaBalances();

    this.dashaAspects = mapDashaPointAspects(
      this.graha(),
      this.getRefChart(),
      this.type,
      this.yearLength
    );
  }

  calcDashaBalances() {
    this.balances = this.grahaOpts.map((key) => {
      const gr = this.getRefChart().graha(key);
      gr.setAyanamshaItem(this.ayanamsha);
      gr.setVarga(this.vargaNum);
      return calcDashaBalanceByKey(this.type, gr, this.getRefChart().jd);
    });
  }

  get hasC1() {
    return this.chart instanceof Chart && this.chart.grahas.length > 0;
  }

  get hasC2() {
    return this.chart2 instanceof Chart && this.chart2.grahas.length > 0;
  }

  get hasCMid() {
    return this.cMid instanceof Chart && this.chart2.grahas.length > 0;
  }

  get hasChartOptions() {
    return this.context === "p3" && this.chartOptions.length > 0;
  }

  get chartOptions() {
    const opts = [];
    if (this.context === "p3") {
      if (this.hasC1) {
        opts.push({
          key: "c1",
          name: this.c1.shortName,
        });
      }
      if (this.hasC2) {
        opts.push({
          key: "c2",
          name: this.c2.shortName,
        });
      }
      if (this.hasCMid) {
        opts.push({
          key: "midpoint",
          name: "Midpoint",
        });
        opts.push({
          key: "timespace",
          name: "Timespace",
        });
      }
    }
    return opts;
  }

  get outerClasses() {
    const cls = [];
    if (this.showBalanceData) {
      cls.push("show-balances");
    }
    if (this.hasChartOptions) {
      cls.push("show-chart-options");
    }
    return cls;
  }

  get hasBalances() {
    return this.balances.length > 0;
  }

  get dashaTree() {
    if (this.hasDashas && !this.refreshing) {
      return this.dashas.map((span, spanIndex) =>
        mapDashaItem(
          span,
          spanIndex,
          this.getRefChart().jd,
          this.dashaSet,
          1,
          this.maxDepth,
          this.getRefChart().tzOffset
        )
      );
    } else {
      return [];
    }
  }

  get grahaOptions() {
    return this.grahaOpts.map((key) => {
      const matchLex = ["as"].includes(key) === false;
      let name = key;
      if (matchLex) {
        const lex = this.dictionary.graha(key);
        if (lex) {
          name = capitalize(lex.text("en", "standard"));
        }
      } else {
        switch (key) {
          case "as":
            name = "Asc";
            break;
        }
      }
      return {
        key,
        name,
      };
    });
  }

  get systemOptions() {
    return this.systems.map((row) => mapDashaSystemOption(row, this.dictionary));
  }

  get hasDashas() {
    return this.dashas.length > 0;
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get yearScaleOptions() {
    const range = [...Array(20)].map((_, i) => i + 1);
    const nums1h = range.map((n) => n / 2);
    const nums1 = range
      .map((n) => n + 10)
      .filter((n) => nums1h.includes(n) === false);
    const nums2 = range
      .map((n) => n * 2 + 20)
      .filter((n) => nums1.includes(n) === false);
    const nums3 = range
      .map((n) => n + 10)
      .map((n) => n * 3)
      .filter((n) => nums2.indexOf(n) < 0);
    const nums4 = range
      .map((n) => n + 10)
      .map((n) => n * 4)
      .filter((n) => nums2.indexOf(n) < 0 && nums3.indexOf(n) < 0);
    const nums5 = range
      .map((n) => n + 8)
      .map((n) => n * 5)
      .filter(
        (n) =>
          nums2.indexOf(n) < 0 && nums3.indexOf(n) < 0 && nums4.indexOf(n) < 0
      );
    const nums = nums1h.concat(nums1, nums2, nums3, nums4, nums5);
    nums.push(128, 144, 150);
    nums.sort((a, b) => (a < b ? -1 : 1));
    return nums.map((n) => {
      return {
        key: n,
        name: n,
      };
    });
  }

  get title() {
    let text = "Dashas";
    const currRow = this.systems.find((sys) => sys.key === this.type);
    const menuKey = currRow instanceof Object ? currRow.dictKey : "08_01";
    const lex = this.dictionary.lexeme("aui", ["menu", menuKey].join("_"));
    if (lex) {
      text = lex.text("en");
      if (this.showShortTitle) {
        text = text.split(' ').shift();
      }
    }
    return text;
  }

  get showShortTitle() {
    switch (this.context) {
      case 'predictive':
        return true;
      default:
        return false;
    }
  }

  showBalances() {
    this.showBalanceData = !this.showBalanceData;
    if (this.showBalanceData) {
      if (this.dashaAspects.length < 1) {
        this.buildOverlay();
      }
    }
  }

  aspectClasses(key: string) {
    return ["aspect-type", "icon", ["icon", key].join("-")];
  }

  triggerRefresh() {
    this.refreshing = true;
    setTimeout(() => {
      this.refreshing = false;
    }, 250);
  }

  assignTimeSpace() {
    if (this.timespace instanceof Object) {
      this.cMid = fetchCurrentTimespace();
    }
  }

  assignMidMode(newVal = "-") {
    const refVal = notEmptyString(newVal, 4) ? newVal : this.midMode;
    switch (refVal) {
      case "timespace":
        this.assignTimeSpace();
        break;
      default:
        this.cMid = combineCharts(this.chart, this.chart2, this.ayanamsha);
        break;
    }
  }

  @Watch("selectedChart")
  changeMidMode(newVal) {
    switch (newVal) {
      case "timespace":
      case "midpoint":
        this.assignMidMode(newVal);
        break;
    }
    setTimeout(this.build, 250);
  }

  @Watch("yearScale")
  changeYearScale(newVal) {
    setTimeout(this.build, 250);
  }

  @Watch("maxDepth")
  changeMaxDepth() {
    this.build();
  }

  @Watch("grahaKey")
  changeGrahaKey() {
    this.build();
  }

  @Watch("type")
  changeType(newVal) {
    if (newVal) {
      const ds = fetchDashaSet(newVal, this.yearScale);
      this.yearScale = ds.years;
      setTimeout(this.build,250);
    }
  }

  @Watch("chart")
  changeChart(newVal) {
    if (newVal instanceof Chart) {
      this.c1 = deepClone(newVal);
      setTimeout(this.build,250);
    }
  }

  @Watch("chart2")
  changeChart2(newVal) {
    if (newVal instanceof Chart) {
      this.c2 = deepClone(newVal);
      setTimeout(this.build,250);
    }
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    this.c1.setAyanamshaItem(newVal);
    if (this.hasC2) {
      this.c2.setAyanamshaItem(newVal);
      if (this.hasCMid) {
        this.cMid.setAyanamshaItem(newVal);
      }
    }
    setTimeout(() => {
      this.build();
    }, 250);
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      this.build();
    }
    setWidgetOption(
      this.context,
      "DashaTree",
      this.paneIndex,
      "vargaNum",
      newVal
    );
  }
}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

.dasha-tree {
  &.show-chart-options {
    .info-pane {
      top: 3.5em;
    }
    .dasha-list {
      top: 3.25em;
    }
  }

  .controls {
    display: flex;
    flex-flow: column nowrap;
    background-color: white;
    > div {
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
    }

    padding: 0.25em 0;

    .field {
      .radio,
      .control {
        font-size: 0.75em;
      }
    }
    select option {
      text-transform: capitalize;
    }
    .chart-options {
      padding: 0.25em 0 0 0;
      margin: 0 0 0.25em 0;
    }
  }

  .selection {
    display: flex;
    padding: 0.25em 5%;
  }
  .info-trigger {
    position: absolute;
    bottom: 0.5em;
    right: 0.875em;
    cursor: pointer;
    transition: transform 0.5 ease-in-out;
    &:hover {
      color: $active-color;
    }
  }
  .info-pane {
    position: absolute;
    top: 2.25em;
    right: 0;
    left: 0;
    bottom: 0;
    background-color: white;
    opacity: 0;
    pointer-events: none;
  }

  &.show-balances {
    .info-pane {
      opacity: 1;
      overflow-y: auto;
      overflow-x: hidden;
      pointer-events: all;
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      ul {
        margin: 0.25em 0 1em 0;
        li {
          display: flex;
          flex-flow: row nowrap;
          .aspect {
            display: inline-block;
            .icon {
              width: 1em;
              height: 1em;
              margin-right: 0.125em;
            }
            margin: 0 0.25em 0 0;
          }
          .rashi {
            margin: 0 0.5em;
          }
          .dasha-point-graha {
            position: relative;
            transform: scale(1.25) translateY(10%);
            margin-right: 0.5em;
            &::before,
            &::after {
              position: absolute;
              width: 1em;
              height: 1em;
            }

            &::before {
              font-size: 0.5em;
              top: 0.5em;
              left: 0.5em;
            }
            &::after {
              font-family: icomoon;
              font-size: 1em;
              content: "\e941";
              top: 0;
              left: 0;
              color: $active-color;
            }
          }
        }
      }
    }

    .info-trigger {
      .icon i {
        transform: rotate(90deg);
      }
    }
  }
  .dasha-list {
    overflow-y: auto;
    overflow-x: hidden;
    position: absolute;
    padding: 1em 5%;
    top: 2em;
    left: 0;
    right: 0;
    bottom: 0;
    .dasha-items {
      list-style: none;
      margin: 0;
      padding: 0;
      li {
        position: relative;
        width: 100%;
        div.item {
          display: flex;
          flex-flow: row nowrap;
          > span,
          > div {
            cursor: pointer;
          }
        }
        &.depth-1 {
          .item {
            &.highlighted,
            &.is-expanded {
              .toggle,
              .icon {
                color: $red-label;
              }
            }
          }
        }
        &.depth-2 {
          .item {
            &.highlighted,
            &.is-expanded {
              .toggle,
              .icon {
                color: $blue-label;
              }
            }
          }
        }

        &.depth-3 {
          .item {
            &.highlighted,
            &.is-expanded {
              .toggle,
              .icon {
                color: $green-label;
              }
            }
          }
        }

        &.depth-4 {
          .item {
            &.highlighted,
            &.is-expanded {
              .toggle,
              .icon {
                color: $orange;
              }
            }
          }
        }

        &.depth-5 {
          .item.highlighted {
            .toggle,
            .icon {
              color: $purple;
            }
          }
        }

        span {
          display: inline-block;
        }
        span.date {
          margin: 0 1em;
          position: absolute;
          right: 0;
          top: 0;
        }
        span.icon {
          transition: transform 0.25s ease-in-out;
          &:hover {
            transform: scale(1.25);
          }
        }
        span.toggle {
          cursor: pointer;
          transition: transform 0.25s ease-in-out;
          &::before {
            position: relative;
            display: block;
            bottom: 0.0625em;
          }
          &.max-depth {
            &::before {
              content: "•";
              transform: scale(1.6667);
            }
            &:hover {
              transform: scale(1);
            }
          }

          &.is-expanded {
            &::before {
              content: "▼";
            }
          }
          &.is-contracted {
            &::before {
              content: "▶︎";
            }
          }
          &:hover {
            transform: scale(1.25);
          }
        }
        .children {
          max-height: 0;
          transition: max-height 0.75s ease-in;
          overflow: hidden;
          padding-left: 1em;
          li {
            transition: opacity 0.5s ease-in;
            opacity: 0;
          }
        }
        &.expanded > .children {
          max-height: none;
          opacity: 1;
          overflow: visible;
          li {
            opacity: 1;
          }
        }
        &.depth-1 {
          > .item > .toggle,
          > .item > .icon {
            color: $medium-grey;
          }
        }
        &.depth-2 {
          > .item > .toggle,
          > .item > .icon {
            color: rgba($medium-grey, 0.875);
          }
        }

        &.depth-3 {
          > .item > .toggle,
          > .item > .icon {
            color: rgba($medium-grey, 0.765625);
            cursor: pointer;
          }
        }
        &.depth-4 {
          > .item > .toggle,
          > .item > .icon {
            color: rgba($medium-grey, 0.669921875);
          }
        }
        &.depth-5 {
          > .item > .toggle,
          > .item > .icon {
            color: rgba($medium-grey, 0.586181640625);
          }
        }

        &.selected > .item {
          background-color: $yellow-translucent;
        }
      }
    }
  }
  .dasha-point {
    position: absolute;
    bottom: 0.25em;
    left: 30%;
    right: 30%;
    background-color: rgba(255, 255, 255, 0.5);
    text-align: center;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    padding: 0.25em;
    border-radius: 0.5em;
    .symbol {
      margin: 0 0.125em;
      transform: scale(0.75) translateY(15%);
    }
  }
}

</style>