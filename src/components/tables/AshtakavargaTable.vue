<template>
  <GridItem class="ashtakavarga-table" :index="paneIndex" :chart="chart" :chart2="chart2">
    <h4>{{ mainLabel }}</h4>
    <div class="compact-listing widget" :class="widgetClasses">
      <b-tabs v-model="activeTab">
        <b-tab-item label="Table">
          <b-table
            v-if="hasBodies && showColumns"
            :data="getBodyTable()"
            :row-class="(row, index) => assignRowClasses(row, index)"
            :mobile-cards="false"
          >
            <template slot-scope="props">
              <b-table-column
                class="graha x-axis"
                :class="props.row.key"
                field="name"
                label
              >
                <i
                  v-if="props.row.key !== 'total'"
                  class="icon"
                  :class="props.row.key | toGrahaClass"
                ></i>
                <span v-else class="name">{{ props.row.key }}</span>
              </b-table-column>
              <b-table-column
                v-for="(item, vi) in props.row.values"
                :key="
                  ['ashtaka', vi, props.index, item.house, item.sign].join('-')
                "
                class="value"
                :class="props.row.key"
                :header-class="['sign-col', item.sign].join('-')"
                :field="item.sign.toString()"
                :label="item.sign.toString()"
              >
                <template slot="header" slot-scope="{ column }">
                  <i
                    class="icon"
                    :class="matchSignClass(vi)"
                    :rel="column.label"
                  ></i>
                  <sup>{{ matchHouseNum(vi) }}</sup>
                </template>
                {{ item.value }}
              </b-table-column>
              <b-table-column
                class="total"
                :class="props.row.key"
                field="total"
                label="Total"
                >{{ calcRowTotal(props.row.values) }}</b-table-column
              >
            </template>
          </b-table>
        </b-tab-item>
        <b-tab-item label="Bar Chart">
          <div class="chart-container-bg"></div>
          <bar-chart
            :chart-data="chartData"
            :options="options"
            class="chart-container"
          />

          <ul class="sign-labels">
            <li v-for="item in signHouseMap" :key="item.key">
              <i class="icon" :class="item.sign | toSignClass"></i>
              <sup>{{ item.house }}</sup>
            </li>
          </ul>
        </b-tab-item>
        <b-tab-item label="SC Cakra">
          <div class="cs-cakra">
            <div class="inner" :style="dialAngleStyle">
              <div
                v-for="(g, gi) in grahaPositions"
                :key="['gr', g.key, gi].join('-')"
                class="graha-symbol symbol"
                :style="g.style"
              >
                <i class="icon" :class="g.key | toGrahaClass"></i>
              </div>
              <div
                v-for="(g, gi) in signPositions"
                :key="['gr', g.key, gi].join('-')"
                class="sign-symbol symbol"
                :style="g.style"
              >
                <i class="icon" :class="g.num | toSignClass"></i>
              </div>
              <div
                v-for="(g, gi) in housePositions"
                :key="['gr', g.key, gi].join('-')"
                class="house-num symbol"
                :style="g.style"
              >
                {{ g.house }}
              </div>
              <span
                v-for="outer in getAllTables()"
                :key="['outer', 'set', outer.sign].join('-')"
                class="outer-set"
                :class="['sign', outer.sign].join('-')"
              >
                <span
                  v-for="outerSet in outer.values"
                  :key="['subset', outerSet.key].join('-')"
                  class="inner-set"
                  :class="outerSet.key"
                >
                  <template v-for="innerSet in outerSet.values">
                    <div
                      v-if="innerSet.value > 0"
                      :key="['inner-dot', innerSet.key].join('-')"
                      class="dot"
                      :title="innerSet.value"
                      :class="innerSet.key"
                      :style="innerSet.style"
                    ></div>
                  </template>
                  <div
                    class="total small set-total"
                    :class="outerSet.key"
                    :style="outerSet.style"
                  >
                    {{ outerSet.total }}
                  </div>
                </span>
                <div
                  class="total large sign-total"
                  :class="outer.sign"
                  :style="outer.style"
                >
                  {{ outer.total }}
                </div>
              </span>
            </div>
          </div>
          <div class="back" @click="toPrevTab">
            <b-icon icon="keyboard-return" />
          </div>
        </b-tab-item>
      </b-tabs>
      <nav v-if="showTopTabs" class="tabs top first">
        <ol class="set-nav horizontal-all">
          <li
            v-for="(tab, tabIndex) in modeTabs"
            :key="['tab', tabIndex].join('-')"
            @click="setActiveMode(tab.key)"
            :class="activeModeClass(tab.key, tab.name)"
            :title="tab.title"
          >
            {{ tab.name }}
          </li>
        </ol>
      </nav>
      <nav v-if="showGrahaTabs" class="tabs top second">
        <ol class="set-nav horizontal-all">
          <li
            v-for="(tab, tabIndex) in tableTabs"
            :key="['tab', tabIndex].join('-')"
            @click="switchSet(tab.key)"
            :class="grahaTabClasses(tab.key)"
            :title="tab.name"
          >
            <i class="icon" :class="tab.key | toGrahaClass"></i>
          </li>
        </ol>
      </nav>
      <div class="actions bottom">
        <ul v-if="showLegend && showBottomActions" class="options legend-tabs">
          <li @click="toggleSecond" class="show-first">
            <em class="red rectangle"></em>
            <span :title="firstLegend">{{ firstLegendAbbr }}</span>
          </li>
          <li @click="toggleFirst" class="show-second">
            <em class="blue rectangle"></em>
            <span :title="secondLegend">{{ secondLegendAbbr }}</span>
            <i class="icon" :class="grahaSetKey | toGrahaClass"></i>
          </li>
        </ul>
        <b-button
          v-if="showBottomActions"
          @click="setActiveTab(0)"
          :class="selectedTabClass(0, 'left')"
          >Bav Table</b-button
        >
        <b-button
          v-if="showBottomActions"
          @click="setActiveTab(1)"
          :class="selectedTabClass(1, 'right')"
          >Bav Graph</b-button
        >
        <div v-if="showBottomActions" class="options bindu-set left">
          <b-radio v-model="binduSet" native-value="default">Parāśara</b-radio>
          <b-radio v-model="binduSet" native-value="vm">Varāhamihira</b-radio>
        </div>
        <div
          v-if="showBottomActions && showFirstModeSwitch"
          class="options first-mode right"
        >
          <b-radio v-model="firstMode" native-value="house"
            >Asc. (lagna)</b-radio
          >
          <b-radio v-model="firstMode" native-value="sign">
            1st sign
            <i class="icon icon-sign-1"></i>
          </b-radio>
        </div>
      </div>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { DictionaryState, SettingState } from "../../store/types";
import { Graha } from "../../api/models/Graha";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import SignDegree from "../widgets/SignDegree.vue";
import { Chart, combineCharts, fetchCurrentTimespace } from "../../api/models/Chart";
import {
  AshtakaCell,
  AshtakaCellSet,
  SignValue,
} from "../../api/interfaces";
import {
  calcInclusiveTwelfths,
  subtractSign,
  plotOnCircle,
  renderOffsetStyle,
  deepClone,
} from "../../api/helpers";
import AshtakavargaValues from "../../api/mappings/ashtakavarga-values";
import GridItem from "../widgets/GridItem.vue";
import BarChart from "../charts/BarChart";
import { loopShift, loopShiftInner, toSignValues } from "../../api/helpers";
import vargaValues from "../../api/mappings/varga-values";

@Component({
  filters: FilterSet,
  components: {
    SignDegree,
    GridItem,
    BarChart,
  },
})
export default class AshtakavargaTable extends Vue {
  @State("dictionary") dictionary: DictionaryState;
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @State("settings") settings: SettingState;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: "" }) context: string;

  private ch: Chart;

  private singleMode = 1;

  private singleComposite = true;

  private grahaSetKey = "sa";

  private activeTab = 0;

  private activeMode = "single";

  private prevMode = "single";

  private prevTab = 0;

  private vargaNum = 1;

  private firstMode = "sign";

  private binduSet = "default";

  private showFirst = true;

  private showSecond = true;

  private showColumns = true;

  created() {
    this.sync(true);
  }

  sync(init = false) {
    if (this.chart instanceof Chart) {
      switch (this.singleMode) {
        case 1:
          this.ch = deepClone(this.chart);
          break;
        case 2:
          if (this.hasC2) {
            this.ch = deepClone(this.chart2);
          }
          break;
        case 3:
          if (this.hasC2) {
            this.ch = combineCharts(this.chart, this.chart2, this.ayanamsha);
          }
          break;
        case 4:
          if (this.hasC2) {
            this.ch = fetchCurrentTimespace();
          }
          break;
      }
      this.ch.setAyanamshaItem(this.ayanamsha);
      if (!init) {
        setTimeout(() => {
          this.refresh();
      }, 500);
      }
    }
  }

  mounted() {
    setTimeout(() => {
      if (this.ayanamsha.num > 0) {
        this.refresh();
      }
    }, 500);
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get hasC2() {
    return this.chart2 instanceof Chart && this.chart2.grahas.length > 0;
  }

  get options() {
    const yAxes = [
      {
        position: this.dualMode ? "right" : "left",
        ticks: {
          beginAtZero: true,
          stepSize: this.allMode ? 8 : 1,
          min: 0,
          max: this.maxYScale,
          fontColor: this.dualMode
            ? "rgba(0,0,204,0.75)"
            : "rgba(204,0,0,0.75)",
        },
        gridLines: {
          display: true,
        },
      },
    ];
    if (this.dualMode) {
      yAxes.unshift({
        position: "left",
        ticks: {
          beginAtZero: true,
          stepSize: 8,
          min: 0,
          max: 64,
          fontColor: "rgba(204,0,0,0.75)",
        },
        gridLines: {
          display: false,
        },
      });
    }
    return {
      animation: {
        easing: "easeOutBack",
        duration: 750,
      },
      maintainAspectRatio: false,
      aspectRatio: 2,
      scales: {
        yAxes,
        xAxes: [
          {
            position: "bottom",
            gridLines: {
              display: false,
            },
          },
        ],
      },
      legend: {
        display: false,
      },
      responsive: true,
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            const label = data.datasets[tooltipItem.datasetIndex].label || "";

            const valLabel =
              tooltipItem.datasetIndex === 1 && data.datasets.length > 1
                ? tooltipItem.yLabel / 8
                : tooltipItem.yLabel;
            return [label, valLabel].join(": ");
          },
        },
      },
    };
  }

  get hasBodies(): boolean {
    return this.ch instanceof Chart && this.ch.grahas.length > 0;
  }

  get tabKeys() {
    return ["sa", "ju", "ma", "su", "ve", "me", "mo", "as", "ra", "ke"];
  }

  get signs() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  get esSigns() {
    return this.signs.filter((s) => [4, 5].includes(s) === false);
  }

  matchSignsInElement(sign = 0) {
    const mod = sign % 4;
    return this.signs.filter((s) => s % 4 === mod);
  }

  get signElementMap() {
    return [
      { element: "fire", mod: 1 },
      { element: "earth", mod: 2 },
      { element: "air", mod: 3 },
      { element: "water", mod: 0 },
    ];
  }

  get comboModes() {
    return ["all", "ts", "es"];
  }

  get isComboMode() {
    return this.comboModes.includes(this.activeMode);
  }

  get greyedKeys() {
    return ["ra", "ke"];
  }

  get showGrahaTabs() {
    return ["single"].includes(this.activeMode);
  }

  get hasLegend() {
    return this.activeMode === "single";
  }

  get dualMode() {
    return this.activeMode === "single"; // bav
  }

  get allMode() {
    return this.activeMode === "all"; // sav
  }

  get showLegend() {
    return this.dualMode && this.activeTab === 1;
  }

  get dialAngleStyle() {
    return "transform:rotate(" + this.dialAngle + "deg)";
  }

  get dialAngle() {
    return 360 - Math.floor(this.ch.lagna / 30) * 30 - 15;
  }

  get showTopTabs(): boolean {
    return this.activeMode !== "csc";
  }

  get signPositions() {
    return this.signs.map((s) => {
      const signDeg = s * 30 - 15;
      const { x, y } = plotOnCircle(18, signDeg);
      const degOffset = 0 - this.dialAngle;
      const style = renderOffsetStyle(x, y, degOffset);
      return {
        num: s,
        style,
        deg: signDeg - 15,
        x,
        y,
      };
    });
  }

  get grahaPositions() {
    const signMap = new Map<number, number>();
    const items = this.getBodies().map((gr) => {
      const { longitude, key, sign } = gr;
      const signDeg = Math.floor(longitude / 30) * 30 + 15;

      const index = signMap.has(sign) ? signMap.get(sign) : 0;
      const num = index + 1;
      signMap.set(sign, num);
      return {
        key,
        longitude,
        sign,
        signDeg,
        num,
      };
    });
    return items.map((gr) => {
      const { key, longitude, sign, signDeg, num } = gr;
      const numInSign = signMap.get(sign);
      const offset = (num / numInSign) * 25 - 18.75;
      const { x, y } = plotOnCircle(24.5, signDeg + offset);
      const degOffset = 0 - this.dialAngle;
      const style = renderOffsetStyle(x, y, degOffset);
      return {
        key,
        longitude,
        sign,
        style,
        numInSign,
      };
    });
  }

  get housePositions() {
    return this.signHouseMap.map((s) => {
      const deg = s.sign * 30 - 15;
      const { x, y } = plotOnCircle(11, deg);
      const degOffset = 0 - this.dialAngle;
      const style = renderOffsetStyle(x, y, degOffset);
      return { ...s, deg, style };
    });
  }

  get widgetClasses() {
    const cls = [this.activeMode, this.grahaSetKey];
    if (this.showGrahaTabs) {
      cls.push("show-second-tabs");
    }
    if (this.hasLegend) {
      cls.push("bottom-legend");
    }
    switch (this.activeTab) {
      case 0:
        cls.push("show-table");
        break;
      case 1:
        cls.push("show-chart");
        break;
      case 2:
        cls.push("show-dial");
        break;
    }
    if (this.dualMode) {
      cls.push("dual-mode");

      if (!this.showFirst) {
        cls.push("first-off");
      }
      if (!this.showSecond) {
        cls.push("second-off");
      }
    }
    return cls;
  }

  get tableTabs() {
    return this.tabKeys.map((key) => {
      return {
        key,
        name: this.dictionary.graha(key).text("en", "standard"),
      };
    });
  }

  get maxYScale() {
    switch (this.activeMode) {
      case "all":
        return 64;
      case "ts":
      case "es":
        return 48;
      default:
        return 8;
    }
  }

  get modeTabs() {
    return [
      {
        name: "SAV",
        title: this.dictionary.text("bala", "av_sav_0"),
        key: "all",
      },
      {
        name: "BAV",
        title: this.dictionary.text("bala", "av_bav_0"),
        key: "single",
      },
      {
        name: "TS",
        title: this.dictionary.text("bala", "av_shod_trikona"),
        key: "ts",
      },
      {
        name: "EŚ",
        title: this.dictionary.text("bala", "av_shod_ekadhi"),
        key: "es",
      },
      {
        name: "ŚP",
        title: this.dictionary.text("bala", "av_shod_pinda"),
        key: "sp",
      },
      {
        name: "S.C. Cakra",
        title: this.dictionary.text("bala", "av_chakra"),
        key: "csc",
      },
    ];
  }

  getBodies(): Array<Graha> {
    const gks = this.tabKeys;
    const bodies = [
      this.ch.ascendantGraha,
      ...this.ch.bodies.filter((b) => gks.includes(b.key)),
    ];
    bodies.sort((a, b) => gks.indexOf(a.key) - gks.indexOf(b.key));
    bodies.forEach((gr) => {
      gr.setAyanamshaItem(this.ayanamsha);
      gr.setVarga(this.vargaNum);
    });
    return bodies;
  }

  get chartData() {
    const source = this.getBodyTable();
    let datasets: Array<any> = [];
    let labels: Array<string> = [];
    if (source instanceof Array) {
      if (source.length > 3) {
        const multiplier = this.dualMode ? 8 : 1;
        const data = source[source.length - 1].values.map(
          (p) => p.value * multiplier
        );
        const backgroundColor =
          this.activeMode !== "all"
            ? "rgba(0,0,204,0.75)"
            : "rgba(204,0,0,0.75)";
        const first = {
          label: this.modeTabs.find((t) => t.key === "single").name,
          pointBackgroundColor: "transparent",
          barPercentage: this.fracFirst,
          borderWidth: 1,
          backgroundColor,
          data,
        };
        labels = data.map((s, i) => (i + 1).toString());
        datasets = [first];

        if (this.activeMode === "single") {
          const sourceTotals = this.getBodyTable(true);
          const dataTotals = sourceTotals[sourceTotals.length - 1].values.map(
            (p) => p.value
          );
          const label = this.modeTabs.find((t) => t.key === "all").name;
          const second = {
            label,
            barPercentage: this.fracSecond,
            borderWidth: 0,
            backgroundColor: "rgba(204,0,0,0.75)",
            data: dataTotals,
          };
          datasets.unshift(second);
        }
      }
    }
    return {
      labels,
      datasets,
    };
  }

  get showBottomActions() {
    switch (this.activeTab) {
      case 2:
        return false;
      default:
        return true;
    }
  }

  get firstLegend() {
    return this.modeTabs.find((t) => t.key === "all").title;
  }

  get secondLegend() {
    return this.modeTabs.find((t) => t.key === "single").title;
  }

  get firstLegendAbbr() {
    return this.modeTabs.find((t) => t.key === "all").name;
  }

  get secondLegendAbbr() {
    return this.modeTabs.find((t) => t.key === "single").name;
  }

  get signHouseMap() {
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
        values.findIndex((v) => v.sign === this.ch.firstHouseSign)
      );
    }
    return values;
  }

  get showFirstModeSwitch() {
    switch (this.activeMode) {
      case "csc":
        return false;
      default:
        return true;
    }
  }

  get tableSet() {
    const table = AshtakavargaValues.find((t) => t.key === this.grahaSetKey);
    if (table) {
      return table;
    } else {
      return {
        key: "",
        values: [],
      };
    }
  }

  get fracFirst() {
    return this.showFirst ? (this.showSecond ? 1 : 2) : 0;
  }

  get fracSecond() {
    return this.showSecond ? (this.showFirst ? 1 : 2) : 0;
  }

  get vargaOptions() {
    return vargaValues.map((item) => {
      const { key, num } = item;
      return {
        key: num,
        name: key.toUpperCase(),
      };
    });
  }

  get hasColumns() {
    return this.ch.firstHouseSign > 0 && this.showColumns;
  }

  toggleFirst() {
    this.showFirst = !this.showFirst;
  }

  toggleSecond() {
    this.showSecond = !this.showSecond;
  }

  setActiveTab(index: number) {
    this.activeTab = index;
  }

  toPrevTab() {
    this.activeTab = this.prevTab;
    this.activeMode = this.prevMode;
  }

  setActiveMode(mode: string) {
    this.activeMode = mode;
  }

  selectedTabClass(index: number, alignClass = "left") {
    const cls = [alignClass];
    const contextualIndex = this.activeTab === 3 ? 0 : this.activeTab;
    if (contextualIndex === index) {
      cls.push("active");
    }
    return cls;
  }

  matchHouse(sign: number | string) {
    if (typeof sign === "string") {
      sign = parseInt(sign);
    }
    if (sign >= 4) {
      sign += 2;
    }
    return calcInclusiveTwelfths(this.ch.firstHouseSign, sign);
  }

  matchSignNum(index: number) {
    let sign = 0;
    if (this.firstMode === "house") {
      const hs = 0 - this.ch.firstHouseSign;
      sign = subtractSign(index, hs + 1) + 1;
    } else {
      sign = index + 1;
    }
    return sign;
  }

  matchSignClass(index: number) {
    const sign = this.matchSignNum(index);
    return ["icon-sign", sign.toString()].join("-");
  }

  matchHouseNum(index: number) {
    if (this.firstMode === "house") {
      return (index + 1).toString();
    } else {
      return this.matchHouse(index + 1).toString();
    }
  }

  getBodyTable(fetchAll = false): Array<AshtakaCell> {
    const fetchTotals = fetchAll || this.isComboMode;

    const exGrahas = fetchTotals
      ? this.allMode
        ? this.greyedKeys
        : this.greyedKeys
      : [];
    let rows = this.hasColumns
      ? this.getBodies()
          .filter((gr) => exGrahas.includes(gr.key) === false)
          .map((gr) => {
            const values = fetchTotals
              ? this.getBodyRowTotals(gr)
              : this.getBodyRow(gr);
            return {
              sign: gr.sign,
              key: gr.key,
              set: this.grahaSetKey,
              values,
            };
          })
          .filter((row) => row.values.length > 0)
      : [];
    this.addColumnTotals(rows);

    if (this.activeMode === "es") {
      rows = this.recalcEsBodyTable(rows);
    }

    if (this.firstMode === "house") {
      return rows.map((set) => {
        set.values = loopShift(
          set.values,
          set.values.findIndex((v) => v.sign === this.ch.firstHouseSign)
        );
        return set;
      });
    } else {
      return rows;
    }
  }

  getAllTables(): Array<AshtakaCellSet> {
    const exGrahas = this.greyedKeys;
    const coreBodies = this.getBodies().filter(
      (gr) => exGrahas.includes(gr.key) === false
    );
    const rows = coreBodies.map((outer) => {
      const values = coreBodies
        .map((gr) => {
          const values = this.getBodyRow(gr, outer.key);
          return {
            sign: gr.sign,
            key: gr.key,
            set: this.grahaSetKey,
            values,
          };
        })
        .filter((row) => row.values.length > 0);
      return {
        key: outer.key,
        values,
      };
    });
    const signSets: Array<AshtakaCellSet> = [];
    for (let si = 0; si < 12; si++) {
      const totMap = new Map<string, number>();
      const values = rows.map((outer, oi) => {
        const innerVals = outer.values.map((set, gi) => {
          const deg = si * 30 + (oi + 0.5) * (30 / 8);
          const radius = 47 - gi * 1.825;
          const { x, y } = plotOnCircle(radius, deg, -0.625, -0.625);
          const { value } = set.values[si];
          if (value > 0) {
            const tot = totMap.has(outer.key) ? totMap.get(outer.key) : 0;
            totMap.set(outer.key, tot + 1);
          }
          return {
            key: set.key,
            value,
            style: renderOffsetStyle(x, y),
          };
        });
        const deg = si * 30 + (oi + 0.5) * (30 / 8);
        const { x, y } = plotOnCircle(32, deg);
        return {
          key: outer.key,
          values: innerVals,
          total: 0,
          style: renderOffsetStyle(x, y, 0 - this.dialAngle),
        };
      });
      values.forEach((set) => {
        set.total = totMap.get(set.key);
        return set;
      });
      const { x, y } = plotOnCircle(29.25, si * 30 + 15);
      const signSet = {
        sign: si + 1,
        values,
        total: values.map((ov) => ov.total).reduce((a, b) => a + b, 0),
        style: renderOffsetStyle(x, y, 0 - this.dialAngle),
      };
      signSets.push(signSet);
    }
    return signSets;
  }

  getBodyRowTotals(graha: Graha) {
    const keys = this.tabKeys.filter(
      (k) => this.greyedKeys.includes(k) === false
    );
    let row: Array<SignValue> = [];
    keys.forEach((key, keyIndex) => {
      const matchedGraha = this.getBodies().find((gr) => gr.key === key);
      const br = this.getBodyRow(matchedGraha, graha.key);
      if (keyIndex === 0) {
        row = br;
      } else {
        row = row.map((item, itemIndex) => {
          item.value = item.value + br[itemIndex].value;
          return item;
        });
      }
    });
    if (this.activeMode === "ts" || this.activeMode === "es") {
      row = this.recalcTrikonaSodhana(row);
    }
    return row;
  }

  addColumnTotals(rows: Array<AshtakaCell>) {
    if (rows.length > 0) {
      if (rows[0] instanceof Object) {
        const firstRow = rows[0].values;
        const totals = firstRow.map((r, ri) => this.calcColumnTotal(rows, ri));
        const values = toSignValues(totals, this.ch.firstHouseSign);
        rows.push({
          sign: 0,
          key: "total",
          set: this.grahaSetKey,
          values,
        });
      }
    }
  }

  recalcEsBodyTable(rows: Array<AshtakaCell>) {
    const esPairs = [
      [1, 8],
      [3, 6],
      [9, 12],
      [2, 7],
      [10, 11],
    ];
    const signPlanets = new Map<number, Array<string>>();
    const corePlanets = ["su", "mo", "me", "ve", "ma", "ju", "sa"];
    this.esSigns.forEach((s) => {
      signPlanets.set(s, []);
    });
    this.getBodies()
      .filter((body) => corePlanets.includes(body.key))
      .forEach((body) => {
        const planetKeys = signPlanets.has(body.sign)
          ? signPlanets.get(body.sign)
          : [];
        planetKeys.push(body.key);
        signPlanets.set(body.sign, planetKeys);
      });
    //const esGrahaRows = ["as", "su", "mo", "ma", "me", "ju", "ve", "sa"];
    const esGrahaRows = ["sa", "ju", "ma", "su", "ve", "me", "mo", "as"];
    const newRows = esGrahaRows
      .map((key) => {
        const row = rows.find((r) => r.key === key);
        let esValues: Array<SignValue> = [];
        if (row) {
          esValues = esPairs
            .map((pair) => {
              const signs = row.values.filter((rv) => pair.includes(rv.sign));
              const planetCounts = pair.map((s) => signPlanets.get(s).length);
              const numSignsZeroBindu = signs.filter((rv) => rv.value === 0)
                .length;
              const numWithZeroPlanets = planetCounts.filter((pc) => pc === 0)
                .length;
              const planetCountZeroIndex = planetCounts.findIndex(
                (pc) => pc === 0
              );
              const emptySignIndex = signs.findIndex((rv) => rv.value === 0);
              const oneSignHasPlanets = numWithZeroPlanets === 1;
              const lowestSignIndex = signs[0].value > signs[1].value ? 1 : 0;
              const signsEqual = signs[0].value === signs[1].value;
              const highestSignIndex = lowestSignIndex > 0 ? 0 : 1;
              const keepTS =
                numSignsZeroBindu === 1 || numWithZeroPlanets === 2;
              if (!keepTS) {
                if (oneSignHasPlanets) {
                  if (signsEqual) {
                    signs[planetCountZeroIndex].value = 0;
                  } else if (emptySignIndex === lowestSignIndex) {
                    signs[lowestSignIndex].value = 0;
                  } else {
                    const notEmptySignIndex = emptySignIndex === 0 ? 1 : 0;
                    signs[notEmptySignIndex].value = 2;
                  }
                } else if (numWithZeroPlanets === 2) {
                  if (signsEqual) {
                    signs[0].value = 0;
                    signs[1].value = 0;
                  } else {
                    signs[highestSignIndex].value =
                      signs[lowestSignIndex].value;
                  }
                }
              }
              return signs;
            })
            .reduce((a, b) => [...a, ...b], []);
        }

        row.values = row.values.map(rv => {
          if (this.esSigns.includes(rv.sign)) {
            return esValues.find((irv) => irv.sign === rv.sign);
          } else {
            return rv;
          }
        });
        return row;
      })
      .filter((r) => r instanceof Object);
    this.addColumnTotals(newRows);
    return newRows;
  }

  recalcTrikonaSodhana(row: Array<SignValue>) {
    const signSetVals = [...row];
    const elementMap = this.signElementMap.map((er) => {
      const siblings = row
        .filter((rv) => rv.sign % 4 === er.mod)
        .map((rv) => Object.assign({}, rv));
      return { ...er, siblings };
    });

    return signSetVals.map(signSet => {
      // other sign values in the same element
      //const siblings = this.matchSignsInElement(signSet.sign);
      const elementSet = elementMap.find((em) => em.mod === signSet.sign % 4);
      if (elementSet) {
        const siblingVals = elementSet.siblings.map((s) => s.value);
        const min = Math.min(...siblingVals);
        const numZeros = siblingVals.filter((s) => s === 0).length;
        let tsVal = signSet.value - min;
        if (numZeros === 2) {
          tsVal = 0;
        } else if (
          siblingVals[0] === siblingVals[1] &&
          siblingVals[0] === siblingVals[2]
        ) {
          tsVal = 0;
        } else if (numZeros === 1) {
          tsVal = signSet.value;
        }
        signSet.value = tsVal;
      }
      return signSet;
    });
  }

  getBodyRow(graha: Graha, tableKey = ""): Array<SignValue> {
    let values: Array<SignValue> = [];
    const tableSet =
      tableKey.length == 2
        ? AshtakavargaValues.find((tv) => tv.key === tableKey)
        : this.tableSet;
    if (tableSet) {
      if (tableSet.values instanceof Array) {
        const gv = tableSet.values.find((rv) => rv.key === graha.key);

        if (gv) {
          const binduVals =
            this.binduSet === "vm" && gv.ex === true ? gv.vm : gv.bindu;
          const innerVals = loopShiftInner(
            toSignValues(binduVals),
            graha.sign - 1
          );
          values = loopShift(
            innerVals,
            innerVals.findIndex((p) => p.sign === 1)
          );
        }
      }
    }
    return values;
  }

  calcRowTotal(row: Array<SignValue>): number {
    return row.map((p) => p.value).reduce((a, b) => a + b, 0);
  }

  calcColumnTotal(rows: Array<AshtakaCell>, index: number): number {
    return rows
      .filter(
        (row) =>
          row.values.length > index &&
          this.greyedKeys.includes(row.key) === false
      )
      .map((row) => row.values[index].value)
      .reduce((a, b) => a + b, 0);
  }

  get mainLabel(): string {
    return this.dictionary.text("bala", "av_0");
  }

  signLabel(index: number) {
    return (index + 1).toString();
  }

  switchSet(key: string) {
    this.grahaSetKey = key;
  }

  grahaTabClasses(key: string) {
    const cls = [key];
    if (this.grahaSetKey === key) {
      cls.push("active");
    }
    if (this.greyedKeys.includes(key)) {
      cls.push("greyed");
    }
    return cls;
  }

  activeModeClass(key: string, name = "") {
    const cls = [key];
    if (this.activeMode === key) {
      cls.push("active");
    }
    if (name.length > 3) {
      cls.push("long");
    }
    return cls;
  }

  grahaName(key: string) {
    let str = key;
    const lex = this.dictionary.graha(key);
    if (lex) {
      str = lex.text("en");
    }
    return str;
  }

  grahaNames(keys: Array<string> = []) {
    return keys.map((key) => this.grahaName(key)).join(", ");
  }

  assignRowClasses(row: Graha, index: number) {
    const cls = [["index", index].join("-"), ["graha", row.key].join("-")];
    if (this.greyedKeys.includes(row.key)) {
      cls.push("greyed");
    }
    return cls;
  }

  updateGrahas() {
    this.ch.setVarga(this.vargaNum);
    this.ch.setAyanamshaItem(this.ayanamsha);
    this.getBodies().forEach((gr) => {
      gr.setAyanamshaItem(this.ayanamsha);
      gr.setVarga(this.vargaNum);
    });
  }

  refresh() {
    this.showColumns = false;
    setTimeout(() => {
      this.updateGrahas();
      this.showColumns = true;
    }, 10);
  }

  @Watch("chart")
  changeChart(newVal) {
    if (newVal instanceof Chart) {
      this.ch = deepClone(newVal);
      this.refresh();
    }
  }

  @Watch("ayanamsha")
  changeAyanamsha() {
    this.refresh();
  }

  @Watch("vargaNum")
  changeVarga() {
    this.refresh();
  }

  @Watch("singleMode")
  changeSingleMode() {
    this.sync();
    setTimeout(this.updateGrahas, 250);
  }

  @Watch("activeMode")
  changeActiveMode(newVal, prevVal) {
    switch (newVal) {
      case "csc":
        this.activeTab = 2;
        break;
    }
    if (newVal !== prevVal) {
      this.prevMode = prevVal;
    }
  }

  @Watch("activeTab")
  changeActiveTab(newVal, prevVal) {
    if (newVal !== prevVal) {
      this.prevTab = prevVal;
    }
  }
}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

.ashtakavarga-table {
  .widget {
    > div,
    > nav {
      font-size: 90%;
    }
  }
  &.expanded {
    .widget {
      > nav.legend-tabs,
      > .actions.bottom,
      > nav.tabs.top {
        font-size: 66.6667%;
      }
      > .b-tabs {
        margin-top: -1em;
      }
    }
  }
  .compact-listing {
    &.show-second-tabs {
      .b-tabs {
        top: 5em;
      }
      &.show-chart {
        .b-tabs {
          top: 5.5em;
        }
      }
    }
    .b-tabs {
      position: absolute;
      top: 4em;
      bottom: 7em;
      left: 0;
      right: 0;
      nav {
        display: none;
      }
      .tab-content {
        position: relative;
        height: 100%;
      }
    }
    .chart-container-bg,
    .chart-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }
    .chart-container {
      bottom: 0;
      z-index: 4;
      canvas {
        z-index: 10;
      }
    }
    .chart-container-bg {
      content: "";
      display: block;
      bottom: 0.5rem;
      background-color: white;
      z-index: 1;
    }

    &.show-dial {
      .b-tabs {
        top: 5%;
        bottom: 5%;
        left: 5%;
        right: 5%;
      }
      .b-tabs .tab-content {
        padding: 0;
      }
      .actions {
        justify-content: flex-start;
        .varga-selector {
          align-self: flex-start;
          margin: 0 0 0.25em 0.5em;
        }
      }
      .back {
        position: absolute;
        top: 0;
        left: 0;
        cursor: pointer;
        font-size: 1.5em;
      }
    }
  }

  .cs-cakra {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    .inner {
      position: relative;
      background-image: url("/img/drawings/dial-chart.svg");
      background-repeat: no-repeat;
      background-position: center center;
      background-size: contain;
      padding: 100% 0 0 0;
      margin: 0 auto;
    }
    .dot,
    .total,
    .symbol {
      position: absolute;
    }

    .dot {
      height: 1%;
      width: 1%;
      background-color: $dark-color;
      border-radius: 50%;
    }

    .total {
      &.small {
        font-size: 0.375em;
      }
      &.large {
        font-size: 0.875em;
      }
      width: 1.25em;
      height: 1.25em;
      margin: -0.625em 0 0 -0.625em;
      overflow: hidden;
    }

    .symbol {
      font-size: 0.75em;
      width: 1em;
      height: 1em;
      margin: -0.5em 0 0 -0.5em;

      .icon {
        width: 1em;
        height: 1em;
      }
    }
  }

  .tab-item {
    height: 100%;
  }

  table {
    font-size: 75%;
    max-width: 97.5%;
    th {
      padding: 0.125em;
      .th-wrap {
        > span {
          display: flex;
          flex-flow: row nowrap;
        }
        .icon {
          margin: 0;
          width: 1em;
          text-align: center;
        }
      }
    }
    td,
    th {
      text-align: center;
      max-width: 2em;
      &.x-axis {
        text-align: right;
        padding: 0 0.375em 0 0;
      }
    }
    td {
      &.total {
        span {
          margin-left: 0.5em;
        }
      }
    }
  }
  tr {
    &.greyed {
      td,
      th {
        color: $light-fg;
      }
    }
    .total:not(:first-child),
    &.graha-total td.value {
      background-color: $yellow-translucent;
      border: solid 1px $dark-grey;
      border-collapse: collapse;
    }
  }
  tbody {
    tr td {
      &.value:not(.total) {
        background-color: white;
        border: solid 1px $dark-grey;
      }
      border-collapse: collapse;
      height: 1em;
      padding: 0 0.125em;
      vertical-align: center;
      &:not(:first-child) {
        max-width: 1.5em;
      }
    }
    td {
      &.graha {
        i.icon {
          height: 1em;
          width: 1em;
          max-height: 1em;
        }
      }
    }
  }
  .actions.bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
    height: 3em;
    .varga-selector {
      margin-right: 1em;
    }
    .options {
      position: absolute;
      z-index: 8;
      bottom: 2.5em;
      display: flex;
      flex-flow: column nowrap;
      label {
        align-items: flex-start;
        margin: 0 0 0.25em 0;
        i.icon {
          height: 1em;
          width: 1em;
          font-size: 0.75em;
        }
      }

      &.right {
        right: 2.5%;
      }
      &.left {
        left: 2.5%;
      }
      &.legend-tabs {
        bottom: 2.75em;
        left: 40%;
        right: 40%;
        justify-items: center;
        align-items: center;
        li {
          width: 6em;
          user-select: none;
          cursor: pointer;
        }
        .rectangle {
          display: inline-block;
          height: 1em;
          width: 2em;
          margin-right: 0.5em;
          &.red {
            background-color: $red-label;
            border: solid 0.25em $red-label;
          }
          &.blue {
            background-color: $blue-label;
            border: solid 0.25em $blue-label;
          }
        }
        .icon {
          height: 1em;
          width: 1em;
          margin: 0 0 -0.25em -0.25em;
        }
      }
    }
  }
  .select select,
  .button {
    font-size: 0.875em;
  }
  button {
    &.left {
      border-top-left-radius: 1em;
      border-bottom-left-radius: 1em;
    }
    &.right {
      border-top-right-radius: 1em;
      border-bottom-right-radius: 1em;
    }
    &.active {
      background-color: black;
      color: white;
    }
  }
}
</style>
