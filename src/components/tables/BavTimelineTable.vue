<template>
  <div class="timeline-table narrow">
    <form class="row horizontal top-controls">
      <label>Include</label>
      <b-checkbox-button v-model="includeExtraKeys" native-value="mo" type="is-dark" :rounded="true">Moon</b-checkbox-button>
      <b-checkbox-button v-model="includeExtraKeys" native-value="as" type="is-dark" :rounded="true">Ascendant</b-checkbox-button>
    </form>
    <b-table v-if="loaded" :data="rows" :sticky-header="true" :mobile-cards="false" class="bav-table">
      <template slot-scope="props">
        <b-table-column class="head date" field="date" label="Date/time">
            {{ toLongDate(props.row.jd) }}
        </b-table-column>
        <b-table-column
          v-for="itemKey in grahaKeys"
          :key="['bav-table-row', props.index, itemKey].join('-')"
          class="num-value"
          :class="itemKey"
          :header-class="[itemKey, 'num-value'].join(' ')"
          field="itemKey"
          :label="itemKey"
        >
        <template slot="header" slot-scope="{ column }">
          <i
            class="icon"
            :class="matchGrahaClass(itemKey)"
            :rel="column.label"
          ></i>
        </template>
          {{matchValue(props.row, itemKey)}}
        </b-table-column>
        <b-table-column class="avg" header-class="avg" field="avg" label="avg.">
            {{ calcAvg(props.row) }}
        </b-table-column>
        <b-table-column header-class="total" class="total" field="total" label="Total">
            {{ calcTotal(props.row) }}
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Chart } from "../../api/models/Chart";
import { SettingState } from "@/store/types";
import { fetchGeo, getGeoTzOffset } from "@/api/geoloc-utils";
import { fetchBavTimelineRows } from "@/api/methods";
import { julToDateParts } from "@/api/julian-date";
import { julToLongDate } from "@/api/converters";
import { bus } from "@/main";

interface BavBody {
  key: string;
  sign: number;
  value: number;
  lng?: number;
}

interface BavRow {
  key: string;
  jd: number;
  dt?: string;
  bodies: BavBody[];
}

@Component({
  name: "BavTimelineTable",
})
export default class BavTimelineTable extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: 0 }) readonly currentJd: number;
  @State("settings") settings: SettingState;

  private rows: BavRow[] = [];

  private loading = false;

  private enabled = false;

  private coreKeys = ["sa", "ju", "ma", "ve", "su", "me"];

  private includeExtraKeys = ["mo"];

  created() {
    bus.$on("dasha-span-item", item => {
      const dtStr = julToDateParts(item.startJd).toISOString();
      this.load(dtStr);
    });
  }

  mounted() {
    this.load();
  }

  get hasChart() {
    return this.chart instanceof Chart && this.chart.grahas.length > 6;
  }

  get wrapperClasses() {
    return [];
  }

  toLongDate(jd) {
    const offset = getGeoTzOffset();
    return julToLongDate(jd, offset, false);
  }

  load(dtStr = "") {
    if (this.hasChart) {
      fetchGeo((data) => {
        this.rows = [];
        if (data instanceof Object && !this.loading) {
          this.loading = true;
          this.enabled = true;
          fetchBavTimelineRows(data.latitude, data.longitude, this.chart.signIndexMap, dtStr).then(items => {
            if (items instanceof Array) {
              this.rows = items.filter(row => {
                if (row instanceof Object) {
                  const keys = Object.keys(row);
                  return keys.includes("bodies") && keys.includes("jd");
                } else {
                  return false;
                }
              });
            }
          });
        }
      })
      setTimeout(() => {
        this.loading = false;
      }, 2000);
    }
  }

  matchValue(row: BavRow, key = "sa") {
    const item = row.bodies.find(bd => bd.key === key);
    return item instanceof Object ? item.value : 0;
  }

  calcAvg(row: BavRow) {
    return this.calcTotal(row) / row.bodies.length;
  }

  calcTotal(row: BavRow) {
    return row.bodies.map(r => r.value).reduce((a, b) => a +b , 0);
  }

  matchGrahaClass(key = "sa") {
    return ['icon', key].join('-');
  }

  get loaded() {
    return this.rows.length > 0 && this.enabled;
  }

  get grahaKeys() {
    return [...this.coreKeys, ...this.includeExtraKeys];
  }

  @Watch('chart')
  changeChart() {
    setTimeout(() => {
      this.load();
    }, 500);
  }

  @Watch('includeExtraKeys')
  changeIncludeExtraKeys() {
    this.enabled = false;
    setTimeout(() => {
      this.enabled = true;
    }, 250);
  }

}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

#main .bav-table table {
  tbody {
    td {
      white-space: nowrap;
      padding: 0 0.125em;
      text-align: right;
      &.date {
        text-align: left;
        padding-right: 0.5em;
      }
    }
  }
}

</style>