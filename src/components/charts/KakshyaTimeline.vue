<template>
  <div v-if="hasData" class="kakshya-timeline timeline-table narrow" :class="wrapperClasses">
    <form class="row horizontal top-controls">
      <label>Include</label>
      <b-checkbox-button v-model="includeExtraKeys" native-value="mo" type="is-dark" :rounded="true">Moon</b-checkbox-button>
      <b-checkbox-button v-model="includeExtraKeys" native-value="as" type="is-dark" :rounded="true">Ascendant</b-checkbox-button>
    </form>

    <b-table v-if="loaded" :data="rows" :sticky-header="true" :mobile-cards="false">
      <template slot-scope="props">
        <b-table-column class="head" field="datetime" label="Date/time">
          {{props.row.mediumDate}}
        </b-table-column>
        <b-table-column v-for="(item, itemIndex) in props.row.items" :class="item.key" :key="[item.key, itemIndex, props.index].join('-')" :field="item.key" :label="item.key">
          <template slot="header" slot-scope="{ column }">
          <i
            class="icon"
            :class="matchGrahaClass(item.key)"
            :rel="column.label"
          ></i>
        </template>
          <i class="icon" :class="cellClasses(item)" :title="item.lng | toDMS0"></i>
        </b-table-column>
        <b-table-column header-class="total" class="total" field="rowtotal" label="Total">
          {{rowTotal(props.row)}}
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import { Chart } from "../../api/models/Chart";
import { SettingState } from "@/store/types";
import { fetchGeo, getGeoTzOffset } from "@/api/geoloc-utils";
import { fetchKakshyaTimeline } from "@/api/methods";
import { KakshyaItem, KakshyaRow } from "@/api/interfaces";
import { currentJulianDay, julToDateParts } from "@/api/julian-date";
import { julToMediumDate } from "@/api/converters";
@Component({
  name: "KakshyaTimeline",
  filters: {
    ...FilterSet,
  },
})
export default class KakshyaTimeline extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: 0 }) readonly currentJd: number;
  @State("settings") settings: SettingState;

  private rows: KakshyaRow[] = [];

  private switching = false;

  private includeExtraKeys = ["mo"];

  private show = false;

  private enabled = false;

  private startJd = 2000;

  created() {
    this.startJd = this.currentJd > 0 ? this.currentJd : currentJulianDay();
    setTimeout(this.load, 1000);
  }

  get hasData() {
    return this.rows.length > 0;
  }

  get hasChart() {
    return this.chart.grahas.length > 5;
  }

  get wrapperClasses() {
    const cls = [];
    if (this.includeExtraKeys.includes('mo')) {
      cls.push('show-mo');
    }
    if (this.includeExtraKeys.includes('as')) {
      cls.push('show-as');
    }
    if (this.enabled) {
      cls.push('show-table');
    }
    return cls;
  }

  get loaded() {
    return this.rows.length > 0;
  }
  
  load() {
    if (this.hasChart && !this.switching) {
      const tzOffset = getGeoTzOffset();
      this.switching = true;
      fetchGeo((data) => {
        if (data instanceof Object) {
          this.enabled = false;
          this.rows = [];
          const dtStr = julToDateParts(this.startJd).toISOSimple();
          const excludeKeys = ["as", "mo"].filter(k => this.includeExtraKeys.includes(k) === false);
          fetchKakshyaTimeline(this.chart._id, dtStr, data.latitude, data.longitude, excludeKeys).then(result => {
            const { rows } = result;
            if (rows instanceof Array && rows.length > 0) {            
              this.rows = rows.map(row => {
                const {jd, items } = row;
                const mediumDate = julToMediumDate(row.jd, tzOffset);
                return {
                  jd,
                  mediumDate,
                  items,
                }
              });
              setTimeout(() => {
                this.enabled = true;
                this.switching = false;
              }, 250);
            }
          });
        }
      });
      setTimeout(() => {
        this.switching = false;
      }, 5000);
    }
  }

  matchGrahaClass(key = "as") {
    return ['icon', key].join('-');
  }

  cellClasses(item: KakshyaItem) {
    const cls = ['icon', ['icon', item.lord].join('-')];
    if (item.hasBindu) {
      cls.push('has-bindu');
    }
    return cls;
  }

  rowTotal(row: KakshyaRow) {
    return row.items.filter(item => item.hasBindu).length;
  }

  @Watch('includeExtraKeys')
  changeIncludeExtraKeys() {
    setTimeout(() => {
      this.load();
    }, 125);
  }

  @Watch('currentJd')
  changeCurrentJd() {
    if (this.currentJd > 0) {
      this.startJd = this.currentJd;
      setTimeout(() => {
        this.load();
      }, 125);
    }
  }

  @Watch('chart')
  changeChart() {
    this.rows = [];
    setTimeout(() => {
      this.load();
    }, 375);
  }

}
</script>