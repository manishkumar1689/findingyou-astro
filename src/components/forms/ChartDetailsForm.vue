<template>
  <fragment>
    <form class="edit-form chart-form collapsible" :class="wrapperClasses">
      <h3 class="form-title"  @click="toggleCollapse">
        <span class="text">{{formTitle}}</span>
        <div class="mode-toggle">
          <b-radio-button class="current" v-model="mode" native-value="new" size="is-small" type="is-light">New</b-radio-button>
          <b-radio-button class="new" v-model="mode" native-value="current" size="is-small" type="is-light">Saved</b-radio-button>
        </div>
      </h3>
      <fieldset class="chart-entry inner" @click="registerEdited">
        <p v-if="showParentInfo" class="parent-info">
          <b-icon icon="account-star" @click.native="loadParent" class="parent-chart" title="Open birth chart" />
          <span class="text">{{parentInfo}}</span>
          <b-button @click="newEvent" icon-left="plus" :rounded="true" type="is-small">{{newEventLabel}}</b-button>
        </p>
        <b-field class="form-row actions top" @mouseleave.native="postValidate" :type="formStateType('nameGender')">
          <b-input
            v-if="showSimpleNameField"
            size="40"
            class="name"
            v-model="name"
            type="text"
            :placeholder="namePlaceholder"
          />
          <b-autocomplete
            v-else
            :data="suggestedChartNames"
            :placeholder="namePlaceholder"
            field="name"
            v-model="name"
            class="name"
            :class="nameClasses"
            @typing="matchChartName"
            @select="selectChartName"
          >
            <template slot-scope="props">
              <div class="row">
                {{ props.option.name }}
              </div>
            </template>
          </b-autocomplete>
          <b-select
            v-if="!isDefaultBirthChart"
            placeholder="Gender"
            v-model="gender"
            class="gender"
          >
            <option
              v-for="opt in genderOptions"
              :value="opt.key"
              :key="opt.key"
              >{{ opt.name }}</option
            >
          </b-select>
        </b-field>
        <b-field class="grid-row date-time" @mouseleave.native="postValidate" @click.native="hideDP" :id="birthPickerId" :class="formStateType('datetime')">
          <birth-date-picker
            v-model="dateVal"
            :maxYear="maxYear"
            :minYear="minYear"
            delimiter="/"
            :closeOnSet="false"
          />
          <b-input size="is-medium" v-model="timeVal" class="time" type="time" :step="1" 
            />
          <div class="tz-info">{{tzInfo}}</div>
        </b-field>
        <b-field class="form-row locality-row" :class="localityClasses" @mouseleave.native="postValidate" :type="formStateType('geoloc')">
          <b-autocomplete
            v-if="!editLocalityMode"
            :data="suggestedLocations"
            :placeholder="locationPlaceholder"
            field="title"
            class="placename"
            :loading="isFetching"
            @typing="matchPlacename"
            @select="selectPlacename"
          >
            <template slot-scope="props">
              <div class="row">
                <span class="placename">{{ props.option.name }}</span>
                <em v-if="props.option.region.length > 1" class="region">{{
                  props.option.region
                }}</em>
                <em class="country">{{ props.option.country }}</em>
              </div>
            </template>
          </b-autocomplete>
          <b-input
            v-if="editLocalityMode"
            v-model="tempLocMatch"
            class="locality"
          />
          <span v-if="!isNew" class="edit" @click.stop="editLocality">
            <b-icon v-if="hasLocality" :icon="localityEditIcon" />
          </span>
        </b-field>
        <geolocation-input :geo="geo" @mouseleave="postValidate" :type="formStateType('geoloc')" />
        <b-field class="grid-row type-row" @mouseleave.native="postValidate" :type="formStateType('roddenType')">  
          <b-select
            v-if="!isDefaultBirthChart"
            placeholder="Event Type"
            v-model="eventType"
            class="event-type"
          >
            <option
              v-for="opt in eventTypeOptions"
              :value="opt.key"
              :key="opt.key"
              >{{ opt.name }}</option>
          </b-select>
          <b-select
            v-if="showRodden"
            placeholder="Rodden Scale"
            v-model="roddenValue"
            class="rodden"
          >
            <option
              v-for="opt in roddenOptions"
              :value="opt.key"
              :key="opt.key"
              >{{ opt.name }}</option
            >
          </b-select>
        </b-field>
        <b-field class="notes collapsible" :class="notesClasses" @mouseleave.native="postValidate">
          <h4 class="field-title" @click="toggleNotesCollapse">{{notesLabel}}</h4>
          <b-input class="notes inner" v-model="notes" type="textarea" cols="40" rows="3" />
        </b-field>
        <div v-if="error" class="error-messages">
          <ul>
            <li v-for="(msg, mi) in messages" :key="['chart-form-message', index, mi].join('-')">{{msg}}</li>
          </ul>
        </div>
        <div
          v-if="showSubmit"
          class="form-row actions bottom"
          :class="submitClasses"
        >
          <b-button
            icon-left="send"
            class="submit"
            @click.stop.prevent="submit"
            size="is-medium"
            type="is-success"
            >Calculate and Save</b-button
          >
        </div>
      </fieldset>
    </form>
    <RelationshipForm v-if="hasPaired" :paired="paired" />
  </fragment>
</template>

<script lang="ts">
import { State, Action, Getter } from "vuex-class";
import { Component, Prop, Watch, Vue } from "vue-property-decorator";
import birthDatePicker from "vue-birth-datepicker";
import GeolocationInput from "../widgets/GeolocationInput.vue";
import ChartManager from "../widgets/ChartManager.vue";
import RelationshipForm from "../forms/RelationshipForm.vue";
import {
  saveUserChart,
  fetchPlacenames,
  fetchChart,
  getPairedByChartIds,
  savePairedChart,
  matchChartNamesByUser,
  fetchRoddenValues,
  getTzData,
} from "../../api/methods";
import { notEmptyString, isNumeric, emptyString } from "../../api/validators";
import eventTypeValues from "../../api/mappings/event-type-values";
import { bus } from "../../main";
import {
  smartCastFloat,
  asDateString,
  toDateTime,
  offsetDate,
  longDate,
  smartCastInt,
  hourMinTz,
} from "../../api/converters";
import {
  ChartFormSetState,
  DictionaryState,
  UserState,
} from "../../store/types";
import { GeoLoc } from "../../api/models/GeoLoc";
import { ChartForm } from "../../api/models/ChartForm";
import { FilterSet } from "../../api/composables/FilterSet";
import { Chart, PairedChart } from "../../api/models/Chart";
import { KeyName } from "../../api/interfaces";
import { extractCorePlacenames } from "../../api/helpers";
import {
  buildChartForm,
  genderOptions,
  transformKeyNameOptions,
} from "@/api/mappers";
import { julToDateParts, julToUnixMillisecs } from "@/api/julian-date";

const defaultState = {
  nameGender: 1,
  datetime: 1,
  geoloc: 1,
  roddenType: 1
};

const editedStates = {
  name: false,
  gender: false,
  date: false,
  time: false,
  geoloc: false,
  rodden: false,
}

@Component({
  components: {
    birthDatePicker,
    GeolocationInput,
    ChartManager,
    RelationshipForm,
  },
  filters: FilterSet,
})
export default class ChartDetailsForm extends Vue {
  @Prop({ default: 0 }) index: number;
  @Prop({ default: true }) enableSubmit: boolean;
  @Prop({ default: true }) singleMode: boolean;
  @Prop({ default: true }) enableNew: boolean;
  @Prop({ default: false }) keepRelationsForm: boolean;
  @State("chartForms") chartForms: ChartFormSetState;
  @State("dictionary") dictionary: DictionaryState;
  @State("user") user: UserState;
  @Action("addForm", { namespace: "chartForms" }) addForm: any;
  @Getter("getChartOptions", { namespace: "chartForms" })
  getChartOptions!: [];
  @Action("appendForm", { namespace: "chartForms" })
  appendForm: any;

  private formTitle = "Chart information";

  private datetime = new Date();

  private dateVal = 0;

  private timeVal = "12:00:00";

  private maxYear = 2030;

  private minYear = 1600;

  private form = new ChartForm();

  private paired = null;

  private geo = new GeoLoc([0, 0, 0]);

  private geoChanged = false;

  private dateChanged = false;

  private error = false;

  private messages = [];

  private _id = "";
  private name = "";
  private gender = "-";
  private isDefaultBirthChart = false;
  private type = "person";
  private eventType = "birth";
  private notes = "";
  private roddenScale = "";
  private roddenValue = -1;
  private roddenValues: Array<KeyName> = [];
  private selectedChartId = "";
  private initialized = false;
  private suggestedLocations = [];
  private suggestedChartNames = [];
  private tempLocMatch = "";
  private mode = "current";
  private expanded = true;new
  private notesExpanded = false;
  private editMode = true;
  private isFetching = false;
  private editLocalityMode = false;
  private saving = false;

  private formStates = Object.assign({}, defaultState);
  private editedStates = Object.assign({}, editedStates);
  private parentSubject = null;
  private tzInfo = '';

  created() {
    fetchRoddenValues().then((items) => {
      this.roddenValues = items;
    });
    setTimeout(this.sync, 1000);
    bus.$on("switch-chart", ({ chart, index, context }) => {
      if (index === this.index && chart instanceof Chart) {
        this.syncChart(chart);
      }
    });
    bus.$on("show-form", ({ index, chartId }) => {
      if (index === this.index) {
        if (typeof chartId === "string" && chartId !== "current") {
          this.selectedChartId = chartId;
        }
      }
    });
    bus.$on("new-form", (index) => {
      if (index === this.index) {
        this.newChart();
      }
    });
    bus.$on("restore", (index) => {
      if (index === this.index) {
        this.sync();
      }
    });
    bus.$on("save-chart-form", (index) => {
      if (index === this.index) {
        this.submit();
      }
    });
    bus.$on("sync-form", (index) => {
      if (index === this.index) {
        this.initialized = false;
        this.sync();
      }
    });
    bus.$on("load-life-event", item => {
      this.loadChart(item._id);
    });
    bus.$on("new-event", eventType => {
      this.syncEvent(eventType);
    });
    bus.$on("set-paired-chart", () => {
      setTimeout(this.sync, 250);
    });
    if (this.index > 0) {
      bus.$on("edited-paired-settings", (data) => {
        const { typeName } = data;
        const relTypeName = notEmptyString(typeName)? typeName : "";
        savePairedChart({...data, user: this.user._id,}, relTypeName).then((result) => {
          let type = "is-danger";
          if (result.valid && this.paired instanceof PairedChart) {
            type = "is-success";
            const { relType, tags, startYear, span } = result.paired;
            if (tags instanceof Array) {
              this.paired.tags = tags;
            }
            if (notEmptyString(relType)) {
              this.paired.relType = relType;
            }
            if (isNumeric(startYear)) {
              this.paired.startYear = startYear;
            }
            if (isNumeric(span)) {
              this.paired.span = span;
            }
            this.$ls.set("selected-pc", this.paired);
            setTimeout(this.sync, 250);
            setTimeout(() => {
              this.$emit("refresh-paired-chart", this.paired);
            }, 750);
            this.toast("Paired chart attributes saved", 5000, type);
          }
        });
      });
    }
    setTimeout(() => {
      if (this.hasChart) {
        this.sync();
      }
    }, 3000);
  }

  toast(message = "", duration = 3000, type = "is-success") {
    this.$buefy.toast.open({
      duration,
      message,
      position: "is-bottom",
      type,
    });
  }

  resetFormStates() {
    this.error = false;
    this.messages = [];
    this.formStates = Object.assign({}, defaultState);
    this.editedStates = Object.assign({}, editedStates);
  }

  sync() {
    this.resetFormStates();
    this.getForm();
    const key = this.index > 0 ? "c2" : this.singleMode? "single" : "c1";
    let cId = this.$ls.get(key);
    if (this.singleMode && emptyString(cId)) {
      cId = this.$ls.get("c1");
    }
    this.selectedChartId = cId;
    if (this.hasChart) {
      this.populateForm();
    }
    if (this.chart.hasParent) {
      fetchChart(this.user._id, this.chart.parent).then(result => {
        if (result.valid) {
          this.setParentSubject(new Chart(result.chart));
        }
      });
    }
    this.setDefaultDatetime();
    setTimeout(() => {
      this.initialized = true;
    }, 2500);
  }

  syncEvent(eventType = "event", updateParentRef = true) {
    if (this.chart instanceof Chart) {
      if (updateParentRef) {
        this.assignParentSubject();
      }
      this.newChart(eventType);
    }
  }

  loadParent() {
    this.loadChart(this.parentId);
  }

  assignParentSubject() {
    if (this.chart.isBirthChart) {
      this.setParentSubject(this.chart);
    }
  }

  setParentSubject(chart: Chart) {
    const { _id, subject, parent, jd, tzOffset, geo } = chart;
    if (subject instanceof Object) {
      this.parentSubject = { ...subject, ...geo, _id, parent, jd, tzOffset };
      this.$ls.set("parent", this.parentSubject);
    }
  }

   loadChart(chartId = "") {
    this.assignParentSubject();
    if (notEmptyString(chartId, 16) && chartId !== this.selectedChartId) {
      fetchChart(this.user._id, chartId).then(result => {
        if (result.valid) {
          this.$ls.set('c1', chartId);
          this.selectedChartId = chartId;
          this.sync();
          bus.$emit('chart-loaded', result.chart, 0);
        }
      });
    }
  }

  newEvent() {
    this.syncEvent(this.eventType, false);
  }

  get parentInfo() {
    let str = "";
    if (this.parentSubject instanceof Object) {
      const { name, gender, jd, tzOffset } = this.parentSubject;
      const shortDate = julToDateParts(jd, tzOffset).dmyDate;
      str = `${name} (${gender}) ${shortDate}`;
    }
    return str;
  }

  get parentId() {
    const parRef = this.parentAttribute("_id");
    return notEmptyString(parRef, 16) ? parRef : "";
  }

  get newEventLabel() {
    const evt = this.eventTypeOptions.find(ev => ev.key === this.eventType);
    const evTypeName = evt instanceof Object? evt.name : "";
    return `Add ${evTypeName}`;
  }

  parentAttribute(key = "_id") {
    let keyValue: any = null;
    if (this.parentSubject instanceof Object) {
      if (Object.keys(this.parentSubject).includes(key)) {
        keyValue = this.parentSubject[key];
      }
    }
    return keyValue;
  }

  syncChart(chart: Chart) {
    this.selectedChartId = chart._id;
    const cf = new ChartForm();
    cf.loadResults(chart);
    this.addForm(cf);
  }

  populateForm() {
    const {
      name,
      gender,
      type,
      notes,
      eventType,
      roddenValue
    } = this.form.chart.subject;
    this.tempLocMatch = "";
    const { isDefaultBirthChart } = this.form.chart;
    
    const { lat, lng, alt } = this.form.chart.geo;

    if (isNumeric(lat) && isNumeric(lng)) {
      this.geo = new GeoLoc([lat, lng, alt]);
    } else {
      const form = this.$ls.get("form");
      if (form instanceof Object) {
        this.geo.lat = smartCastFloat(form.lat);
        this.geo.lng = smartCastFloat(form.lng);
        this.geo.alt = smartCastFloat(form.alt);
        this.roddenValue = smartCastInt(form.roddenValue);
        this.gender = form.gender;
      }
    }
    this.name = name;
    this.isDefaultBirthChart = isDefaultBirthChart;
    this.type = type;
    this.gender = gender;
    this.notes = notEmptyString(notes)? notes : "";
    this.eventType = notEmptyString(eventType, 3) && eventType !== type? eventType : "birth";
    this.roddenValue = smartCastInt(roddenValue);
    this.selectedChartId = this.form.chart._id;
    this.setDefaultDatetime();
  }

  registerEdited(e) {
    const {target} = e;
    const tgName = target.tagName.toLowerCase();
    let cls = null;
    switch (tgName) {
      case 'input':
        cls = target.parentNode.classList;
        break;
      case 'select':
        cls = target.parentNode.parentNode.classList;
        break;
    }
    if (cls !== null) {
      if (cls.contains('name')) {
        this.editedStates.name = true;
      } else if (cls.contains('gender')) {
        this.editedStates.gender = true;
      } else if (cls.contains('coords')) {
        this.editedStates.geoloc = true;
      } else if (cls.contains('rodden')) {
        this.editedStates.rodden = true;
      } else if (cls.contains('birthday-picker')) {
        this.editedStates.date = true;
      } else if (cls.contains('placename')) {
        this.editedStates.geoloc = true;
      } else if (cls.contains('time')) {
        this.editedStates.time = true;
      }
    }
  }

  get isNew() {
    return !this.form.hasId;
  }

  get showParentInfo() {
    return this.eventType !== "birth";
  }

  get showSimpleNameField() {
    return (
      ((this.index > 0 || this.isNew) && !this.isDefaultBirthChart) === false
    ) || !this.isBirthChart;
  }

  get localityEditIcon() {
    return this.editLocalityMode ? "magnify" : "pencil";
  }

  get selectedIds() {
    return [this.chart._id];
  }

  get hasPaired() {
    return this.paired instanceof PairedChart;
  }

  get wrapperClasses() {
    const cls = [["chart-form", this.index + 1].join("-"), this.expanded? 'open' : "closed"];
    if (this.hasChart) {
      cls.push("has-chart");
    }
    if (this.placenames.length > 2) {
      cls.push("has-placename");
    }
    return cls;
  }

  get localityClasses() {
    return this.isNew? "full-width" : "may-edit";
  }

  get notesClasses() {
    return [this.notesExpanded? 'open' : "closed"];
  }

  get nameClasses() {
    return this.showSimpleNameField
      ? "simple"
      : this.name.length > 1
      ? "selected"
      : "unselected";
  }

  get notesLabel() {
    switch (this.eventType) {
      case "birth":
        return "Birth data source notes";
      default:
        return "Event notes";
    }
  }

  get chartOptions() {
    const first = { key: "__new", name: "New" };
    return [first, ...this.getChartOptions];
  }
  get infoKey() {
    return ["chart-form", this.index].join("-");
  }

  get birthPickerId() {
    return ['birth-picker', this.index].join('-');
  }

  formStateType(key: string) {
    let num = 1;
    const keys = Object.keys(this.formStates);
    if (keys.includes(key)) {
      num = this.formStates[key];
    }
    switch (num) {
      case 0:
        return "is-danger";
      case 1:
        return "is-normal";
      case 2:
        return "is-success";
    }
  }

  getForm() {
    let matched = null;
    if (this.index < this.chartForms.forms.length) {
      const refName = `c${this.index + 1}`;

      const ref = this.$ls.get(refName);
      const needsC1 = notEmptyString(ref) && this.index === 0;
      if (needsC1) {
        matched = this.chartForms.forms.find((cf) => cf.id === ref);
        if (!matched) {
          fetchChart(this.user._id, ref).then((result) => {
            if (result.valid) {
              this.assignChart(result.chart);
            }
          });
        }
      } else {
        const c1Id = this.$ls.get("c1");
        const pc = this.$ls.get("selected-pc");
        let pairAssigned = false;
        if (!this.keepRelationsForm) {
          this.paired = null;
        }
        if (pc instanceof Object) {
          const keys = Object.keys(pc);
          if (keys.includes("c1") && keys.includes("c2")) {
            if (pc.c1._id === c1Id && pc.c2._id === ref) {
              this.assignChart(pc.c2);
              setTimeout(() => {
                this.paired = new PairedChart(pc);
                pairAssigned = true;
              }, 375);
            }
          }
        }
        if (!pairAssigned && c1Id !== ref) {
          getPairedByChartIds(c1Id, ref).then((data) => {
            if (data.valid) {
              const { item } = data;
              const chart = item.c1._id === c1Id ? item.c2 : item.c1;
              this.assignChart(chart);
              this.paired = new PairedChart(item);
            }
          });
        }
      }
    }
    if (matched instanceof ChartForm) {
      this.form = matched;
    }
  }

  assignChart(chart = null) {
    this.form = buildChartForm(chart);
    this.populateForm();
    this.appendForm(this.form);
  }

  async matchPlacename(search = "") {
    if (notEmptyString(search, 1)) {
      if (!this.isFetching) {
        this.isFetching = true;
        this.tempLocMatch = "";
        await fetchPlacenames(search).then((data) => {
          if (data.valid) {
            this.suggestedLocations = data.items;
            setTimeout(() => {
              this.isFetching = false;
            }, 50);
          }
        });
      }
      setTimeout(() => {
        this.isFetching = false;
      }, 1000);
    }
    setTimeout(() => {
      this.isFetching = false;
    }, 2000);
  }

  selectPlacename(item) {
    if (item instanceof Object) {
      let { lat, lng } = item;
      if (isNumeric(lat) && isNumeric(lng)) {
        lat = smartCastFloat(lat);
        lng = smartCastFloat(lng);
        this.geo = new GeoLoc([lat, lng, 0]);
        this.tempLocMatch = [item.fullName, item.country].join(", ");
        const datePart = this.dateChanged? new Date(this.dateVal).toISOString().split("T").shift() : "";
        const geo = new GeoLoc([lat,lng]);
        getTzData(geo, datePart).then(result => {
          if (result.valid) {
            const tzAbbr = notEmptyString(result.shortTz) && /^[A-Z]+$/i.test(result.shortTz)? result.shortTz : "";
            const parts = [["UTC", hourMinTz(result.tzOffset, true)].join(" ")];
            if (notEmptyString(tzAbbr)) {
              parts.unshift(tzAbbr);
            }
            this.tzInfo = parts.join(" / ");
          }
        });
      }
    }
  }

  selectChartName(item) {
    const relKey = this.index > 0 ? "c2" : "c1";
    const otherKey = this.index > 0 ? "c1" : "c2";
    const otherChart = this.$ls.get(otherKey);
    if (
      item instanceof Object &&
      notEmptyString(item.id) &&
      notEmptyString(relKey)
    ) {
      const c1 = this.index > 0 ? otherChart : item.id;
      const c2 = this.index > 0 ? item.id : otherChart;
      const inData = {
        user: this.user._id,
        c1,
        c2,
      };
      savePairedChart(inData).then((data) => {
        if (data.valid) {
          this.$ls.set("selected-pc", data.paired);
          this.$ls.set(relKey, item.id);
          setTimeout(this.getForm, 500);
          bus.$emit("switch-chart", {
            chart: new Chart(data.paired[relKey]),
            index: this.index,
            context: "chart",
            paired: true,
          });
        }
      });
    }
  }
  async matchChartName(search = "") {
    if (notEmptyString(search, 1)) {
      if (!this.isFetching) {
        this.isFetching = true;
        this.tempLocMatch = "";
        await matchChartNamesByUser(this.user._id, search).then((items) => {
          if (items.length > 0) {
            this.suggestedChartNames = items;
          }
          setTimeout(() => {
            this.isFetching = false;
          }, 50);
        });
      }
      setTimeout(() => {
        this.isFetching = false;
      }, 1000);
    }
    setTimeout(() => {
      this.isFetching = false;
    }, 2000);
  }

  get hasBodies() {
    if (this.index < this.chartForms.forms.length) {
      return this.chartForms.forms[this.index].chart.grahas.length > 0;
    } else {
      return false;
    }
  }

  get hasLocality(): boolean {
    return notEmptyString(this.locationPlaceholder);
  }

  get hasAyanamshas() {
    return this.ayanamshas.length > 0;
  }

  get ayanamshas() {
    return this.form.chart.ayanamshas;
  }

  get eventTypeOptions() {
    return eventTypeValues;
  }

  get isBirthChart() {
    return this.eventType === "birth";
  }

  get showRodden() {
    switch (this.eventType) {
      case "birth":
      case "event":
        return true;
      default:
        return false;
    }
  }

  get chart() {
    return this.form instanceof ChartForm ? this.form.chart : new Chart();
  }

  get hasChart() {
    return (
      this.chart instanceof Chart &&
      this.chart.subject instanceof Object &&
      this.chart.grahas.length > 0 &&
      (this.selectedChartId.length > 8 || !this.initialized)
    );
  }

  get namePlaceholder(): string {
    switch (this.eventType) {
      case "birth":
        return "Name(s)";
      default:
        return "Event title";
    }
  }

  get placenames(): string {
    return this.chart.corePlacenames;
  }

  get locationPlaceholder(): string {
    let pln = this.tempLocMatch;
    if (pln.length < 2 && this.hasChart) {
      pln = extractCorePlacenames(this.chart.placenames);
    }
    const typeStr = this.eventType === "birth" ? "birth " : "";
    return pln.length > 0 ? pln : `Enter ${typeStr}locality (city, country)`;
  }

  get chartLocalDt(): string {
    return this.hasChart
      ? longDate(this.chart.datetime, this.chart.tzOffset)
      : "";
  }

  get chartGeo() {
    return this.hasChart ? this.chart.geo : new GeoLoc([0, 0, 0]);
  }

  get hasPlacenames(): boolean {
    return this.placenames.length > 1;
  }

  get chartDatetime() {
    return this.hasChart ? this.form.chart.datetime : null;
  }

  get tzText() {
    return this.hasChart ? this.form.chart.tzText : "";
  }

  get submitClasses() {
    const cls = [];
    if (this.showSubmit) {
      cls.push('show-submit');
    }
    const numButtons = cls.length;
    if (numButtons == 1) {
      cls.push('single');
    }
    return cls;
  }

  get showNewButton() {
    return this.enableNew;
  }

  get showSubmit() {
    return this.enableSubmit && this.editMode;
  }

  get genderOptions() {
    return genderOptions(this.dictionary);
  }

  get roddenOptions() {
    return transformKeyNameOptions(this.roddenValues, "Please select Rodden scale...");
  }

  setDefaultDatetime() {
    let sf = this.form;
    let dt = null;
    if (sf) {
      dt = sf.chart.datetime;
      /* if (dt && sf.chart.tzOffset !== 0) {
        dt = offsetDate(dt, sf.chart.tzOffset);
      } */
    }
    if (!sf) {
      sf = this.$ls.get("form");
      if (sf) {
        dt = sf.datetime;
        this.isDefaultBirthChart = sf.isDefaultBirthChart;
        this.roddenValue = smartCastInt(sf.roddenValue);
      }
    }
    if (dt) {
      this.datetime = dt;
    }
    if (!sf) {
      const nowDt = new Date();
      this.datetime = nowDt;
      const maxYear = nowDt.getFullYear();
      this.maxYear = maxYear + 1;
      this.minYear = maxYear - 401;
      const year = this.datetime.getFullYear();
      const mins = this.datetime.getMinutes();
      this.datetime.setFullYear(year - 20);
      this.datetime.setSeconds(0);
      this.datetime.setMinutes(Math.floor(mins / 15) * 15);
    }
    if (this.datetime instanceof Date) {
      const jDate = julToDateParts(this.chart.jd, this.chart.tzOffset);
      const jDateStr = jDate.timeString();
      this.timeVal = jDateStr;
      this.dateVal = julToUnixMillisecs(this.chart.jd, this.chart.tzOffset);
      const prefix = this.chart.tzAbbr;
      const parts = [jDate.offsetHm];
      if (notEmptyString(prefix)) {
        parts.unshift(prefix);
      }
      this.tzInfo = parts.join(" / ");
      this.dateChanged = false;
      this.geoChanged = false;
    }
    setTimeout(() => {
      this.dateChanged = false;
      this.geoChanged = false;
    }, 500);
  }

  editLocality() {
    const newMode = this.editLocalityMode !== true;
    if (newMode && emptyString(this.tempLocMatch)) {
      this.tempLocMatch = this.locationPlaceholder;
    }
    this.editLocalityMode = newMode;
  }

  newChart(eventType = "birth") {
    const resetGeo = eventType === "birth";
    const resetDt = eventType === "birth";
    const defGender = eventType === "birth"? "-" : "n";
    this.resetFormStates();
    this.selectedChartId = "";
    this.name = "";
    this.tempLocMatch = "";
    this.editLocalityMode = false;
    this.notes = "";
    this.eventType = eventType;
    this.timeVal = "00:00:00";
    if (resetGeo) {
      this.geo = new GeoLoc([0,0,0]);
    }
    this.roddenValue = -1;
    this.gender = defGender;
    if (resetDt) {
      const dt = new Date();
      const year = dt.getFullYear() - 40;
      const firstYearInDecade = Math.floor(year / 10 ) * 10;
      this.dateVal = Date.UTC(firstYearInDecade, 0, 1, 0, 0, 0);
    }
    
    this.geoChanged = false;
    this.dateChanged = false;
    this.form.chart._id = "";
    this.tzInfo = '';
    setTimeout(() => {
      this.dateChanged = false;
      this.geoChanged = false;
    }, 750);
  }

  toggleCollapse(e) {
    if (e.target instanceof HTMLElement) {
      const cl = e.target.classList;
      if (cl.contains('radio') === false && cl.contains('control') === false) {
        this.expanded = !this.expanded;
      }
    }
  }

  toggleNotesCollapse() {
    this.notesExpanded = !this.notesExpanded;
  }

  postValidate() {
    this.validate(this.error);
  }

  hideDP(e) {
    if (e instanceof Object) {
      if (e.target.classList.contains('birthday-picker_dropdown-header')) {
        const input = e.target.parentNode.parentNode.querySelector('input');
        if (input) {
          input.click();
        }
      }
    }
  }

  validate(showMessages = false) {
    const {
      datetime,
      geo,
      name,
      gender,
      roddenValue
    } = this;
    let valid = true;
    this.messages = [];
    const isSame = this.isSame();
    if (isSame) {
      this.resetFormStates();
    } else {
      if (emptyString(name)) {
        valid = false;
        if (showMessages) {
          this.messages.push("Please select a name");
        }
        this.formStates.nameGender = showMessages? 0 : 1;
      } else {
        this.formStates.nameGender = 2;
      }
      if (emptyString(gender) || gender === "-") {
        valid = false;
        if (showMessages) {
          this.messages.push("Please select a gender option");
        }
        this.formStates.nameGender = this.hasEdited('name','gender')? 0 : 1;
      } else if (this.formStates.nameGender > 1) {
        this.formStates.nameGender = 2;
      }
      const isValidDate = datetime instanceof Date;
      if (!isValidDate || (!this.dateChanged  && this.isNew)) {
        valid = false;
        if (showMessages) {
          this.messages.push("Please select a date");
        }
        this.formStates.datetime = this.dateChanged? 0 : 1;
      } else {
        this.formStates.datetime = this.hasEditedAll('date','time')? 2 : 1;
      }
      if (geo.lat === 0 && geo.lng === 0 && !this.geoChanged) {
        valid = false;
        if (showMessages) {
          this.messages.push("Please select a location");
        }
        const isZero = geo.lat === 0 && geo.lng === 0;
        this.formStates.geoloc = isZero? 1 : 0;
      } else {
        this.formStates.geoloc = 2;
      }
      if (roddenValue < 0 && this.eventType === 'birth') {
        valid = false;
        if (showMessages) {
          this.messages.push("Please select a Rodden scale option");
        }
        this.formStates.roddenType = (this.dateChanged && this.geoChanged)? 0 : 1;
      } else {
        this.formStates.roddenType = 2;
      }
    }
    this.error = !valid;
    if (valid && !isSame && !this.saving && this.initialized) {
      this.submit(true);
    }
    return valid;
  }

  isSame() {
    const {
      name,
      gender,
      roddenValue,
      eventType,
      notes
    } = this.chart.subject;
    let same = !this.dateChanged && !this.geoChanged;
    
    if (same) {
      const trimmedNotes = notEmptyString(this.notes)? this.notes.trim() : ""; 
      const currNotes = notEmptyString(notes)? notes.trim() : "";
      let isEmpty = false;
      if (this.isNew) {
        isEmpty = (
          emptyString(this.name) &&
          (emptyString(this.gender) || this.gender == "-") &&
          this.roddenValue < 1
        )
      }
      if (!isEmpty) {
        if (this.name !== name) {
          same = false;
        } else if (this.gender !== gender) {
          same = false;
        } else if (this.roddenValue !== roddenValue) {
          same = false;
        } else if (this.eventType !== eventType) {
          same = false;
        } else if (trimmedNotes !== currNotes) {
          same = false;
        }
      }
    }
    return same;
  }

  matchEnteredDate() {
    const dateEl = document.querySelector(`#${this.birthPickerId} .birthday-picker input`);
    if (dateEl instanceof HTMLInputElement) {
      const {value} = dateEl;
      if (notEmptyString(value, 6) && /^(\d\d)\/(\d\d)\/(\d\d\d\d)$/.test(value)) {
        const parts = value.split('/');
        parts.reverse();
        return [parts.join('-'),this.timeVal].join('T');
      }
    }
  }

  hasEdited(key: string, k2 = "", k3 = "") {
    return this.hasEditedAndOr(false, key, k2, k3);
  }

  hasEditedAll(key: string, k2 = "", k3 = "") {
    return this.hasEditedAndOr(true, key, k2, k3);
  }

  private hasEditedAndOr(andMode = false, key: string, k2 = "", k3 = "") {
    const keys = [key, k2, k3].filter(notEmptyString);
    return andMode? keys.every(this.hasEditedItem) : keys.some(this.hasEditedItem);
  }

  hasEditedItem(key: string) {
    return Object.keys(this.editedStates).includes(key)? this.editedStates[key] : false;
  }

  submit(prevalidated = false) {
    const {
      datetime,
      geo,
      name,
      gender,
      isDefaultBirthChart,
      type,
      notes,
      eventType,
      roddenValue
    } = this;
    const user = this.user._id;
    const { lat, lng } = geo;
    let { alt } = geo;
    if (!isNumeric(alt)) {
      alt = 10;
    }
    const isValid = prevalidated || this.validate();
    if (isValid && !this.saving) {
      const enteredDatetime = this.matchEnteredDate();
      const dtString = notEmptyString(enteredDatetime)? enteredDatetime : asDateString(datetime);
      const parent = this.mode === "birth"? "" : this.parentId;
      const data = {
        _id: this.selectedChartId,
        user,
        datetime: dtString,
        isDefaultBirthChart: isDefaultBirthChart === true,
        lat,
        lng,
        alt,
        name,
        gender,
        type,
        notes,
        eventType,
        roddenValue,
        parent,
        locality: this.tempLocMatch,
      };
      this.editLocalityMode = false;
      this.saving = true;
      const isNew = this.isNew;
      saveUserChart(data).then((result) => {
        if (result.valid) {
          const cf = new ChartForm(data);
          cf.loadResults(result.chart);
          this.addForm(cf);
          this.name = cf.name;
          this.type = cf.type;
          this.eventType = cf.eventType;
          this.gender = cf.gender;
          this.roddenValue = smartCastInt(cf.roddenValue);
          if (notEmptyString(cf.chart.subject.notes)) {
            this.notes = cf.chart.subject.notes;
          }
          bus.$emit("chart-loaded", cf.chart, this.index);
          this.selectedChartId = "";
          const pc = this.$ls.get("selected-pc");
          // refactor !
          if (pc instanceof Object) {
            const {c1, c2} = pc;
            if (c1 instanceof Object && c2 instanceof Object && notEmptyString(c1._id) && notEmptyString(c2._id)) { 
              if (c1._id === cf.chart._id) {
                pc.c1 = cf.chart;
              } else if (c2._id === cf.chart._id) {
                pc.c2 = cf.chart;
              }
              this.$ls.set('selected-pc', pc);
            }
          }
          const {subject} = cf.chart;
          const objectName = isNew? "New chart" : "Chart";
          const action = isNew? "created" : "updated";
          const msg = `${objectName} for ${subject.name} ${action}`;
          this.toast(msg, 5000);
          setTimeout(() => {
            this.selectedChartId = cf.chart._id;
            this.mode = 'current';
          }, 250);
          const saveBlockTs = isNew? 750 : 1500;
          setTimeout(() => {
            this.saving = false;
          }, saveBlockTs);
        }
      });
      setTimeout(() => {
        this.saving = false;
      }, 5000);
      this.$ls.set("form", data);
      if (this.index > 0) {
        bus.$emit("save-paired-form", true);
      }
    }
  }

  @Watch("dateVal")
  changeDateString(newVal) {
    const hours = this.datetime.getHours();
    const minutes = this.datetime.getMinutes();
    const seconds = this.datetime.getSeconds();
    const dt = new Date(newVal);
    dt.setHours(hours);
    dt.setMinutes(minutes);
    dt.setSeconds(seconds);
    this.datetime = dt;
  }

  @Watch("timeVal")
  changeTime() {
    const parts = this.timeVal
      .split(":")
      .filter(isNumeric)
      .map(parseFloat);
    if (parts.length > 0) {
      if (parts.length < 3) {
        if (parts.length < 2) {
          parts.push(0);
        }
        parts.push(0);
      }
      const [hours, minutes, seconds] = parts;
      this.datetime.setHours(hours);
      this.datetime.setMinutes(minutes);
      this.datetime.setSeconds(seconds);

    }
  }

  @Watch("enableSubmit")
  changeEnableSubmit() {
    this.sync();
  }

  /* @Watch("eventType")
  changeEventType(newVal, oldVal) {
    if (oldVal === "birth" && newVal !== "birth") {
      this.syncEvent(newVal);
    }
  } */

  @Watch("dateVal")
  changeDateVal() {
    this.dateChanged = true;
  }

  @Watch("timeVal")
  changeTimeVal() {
    this.dateChanged = true;
  }

  @Watch("geo.lng")
  changeGeoLng() {
    this.geoChanged = true;
  }

  @Watch("geo.lat")
  changeGeoLat() {
    this.geoChanged = true;
  }

  @Watch("geo.alt")
  changeGeoAlt() {
    this.geoChanged = true;
  }

  @Watch("mode")
  changeMode(newVal) {
    switch (newVal) {
      case 'current':
        this.sync();
        break;
      case 'new':
        this.newChart();
        this.parentSubject = null;
        break;
    }
  }

  @Watch("selectedChartId")
  changeSelectedChartId(newVal) {
    if (this.initialized) {
      if (notEmptyString(newVal, 8)) {
        this.sync();
      }
    }
  }
}
</script>
