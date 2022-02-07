<template>
  <div class="side-panel" :class="wrapperClasses">
    <nav class="tabs">
      `
      <ul class="set-nav">
        <li
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :class="tab.classNames"
          @click="select(index)"
        >
          {{ tab.name }}
        </li>
      </ul>
    </nav>
    <div class="tab-content">
      <div class="form-column">
        <div class="forms-wrapper">
          <ChartDetailsForm
            :index="0"
            :enableSubmit="!showSecondChartForm && showFormSubmit"
            :singleMode="showSecondChartForm"
            :enableNew="true"
          />
          <ChartDetailsForm v-if="showSecondChartForm" :index="1" :enableNew="true" :singleMode="showSecondChartForm" :enableSubmit="showFormSubmit" :keepRelationsForm="keepRelationsForm" />
          <PairedChartList v-if="showConnectedCharts" :chart="c1" listing="short" />
          <template v-if="!showSecondChartForm">
            <form v-for="sec in bottomSections" :key="sec.itemKey" class="edit-form collapsible chart-subjects spaced" :class="bottomSectionClasses(sec)">
              <h3 class="form-title" @click="toggleSectionCollapse(sec)">{{sec.name}}</h3>
              <template v-if="sec.hasComponent">
                <component :is="sec.component" :chart="c1" />
                </template>
              <template v-else>
              <div class="inner"></div>
              </template>
            </form>
          </template>
          
          <form class="global-settings edit-form collapsible" :class="settingsClasses">
            <h3 class="form-title" @click="toggleSettingsCollapse">Global Settings</h3>
            <fieldset class="inner">
              <b-field label="Ayanamsa" class="horizontal">
                <b-select
                  v-if="hasAyanamshas"
                  placeholder="Ayanamsha"
                  v-model="ayanamsha"
                >
                  <option
                    v-for="opt in ayanamshas"
                    :value="opt.key"
                    :key="opt.key"
                    >{{ opt | toAyaPreview }}</option
                  >
                </b-select>
              </b-field>
              <geolocation-input :geo="geo" @onChange="handleGeo" class="compact">
                <b-tooltip label="Reset location and time-zone to browser default" :multilined="true" position="is-left" class="action-icon first">
                  <b-icon icon="crosshairs-gps" @click.native="resetGeo" class="edit" />
                </b-tooltip>
                <b-field class="row horizontal label-right" label="± hours">
                  <b-input type="number" v-model="tzHours" class="tz-offset short" size="4" step="0.25" />
                </b-field>
                <b-tooltip label="Set to location of the first chart" :multilined="true" position="is-left" class="action-icon second">
                  <b-icon class="edit" icon="chart-arc" @click.native="setToFirstChart" />
                </b-tooltip>
              </geolocation-input>
            </fieldset>
          </form>
        </div>
      </div>
      <ChartManager
        v-if="!showSecondChartForm"
        context="admin"
        :chart="c1"
        :editMode="true"
        :limit="listLimit"
        :showFilter="showListFilter"
        :maySelectSecondChart="showSecondChartForm"
      />
      <PairedChartList
        v-if="showSecondChartForm"
        :chart="c1"
        mode="user"
        listing="long"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { State, Action } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Chart } from "../../api/models/Chart";
import { bus } from "../../main";
import ChartDetailsForm from "./../forms/ChartDetailsForm.vue";
import GeolocationInput from "./../widgets/GeolocationInput.vue";
import ChartManager from "./ChartManager.vue";
import PairedChartList from "./PairedChartList.vue";
import LifeEventsList from "./LifeEventsList.vue";
import ayanamshaValues from "../../api/mappings/ayanamsha-values";
import { decPlaces } from "../../api/converters";
import { SettingState } from "../../store/types";
import { notEmptyString } from "@/api/validators";
import { fetchGeo, getGeoTzOffset, setGeoLocation } from "@/api/geoloc-utils";
import { getTzData } from "@/api/methods";
import { GeoLoc } from "@/api/models/GeoLoc";

@Component({
  components: {
    ChartDetailsForm,
    ChartManager,
    PairedChartList,
    LifeEventsList,
    GeolocationInput
  },
  filters: {
    toAyaPreview(obj) {
      return obj.key.split("_").join(" ") + ": " + decPlaces(obj.value, 4);
    },
  },
})
export default class SidebarManager extends Vue {
  @Prop({ default: new Chart(null) }) c1: Chart;
  @Prop({ default: new Chart(null) }) c2: Chart;
  @Prop({ default: false }) paired: boolean;
  @Prop({ default: false }) showFormSubmit: boolean;
  @State("settings") settings: SettingState;
  @Action("setAyanamsha", { namespace: "settings" }) setAyanamsha: any;
  @Action("setDegMode", { namespace: "settings" }) setDegMode: any;
  private tabItems = [
    { key: "current", name: "Current Chart" },
    { key: "open", name: "Open Chart" },
  ];

  activeTab = 0;

  listingIndex = 0;

  ayanamsha = "true_citra";

  settingsExpanded = true;

  private geo = {
    lat: 0,
    lng: 0,
    alt: 20
  }

  tzHours = 0;

  updating = false;

  extraSections = [
    {
      className: "life-events",
      name: "Life Events",
      component: "LifeEventsList",
    },
    {
      className: "physical-quality-tags",
      name: "Physical Quality Tags"
    },
    {
      className: "mental-quality-tags",
      name: "Mental Qualities Tags"
    },
    {
      className: "prasna",
      name: "Praśna (Questions/Horary)"
    },
    {
      className: "muhurta", 
      name: "Muhūrta (Electional)"
    },
  ];

  expandedClass = "";

  created() {
    bus.$on("switch-pane", () => {
      this.setAyanamsha(this.ayanamshaItem);
    });
    bus.$on("changeChart", () => {
      this.setAyanamsha(this.ayanamshaItem);
      this.activeTab = 0;
    });
    this.changeRoute();
    fetchGeo((result) => {
      if (result instanceof Object) {
      const { longitude, latitude, alt } = result;
        this.geo = {
          lat: latitude,
          lng: longitude,
          alt
        }
      }
    })
    this.tzHours = getGeoTzOffset() / 3600;
  }

  mounted() {
    const ayanamsha = this.$ls.get("ayanamsha");
    if (ayanamsha) {
      this.ayanamsha = ayanamsha;
    }
    setTimeout(() => {
      this.setAyanamsha(this.ayanamshaItem);
    }, 250);
  }

  select(index: number) {
    if (index >= 0 && index < this.tabItems.length) {
      this.activeTab = index;
      switch (this.activeKey) {
        case "new":
          bus.$emit("new-form", 1);
          break;
        case "current":
          bus.$emit("sync-form", 0);
          break;
      }
    }
  }

  get showSecondChartForm() {
    return this.paired;
  }
  get showConnectedCharts() {
    return !this.paired;
  }

  get showPairedChartList() {
    return (
      this.c1 instanceof Object && this.c1.grahas.length > 0 && !this.paired
    );
  }

  get activeKey() {
    const index =
      this.activeTab >= 0 && this.activeTab < this.tabItems.length
        ? this.activeTab
        : 0;
    return this.tabItems[index].key;
  }

  get enableNew() {
    return this.activeKey === "new";
  }

  get listLimit() {
    switch (this.activeKey) {
      case "recent":
        return 12;
      default:
        return 0;
    }
  }

  get showListFilter() {
    switch (this.activeKey) {
      case "open":
        return 2;
      default:
        return false;
    }
  }

  get bottomSections() {
    return this.extraSections.map((sec, index) => {
      const itemKey = ['extra', sec.className, index].join('-');
      const hasComponent = Object.keys(sec).includes('component') ? notEmptyString(sec.component, 2) : false;
      return {...sec, itemKey, hasComponent };
    })
  }

  bottomSectionClasses(section) {
    const openClass = section.className === this.expandedClass? "open" : "closed";
    return [section.className, openClass];
  }

  toggleSectionCollapse(section) {
    this.expandedClass = section.className === this.expandedClass? "" : section.className;
  }

  get wrapperClasses() {
    const key = this.activeKey;
    const cls = [[key, "active"].join("-")];
    switch (key) {
      case "current":
      case "new":
        cls.push("show-forms");
        break;
      case "open":
      case "recent":
        cls.push("show-listing");
        break;
    }
    if (this.showSecondChartForm) {
      cls.push("paired-mode");
    }
    return cls;
  }

  get tabs() {
    return this.tabItems.map((tab, ti) => {
      const classNames = [tab.key];
      if (ti === this.activeTab) {
        classNames.push("active");
      }
      const key = ["sidebar", "tab", ti, tab.key].join("-");
      return {
        key,
        name: tab.name,
        classNames,
      };
    });
  }

  get keepRelationsForm() {
    return this.activeTab === 0 && this.showSecondChartForm;
  }

  get ayanamshas() {
    const first = {
      key: "tropical",
      value: 0,
    };
    let rows = [];
    if (this.c1 instanceof Object) {
      // limit ayanamsha options to 4. Remove to allow all options
      const ayaNums = [0, 27, 1, 5];
      const { ayanamshas } = this.c1;
      if (ayanamshas instanceof Array) {
        rows = [
          first,
          ...ayanamshas.filter((a) => {
            const ar = ayanamshaValues.find((a1) => a1.key === a.key);
            let valid = false;
            if (ar) {
              valid = ayaNums.includes(ar.value);
            }
            return valid;
          }),
        ];
      }
    }
    return rows;
  }

  get hasAyanamshas() {
    return this.ayanamshas.length > 0;
  }

  get ayanamshaItem() {
    const ayaRow = ayanamshaValues.find((av) => av.key === this.ayanamsha);
    const item = { num: 0, key: "tropical", name: "None", value: 0 };
    if (ayaRow) {
      const ar = this.ayanamshas.find((ay) => ay.key === this.ayanamsha);
      if (ar) {
        item.num = ayaRow.value;
        item.value = ar.value;
        item.key = this.ayanamsha;
        item.name = ayaRow.name;
      }
    }
    return item;
  }

  toggleSettingsCollapse() {
    this.settingsExpanded = !this.settingsExpanded;
  }

  handleGeo(data) {
    this.updating = true;
    getTzData(new GeoLoc(data)).then(result => {
      if (result.valid) {
        this.tzHours = result.tzOffset / 3600;
        setGeoLocation(data, result);
        setTimeout(() => {
          this.updating = false;
        }, 250);
      }
    })
  }

  resetGeo() {
    fetchGeo(result => {
      this.geo = {
        lat: result.latitude,
        lng: result.longitude,
        alt: 20
      }
    }, true);
    const tzOffset = 0 - new Date().getTimezoneOffset() * 60;
    this.tzHours = tzOffset / 3600;
    setGeoLocation(this.geo, {tzOffset});
  }

  setToFirstChart() {
    if (this.c1.grahas.length > 0) {
      if (this.c1.geo instanceof GeoLoc) {
        const geoObj = {...this.c1.geo};
        this.geo = geoObj;
        this.handleGeo(geoObj);
      }
    }
  }

  get settingsClasses() {
    return this.settingsExpanded? 'open' : 'closed';
  }

  @Watch("ayanamsha")
  changeAyanamsha() {
    switch (this.ayanamshaItem.key) {
      case "-":
        this.ayanamshaItem.key = "true_citra";
        break;
    }
    this.setAyanamsha(this.ayanamshaItem);
    this.$ls.set("ayanamsha", this.ayanamshaItem.key);
  }

  @Watch("tzHours")
  changeTzHours() {
    if (!this.updating) {
      const stored = this.$ls.get('geoloc');
      const tzOffset = this.tzHours * 3600;
      if (stored instanceof Object) {
        this.$ls.set('geoloc', {...stored, tzOffset});
      } else {
        fetchGeo(result => {
          if (result instanceof Object) {
            this.$ls.set('geoloc', {...stored, tzOffset});
          }  
        });
      }
    }
  }

  @Watch("$route")
  changeRoute() {
    const { path } = this.$route;
    const endSection = path.split("/").pop();
    switch (endSection) {
      case "predictive":
        this.expandedClass = "life-events";
        break;
    }
  }

}
</script>
