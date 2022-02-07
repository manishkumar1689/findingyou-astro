<template>
<div class="condition">
  <span class="from-mode">{{ renderMode(condition.fromMode) }}</span>
  <span class="c1">{{ renderKey(condition.c1Key) }}</span>
  <span v-if="condition.hasContext" class="context">{{
    renderContext(condition.context)
  }}</span>
    <span class="to-mode">{{ renderMode(condition.toMode) }}</span>
    <span class="c2">{{ renderKey(condition.c2Key) }}</span>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Condition } from '@/api/models/Condition';
import { notEmptyString } from '@/api/validators';
import { CompatibiltyOptionSet, KeyName } from '@/api/interfaces';

@Component
export default class ConditionRow extends Vue {
  @Prop({ default: () => new Condition() }) readonly condition: Condition;
  @Prop({ default: () => [0] }) readonly indices: Array<number>;
  @Prop({ default: () => [] }) readonly allOptions: Array<CompatibiltyOptionSet>;
  @Prop({ default: () => [] }) readonly contextOpts: Array<KeyName>;
  @Prop({ default: () => [] }) readonly chartModes: Array<KeyName>;
  @Prop({ default: "synastry" }) readonly type: string;

  buildParents(index: number) {
    return [...this.indices, index];
  }

  renderKey(key: string) {
    if (notEmptyString(key)) {
      const [group, subkey] = key.split("__");
      const keyNames = this.getCategoryOptions(group);
      if (keyNames.length > 0) {
        const row = keyNames.find((r) => r.key === key);
        if (row) {
          return row.name;
        }
      }
      return [group, subkey].join(" ").replace(/_+/g, " ");
    }
  }

  renderContext(key: string) {
    let str = key;
    const row = this.contextOpts.find((a) => a.key === key);
    if (row) {
      str = row.name;
    }
    return str;
  }

  renderMode(key: string) {
    let str = key;
    const row = this.chartModes.find((a) => a.key === key);
    if (row) {
      str = row.name;
    }
    return str;
  }

  getCategoryOptions(group: string) {
    const optGroup = this.allOptions.find(og => og.key === group);
    let opts = [];
    if (optGroup) {
      opts = optGroup.options;
    } else if (this.type === 'kutas' && this.allOptions.length > 0) {
      opts = this.allOptions[0].options;
    }
    return opts;
  }
}
</script>