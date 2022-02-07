<template>
  <div class="pancha-pakshi-values side-panel" :class="wrapperClasses">
    <b-tabs v-if="hasValues" v-model="activeTab" :multiline="true">
      <b-tab-item v-for="yamaGroup in yamaSetGroups" :key="yamaGroup.key" :label="yamaGroup.label">
        <header class="side-header">
        <div class="bird-info top-left">
          <p class="birth-bird">
            <span class="text-label">Birth bird</span>
            <span class="text-value">{{birthBird}}</span>
          </p>
          <p class="ruling-bird">
            <span class="text-label">Ruling bird</span>
            <span class="text-value">{{periodBirds.ruling.key}}</span>
          </p>
          <p class="dying-bird">
            <span class="text-label">Dying bird</span>
            <span class="text-value">{{periodBirds.dying.key}}</span>
          </p>
        <p class="colors twin-values">
            <span class="text-label">Color</span>
            <span class="text-value best ruling" title="Best / ruling">{{periodBirds.ruling.color}}</span>
            <span class="text-value worst dying" title="Worst / dying">{{periodBirds.dying.color}}</span>
          </p>
          <p class="directions twin-values">
            <span class="text-label">Direction</span>
            <span class="text-value best ruling" title="Best / ruling">{{periodBirds.ruling.directions.join(' & ')}}</span>
            <span class="text-value worst dying" title="Worst / dying">{{periodBirds.dying.directions.join(' & ')}}</span>
          </p>
        </div>
        <div class="special-items column top-right">
          <div class="special row" v-for="row in specialItems" :key="row.itemKey">
            <span class="name">{{row.key}}</span>
            <span class="value">{{row.value}}</span>
            <span class="ruler">
              <i class="icon" :class="row.classNames"></i>
            </span>
          </div>
        </div>
        <div class="day-nav bottom">
          <b-button class="arrow prev" @click="prevDay" size="is-small">◀︎</b-button>
          <h4 class="ref-date" @click="showDatePicker">
            <b-icon icon="calendar" size="is-small" />
            <span class="text-date">{{displayJd}}</span>
          </h4>
          <b-button v-if="isNotToday" class="reset" @click="toDay" title="reset to today" size="is-small">⧎</b-button>
          <b-button class="arrow next" @click="nextDay" size="is-small">▶︎</b-button>
          <b-button class="section-toggle upper pp" @click="toggleSection(1)" :class="toggleClass(1)"></b-button>
        </div>     
      </header>
        <section class="section-pp">
          <div v-for="yamaSet in yamaGroup.sets" :key="yamaSet.key" class="yama-set">
          <h3 class="section-header" :title="longDate(yamaSet.start)">
            <span class="text-label">{{ yamaSet.label }}</span>
            <span class="info">{{ yamaSet.info }}</span>
          </h3>
          <b-table
            :data="yamaSet.subs"
            :row-class="(row, index) => assignRowClasses(row, index)"
            :mobile-cards="false"
            class="pancha-pakshi-table"
          >
            <template slot-scope="props">
              <b-table-column
                class="time"
                field="start"
                label
              >
                {{longTime(props.row.start)}}
              </b-table-column>
              <b-table-column
                class="bird"
                header-class="bird"
                field="bird"
                label="Bird"
              >
                {{props.row.bird | capitalize}}
              </b-table-column>

              <b-table-column
                class="rulers nowrap"
                header-class="rulers"
                field="rulers"
                label="Rulers"
              >
                <i v-for="ruler in props.row.rulerItems" :key="ruler.itemKey" class="icon" :class="ruler.classNames"></i>
              </b-table-column>
              <b-table-column
                class="activity"
                header-class="activity"
                field="activity"
                label="Activity"
              >
                {{conjugate3S(props.row.key)}}
              </b-table-column>
              <b-table-column
                class="direction"
                header-class="direction"
                field="direction"
                label="Direction"
              >
                {{props.row.direction}}
              </b-table-column>
              <b-table-column
                class="relation"
                header-class="relation"
                field="relations"
                label="Relations"
              >
                {{props.row.relationName}}
              </b-table-column>
              <b-table-column
                class="score"
                header-class="score"
                field="score"
                label="Score"
              >
                {{props.row.scoreDisplay}}
              </b-table-column>
              <b-table-column
                class="stars"
                header-class="stars"
                field="stars"
                label="Stars"
              >
                <span v-for="star in props.row.stars" :key="star.key" class="star" :class="star.classNames">
                  ⭑
                </span>
              </b-table-column>
            </template>
          </b-table>
          </div>
        </section>
      </b-tab-item>
    </b-tabs>
    <section class="section-transits">
      <b-button class="section-toggle lower transit-toggle" @click="toggleSection(2)" :class="toggleClass(2)"></b-button>
      <h3 class="section-label">{{transitsLabel}}</h3>
      <b-tabs v-if="hasValues" v-model="activeTransitionTab" :multiline="true">
        <b-tab-item label="Current Degrees">
          <extended-transitions-table :chart="chart" :transitions="dayTransitions" :tzOffset="offset" />
        </b-tab-item>
        <b-tab-item label="Natal Degrees">
          <extended-transitions-table :chart="chart" :transitions="birthTransitions" :tzOffset="offset" />
        </b-tab-item>
      </b-tabs>
    </section>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import {
  julToFullDateOnly,
  julToHMS,
  degAsDms,
  camelToTitle,
} from "../../api/converters";
import { DictionaryState, SettingState } from "../../store/types";
import { Chart } from "../../api/models/Chart";
import { fetchPanchaPakshi } from "@/api/methods";
import { fetchGeo, getGeoTzOffset } from "@/api/geoloc-utils";
import ExtendedTransitionsTable from "./ExtendedTransitionsTable.vue";
import { currentJulianDay, julianDayGeoOffsetToStart, julianDayOffsetToNoon, julToUnixTime, unixTimeToJul } from "@/api/julian-date";
import { bus } from "@/main";
import { calcTransitPoints, DashaSet, DashaSpan } from "@/api/models/DashaSet";
import { GeoLoc } from "@/api/models/GeoLoc";

@Component({
  filters: FilterSet,
  components: {
    ExtendedTransitionsTable
  }
})
export default class PanchaPakshiSidePanel extends Vue {
  @Prop({ default: 0 }) readonly nowJd: number;
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => [] }) readonly dashas: DashaSpan[];
  @Prop({ default: () => new DashaSet() }) readonly dashaSet: DashaSet;
  @State("dictionary") dictionary: DictionaryState;
  @State("settings") settings: SettingState;

  private initialised = false;

  private dayTransitions = [];

  private birthTransitions = [];

  private geo: any = {};

  private activeTab = 0;

  private activeTransitionTab = 0;

  private showMode = [1, 2];

  private currJd = 0;

  private riseJd = 0;

  private setJd = 0;

  private nextSetJd = 0;

  private yamaSetGroups: any[] = [];

  private bird = {
    birth: "",
    current: {
      ruling: "",
      dying: "",
    },
    next: {
      ruling: "",
      dying: "",
    }
  };

  private special: any = {
    rulers: {}
  };

  private topValues = {
    color: {
      best: '',
      worst: '',
    },
    direction: {
      best: '',
      worst: '',
    },

  }

  private transitPoints: string[] = [];

  loading = false;

  loaded = false;

  mounted() {
    this.currJd = this.nowJd;
    this.moveDay(0);
    setTimeout(this.load, 125);
    bus.$on('update-date', ({dateVal, context}) => {
      if (context === 'panchapakshi') {
        const offset = 1 / (360 / this.geo.lng);
        const currJd = unixTimeToJul(dateVal / 1000) + offset + 0.5;
        this.currJd = julianDayGeoOffsetToStart(currJd, this.geo.lat);
      }
    })
  }

  load() {
    this.loaded = false;
    if (!this.loading) {
      this.yamaSetGroups = [];
      this.loading = true;
      fetchGeo((data) => {
        const { latitude, longitude } = data;
        if (!this.initialised) {
          this.currJd = julianDayGeoOffsetToStart(this.nowJd, latitude);
        }
        this.geo = new GeoLoc(data);
        fetchPanchaPakshi(this.chart._id, latitude, longitude, this.currJd).then(result => {
          if (result.valid) {
            this.initialised = true;
            this.calcTransitPointSet();
            const keys = Object.keys(result);
            this.riseJd = result.rise;
            this.setJd = result.set;
            this.nextSetJd = result.nextSet;
            if (keys.includes('yamas')) {
              this.yamaSetGroups.push({
                type: 'day',
                label: 'Day',
                key: 'yama-group-day',
                sets: this.mapYamaSets(result.yamas)
              });
              if (keys.includes('yamas2')) {
                this.yamaSetGroups.push({
                  type: 'night',
                  label: 'Night',
                  key: 'yama-group-night',
                  sets: this.mapYamaSets(result.yamas2)
                });
              }
            }
            this.bird = result.bird;
            this.special = result.special;
            if (keys.includes("transitions")) {
              if (result.transitions instanceof Array) {
                this.dayTransitions = result.transitions;
              }
            }
            if (keys.includes("birthTransitions")) {
              if (result.birthTransitions instanceof Array) {
                this.birthTransitions = result.birthTransitions;
              }
            }
            setTimeout(() => {
              this.loading = false;
            }, 250);
          }
        })
      })
    }
  }

  showDatePicker() {
    const dateTs = julToUnixTime(this.currJd) * 1000;
    bus.$emit('show-date-picker', {dateTs});
  }

  get currentYamaSets() {
    return this.activeTab < this.yamaSetGroups.length ? this.yamaSetGroups[this.activeTab].sets : [];
  }

  get displayJd() {
    const refJd = this.hasValues ? this.activeTab === 0 ? this.riseJd : this.setJd : this.nowJd;
    return this.longDate(refJd);
  }

  get subYamas() {
    return this.currentYamaSets.map(s => s.subs).reduce((a, b) => a.concat(b), []);
  }

  get birthBird() {
    return this.bird.birth;
  }

  get periodBirds() {
    return this.activeTab === 0 ? this.bird.current : this.bird.next;
  }

  get specialObject() {
    const keys = this.special instanceof Object ? Object.keys(this.special) : [];
    const secKey = this.activeTab === 0 ? 'day' : 'night';
    return keys.includes(secKey)? this.special[secKey] : {};
  }

  toggleSection(sectionNum = 1) {
    const showModeIndex = this.showMode.indexOf(sectionNum);
    if (showModeIndex < 0) {
      this.showMode.push(sectionNum);
    } else {
      this.showMode.splice(showModeIndex, 1);
    }
  }

  toggleClass(sectionNum = 1) {
    return this.showMode.includes(sectionNum) ? 'expanded' : 'collapsed';
  }

  get wrapperClasses() {
    const cls = [];
    if (this.showMode.includes(1)) {
      cls.push('show-pp-tables');
    }
    if (this.showMode.includes(2)) {
      cls.push('show-transit-tables');
    }
    return cls;
  }

  get transitsLabel() {
    return this.showMode.includes(2)? this.displayJd : 'Current and Natal Transitions';
  }

  get specialItems() {
    return Object.entries(this.specialObject).filter(entry => entry[0] !== 'rulers').map(entry => {
      const [key, row] = entry;
      const obj: any = row instanceof Object ? row : {};
      const keys = Object.keys(obj);
      const numKey = keys.includes("num")? obj.num.toString() : obj.key;
      const lex = this.dictionary.lexeme(key, numKey);
      const value = lex instanceof Object ? lex.text("sa", "standard", "lt") : numKey;
      const classNames = [['icon', obj.ruler].join('-')];
      const levelIndex = this.transitPoints.indexOf(obj.ruler);
      if (levelIndex >= 0) {
        classNames.push(['level', (levelIndex + 1)].join('-'));
      }
      return {
        key,
        itemKey: ['special', key].join('-'),
        ruler: obj.ruler,
        value,
        num: numKey,
        classNames
      }
    });
  }

  moveDay(num = 0) {
    if (num === 0) {
      this.currJd = julianDayGeoOffsetToStart(this.nowJd, this.geo.lat);
    } else {
      this.currJd += num;
    }
  }

  nextDay() {
    this.moveDay(1);
  }

  prevDay() {
    this.moveDay(-1);
  }

  toDay() {
    this.moveDay(0);
  }

  conjugate3S(verb: string) {
    const root = verb.replace(/ing$/, '');
    switch (root) {
      case 'dy':
        return 'dies';
      case 'rul':
        return 'rules';
      default:
        return `${root}s`;
    }
  }

  mapYamaSets(yamas = []) {
    return yamas.map((yama, index) => {
      const { num, start, end, subs } = yama;
      if (subs instanceof Array && subs.length > 0) {
        const first = subs[0];
        const firstAct = this.conjugate3S(first.key);
        const subRows = subs.map((sub, si) => {
          const starNum = Math.floor(sub.score * 5) + 1
          const stars = [1,2,3,4,5].map(num => {
            const active = num <= starNum;
            const key = ['star', num, index, si].join('-');
            const classNames = [['star', num].join('-'), active ? 'active' : 'inactive'];
            return {
              num, 
              key,
              active,
              classNames,
            }
          });
          const relationName = this.matchRelation(sub.relation)
          const scoreDisplay = sub.score.toFixed(3);
          const current = this.nowJd >= sub.start && this.nowJd < sub.end; 
          const rulerItems = sub.rulers instanceof Array ? sub.rulers.map((key, ri) => {
            const itemKey = ['ruler', index, si, ri, key].join('-');
            const tpIndex = this.transitPoints.indexOf(key);
            const level = tpIndex >= 0 ? tpIndex + 1 : -1;
            const classNames = [['icon', key].join('-')];
            if (tpIndex >= 0) {
              classNames.push(['level', (tpIndex + 1)].join('-'));
            }
            return { key, itemKey, classNames, level };
          }) : [];
          return {...sub, rulerItems, current, relationName, stars, scoreDisplay }
        });
        const key = ['yama-set', index, num].join('-');
        const label = `Yama ${num}`;
        const range = [this.longTime(yama.start), this.longTime(yama.end)].join(' to ');
        return {
          num,
          key,
          start,
          end,
          label,
          info: `${range} ${first.bird} ${firstAct} in ${first.direction}`,
          subs: subRows,
          valid: true
        };
      } else {
        return { valid: false }
      }
    }).filter(ys => ys.valid);
  }

  matchRelation(relKey = "") {
    switch (relKey) {
      case "E":
        return "Enemy";
      case "F":
        return "Friend";
      case "S":
        return "Self";
      default:
        return "";
    }
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

  get isNotToday() {
    const nowJd = julianDayOffsetToNoon(currentJulianDay(), this.tzOffset);
    return this.currJd < (nowJd - 0.55) || this.currJd > (nowJd + 0.55);
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

  get hasGeoData() {
    const keys = this.geo instanceof Object ? Object.keys(this.geo) : [];
    return keys.includes("countryName") && keys.includes("shortTz");
  }

  get hasTransitions() {
    return this.dayTransitions instanceof Array ? this.dayTransitions.length > 0 && this.birthTransitions.length > 0: false;
  }

  get tzAbbr() {
    return this.hasGeoData ? this.geo.shortTz : '';
  }

  get hasValues(): boolean {
    return this.yamaSetGroups.length > 0;
  }

  assignRowClasses(row = null, index: number) {
    const currentClass = row.current? 'current' : 'not-current';
    return [
      ["index", index].join("-"),
      ["sub-yama", (index+1)].join("-"),
      currentClass
    ];
  }

  calcTransitPointSet() {
    this.transitPoints = calcTransitPoints(this.dashas, this.dashaSet, this.currJd);
  }

  get tzOffset() {
    return getGeoTzOffset();
  }

  longTime(jd: number) {
    return julToHMS(jd, this.tzOffset);
  }

  longDate(jd: number) {
    return julToFullDateOnly(jd, this.tzOffset);
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
<style lang="scss">
@import "@/styles/variables.scss";
#app .pancha-pakshi-values {

  @media (max-width: $min-large-width) {
    font-size: 0.95em;
  }

  @media (max-width: $min-mlarge-width) {
    font-size: 0.9em;
  }

  .section-transits,
  .section-pp {
    position: relative;
    overflow: hidden;
    transition: max-height 1s ease-in-out;
    clear: both;
  }

  .section-pp {
    max-height: 0;
  }

  .section-transits {
    .section-label {
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    nav.tabs li {
      opacity: 0;
    }
  }

  .section-transits {
    max-height: 2em;
    top: 0;
  }

  &.show-transit-tables .section-transits,
  &.show-pp-tables .section-pp {
    max-height: 100em;
  }

  &.show-transit-tables .section-transits {
    .section-label {
      top: 3.5em;
      z-index: 50;
    }
    nav.tabs li {
      opacity: 1;
    }
  }

  .section-toggle {
    position: absolute;
    right: 0;
    background-color: white;
    padding: 0.25em;
    &.expanded {
      &::before {
        content: "▼";
      }
    }
    &.collapsed {
      &::before {
        content: "▶︎";
      }
    }
    height: 1.75em;
    width: 1.75em;
    align-self: flex-end;
    &.lower {
      top: 0;
      margin-top: -2em;
      top: 2em;
    }
    &.upper {
      
      bottom: 0;
    }
  }

  .side-header {
    display: grid;
    position: relative;
    grid-template-areas: "left right"
                          "bottom bottom";
    grid-template-columns: 1fr 1fr;
    p {
      > span, > i, > em {
        display: inline-block;
        margin-right: 0.5em;
        &:last-child {
          margin-right: 0;
        }
      }
      span.text-label {
        font-weight: bold;
      }
      &.dying-bird .text-label {
        color: $red-label;
      }
      &.ruling-bird .text-label {
        color: $green-label;
      }
      &.birth-bird .text-label {
        color: $blue-label;
      }
    }
    .top-left {
      grid-area: left;
    }
    .top-right {
      grid-area: right;
      font-size: 0.9em;
    }
    .bottom {
      grid-area: bottom;
      display: flex;
      flex-flow: row nowrap;
    }

    .row {
      max-height: 1.3125em;
    }
  }

  .yama-set {
    position: relative;
    .b-table {
      margin-bottom: -0.375em;
    }
    .section-header {
      background-color: $light-bg;
      position: absolute;
      display: flex;
      flex-flow: row nowrap;
      top: 0.75em;
      left: 0;
      right: 0;
      height: 1.75em;
      z-index: 20;
      padding: 0 0.5em;
      justify-content: flex-start;
      align-items: center;
      text-align: left;
      span {
        display: inline-block;
        &.text-label {
          width: 6em;
        }
      }
    }
  }

  thead {
    th {
      .th-wrap {
        max-width: 1em;
        overflow: hidden;
        opacity: 0;
      }
    }
  }
  tr {
    &.current {
      td, td * {
        font-weight: bold;
      }
    }
  }
  td {
    &.stars {
      white-space: nowrap;
    }
    .star {
      display: inline-flex;
      position: relative;
      transform: scale(1.75);
      &.active {
        color: $yellow-label;
        filter: brightness(0.75);
      }
      &.inactive {
        color: $light-grey;
      }
    }
  }

  .best,
  .level-1 {
    color: $red-label;
  }

  .worst,
  .level-2 {
    color: $blue-label;
  }
  
  .level-3 {
    color: $green-label;
  }

  .side-header {
    div, p {
      text-align: left;
    }
    p {
      white-space: nowrap;
    }
    .text-label {
      font-size: 0.9em;
    }
    .bird-info {
      p {
        padding: 0;
        line-height: 1.125em;
      }
      .twin-values {
        .text-value {
          width: 3.75rem;
        }
        &.colors {
          .text-value {
            font-size: 0.9em;
          }
        }
      }
      .text-label {
        width: 6em;
        font-size: 0.9em;
      }
      .text-value {
        font-size: 1em;
      }
    }
    .special-items {
      .name {
        width: 4.5em;
        font-weight: bold;
      }
      .value {
        width: 7em;
      }
      .row {
        .ruler {
          font-size: 1em;
          .icon {
            margin: 0;
            width: 1em;
            height: 1em;
            font-size: 0.833333em;
          }
          &::before {
            content: "[";
          }
          &::after {
            content: "]";
          }
        }
      }
    }
  }


  .bottom {
    margin-top: 0.5em;
    h4 {
      display: inline-block;
      margin: 0 0.25em;
      white-space: nowrap;
      padding: 0;
      cursor: pointer;
      .text-date {
        display: inline-block;
        margin: 0 0.25em;
      }
    }
    button {
      &.next {
        margin-right: 1em;
      }
    }
  }
}

#app #main .pancha-pakshi-table {
  table.table {
    tr {
      width: 100%;
      td {
        font-size: 0.8em;
        padding: 0.25em 0.25em 0.125em 0.375em;
      }
    }
  }
}
#app .transitions table td .text-label {
  white-space: nowrap;
}
</style>