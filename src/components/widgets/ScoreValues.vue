<template>
  <dl class="score-values">
    <template v-for="(sc, sci) in scores" class="score-rows">
      <dt v-if="sc.value > 0" :key="buildKeyName(sci, 'name')">
        {{ matchName(sc.key) }}
      </dt>
      <dd v-if="sc.value > 0" :key="buildKeyName(sci, 'value')">
        {{ sc.value }}
      </dd>
    </template>
    <dt v-if="hasTotal" class="total">Total</dt>
    <dd v-if="hasTotal" class="total">{{total}}</dd>
  </dl>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { KeyNumValue } from "../../api/interfaces";

@Component({
  name: "ScoreValues",
})
export default class ScoreValues extends Vue {
  @Prop({ default: () => [] }) scores: Array<KeyNumValue>;
  @Prop({ default: "score" }) readonly keyBase: string;

  matchName(key: string) {
    return key.replace(/_+/g, " ");
  }

  buildKeyName(index: number, type = "value") {
    return [this.keyBase, type, index].join("-");
  }

  get total() {
    return this.scores.length > 0? this.scores.map(sc => sc.value).reduce((a,b) => a+b, 0) : -1;
  }

  get hasTotal() {
    return this.scores.length > 0;
  }
}
</script>