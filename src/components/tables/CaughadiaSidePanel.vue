<template>
  <div class="caughadia-values side-panel">
    <b-tabs v-if="hasValues" v-model="activeTab" :multiline="true">
      <b-tab-item :label="firstPeriod.label">
        <caughadia-info :chart="chart" :geo="geo" :currJd="currJd" @moveDay="moveDay">
        <p class="start parts-2">
          <strong class="text-label">{{ firstPeriod.startName }}</strong>
          <small>{{ longTime(firstPeriod.startJd) }}</small>
        </p>
        <p class="end parts-2">
          <strong class="text-label">{{ firstPeriod.endName }}</strong>
          <small>{{ longTime(firstPeriod.endJd) }}</small>
        </p>
        </caughadia-info>
        <b-table
          v-if="hasValues"
          :data="values"
          :row-class="(row, index) => assignRowClasses(row, index)"
          :mobile-cards="false"
        >
          <template slot-scope="props">
            <b-table-column
              class="special"
              field="special"
              label
            >
              <b-tooltip :class="matchSpecialClasses(props.row)" :label="matchKalaLabel(props.row)"></b-tooltip>
            </b-table-column>
            <b-table-column
              class="start"
              field="startDt"
              :label="startColumnLabel"
            >{{ longTime(props.row.startJd, offset) }}</b-table-column>
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
            >
              <i class="icon" :class="props.row.ruler | toGrahaClass" :title="props.row.ruler | toGrahaName"></i>
            </b-table-column>
            <b-table-column class="result" field="result" label="Quality">
              {{
              gunaLabel(props.row.result)
              }}
            </b-table-column>
          </template>
        </b-table>
      </b-tab-item>
      <b-tab-item :label="secondPeriod.label">
        <caughadia-info :chart="chart" :geo="geo" :currJd="currJd" @moveDay="moveDay">
          <p class="start parts-2">
            <strong class="text-label">{{ secondPeriod.startName }}</strong>
            <small>{{ longTime(secondPeriod.startJd) }}</small>
          </p>
          <p class="end parts-2">
            <strong class="text-label">{{ secondPeriod.endName }}</strong>
            <small>{{ longTime(secondPeriod.endJd) }}</small>
          </p>
        </caughadia-info>
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
    <extended-transitions-table v-if="hasTransitions" :chart="chart" :transitions="transitions"/>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import { CaughadiaSet } from "../../api/models/CaughadiaSet";
import {
  julToLongDate,
  julToHMS,
  degAsDms,
  camelToTitle,
} from "../../api/converters";
import { DictionaryState, SettingState } from "../../store/types";
import { Chart } from "../../api/models/Chart";
import { fetchTransitionInfo } from "@/api/methods";
import { fetchGeo, getGeoTzOffset } from "@/api/geoloc-utils";
import CaughadiaInfo from "./CaughadiaInfo.vue";
import ExtendedTransitionsTable from "./ExtendedTransitionsTable.vue";
import { julianDayOffsetToNoon } from "@/api/julian-date";
import { Graha } from "@/api/models/Graha";
import { calcSphutaData } from "@/api/sphuta-helpers";
import { TransitInfoRow } from "@/api/models/TransitInfoRow";
import { notEmptyString } from "@/api/validators";

@Component({
  filters: FilterSet,
  components: {
    CaughadiaInfo,
    ExtendedTransitionsTable
  }
})
export default class CaughadiaSidePanel extends Vue {
  @Prop({ default: () => 0 }) readonly nowJd: number;
  @State("dictionary") dictionary: DictionaryState;
  @State("settings") settings: SettingState;

  private activeTab = 0;

  private transitions = [];

  private geo: any = {};

  private chart = new Chart();

  private currJd = 0;

  loaded = false;

  mounted() {
    this.moveDay(0);
    this.load();
  }

  load() {
    this.loaded = false;
    fetchGeo((data) => {
      const { latitude, longitude } = data;
      fetchTransitionInfo(latitude, longitude, this.currJd).then(result => {
        const keys = result instanceof Object ? Object.keys(result) : [];
        if (keys.includes("geo")) {
          this.geo = result.geo;
        }
        if (keys.includes("transitions")) {
          this.transitions = result.transitions;
        }
        this.chart = new Chart(result.chart);
        setTimeout(() => {
          this.loaded = true;
        }, 250);
        
      })
    })
  }

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

  get offset() {
    return getGeoTzOffset();
  }


  kalaLabel(key = "rk") {
    return this.dictionary.text("graha", ["chaya_kalam", key].join("_"));
  }

  toTooltip(row, sk = 'rise') {
    let name = row.key;
    const long = degAsDms(row[sk].lng, 'raw', 3);
    if (row.key.length === 2) {
      const lex = this.dictionary.graha(row.key);
      name = lex.text("en", "standard");
    } else {
      name = camelToTitle(name);
    }
    return `${name}: ${long}`;
  }

  matchKalaLabel(row = null) {
    let key = '';
    if (row instanceof Object) {
      const { kala } = row;
      if (notEmptyString(kala)) {
        key = kala.substring(0, 1).toLowerCase() + 'k';
      }
    }
    return key.length > 1? this.kalaLabel(key) : '';
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

  get hasGeoData() {
    const keys = this.geo instanceof Object ? Object.keys(this.geo) : [];
    return keys.includes("countryName") && keys.includes("shortTz");
  }

  get hasTransitions() {
    return this.transitions instanceof Array ? this.transitions.length > 0 : false;
  }

  get tzAbbr() {
    return this.hasGeoData ? this.geo.shortTz : '';
  }

  get transitionRows() {
    const rows = [];
    const keys = ["su", "mo", "ma", "me", "ve", "ju", "sa", "ra", "ke"];
    keys.forEach(key => {
      const graha = this.chart.graha(key);
      if (graha instanceof Graha) {
        const charaKaraka = graha.charaKaraka;
        const  charaName = this.charaName(graha.charaKaraka);
        const row = new TransitInfoRow(key, graha.longitude, "", this.transitions, charaKaraka, charaName);
        rows.push(row);
      }
    });
    const lotObjs = [{ key: "lotOfFortune", name: "Lot of Fortune"}, {key: "lotOfSpirit", name: "Lot of Spirit"}];
    lotObjs.forEach(obj => {
      const row = new TransitInfoRow(obj.key, this.chart[obj.key], obj.name, this.transitions);
      rows.push(row);
    })
    const allSphutas = calcSphutaData(
      this.chart,
      this.settings.ayanamsha,
      1
    );
    const specialObjs = [
      {key: 'brghuBindu', trKey: 'brghuBindu', name: "Brighu Bindu", type: "lng"},
      {key: 'yogiSphuta', trKey: 'yogi', name: "Yogi Point", type: "lng" },
      {key: 'yogi', trKey: '', name: "Yogi Graha", type: "key" },
      {key: 'avayogiSphuta', trKey: 'avaYogi', name: "AvaYogi Point", type: "lng"},
      {key: 'avayogi', trKey: '', name: 'AvaYogi Graha', type: "key"},
    ]; 
    specialObjs.forEach(row => {
      const refRow = allSphutas.find(r => r.key === row.key);
      if (refRow instanceof Object) {
        const gr = row.type === "key"? this.chart.graha(refRow.value) : null;
        const lng = row.type === "key"? gr.longitude : refRow.value;
        const trKey = row.type === "key"? refRow.value : row.trKey;
        const newRow = new TransitInfoRow(trKey, lng, row.name, this.transitions, 0, "", refRow.value);
        rows.push(newRow);
      }
    });
    return rows;
  }

  charaName(num = 0) {
    const key = ['karaka_chara', num].join('_');
    const lex = this.dictionary.lexeme("graha", key);
    return lex instanceof Object ? lex.text("sa", "short") : '';
  }

  startColLabel(isFirst = true) {
    const jd = isFirst ? this.firstPeriod.startJd : this.secondPeriod.startJd;
    return `Start (${this.tzAbbr})`;
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
    return this.loaded? this.chart.matchCaughadia() : [];
  }

  get secondValues() {
    return this.loaded? this.chart.matchCaughadia(false) : [];
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

  moveDay(num = 0) {
    if (num === 0) {
      this.currJd = julianDayOffsetToNoon(this.nowJd);
    } else {
      this.currJd += num;
    }
  }

  longTime(jd: number) {
    return julToHMS(jd, this.chart.tzOffset);
  }
  longDate(jd: number) {
    return julToLongDate(jd, this.chart.tzOffset);
  }

  matchSpecialClasses(row = null) {
    const cls = [];
    if (row instanceof Object) {
      if (row.hasKala) {
        cls.push('circle');
        cls.push(row.kala);
      }
    }
    return cls;
  }

  @Watch('currJd')
  changeCurrentJd() {
    this.load();
  }

}
</script>
