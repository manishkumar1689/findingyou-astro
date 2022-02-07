<template>
  <div v-if="hasBavTimelineData" class="bottom-over-frame narrow bav-graph" :class="wrapperClasses">
    <LineChart
      v-if="enabled"
      :chartData="bavTimelineData"
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
import { fetchGeo, getGeoTzOffset } from "@/api/geoloc-utils";
import { fetchBavTimeline } from "@/api/methods";
import { ChartData, defaultChartData } from "@/api/interfaces";
import { currentJulianDay, julToDateParts } from "@/api/julian-date";
import { julToDayMonth } from "@/api/converters";
import { bus } from "@/main";

@Component({
  name: "BavTimelineGraph",
  components: {
    LineChart,
  },
})
export default class BavTimelineGraph extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @State("settings") settings: SettingState;

  private bavTimelineData: ChartData = defaultChartData;

  private loading = false;

  private bavMin = 0;

  private bavMax = 8;

  private show = false;

  private enabled = false;

  private currentJd = 2000;

  created() {
    this.currentJd = currentJulianDay();
    bus.$on("dasha-span-item", item => {
      const dtStr = julToDateParts(item.startJd).toISOString();
      this.load(dtStr);
      this.currentJd = item.startJd;
    });
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

  get hasBavTimelineData() {
    return this.bavTimelineData.datasets.length > 1;
  }

  toShortDate(index, stepsPerDay = 8, startOffset = -14) {
    const relJd = this.currentJd + (index / stepsPerDay) + startOffset;
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
              min: this.bavMin,
              max: this.bavMax,
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
                return index % 4 === 0 ? this.toShortDate(index, 8) : '';
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
        display: true,
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
            const valLabel = tooltipItem.yLabel.toFixed(3);
            return [label, valLabel].join(": ");
          },
          title: function (items) {
            let str = "";
            if (items instanceof Array && items.length > 0) {
              const first = items[0];
              if (first.index % 4 === 0) {
                const plural = first.index / 8 === 1? '' : 's';
                str = [first.label, 'day' + plural].join(': ');
              }
            }
            return str;
          },
        },
      },
    };
  }

  get colorMap() {
    return {
      b: "#0000ff",
      m: "#ff0000",
      a: "#999999",
    };
  }

  calcMinMax(items: any[] = [], minMode = true) {
    const func = minMode ? Math.min : Math.max;
    const tolerance = minMode ? -0.5 : 0.375;
    const vl = Math.floor((func(...items.map(item => {
      return func(...[item.b, item.m, item.a])
    })) + tolerance) * 2) / 2;
    return minMode ? vl < 0 ? 0 : vl : vl < 6? 6 : vl;
  }

  load(dtStr = "") {
    if (this.hasChart) {
      const show = this.$ls.get('show-predictive-graph');
      this.show = show === true;
      fetchGeo((data) => {
        if (data instanceof Object && !this.loading) {
          this.loading = true;
          this.enabled = false;
          fetchBavTimeline(data.latitude, data.longitude, this.chart.signIndexMap, dtStr).then(items => {
            this.bavTimelineData.datasets = [];
            this.bavTimelineData.labels = [];
            const midJd = 14;
            this.bavMin = this.calcMinMax(items);
            this.bavMax = this.calcMinMax(items, false);
            if (items instanceof Array && items.length > 0) {            
              [{
                key: 'b',
                name: 'Benefics',
              },{
                key: 'm',
                name: 'Malefics',
              }, {
                key: 'a',
                name: 'Average'
              }].forEach(row => {
                const {key, name} = row;
                const data = items.map(item => item[key]);
                const ls = {
                  label: name,
                  hidden: false,
                  borderColor: this.colorMap[key],
                  borderWidth: 1,
                  backgroundColor: "transparent",
                  tension: 0.5,
                  data,
                };
                this.bavTimelineData.datasets.push(ls);
                
              });
              this.bavTimelineData.labels = items.map(item => (item.refJd - midJd).toString());
              setTimeout(() => {
                this.enabled = true;
                this.loading = false;
              }, 250);
            }
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

  @Watch('chart')
  changeChart() {
    this.bavTimelineData.datasets = [];
    this.bavTimelineData.labels = [];
    setTimeout(() => {
      this.load();
    }, 500);
  }

}
</script>
<style lang="scss">
@import "@/styles/variables.scss";
#main .subpanes .north-indian-chart {
  .bottom-over-frame {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 66.66666%;
    z-index: 100;
    pointer-events: none;
    > .long {
      position: relative;
      background-color: white;
      max-height: 100%;
      overflow: hidden;
      transition: opacity 0.5s ease-out, top 0.5s ease-out;
      top: 100%;
    }
    .show-control {
      position: absolute;
      right: 1em;
      top: calc(100% - 1.75em);
      height: 1em;
      width: 1em;
      pointer-events: all;
      max-height: 2em;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.25s ease-in-out, top 0.5s ease-in-out, right 0.5s ease-in-out;
      .icon .mdi::before {
        font-size: 1em;
        transition: font-size 0.25s ease-in-out;
        color: rgba($dark-color, 0.5);
      }
    }

    &.show {
      > .long {
        pointer-events: all;
        max-height: 100%;
        opacity: 1;
        top: 0;
      }
      .toggle {
        top: 0.5em;
        right: 0.5em;
        opacity: 1;
      }
      .hide-control {
        &:hover {
          opacity: 1;
        }
        right: 0.5em;
        top: calc(100% - 1.25em);
      }
    }
    &.hide {
      .show-control .icon {
        .mdi::before {
          font-size: 2em;
        }
      }
      .hide-control {
        opacity: 0;
        pointer-events: none;
      }
    }
  }
  .bav-graph {
     > .long {
      &::before {
        content:"";
        position: absolute;
        top: calc(1.375em + 1.375%);
        bottom: calc(1.5em + 2%);
        left: calc(52.25% + 1em);
        border-right: solid 0.125em $medium-grey;
        z-index: 200;
      }
    }
  }
  &:hover {
    .bottom-over-frame {
      .toggle {
        opacity: 1;
      }
    }
  }
}
</style>