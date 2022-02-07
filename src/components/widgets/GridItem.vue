<template>
  <section
    class="subpane"
    :class="wrapperClasses"
    :rel="rel"
    :data-order="order"
    ref="container"
    :style="style"
  >
    <div v-if="movable" class="handle top-control">
      <b-icon icon="cursor-move" />
    </div>
    <div class="top-control right">
      <div v-if="showInfo" class="toggle-info inner-control" @click="toggleInfo">
        <b-icon icon="information-outline" class="info-trigger" />
      </div>
      <div v-if="showSettingsControl" class="options inner-control" @click="toggleCogWidget" title="Options">
        <div class="options-info">{{vargaNum}}</div>
          <b-icon icon="cog" />
        </div>
      <div
        class="edit-content inner-control"
        v-if="showEdit"
        @click="toggleContent"
        @mouseenter="enableMenu"
        title="Edit widget"
      >
        <b-icon icon="view-grid-plus-outline" />
      </div>
      <div
        v-if="large"
        class="toggle-fullscreen inner-control"
        @click="toggleFull"
        :title="toggleFullsceenHint"
      >
        <b-icon :icon="fullscreenIcon" />
      </div>
      <div v-if="!fullscreen && showZoom" class="toggle-large inner-control" @click="toggleLarge">
        <b-icon :icon="zoomIcon" />
      </div>
    </div>

    <slot></slot>
    <div class="disable-overlay" @click="disableOverlays"></div>
    <WidgetOptions v-if="showOptionsWidget" :index="index" />
    <WidgetMenu v-if="enableWidgetMenu" :index="index" :context="context" />
    <MainPredictiveMenu v-if="enablePredictiveWidgetMenu" />
    <template v-if="doubleMode">
      <div class="chart-info double">
        <div v-if="hasMidInfo" class="mid-info">
          <h5>{{midInfo.title}}</h5>
          <p v-if="hasMidInfo && midInfo.location.length > 4" class="location">{{midInfo.location}}</p>
        </div>
        <ChartInfo :chart="chart" :doubleMode="true" :chartNum="1" />
        <ChartInfo :chart="chart2" :doubleMode="true" :chartNum="2" />
      </div>
    </template>
    <template v-else>
      <ChartInfo :chart="selectedChart" :doubleMode="false" />
    </template>
  </section>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { toggleFullScreen } from "../../api/dom";
import WidgetOptions from "./WidgetOptions.vue";
import ChartInfo from "./ChartInfo.vue";
import { Chart } from "../../api/models/Chart";
import { bus } from "../../main";
import { notEmptyString } from "../../api/validators";
import { degAsDms } from '../../api/converters';


function load(view: string) {
  return () => import(`./${view}.vue`);
}

@Component({
  components: {
    WidgetOptions,
    ChartInfo,
    WidgetMenu: load("WidgetMenu"),
    MainPredictiveMenu: load("MainPredictiveMenu"),
  }
})
export default class GridItem extends Vue {
  @Prop({ default: 0 }) index: number;
  @Prop({ default: true }) movable: boolean;
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: true }) readonly showSettings: boolean;

  private order = 1;

  private draggable = false;

  private fullscreen = false;

  private showOptions = false;

  private showContentSwitcher = false;

  private showChartInfo = false;

  private style = "";

  private large = false;

  private enableWidgetMenu = false;

  created() {
    this.order = this.index + 1;
    bus.$on("fullscreen", status => {
      this.fullscreen = status;
    });
    bus.$on("escape", () => {
      this.showOptions = false;
      this.showContentSwitcher = false;
      this.showChartInfo = false;
    });
    bus.$on("show-overlay", (index, type) => {
      if (index !== this.index) {
        switch (type) {
          case "content-edit":
            this.showContentSwitcher = false;
            this.enableWidgetMenu = false;
            break;
        }
        this.showOptions = false;
      }
    });
    bus.$on("enlarge", index => {
      if (this.index !== index) {
        this.large = false;
        this.style = "";
      }
    });
    bus.$on("manage-widgets", data => {
      if (data.index === this.index) {
        this.showContentSwitcher = false;
        this.enableWidgetMenu = false;
      }
    })
  }

  get hasC2() {
    return (
      this.chart2 instanceof Chart &&
      this.chart2.grahas.length > 0 &&
      notEmptyString(this.chart2.subject.name)
    );
  }

  get enablePredictiveWidgetMenu() {
    return this.context === "predictive";
  }

  get showOptionsWidget() {
    switch (this.context) {
      case "predictive":
        return false;
      default:
        return true;
    }
  }

  get chartMode() {
    const { singleMode } = this.$parent.$data;
    const num = singleMode ? singleMode : 1;
    let display = this.hasC2 ? "double" : "single";
    if (singleMode) {
      const { mode } = this.$parent.$props;
      if (mode) {
        display = mode;
      }
    }
    return { num, display };
  }

  get midInfo() {
    const obj = {title: '', location: ''};
    if (this.hasC2) {
      const { midMode, timespaceMode} = this.$parent.$data;
      const paired = this.$ls.get('selected-pc');
      if (paired instanceof Object) {
        const { timespace } = paired;
        let geo = {lat:0, lng:0};
        
        if (midMode === 'timespace') {
          const tsModeLabel = timespaceMode === 'median'? 'Average lat/long' : 'Shortest distance midpoint';
          obj.title = `Time-space: ${tsModeLabel}`;
          switch (timespaceMode) {
            case 'surface':
              geo = paired.surfaceGeo;
              break;
            default:
              geo = timespace.geo;
              break;
          }
          obj.location = [degAsDms(geo.lat,'lat'),degAsDms(geo.lng,'lng')].join(', ');
        } else {
          obj.title = "Midpoint longitudes";
        }
      }
    }
    return obj;
  }

  get hasMidInfo() {
    let valid = false;
    if (this.hasC2) {
      const { timespace } = this.$parent.$props;
      valid = timespace instanceof Chart;
    }
    return valid;
  }

  get doubleMode() {
    switch (this.chartMode.display) {
      case "double":
      case "midpoint_outer":
        return true;
      default:
        return false;
    }
  }

  get selectedChart() {
    const { num } = this.chartMode;
    return num === 2 && this.hasC2 ? this.chart2 : this.chart;
  }

  get wrapperClasses() {
    const cls = this.movable ? ["draggable"] : ["static"];
    if (this.showOptions) {
      cls.push("show-options");
    }
    if (this.showContentSwitcher) {
      cls.push("show-content-edit");
    }
    if (this.showChartInfo) {
      cls.push("show-chart-info");
    }
    if (cls.length > 1) {
      cls.push("has-overlay");
    }
    if (this.large && this.style.length > 5) {
      cls.push("expanded");
      cls.push("large");
    }
    return cls;
  }

  get rel() {
    const { key } = this.$parent.$vnode;
    let str = "";
    if (typeof key === "string") {
      str = key;
    }
    return str;
  }

  get context() {
    let out = "";
    const { context } = this.$parent.$props;
    if (context) {
      out = context;
    }
    return out;
  }

  get showEdit() {
    switch (this.context) {
      case "p1":
      case "p2":
      case "p3":
        return true;
      default:
        return false;  
    }
  }

  get showSettingsControl() {
    switch (this.context) {
      case "p1":
      case "p2":
      case "p3":
      case "predictive":
        return this.showSettings;
      default:
        return false;  
    }
  }

  get showZoom() {
    switch (this.context) {
      case "p1":
      case "p2":
      case "p3":
        return true;
      default:
        return false;  
    }
  }

  get showInfo() {
    switch (this.context) {
      case "p1":
      case "p2":
      case "p3":
        return true;
      default:
        return false;  
    }
  }

  get vargaNum() {
    let num = 1;
    const { vargaNum } = this.$parent.$data;
    if (vargaNum) {
      num = vargaNum;
    }
    return num;
  }

  get mayMove() {
    return this.movable && this.draggable;
  }

  get fullscreenIcon() {
    return this.fullscreen ? "fullscreen-exit" : "fullscreen";
  }

  get zoomIcon() {
    return this.large ? "magnify-minus-outline" : "magnify-plus-outline";
  }

  get toggleFullsceenHint() {
    return this.fullscreen ? "Minimise" : "Show full-screen";
  }

  toggleFull() {
    if (this.$refs.container instanceof HTMLElement) {
      toggleFullScreen(this.$refs.container);
      this.fullscreen = !this.fullscreen;
    }
  }

  toggleLarge() {
    if (this.large) {
      this.large = false;
      this.style = "";
      bus.$emit("shrink", this.index);
    } else {
      this.enlarge();
    }
  }

  toggleCogWidget() {
    switch (this.context) {
      case "predictive":
        this.toggleContent();
        break;
      default:
        this.toggleOptions();
        break;
    }
  }

  toggleOptions() {
    this.showOptions = !this.showOptions;
    this.showContentSwitcher = false;
    this.showChartInfo = false;
    if (this.showOptions) {
      bus.$emit("show-overlay", this.index, "options");
    }
  }

  toggleContent() {
    this.showContentSwitcher = !this.showContentSwitcher;
    this.showOptions = false;
    this.showChartInfo = false;
    if (this.showContentSwitcher) {
      bus.$emit("show-overlay", this.index, "content-edit");
    }
  }

  enableMenu() {
    this.enableWidgetMenu = true;
  }

  enlarge() {
    if (this.$refs.container instanceof HTMLElement) {
      const par = this.$refs.container.parentNode;
      if (par instanceof HTMLElement) {
        const style = window.getComputedStyle(par);
        const tc = style.gridTemplateColumns;
        if (tc) {
          const numCols = tc.split(" ").length;
          if (numCols > 1) {
            const num = this.index + 1;
            const row = Math.ceil(num / numCols);
            const numRows = Math.ceil(par.childNodes.length / numCols);
            const col = (this.index % numCols) + 1;
            const isEndCol = col === numCols;
            const isEndRow = row === numRows;

            const buildGridStyle = (
              row: number,
              col: number,
              isEndRow: boolean,
              isEndCol: boolean
            ) => {
              const rowStart = isEndRow ? (row > 1 ? row - 1 : 1) : row;
              const colStart = isEndCol ? (col > 1 ? col - 1 : 1) : col;
              return (
                "grid-area: " +
                rowStart +
                " / " +
                colStart +
                " / span 2 / span 2;"
              );
            };
            this.style = buildGridStyle(row, col, isEndRow, isEndCol);
            this.large = true;
            bus.$emit("enlarge", this.index);
          }
        }
      }
    }
  }

  toggleInfo() {
    this.showChartInfo = !this.showChartInfo;
    this.showOptions = false;
    this.showContentSwitcher = false;
  }

  disableOverlays() {
    this.showOptions = false;
    this.showContentSwitcher = false;
    this.showChartInfo = false;
  }
}
</script>
