c2<template>
  <grid-item class="candra-kalanala-cakra" :index="paneIndex" :chart="chart">
    <h4>
      <slot name="title">{{ title }}</slot>
    </h4>
    <div class="candra-kalanala-cakra-chart widget" :class="wrapperClasses" ref="chart">
      <div class="inner cell-grid">
          <div
          class="cell"
          v-for="cell in cells"
          :key="cell.key"
          :class="cell.classNames"
          :title="cell.title"
        >
          <h5>{{cell.short}}</h5>
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
import { State, Action, Getter } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import { Graha } from "../../api/models/Graha";
import nakshatraValues from "../../api/mappings/nakshatra-values";
import {
  Cell,
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
export default class CandraKalanalaCakra extends Vue {
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

  private moonOffset = 0;

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
    this.calcMoonOffset();
    setTimeout(() => {
      this.buildCells();
      this.buildGrahas();
    }, 125);
  }

  gaugeHeight() {
    if (this.$refs.chart instanceof HTMLElement) {
      const { width, height } = this.$refs.chart.getBoundingClientRect();
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

  get hasTransitChart() {
    return this.c2 instanceof Chart && this.c2.grahas.length && this.transitOn;
  }

  calcMoonOffset() {
    this.moonOffset = this.hasTransitChart? this.c2.moon.nakshatra28 - 1 : 0;
  }

  buildGrahas() {
    const bodies = this.c1.bodies;
    const ascendant = this.c1.ascendantGraha;
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

  buildGrahaClasses(body: Graha, cellNum = 1, setNum = 1, numInNak = 1,nakIndex = 0) {
    const mid = (numInNak + 1) / 2;
    const offset = (mid - nakIndex - 1) * 2;
    const cls = [
        "symbol",
        "icon",
        ["num-in-nak", numInNak].join("-"),
        ["icon", body.key].join("-"),
        ["group", setNum].join("-"),
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
    const classNames = this.buildGrahaClasses(graha, cellNum, setNum, numInNak, nakIndex);
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
        const setNum = this.matchSet(cellNum);
        if (nkItem) {
          const abhjitClass =
            num < 22 ? "before" : num === 22 ? "abhjit" : "after";
          const itemClass = itemKey.replace(/_+/g, "-");
          const title = num + ": " + long;
          const placeClass = ["cell", cellNum].join("-");
          const groupClass = ["group", setNum].join("-");
          const classNames = [
            itemKey.replace(/_/g, "-"),
            abhjitClass,
            itemClass,
            placeClass,
            groupClass
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
    return ((num - 1 - this.moonOffset + this.numNaks) % this.numNaks) + 1;
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
.candra-kalanala-cakra-chart {
  .grahas {
    .icon {
      position: absolute;
      width: 1em;
      height: 1em;
      margin-left: -0.5em;
      margin-top: -0.5em;
      font-size: 1.5vw;
      transition: all 0.5s ease-in-out;
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

    .num-in-nak-2::before {
      font-size: 0.8em;
    }

    .num-in-nak-3::before {
      font-size: 0.7em;
    }

    .num-in-nak-4::before {
      font-size: 0.6em;
    }

    .group-5,
    .group-6 {
      top: 50%;
      left: 50%;
    }

    .group-5 {
      &.pos-3 {
        transform: rotate(22.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-22.5deg);
        }
      }
      &.pos-6 {
        transform: rotate(67.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-67.5deg);
        }
      }
      &.pos-10 {
        transform: rotate(112.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-112.5deg);
        }
      }
      &.pos-13 {
        transform: rotate(157.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-157.5deg);
        }
      }
      &.pos-17 {
        transform: rotate(202.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-202.5deg);
        }
      }
      &.pos-20 {
        transform: rotate(247.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-247.5deg);
        }
      }
      &.pos-24 {
        transform: rotate(292.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-292.5deg);
        }
      }
      &.pos-27 {
        transform: rotate(337.5deg) translate(0, -6em);
        &::before {
          transform: rotate(-337.5deg);
        }
      }
    }

    .group-6 {
      &.pos-4 {
        transform: rotate(22.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-22.5deg);
        }
      }
      &.pos-5 {
        transform: rotate(67.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-67.5deg);
        }
      }

      &.pos-11 {
        transform: rotate(112.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-112.5deg);
        }
      }
      &.pos-12 {
        transform: rotate(157.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-157.5deg);
        }
      }

      &.pos-18 {
        transform: rotate(202.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-202.5deg);
        }
      }
      &.pos-19 {
        transform: rotate(247.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-247.5deg);
        }
      }

      &.pos-25 {
        transform: rotate(292.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-292.5deg);
        }
      }
      &.pos-26 {
        transform: rotate(337.5deg) translate(0, -300%);
        &::before {
          transform: rotate(-337.5deg);
        }
      }

    }

    .group-1 {
      top: 6%;
      &.pos-28 {
        left: 40%;
      }

      &.pos-1 {
        left: 50%;
      }

      &.pos-2 {
        left: 60%;
      }
    }

    .group-2 {
      right: 3%;
      &.pos-7 {
        top: 40%;
      }

      &.pos-8 {
        top: 50%;
      }

      &.pos-9 {
        top: 60%;
      }
    }
    .group-3 {
      bottom: 2%;
      &.pos-16 {
        left: 40%;
      }

      &.pos-15 {
        left: 50%;
      }

      &.pos-14 {
        left: 62%;
      }
    }

    .group-4 {
      left: 3%;
      &.pos-23 {
        top: 40%;
      }

      &.pos-22 {
        top: 50%;
      }

      &.pos-21 {
        top: 60%;
      }
    }
  }

  .cell {
    font-size: 1.5vw;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: -2em;
    width: 4em;
    transition: all 0.5s ease-in-out;
    h5 {
      font-size: 0.625em;
    }

    &.group-1 {
      top: 8.5%;
    }

    &.cell-16,
    &.cell-28 {
      left: 38%;
    }

    &.cell-15,
    &.cell-1 {
      left: 50%;
    }

    &.cell-14,
    &.cell-2 {
      left: 62%;
    }

    &.cell-3 {
      h5 {
        transform: rotate(22.5deg);
      }
      left: 56%;
      top: 32%;
    }

    &.cell-4 {
      transform: rotate(-67.5deg);
      left: 51.5%;
      top: 42.5%;
    }

    &.cell-5 {
      transform: rotate(-22.5deg);
      left: 54.5%;
      top: 46%;
    }

    &.cell-6 {
      h5 {
        transform: rotate(67.5deg);
      }
      left: 66%;
      top: 42%;
    }

    &.group-2 {
      right: 2.5%;
    }

    &.cell-23,
    &.cell-7 {
      top: 37%;
    }

    &.cell-22,
    &.cell-8 {
      top: 48.25%;
    }

    &.cell-21,
    &.cell-9 {
      top: 60%;
    }

    &.cell-10 {
      transform: rotate(-67.5deg);
      left: 66%;
      top: 54.5%;
    }

    &.cell-11 {
      transform: rotate(22.5deg);
      left: 55%;
      top: 50.5%;
    }

    &.cell-12 {
      transform: rotate(67.5deg);
      left: 52%;
      top: 53%;
    }

    &.cell-13 {
      transform: rotate(-22.5deg);
      left: 57%;
      top: 65%;
    }

    &.cell-17 {
      transform: rotate(22.5deg);
      left: 41.5%;
      top: 65%;
    }

    &.cell-18 {
      transform: rotate(-67.5deg);
      left: 47.5%;
      top: 52.5%;
    }

    &.cell-19 {
      transform: rotate(-22.5deg);
      left: 45%;
      top: 50.75%;
    }

    &.cell-20 {
      transform: rotate(67.5deg);
      left: 32%;
      top: 56%;
    }

    &.cell-24 {
      transform: rotate(-67.5deg);
      left: 32%;
      top: 42%;
    }

    &.cell-25 {
      transform: rotate(22.5deg);
      left: 45.5%;
      top: 46.75%;
    }

    &.cell-26 {
      transform: rotate(67.5deg);
      left: 48%;
      top: 44%;
    }

    &.cell-27 {
      transform: rotate(-22.5deg);
      left: 42.5%;
      top: 31.75%;
    }

    &.group-3 {
      bottom: 8.5%;
    }

    &.group-4 {
      left: 9%;
    }

  }

  &.size-by-height {
    .cell,
    .grahas .icon {
      font-size: 2.5vh;
    }
  }

  > .bg-over {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: -0.125%;
    background-image: url("/img/drawings/chakra-chandra-kalanala.svg");
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 108%;
    pointer-events: none;
  }
}
</style>