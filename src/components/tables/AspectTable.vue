<template>
  <grid-item class="aspect-table" :index="paneIndex" :chart="chart" :chart2="chart2">
    <h4>{{ this.title }}</h4>

    <div class="aspects widget" :class="wrapperClasses">
      <b-table v-if="!switching" :data="aspectRows" :mobile-cards="false">
        <template slot-scope="props">
          <b-table-column class="graha head" header-class="graha head" field="graha" label="G">
            <b-tooltip position="is-right" :label="grahaName(props.row.get('head'))">
              <span class="icon" :class="props.row.get('head')|toGrahaClass"></span>
            </b-tooltip>
          </b-table-column>
          <b-table-column
            v-for="(gk, index) in extendedBodies"
            :key="cellKey(props.row.get(gk), 'cell', gk, index)"
            :field="gk"
            :label="gk"
            class="graha-cell"
            :class="cellClasses(props.row.get(gk))"
            :title="props.row.get(gk)|angleInfoUnmatched"
          >
            <template slot="header" slot-scope="{ column }">
              <b-tooltip position="is-bottom" :label="grahaName(column.label)">
                <span class="icon" :class="column.label|toGrahaClass"></span>
              </b-tooltip>
            </template>
            <div
              v-if="hasCell(props.row.get(gk))"
              class="aspect-value"
              @click="toggleCell(props.row.get(gk))"
            >
              <span class="aspect-display" :class="aspectClasses(props.row.get(gk))"></span>
              <div class="info aspect-info">
                <p class="aspect-type" :title="props.row.get(gk)|angleInfo">
                  <sup class="person subject-1 letter">{{props.row.get(gk).s1}}</sup>
                  <span class="icon subject-1" :class="props.row.get(gk).k1|toGrahaClass"></span>
                  <span class="aspect-icon" :class="aspectClasses(props.row.get(gk))"></span>
                  <sup class="person subject-2 letter">{{props.row.get(gk).s2}}</sup>
                  <span class="icon subject-2" :class="props.row.get(gk).k2|toGrahaClass"></span>
                </p>
                <p class="aspect-name inner-label">
                  <span class="text">{{props.row.get(gk).value}}</span>
                  <span class="target">{{props.row.get(gk).target|toDeg}}</span>
                </p>
                <p class="direction inner-label">{{props.row.get(gk).dir}}</p>
                <degree
                  :deg="props.row.get(gk).absOrb"
                  :precision="-1"
                  :title="props.row.get(gk).orb"
                  classes="value orb"
                  :tooltip="false"
                />
              </div>
            </div>
          </b-table-column>
        </template>
      </b-table>
      <div class="copy-buttons row">
        <b-button class="copy with-header" icon-left="content-copy" icon-right="format-header-pound" @click="copyData" title="Copy with header row">top rows</b-button>
        <b-button class="copy data-only" icon-left="content-copy"  @click="copyRows" title="copy data rows only">extra tows</b-button>
      </div>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import {
  AspectCell,
} from "../../api/interfaces";
import { isNumeric } from "../../api/validators";
import { FilterSet } from "../../api/composables/FilterSet";
import Degree from "../widgets/Degree.vue";
import { bus } from "../../main";
import { DictionaryState, SettingState } from "../../store/types";
import {
  deepClone,
  calcGrahaAspects,
  toWords,
} from "../../api/helpers";
import { Chart } from "../../api/models/Chart";
import { aspectGroups, orbGrahaMatches, OrbGrahaSet } from "../../api/mappings/graha-values";
import { syncOptions, setWidgetOption } from "../../store/local";
import { degAsDms } from "../../api/converters";

@Component({
  filters: {
    ...FilterSet,
    angleInfo(cell) {
      if (cell instanceof Object) {
        const { lng1, lng2 } = cell;
        if (isNumeric(lng1)) {
          return [degAsDms(lng1), degAsDms(lng2)].join(" / ");
        }
      }
    },
    angleInfoUnmatched(cell) {
      let str = "";
      if (cell instanceof Object) {
        const { lng1, lng2, value } = cell;
        if (value.length < 2 && isNumeric(lng1) && isNumeric(lng2)) {
          str = [degAsDms(lng1), degAsDms(lng2)].join(" / ");
        }
      }
      return str;
    },
  },
  components: {
    GridItem,
    Degree,
  },
})
export default class AspectTable extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @State("settings") settings: SettingState;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "chart" }) context: string;
  @State("dictionary") dictionary: DictionaryState;

  vargaNum = 1;
  private c1: Chart;
  private c2: Chart;

  private aspectRows: Array<Map<string, AspectCell>> = [];

  private highlightedCellKeys: Array<string> = [];

  private switching = false;

  created() {
    this.c1 = deepClone(this.chart);
    if (this.hasC2) {
      this.c2 = deepClone(this.chart2);
    }
  }

  mounted() {
    syncOptions(this, this.context, "AspectTable", this.paneIndex);
    setTimeout(() => {
      this.changeAyanamsha(this.ayanamsha);
    }, 250);
    setTimeout(() => {
      this.calcAspects();
    }, 375);
    bus.$on("escape", () => {
      this.highlightedCellKeys = [];
    });
  }

  calcAspects() {
    const matchGrahaOrbGroup = (row: OrbGrahaSet, key = "") => row.keys.includes(key);
    const grid = this.extendedBodies.map((k1) => {
      return this.extendedBodies.map((k2) => {
        const [gr1, gr2] = [this.c1.graha(k1), this.c2.graha(k2)];
        gr1.setAyanamshaItem(this.ayanamsha);
        gr2.setAyanamshaItem(this.ayanamsha);
        gr1.setVarga(this.vargaNum);
        gr2.setVarga(this.vargaNum);
        const aspectData = calcGrahaAspects(gr1, gr2);
        const { aspects, deg, applying } = aspectData;
        const hasAspect = aspects instanceof Array && aspects.length > 0;
        const aspect = hasAspect ? aspects[0] : null;
        let groupIndex = -1;
        let maxOrb = 0;
        let aspectKey = "";
        let withinOrb = false;
        let aspectColor = "";
        let target = 0;
        if (hasAspect) {
          groupIndex = aspectGroups.findIndex((group) =>
            group.some(
              (asp) => asp.div === aspect.div && asp.fac === aspect.fac
            )
          );
          if (groupIndex >= 0) {
            const aspectRow = aspectGroups[groupIndex].find(
              (asp) => asp.div === aspect.div && asp.fac == aspect.fac
            );
            if (aspectRow) {
              aspectKey = aspectRow.key;
              aspectColor = aspectRow.cg;
              target = aspect.target;
            }
            const [gg1, gg2] = [
              orbGrahaMatches.find((row) => matchGrahaOrbGroup(row, k1)),
              orbGrahaMatches.find((row) => matchGrahaOrbGroup(row, k2)),
            ];
            if (gg1 && gg2) {
              if (
                groupIndex < gg1.orbs.length &&
                groupIndex < gg2.orbs.length
              ) {
                maxOrb = gg1.orbs[groupIndex] + gg2.orbs[groupIndex] / 2;
                withinOrb = aspect.absOrb <= maxOrb;
              }
            }
          }
        }
        return {
          k1,
          k2,
          deg,
          target,
          hasAspect,
          ...aspect,
          maxOrb,
          withinOrb,
          aspectKey,
          aspectColor,
          applying,
          lng1: gr1.longitude,
          lng2: gr2.longitude,
          group: groupIndex + 1,
        };
      });
    });
    this.aspectRows = grid.map(this.mapAspectRow);
  }

  get initials() {
    let initials = [];
    if (this.hasC1 && this.hasC2) {
      initials = [this.c1, this.c2].map((c) =>
        c.subject.name.trim().substring(0, 1).toUpperCase()
      );
    }
    return initials;
  }

  grahaName(key: string) {
    let name = key;
    const lex = this.dictionary.graha(key);
    if (lex instanceof Object && lex.hasText()) {
      name = lex.alt("sa", "en");
    }
    return name;
  }

  mapAspectRow(row: Array<any>) {
    const mp = new Map<string, any>();
    const [s1, s2] = this.initials;
    if (row.length > 0) {
      if (row[0] instanceof Object) {
        const { k1, lng1, lng2 } = row[0];
        mp.set("head", k1);
        mp.set("title", this.grahaName(k1));
        mp.set("sign", Math.floor(lng1 / 30) + 1);
        mp.set("signDegree", lng1 % 30);
        row.forEach((item) => {
          const {
            k1,
            k2,
            deg,
            orb,
            target,
            absOrb,
            maxOrb,
            withinOrb,
            hasAspect,
            aspectKey,
            aspectColor,
            lng1,
            lng2,
            group,
          } = item;
          const value = hasAspect && withinOrb ? aspectKey : "";
          const dir = item.applying ? "applying" : "separating";
          mp.set(item.k2, {
            k1,
            k2,
            s1,
            s2,
            value,
            maxOrb,
            orb,
            target,
            absOrb,
            deg,
            lng1,
            lng2,
            dir,
            aspectColor,
            group,
          });
        });
      }
    }
    return mp;
  }

  get title() {
    return "Synastry - Aspectarian";
  }

  get wrapperClasses() {
    return [];
  }

  get hasC1() {
    return this.chart instanceof Chart && this.chart.grahas.length > 0;
  }

  get hasC2() {
    return this.chart2 instanceof Chart && this.chart2.grahas.length > 0;
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get coreBodies() {
    return [
      "su",
      "mo",
      "me",
      "ve",
      "ma",
      "ju",
      "sa",
      "ur",
      "ne",
      "pl",
      "ra",
      "ke",
      "as",
      "mc",
    ];
  }

  get extendedBodies() {
    return [
      ...this.coreBodies,
      "ds",
      "ic"
    ];
  }

  cellKey(cell, prefix = "cell", key = "", index = 0) {
    let cv = "";
    if (cell instanceof Object) {
      const { k1, k2 } = cell;
      if (k1) {
        cv = [prefix, this.paneIndex, k1, k2].join("-");
      }
    }
    if (cv.length < 2) {
      cv = ["cell", this.paneIndex, key, index].join("-");
    }
    return cv;
  }

  cellId(cell, prefix = "aspect-cell") {
    return this.cellKey(cell, prefix);
  }

  hasCell(cell) {
    return (
      cell instanceof Object &&
      Object.keys(cell).includes("orb") &&
      Object.keys(cell).includes("value") &&
      cell.value.length > 1
    );
  }

  copyData(addHeader = true) {
    if (ClipboardEvent) {
      const pc = this.$ls.get('selected-pc');
      const relType = pc instanceof Object ? toWords(pc.relType) : 'unknown';
      const coreLines = [
        { key: 'names', value: [this.c1.name, this.c2.name].join(' / ') },
        { key: 'relationship', value: relType }
      ]
      const aToB = this.buildAspectRows(true);
      const keys = aToB.map(item => item.key);
      coreLines[0].value = [this.c2.name, this.c1.name].join(' / ');
      const bToA = this.buildAspectRows(false, keys);
      
      const row1 = [...coreLines.map(c => c.value), ...aToB.map(c => c.value)].join("\t");
      const row2 = [...coreLines.map(c => c.value), ...bToA.map(c => c.value)].join("\t");
      const lines: string[] = [row1, row2];
      if (addHeader) {
        const header = [...coreLines.map(c => c.key), ...aToB.map(c => c.key)].join("\t");
        lines.unshift(header);
      }
      navigator.clipboard.writeText(lines.join("\n"));
    }
  }

  copyRows() {
    return this.copyData(false);
  }

  buildAspectRows(forward = true, keys = []) {
    const numKeys = this.coreBodies.length;
    const items = this.aspectRows.filter(row => this.coreBodies.includes(row.get('head').toString())).map((row, rowIndex) => {
      const rowStart = forward ? rowIndex : 0;
      const rowEnd = forward ? numKeys : rowIndex + 1;
        const bodyKeys = this.coreBodies.slice(rowStart, rowEnd);
        const aspRows = bodyKeys.map(k => row.get(k)).map(row => {
          const {k1, k2, value } = row;
          return { key: [k1, k2].join("/"), value }
        });
        return aspRows;
      }).reduce((a ,b ) => a.concat(b));
    const resort = keys.length > 0;
    const cells = resort ? [] : items;
    if (resort) {
      keys.forEach(key => {
        const [k1, k2] = key.split('/');
        const nk = [k2, k1].join('/')
        const refCell = items.find(item => item.key === nk);
        if (refCell instanceof Object) {
          cells.push(refCell);
        }
      })
    }
    return cells;
  }

  cellValue(cell) {
    let cv = "";
    if (cell instanceof Object) {
      const { value } = cell;
      if (value) {
        cv = value;
      }
    }
    return cv;
  }

  cellClasses(cell: AspectCell) {
    const cls = [];
    if (cell instanceof Object) {
      const { k1, k2, value } = cell;
      if (k1) {
        cls.push(k1, k2);
        if (k1 === k2) {
          cls.push("graha-match");
        }
        if (value.length > 2) {
          cls.push("has-aspect");
        }
      }
      if (this.cellIsOpen(cell)) {
        cls.push("open");
      }
    }
    return cls;
  }

  aspectClasses(cell: AspectCell) {
    const cls = [];
    if (cell instanceof Object) {
      const { value, group, aspectColor } = cell;
      if (value) {
        cls.push("icon", ["icon", value].join("-"));
        if (group > 0) {
          cls.push(["group", group].join("-"));
          cls.push(["cg", aspectColor].join("-"));
        }
      }
    }
    return cls;
  }

  updateChart(newVal, set = 1) {
    if (newVal instanceof Chart) {
      if (set === 1) {
        this.c1 = deepClone(this.c1);
      } else if (set === 2) {
        this.c2 = deepClone(this.c2);
      }
      this.switching = true;
      const obj = {
          "k1": "",
          "k2": "",
          "s1": "",
          "s2": "",
          "value": "",
          "maxOrb": 0,
          "orb": 0,
          "target": 0,
          "absOrb": 0,
          "deg": 9,
          "lng1": 0,
          "lng2": 0,
          "dir": "",
          "aspectColor": "",
          "group": 0
        }
      this.aspectRows.forEach(row => {
        this.extendedBodies.forEach(gk => {
          row.set(gk, obj);
        })
        return row;
      })
      setTimeout(this.calcAspects, 125);
    }
  }

  cellIsOpen(cell: AspectCell) {
    return this.highlightedCellKeys.indexOf([cell.k1, cell.k2].join("-")) >= 0;
  }

  toggleCell(cell: AspectCell) {
    if (this.cellIsOpen(cell)) {
      this.closeCell(cell);
    } else {
      if (this.highlightedCellKeys.length > 3) {
        this.highlightedCellKeys.shift();
      }
      this.highlightedCellKeys.push([cell.k1, cell.k2].join("-"));
    }
  }

  closeCell(cell: AspectCell) {
    const key = [cell.k1, cell.k2].join("-");
    const index = this.highlightedCellKeys.indexOf(key);
    if (index >= 0) {
      this.highlightedCellKeys.splice(index, 1);
    }
  }

  @Watch("chart")
  changeChart(newVal) {
    this.updateChart(newVal, 1);
  }

  @Watch("chart2")
  changeChart2(newVal) {
    this.updateChart(newVal, 2);
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    if (newVal) {
      this.calcAspects();
    }
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      this.calcAspects();
    }
    setWidgetOption(
      this.context,
      "AshtaKuta",
      this.paneIndex,
      "vargaNum",
      newVal
    );
  }
}
</script>
<style lang="scss">
@import "@/styles/variables.scss";
#app #main {
  .aspect-table {
    .table-wrapper {
      margin: 0.25em 0.875em 0 0.125em;
    }
    table {
      border-collapse: collapse;
      th {
        &.sign-degree,
        &.graha,
        &.sign {
          opacity: 0;
        }
      }
      td,
      th {
        font-size: 0.5em;
        white-space: nowrap;
        span {
          margin: 0;
          &.icon {
            width: 1em;
            height: 1em;
            font-size: 1em;
          }
        }
      }
      thead th .icon {
        color: $red-label;
      }
      tbody {
        td.head .icon {
          color: $blue-label;
        }
        td.graha-cell {
          padding: 0.5625em 0.125em 0.125em 0.125em;
          max-width: 1.5em;
          background-color: white;
          border: solid 0.5px $light-grey;
          vertical-align: middle;
          text-align: center;
          position: relative;
          &.graha-match {
            background-color: $yellow-translucent;
          }
          .aspect-value {
            position: relative;
            cursor: pointer;
            .icon {
              transition: transform 0.5s ease-in-out;
              &:hover {
                transform: scale(1.25);
              }
            }
          }

          &.open,
          &:hover {
            .aspect-info {
              opacity: 1;
              pointer-events: all;
            }
          }

          .aspect-info {
            position: absolute;
            font-size: 1.25em;
            top: 1.25em;
            left: -2.25em;
            padding: 0.25em 0.5em;
            overflow: visible;
            background-color: white;
            z-index: 60;
            border: solid 0.5px $light-grey;
            border-radius: 0.25em;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease-in-out;
            .subject-1 {
              color: $blue-label;
            }
            .subject-2 {
              color: $red-label;
            }
            p {
              padding: 0;
              margin: 0;

              strong,
              span,
              sup {
                display: inline-block;
              }
              sup {
                margin-top: -0.0625em;
                margin-right: -0.125em;
              }
              &.inner-label {
                line-height: 1em;
                text-transform: capitalize;
                span.target {
                  margin-left: 0.25em;
                }
              }
              &.aspect.degrees {
                font-size: 1.25em;

                strong {
                  margin: 0 0.125em;
                }
              }
              .aspect-icon {
                margin: 0 0.5em;
              }
            }
            .degrees-dms {
              display: block;
              margin-top: 0.25em;
            }
          }
          .cg-blue {
            color: $blue-label;
          }

          .cg-red {
            color: $red-label;
          }

          .cg-green {
            color: $green;
          }
          .cg-grey {
            color: $medium-grey;
          }
        }
      }
    }
    &.expanded {
      table tbody td.graha-cell {
        padding: 0.3125em 0.125em 0.125em 0.125em;
      }
    }
  }
  .aspects.widget {
    .copy-buttons {
      position: absolute;
      right: 2.5%;
      bottom: 2.5%;
      opacity: 0;
      button {
        font-size: 0.75em;
      }
      &:hover {
        opacity: 1;
      }
    }
  }
  .expanded .aspects.widget {
    .copy-buttons {
      right: 1.25%;
      bottom: 1.25%;
      button {
        font-size: 0.375em;
      }
    }
  }
}

</style>