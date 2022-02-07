c2<template>
  <grid-item class="shula-chakra" :index="paneIndex" :chart="chart">
    <h4>
      <slot name="title">{{ title }}</slot>
    </h4>
    <div class="shula-chakra-chart widget" :class="wrapperClasses" ref="chart">
      <div class="inner cell-grid">
          <div
          class="cell"
          v-for="cell in cells"
          :key="cell.key"
          :class="cell.classNames"
          :title="cell.title"
        >
          {{cell.short}}
        </div>
        <div class="grahas">
          <i
            v-for="item in grahaItems"
            :key="item.key"
            :class="item.classNames"
            :title="item.graha.longitude | toDMS0"
          ></i>
        </div>
      </div>
      <div class="bg-over"></div>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import { Graha } from "../../api/models/Graha";
import nakshatraValues from "../../api/mappings/nakshatra-values";
import {
  GrahaItem,
  Nak28Cell,
} from "../../api/interfaces";
import { isNumeric } from "../../api/validators";
import { FilterSet } from "../../api/composables/FilterSet";
import Degree from "../widgets/Degree.vue";
import { DictionaryState, SettingState, WindowState } from "../../store/types";
import {
  applyDashaTransitClasses,
  deepClone,
  matchNakshatra28,
  matchNakshatra28Item,
} from "../../api/helpers";
import { Chart, applyAyanamsha } from "../../api/models/Chart";
import { bus } from "@/main";

@Component({
  filters: FilterSet,
  components: {
    Degree,
    GridItem,
  },
})
export default class ShulaCakra extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "p2" }) context: string;
  @Prop({ default: 1 }) readonly order: number;
  @Prop({ default: () => [] }) readonly transitKeys: string[];
  @State("dictionary") dictionary: DictionaryState;
  @State("settings") settings: SettingState;
  @State("window") window: WindowState;

  vargaNum = 1;

  private c1: Chart;
  private c2: Chart;

  private grahaItems: GrahaItem[] = [];

  private cells: Array<Nak28Cell> = [];

  private sizeByHeight = false;

  private transitOn = true;

  private sunOffset = 0;

  created() {
    if (this.chart instanceof Chart) {
      this.c1 = deepClone(this.chart);
    }

    if (this.chart2 instanceof Chart) {
      this.c2 = deepClone(this.chart2);
    }
    this.gaugeHeight();
    bus.$on("resize", this.gaugeHeight);
    this.sync();
  }

  mounted() {
    setTimeout(() => {
      if (this.ayanamsha.num > 0) {
        this.changeAyanamsha(this.ayanamsha);
      }
    }, 500);
  }

  sync() {
    this.calcSunOffset();
    setTimeout(() => {
      this.buildCells();
      this.buildGrahas();
    }, 125);
  }

  gaugeHeight() {
    if (this.$refs.chart instanceof HTMLElement) {
      const { width } = this.$refs.chart.getBoundingClientRect();
      if (isNumeric(width) && width > 0) {
        this.sizeByHeight = this.window.width / width > 2.05;
      }
    }
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get coreBodies() {
    return ["as", "su", "mo", "ma", "ju", "sa", "ve", "me", "ke", "ra"];
  }

  get hasC2() {
    return this.c2 instanceof Chart && this.c2.bodies.length > 0;
  }

  get hasBirthChart() {
    return this.c1 instanceof Chart && this.c1.grahas.length;
  }

  calcSunOffset() {
    this.sunOffset = this.hasBirthChart? this.c1.sun.nakshatra28 - 1 : 0;
  }

  buildGrahas() {
    const bodies = this.c2.bodies;
    const ascendant = this.c2.ascendantGraha;
    bodies.forEach((gr) => gr.setAyanamshaItem(this.ayanamsha));
    ascendant.setAyanamshaItem(this.ayanamsha);
    const grahas = [
      ...bodies.filter((gr) => this.coreBodies.includes(gr.key)),
      ascendant,
    ];
    this.grahaItems = grahas.map((graha, index) => this.toGrahaItem(graha, index, grahas));
  }

  get title() {
    return this.dictionary.text("chakra", "sbc_0");
  }

  get numNaks() {
    return 28;
  }

  get cellIndices() {
    const nums = Array.from(Array(this.numNaks).keys());
    return nums.map(n => ((n + this.numNaks) % this.numNaks) + 1);
  }

  buildGrahaClasses(body: Graha, cellNum = 1, numInNak = 1,nakIndex = 0) {
    const mid = (numInNak + 1) / 2;
    const offset = (mid - nakIndex - 1) * 2;
    const cls = [
        "symbol",
        "icon",
        ["num-in-nak", numInNak].join("-"),
        ["icon", body.key].join("-"),
        ["pos", cellNum].join("-"),
      ];
      if (offset !== 0) {
        const offsetDir = offset < 0? "minus" : "plus";
        cls.push([offsetDir, Math.abs(offset)].join("-"));
      }
      applyDashaTransitClasses(this.transitKeys, body, cls);
      return cls;
  }

  buildCells() {
    this.cells = [];
    const nks1 = this.buildNakshatraItems();
    this.cellIndices.forEach((num) => {
      let title = "";
      const key = ["cell", num].join("-");
      const classNames = [key];
      const nak = nks1.find((nk) => nk.classNames.includes(key));
      const hasNak = nak instanceof Object;
      let long = "";
      let short = "";
      if (hasNak) {
        nak.classNames.forEach((cl) => {
          if (!classNames.includes(cl)) {
            classNames.push(cl);
          }
        });
        title = nak.title;
        classNames.push("nakshatra-cell");
        long = nak.long;
        short = nak.short;
      }
      this.cells.push({
        num,
        long,
        short,
        classNames,
        key,
        title,
      });
    });
  }

  toGrahaItem(graha: Graha, index = 0, grahas: Graha[] = []): GrahaItem {
    const key = ["graha", graha.key, index].join("-");
    const grahasInNak = grahas.filter(gr => gr.nakshatra28 === graha.nakshatra28);
    const numInNak = grahasInNak.length;
    const nakIndex = grahasInNak.findIndex(gr => gr.key === graha.key);
    const cellNum = this.calcCellNum(graha.nakshatra28);
    const setNum = this.matchSet(cellNum);
    const classNames = this.buildGrahaClasses(graha, cellNum, numInNak, nakIndex);
    return { graha, set: setNum, key, classNames };
  }

  matchSet(nakNum = 1) {
    const num = nakNum === 28? 1 : nakNum + 1;
    const quarter = Math.ceil(num / 7);
    const qi = (num - 1) % 7;
    return qi < 3? quarter : [3, 6].includes(qi)? 5 : 6;
  }

  buildNakshatraItems() {
    return nakshatraValues
      .map((nk, index) => {
        const { num, ref, itemKey, dictKey } = matchNakshatra28(index);
        let long = ref;
        let short = ref;
        const lex = this.dictionary.lexeme("nakshatra", dictKey);
        
        if (lex) {
          long = lex.text("sa", "default");
          short = lex.text("sa","short");
        }
        const nkItem = matchNakshatra28Item(nakshatraValues, num, itemKey);
        const cellNum = this.calcCellNum(num);
        if (nkItem) {
          const abhjitClass =
            num < 22 ? "before" : num === 22 ? "abhjit" : "after";
          const itemClass = itemKey.replace(/_+/g, "-");
          const title = num + ": " + long;
          const placeClass = ["cell", cellNum].join("-");
          const classNames = [
            itemKey.replace(/_/g, "-"),
            abhjitClass,
            itemClass,
            placeClass
          ];
          return {
            ...nkItem,
            short,
            long,
            classNames,
            title,
          };
        }
      })
      .filter((nkItem) => nkItem instanceof Object);
  }

  calcCellNum(num = 1) {
    return ((num - 1 - this.sunOffset + this.numNaks) % this.numNaks) + 1;
  }

  get wrapperClasses() {
    const cls = [['layout', this.context].join('-')];
    switch (this.context) {
      case 'predictive':
        cls.push('predictive');
        break;
      default:
        cls.push('comparative');
        break;
    }
    if (this.sizeByHeight) {
      cls.push('size-by-height');
    }
    return cls;
  }

  @Watch("chart")
  changeChart(newVal) {
    if (newVal instanceof Chart) {
      this.c1 = deepClone(newVal);
    }
  }

  @Watch("chart2")
  changeChart2(newVal) {
    if (newVal instanceof Chart) {
      this.c2 = deepClone(newVal);
      this.sync();
    }
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    if (this.c1 instanceof Chart) {
      this.c1.bodies.forEach((gr) => {
        gr.setAyanamshaItem(newVal);
      });
    }
    if (this.c2 instanceof Chart) {
      applyAyanamsha(this.c2, this.c2.bodies, newVal);
    }
    setTimeout(() => {
      this.sync();
    }, 125);
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      const num = parseInt(newVal);
      this.c1.setVarga(num);
      this.c1.bodies.forEach((gr) => {
        gr.setVarga(num);
      });
      this.c2.setVarga(num);
      this.c2.bodies.forEach((gr) => {
        gr.setVarga(num);
      });
      setTimeout(() => {
        this.sync();
      }, 125);
    }
  }
}
</script>
<style lang="scss" scoped>
.shula-chakra-chart {
  display: flex;
  justify-content: center;
  align-items: center;

  .grahas .icon,
  .cell {
    position: absolute;
    transition: all 0.5s ease-in-out;
  }

  .grahas,
  .cell-grid {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 3;
  }

  .cell {
    font-size: 0.625vw;
    width: 3em;
    height: 1em;
    margin-left: -1.5em;
    z-index: 5;
    text-align: center;
  }

  .grahas .icon {
    font-size: 0.75vw;
    height: 1em;
    width: 1em;
    margin-left: -0.5em;
    padding-top: 0.5em;
    &.minus-1::before {
      margin-left: -1em;
    }
    &.minus-2::before {
      margin-left: -2em;
    }
    &.minus-3::before {
      margin-left: -3em;
    }
    &.plus-1::before {
      margin-left: 1em;
    }
    &.plus-2::before {
      margin-left: 2em;
    }
    &.plus-3::before {
      margin-left: 3em;
    }
  }

  
  .cell-1 {
    bottom: 4.5%;
  }
  .pos-1 {
    bottom: 0.75%;
  }
  .pos-2,
  .pos-28,
  .cell-28,
  .cell-2 {
    bottom: 9.25%;
  }

  .cell-16,
  .cell-2 {
    left: 60%;
  }

  .pos-16 {
    left: 59%;
  }
  .pos-2 {
    left: 72%;
  }
  
  .cell-14,
  .cell-28 {
    left: 40%;
  }

  .pos-14 {
    left: 41%;
  }
  .pos-28 {
    left: 28%;
  }

  .pos-3,
  .pos-27,
  .cell-3,
  .cell-27 {
    bottom: 16.25%;
  }

  .cell-4,
  .cell-3 {
    left: 58%;
  }
  .pos-4,
  .pos-3 {
    left: 68%;
  }
  .cell-26,
  .cell-27 {
    left: 42%;
  }
  .pos-26,
  .pos-27 {
    left: 32%;
  }
  .pos-4,
  .pos-26,
  .cell-4,
  .cell-26 {
    bottom: 22.75%;
  }


  .pos-18,
  .pos-5,
  .pos-7 {
    left: 42%;
  }

  .pos-17,
  .pos-19,
  .pos-6 {
    left: 58%;
  }

  .cell-1,
  .pos-1,
  .pos-15,
  .cell-15,
  .cell-17,
  .cell-18,
  .cell-19,
  .cell-5,
  .cell-6,
  .cell-7 {
    left: 50%;
  }

  .pos-15 {
    top: 0.5%;
  }

  .pos-5,
  .cell-5 {
    bottom: 30.25%;
  }

  .pos-6,
  .cell-6 {
    bottom: 37.75%;
  }

  .pos-7,
  .cell-7 {
    bottom: 45%;
  }

  .cell-22,
  .cell-20,
  .cell-10,
  .cell-8 {
    top: 18.5%;
  }

  .pos-22,
  .pos-20,
  .pos-10,
  .pos-8 {
    top: 13.75%;
  }

  .pos-8,
  .cell-8 {
    left: 34%;
  }

  
  .cell-21,
  .cell-9 {
    top: 16%;
  }

  .pos-21,
  .pos-9 {
    top: 4%;
  }

  .pos-9,
  .cell-9 {
    left: 22.75%;
  }

  .pos-10,
  .cell-10 {
    left: 10.5%;
  }

  .pos-20,
  .cell-20 {
    left: 65.25%;
  }

  .cell-21 {
    left: 77.25%;
  }

  .pos-22,
  .cell-22 {
    left: 89%;
  }

  .pos-13,
  .pos-25,
  .cell-13,
  .cell-25 {
    top: 40.75%;
  }

  .cell-13 {
    left: 33%;
  }

  .pos-13 {
    left: 23%;
  }

  .pos-25 {
    left: 77%;
  }

  .pos-19,
  .cell-19 {
    top: 35.5%;
  }

  .pos-12,
  .pos-24,
  .cell-12,
  .cell-24 {
    top: 33.25%;
  }

  .cell-12 {
    left: 27%;
  }

  .cell-24 {
    left: 73%;
  }

  .pos-12 {
    left: 17%;
  }

  .pos-24 {
    left: 83%;
  }

  .pos-11,
  .pos-23,
  .cell-11,
  .cell-23 {
    top: 25.75%;
  }

  .cell-11 {
    left: 24%;
  }

  .cell-23 {
    left: 77%;
  }

  .pos-23 {
    left: 88%;
  }

  .pos-11 {
    left: 12%;
  }

  .pos-18,
  .cell-18 {
    top: 28.5%;
  }

  .cell-17 {
    top: 21.25%;
  }

  .cell-15 {
    top: 11.5%;
  }

  .pos-25,
  .cell-25 {
    left: 67%;
  }

  .cell-19 {
    top: 35.5%;
  }

  .cell-14,
  .cell-16 {
    top: 8.5%;
  }

  .pos-14,
  .pos-16 {
    top: 3%;
  }

  > .bg-over {
    position: absolute;
    top: 2%;
    left: 0;
    right: 0;
    bottom: -2%;
    background-image: url("/img/drawings/chakra-shula.svg");
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 88%;
    pointer-events: none;
    z-index: 1;
  }
}

</style>