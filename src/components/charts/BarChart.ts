import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { mixins } from "vue-class-component";
import { Bar, mixins as chartMixins } from "vue-chartjs";
import { ChartData } from "@/api/interfaces";
const { reactiveProp } = chartMixins;

@Component
export default class BarChart extends mixins(Bar, reactiveProp) {
  @Prop({ default: null }) chartData: ChartData;
  @Prop({ default: null }) options: any;
  @Prop({ default: false }) refresh: boolean;

  mounted() {
    this.build();
  }

  build() {
    if (this.chartData instanceof Object) {
      if (this.chartData.datasets instanceof Array) {
        if (this.chartData.datasets.length > 0) {
          const firstSet = this.chartData.datasets[0];
          if (firstSet instanceof Object) {
            if (firstSet.data instanceof Array) {
              this.renderChart(this.chartData, this.options);
            }
          }
        }
      }
    }
  }

  @Watch("refresh")
  changeRefresh(newValue) {
    if (newValue) {
      this.build();
    }
  }
}
