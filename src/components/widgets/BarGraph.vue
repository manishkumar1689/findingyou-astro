<template>
  <grid-item class="line-chart" :index="paneIndex">
    <h4>Sample Bar Chart</h4>
    <div class="bar-graph widget graph">
      <bar-chart :chart-data="source" :options="options" :refresh="refresh" />
      <nav class="tabs top">
        <ol class="set-nav horizontal-all">
          <li
            v-for="(set, setIndex) in sets"
            :key="['bar', setIndex].join('-')"
            @click="switchSet(setIndex)"
            :class="activeClass(setIndex)"
          >
            {{ set.label }}
          </li>
        </ol>
      </nav>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import BarChart from "../charts/BarChart";
import GridItem from "../widgets/GridItem.vue";

@Component({
  components: {
    BarChart,
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
    animation: {
      easing: "easeOutBack",
      duration: 750,
    },
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            stepSize: 30,
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
      display: false,
    },
    responsive: true,
    maintainAspectRatio: true,
  };

  private refresh = false;

  private currentSetIndex = 0;

  private coreGrahas() {
    return [
      {
        key: "gu",
      },
    ];
  }

  private sets = [
    {
      label: "First",
      color: "rgba(175,0,0,0.5)",
    },
    {
      label: "Second",
      color: "rgba(0,175,0,0.5)",
    },
    {
      label: "Third",
      color: "rgba(0,0,175,0.5)",
    },
    {
      label: "Fourth",
      color: "rgba(127,0,127,0.5)",
    },
    {
      label: "Fifth",
      color: "rgba(127,127,0,0.5)",
    },
    {
      label: "Sixth",
      color: "rgba(0,127,127,0.5)",
    },
  ];

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

  switchSet(index: number) {
    this.currentSetIndex = index;
    this.rebuild();
  }

  activeClass(index: number) {
    return index === this.currentSetIndex ? "active" : "inactive";
  }

  buildDataSets() {
    const activeSets = [this.sets[this.currentSetIndex]];

    this.source.datasets = activeSets.map((s) => {
      const { label, color } = s;
      const data: Array<number> = [];
      for (let i = 0; i < 7; i++) {
        data.push(this.getRandomInt());
      }
      return {
        label,
        pointBackgroundColor: "white",
        borderWidth: 1,
        backgroundColor: color,
        data,
      };
    });
    this.source.labels = this.source.datasets[0].data.map((s, i) =>
      (i + 1).toString()
    );
  }

  getRandomInt() {
    return Math.floor(Math.random() * 360);
  }
}
</script>
