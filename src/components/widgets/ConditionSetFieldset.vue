<template>
  <b-field class="condition-set vertical" :class="wrapperClasses">
    <b-select class="operator top-left" v-model="operator">
      <option
        v-for="(opt, oi) in operatorOpts"
        :value="opt.key"
        :key="['condition,operator', opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <b-input
      v-if="showMin"
      type="number"
      class="minimum top-left"
      v-model="min"
      :min="0"
    />
    <div class="condition-selector horizontal row">
      <template
        v-for="(cr, ci) in conditionSet.conditionRefs"
        :allOptions="allOptions"
        :condition="cr"
      >
        <condition-fieldset
          v-if="!cr.isSet"
          :key="['cond-ref', ci].join('-')"
          :allOptions="allOptions"
          :condition="cr"
          :contextOpts="contextOpts"
          :chartModes="chartModes"
          :type="type"
          :parents="buildParents(ci)"
          :secondaryFilterOpts="secondaryFilterOpts"
          :secondaryKeyOpts="secondaryKeyOpts"
        />
        <condition-set-fieldset
          v-if="cr.isSet"
          :key="['cond-ref', ci].join('-')"
          :allOptions="allOptions"
          :conditionSet="cr"
          :contextOpts="contextOpts"
          :chartModes="chartModes"
          :type="type"
          :parents="buildParents(ci)"
          :secondaryFilterOpts="secondaryFilterOpts"
          :secondaryKeyOpts="secondaryKeyOpts"
        />
      </template>
    </div>
    <div class="buttons">
      <b-button @click.prevent.stop="addCondition" icon-left="plus"
        >Add condition</b-button
      >
      <b-button
        @click.prevent.stop="cloneCondition"
        icon-left="plus"
        icon-right="content-copy"
        >Clone condition</b-button
      >
      <b-button @click.prevent.stop="addConditionSet" icon-left="plus"
        >Add subset</b-button
      >
      <b-button
        v-if="isEmpty"
        @click.prevent.stop="removeSet"
        class="remove"
        icon-left="minus"
        >Remove</b-button
      >
    </div>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Condition, ConditionSet } from "@/api/models/Condition";
import {
  KeyName,
  CompatibiltyOptionSet,
  ContextOption,
} from "@/api/interfaces";
import ConditionFieldset from "./ConditionFieldset.vue";
import { bus } from "@/main";
import { deepClone } from "@/api/helpers";

@Component({
  components: {
    ConditionFieldset,
  },
})
export default class ConditionSetFieldset extends Vue {
  @Prop({ default: () => new ConditionSet() })
  readonly conditionSet: ConditionSet;
  @Prop({ default: () => [] }) readonly allOptions: Array<
    CompatibiltyOptionSet
  >;
  @Prop({ default: () => [] }) readonly contextOpts: Array<ContextOption>;
  @Prop({ default: () => [] }) readonly chartModes: Array<KeyName>;
  @Prop({ default: "synastry" }) readonly type: string;
  @Prop({ default: () => [0] }) readonly parents: Array<number>;
  @Prop({ default: () => [] }) readonly secondaryFilterOpts: Array<KeyName>;
  @Prop({ default: () => [] }) readonly secondaryKeyOpts: Array<KeyName>;

  private operator = "and";

  private conditionRefs = [];

  private changing = false;

  private min = 0;

  private max = -1;

  created() {
    this.sync();
    bus.$on("conditions-sync", () => {
      this.sync();
    });
  }

  get logicLabel() {
    return this.operator === "and" ? "All" : "Any";
  }

  get numRefs() {
    return this.conditionSet.conditionRefs.length;
  }

  get operatorOpts() {
    return [
      { key: "and", name: "All" },
      { key: "or", name: "Any" },
      { key: "min", name: "At least" },
    ];
  }

  get isEmpty() {
    return this.conditionRefs.length < 1;
  }

  get showMin() {
    switch (this.operator) {
      case "min":
        return true;
      default:
        return false;
    }
  }

  get showMax() {
    switch (this.operator) {
      case "max":
      case "range":
        return true;
      default:
        return false;
    }
  }

  get index() {
    return this.parents[this.parents.length - 1];
  }

  get wrapperClasses() {
    return [this.operator];
  }

  sync() {
    this.operator = this.conditionSet.operator;
    this.min = this.conditionSet.min;
    this.conditionRefs = this.conditionSet.conditionRefs;
  }

  buildParents(index: number): Array<number> {
    return [...this.parents, index];
  }

  addCondition() {
    if (!this.changing) {
      this.changing = true;
      this.conditionSet.conditionRefs.push(new Condition());
      setTimeout(() => {
        this.changing = false;
      }, 250);
    }
  }

  cloneCondition() {
    if (!this.changing) {
      this.changing = true;
      const conds = this.conditionRefs.filter((cr) => cr.isSet !== true);
      if (conds.length > 0) {
        const cloned = deepClone(conds[conds.length - 1]);
        this.conditionSet.conditionRefs.push(cloned);
      }
      setTimeout(() => {
        this.changing = false;
      }, 250);
    }
  }

  getParentSet(indexed = false) {
    const par = this.$parent.$parent;
    const keys = Object.keys(par.$props);
    if (keys.includes("conditionSet")) {
      const condSet = par.$props.conditionSet;
      if (indexed) {
        if (condSet.conditionRefs[this.index] instanceof ConditionSet) {
          return condSet.conditionRefs[this.index] as ConditionSet;
        } else {
          return condSet;
        }
      }
    } else {
      const dataKeys = Object.keys(this.$parent.$data);
      if (dataKeys.includes("ruleSet")) {
        return this.$parent.$data.ruleSet.conditionSet;
      }
    }
  }

  removeSet() {
    const condSet = this.getParentSet();
    if (condSet instanceof ConditionSet) {
      if (this.index >= 0 && this.index < condSet.conditionRefs.length) {
        condSet.conditionRefs.splice(this.index, 1);
      }
    }
  }

  addConditionSet() {
    if (!this.changing) {
      this.changing = true;
      this.conditionSet.conditionRefs.push(new ConditionSet());
      setTimeout(() => {
        this.changing = false;
      }, 250);
    }
  }

  @Watch("min")
  changeMin() {
    const condSet = this.getParentSet(true);
    if (condSet instanceof ConditionSet) {
      condSet.min = this.min;
    } else {
      this.conditionSet.min = this.min;
    }
  }

  @Watch("operator")
  changeOperator(newVal) {
    const condSet = this.getParentSet(true);
    if (condSet instanceof ConditionSet) {
      condSet.operator = newVal;
    } else {
      this.conditionSet.operator = newVal;
    }
    switch (newVal) {
      case "min":
        break;
      default:
        this.min = 0;
        break;
    }
  }
}
</script>
