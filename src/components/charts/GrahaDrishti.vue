<template>
  <grid-item class="graha-drishti" :index="paneIndex" :chart="chart">
    <h4>{{ title }}</h4>
    <div class="graha-drishti-chart widget">
      <div class="control-row graha-row">
        <b-checkbox
          v-for="(key, gi) in orderKeys"
          :key="['graha-drishti', key, gi].join('-')"
          :native-value="key"
          v-model="selected"
          :class="key"
        >
          <i class="icon" :class="key | toGrahaClass"></i>
        </b-checkbox>
      </div>
      <div class="select-area select-grid">
        <div class="control-row avg-row">
          <b-checkbox
            v-for="(avg, gi) in averageLabels"
            :key="['graha-drishti', avg.key, gi].join('-')"
            :native-value="avg.key"
            v-model="averageKeys"
            :class="avg.key"
            :disabled="mayNotSelect(avg.key)"
          >{{ avg.label }}</b-checkbox>
        </div>
        <div class="control-column mode-column">
          <b-radio
            v-for="(mod, gi) in modeLabels"
            :key="['graha-drishti', mod.key, gi].join('-')"
            :native-value="mod.key"
            v-model="mode"
            :class="mod.key"
            :disabled="mayNotSelect(mod.key)"
          >{{ mod.label }}</b-radio>
        </div>
      </div>
      <div class="select-area select-row own-mode-container">
        <b-tooltip :label="ownModeHelp" :multilined="true">
          <b-checkbox
            v-model="ownMode"
            class="own-mode"
          >
            {{ownModeLabel}}
          </b-checkbox>
        </b-tooltip>
      </div>
      <div class="graha-markers" :class="grahaMarkerClasses">
        <i
          v-for="gp in grahaRelPositions"
          :key="gp.itemKey"
          class="icon"
          :class="gp.classNames"
          :style="gp.style"
          :title="gp.title"
        ></i>
      </div>
      <LineChart
        :chartData="chartData"
        :options="options"
        class="chart-container"
        :refresh="switching"
      />
      <div class="line-overlay">
        <div v-for="(item, si) in signHouses" :key="[item.key, 'bg', si].join('-')" class="backdrop sign-bg" :class="backdropClasses(si)">
        </div>
        <div
          v-for="gp in grahaPositions"
          :key="gp.itemKey"
          class="backdrop graha-line"
          :class="gp.key"
          :style="gp.style"
        ></div>
      </div>
      <ul class="sign-labels">
        <li v-for="item in signHouses" :key="item.key">
          <i class="icon" :class="item.sign | toSignClass"></i>
          <sup>{{ item.house }}</sup>
        </li>
      </ul>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import { Graha } from "../../api/models/Graha";
import {
  SignHouse,
} from "../../api/interfaces";
import {
  isNumeric,
  withinRange,
} from "../../api/validators";
import { FilterSet } from "../../api/composables/FilterSet";
import rashiValues from "../../api/mappings/rashi-values";
import Degree from "../widgets/Degree.vue";
import LineChart from "./LineChart";
import { DictionaryState, SettingState } from "../../store/types";
import {
  deepClone,
  loopShift,
  calcInclusiveTwelfths,
  buildFunctionalBMMap,
} from "../../api/helpers";
import { Chart, applyAyanamsha } from "../../api/models/Chart";
import {
  naturalBenefics,
  naturalMalefics,
  rulerSignsMap,
} from "../../api/mappings/graha-values";
import { setWidgetOption, syncOptions } from "../../store/local";
import { fetchSetting } from "../../api/methods";

@Component({
  filters: FilterSet,
  components: {
    Degree,
    GridItem,
    LineChart,
  },
})
export default class GrahaDrishti extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "p2" }) context: string;
  @Prop({ default: 1 }) readonly order: number;
  @State("dictionary") dictionary: DictionaryState;
  @State("settings") settings: SettingState;

  vargaNum = 1;

  private title = "Graha Dṛṣti Bala";

  private c1: Chart;
  private c2: Chart;

  private switching = false;

  private firstMode = "sign";

  private signValueSets = new Map<string, Array<number>>();

  private selected = ["su", "mo", "ma","me","ve","ju","sa"];
  
  // 'benefic','malefic', 'functional_benefics', 'functional_malefics', 'all', 'selected'

  private ownMode = false;

  private averageKeys = [];

  private mode = "natural";

  private grahaStrengthSet: any = {};

  private init = false;

  private chartData = {
    datasets: [],
    labels: [],
  };

  created() {
    if (this.chart instanceof Chart) {
      this.c1 = deepClone(this.chart);
    }

    if (this.chart2 instanceof Chart) {
      this.c2 = deepClone(this.chart2);
    }
    this.fetchSettings();
    setTimeout(() => {
      this.mergeData(true, true);
    }, 2000);
  }

  mounted() {
    syncOptions(this, this.context, "GrahaDrishti", this.paneIndex);
    setTimeout(() => {
      if (this.ayanamsha.num > 0) {
        this.changeAyanamsha(this.ayanamsha);
      }
    }, 500);
  }

  get signs() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  get rulerSignsMap() {
    return rulerSignsMap();
  }

  get signHouses(): Array<SignHouse> {
    let values = this.signs.map((sign) => {
      return {
        sign,
        key: ["sh", sign].join("-"),
        house: this.matchHouse(sign),
      };
    });
    if (this.firstMode === "house") {
      values = loopShift(
        values,
        values.findIndex((v) => v.sign === this.c1.firstHouseSign)
      );
    }
    return values;
  }

  get ownModeLabel() {
    return `Own Graha position as 100% dṛṣṭi`;
  }

  get ownModeHelp() {
    return `Treat own position of a Graha as 100% dṛṣṭi (non-traditional)`;
  }

  matchHouse(sign: number | string) {
    if (typeof sign === "string") {
      sign = parseInt(sign);
    }
    return calcInclusiveTwelfths(this.c1.firstHouseSign, sign);
  }

  get orderKeys() {
    return ["su", "mo", "ma", "me", "ju", "ve", "sa", "ra", "ke"];
  }

  get averageLabels() {
    return [
      { key: "selected", label: "Avg. (selected)" },
      { key: "all", label: "Avg. (all)" },
      { key: "benefic", label: "Avg. Benefics" },
      { key: "malefic", label: "Avg. Malefics" },
    ];
  }

  get modeLabels() {
    return [
      { key: "natural", label: "Natural B/M" },
      { key: "functional", label: "Functional B/M" },
    ];
  }

  get houseBMMap() {
    return buildFunctionalBMMap(this.orderKeys, this.signHouses);
  }

  get grahaMarkerClasses() {
    return [this.mode, ...this.averageKeys];
  }

  mergeData(calcGrahas = true, renew = false) {
    const grahaStrengths = new Map<string, Array<any>>();
    const grahas = this.getGrahas().filter((gr) =>
      this.orderKeys.includes(gr.key)
    );
    grahas.sort(
      (a, b) => this.orderKeys.indexOf(a.key) - this.orderKeys.indexOf(b.key)
    );

    grahas.forEach((gr) => {
      grahaStrengths.set(gr.key, []);
    });

    this.averageKeys.forEach((key) => {
      grahaStrengths.set(key, []);
    });

    if (renew) {
      this.grahaStrengthSet = Object.fromEntries(grahaStrengths);
    } else {
      //const currKeys = Object.keys(this.grahaStrengthSet);
      this.averageKeys.forEach((key) => {
        this.grahaStrengthSet[key] = [];
      });
    }
    const beneficKeys =
      this.mode === "functional" ? this.houseBMMap.get("b") : naturalBenefics;
    const maleficKeys =
      this.mode === "functional" ? this.houseBMMap.get("m") : naturalMalefics;
    for (let dg = 0; dg < 360; dg++) {
      const startIndex = Math.floor(dg / 30);
      if (calcGrahas) {
        grahas.forEach((gr) => {
          const dist = (dg + 360 - gr.longitude) % 360;
          const dist12s = dist / 30;
          const startIndex = Math.floor(dist12s);
          const endIndex = (startIndex + 1) % 12;
          let progress = dist12s % 1;
          const strengthVals = this.signValueSets.get(gr.key);
          if (strengthVals instanceof Array) {
            let startVal = strengthVals[startIndex];
            let endVal = strengthVals[endIndex];
            if (this.ownMode) {
              const refDg = gr.longitude;
              const startOwnSign = (refDg - 15 + 360) % 360;
              const endOwnSign = (refDg + 15 + 360) % 360;
              
              if (dg >= startOwnSign && dg < endOwnSign) {       
                if (dg <= refDg) {
                  endVal = 1;
                  progress = (dg - startOwnSign) / 15;
                } else {
                  startVal = 1;
                  progress = 1 - ((endOwnSign - dg) / 15);
                }
              }
            }
            const diffVal = endVal - startVal;
            const targetStrength = startVal + progress * diffVal;
            
            const strength = targetStrength;
            this.grahaStrengthSet[gr.key].push({
              deg: dg,
              strength,
              sign: startIndex + 1,
            });
          }
        });
      }
      this.averageKeys.forEach((key) => {
        let filteredGrahas = [];
        switch (key) {
          case "benefic":
            filteredGrahas = beneficKeys;
            break;
          case "malefic":
            filteredGrahas = maleficKeys;
            break;
          case "selected":
            filteredGrahas = this.selected;
            break;
          case "all":
            filteredGrahas = grahas.map((gr) => gr.key);
            break;
        }
        if (filteredGrahas.length > 0) {
          this.grahaStrengthSet[key].push(
            this.calcAverage(filteredGrahas, dg, startIndex)
          );
        }
      });
    }
    this.buildChart(renew);
  }

  get grahaPositions() {
    return this.getGrahas()
      .filter((gr) => this.orderKeys.includes(gr.key))
      .map((gr) => {
        const lex = this.dictionary.graha(gr.key);
        const title =
          lex instanceof Object ? lex.text("en", "standard", "lt") : gr.key;
        const pos = this.calcGrahaPosition(gr);
        const itemKey = ["gline", gr.key, this.paneIndex].join("-");
        return {
          key: gr.key,
          pos,
          style: `left:${pos}%`,
          title,
          itemKey,
        };
      });
  }

  calcGrahaPosition(gr: Graha) {
    return (gr.longitude / 360) * 100;
  }

  matchNature(key: string) {
    const beneficKeys = this.houseBMMap.get("b");
    const maleficKeys = this.houseBMMap.get("m");
    let fn = "n";
    if (beneficKeys.includes(key)) {
      fn = "b";
    } else if (maleficKeys.includes(key)) {
      fn = "m";
    }
    let nn = "n";
    if (naturalBenefics.includes(key)) {
      nn = "b";
    } else if (naturalMalefics.includes(key)) {
      nn = "m";
    }
    const lex = this.dictionary.lexeme("guna", fn);
    let funcLabel = fn;
    if (lex) {
      funcLabel = lex.text("en", "standard", "lt");
    }
    let natLabel = nn;
    if (fn !== nn) {
      const naturalLex = this.dictionary.lexeme("guna", nn);
      if (naturalLex) {
        natLabel = naturalLex.text("en", "standard", "lt");
      }
    } else {
      natLabel = funcLabel;
    }
    const funcKey = funcLabel.toLowerCase().split(" ").shift().trim();
    const natKey =
      fn === nn ? funcKey : natLabel.toLowerCase().split(" ").shift().trim();
    return {
      funcLetter: fn,
      funcKey,
      funcLabel,
      natLetter: nn,
      natKey,
      natLabel,
    };
  }

  get grahaRelPositions() {
    const adjustedPositions = new Map<string, any>();

    this.grahaPositions.forEach((gp) => {
      const nearby = this.grahaPositions.filter((g2) =>
        withinRange(gp.pos, g2.pos, 7)
      );
      nearby.sort((a, b) => a.pos - b.pos);
      const numNearby = nearby.length;
      const midPos =
        nearby.map((g) => g.pos).reduce((a, b) => a + b, 0) / numNearby;
      const offset = (numNearby - 1) / 2;
      nearby.forEach((g3, gi) => {
        if (!adjustedPositions.has(gp.key)) {
          const relPos = midPos + (gi - offset) * 3.5;
          const itemKey = g3.itemKey + "-rel";
          const nature = this.matchNature(g3.key);
          const title = [g3.title, ": ", nature.funcLabel].join("");
          const classNames = [
            ["icon", g3.key].join("-"),
            ["functional", nature.funcKey].join("-"),
            ["natural", nature.natKey].join("-"),
          ];
          adjustedPositions.set(g3.key, {
            ...g3,
            itemKey,
            title,
            style: `left: ${relPos}%`,
            pos: relPos,
            classNames,
          });
        }
      });
    });
    return Object.fromEntries(adjustedPositions);
  }

  calcAverage(
    filteredGrahas: Array<string>,
    degree: number,
    startIndex: number
  ) {
    let total = 0;
    const setKeys = Object.keys(this.grahaStrengthSet);
    if (this.grahaStrengthSet instanceof Object) {
      filteredGrahas.forEach((key) => {
        if (
          setKeys.includes(key) &&
          this.grahaStrengthSet[key] instanceof Array
        ) {
          if (degree < this.grahaStrengthSet[key].length) {
            total += this.grahaStrengthSet[key][degree].strength;
          }
        }
      });
    }
    return {
      deg: degree,
      strength: total / filteredGrahas.length,
      sign: startIndex + 1,
    };
  }

  mayNotSelect(key: string) {
    let disabled = false;
    switch (key) {
      case "selected":
        disabled = this.selected.length < 2;
        break;
      case "natural":
      case "functional":
        disabled =
          !this.averageKeys.includes("benefic") &&
          !this.averageKeys.includes("malefic");
        break;
    }
    return disabled;
  }

  get colorMap() {
    return {
      su: "rgba(255, 204, 0, 0.5)", // #ffcc00
      mo: "rgba(136, 136, 136, 0.5)",
      ma: "rgba(255, 0, 0, 0.5)",
      me: "rgba(0, 255, 0, 0.5)",
      ju: "rgba(204, 102, 51, 0.5)", // #cc6633
      ve: "rgba(187, 0, 153, 0.5)", // #bb0099
      sa: "rgba(0, 0, 153, 0.5)",
      ra: "rgba(0, 0, 102, 0.5)",
      ke: "rgba(102, 0, 0, 0.5)",
      benefic: "#0000ff",
      malefic: "#cc7777",
      selected: "#445599",
      all: "#995544",
    };
  }

  buildChart(renew = false) {
    if (this.grahaStrengthSet instanceof Object) {
      const showKeys = [...this.selected, ...this.averageKeys];
      if (renew) {
        this.chartData.datasets = [];
      }
      Object.entries(this.grahaStrengthSet).forEach((entry, entryIndex) => {
        const [key, values] = entry;
        //const numGrahas = this.orderKeys.length;
        if (values instanceof Array) {
          let label = key;
          if (key.length === 2) {
            const lex = this.dictionary.graha(key);
            if (lex) {
              label = lex.text("en");
            }
          }
          const data = values.map((v) => v.strength * 60);
          if (data.length > 1) {
            const ls = {
              label,
              hidden: !showKeys.includes(key),
              borderColor: this.colorMap[key],
              borderWidth: key.length > 2 ? 4 : 2,
              backgroundColor: "transparent",
              data,
            };
            if (renew) {
              this.chartData.datasets.push(ls);
            } else {
              this.chartData.datasets[entryIndex] = ls;
            }
          }
        }
      });
      this.chartData.labels = this.chartData.datasets[0].data.map((s, i) =>
        (i + 1).toString()
      );
      if (!this.init) {
        this.triggerSwitch();
      }
      setTimeout(() => {
        this.init = true;
      }, 2000);
    }
  }

  fetchSettings() {
    const objectKey = "graha__drishti";
    const signItems = this.$ls.get(objectKey);
    const validItems = signItems instanceof Array && signItems.length > 0;
    if (validItems) {
      this.mapAspects(signItems);
    } else {
      fetchSetting(objectKey).then((data) => {
        if (data.value instanceof Array) {
          this.mapAspects(data.value);
          this.$ls.set(objectKey, data.value);
        }
      });
    }
  }

  mapAspects(items: Array<any>) {
    this.signValueSets = new Map<string, Array<number>>();
    items.forEach((vs) => {
      if (vs instanceof Object) {
        const { key, aspects } = vs;
        if (aspects instanceof Array) {
          this.signValueSets.set(key, aspects);
        }
      }
    });
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

  getGrahas() {
    const grahas = [
      this.c1.ascendantGraha,
      ...this.c1.bodies.filter((g) => this.coreBodies.includes(g.key)),
    ];
    return grahas.map((gr) => {
      gr.setAyanamshaItem(this.ayanamsha);
      return gr;
    });
  }

  get options() {
    return {
      animation: {
        easing: "easeInOutElastic",
        duration: this.init ? 500 : 0,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              min: 0,
              max: 60,
            },
            gridLines: {
              display: true,
            },
            radius: 0,
          },
        ],
        xAxes: [
          {
            ticks: {
              display: false,
            },
            gridLines: {
              display: false,
            },
            radius: 0,
          },
        ],
      },
      legend: {
        display: false,
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      responsive: true,
      maintainAspectRatio: true,
      tooltips: {
        mode: "index",
        callbacks: {
          label: function (tooltipItem, data) {
            const label = data.datasets[tooltipItem.datasetIndex].label || "";
            const valLabel = tooltipItem.yLabel.toFixed(3);
            return [label, valLabel].join(": ");
          },
          title: function (item) {
            let str = "";
            if (item instanceof Array && item.length > 0) {
              const first = item.slice(0, 1)[0];
              if (first instanceof Object) {
                const degree = parseInt(first.xLabel);
                const sign = Math.floor(degree / 30) + 1;
                const degStr = [degree, "º"].join("");
                const rashi = rashiValues.find((rv) => rv.num === sign);
                const signVal = rashi instanceof Object ? rashi.icon : sign;
                str = [degStr, signVal].join(" ");
              }
            }
            return str;
          },
        },
      },
      scaleShowLabels: false,
    };
  }

  backdropClasses(index = 0) {
    const oddEven = index % 2 === 0 ? 'odd' : 'even';
    const cls = [oddEven, ['column-', (index+1)].join('-')];
    return cls;
  }

  triggerSwitch(timeout = 100) {
    this.switching = true;
    setTimeout(() => {
      this.switching = false;
    }, timeout);
  }

  @Watch("selected")
  changeSelected(newVal) {
    this.triggerSwitch(50);
    const selectedIndices = this.orderKeys.map((key, index) => {
      return {
        key,
        index,
        hidden: !newVal.includes(key),
      };
    });
    if (newVal.length < 2) {
      const selIndex = this.averageKeys.indexOf("selected");
      if (selIndex >= 0) {
        this.averageKeys.splice(selIndex, 1);
      }
    }
    if (this.averageKeys.includes("selected")) {
      this.mergeData(false);
    } else {
      selectedIndices.forEach((item) => {
        this.chartData.datasets[item.index].hidden = item.hidden;
      });
    }
  }

  @Watch("averageKeys")
  changeAverages() {
    this.triggerSwitch(50);
    this.mergeData(false);
  }

  @Watch("mode")
  changeMode() {
    this.triggerSwitch(100);
    this.mergeData(false);
  }

  @Watch("ownMode")
  changeOwnMode() {
    this.triggerSwitch(100);
    this.mergeData(true, true);
  }

  @Watch("chart")
  changeChart(newVal) {
    if (newVal instanceof Chart) {
      this.triggerSwitch(200);
      this.c1 = deepClone(newVal);
      this.mergeData(true, true);
    }
  }

  @Watch("chart2")
  changeChart2(newVal) {
    if (newVal instanceof Chart) {
      this.triggerSwitch();
      this.c2 = deepClone(newVal);
      this.mergeData(true, true);
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
    this.mergeData(true, true);
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
        "GrahaDrishti",
        this.paneIndex,
        "vargaNum",
        newVal
      );
      this.mergeData(true, true);
    }
  }
}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

#main .graha-drishti-chart {
  background-color: white;

  .b-checkbox + .checkbox,
  .b-radio + .radio {
    margin-left: 0;
  }
  .line-overlay,
  .chart-container {
    position: absolute;
    top: 6.5em;
    bottom: 1.625em;
  }
  .chart-container {
    left: 3.75%;
    right: 6.25%;
    z-index: 20;
    canvas {
      max-height: 100%;
    }
  }
  .line-overlay {
    left: 9.275%;
    right: 6.25%;
    display: flex;
    flex-flow: row nowrap;

    .sign-bg {
      margin: 0.3125em 0 0.4375em 0;
      width: calc(100% / 12);
      &.even {
        background-color: rgba($light-fg, 0.125);
      }
      &.odd {
        background-color: white;
      }
    }

    .graha-line {
      position: absolute;
      top: 0.3125em;
      bottom: 0.4375em;
      width: 1px;
      margin-left: -0.5px;
      border-right: dashed 1px rgba($medium-grey, 0.25);
    }
  }

  .graha-markers {
    position: absolute;
    top: 5.5em;
    left: 8.125%;
    right: 6%;
    height: 1em;
    i.icon {
      display: block;
      position: absolute;
      bottom: 0;
      width: 1em;
      height: 1em;
      margin-left: -0.5em;
      transform: scale(0.75);
    }
    &.functional i.functional-benefic,
    &.natural i.natural-benefic {
      color: $benefic-rgb;
    }
    &.functional i.functional-malefic,
    &.natural i.natural-malefic {
      color: $malefic-rgb;
    }
  }

  .sign-labels {
    bottom: 0;
    width: 92.5%;
    padding-left: 9.275%;
    sup,
    .icon {
      transform: scale(0.8);
    }
    li:nth-child(even) {
      i::before,
      sup {
        color: $medium-grey;
      }
    }
  }
  .control-row {
    margin-top: 0.25em;
    display: flex;
    flex-flow: row nowrap;
    &.graha-row {
      font-size: 0.9em;
      justify-content: center;
      padding: 0 2.5% 0 7.5%;
      .b-checkbox.checkbox {
        transform: scale(0.8);
        .control-label {
          padding: 0 0 0 0.25em;
          width: 1em;
          .icon {
            width: 1em;
          }
        }
        margin-right: 0.125em;
      }
    }
  }
  .select-area {
    display: grid;
    font-size: 0.8em;
    margin: 0 7.5% 0 10%;
    &.select-row {
      grid-template-columns: 1fr;
    }
    .control-label {
      font-size: 0.9em;
    }
  }
  .select-grid {
    grid-template-columns: 2fr 1fr;

    .avg-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 0;
    }
    .avg-row,
    .select-row,
    .mode-column {
      label {
        max-height: 1em;
      }
    }
    .mode-column label:first-child {
      padding-top: 0.625em;
    }
  }
}

.expanded {
  .graha-drishti-chart {
    .line-overlay {
      left: 6.55%;
      right: 6.15%;
      .sign-bg {
        margin: 0.15625em 0 0.21875em 0;
      }
      .sign-labels {
        padding-left: 6.55%;
      }
      .graha-line {
        top: 0.15625em;
        bottom: 0.21875em;
      }
    }
  }
}

</style>