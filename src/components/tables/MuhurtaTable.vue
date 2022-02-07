<template>
  <GridItem class="muhurta-table" :showSettings="false" :chart="chart">
    <h4>{{ dictionary.text("muhurta", 0) }}</h4>
    <div class="muhurta-values widget">
      <b-table
        v-if="hasValues"
        :data="values"
        :row-class="(row, index) => assignRowClasses(row, index)"
        :sticky-header="true"
        :mobile-cards="false"
      >
        <template slot-scope="props">
          <b-table-column class="num" field="num" label="#">{{ props.row.num | zeroPad2 }}</b-table-column>
          <b-table-column
            class="name"
            field="name"
            label="Name"
            :title="excludingDays(props.row.exDays)"
          >{{ muhurtaName(props.row.num) }}</b-table-column>
          <b-table-column
            class="start"
            field="startDt"
            label="Start"
            :title="props.row.jd"
          >{{ longTime(props.row.jd) }}</b-table-column>
          <b-table-column
            class="quality"
            field="quality"
            label="quality"
            :title="gunaOrig(props.row.quality)"
          >{{ gunaText(props.row.quality) }}</b-table-column>
        </template>
      </b-table>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue } from "vue-property-decorator";
import GridItem from "../widgets/GridItem.vue";
import { FilterSet } from "../../api/composables/FilterSet";
import { julToLongDate, julToHMS } from "../../api/converters";

import {
  MuhurtaSet,
  MuhurtaBase,
  MuhurtaItem
} from "../../api/models/MuhurtaSet";
import { notEmptyString } from "../../api/validators";
import { DictionaryState } from "../../store/types";
import { Chart } from "../../api/models/Chart";

@Component({
  components: {
    GridItem
  },
  filters: {
    ...FilterSet
  }
})
export default class MuhurtaTable extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: 0 }) readonly offset: number;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: "p1" }) readonly context: string;
  @State("dictionary") dictionary: DictionaryState;

  get muhurtas(): MuhurtaSet {
    return this.chart.muhurtas;
  }

  get hasValues(): boolean {
    return this.muhurtas.values.length > 0;
  }

  get values(): Array<MuhurtaBase> {
    return this.muhurtas.values;
  }

  excludingDays(days: Array<number>): string {
    return days.map(d => this.dictionary.text("vara", d)).join(", ");
  }

  assignRowClasses(row: MuhurtaItem, index: number) {
    return [
      ["index", index].join("-"),
      ["muhurta", index].join("-"),
      row.active ? "active" : "inactive"
    ];
  }
  longDate(jd: number) {
    return julToLongDate(jd, this.chart.tzOffset);
  }
  longTime(jd: number) {
    return julToHMS(jd, this.chart.tzOffset);
  }
  guna(key) {
    if (notEmptyString(key)) {
      return this.dictionary.lexeme("guna", key);
    }
  }
  muhurtaName(num) {
    const lex = this.dictionary.lexeme("muhurta", num);
    if (lex) {
      return lex.text("sa", "standard");
    }
  }
  gunaText(key) {
    const lex = this.guna(key);
    if (lex) {
      return lex.text("en", "standard");
    }
  }
  gunaOrig(key) {
    const lex = this.guna(key);
    if (lex) {
      return lex.original;
    }
  }
}
</script>
