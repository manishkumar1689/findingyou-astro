<template>
  <GridItem class="transitions-table" :index="paneIndex" :chart="chart" :showSettings="false">
    <h4>{{ mainLabel }}</h4>
    <div class="transition-values widget">
      <b-tabs v-if="hasValues" v-model="activeTab" :multiline="true">
        <b-tab-item>
          <template slot="header">
            <p>
              <strong>{{ ascTabLabel }}</strong>
              <small>{{ riseTabLabel }}</small>
            </p>
            <p>
              <strong>{{ dscTabLabel }}</strong>
              <small>{{ setTabLabel }}</small>
            </p>
          </template>
          <b-table
            :data="transitions"
            :row-class="(row, index) => assignRowClasses(row, index)"
            :mobile-cards="false"
          >
            <template slot-scope="props">
              <b-table-column class="num" field="num" label>
                <i class="icon" :class="props.row.key | toGrahaClass"></i>
              </b-table-column>
              <b-table-column
                class="asc"
                :class="props.row.key"
                field="rise"
                :label="riseColLabel"
                :title="longDate(props.row.rise.jd)"
              >{{ longTime(props.row.rise.jd) }}</b-table-column>
              <b-table-column
                class="desc"
                :class="props.row.key"
                field="set"
                :label="setColLabel"
                :title="longDate(props.row.set.jd)"
              >{{ longTime(props.row.set.jd) }}</b-table-column>
            </template>
          </b-table>
        </b-tab-item>
        <b-tab-item>
          <template slot="header">
            <p>
              <strong>{{ mcTabLabel }}</strong>
              <small>{{ zenithTabLabel }}</small>
            </p>
            <p>
              <strong>{{ icTabLabel }}</strong>
              <small>{{ nadirTabLabel }}</small>
            </p>
          </template>
          <b-table
            :data="transitions"
            :row-class="(row, index) => assignRowClasses(row, index)"
            :mobile-cards="false"
          >
            <template slot-scope="props">
              <b-table-column class="num" field="num" label="#">
                <i class="icon" :class="props.row.key | toGrahaClass"></i>
              </b-table-column>
              <b-table-column
                class="asc"
                :class="props.row.key"
                field="mc"
                label="MC"
                :title="longDate(props.row.mc.jd)"
              >{{ longTime(props.row.mc.jd) }}</b-table-column>
              <b-table-column
                class="desc"
                :class="props.row.key"
                field="ic"
                label="IC"
                :title="longDate(props.row.ic.jd)"
              >{{ longTime(props.row.ic.jd) }}</b-table-column>
            </template>
          </b-table>
        </b-tab-item>
      </b-tabs>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { DictionaryState } from "../../store/types";
import { Component, Prop, Vue } from "vue-property-decorator";
import GridItem from "../widgets/GridItem.vue";
import { FilterSet } from "../../api/composables/FilterSet";
import { julToHMS, julToLongDate } from "../../api/converters";
import { TransitionSet } from "../../api/models/TransitionSet";
import { Chart } from "../../api/models/Chart";
@Component({
  components: {
    GridItem
  },
  filters: FilterSet
})
export default class TransitionsTable extends Vue {
  @State("dictionary") dictionary: DictionaryState;
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: 0 }) readonly offset: number;
  @Prop({ default: 0 }) readonly paneIndex: number;
  @Prop({ default: "p1" }) readonly context: string;

  private activeTab = 0;

  get hasValues(): boolean {
    return this.transitions.length > 0;
  }

  get transitions() {
    let items: Array<any> = [];
    if (this.chart.grahas.length > 0) {
      items = this.chart.getTransitions();
    }
    return items;
  }
  get mainLabel(): string {
    return this.dictionary.text("infobox", "transitions");
  }
  get ascTabLabel(): string {
    return this.dictionary.text("tabs", "asc");
  }
  get dscTabLabel(): string {
    return this.dictionary.text("tabs", "dsc");
  }
  get riseTabLabel(): string {
    return this.dictionary.text("tabs", "rise");
  }
  get setTabLabel(): string {
    return this.dictionary.text("tabs", "set");
  }
  get mcTabLabel(): string {
    return this.dictionary.text("tabs", "mc");
  }
  get zenithTabLabel(): string {
    return this.dictionary.text("tabs", "zenith");
  }
  get icTabLabel(): string {
    return this.dictionary.text("tabs", "ic");
  }
  get nadirTabLabel(): string {
    return this.dictionary.text("tabs", "nadir");
  }
   get riseColLabel(): string {
    return this.dictionary.text("col", "rise");
  }
  get setColLabel(): string {
    return this.dictionary.text("col", "set");
  }

  assignRowClasses(row: TransitionSet, index: number) {
    return [
      ["index", index].join("-"),
      ["transition", row.key, index].join("-")
    ];
  }
  longDate(jd: number) {
    return julToLongDate(jd, this.chart.tzOffset);
  }

  longTime(jd: number) {
    return julToHMS(jd, this.chart.tzOffset);
  }
}
</script>
