c2<template>
  <grid-item class="sarvatobhadra-cakra" :index="paneIndex" :chart="chart">
    <h4>
      <slot name="title">{{ title }}</slot>
    </h4>
    <div class="sarvatobhadra-cakra-chart widget" :class="wrapperClasses">
      <div class="inner cell-grid">
          <div
          class="cell"
          v-for="cell in getCells()"
          :key="cell.key"
          :class="cell.classNames"
          :title="cell.title"
          @mouseover="cellHighlight(cell)"
          @mouseout="resetHighlighted"
          @click="cellHighlight(cell, true)"
        >
          <div class="highlight-bg"></div>
          <div class="grahas" v-if="cell.grahas.length > 0">
            <i
              v-for="item in cell.grahas"
              :key="item.key"
              :class="item.classNames"
              :title="item.graha.longitude | toDMS0"
            ></i>
          </div>
        </div>
      </div>
      <template v-if="layoutOuter">
        <div  v-for="cg in outerCellGroups()" :key="cg.key" class="outer-group cell-grid" :class="cg.classNames">
          <div  v-for="cell in cg.cells" :key="cell.key" class="cell" :class="cell.classNames" :title="cell.nakNum">
            <div class="grahas" v-if="cell.grahas.length > 0">
            <i
              v-for="item in cell.grahas"
              :key="item.key"
              :class="item.classNames"
              :title="outerGrahaTitle(item.graha, cell)"
            ></i>
          </div>
          </div>
        </div>
      </template>
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
} from "../../api/interfaces";
import { isNumeric } from "../../api/validators";
import { FilterSet } from "../../api/composables/FilterSet";
import Degree from "../widgets/Degree.vue";
import { DictionaryState, SettingState } from "../../store/types";
import {
  applyDashaTransitClasses,
  deepClone,
  matchNakshatra28,
  matchNakshatra28Item,
} from "../../api/helpers";
import { Chart, applyAyanamsha } from "../../api/models/Chart";
import {
  setWidgetOption,
  syncOptions,
} from "../../store/local";
import { degAsDms } from "@/api/converters";

@Component({
  filters: FilterSet,
  components: {
    Degree,
    GridItem,
  },
})
export default class SarvatobhadraCakra extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "p2" }) context: string;
  @Prop({ default: 1 }) readonly order: number;
  @Prop({ default: () => [] }) readonly transitKeys: string[];
  @State("dictionary") dictionary: DictionaryState;
  @State("settings") settings: SettingState;

  vargaNum = 1;

  private c1: Chart;
  private c2: Chart;

  private switching = false;

  private highlighted: Array<Cell> = [];

  private fixedCell: Cell = { row: 0, column: 0 };

  created() {
    if (this.chart instanceof Chart) {
      this.c1 = deepClone(this.chart);
    }

    if (this.chart2 instanceof Chart) {
      this.c2 = deepClone(this.chart2);
    }
  }

  mounted() {
    syncOptions(this, this.context, "SarvatobhadraCakra", this.paneIndex);
    setTimeout(() => {
      if (this.ayanamsha.num > 0) {
        this.changeAyanamsha(this.ayanamsha);
      }
    }, 500);
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get coreBodies() {
    return ["as", "su", "mo", "ma", "ju", "sa", "ve", "me", "ke", "ra"];
  }

  get hasFixedCell() {
    return this.fixedCell.row > 0 && this.fixedCell.column > 0;
  }

  get hasC2() {
    return this.c2 instanceof Chart && this.c2.bodies.length > 0;
  }

  get layoutOuter(): boolean {
    return this.context === 'predictive';
  }

  isFixedCell(cell) {
    return (
      cell.row === this.fixedCell.row && cell.column == this.fixedCell.column
    );
  }

  buildGrahas(num = 1): Array<Graha> {
    const bodies =
      num === 1 ? this.c1.bodies : this.hasC2 ? this.c2.bodies : [];
    const ascendant =
      num === 1
        ? this.c1.ascendantGraha
        : this.hasC2
        ? this.c2.ascendantGraha
        : new Graha(null);
    bodies.forEach((gr) => gr.setAyanamshaItem(this.ayanamsha));
    ascendant.setAyanamshaItem(this.ayanamsha);
    return [
      ...bodies.filter((gr) => this.coreBodies.includes(gr.key)),
      ascendant,
    ];
  }

  get title() {
    return this.dictionary.text("chakra", "sbc_0");
  }

  get gridSize() {
    return 9;
  }

  get cellIndices() {
    return Array.from(Array(this.gridSize).keys());
  }

  get cellMap() {
    const cellMap = this.cellIndices.map((r) => {
      return this.cellIndices.map((c) => {
        return {
          row: r + 1,
          column: c + 1,
        };
      });
    });
    return cellMap.reduce((a, b) => a.concat(b), []);
  }

  buildGrahaClasses(body: Graha, setNum = 1) {
    const cls = [
        "symbol",
        "icon",
        ["icon", body.key].join("-"),
        ["c", setNum].join(""),
      ];
      applyDashaTransitClasses(this.transitKeys, body, cls);
      return cls;
  }

  getCells() {
    const cells = [];
    const nks1 = this.switching ? [] : this.buildNakshatraItems();
    const addGrahaItem = (
      graha,
      index,
      setNum: number,
      grahas: Array<GrahaItem>
    ) => {
      const key = ["graha", setNum, index].join("-");
      const classNames = this.buildGrahaClasses(graha, setNum);
      
      grahas.push({ graha, set: setNum, key, classNames });
    };
    this.cellIndices.forEach((v1) => {
      this.cellIndices.forEach((v2) => {
        let title = "";
        const index = v1 * this.gridSize + v2;
        const num = index + 1;
        const row = Math.floor(index / this.gridSize) + 1;
        const column = (index % this.gridSize) + 1;
        const key = ["cell", row, column].join("-");
        const classNames = [key];
        if (column === 1) {
          classNames.push("first-col");
        }
        if (column === this.gridSize) {
          classNames.push("last-col");
        }
        if (row === 1) {
          classNames.push("first-row");
        }
        if (row === this.gridSize) {
          classNames.push("last-row");
        }
        if (row >= 3 && row <= 7) {
          if (
            ((row === 3 || row === 7) && column >= 4 && column <= 6) ||
            (row >= 4 && row <= 6 && (column === 3 || column === 7))
          ) {
            classNames.push("sign-cell");
          }
          if (
            ([4, 6].includes(row) && column === 5) ||
            ([4, 6].includes(column) && row === 5) ||
            (column === 5 && row === 5)
          ) {
            classNames.push("vedha-cell");
          }
        }
        if (
          this.highlighted.filter((c) => c.row === row && c.column === column)
            .length > 0
        ) {
          classNames.push("highlighted");
        }
        if (this.isFixedCell({ row, column })) {
          classNames.push("fixed");
        }
        const grahas: Array<GrahaItem> = [];
        const nak = nks1.find((nk) => nk.classNames.includes(key));
        if (nak) {
          nak.classNames.forEach((cl) => {
            if (!classNames.includes(cl)) {
              classNames.push(cl);
            }
          });
          title = nak.title;

          classNames.push("nakshatra-cell");

          if (nak.grahas.length > 0) {
            nak.grahas.forEach((graha, gi) =>
              addGrahaItem(graha, gi, 1, grahas)
            );
          }
          if (nak.grahas2.length > 0) {
            nak.grahas2.forEach((graha, gi) =>
              addGrahaItem(graha, gi, 2, grahas)
            );
          }
        }
        const numGrahas = grahas.length;
        classNames.push(["num-grahas", numGrahas].join("-"));
        cells.push({
          num,
          row,
          column,
          classNames,
          key,
          title,
          grahas,
        });
      });
    });
    return cells;
  }

  outerCellGroups() {
    const matchOuterGroup = (index: number) => {
      switch (index) {
        case 0:
          return 'left';
        case 1:
          return 'top';
        case 2:
          return 'right';
        default:
          return 'bottom';
      }
    }
    const b2 = this.buildGrahas(2);
    const matchOuterNak = (index = 0, subIndex = 0) => {
      const outerIndex = (index * 7) + subIndex;
      return ((outerIndex + 23) % 28) + 1;
    }
    return [0,1,2,3].map(index => {
        const key = ["group", (index+1)].join("-");
        const classNames = [key, matchOuterGroup(index)];
        
        const cells = [0, 1, 2, 3, 4, 5, 6].map(subIndex => {
            const key = ["cell", (index+1), (subIndex+1)].join("-");
            const num = (index * 7) + subIndex + 1;
            const nakNum = matchOuterNak(index, subIndex);
            const grahas = b2.filter((gr) => gr.nakshatra28 === nakNum).map(graha => {
              const key = ['outer-graha', graha.key].join('-');
              const classNames = this.buildGrahaClasses(graha, (index + 1));
              return {
                key,
                classNames,
                graha
              }
            });
            const classNames = [['nk', num].join('-')];
            if (subIndex === 6) {
              classNames.push('last-cell');
            }
            return { key, grahas, num, classNames, nakNum };
        });
        return { key, cells, classNames };
    });
  }

  dictName(dictKey = "", ref = "") {
    let long = ref;
    const lex = this.dictionary.lexeme("nakshatra", dictKey);
    if (lex) {
      long = lex.text("sa", "default");
    }
    return long;
  }

  buildNakshatraItems() {
    const b1 = this.buildGrahas(1);
    const b2 = this.layoutOuter? [] : this.buildGrahas(2);
    const calcGroupNum = (num: number) =>
      num < 3 ? 4 : Math.floor((num - 3) / 7) + 1;
    const calcPosition = (num: number) =>
      num < 3 ? num + 5 : ((num - 3) % 7) + 1;
    return nakshatraValues
      .map((nk, index) => {
        const { num, ref, itemKey, dictKey } = matchNakshatra28(index);
        const long = this.dictName(dictKey, ref);
        const nkItem = matchNakshatra28Item(nakshatraValues, num, itemKey);
        if (nkItem) {
          const grahas = b1.filter((gr) => gr.nakshatra28 === num);
          const grahas2 = this.layoutOuter? [] : b2.filter((gr) => gr.nakshatra28 === num);
          const abhjitClass =
            num < 22 ? "before" : num === 22 ? "abhjit" : "after";
          const groupNum = calcGroupNum(num);
          const subNum = calcPosition(num);
          const groupClass = ["nakshtra-group", groupNum].join("-");
          const itemClass = itemKey.replace(/_+/g, "-");
          let pos = [0, 0];
          switch (groupNum) {
            case 1:
              pos = [1, subNum + 1];
              break;
            case 2:
              pos = [subNum + 1, 9];
              break;
            case 3:
              pos = [9, 9 - subNum];
              break;
            case 4:
              pos = [9 - subNum, 1];
              break;
          }
          const title = num + ": " + long;
          const placeClass = ["cell", ...pos].join("-");
          const classNames = [
            itemKey.replace(/_/g, "-"),
            abhjitClass,
            groupClass,
            itemClass,
            placeClass,
          ];
          return {
            ...nkItem,
            short: ref,
            long,
            grahas,
            grahas2,
            classNames,
            title,
          };
        }
      })
      .filter((nkItem) => nkItem instanceof Object);
  }

  resetHighlighted() {
    if (!this.hasFixedCell) {
      this.highlighted = [];
    } else {
      this.cellHighlight(this.fixedCell, false);
    }
  }

  cellHighlight(cell, keep = false) {
    const tbAcross =
      [1, 9].includes(cell.row) && cell.column > 1 && cell.column < 9;
    const lrDown = [1, 9].includes(cell.column) && cell.row > 1 && cell.row < 9;
    /* const isVedhaCell =
      ([4, 6].includes(cell.row) && cell.column === 5) ||
      ([4, 6].includes(cell.column) && cell.row === 5) ||
      (cell.row === 5 && cell.column === 5); */
    const isVedhaCell = false;
    const isDiag = (c, cell, num) =>
      c.column === cell.column + num &&
      (c.row === cell.row + num || c.row === cell.row - num);
    const diagNums = Array.from(Array(16).keys()).map((i) =>
      i < 8 ? -1 - i : -7 + i
    );
    if (tbAcross || lrDown || isVedhaCell) {
      this.highlighted = this.cellMap
        .filter(
          (c) =>
            (lrDown && c.row === cell.row) ||
            (tbAcross && c.column === cell.column) ||
            (isVedhaCell && (c.column === cell.column || c.row === cell.row)) ||
            diagNums.some((n) => isDiag(c, cell, n))
        )
        .map((c) => {
          return {
            row: c.row,
            column: c.column,
          };
        });
    }
    if (keep) {
      if (this.isFixedCell(cell)) {
        this.fixedCell = { row: 0, column: 0 };
      } else {
        this.fixedCell = { row: cell.row, column: cell.column };
      }
    }
  }

  outerGrahaTitle(grahaItem, cell) {
    const { num, ref, dictKey } = matchNakshatra28(cell.nakNum - 1);
    const title = this.dictName(dictKey, ref);
    return [`${num}) ${title}`, degAsDms(grahaItem.longitude)].join(": ");
  }

  get wrapperClasses() {
    const cls = [['layout', this.context].join('-')];
    if (this.layoutOuter) {
      cls.push('show-outer');
    }
    switch (this.context) {
      case 'predictive':
        cls.push('predictive');
        break;
      default:
        cls.push('comparative');
        break;
    }
    return cls;
  }

  triggerSwitch(timeout = 100) {
    this.switching = true;
    setTimeout(() => {
      this.switching = false;
    }, timeout);
  }

  @Watch("chart")
  changeChart(newVal) {
    if (newVal instanceof Chart) {
      this.triggerSwitch(200);
      this.c1 = deepClone(newVal);
    }
  }

  @Watch("chart2")
  changeChart2(newVal) {
    if (newVal instanceof Chart) {
      this.triggerSwitch();
      this.c2 = deepClone(newVal);
    }
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    this.triggerSwitch();
    if (this.c1 instanceof Chart) {
      this.c1.bodies.forEach((gr) => {
        gr.setAyanamshaItem(newVal);
      });
    }
    if (this.c2 instanceof Chart) {
      applyAyanamsha(this.c2, this.c2.bodies, newVal);
    }
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      const num = parseInt(newVal);
      this.triggerSwitch();
      this.c1.setVarga(num);
      this.c1.bodies.forEach((gr) => {
        gr.setVarga(num);
      });
      this.c2.setVarga(num);
      this.c2.bodies.forEach((gr) => {
        gr.setVarga(num);
      });

      setWidgetOption(
        this.context,
        "SarvatobhadraCakra",
        this.paneIndex,
        "vargaNum",
        newVal
      );
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/styles/variables.scss";
.sarvatobhadra-cakra {
  .sarvatobhadra-cakra-chart {
    .cell-grid {
      .cell {
        border-top: solid 0.03125em $dark-color;
        border-left: solid 0.03125em $dark-color;
        position: relative;
        aspect-ratio: 1/1;
        .grahas {
          position: absolute;
          top: 30%;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          .icon {
            height: 1em;
            width: 1em;
            margin: 0.125em;
            font-size: 0.75em;
          }
        }
        &.last-row .grahas {
          bottom: 30%;
          top: 0;
        }
        &.num-grahas-3 .icon {
          font-size: 0.625em;
        }
        &.num-grahas-4 .icon {
          font-size: 0.5625em;
        }
        &.num-grahas-7 .icon,
        &.num-grahas-5 .icon {
          font-size: 0.5em;
        }
        &.last-row {
          border-bottom: solid 0.03125em $dark-color;
        }
        &.last-col {
          border-right: solid 0.03125em $dark-color;
        }
        &.sign-cell {
          background-color: $bright-green;
        }
        &.vedha-cell {
          background-color: $bright-blue;
        }
        &.nakshatra-cell {
          background-color: $bright-shade;
        }
      }
    }

    &.comparative {
      .cell-grid {
        .cell {
          .grahas {
            .icon {
              &.c1 {
                color: $blue;
              }
              &.c2 {
                color: $red-label;
              }
            }
          }
        }
      }
    }

    &.predictive {
      .cell-grid {
        .cell {
          .grahas {
            .icon {
              &.dasha-level-1 {
                color: $red-label;
              }
              &.dasha-level-2 {
                color: $blue-label;
              }
              &.dasha-level-3 {
                color: $green;
              }
            }
          }
        }
      }
    }

    .inner {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(9, 1fr);
      grid-column-gap: 0;
      grid-row-gap: 0;
      margin: -0.125%;

      .cell.fixed {
        .highlight-bg {
          outline: solid 0.125em $active-color;
          outline-offset: -0.125em;
        }
      }

      .highlight-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        opacity: 0;
        background-color: $purple-translucent;
        transition: opacity 0.25s ease-in-out;
      }

      .highlighted {
        .highlight-bg {
          opacity: 1;
        }
      }
    }

    &.show-outer {
      padding: 9.09090909090909%;
      .cell {
        font-size: 0.818181818181818em;
      }
      > .bg-over {
        background-size: 82.227272%;
        background-position: center center;
      }
    }

    > .outer-group {
      position: absolute;
      display: flex;
      align-items: stretch;
      flex-wrap: nowrap;
      &.top {
        top: 0;
        flex-direction: row;
        border-top: solid 0.03125em #222222;
      }
      &.bottom,
      &.top {
        left: 18.1%;
        right: 18.1%;
        height: 9.09090909090909%;
        margin-right: -0.046875em;
        border-right: solid 0.03125em #222222;
        .cell {
          border-top: none;
          border-bottom: none;
          width: 14.2857142857143%;
        }
      }
      &.right,
      &.left {
        top: 18.1%;
        bottom: 18.05%;
        width: 9.09090909090909%;
        margin-bottom: -0.03125em;
        border-bottom: solid 0.03125em #222222;
        .cell {
          border-right: none;
          border-left: none;
          height: 14.2857142857143%;
        }
      }
      &.bottom {
        bottom: 0;
        flex-direction: row-reverse;
        border-bottom: solid 0.03125em #222222;
      }
      &.left {
        left: 0;
        flex-direction: column-reverse;
        border-left: solid 0.03125em #222222;
      }
      &.right {
        right: 0;
        flex-direction: column;
        border-right: solid 0.03125em #222222;
      }
    }
    

    > .bg-over {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: -0.125%;
      background-image: url("/img/drawings/sarvatobhadra-cakra.svg");
      background-repeat: no-repeat;
      background-position: 0 0;
      background-size: 100.5%;
      pointer-events: none;
      outline: solid 0.03125em $dark-color;
    }
  }
}
</style>