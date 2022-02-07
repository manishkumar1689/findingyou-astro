<template>
  <GridItem class="caughadia-table" :showSettings="false" :chart="chart">
    <h4>{{ mainLabel }}</h4>
    <div class="caughadia-values widget">
      <b-tabs v-if="hasValues" v-model="activeTab" :multiline="true">
        <b-tab-item>
          <template slot="header">
            <h4>{{ firstPeriod.label }}</h4>
            <p class="start">
              <strong>{{ firstPeriod.startName }}</strong>
              <small>{{ longTime(firstPeriod.startJd) }}</small>
            </p>
            <p class="end">
              <strong>{{ firstPeriod.endName }}</strong>
              <small>{{ longTime(firstPeriod.endJd) }}</small>
            </p>
          </template>
          <b-table
            v-if="hasValues"
            :data="values"
            :row-class="(row, index) => assignRowClasses(row, index)"
            :mobile-cards="false"
          >
            <template slot-scope="props">
              <b-table-column class="kala" field="kala" label="">
                <div v-if="props.row.hasKala" class="circle" :class="props.row.kala"></div>
              </b-table-column>
              <b-table-column
                class="name"
                :class="props.row.name"
                field="name"
                label="Name"
              >{{ itemLabel(props.row) }}</b-table-column>
              <b-table-column
                class="ruler"
                field="ruler"
                label="Ruler"
                :title="props.row.ruler | toGrahaName"
              >
                <i class="icon" :class="props.row.ruler | toGrahaClass"></i>
              </b-table-column>
              <b-table-column
                class="start"
                field="startDt"
                :label="startColumnLabel"
                :title="props.row.startJd"
              >{{ longTime(props.row.startJd, offset) }}</b-table-column>
              <b-table-column class="result" field="result" label="Quality">
                {{
                gunaLabel(props.row.result)
                }}
              </b-table-column>
            </template>
          </b-table>
        </b-tab-item>
        <b-tab-item>
          <template slot="header">
            <h4>{{ secondPeriod.label }}</h4>
            <p class="start">
              <strong>{{ secondPeriod.startName }}</strong>
              <small>{{ longTime(secondPeriod.startJd) }}</small>
            </p>
            <p class="end">
              <strong>{{ secondPeriod.endName }}</strong>
              <small>{{ longTime(secondPeriod.endJd) }}</small>
            </p>
          </template>
          <b-table
            v-if="hasValues"
            :data="secondValues"
            :row-class="(row, index) => assignRowClasses(row, index)"
            :mobile-cards="false"
          >
            <template slot-scope="props">
              <b-table-column class="kala" field="kala" label>
                <div v-if="props.row.hasKala" class="circle" :class="props.row.kala"></div>
              </b-table-column>
              <b-table-column
                class="name"
                :class="props.row.name"
                field="name"
                label="Name"
              >{{ itemLabel(props.row) }}</b-table-column>
              <b-table-column
                class="ruler"
                field="ruler"
                label="Ruler"
                :title="props.row.ruler | toGrahaName"
              >
                <i class="icon" :class="props.row.ruler | toGrahaClass"></i>
              </b-table-column>
              <b-table-column
                class="start"
                field="startDt"
                :label="startColumnLabel2"
                :title="longDate(secondPeriod.startJd)"
              >{{ longTime(props.row.startJd) }}</b-table-column>
              <b-table-column class="result" field="result" label="Quality">
                {{
                gunaLabel(props.row.result)
                }}
              </b-table-column>
            </template>
          </b-table>
        </b-tab-item>
      </b-tabs>
      <div class="legend bottom-aligned">
        <div class="circle rahu"></div>
        <p>{{ rahuLabel }}</p>
        <div class="circle gulika"></div>
        <p>{{ gulikaLabel }}</p>
        <div class="circle yama"></div>
        <p>{{ yamaLabel }}</p>
      </div>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import GridItem from "../widgets/GridItem.vue";
import { CaughadiaSet } from "../../api/models/CaughadiaSet";
import {
  shortTzAbbrJd,
  julToLongDate,
  julToHMS
} from "../../api/converters";
import { DictionaryState } from "../../store/types";
import { Chart } from "../../api/models/Chart";
@Component({
  components: {
    GridItem
  },
  filters: FilterSet
})
export default class CaughadiaTable extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: 0 }) readonly offset: number;
  @Prop({ default: 0 }) readonly paneIndex: number;
  @Prop({ default: "p1" }) readonly context: string;
  @State("dictionary") dictionary: DictionaryState;

  private activeTab = 0;

  gunaLabel(key) {
    let str = "";
    const lex = this.dictionary.lexeme("guna", key);
    if (lex) {
      const parts = [lex.name];
      const enTr = lex.text("en", "standard");
      if (enTr) {
        const enTerm = enTr
          .split(",")
          .shift()
          .trim();
        parts.push(`(${enTerm})`);
        str = parts.join(" ");
      }
    }
    return str;
  }

  get mainLabel() {
    return (
      this.dictionary.text("caughadia", "name_0") +
      " & " +
      this.dictionary.text("graha", "chaya_upagraha_1")
    );
  }

  kalaLabel(key = "rk") {
    return this.dictionary.text("graha", ["chaya_kalam", key].join("_"));
  }

  get rahuLabel() {
    return this.kalaLabel("rk");
  }

  get gulikaLabel() {
    return this.kalaLabel("gk");
  }

  get yamaLabel() {
    return this.kalaLabel("yk");
  }

  get firstPeriod() {
    return this.getPeriod(true);
  }

  get secondPeriod() {
    return this.getPeriod(false);
  }

  get startColumnLabel() {
    return this.startColLabel(true);
  }

  startColLabel(isFirst = true) {
    const jd = isFirst ? this.firstPeriod.startJd : this.secondPeriod.startJd;
    const tzAbbr = shortTzAbbrJd(jd, this.chart.tz, this.chart.tzOffset);
    return `Start (${tzAbbr})`;
  }

  get startColumnLabel2() {
    return this.startColLabel(false);
  }

  getPeriod(isFirst = true) {
    const showDay = this.chart.indianTime.isDayTime ? isFirst : !isFirst;
    return showDay ? this.showPeriod("day") : this.showPeriod("night");
  }

  showPeriod(key = "day") {
    const period = {
      label: "",
      startName: "",
      endName: "",
      startJd: 0,
      endJd: 0
    };
    const { dayBefore } = this.chart.indianTime;
    if (key === "day") {
      period.label = "Day";
      period.startName = "Sunrise";
      period.endName = "Sunset";
      period.startJd = dayBefore
        ? this.chart.sunPrevRise.jd
        : this.chart.sunRise.jd;
      period.endJd = dayBefore
        ? this.chart.sunPrevSet.jd
        : this.chart.sunSet.jd;
    } else {
      period.label = "Night";
      period.startName = "Sunset";
      period.endName = "Sunrise";
      period.startJd = dayBefore
        ? this.chart.sunPrevSet.jd
        : this.chart.sunSet.jd;
      period.endJd = dayBefore
        ? this.chart.sunRise.jd
        : this.chart.sunNextRise.jd;
    }
    return period;
  }

  get hasValues(): boolean {
    return this.values.length > 0;
  }

  get values() {
    return this.chart.matchCaughadia();
  }

  get secondValues() {
    return this.chart.matchCaughadia(false);
  }

  get dayValues() {
    return this.values.filter(
      c => c.startJd > this.dayStart.jd && c.startJd < this.dayEnd.jd
    );
  }

  get dayStart() {
    return this.chart.indianTime.dayBefore
      ? this.chart.sunPrevRise
      : this.chart.sunRise;
  }

  get dayEnd() {
    return this.chart.indianTime.dayBefore
      ? this.chart.sunPrevSet
      : this.chart.sunSet;
  }

  get nightStart() {
    return this.chart.indianTime.dayBefore
      ? this.chart.sunPrevSet
      : this.chart.sunSet;
  }

  get nightEnd() {
    return this.chart.indianTime.dayBefore
      ? this.chart.sunNextRise
      : this.chart.sunRise;
  }

  itemLabel(item: CaughadiaSet) {
    return this.dictionary.text("caughadia", item.num);
  }

  assignRowClasses(row: CaughadiaSet, index: number) {
    const activeCls = row.active ? "active" : "inactive";
    return [
      ["index", index].join("-"),
      ["caughadia", row.num, index].join("-"),
      activeCls
    ];
  }
  longTime(jd: number) {
    return julToHMS(jd, this.chart.tzOffset);
  }
  longDate(jd: number) {
    return julToLongDate(jd, this.chart.tzOffset);
  }
}
</script>
