<template>
  <b-table
    v-if="hasVargas"
    :data="vargas"
    class="compact"
    :row-class="(row, index) => assignRowClasses(row, index)"
    scrollable
  >
    <template slot-scope="props">
      <b-table-column
        class="name"
        :class="props.row.key"
        field="name"
        label="Name"
      >
        <span class="symbol">{{ props.row.key | toGrahaIcon }}</span>
        <span class="key">{{ props.row.key }}</span>
      </b-table-column>
      <b-table-column
        v-for="(vk, vi) in valueKeys"
        :key="vk"
        class="value"
        :class="vk"
        :field="vk"
        :label="vk"
        >{{ props.row.values[vi].value | toDMS }}</b-table-column
      >
    </template>
  </b-table>
</template>
<script lang="ts">
import { VargaSet } from "../../api/models/VargaSet";
import { Component, Prop, Vue } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";

@Component({
  filters: FilterSet
})
export default class VargasTable extends Vue {
  @Prop({ default: () => [] }) vargas: Array<VargaSet>;

  get hasVargas(): boolean {
    return this.vargas.length > 0;
  }

  get valueKeys(): Array<string> {
    let keys: Array<string> = [];
    if (this.hasVargas) {
      keys = this.vargas[0].values.map(row => row.key);
    }
    return keys;
  }

  assignRowClasses(row: VargaSet, index: number) {
    return [["index", index].join("-"), ["varga", row.key].join("-")];
  }
}
</script>
