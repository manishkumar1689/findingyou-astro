<template>
  <div class="main-view" :class="wrapperClasses" @click="handleViewClick">
    <aside class="sidebar">
      <div class="toggle-sidebar" @click="toggleSidebar"></div>
      <SidebarManager :c1="c1" :c2="c2" :paired="showSecondChartForm" />
    </aside>
    <div class="results">
      <h3 class="subject-name-display" @click="toggleSidebar">
        {{ subjectDisplay }}
      </h3>
      <b-tabs v-model="activeTab" :multiline="true">
        <b-tab-item :label="dictionary.text('panchanga', '0')">
          <div
            v-if="showPaneContent('current')"
            class="subpanes grid-panes sortable"
            id="subpane-set-1"
          >
            <component
              v-for="(widget, wi) in gridSets.p1"
              :key="[widget.name, wi].join('-')"
              :is="widget.name"
              :chart="currentChart"
              :paneIndex="wi"
              :offset="tzOffsetSecs"
              :showSettings="false"
              context="p1"
            />
          </div>
          <div v-else-if="!hasPidsRef" class="in-progress" id="subpane-set-1">
            <b-progress size="is-large" type="is-primary" :show-value="true"
              >Loading Pancanga</b-progress
            >
          </div>
        </b-tab-item>
        <b-tab-item label="Single Chart">
          <div
            v-if="showPaneContent('single')"
            class="subpanes grid-panes sortable"
            id="subpane-set-2"
          >
            <component
              v-for="(widget, wi) in gridSets.p2"
              :key="[widget.name, wi].join('-')"
              :is="widget.name"
              :chart="c1"
              :paneIndex="wi"
              context="p2"
            />
          </div>
        </b-tab-item>
        <b-tab-item :disabled="!hasPaired" label="Paired Chart">
          <div
            v-if="showPaneContent('paired')"
            class="subpanes grid-panes sortable"
            id="subpane-set-3"
          >
            <component
              v-for="(widget, wi) in gridSets.p3"
              :key="[widget.name, wi].join('-')"
              :is="widget.name"
              :chart="c1"
              :chart2="c2"
              :mode="widget.mode"
              :set="widget.set"
              :paneIndex="wi"
              context="p3"
            />
          </div>
        </b-tab-item>
        <b-tab-item :disabled="!hasC1" label="Predictive">
          <div
            v-if="showPaneContent('predictive')"
            class="predictive-panes"
            id="subpane-set-4"
          >
           <dasha-transits :chart="c1" />
          </div>
        </b-tab-item>
      </b-tabs>
    </div>
  </div>
</template>
<script lang="ts">
import { State, Action } from "vuex-class";
import { Component, Watch, Vue } from "vue-property-decorator";
import { GeoLoc } from "../api/models/GeoLoc";
import {
  fetchCoreByGeoDatetime,
  fetchUserCharts,
  getPairedByChartIds,
} from "../api/methods";
import { asDateString, julToLongDate } from "../api/converters";
import { isNumeric, notEmptyString } from "../api/validators";
import { buildChartForm } from "../api/mappers";
import {
  DictionaryState,
  UserState,
  ChartFormSetState,
  SettingState,
} from "../store/types";
import widgetDefaults from "../api/mappings/widget-defaults";
import { bus } from "../main";
import { Chart } from "../api/models/Chart";
import { fetchGeo } from "../api/geoloc-utils";
import {
  saveWidgetSetOptions,
  mapMenuWidget,
  matchPaneContext,
  manageWidget,
  addChartToList,
} from "../store/local";
import sortableElement from "../assets/scripts/sortable";

function load(view: string) {
  return () => import(`./${view}.vue`);
}

@Component({
  components: {
    GrahaTable: load("tables/GrahaTable"),
    RashiTable: load("tables/RashiTable"),
    TransitionsTable: load("tables/TransitionsTable"),
    AprakasaData: load("tables/AprakasaData"),
    CaughadiaTable: load("tables/CaughadiaTable"),
    MuhurtaTable: load("tables/MuhurtaTable"),
    MrityubhagaTable: load("tables/MrityubhagaTable"),
    LagnaSphutaSet: load("tables/LagnaSphutaSet"),
    LineGraph: load("widgets/LineGraph"),
    BarGraph: load("widgets/BarGraph"),
    SidebarManager: load("forms/SidebarManager"),
    SingleChart: load("charts/SingleChart"),
    KotaCakraChart: load("charts/KotaCakraChart"),
    CakraSudarshanaChart: load("charts/CakraSudarshanaChart"),
    PlanetStationsTable: load("tables/PlanetStationsTable"),
    PanchangaTable: load("tables/PanchangaTable"),
    AshtakavargaTable: load("tables/AshtakavargaTable"),
    AspectTable: load("tables/AspectTable"),
    SarvatobhadraCakra: load("charts/SarvatobhadraCakra"),
    DashaTree: load("tables/DashaTree"),
    GrahaDrishti: load("charts/GrahaDrishti"),
    Kuta: load("charts/Kuta"),
    GreekLotTable: load("tables/GreekLotTable"),
    DashaTransits: load("forms/DashaTransits"),
  },
})
export default class AstrologicView extends Vue {
  @State("dictionary") dictionary: DictionaryState;
  @State("chartForms") chartForms: ChartFormSetState;
  @State("user") user: UserState;
  @State("settings") settings: SettingState;
  @Action("appendForm", { namespace: "chartForms" })
  appendForm: any;

  showSidebar = false;

  activeTab = 0;

  panes = [
    {
      key: "current",
      ref: "p1",
      enabled: true,
    },
    {
      key: "single",
      ref: "p2",
      enabled: true,
    },
    {
      key: "paired",
      ref: "p3",
      enabled: true,
    },
    {
      key: "predictive",
      ref: "p4",
      enabled: true,
    },
  ];

  c1: any = null;

  c2: any = null;

  currentGeo = new GeoLoc([0, 0, 0]);

  currentDate = new Date();

  currentChart: any = null;

  initialized = false;

  gridSets = { p1: [], p2: [], p3: [], p4: [] };

  recentPairs = [];

  pairedRefIds = [];

  created() {
    this.matchPairedIdsQueryString();
    if (this.hasPidsRef) {
      this.activeTab = 2;
      this.loadReferencedPairedChart();
    } else { 
      this.initFromPath();
      this.mapGridSet();
      this.detectCurrentGeoDatetime();
      this.loadData();
    }
    bus.$on("chart-loaded", (chart, index) => {
      if (chart instanceof Object) {
        this.handleResults(chart, index);
        if (this.activeTab === 0) {
          this.activeTab = 1;
        }
      }
    });
    bus.$on("escape", () => {
      this.showSidebar = false;
    });
    bus.$on("show-form", ({ index }) => {
      if (index >= 0) {
        this.showSidebar = true;
      }
    });
    bus.$on("switch-chart", ({ chart, index, context, paired }) => {
      if (chart instanceof Chart) {
        const isPairedOrCurrent = this.hasPaired && this.activeTab === 2 || this.activeTab < 1;
        const activeTab = isPairedOrCurrent ? 1 : this.activeTab;
        addChartToList(chart);
        switch (context) {
          case "chart":
          case "p2":
          case "single":
          case "admin":
            this.reinitChart(chart, paired, index, activeTab)
            break;
        }
      }
    });
    bus.$on("set-paired-chart", (paired, move) => {
      this.setPairedChart(paired);
      if (move) {
        setTimeout(() =>{
          this.activeTab = 2;
        }, 375);
      }
    });
    bus.$on("reload", () => {
      this.loadData(true);
    });
    bus.$on("manage-widgets", (data) => {
      if (data.context) {
        const tgId = data.context.replace(/^p/, "subpane-set-");
        const tgPane = document.getElementById(tgId);
        if (tgPane) {
          tgPane.classList.remove("sort-active");
          setTimeout(this.makeSortable, 1000);
        }
      }
      manageWidget(this.gridSets, data);
    });
  }

  mounted() {
    const gridSets = this.$ls.get("grid-sets");
    if (gridSets instanceof Object) {
      if (gridSets.p2 instanceof Array) {
        if (gridSets.p2.length > 0) {
          if (gridSets.p2[0] instanceof Object) {
            this.gridSets = gridSets;
          }
        }
      }
    } else {
      this.$ls.set("grid-sets", this.gridSets);
    }
    setTimeout(this.makeSortable, 1000);
  }

  setPrimaryChart(chart: Chart) {
    const swapCharts = this.hasC2 && chart._id === this.c2._id;
    if (swapCharts) {
      this.c2 = this.c1;
      this.$ls.set("c2", this.c2._id);
    }
    this.c1 = chart;
    this.$ls.set("c1", this.c1._id);
    if (!this.isPairedtab) {
      this.$ls.set("single", chart._id);
      const { cId, cf } = this.assignChart(0);
      
      const cfIndex = this.chartForms.forms.findIndex((f) => f.id === cId);
      if (cfIndex < 0) {
        this.appendForm(cf);
        this.syncStoredCharts(cf.chart);
      }
    }
  }

  reinitChart(chart: Chart, paired, index = 0, activeTab = -1) {
    if (this.initialized) {
      if (paired) {
        const relKey = index > 0 ? "c2" : "c1;";
        if (index > 0) {
          this.c2 = chart;
        } else {
          this.c1 = chart;
        }
        this.$ls.set(relKey, chart._id);
          activeTab = 2;
      } else {
        this.setPrimaryChart(chart);
      }
      if (this.activeTab != activeTab) {
        setTimeout(() =>{
          this.activeTab = activeTab;
        }, 375);
      }
      this.changeChart();
    }
  }

  makeSortable() {
    const subpanesEls = document.querySelectorAll(".subpanes.sortable");
    if (subpanesEls.length > 0) {
      subpanesEls.forEach((subpanesEl) => {
        if (subpanesEl instanceof HTMLElement) {
          if (subpanesEl.classList.contains("sort-active") === false) {
            subpanesEl.classList.add("sort-active");
            sortableElement(subpanesEl, (data) => {
              if (data instanceof Object) {
                if (data.rels instanceof Array) {
                  saveWidgetSetOptions(this.gridSets, data);
                }
              }
            });
          }
        }
      });
    }
  }

  mapGridSet() {
    const panes = ["p1", "p2", "p3", "p4"];
    const filtered = panes.map((pane) => {
      const refKey = matchPaneContext(pane);
      const empty: Array<any> = [];
      const widgets = widgetDefaults
        .filter((wc) => wc.panes.includes(refKey))
        .map((wc) => wc.widgets)
        .filter((ws) => ws instanceof Array)
        .reduce((a, b) => {
          return a.concat(b);
        }, empty)
        .filter((w) => {
          return w.enabled && w.active.includes(refKey);
        })
        .map(mapMenuWidget);
      return [pane, widgets];
    });
    this.gridSets = Object.fromEntries(filtered);
  }

  async loadData(refresh = false) {
    const stored = refresh ? null : this.$ls.get("charts");
    let hasCharts = false;
    let charts = [];
    if (stored instanceof Array) {
      hasCharts = stored.length > 2;
      charts = stored;
    }
    if (!hasCharts || refresh) {
      const cd = await fetchUserCharts(this.user._id);
      if (cd.valid) {
        hasCharts = cd.items.length > 0;
        if (hasCharts) {
          charts = cd.items;
          this.$ls.set("charts", charts, 3600 * 1000);
        }
      }
    }
  
    if (hasCharts && !this.hasPidsRef) {
      this.syncCharts(charts);
      const pc = this.isPairedtab ? this.$ls.get("selected-pc") : null;
      
      if (pc instanceof Object) {
        this.setPairedChart(pc);
      } else {  
        this.assignSingleCharts(charts);
      }
    }
  }

  matchPairedIdsQueryString() {
    const { query } = this.$route;
    const queryMap = new Map(Object.entries(query));
    if (queryMap.size > 0) {
      if (queryMap.has("pids")) {
        const pids = queryMap.get("pids");
        if (typeof pids === "string") {
          const [c1, c2] = pids.split(",");
          if (notEmptyString(c2, 9)) {
            this.pairedRefIds = [c1, c2];
          }
        }
      }
    }
  }

  get hasPidsRef() {
    return this.pairedRefIds.filter(pid => notEmptyString(pid, 8)).length === 2;
  }

  loadReferencedPairedChart() {
    const [c1, c2] = this.pairedRefIds;
    this.activeTab = 2;
    getPairedByChartIds(c1, c2).then((data) => {
      if (data.valid) {
        this.setPairedChart(data.item);
        setTimeout(() => {
          this.moveToPaired();
        }, 1000);
      }
    });
  }

  moveToPaired() {
    this.activeTab = 2;
    const lis = document.querySelectorAll('.results .tabs ul li');
    if (lis.length > 0) {
      const listItem = [...lis].find(p => /paired/i.test(p.textContent));
      if (listItem instanceof HTMLElement) {
        listItem.querySelector('a').click();
      }
    }
  }

  assignSingleCharts(charts) {
    let chart = null;
    let c1Id = this.$ls.get("single");
    if (c1Id) {
      chart = charts.find((c) => c._id === c1Id);
    } else {
      c1Id = this.$ls.get("c1");
      if (c1Id) {
        chart = charts.find((c) => c._id === c1Id);
      }
    }
    if (!chart) {
      chart = charts[0];
    }
    if (chart instanceof Object) {
      this.handleResults(chart, 0, true);
    }

    const c2Id = this.$ls.get("c2");
    if (c2Id) {
      const c2 = charts.find((c) => c._id === c2Id);
      if (c2) {
        this.handleResults(c2, 1, true);
      }
    }
  }

  detectCurrentGeoDatetime() {
    const cc = this.$ls.get("current");
    if (cc instanceof Object) {
      cc.subject = {
        name: "Current Chart",
      };
      this.currentChart = new Chart(cc);
    } else {
      fetchGeo((data) => {
        this.currentGeo = new GeoLoc([
          data.latitude,
          data.longitude,
          data.altitude,
        ]);
        fetchCoreByGeoDatetime(
          this.currentGeo,
          asDateString(this.currentDate)
        ).then((data) => {
          data.subject = {
            name: "Current Chart",
          };
          this.currentChart = new Chart(data);
          this.$ls.set("current", data, 10 * 60 * 1000);
        });
      });
    }
  }

  changeChart() {
    setTimeout(() => {
      bus.$emit("changeChart", true);
    }, 500);
  }

  handleResults(result, index = 0, restoreMode = false) {
    const key = index < 1? "c1" : "c2";
    this.assignChartSlot(result, key, restoreMode);
    this.changeChart();
    this.$ls.set(key, result._id);
    if (result._id) {
      setTimeout(() => {
        this.initialized = true;
      }, 1000);
    }
    if (!restoreMode) {
      this.syncStoredCharts(result);

      const { cId, cf } = this.assignChart(index);
      const cfIndex = this.chartForms.forms.findIndex((f) => f.id === cId);
      if (cfIndex < 0) {
        this.appendForm(cf);
      }
    }
    setTimeout(() => {
      if (this.activeTab === 1 && index === 0) {
        this.$ls.set("single", this.c1._id);
      }
    }, 1000);
  }

  assignChartSlot(result, key = "c1", restoreMode = false) {
    this[key] = new Chart(result);
    this[key].setAyanamshaItem(this.ayanamsha);
    if (!restoreMode) {
      addChartToList(this[key]);
    }
  }

  syncStoredCharts(result = null) {
    if (result instanceof Object) {
      const storedCharts = this.$ls.get("charts");
      const hasStored =
        storedCharts instanceof Array && storedCharts.length > 0;
      const charts: Array<Chart> = hasStored ? storedCharts : [];

      if (result._id) {
        const index = charts.findIndex((c) => c._id === result._id);

        if (index < 0) {
          // do not store temp. > 1000 charts
          if (charts.length > 1000) {
            charts.pop();
          }
        } else {
          charts.splice(index, 1);
        }
        charts.unshift(result);
      }
      this.$ls.set("charts", charts, 24 * 3600 * 1000);
    }
  }

  setPairedChart = (paired) => {
    if (paired instanceof Object) {
      const { c1, c2 } = paired;
      if (c1 instanceof Object && c2 instanceof Object) {
        const [first, second] =
          this.hasC1 && c2._id === this.c1._id ? [c2, c1] : [c1, c2];
        this.handleResults(first, 0, true);
        this.handleResults(second, 1, true);
        this.$ls.set("pc1", first._id);
        this.$ls.set("pc2", second._id);
      }
    }
  };

  showPaneContent(key: string) {
    const pane = this.panes.find((p) => p.key === key);
    let valid = false;
    if (pane instanceof Object) {
      valid = pane.enabled;
      if (valid) {
        switch (key) {
          case "current":
            return this.hasCurrentChart;
          case "single":
            return this.hasC1;
          case "paired":
            return this.hasC1 && this.hasC2;
          case "predictive":
            return this.hasC1;
        }
      }
    }
    return valid;
  }

  syncCharts(charts: Array<Chart> = []) {
    charts.forEach((chart) => {
      const cf = buildChartForm(chart);
      const cId = chart._id.toString();
      const cfIndex = this.chartForms.forms.findIndex((f) => f.id === cId);
      if (cfIndex < 0) {
        this.appendForm(cf);
      }
    });
  }

  assignChart(index = 0) {
    const c = index < 1 ? this.c1 : this.c2;
    const cId = c._id.toString();
    return {
      cId,
      cf: buildChartForm(c),
    };
  }

  handleViewClick(e) {
    const par = document.querySelector(".main-view .results");
    if (par) {
      if (par.contains(e.target)) {
        const tg = e.target.tagName.toLowerCase();
        switch (tg) {
          case "i":
          case "h3":
            break;
          default:
            this.showSidebar = false;
            break;
        }
      }
    }
  }

  refresh() {
    this.$ls.remove("current");
    this.loadData();
  }

  refreshPane(context: string) {
    this.panes = this.panes.map((p) => {
      if (p.ref === context) {
        p.enabled = false;
      }
      return p;
    });
    setTimeout(() => {
      this.panes = this.panes.map((p) => {
        p.enabled = true;
        return p;
      });
    }, 0);
  }

  get tabKeys() {
    return this.panes.filter(p => this.showPaneContent(p.key)).map((pane) => pane.key);
  }

  get isPairedtab() {
    return this.activeTab === 2;
  }

  get hasChart() {
    return this.c1 instanceof Chart ? this.c1.hasIndianTime : false;
  }

  get hasC1() {
    return this.hasChart;
  }

  get hasC2() {
    return this.c2 instanceof Chart ? this.c2.hasIndianTime : false;
  }

  get hasPaired() {
    return this.hasC2;
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get showSecondChartForm(): boolean {
    switch (this.activeTab) {
      case 2:
        return this.hasPaired;
      default:
        return false;
    }
  }

  get hasCurrentChart() {
    return this.currentChart instanceof Chart && this.currentChart.jd > 100;
  }

  get pairedNames() {
    const names = this.hasC1 ? [this.c1.subject.name] : [];
    if (this.hasC2) {
      if (this.c2.subject instanceof Object) {
        names.push(this.c2.subject.name);
      }
    }
    return names.join(" / ");
  }

  get currentChartLabel() {
    const parts = this.hasCurrentChart
      ? [julToLongDate(this.currentChart.jd, this.currentChart.tzOffset)]
      : [];
    if (this.hasCurrentChart && this.currentChart.placenames.length > 0) {
      parts.push(this.currentChart.corePlacenames);
    }
    return parts.join(" / ");
  }

  get subjectDisplay() {
    const { path } = this.$route;
    const endPart = path.split("/").pop();
    switch (endPart) {
      case 'current':
        return this.currentChartLabel;
      case 'paired':
        return this.pairedNames;
      default:
        return this.hasC1 ? this.mainMatchedTitle : "";
    }
  }

  get mainMatchedTitle() {
    const { name } = this.c1.subject;
    let str = name;
    if (!this.c1.isBirthChart && this.c1.hasParent) {
      const parent = this.$ls.get("parent");
      if (parent instanceof Object) {
        if (Object.keys(parent).includes("name")) {
          str = parent.name;
        }
      }
    }
    return str;
  }

  get wrapperClasses(): Array<string> {
    const cls = [];
    if (this.showSidebar) {
      cls.push("show-sidebar");
    }
    return cls;
  }

  get hasMainChart(): boolean {
    return this.c1 instanceof Chart;
  }

  get tzOffsetSecs(): number {
    let tzSecs = 0;
    if (this.hasChart) {
      const { tzOffset } = this.c1;
      if (isNumeric(tzOffset)) {
        tzSecs = tzOffset;
      }
    }
    return tzSecs;
  }

  get placeNames(): string {
    let items = [];
    if (this.c1 instanceof Object) {
      const { placenames } = this.c1;
      if (placenames instanceof Array) {
        items = placenames;
      }
    }
    return items
      .reverse()
      .map((p) => p.name)
      .join(", ");
  }

  initFromPath() {
    const { path } = this.$route;
    if (path) {
      if (path.lastIndexOf("/") > 1) {
        const parts = path.split("/");
        if (parts.length > 1) {
          const alias = parts.pop();
          const tabIndex = this.panes.map(p => p.key).indexOf(alias);
          if (tabIndex >= 0) {
            this.activeTab = tabIndex;
          }
        }
      }
    }
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
    bus.$emit("show-chart-sidebar", this.showSidebar);
  }

  @Watch("activeTab")
  changeActiveTab(newVal) {
    const alias = this.tabKeys[newVal];
    
    if (alias) {
      const newPath = "/astro/" + alias;
      setTimeout(() => {
        this.makeSortable();
      }, 2000);
      const { path } = this.$route;
      if (path !== newPath) {
        this.$router.push(newPath);
        if (this.isPairedtab) {
          const pc1Id = this.$ls.get('pc1');
          if (notEmptyString(pc1Id, 12) && pc1Id !== this.c1._id) {
            const pc = this.$ls.get("selected-pc")
            if (pc instanceof Object) {
              this.setPairedChart(pc);
            }
          }
        } else {
          const c1Id = this.$ls.get('single');
          if (notEmptyString(c1Id, 12) && c1Id !== this.c1._id) {
            const stored = this.$ls.get("charts");
            const charts = stored instanceof Array? stored : [];
            if (charts.length>0) {
              this.assignSingleCharts(charts);
            }
          }
        }
      }
    }
    const context = ["p", newVal + 1].join("");
    bus.$emit("switch-pane", {
      context,
      alias,
      index: newVal,
    });
  }
}
</script>
