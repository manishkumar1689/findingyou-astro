<template>
  <div class="bottom-over-frame narrow" :class="wrapperClasses">
    <LineChart
      v-if="enabled"
      :chartData="timelineData"
      :options="options"
      class="long"
    />
    <div class="toggle show-control" @click="toggleShow"><b-icon :icon="activeIcon" /></div>
    <div class="hide-control show-control" @click="hide"><b-icon :icon="activeIcon" /></div>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Chart } from "../../api/models/Chart";
import LineChart from "../charts/LineChart";
import { SettingState } from "@/store/types";
import { fetchGeo } from "@/api/geoloc-utils";
import { fetchKakshyaGraph } from "@/api/methods";
import { ChartData, defaultChartData } from "@/api/interfaces";
import { currentJulianDay, julToDateParts } from "@/api/julian-date";
import { julToDayMonth } from "@/api/converters";
import { grahaUnicodeSymbols } from "@/api/mappings/graha-values";
import { getGeoTzOffset } from "@/api/geoloc-utils";

@Component({
  name: "KakshyaTimelineGraph",
  components: {
    LineChart,
  },
})
export default class KakshyaTimelineGraph extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: 0 }) readonly currentJd: number;
  @State("settings") settings: SettingState;

  private timelineData: ChartData = defaultChartData;

  private loading = false;

  private stepsPerDay = 192;

  private numSteps = 0;

  private show = false;

  private enabled = false;

  private startJd = 0;

  created() {
    this.startJd = this.currentJd > 0 ? this.currentJd : currentJulianDay();
  }

  mounted() {
    this.load();
  }

  get hasChart() {
    return this.chart instanceof Chart && this.chart.grahas.length > 6;
  }

  get wrapperClasses() {
    return [this.show? "show" : "hide"];
  }

  get activeIcon() {
    return this.show? "arrow-expand-down" : "chart-timeline";
  }

  get hasData() {
    return this.timelineData.datasets.length > 1;
  }

  toShortDate(index) {
    const relJd = this.startJd + (index / this.stepsPerDay);
    const offset = getGeoTzOffset();
    return julToDayMonth(relJd, offset);
  }

  get options() {
    return {
      animation: {
        easing: "linear",
        duration: 500,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              min: 0,
              max: 8,
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
              callback: (_, index) => {
                return index % 4 === 0 ? this.toShortDate(index) : '';
              },
              display: true,
              maxTicksLimit: 28
            },
            gridLines: {
              display: true,
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
      maintainAspectRatio: false,
      aspectRatio: 1/3,
      scaleShowLabels: false,
      tooltips: {
        mode: "index",
        callbacks: {
          label: function (tooltipItem, data) {
            const label = data.datasets[tooltipItem.datasetIndex].label || "";
            const valLabel = tooltipItem.yLabel.toFixed(0);
            return [label, valLabel].join(": ");
          },
          title: function (items) {
            let str = "";
            if (items instanceof Array && items.length > 0) {
              const first = items[0];
              if (first.label.startsWith("{")) {
                const row = JSON.parse(first.label);
                if (row instanceof Object) {
                  str = row.lords.map(lord => {
                    const parts = [grahaUnicodeSymbols[lord]];
                    if (row.bindus.includes(lord)) {
                      parts.push("✓")
                    }
                    return parts.join(" ");
                  }).join(", ");
                }
              }
            }
            return str;
          },
        },
      },
    };
  }

  load() {
    if (this.hasChart) {
      const show = this.$ls.get('show-predictive-graph');
      this.show = show === true;
      fetchGeo((data) => {
        if (data instanceof Object && !this.loading) {
          this.loading = true;
          this.enabled = false;
          const dtStr = julToDateParts(this.startJd).toISOSimple();
          fetchKakshyaGraph(this.chart._id, dtStr, data.latitude, data.longitude).then(result => {
            const {items} = result;
            this.timelineData.datasets = [];
            this.timelineData.labels = [];
            this.numSteps = result.numSteps;
            this.stepsPerDay = result.stepsPerDay;
            if (items instanceof Array && items.length > 0) {
              const ls = {
                label: 'Bindus',
                hidden: false,
                borderColor: '#cc00cc',
                borderWidth: 1,
                backgroundColor: "transparent",
                tension: 1,
                data: items.map(item => item.total),
              };
              this.timelineData.datasets.push(ls);
              this.timelineData.labels = items.map(item => JSON.stringify(item));
            }
            setTimeout(() => {
              this.enabled = true;
              this.loading = false;
            }, 250);
          });
        }
      })
      setTimeout(() => {
        this.loading = false;
      }, 2000);
    }
  }

  toggleShow() {
    this.show = !this.show;
    this.$ls.set('show-predictive-graph', this.show);
    this.disable();
  }

  hide() {
    this.show = false;
    this.disable();
  }

  disable() {
    if (this.show) {
      this.enabled = true;
    } else {
      setTimeout(() => {
        this.enabled = false;
      }, 1000);
    }
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
    this.timelineData.datasets = [];
    this.timelineData.labels = [];
    setTimeout(() => {
      this.load();
    }, 500);
  }

}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

</style>