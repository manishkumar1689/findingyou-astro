<template>
<div class="condition-set vertical">
  <div class="operator" :class="conditionSet.operator">{{ conditionSet.operator }}</div>
  <template v-for="(cond, ci) in conditionSet.conditionRefs">
    <condition-row v-if="!cond.isSet" :key="['condition-row', cond, buildParents(ci)].join('-')" :condition="cond" :indices="buildParents(ci)" :allOptions="allOptions" :contextOpts="contextOpts" :chartModes="chartModes" :type="type" />
    <condition-set-row v-if="cond.isSet" :key="['condition-set-row', cond, buildParents(ci)].join('-')" :conditionSet="cond" :indices="buildParents(ci)" :allOptions="allOptions" :contextOpts="contextOpts" :chartModes="chartModes" :type="type" />
  </template>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Condition, ConditionSet } from '@/api/models/Condition';
import ConditionRow from "./ConditionRow.vue";
import { CompatibiltyOptionSet, KeyName } from '@/api/interfaces';
@Component({
  components: {
    ConditionRow
  }
})
export default class ConditionSetRow extends Vue {
  @Prop({ default: () => new ConditionSet() }) readonly conditionSet: ConditionSet;
  @Prop({ default: () => [0] }) readonly indices: Array<number>;
  @Prop({ default: () => [] }) readonly allOptions: Array<CompatibiltyOptionSet>;
  @Prop({ default: () => [] }) readonly contextOpts: Array<KeyName>;
  @Prop({ default: () => [] }) readonly chartModes: Array<KeyName>;
  @Prop({ default: "synastry" }) readonly type: string;

  buildParents(index: number) {
    return [...this.indices, index];
  }

}
</script>