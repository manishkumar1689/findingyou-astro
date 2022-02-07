<template>
  <div class="predictive-pane" :class="wrapperClasses">
    <div class="top-actions">
      <b-button type="is-light" @click="togglePredictor">Predict Protocol</b-button>
    </div>
    <div class="subpanes column-panes" :class="columnClasses">
      <div class="left-column column">
        <component v-if="hasMatchedMain" :is="mainWidget" :mode="mainWidgetMode" context="predictive" :chart="c1" :chart2="c2" class="wide expanded" :class="mainWidgetClasses" :varga="mainVarga" :transitKeys="transitPoints">
          <template v-if="!switching" v-slot:title>
            <span class="first-frame-title subtitle">
              {{firstFrameTitle}}
            </span>
            <span class="second-frame-title subtitle" v-html="secondFrameTitle"></span>
            <span class="third-frame-title subtitle">
              {{thirdFrameTitle}}
            </span>
          </template>
          <template v-if="hasMiddleSlot" v-slot:middle>
            <bav-inner-grid :chart="c1" :c2="c2" />
          </template>
          <template v-if="hasMiddleSlot" v-slot:bottom>
            <bav-timeline-graph v-if="!showKakshyaTimeline" :chart="c1" />
            <kakshya-timeline-graph v-if="showKakshyaTimeline" :chart="c1" :currentJd="currJd" />
          </template>
        </component>
        <form class="full-width predictive-controls" :class="controlClasses" @mouseenter="enableSlider" @mouseleave="disableSlider">
          <p class="current-timeline-date spaced-row">
            <strong class="text-label">Current date</strong>
            <span class="current-date">{{currDate}}</span>
            <strong class="text-label">Age</strong>
            <span class="age">{{ageDisplay}}</span>
          </p>
          <b-slider v-model="timelineStep" :min="1" :max="maxSteps" :step="1" :ticks="false" :custom-formatter="calcStepDate" :tooltip="true" size="is-large" :rounded="true" type="is-dark">
          </b-slider>
          
          <div class="row horizontal">
            <b-input type="date" v-model="startDate" class="start-date end-item" />
            <b-icon icon="step-backward" @click.native="prevStop" />
            <b-select v-model="subunit">
            <option v-for="unit in subunits" :key="unit.key" :value="unit.num">{{unit.name}}</option>
            </b-select>
            <b-icon icon="step-forward" @click.native="nextStop" />
            <b-input type="date" v-model="endDate" class="end-date end-item" />
          </div>
        </form>
        
      </div>
      <div class="middle-widgets column">
        <div class="options" >
          <b-icon icon="cog" @click.native="toggleSubMenu" />
          <form class="submenu">
            <b-field label="Birth chart">
              <b-radio v-model="dashaChartRef" native-value="birth" />
            </b-field>
            <b-field label="Transit chart">
              <b-radio v-model="dashaChartRef" native-value="transit" />
            </b-field>
          </form>
        </div>
        <single-chart v-for="dsPoint in transitPointset" :key="dsPoint.key" :label="dsPoint.label" mode="single" context="dasha-transit" :chart="dashaChart" class="compact" :refPoint="dsPoint.grahaKey" :transitKeys="transitPoints" />
        <kuta-bar-chart :chart="c1" :chart2="c2" context="dasha-point" />
      </div>
      <b-tabs v-model="activeTab" :multiline="true">
        <b-tab-item label="Daśa">
          <dasha-tree :chart="c1" context="predictive">
            <template v-slot:selection>
              <p class="selection row horizontal">
                <span v-for="item in transitPointIcons" :key="item.itemKey" :class="item.classNames"></span>
                <time>{{currDate}}</time>
              </p>
            </template>
          </dasha-tree>
        </b-tab-item>
        <b-tab-item label="Kakṣya">
          <template v-if="isActiveTab('kakshya')">
            <kakshya-timeline :chart="chart" :currentJd="currJd" />
          </template>
        </b-tab-item>
        <b-tab-item label="BAV">
          <template v-if="isActiveTab('bav')">
            <bav-timeline-table :chart="c1" :currentJd="currJd" context="side_panel"></bav-timeline-table>
          </template>
        </b-tab-item>
        <b-tab-item label="Caughadia">
          <template v-if="isActiveTab('caughadia')">
            <caughadia-side-panel :nowJd="nowJd"></caughadia-side-panel>
          </template>
        </b-tab-item>
        <b-tab-item label="5 Pakṣi">
          <template v-if="isActiveTab('panchapakshi')">
            <pancha-pakshi-side-panel :nowJd="nowJd" :chart="c1" :dashas="dashas" :dashaSet="dashaSet"></pancha-pakshi-side-panel>
          </template>
        </b-tab-item>
        <b-progress class="loading-progress" type="is-success" size="is-large" :show-value="true">Loading results</b-progress>
        <div class="birth-date-picker-wrapper" @click="handleDPClick">
          <birth-date-picker
            v-if="showDatePicker"
            v-model="dateVal"
            :maxYear="maxYear"
            :minYear="minYear"
            :inline="true"
            delimiter="/"
          />
        </div>
      </b-tabs>
    </div>
    <predictor-form :type="predictorType" :chartId="mainChartId" />
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import birthDatePicker from "vue-birth-datepicker";
import { FilterSet } from "../../api/composables/FilterSet";
import { Chart } from "../../api/models/Chart";
import { emptyString, isNumeric, notEmptyString } from "../../api/validators";
import SingleChart from "../charts/SingleChart.vue";
import KutaBarChart from "../charts/KutaBarChart.vue";
import BavTimelineGraph from "../charts/BavTimelineGraph.vue";
import BavInnerGrid from "../charts/BavInnerGrid.vue";
import KakshyaTimeline from "../charts/KakshyaTimeline.vue";
import PredictorForm from "../forms/PredictorForm.vue";
import DashaTree from "../tables/DashaTree.vue";
import { DictionaryState, SettingState } from "@/store/types";
import { deepClone, matchLord } from "@/api/helpers";
import { fetchCurrentByGeoDatetime } from "@/api/methods";
import { bus } from "@/main";
import { calcLongitudeOffset, currentJulianDate, currentJulianDay, dateStringToJulianDate, JulDate, julToDateParts } from "@/api/julian-date";
import { GeoLoc } from "@/api/models/GeoLoc";
import { isoDateStringToSimple, julRangeToInterval, smartCastInt } from "@/api/converters";
import { calcTransitPoints, DashaSet, DashaSpan } from "@/api/models/DashaSet";
import { matchMainPredictiveSettings, WidgetSetting } from "@/store/local";
import { KeyNameMax } from "@/api/interfaces";
import { matchKotaPala } from "@/api/mappings/kota-values";

function load(view: string, subDir = "charts") {
  return () => import(`@/components/${subDir}/${view}.vue`);
}

@Component({
  name: "DashaTransits",
  components: {
    DashaTree,
    SingleChart,
    KutaBarChart,
    PredictorForm,
    BavTimelineGraph,
    BavInnerGrid,
    KakshyaTimeline,
    birthDatePicker,
    KotaCakraChart: load("KotaCakraChart"),
    BavTimelineTable: load("BavTimelineTable", "tables"),
    CaughadiaSidePanel: load("CaughadiaSidePanel", "tables"),
    PanchaPakshiSidePanel: load("PanchaPakshiSidePanel", "tables"),
    KakshyaTimelineGraph: load ("KakshyaTimelineGraph"),
    SarvatobhadraCakra: load("SarvatobhadraCakra"),
    CandraKalanalaCakra: load("CandraKalanalaCakra"),
    ShulaCakra: load("ShulaCakra")
  },
  filters: {
    ...FilterSet,
  },
})
export default class DashaTransit extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @State("settings") settings: SettingState;
  @State("dictionary") dictionary: DictionaryState;

  private c1: Chart;
  c2: Chart = new Chart(null);

  private mainWidget = "";

  private innerName = "Birth";

  private midName = "Transit";

  private mainVarga = 1;

  private currJd = 0;

  private nowJd = 0;

  private timelineStep = 0;

  private startDate = "";

  private endDate = "";

  private startDt = new JulDate(0);

  private endDt = new JulDate(0);

  private startScaleDt = new JulDate(0);

  private endScaleDt = new JulDate(0);

  private transitPoints: string[] = [];

  private minuteSteps = 0;

  changing = false;

  switching = false;

  sliding = false;

  private subunit = 10080;

  private playDir = 0;

  private dashaChartRef = "birth";

  private showSubMenu = false;

  private dashas: DashaSpan[] = [];

  private dashaSet: DashaSet = new DashaSet(null);

  private initialised = false;

  private showForm = false;

  private sliderActive = false;

  private ruleCategories: KeyNameMax[] = [];

  private bavMode = 'simple';

  private kakshyaTimelineEnabled = false;

  private activeTab = 0;

  private listingTabs = ["dasha", "kakshya", "bav", "caughadia", "panchapakshi"];

  private minYear = 1660;

  private maxYear = 2021;

  private dateVal = null;

  private showDatePicker = false;

  created() {
    this.nowJd = currentJulianDay();
    this.sync();
    this.maxYear = new Date().getFullYear();
    bus.$on("dasha-span-item", item => {
      const dtStr = julToDateParts(item.startJd).toISOString()
      this.updateTransitChart(dtStr);
      if (!this.initialised) {
        this.syncTimeline(item);
        setTimeout(() => {
          bus.$emit("dasha-open-jd", this.currJd + 1/1440);
            setTimeout(() => {
              bus.$emit("dasha-open-jd", this.currJd);
            }, 125);
            this.initialised = true;
        }, 1000);
      }
    });
    bus.$on("escape", this.dismiss);
    bus.$on("close-overlay", this.dismiss);
    bus.$on("dasha-open-jd", (jd: number) => {
      this.syncTimelineJd(jd);
    });
    bus.$on('predictive-main', settings => {
      if (settings.widget) {
        this.mainVarga = settings.widget.varga;
        this.assignSettings(settings.widget);
      }
    });
    bus.$on('bav-inner-mode', mode => {
      if (notEmptyString(mode)) {
        this.bavMode = mode;
      }
    });
    bus.$on('show-date-picker', ({ dateTs }) => {
      if (dateTs > 0) {
        
        this.dateVal = dateTs;
        setTimeout(() => {
          this.showDatePicker = true;
        }, 250);
      }
    });
    const { settings } = matchMainPredictiveSettings();
    if (settings.widget) {
      this.assignSettings(settings.widget, true);
    }
  }

  mounted() {
    const activeTab = this.$ls.get('active-predictive-tab');
    if (isNumeric(activeTab) && activeTab >= 0) {
      this.activeTab = smartCastInt(activeTab);
    }
  }

  assignSettings(widget: WidgetSetting, init = false) {
    const [widgetName, mode ] = widget.component.split("__");
    this.mainWidget = widgetName;
    this.bavMode = mode === "full"? mode : "simple";
    const ts = init ? 25 : 250;
    setTimeout(() => {
      bus.$emit('bav-outer-mode', this.bavMode);
    }, ts);
  }

  get hasMatchedMain() {
    return this.mainWidget.length > 4;
  }

  get hasMiddleSlot() {
    return ["SingleChart"].includes(this.mainWidget) && this.c2.grahas.length > 5 && this.c2.jd !== this.c1.jd;
  }

  get mainWidgetClasses() {
    const cls = [];
    if (this.showBirthBav  && this.hasMiddleSlot) {
      cls.push('show-middle-inner-frame');
    }
    return cls;
  }

  get mainChartId() {
    return this.hasChart? this.c1._id : "";
  }

  get showBirthBav() {
    return ['simple', 'full'].includes(this.bavMode);
  }

  get mainWidgetMode() {
    switch (this.bavMode) {
      case 'full':
        return 'double_outer';
      default:
        return 'double';
    }
  }

  get predictorType() {
    if (this.isActiveTab("caughadia")) {
      return "caughadia";
    } else if (this.isActiveTab("panchapakshi")) {
      return "panchapakshi";
    }
    switch (this.mainWidget) {
      case "SingleChart":
        return "transit";
      case "KotaCakraChart":
        return "kota";
      case "SarvatobhadraCakra":
        return "sarvatobhadra";
      case "CandraKalanalaCakra":
        return "chandra_kalanala";
      case "ShulaCakra":
        return "shula";
      default:
        return "_";
    }
  }

  get showKakshyaTimeline() {
    return this.isActiveTab('kakshya');
  }

  isActiveTab(key = "dasha") {
    const index = this.listingTabs.indexOf(key);
    return this.activeTab === index;
  }

  syncTimeline(item: DashaSpan) {
    const fractionPoint = (startJd = 0, endJd = 0) => startJd + ((endJd - startJd) / 16);
    this.timelineStep = Math.floor(this.calcStepFromJd(fractionPoint(item.startJd, item.endJd)));
  }

  syncTimelineJd(jd = 0) {
    const offset = this.daySpan / 8;
    this.currJd = Math.floor(jd * (this.daysPerStep) + this.calcLngOffset()) / this.daysPerStep;
    if (jd < this.startScaleDt.jd) {
      const targetOffset = jd - offset;
      const newOffset = targetOffset < this.startDt.jd? this.startDt.jd : targetOffset;
      this.startDate = julToDateParts(newOffset, this.c1.tzOffset).ymdDate;
    } else if (jd > this.endScaleDt.jd) {
      const targetOffset = jd + offset;
      const newOffset = targetOffset > this.endDt.jd? this.endDt.jd : targetOffset;
      this.endDate = julToDateParts(newOffset, this.c1.tzOffset).ymdDate;
    }
    setTimeout(() => {
      this.timelineStep = Math.floor(this.calcStepFromJd(this.currJd));
    }, 250);
  }

  sync() {
    this.c1 = deepClone(this.chart);
    this.c2 = new Chart(null);
    bus.$on('dasha-set-built', ({
      chartId,
      ds,
      set
    }) => {
      if (chartId === this.c1._id) {
        if (ds instanceof Array) {
          this.dashas = ds;
          this.dashaSet = set;
          const lastIndex = ds.length - 1;
          const startJd = ds[0].startJd;
          const endJd = ds[lastIndex].endJd;
          this.startDt = julToDateParts(startJd, this.c1.tzOffset);
          this.endDt = julToDateParts(endJd, this.c1.tzOffset);
          const currentDt = currentJulianDate();
          const refJd = this.endDt.year >= currentDt.year? Math.floor(currentDt.jd) : Math.ceil(this.startDt.jd + (30 * 365.25) );
          const startScaleJd = Math.floor(refJd - 183) - 0.5;
          const endScaleJd = Math.ceil(refJd + 183) + 0.5;
          this.startScaleDt = julToDateParts(startScaleJd, this.c1.tzOffset);
          this.endScaleDt = julToDateParts(endScaleJd, this.c1.tzOffset);
          if (emptyString(this.startDate)) {
            this.startDate = this.startScaleDt.ymdDate;
            this.endDate = this.endScaleDt.ymdDate;
          }
          this.applySliderScale();
        }
      }
    });
  }

  calcTransitPointSet() {
    this.transitPoints = calcTransitPoints(this.dashas, this.dashaSet, this.currJd);
  }

  applySliderScale() {
    this.timelineStep = Math.floor(this.maxSteps / 2);
    setTimeout(() => {
          this.calcTransitPointSet();
    }, 250)
  }

  get currDate() {
    const dt = julToDateParts(this.currJd, this.c1.tzOffset);
    //return this.minutesPerStep < 1440? dt.dmyHm : dt.dmyDate;
    return dt.dmyHm;
  }

  get numJds() {
    return this.endDt.jd - this.startDt.jd;
  }

  get numYears() {
    return this.endDt.year - this.startDt.year;
  }

  get mainIsNorthIndianChart() {
    return this.mainWidget === "SingleChart";
  }

  get subunits() {
    return [{
      num: 1,
      name: "minute"
    }, {
      num: 60,
      name: "hour",
    },{
      num: 1440,
      name: "day",
    },{
      num: 10080,
      name: "week",
    }].map(row => {
      const key = ['subunit',row.num].join("-");
      return {...row, key}
    });
  }

  get minutesPerStep() {
    return this.daysPerStep * 1440;
  }

  get daySpan() {
    return (this.endScaleDt.jd - this.startScaleDt.jd);
  }

  get yearSpan() {
    return this.daySpan / 365.25;
  }

  get maxSteps() {
    return Math.floor(this.daySpan) / this.slideScale.days;
  }

  get hasChart() {
    return this.c1 instanceof Chart && this.c1.grahas.length > 1;
  }

  get slideScale() {
    if (this.yearSpan <= 0.5) {
      return { days: 1, tick: 7, unit: "weeks", multiplier: 1 };
    } else if (this.yearSpan <= 2) {
      return { days: 1, tick: 28, unit: "weeks", multiplier: 4 };
    } else if (this.yearSpan <= 5) {
      return { days: 7, tick: 28, unit: "weeks", multiplier: 4 };
    } else if (this.yearSpan <= 10) {
      return { days: 14, tick: 1 * 365.25, unit: "years", multiplier: 1};
    } else if (this.yearSpan <= 20) {
      return { days: 28, tick: 1 * 365.25, unit: "years", multiplier: 1};
    } else if (this.yearSpan <= 50) {
      return { days: 56, tick: 5 * 365.25, unit: "years", multiplier: 5};
    } else {
      return { days: 112, tick: 10 * 365.25, unit: "years", multiplier: 10 };
    } 
  }

  get firstFrameTitle() {
    switch (this.mainWidget) {
      case 'ShulaCakra':
        return this.dictionary.text("chakra", "shula_0");
      case 'CandraKalanalaCakra':
        return this.dictionary.text("devata", "chandra");
      case 'SarvatobhadraCakra':
        return this.dictionary.text("aui", "menu_04_01");
      case 'KotaCakraChart':
        return this.dictionary.text("chakra", "kota_0");
      default:
        return `Inner: ${this.mainVarga} ${this.innerName}`;
    }
  }

  get secondFrameTitle() {
    switch (this.mainWidget) {
      case 'KotaCakraChart':
        return this.buildKotaCakraIcons();
      case 'ShulaCakra':
        return "";
      default:
        return `Middle: ${this.mainVarga} ${this.midName}`;
    }
  }

  buildKotaCakraIcons() {
    if (this.hasChart && this.c1.grahas.length > 2) {
      const kotaPalaIcon = `<i class="${this.kotaPalaClasses}" title="${this.kotaPalaLabel}"></i>`;
      const kotaSvamiIcon = `<i class="${this.kotaSvamiClasses}" title="${this.kotaSvamiLabel}"></i>`;
      return `<span class="text-label">Koṭa Pāla</span>${kotaPalaIcon}<span class="text-label">Koṭa Svāmi </span>${kotaSvamiIcon}`;
    } else {
      return '';
    }
  }

  get thirdFrameTitle() {
    return "";
  }

  get daysPerStep() {
    return this.slideScale.days;
  }

  get transitPointset() {
    const labels = ["Mahadaśa Lord", "Antardaśa Lord", "Pratyantardaśa Lord"];
    return this.transitPoints.map((grahaKey, index) =>  {
      const key = ['dasha-lord-level', (index+1)].join('-');
      return { 
        label: labels[index],
        grahaKey,
        key
      }
    })
  }

  get transitPointIcons() {
    return this.transitPoints.map((key, index) => {
      const itemKey = ['transit-point', key, index].join('-');
      const classNames = ['icon', ['icon', key].join('-'), ['dasha-level', (index+1)].join('-')];
      return { key, itemKey, classNames };
    });
  }

  get columnClasses() {
    const cls = [];
    if (this.showSubMenu) {
      cls.push("show-submenu");
    }
    return cls;
  }

  get dashaChart() {
    return this.dashaChartRef === "birth"? this.c1 : this.c2;
  }

  get age() {
    return julRangeToInterval(this.c1.jd, this.currJd);
  }

  get ageDisplay() {
    let str = '';
    if (this.hasChart && this.currJd > 0) {
      const { years, months } = this.age;
      const parts = [`${years}y`];
      if (months > 0) {
        parts.push(`${months}m`);
      }
      str = parts.join(' ');
    }
    return str;
  }

  toggleSubMenu() {
    this.showSubMenu = this.showSubMenu !== true;
  }

  closeSubMenu() {
    this.showSubMenu = false;
  }

  dismiss() {
    this.closeSubMenu();
    this.showForm = false;
    this.showDatePicker = false;
  }

  transformStep(jd, unit, multiplier) {
    const jDate = julToDateParts(jd);
    switch (unit) {
      case "year":
        return jDate.year.toString();
      case "week":
      case "weeks":
        return multiplier > 2 ? jDate.dmyDate : jDate.dmDate;
    }
  }

  get controlClasses() {
    const cls = [];
    if (this.playDir !== 0) {
      const dirClass = this.playDir < 1? "play-black" : "play-forward";
      cls.push("playing", dirClass);
    }
    return cls;
  }

  calcStepDate(step = 0) {
    const dt = julToDateParts(this.calcStepJd(step), this.c1.tzOffset);
    return this.minutesPerStep < 720? dt.dmyHm : dt.dmyDate;
  }

  calcLngOffset() {
    const geoLoc = this.$ls.get('geoloc');
    const coords = geoLoc instanceof Object ? geoLoc.coords : null;
    const lng = coords instanceof Object ? coords.longitude : 0;
    return calcLongitudeOffset(lng);
  }

  calcStepJd(step = 0) {
    return this.startScaleDt.jd + (step * this.daysPerStep) + this.calcLngOffset() + 0.49999;
  }

  calcStepFromJd(jd = 0) {
    const step = (jd - this.startScaleDt.jd) / this.daysPerStep;
    return step < 0 ? 0 : step > this.maxSteps? this.maxSteps : step;
  }

  updateTransitChart(dt: string) {
    const geoLoc = new GeoLoc(this.c1.geo);
    fetchCurrentByGeoDatetime(geoLoc, dt).then(result => {
      if (result.valid && result.grahas instanceof Array) {
        const subject = {
          name: isoDateStringToSimple(dt),
        };
        this.c2 = new Chart({...result, subject });
        setTimeout(() => {
          this.calcTransitPointSet();
        }, 125);
      }
    })
  }

  nextStop() {
    this.moveStop(1);
  }

  prevStop() {
    this.moveStop(-1);
  }

  get playSpeed() {
    switch (this.subunit) {
      case 1:
        return 1000;
      case 60:
        return 2000;
      case 1440:
        return 3000;
      case 10080:
        return 4000;
      default:
        return 2000;
    }
  }

  /* playMove(newDir = 1) {
    if (this.playInterval === null || newDir !== this.playDir) {
      this.playDir = newDir;
      this.stop();
      this.moveStop(this.playDir);
      this.playInterval = setInterval(() => {
        this.moveStop(this.playDir);
      }, this.playSpeed);
    } else {
      this.stop();
    }
  }

  play() {
    this.playMove(1);
  }

  playBack() {
    this.playMove(-1);
  }

  pause() {
    this.stop();
    this.playDir = 0;
  }

  stop(resetDir = false) {
    clearInterval(this.playInterval);
    this.playInterval = null;
  } */

  enableSlider() {
    this.sliderActive = true;
  }

  disableSlider() {
    this.sliderActive = false;
  }

  moveStop(num = 0) {
    const isNeg = num < 0;
    const mins = smartCastInt(this.subunit) * num;
    
    const addMins = this.minuteSteps + mins;
    const numStepsFl =  mins / this.minutesPerStep;
    const numSteps = isNeg ? Math.ceil(numStepsFl) : Math.floor(numStepsFl);
    const remainderMins = addMins % this.minutesPerStep;
    this.minuteSteps = remainderMins;
    if (!this.sliding) {
      this.sliding = true;
      if (numSteps !== 0) {
        this.timelineStep += numSteps;
      }
      setTimeout(() =>{
        this.currJd = this.calcStepJd(this.timelineStep) + (this.minuteSteps / 1440);
      }, 100);
      setTimeout(() =>{
        this.sliding = false;
      }, 500);
    }
  }

  toggleKakshyaTable() {
    this.kakshyaTimelineEnabled = !this.kakshyaTimelineEnabled;
  }

  get wrapperClasses() {
    const cls = [];
    if (this.showForm) {
      cls.push('show-form');
    }
    return cls;
  }

  kotaPala() {
    return matchKotaPala(this.c1.moon.longitude);
  }

  get kotaPalaLabel() {
    const key = this.kotaPala();
    return notEmptyString(key)? this.grahaTitle(key) : "";
  }

  get kotaPalaClasses() {
    return this.buildIconClasses(this.kotaPala());
  }

  kotaSvami() {
    return matchLord(this.c1.moon);
  }

  get kotaSvamiLabel() {
    const key = this.kotaSvami();
    return notEmptyString(key)? this.grahaTitle(key) : "";
  }

  get kotaSvamiClasses() {
    return this.buildIconClasses(this.kotaSvami());
  }

  buildIconClasses(key = ""): string {
    return ['icon', ['icon',key].join('-')].join(' ');
  }

  grahaTitle(key = "") {
    const lex = this.dictionary.graha(key);
    return lex instanceof Object ? lex.text("en", "standard", "lt") : "";
  }

  updateDashaSpan() {
    this.changing = true;
    bus.$emit("dasha-span-item", { 
      startJd: this.currJd,
      trail: []
    });
    setTimeout(() => {
      this.changing = false;
    }, 500);
  }

  openPredictor() {
    this.showForm = true;
  }

  togglePredictor() {
    this.showForm = this.showForm !== true;
  }

  dateStrToJul(dateStr = "") {
    const dtStr = [dateStr, '00:00:00'].join('T');
    return dateStringToJulianDate(dtStr, this.c1.tzOffset);
  }

  @Watch('activeTab')
  changeActiveTab(newVal) {
    if (this.initialised) {
      this.$ls.set('active-predictive-tab', newVal);
    }
  }

  @Watch('startDate')
  changeStartDate(newVal) {
    if (notEmptyString(newVal, 7) && this.initialised) {
      this.startScaleDt = this.dateStrToJul(newVal);
      this.applySliderScale();
    }
  }

  @Watch('endDate')
  changeEndDate(newVal) {
    if (notEmptyString(newVal, 7) && this.initialised) {
      this.endScaleDt = this.dateStrToJul(newVal);
      this.applySliderScale();
    }
  }

  @Watch('minuteSteps')
  changeMinutesSteps() {
    if (!this.changing) {
      this.updateDashaSpan();
    }
  }

  @Watch('timelineStep')
  changeTimelineStep() {
    if (!this.changing && (this.sliderActive || !this.initialised)) {
      this.currJd = this.calcStepJd(this.timelineStep) + (this.minuteSteps / 1440);
      this.updateDashaSpan();
      bus.$emit("dasha-open-jd", this.currJd);
    }
  }

  @Watch('dashaChartRef')
  changeDashaChartRef() {
    this.calcTransitPointSet();
  }

  handleDPClick(e) {
    if (e.target.classList.contains('birthday-picker_dropdown-header')) {
      const context = this.listingTabs[this.activeTab];
      bus.$emit('update-date',{dateVal: this.dateVal, context });
      this.showDatePicker = false;
    }
  }

  @Watch('chart')
  changeChart(chart: Chart) {
    if (this.initialised) {
      this.switching = true;
      if (chart.subject.eventType === "birth" || chart.parent !== this.c1._id) {
        this.sync();
        setTimeout(() => {
          this.updateDashaSpan();
        }, 250);
      } else {
        const subject = {
            ...chart.subject,
            name: julToDateParts(chart.jd, chart.tzOffset).dmyDate,
          };
          this.c2 = new Chart({...chart, subject });
          this.c2.setAyanamshaItem(this.settings.ayanamsha);
      }
      setTimeout(this.calcTransitPointSet, 250);
      setTimeout(() => {
        this.switching = false;
      }, 1000);
    }
  }

}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

#app  .predictive-panes {
  .top-actions {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-end;
    margin: 0.75em 0 0.25em 0;
  }

  .graha-chart {
    .widget {
      border: solid 0.125em $light-fg;
    }
  }

  .column-panes {
    grid-template-columns: 50% 13.333% 1fr;
    column-gap: 1vw;
    max-height: calc(100vh - 4rem);
    max-width: calc(153.333vh - 4rem);
    margin: 0 auto;
    .subpane {
      .toggle-large,
      .edit-content,
      .handle {
        display: none;
      }
      .options {
        margin-right: 0.5em;
      }
      &.expanded.wide,
      &.graha-chart {
        .widget {
          height: auto;
          aspect-ratio: 1/1;
        }
      }
      &.dasha-tree {
        height: 100%;
        > .widget {
          height: calc(100% - 1.5em);
        }
      }
    }

    .subpane > h4 {
      padding: 0 5em 0 0;
      > span {
        display: inline-block;
        font-size: 0.75em;
        width: 50%;
        .text-label {
          font-size: 0.9em;
        }
      }
    }

    &.show-submenu {
      .column > .options .submenu {
        opacity: 1;
        pointer-events: all;
      }
    }
  }
  .column {
    position: relative;
    padding: 0;
    > .options {
      position: absolute;
      top: 0;
      z-index: 30;
      right: 0;
      .submenu {
        position: absolute;
        top: 2em;
        right: 0;
        opacity: 0;
        pointer-events: none;
        width: 10em;
        background-color: $light-bg;
        outline: solid $medium-grey 0.25em;
        padding: 0.5em;
        .field {
          display: flex;
          flex-flow: row nowrap;
          justify-content: flex-start;
          .label {
            order: 3;
            font-weight: normal;
          }
          .radio {
            order: 1;
          }
        }
      }
    }
  }

  .middle-widgets {
    h4 {
      font-size: 0.9em;
      margin: 0.25em 0 0.1875em 0;
    }
  }
}

 #app #main .predictive-pane .subpanes {
    .tabs ul {
      justify-content: flex-start;
    }
    .dasha-tree {
      > h4, 
      .top-control.right {
        display: none;
      }
      .selection {
        position: relative;
        height: 1.5em;
        font-weight: bold;
        time {
          position: absolute;
          right:5%;
          top: 0.25em;
        }
        .icon {
          width: 2.5em;
          &::after {
            display: inline-block;
            content: "/";
            margin: 0 0.5em 0.125em 0.5em;
            font-size: 1.75rem;
            color: $dark-color;
          }
          &.dasha-level-3 {
            width: 1em;
            &::after {
              content: "";
              margin: 0;
            }
          }
        }
      }

      .timeline-table {
        max-height: calc(100% - 2em);
      }

      .dasha-set {
        max-height: calc(100% - 2em);
        min-height: calc(100vh - 8em);

        .dasha-list {
          top: 4em;
          border: solid 0.125em $dark-color;
          background-color: $light-bg;
          span.date {
            margin-right: 0;
          }
        }
      }
    }


    .predictive-controls {
      position: relative;
      background-color: $light-bg;
      padding: 0.5em 0.75em;
      border: solid 0.125em $dark-color;
      margin-top: 0.5em;
      > .toggle-control {
        position: absolute;
        z-index: 50;
        right: 0.25em;
        top: 0.25em;
        cursor: pointer;
      }
      .row {
        justify-content: center;
        align-items: center;
        position: relative;
        .control {
          font-size: 1vw;
        }
        select,
        .input {
          font-size: 1em;
        }
        .end-item {
          position: absolute;
          top: 0;
        }
        .end-date {
          right: 0;
        }
        .start-date {
          left: 0;
        }
        .icon {
          margin: 0 0.25em;
          cursor: pointer;
          &:hover {
            i {
              color: $active-color;
            }
          }
          i {
            &::before {
              font-size: 2em;
            }
          }
        }
      }
      &.playing {
        &.play-back .play-back,
        &.play-forward .play-forward {
          i::before {
            color: $blue;
          }
        }
      }
    }
  
    .tab-content {
      .tab-item {
        z-index: 30;
        background-color: white;
      }
      .progress-wrapper {
        position: absolute;
        top: 20vh;
        left: 0;
        right: 0;
        z-index: 1;
      }
    }
  }

#main {
  .timeline-table {

    .top-controls {
      display: flex;
      min-height: 3em;
      background-color: $light-bg;
      justify-content: center;
      align-items: center;
      margin-bottom: -0.25em;
      > label {
        font-size: 0.8em;
      }
      div.control label.checkbox {
        border-radius: 1em;
        padding: 0.25em 0.5em;
        height: 1.5em;
        margin-left: 0.5em;
      }
    }
    .b-table {
      margin-top: -0.5em;
      table.table {
        background-color: transparent;
      }
    }
    table {    
      thead, thead th, tbody tr > .head {
        background-color: $light-bg;
      }
      th.total {
        padding: 0.125em 0 0 0.125em;
        .th-wrap {
          font-size: 0.8em;
          transform: rotate(45deg);
          max-width: 1em;
        }
      }
      td, th {
        &.num-value {
          max-width: 1.75em;
          padding-right: 0.25em;
          padding-left: 0.25em;
        }
        &.avg {
          max-width: 2.125em;
          padding-left: 0.5em;
          padding-right: 0.125em;
          text-align: left;
        }
      }
      td {
        &.num-value {
          text-align: center;
        }
      }
      th {
        &.avg {
          font-size: 0.75em;
        }
      }
      tbody {
        font-size: 0.8em;
        tr td {
          i.icon {
            height: 1.4em;
            width: 2em;
            padding: 0.5em;
            margin: -0.25em 0;
            &.has-bindu {
              border-radius: 50%;
              background-color: $red-label;
              border: solid 0.125em $red-label;
              &::before {
                color: white;
              }
            }
          }
        }
      }
    }
  }
  .birth-date-picker-wrapper {
    position: absolute;
    left: 0.5em;
    top: 12em;
    z-index: 30;
  }
}
</style>