<template>
  <GridItem class="greek-lot-table" :showSettings="true" :chart="chart">
    <h4>{{ title }}</h4>
    <div class="greek-lot-values widget" :class="extraClasses">
      <b-table
        v-if="hasValues"
        :data="tableValues"
        :row-class="(row, index) => assignRowClasses(row, index)"
        :sticky-header="true"
        :mobile-cards="false"
      >
        <template slot-scope="props">
          <b-table-column
            class="name"
            field="name"
            label="Type"
          >{{ props.row.name }}</b-table-column>
          <b-table-column
            class="chart c1"
            field="c1"
            :label="subject1"
          ><SignDegree :deg="props.row.c1" :seconds="false" /></b-table-column>
          <b-table-column
            v-if="hasC2"
            class="chart c2"
            field="c2"
            :label="subject2"
          ><SignDegree :deg="props.row.c2" :seconds="false" /></b-table-column>
          <b-table-column
            v-if="hasMid"
            class="chart mid"
            field="mid"
            :label="compositeLabel"
          ><SignDegree :deg="props.row.mid" :seconds="false" /></b-table-column>
        </template>
      </b-table>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import GridItem from "../widgets/GridItem.vue";
import { FilterSet } from "../../api/composables/FilterSet";
import { capitalize } from "../../api/converters";
import { isNumeric, notEmptyString } from "../../api/validators";
import { DictionaryState, SettingState } from "../../store/types";
import { Chart, combineCharts, fetchCurrentTimespace } from "../../api/models/Chart";
import SignDegree from "../widgets/SignDegree.vue";
import { deepClone } from '@/api/helpers';
import { setWidgetOption } from '@/store/local';
import { GreekRow } from '@/api/interfaces';

@Component({
  components: {
    GridItem,
    SignDegree
  },
  filters: {
    ...FilterSet
  }
})
export default class GreekLotTable extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) readonly offset: number;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: "p3" }) readonly context: string;
  @State("dictionary") dictionary: DictionaryState;
  @State("settings") settings: SettingState;

  title = "Greek Lots";

  c1: Chart = new Chart();
  c2: Chart = new Chart();
  cMid: Chart = new Chart();
  vargaNum = 1;

  tableValues: Array<GreekRow> = [];

  midMode = 'midpoint';

  created() {
    this.sync();
  }

  sync() {
    this.c1 = deepClone(this.chart);
    if (this.chart2 instanceof Chart) {
      this.c2 = deepClone(this.chart2);
      this.cMid = fetchCurrentTimespace();
    }
    this.c1.setAyanamshaItem(this.ayanamsha);
    this.c1.setVarga(this.vargaNum);
    this.c2.setAyanamshaItem(this.ayanamsha);
    this.c2.setVarga(this.vargaNum);
    this.assignTableValues();
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get hasValues() {
    return this.c1 instanceof Object && notEmptyString(this.c1.subject.name) && this.c1.grahas.length > 0; 
  }

  get hasC2() {
    return this.c2 instanceof Object && notEmptyString(this.c2.subject.name); 
  }

  get hasMid() {
    return this.cMid instanceof Chart && this.cMid.jd > 0 && this.context === "p3";
  }

  get keyNames() {
    return [
      { key: "fortune", name: "Fortune" },
      { key: "spirit", name: "Spirit" },
      { key: "eros", name: "Eros" },
      { key: "necessity", name: "Necessity" },
      { key: "courage", name: "Courage" },
      { key: "victory", name: "Victory" },
      { key: "nemesis", name: "Nemesis" },
      { key: "sexFemale", name: "Sex (Female)" },
      { key: "sexMale", name: "Sex (Male)" },
      { key: "marriage", name: "Marriage" },
      { key: "children", name: "Children" },
      { key: "basis", name: "Basis" },
      { key: "exaltation", name: "Exaltation" },
    ];
  }

  get subject1() {
    return this.c1.shortName;
  }

  get subject2() {
    return this.c2.shortName;
  }

  get compositeLabel() {
    return this.midMode === 'midpoint'? 'Midpoint' : 'Timespace';
  }

  get extraClasses() {
    const cls = [];
    let cols = 1;
    if (this.hasC2) {
      cls.push('has-c2');
      cols += 1;
      if (this.hasC2) {
        cls.push('has-mid');
        cls.push(this.midMode);
        cols += 1;
      }
    }
    cls.push(['cols', cols].join('-'));
    return cls;
  }

  assignTableValues() {
    let midRef = null;
    if (this.hasMid) {
      midRef = this.midMode === 'timespace'? this.cMid : combineCharts(this.c1, this.c2, this.ayanamsha);
    }
    this.tableValues = this.keyNames.map((opt) => {
      const getMethod = "lotOf" + capitalize(opt.key);
      return {
        key: opt.key,
        name: opt.name,
        c1: this.c1[getMethod],
        c2: this.hasC2? this.c2[getMethod] : 0,
        mid: this.hasMid? midRef[getMethod] : 0,
      }
    });
  }

  assignRowClasses(row: GreekRow, index: number) {
    return [
      ["index", index].join("-"),
      ["greek-lot", index].join("-"),
      row.key
    ];
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      const num = parseInt(newVal);
      this.c1.setVarga(num);
      if (this.hasC2) {
        this.c2.setVarga(num);
      }
      setWidgetOption(
        this.context,
        "SingleChart",
        this.paneIndex,
        "vargaNum",
        newVal
      );
    }
    setTimeout(this.assignTableValues, 250);
  }

  @Watch("midMode")
  changeMidMode() {
    setTimeout(this.assignTableValues, 250);
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    this.c1.setAyanamshaItem(newVal);
    if (this.hasC2) {
      this.c2.setAyanamshaItem(newVal);
    }
    setTimeout(this.assignTableValues, 250);
  }

  @Watch("chart")
  changeChart() {
    setTimeout(this.sync, 250);
  }

  @Watch("chart2")
  changeChart2() {
    setTimeout(this.sync, 250);
  }
  
}
</script>