<template>
  <grid-item
    class="graha-chart"
    :index="paneIndex"
    :chart="chart"
    :chart2="chart2"
    :class="outerClasses"
  >
    <h4>
      <slot name="title">{{ chartLabel }}</slot>
    </h4>
    <div :class="widgetClasses">
      <section
        class="chart"
        :class="wrapperClasses"
        ref="chart"
        :style="fontSizeStyle"
        @click="handleClick"
      >
        <chart-inner 
          v-if="hasInner" 
          :data="matchChartWidgetData(innerType, 'inner')"
          :mainAscendant="getMainAscendant()"
          :drishtiMatches="drishtiMatches"
          :refPoint="refPoint"
          :transitKeys="transitKeys"
        >
          <div
            class="mid-point"
            v-for="hb in houseBounds"
            :class="boundsClass(hb)"
            :key="['mid-', hb.num].join('-')"
            :style="hb.middle | absPosition"
          >{{ hb.num }}</div>
          <b-tooltip
            class="house-sign"
            v-for="house in getHouses()"
            :key="['house-sign-', house.num].join('-')"
            :class="houseDegToSignPosClass(house)"
            :label="houseDegToSignLabel(house)"
            type="is-info"
            size="is-small"
            :multilined="true"
            :active="showHouseTooltip"
          >
            <div :class="houseDegToSignClass(house)"></div>
          </b-tooltip>
        </chart-inner>
        <chart-inner 
          v-if="showFirstOuter"
          :data="matchChartWidgetData(this.firstOuterType, 'outer-1')"
          :mainAscendant="getMainAscendant()"
          :drishtiMatches="drishtiMatches"
          :transitKeys="transitKeys"
        />
        <chart-inner 
            v-if="showSecondOuter"
            :data="matchChartWidgetData('c2', 'outer-2')"
            :mainAscendant="getMainAscendant()"
            :drishtiMatches="drishtiMatches"
            :transitKeys="transitKeys"
          />
        <slot name="middle"></slot>
        <slot name="outer"></slot>
      </section>
      <slot name="bottom"></slot>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State, Action, Getter } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import ChartInner from "./ChartInner.vue";
import {
  subtractLng360,
  zeroPad
} from "../../api/converters";
import { Graha } from "../../api/models/Graha";
import { HouseBound, houseBoundItems } from "../../api/models/HouseBound";
import {
  House,
  XYPos,
  SurfaceTSData,
  AspectFracIndex
} from "../../api/interfaces";
import { isNumeric, notEmptyString } from "../../api/validators";
import {
  matchHouseDegToSignLabel, matchHouseSign,
} from "../../api/mappers";
import Degree from "../widgets/Degree.vue";
import GrahaDetails from "../widgets/GrahaDetails.vue";
import { bus } from "../../main";
import {
  WindowState,
  DictionaryState,
  SettingState
} from "../../store/types";
import {
  buildWHousesFromAscendant,
  deepClone,
} from "../../api/helpers";
import { Chart, combineCharts, 
  fetchCurrentTimespace,
  ChartWidgetData, } from "../../api/models/Chart";
import {
  setWidgetOption,
  syncOptions,
  fetchWidgetInstance
} from "../../store/local";
import { fetchSetting } from "../../api/methods";
const namespace = "window";

@Component({
  filters: {
    absPosition(xy: XYPos) {
      return `left: ${xy.x}%; top: ${xy.y}%;`;
    }
  },
  components: {
    Degree,
    GrahaDetails,
    ChartInner,
    GridItem
  }
})
export default class SingleChart extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: () => new Chart() }) readonly timespace: Chart;
  @Prop({ default: "single" }) readonly mode: string;
  @Prop({ default: "" }) readonly label: string;
  @Prop({ default: 1 }) readonly set: number;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "chart" }) context: string;
  @Prop({ default: 1 }) readonly order: number;
  @Prop({ default: "as" }) readonly refPoint: string;
  @Prop({ default: () => [] }) readonly transitKeys: string[];
  @State("window") window: WindowState;
  @State("dictionary") dictionary: DictionaryState;
  @Action("assignWindow", { namespace })
  assignWindow: any;
  @State("settings") settings: SettingState;

  c1: Chart;
  c2: Chart;
  cMid: Chart;
  surface: SurfaceTSData;
  width = 0;
  height = 0;
  size = 1;
  openBodyRef = {
    key: "",
    set: 1
  };
  positioned = false;

  maxHeight = 0;
  maxWidth = 0;
  vargaNum = 1;
  switching = false;
  drishtiMatches = new Map<string, Array<AspectFracIndex>>();
  aspectedHouses = [];
  singleMode = 1;
  midMode = "midpoint";
  timespaceMode = "median";
  isCurrent = false;
  chalitBhava = false;

  created() {
    this.cMid = new Chart(null);
    bus.$on("escape", this.reset);
    bus.$on("resize", this.gaugeHeight);
    bus.$on("enlarge", () => {
      setTimeout(() => {
        this.gaugeHeight();
      }, 250);
    });
    bus.$on("shrink", index => {
      if (index === this.paneIndex) {
        setTimeout(() => {
          this.gaugeHeight();
        }, 250);
      }
    });

    const cacheKey = "graha__drishti";
    const dmVals = this.$ls.get(cacheKey);
    if (dmVals instanceof Array && dmVals.length > 0) {
      this.assignDrishtiMatches(dmVals);
    } else {
      fetchSetting(cacheKey).then(data => {
        if (data.value instanceof Array && data.value.length > 0) {
          this.$ls.set(cacheKey, data.value);
          this.assignDrishtiMatches(data.value);
        }
      });
    }

    bus.$on(
      "manage-widgets",
      ({ name, context, index, vargaNum, set, chalitBhava }) => {
        if (name === "SingleChart" && this.context === context) {
          if (index === this.paneIndex) {
            if (set) {
              this.singleMode = set;
            }
            this.vargaNum = vargaNum;
            this.chalitBhava = chalitBhava === true;
          }
          setTimeout(() => {
            this.changeVarga(this.vargaNum);
          }, 250);
        }
        setTimeout(() => {
          const instance = fetchWidgetInstance(
            this.context,
            "SingleChart",
            this.paneIndex
          );
          if (instance instanceof Object) {
            const { vargaNum, chalitBhava } = instance;
            this.vargaNum = vargaNum;
            this.chalitBhava = chalitBhava === true;
            setTimeout(() => {
              this.changeVarga(this.vargaNum);
            }, 250);
          }
          this.initMid(true);
        }, 500);
      }
    );
    bus.$on("switch-pane", data => {
      if (data.context === this.context) {
        setTimeout(this.gaugeHeight, 250);
      }
    });
    this.sync();
    setTimeout(() => {
      this.initMid(true);
    }, 2000);
  }

  mounted() {
    if (this.isComposite) {
      this.switching = true;
      this.initMid(true);
    }
    setTimeout(this.gaugeHeight, 250);
    setTimeout(() => {
      let ts = 50;
      if (this.chart.subject.name) {
        this.isCurrent = /^current\b/i.test(this.chart.subject.name);
      }
      if (this.hasC2 && (this.set > 1 || this.context === "predictive")) {
        this.singleMode = this.set;
        ts = 200;
      }
      setTimeout(() => {
        this.positioned = this.c1.bodies.length > 0;
        this.changeVarga(this.vargaNum);
        window.dispatchEvent(new Event('resize'));
      }, ts);
    }, 200);
  }

  initMid(init = false) {
    if (this.isComposite) {
      if (this.midMode === "timespace") {
        if (this.timespace instanceof Object) {
          this.cMid = fetchCurrentTimespace();
        }
      } else {
        if (init) {
          this.triggerSwitch();
        }
        this.cMid = combineCharts(this.chart, this.chart2, this.ayanamsha);
      }
      this.cMid.setAyanamshaItem(this.ayanamsha);
      this.cMid.setVarga(this.vargaNum);
    }
  }

  sync() {
    this.c1 = deepClone(this.chart);
    this.c2 = deepClone(this.chart2);
    syncOptions(this, this.context, "SingleChart", this.paneIndex);
  }

  matchRefChart(type: string) {
    switch (type) {
      case 'c2':
        return this.c2;
      case 'cMid':
        return this.cMid;
      default:
        return this.c1;
    }
  }

  matchChartWidgetData(type: string, position = ""): ChartWidgetData {
    const posRef = type === "c2" && this.mode === "double_outer"? "outer-2" : position;
    return new ChartWidgetData(this.matchRefChart(type), posRef,
      type, this, this.ayanamsha);
  }

  gaugeHeight() {
    if (this.$refs.chart instanceof HTMLElement) {
      const { width, height } = this.$refs.chart.getBoundingClientRect();

      if (isNumeric(width) && width > 0) {
        this.width = width;
        this.height = height;
        const paneRect = this.$refs.chart.parentElement.parentElement.parentElement.getBoundingClientRect();

        this.maxHeight = this.window.height - paneRect.top;
        this.maxWidth = paneRect.width;
      }
    }
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get hasC1() {
    return this.chart instanceof Chart && this.chart.grahas.length > 0;
  }

  get hasC2() {
    return this.chart2 instanceof Chart && this.chart2.grahas.length > 0;
  }

  get innerType() {
    return this.hasComposite? "cMid" : "c1";
  }

  get firstOuterType() {
    return this.hasComposite? "c1" : "c2";
  }

  get hasInner() {
    return !this.switching && this.hasComposite
      ? this.cMid instanceof Chart && this.cMid.bodies.length > 0
      : this.hasC1;
  }

  get isComposite() {
    return this.mode === "midpoint_outer";
  }

  get isDouble() {
    switch (this.mode) {
      case "midpoint_outer":
      case "double":
      case "double_outer":
        return true;
      default:
        return false;
    }
  }

  get hasComposite() {
    return this.isComposite ? this.hasC2 : false;
  }

  get showFirstOuter() {
    return this.hasC2 && this.mode !== "single";
  }

  get showSecondOuter() {
    return this.hasComposite && this.cMid instanceof Chart;
  }

  get chartLabel() {
    return notEmptyString(this.label) ? this.label : this.vargaLabel;
  }

  get vargaLabel() {
    return this.dictionary.text(
      "aui",
      ["menu", "06", zeroPad(this.vargaNum)].join("_")
    );
  }

  get showHouseTooltip(): boolean {
    switch (this.context) {
      case "chart":
      case "predictive":
        return true;
      default:
        return false;
    }
  }

  get displayMode(): string {
    switch (this.context) {
      case "dasha-transit":
      case "predictive":
        return "predictive";
      default:
        return "comparative";
    }
  }

  get modeClass() {
    switch (this.mode) {
      case "midpoint_outer":
      case "double_outer":
        return "triple";
      default:
        if (notEmptyString(this.mode)) {
          return this.mode.replace(/_+/g, "-");
        } else {
          return this.hasC2? this.hasComposite? 'triple' : 'double' : 'single';
        }
    }
  }

  get modeRef() {
    if (notEmptyString(this.mode, 2)) {
      return this.mode;
    } else {
      return this.hasC2? this.hasComposite? 'midpoint_outer' : 'double' : 'single';
    }
  }

  get widgetClasses() {
    const wc = [this.modeClass, "chart"].join("-");
    const cls = [wc, "north-indian-chart", "widget"];
    if (this.mode === "single") {
      cls.push(["c", this.singleMode].join(""));
    }
    cls.push(this.displayMode);
    return cls;
  }

  getMainAscendant() {
    return this.hasComposite
      ? this.getAscendantMid().longitude
      : this.getRefGraha().longitude;
  }

  

  getRefGraha() {
    if (this.refPoint !== "as" && this.refPoint.length === 2) {
      return this.c1.graha(this.refPoint);
    } else {
      return this.getAscendant();
    }
  }

  get zoomLevel(): number {
    let z = 1;
    if (this.size > 1) {
      const maxW = this.maxWidth / this.width;
      const maxH = this.maxHeight / this.height;
      z = Math.min(maxW, maxH);
    }
    return z;
  }

  handleClick(e) {
    const incClasses = ["house-sign", "inner-frame"];
    if ([...e.target.classList].some(cl => incClasses.includes(cl))) {
      this.reset();
    }
  }

  reset() {
    this.openBodyRef = {
      key: "",
      set: 1
    };
    this.size = 1;
  }

  sizeClick(e) {
    this.size = this.size > 1 ? 1 : 2;
  }

  matchHouseSign(house: House) {
    return matchHouseSign(house, this.matchRefAsc(), this.chalitBhava);
  }

  houseDegToSignClass(house: House): string {
    return ["icon", this.matchHouseSign(house)].join("-");
  }

  houseDegToSignLabel(house: House): string {
    return matchHouseDegToSignLabel(house, this.matchRefAsc(), this.chalitBhava);
  }

  houseDegToSignPosClass(house: House): string {
    const { num } = house;
    const houseBound = this.houseBounds.find(hb => hb.num === num);
    let pos = "";
    if (houseBound) {
      pos = houseBound.pos;
    }
    return pos;
  }

  get sizeIcon(): string {
    return this.size > 1 ? "magnify-minus-outline" : "magnify-plus-outline";
  }

  get outerClasses(): Array<string> {
    const cls = [["context", this.context].join("-")];
    return cls;
  }

  get wrapperClasses(): Array<string> {
    const cls = ["chart-" + this.index];
    if (this.size > 1) {
      cls.push("enlarge");
    }
    if (this.positioned) {
      cls.push("positioned");
    }
    return cls;
  }

  getAscendant(refKey = "c1"): Graha {
    const refObj = ["c1","cMid","c2"].includes(refKey)? this[refKey] : this.c1;
    const asc = refObj.ascendantGraha;
    asc.setAyanamshaItem(this.ayanamsha);
    asc.setVarga(this.vargaNum);
    return asc;
  }



  buildGrahas(grahas: Array<Graha>) {
    grahas.forEach(gr => {
      gr.setAyanamshaItem(this.ayanamsha);
      gr.setVarga(this.vargaNum);
    });
    return grahas;
  }

  get compositeMode() {
    return this.hasComposite && this.cMid instanceof Chart;
  }

  getInnerChart() {
    return this.compositeMode ? this.cMid : this.c1;
  }

  getGrahas(): Array<Graha> {
    const emptyMode =
      this.compositeMode && (this.switching || this.cMid.bodies.length < 2);
    const refChart = this.compositeMode? this.cMid : this.c1;
    const grahas = emptyMode
      ? []
      : refChart.grahasAndAsc;
    return this.buildGrahas(grahas);
  }

  getAscendantMid(): Graha {
    const asc =
      this.timespaceMode === "median"
        ? this.cMid.ascendantGraha
        : this.cMid.surfaceAscendantGraha;
    asc.setAyanamshaItem(this.ayanamsha);
    asc.setVarga(this.vargaNum);
    return asc;
  }

  getGrahas2(): Array<Graha> {
    const refChart = this.hasComposite ? this.c1 : this.c2;
    return this.buildGrahas(refChart.grahasAndAsc);
  }

  getGrahas3(): Array<Graha> {
    return this.buildGrahas(this.c2.grahasAndAsc);
  }

  get fontSizeStyle(): string {
    const fs = this.width > 10 ? this.width / this.calcScaleDivisor() : 8;
    return `font-size:${fs}px;transform:scale(${this.zoomLevel});`;
  }

  get houseBounds(): Array<HouseBound> {
    return houseBoundItems();
  }

  calcScaleDivisor(): number {
    switch (this.modeRef) {
      case "midpoint_outer":
      case "double_outer":
        return 25;
      case "double":
        return 22.2222;
      default:
        return 13.3333;
    }
  }

  matchRefAsc() {
    const { value } = this.ayanamsha;
    return this.hasComposite &&
      this.cMid instanceof Chart &&
      this.cMid.bodies.length > 0
        ? subtractLng360(this.matchMidAscendant(), value)
        : this.getRefGraha().longitude;
  }

  getHouses(): Array<House> {
    const refLng = this.matchRefAsc();
    return this.switching
      ? []
      : buildWHousesFromAscendant(refLng, this.chalitBhava).map((lng, index) => {
          return {
            lng,
            num: index + 1
          };
        });
  }

  matchMidAscendant() {
    return this.midMode === "timespace" && this.timespaceMode === "surface"
      ? this.cMid.surface.ascendant
      : this.cMid.ascendant;
  }

  assignDrishtiMatches(dmVals: Array<any>) {
    const mp = new Map<string, Array<AspectFracIndex>>();
    dmVals.forEach(dm => {
      if (dm instanceof Object) {
        const { key, aspects } = dm;
        if (aspects instanceof Array) {
          const filteredAspects = aspects
            .map((frac, index) => {
              return { frac, index };
            })
            .filter(av => av.frac > 0);
          mp.set(key, filteredAspects);
        }
      }
    });
    this.drishtiMatches = mp;
  }

  boundsClass(hb: HouseBound) {
    const shape = hb.bounds.length < 4 ? "triangle" : "diamond";
    const aspect = this.aspectedHouses.find(
      av => parseInt(av.house) === hb.num
    );
    const cls = [shape, hb.pos, ["house", hb.num].join("-")];
    if (aspect) {
      cls.push("aspected", ["aspect", aspect.percent].join("-"));
    }
    return cls;
  }

  triggerSwitch() {
    this.switching = true;
    setTimeout(() => {
      this.switching = false;
      this.positioned = true;
    }, 25);
  }

  @Watch("chart")
  changeChart(newVal) {
    if (newVal instanceof Chart) {
      this.triggerSwitch();
      this.c1 = deepClone(newVal);
    }
  }

  @Watch("singleMode")
  changeSingleMode(newVal, prevVal) {
    if (newVal !== prevVal) {
      this.triggerSwitch();
      if (this.isDouble) {
        switch (newVal) {
          case 1:
            this.c1 = deepClone(this.chart);
            this.c2 = deepClone(this.chart2);
            break;
          case 2:
            this.c1 = deepClone(this.chart2);
            this.c2 = deepClone(this.chart);
            break;
        }
      } else {
        switch (newVal) {
          case 1:
            this.c1 = deepClone(this.chart);
            break;
          case 2:
            this.c1 = deepClone(this.chart2);
            break;
        }
      }
      setWidgetOption(
        this.context,
        "SingleChart",
        this.paneIndex,
        "set",
        newVal
      );
    }
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      const num = parseInt(newVal);
      this.triggerSwitch();
      this.c1.setVarga(num);
      this.getGrahas().forEach(gr => {
        gr.setVarga(num);
      });
      if (this.hasC2) {
        this.c2.setVarga(num);
        this.getGrahas2().forEach(gr => {
          gr.setVarga(num);
        });
      }
      setWidgetOption(
        this.context,
        "SingleChart",
        this.paneIndex,
        "vargaNum",
        newVal
      );
    }
  }

  @Watch("chalitBhava")
  changeChalitBhava(newVal) {
    if (isNumeric(newVal)) {
      setWidgetOption(
        this.context,
        "SingleChart",
        this.paneIndex,
        "chalitBhava",
        newVal
      );
    }
  }

  @Watch("chart2")
  changeChart2(newVal) {
    if (newVal instanceof Chart) {
      this.triggerSwitch();
      this.c2 = deepClone(newVal);
    }
  }

  @Watch("midMode")
  changeMidMode(newVal) {
    if (newVal) {
      this.triggerSwitch();
      this.initMid(false);
    }
  }

  @Watch("timespaceMode")
  changeTimespaceMode() {
    this.triggerSwitch();
    this.initMid(false);
  }
}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

#main .subpanes .graha-chart {
  .north-indian-chart {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    aspect-ratio: 1/1;
    .chart {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      height: 100%;
      width: 100%;
      aspect-ratio: 1/1;
      border: none;
      background-color: white;
      pointer-events: none;

      > .frame {
        > div,
        > span {
          pointer-events: all;
        }
      }
    }
  }

  .single-chart .chart {
    background-size: 201%;
  }

  .double-chart .chart {
    background-size: 150%;
  }

  .triple-chart .chart {
    background-size: 120%;
  }

  .north-indian-chart {
    width: 100%;
    position: relative;

    .middle-inner-frame,
    .outer-frame,
    .inner-frame {
      position: absolute;
      pointer-events: none;
      .house-sign,
      .graha-item {
        pointer-events: all;
      }
      .graha-item {
        font-size: 0.3333em;
      }
    }

    .inner-frame {
      overflow: hidden;
    }

    &.comparative {
      .inner-frame.c2 .graha-item .symbol,
      .outer-frame.c2 .graha-item .symbol,
      .outer-frame .graha-item .symbol {
        color: $red-label;
      }
      .inner-frame.c-mid .graha-item .symbol {
        color: $green;
      }
      .inner-frame.c-current .graha-item .symbol {
        color: $dark-color;
      }
  
      .outer-frame.c1 .graha-item .symbol,
      .inner-frame.c1 .graha-item .symbol,
      .inner-frame .graha-item .symbol {
        color: $blue-label;
      }
    }

    &.predictive {
      .graha-item {
        &.dasha-level-1 .symbol {
          color: $red-label;
        }
        &.dasha-level-2 .symbol {
          color: $blue-label;
        }
        &.dasha-level-3 .symbol {
          color: $green;
        }
      }
    }

    
  }

  .single-chart {
    .inner-frame {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }

  

  .double-chart {
    .inner-frame {
      top: 12.5%;
      left: 12.5%;
      right: 12.5%;
      bottom: 12.5%;
    } 
    
    .outer-frame {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;

      .graha-item {
        &.size-2 {
          margin: 0 0.625em;
          width: 1.5em;
          .degrees-dms {
            position: relative;
            left: -0.5em;
          }
        }
      }
    }
  }

  .triple-chart {
    .inner-frame {
      top: 20%;
      left: 20%;
      right: 20%;
      bottom: 20%;
    }

    .outer-frame {
      &.first {
        top: 10.5%;
        left: 10.5%;
        right: 10.5%;
        bottom: 10.5%;
        outline: solid 0.05em rgba($light-fg, 0.625);
        outline-offset: -1%;
      }

      &.second {
        top: 0;
        left: -2%;
        right: 0;
        bottom: 0;
      }

      .graha-item {
        &.size-2 {
          margin: 0 0.625em;
          width: 1.5em;
          .degrees-dms {
            position: relative;
            left: -0.5em;
          }
        }
      }
    }
  }

}

#main .subpanes .north-indian-chart {
   box-sizing: border-box;
   * {
     box-sizing: border-box;
   }
  .chart {
      max-width: 100%;
      position: relative;
      transition: transform 0.5s ease-in-out;
      height: 90vw;
      width: 90vw;
      @media (min-width: $min-tablet-width) {
        height: 45vw;
        width: 45vw;
        &.chart-0 {
          transform-origin: 0 0;
        }
        &.enlarge {
          transform: scale(2);
        }
      }
      @media (min-width: $min-standard-width) {
        height: 30vw;
        width: 30vw;
        &.enlarge {
          transform: scale(3);
        }
      }
      background-image: url("/img/drawings/vedic-chart.svg");
      background-repeat: no-repeat;
      background-position: center center;
      background-size: 200%;
      border: solid 1px $dark-color;

      .chart-controls {
        font-size: 1rem;
        position: absolute;
        right: 1%;
        top: 0;
        opacity: 0;
        z-index: 200;
        cursor: pointer;
        &:hover {
          opacity: 1;
        }
        transition: opacity 0.25s ease-in-out;
        display: flex;
        flex-flow: column nowrap;
        > span {
          display: inline-block;
          margin-bottom: 0.5em;
        }
      }

      .house-sign,
      .graha-item,
      .mid-point {
        position: absolute;
        display: flex;
        justify-content: center;
        flex-flow: row nowrap;
      }
      .mid-point {
        color: $light-fg;
        width: 35.3553390593274%;
        height: 35.3553390593274%;
        /* padding: 0.25em; */
        /* border: solid 1px $light-fg; */
        /* border-radius: 1em; */
        margin-left: -17.6776695296637%;
        margin-top: -17.6776695296637%;
        opacity: 1;
        color: transparent;
        transition: opacity 1s ease-in-out;
        pointer-events: none;
        user-select: none;
        &::after {
          content: " ";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
        }
        &.diamond::after {
          transform: rotate(45deg);
        }
        &.aspected {
          &::before {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 2em;
            text-align: center;
            height: 1em;
            margin-top: -0.5em;
            margin-left: -1em;
          }

          &.left-bottom::before,
          &.left-top::before {
            left: 72.5%;
          }
          &.top-right::before,
          &.top-left::before {
            top: 75%;
          }

          &.right-bottom::before,
          &.right-top::before {
            left: 27.5%;
          }

          &.mid-left::before {
            left: 87.5%;
          }

          &.mid-right::before {
            left: 12.5%;
          }

          &.mid-top::before {
            top: 87.5%;
          }

          &.mid-bottom::before {
            top: 12.5%;
          }

          &.bottom-right::before,
          &.bottom-left::before {
            top: 25%;
          }
        }
        &::before {
          color: $medium-grey;
          font-size: 0.25em;
        }
        &.aspect-100::before {
          content: "100%";
        }
        &.aspect-75::before {
          content: "75%";
        }
        &.aspect-50::before {
          content: "50%";
        }
        &.aspect-25::before {
          content: "25%";
        }
        &.aspect-100::after {
          background-color: rgba($red-label, 0.3);
        }
        &.aspect-75::after {
          background-color: rgba($red-label, 0.225);
        }
        &.aspect-50::after {
          background-color: rgba($red-label, 0.15);
        }
        &.aspect-25::after {
          background-color: rgba($red-label, 0.075);
        }
        &.triangle {
          &.left-bottom::after,
          &.left-top::after {
            transform: rotate(45deg) translate(-16.6666667%, 16.666667%);
          }
          &.top-left::after {
            transform: rotate(45deg) translate(-16.6666667%, -16.666667%);
          }
          &.right-top::after {
            transform: rotate(45deg) translate(16.6666667%, -16.666667%);
          }
          &.top-right::after {
            transform: rotate(45deg) translate(-16.6666667%, -16.666667%);
          }
          &.bottom-left::after {
            transform: rotate(45deg) translate(16.6666667%, 16.666667%);
          }

          &.right-bottom::after {
            transform: rotate(45deg) translate(16.6666667%, -16.666667%);
          }
          &.bottom-right::after {
            transform: rotate(45deg) translate(16.6666667%, 16.666667%);
          }
        }
      }

      &.enlarge .mid-point {
        opacity: 0.25;
      }

      .house-sign {
        display: block;
        margin-left: -0.5em;
        margin-top: -0.5em;
        font-size: 0.4166667em;
        transition: opacity 0.5s ease-in-out;
        width: 1em;
        height: 1em;
        &.mid-top {
          top: 45%;
          left: 50%;
        }
        &.mid-left {
          top: 50%;
          left: 45%;
        }
        &.mid-bottom {
          top: 55%;
          left: 50%;
        }
        &.mid-right {
          top: 50%;
          left: 55%;
        }
        &.top-right {
          top: 21%;
          left: 75%;
        }
        &.top-left {
          top: 21%;
          left: 25%;
        }
        &.right-top {
          top: 25%;
          left: 79%;
        }
        &.left-top {
          top: 25%;
          left: 21%;
        }
        &.bottom-right {
          top: 79%;
          left: 75%;
        }
        &.bottom-left {
          top: 79%;
          left: 25%;
        }
        &.right-bottom {
          top: 75%;
          left: 79%;
        }
        &.left-bottom {
          top: 75%;
          left: 21%;
        }
      }

      .house-sign,
      .graha-item {
        opacity: 0;
      }

      .graha-item {
        transition: all 0.5s ease-in-out;
        .trigger {
          position: relative;
          display: flex;
          flex-flow: row nowrap;
          max-width: 1em;
          max-height: 1em;
          overflow: visible;
          cursor: pointer;
          user-select: none;
          > span {
            display: block;
          }
          .value {
            margin-top: -0.5em;
            margin-left: 1em;
            font-size: 1.25em;
            white-space: nowrap;
            @media (min-width: $min-standard-width) {
              font-size: 1.125em;
            }
            &.degrees-dms {
              display: inline-flex;
              flex-flow: column nowrap;
              justify-content: flex-start;
              line-height: 1.125em;
            }
            .minutes {
              font-size: 0.75em;
            }
          }
        }

        &.mid-left,
        &.mid-right,
        &.mid-bottom,
        &.mid-top {
          margin-left: -2em;
        }

        &.right-top,
        &.right-bottom,
        &.left-top,
        &.left-bottom {
          margin-left: -2em;
        }

        &.top-left,
        &.top-right {
          margin-top: -1.75em;
        }

        &.size-3 .value {
          margin-left: 0.875em;
        }
        &.size-4 .value,
        &.size-5 .value,
        &.size-6 .value {
          margin-left: 0.75em;
        }

        &.value-below {
          .trigger {
            flex-flow: column nowrap;
            .value {
              margin-top: 1em;
              margin-left: -1em;
              width: 3em;
              text-align: center;
            }
          }

          &.size-3 .value {
            margin-top: 0.5em;
          }
          &.size-4 .value,
          &.size-5 .value,
          &.size-6 .value {
            margin-top: 0.25em;
          }
        }

        .info {
          opacity: 0;
          pointer-events: none;
          position: absolute;
          h2 {
            color: $active-color;
            font-size: 1.25em;
          }
        }
        &.open {
          z-index: 100;
          .info {
            opacity: 1;
            pointer-events: all;
            top: 2em;
            left: -1em;
            width: 18em;
            text-align: left;
            background-color: white;
            padding: 0.5em;
            border: solid 1px $light-fg;
            border-radius: 0.5em;
            @media (min-width: $min-tablet-width) {
              font-size: 1.25em;
            }
            @media (min-width: $min-standard-width) {
              font-size: 1.5em;
            }
            p {
              margin: 0;
              display: flex;
              flex-flow: row nowrap;
              .value,
              span.text {
                display: inline-block;
              }
              span {
                &.text {
                  width: 8em;
                  margin-right: 0.25em;
                  font-style: italic;
                  text-align: right;
                  &::after {
                    content: ":";
                  }
                }
              }
              .value {
                margin-right: 0.5em;
                &:last-child {
                  margin-right: 0;
                }
              }
              .value {
                max-width: 8em;
                > span {
                  display: inline-flex;
                }
              }
            }
          }
          &.right-top,
          &.top-right,
          &.right-bottom,
          &.bottom-right,
          &.mid-right {
            .info {
              left: auto;
              right: -1em;
            }
          }

          &.right-bottom,
          &.bottom-right,
          &.mid-bottom,
          &.bottom-left,
          &.left-bottom {
            .info {
              top: auto;
              bottom: 2em;
            }
          }
        }
      }
      &.positioned {
        .house-sign,
        .graha-item {
          opacity: 1;
        }
      }
      .outer-frame {
        .vertical {
          margin-left: -0.75em;
        }
        .right-to-left {
          margin-top: -0.5em;
        }
        .left-to-right {
          margin-top: -0.125em;
        }
      }
    }

}

</style>