<template>
  <grid-item class="line-chart" :index="paneIndex">
    <h4>Sample Line Chart</h4>
    <div class="line-graph widget graph">
      <b-button icon-left="refresh" @click="rebuild">Randomise</b-button>
      <line-chart :chart-data="source" :options="options" :refresh="refresh" />
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import LineChart from "../charts/LineChart";
import GridItem from "../widgets/GridItem.vue";

@Component({
  components: {
    LineChart,
    GridItem,
  },
})
export default class LineGraph extends Vue {
  @Prop({ default: 0 }) index: number;
  @Prop({ default: 0 }) paneIndex: number;

  private source = {
    labels: ["", ""],
    datasets: [],
  };

  private options = {
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          gridLines: {
            display: true,
          },
        },
      ],
      xAxes: [
        {
          gridLines: {
            display: false,
          },
        },
      ],
    },
    legend: {
      display: true,
    },
    responsive: true,
    maintainAspectRatio: true,
  };

  private refresh = false;

  created() {
    this.buildDataSets();
  }

  rebuild() {
    if (!this.refresh) {
      this.refresh = true;
      this.buildDataSets();

      setTimeout(() => {
        this.refresh = false;
      }, 500);
    } else {
      setTimeout(this.rebuild, 500);
    }
  }

  buildDataSets() {
    const sets = [
      {
        label: "First",
        color: "#990000",
      },
      {
        label: "Second",
        color: "#009900",
      },
      {
        label: "Third",
        color: "#000099",
      },
    ];

    this.source.datasets = sets.map((s) => {
      const { label, color } = s;
      const data: Array<number> = [];
      for (let i = 0; i < 12; i++) {
        data.push(this.getRandomInt());
      }
      return {
        label,
        borderColor: color,
        borderWidth: 1,
        backgroundColor: "transparent",
        data,
      };
    });
    this.source.labels = this.source.datasets[0].data.map((s, i) =>
      (i + 1).toString()
    );
  }

  getRandomInt() {
    return Math.floor(Math.random() * 87.5) + 12.5;
  }
}
</script>
