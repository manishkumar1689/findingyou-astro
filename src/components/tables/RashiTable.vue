<template>
  <b-table
    v-if="hasRashis"
    :data="rashis"
    :row-class="(row, index) => assignRowClasses(row, index)"
  >
    <template slot-scope="props">
      <b-table-column class="name" :class="props.row.key" field="name" label="Name">
        <span class="symbol">{{props.row.icon}}</span>
        <span class="key">{{props.row.key}}</span>
      </b-table-column>
      <b-table-column class="num" field="num" label="#">{{ props.row.num }}</b-table-column>
      <b-table-column class="house" field="houseNum" label="House">{{ props.row.houseNum }}</b-table-column>
      <b-table-column
        class="lord-in-house"
        field="lordInHouse"
        label="Lord in House"
      >{{ props.row.lordInHouse }}</b-table-column>
      <b-table-column
        class="house-difference"
        field="houseDifference"
        label="House Difference"
      >{{ props.row.houseDifference }}</b-table-column>
      <b-table-column class="ruler" field="ruler" label="ruler">{{ props.row.ruler }}</b-table-column>
      <b-table-column class="element" field="element" label="element">{{ props.row.element }}</b-table-column>
      <b-table-column class="mobility" field="mobility" label="mobility">{{ props.row.mobility }}</b-table-column>
      <b-table-column
        class="arudha-in-house"
        field="arudha.house"
        label="Arudha in house"
      >{{ props.row.arudha.house }}</b-table-column>

      <b-table-column
        class="arudha-name"
        field="arudha.name"
        label="Arudha Name"
      >{{ props.row.arudha.name }}</b-table-column>
      <b-table-column
        class="arudha-alt"
        field="arudha.alt"
        label="Arudha Alt"
      >{{ props.row.arudha.alt }}</b-table-column>
    </template>
  </b-table>
</template>
<script lang="ts">
import { Rashi } from "../../api/models/Rashi";
import { Component, Prop, Vue } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";

@Component({
  filters: FilterSet
})
export default class RashiTable extends Vue {
  @Prop({ default: () => [] }) rashis: Array<Rashi>;

  get hasRashis(): boolean {
    return this.rashis.length > 0;
  }

  assignRowClasses(row: Rashi, index: number) {
    return [["index", index].join("-"), ["rashi", row.key].join("-")];
  }
}
</script>
