<template>
  <b-field v-if="!changing" class="condition-selector horizontal row" :class="wrapperClasses">
    <b-icon
      size="is-medium"
      :icon="trueIcon"
      @click.native="toggleTrue"
      :type="trueType"
      class="true-toggle"
      :title="trueToggleTitle"
    />
    <div v-if="comparativeMode" class="control dual-switch single-mode" :class="singleModeClasses" :style="orderStyle('singleMode')">
      <span class="control-label on">S</span>
      <b-switch v-model="singleMode" size="is-medium" type="is-primary" passive-type="is-success">P</b-switch
      >
    </div>
    <b-select
      v-if="showFromMode"
      class="dropdown from-mode chart-mode"
      v-model="fromMode"
      :style="orderStyle('fromMode')">
    >
      <option
        v-for="(opt, oi) in chartModeOpts"
        :value="opt.key"
        :key="['from-mode', 1, opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <b-select v-if="showFilterOpts1" class="dropdown group group-1" v-model="groupC1" :style="orderStyle('groupC1')">
      <option
        v-for="(opt, oi) in chartFilterOptions1"
        :value="opt.key"
        :key="['chart-group-opt', 1, opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <div v-if="showVarga1" class="control dual-switch varga-num" :class="vargaNumClasses(1)" :style="orderStyle('c1D9')">
      <span class="control-label on">D9</span>
      <b-switch
        v-model="c1D9"
        size="is-medium"
        type="is-primary"
        passive-type="is-success"
        >D1</b-switch
      >
    </div>
    <b-select v-if="showObject1" class="dropdown key key-1" v-model="c1Key" :style="orderStyle('c1Key')">
      <option
        v-for="(opt, oi) in chartConditionOptions(1)"
        :value="opt.key"
        :key="['chart-key-opt', 2, opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <b-select v-if="showContext" class="dropdown context" :class="contextClass" v-model="context" :style="orderStyle('context')">
      <option
        v-for="(opt, oi) in contextOptions"
        :value="opt.key"
        :key="['context-opt', opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <div
      v-if="showAspectModeSwitch"
      class="control dual-switch aspect-quality"
      :class="aspectQualityClasses"
      :style="orderStyle('aspectQuality')"
    >
      <span class="control-label on">S-</span>
      <b-slider
        :disabled="!showAspectQuality"
        :min="-1"
        :max="1"
        :custom-formatter="applyingTooltip"
        v-model="aspectQualityState"
        size="is-large"
        type="is-info"
        :tooltip-always="showAspectQuality"
      />
      <span class="control-label off">A+</span>
    </div>
    <b-input v-if="showOrb" type="number" step="0.5" v-model="orb" title="Orb" :style="orderStyle('orb')" class="orb" />
    <b-select
      v-if="comparativeMode"
      class="dropdown kuta-strength"
      v-model="kutaStrength"
      :class="kutaStrengthClasses"
      :style="orderStyle('kutaStrength')"
    >
      <option
        v-for="(opt, oi) in kutaStrengthOpts"
        :value="opt.key"
        :key="['kuta-strength', opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <b-select
      v-if="showToMode"
      class="dropdown to-mode chart-mode"
      v-model="toMode"
      :style="orderStyle('toMode')"
    >
      <option
        v-for="(opt, oi) in chartModeOpts2"
        :value="opt.key"
        :key="['to-mode', 2, opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <b-select v-if="showFilterOpts2" class="dropdown group group-2" v-model="groupC2" :style="orderStyle('groupC2')">
      <option
        v-for="(opt, oi) in chartFilterOptions2"
        :value="opt.key"
        :key="['chart-group-opt', 2, opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <div v-if="showSecondaryD9" class="control dual-switch varga-num" :class="vargaNumClasses(2)" :style="orderStyle('c2D9')">
      <span class="control-label on">D9</span>
      <b-switch
        v-model="c2D9"
        size="is-medium"
        type="is-primary"
        passive-type="is-success"
        >D1</b-switch
      >
    </div>
    <div v-if="comparativeMode" class="control dual-switch varga-num" :class="lordshipSwitchClasses" :style="orderStyle('lordRev')">
      <span class="control-label on">LB</span>
      <b-switch
        :disabled="!showLordshipDir"
        v-model="lordRev"
        size="is-medium"
        type="is-primary"
        passive-type="is-success"
        >LA</b-switch
      >
    </div>
    <b-select v-if="showKey2" class="dropdown key key-2" v-model="c2Key" :style="orderStyle('c2Key')">
      <option
        v-for="(opt, oi) in chartConditionOptions(secondConditionNum)"
        :value="opt.key"
        :key="['chart-key-opt', 2, opt.key, oi].join('-')"
        >{{ opt.name }}</option
      >
    </b-select>
    <b-button
      @click.prevent.stop="remove"
      class="remove"
      icon-left="minus"
      :style="orderStyle('remove')"
    ></b-button>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { emptyString, notEmptyString } from "../../api/validators";
import { Condition } from "@/api/models/Condition";
import {
  KeyName,
  CompatibiltyOptionSet,
  ContextOption,
} from "@/api/interfaces";
import { bus } from "@/main";
import { aspectQualities, singleModeOnlyContexts } from "@/api/mappings/compatibility-sets";
import { filterBySignOnly, mayBeAspected} from "@/api/mappings/paired-options";
import { smartCastFloat } from "@/api/converters";
import { moveBefore } from "@/api/helpers";

@Component
export default class ConditionFieldset extends Vue {
  @Prop({ default: () => new Condition() }) readonly condition: Condition;
  @Prop({ default: () => [] }) readonly allOptions: Array<
    CompatibiltyOptionSet
  >;
  @Prop({ default: () => [] }) readonly contextOpts: Array<ContextOption>;
  @Prop({ default: () => [] }) readonly chartModes: Array<KeyName>;
  @Prop({ default: "synastry" }) readonly type: string;
  @Prop({ default: () => [0] }) readonly parents: Array<number>;
  @Prop({ default: () => [] }) readonly secondaryFilterOpts: Array<KeyName>;
  @Prop({ default: () => [] }) readonly secondaryKeyOpts: Array<KeyName>;

  private isTrue = true;
  private singleMode = false;
  private groupC1 = "";
  private groupC2 = "";
  private fromMode = "";
  private prevFromMode = "";
  private toMode = "";
  private c1Key = "";
  private c2Key = "";
  private c1D9 = false;
  private c2D9 = false;
  //private c1LordRev = false;
  private lordRev = false;
  private context = "";
  private kutaStrength = "0,0";
  private kutaRange = [-1, -1];
  private aspectQuality = "";
  private aspectQualityState = 0;
  private changing = false;
  private kutaStrengthSteps = [0, 25, 50, 75, 100];
  private orb = -1;

  created() {
    this.sync();
  }

  sync() {
    this.isTrue = this.condition.isTrue;
    this.c1Key = this.condition.c1Key;
    this.c2Key = this.condition.c2Key;
    this.context = this.condition.context;
    this.aspectQuality = this.condition.aspectQuality;
    this.aspectQualityState = this.matchAspectQuality();
    this.fromMode = this.condition.fromMode;
    this.singleMode = this.fromMode === "single";
    this.prevFromMode = this.singleMode ? "" : this.fromMode;
    this.toMode = this.condition.toMode;
    this.c1D9 = this.condition.varga1 > 1;
    this.c2D9 = this.condition.varga2 > 1;
    this.orb = this.condition.orb >= 0 ? this.condition.orb : -1;
    this.lordRev = this.condition.lordRev;
    if (
      this.condition.kutaRange instanceof Array &&
      this.condition.kutaRange.length === 2
    ) {
      this.kutaStrength = this.condition.kutaRange.join(",");
    }
    if (this.chartFilterOptions1.length === 2) {
      this.groupC1 = this.chartFilterOptions1[1].key;
    } else if (notEmptyString(this.c1Key, 2)) {
      this.groupC1 = this.assignGroupKey(1);
    }
    if (!this.useSecondaryFilter) {
      if (this.chartFilterOptions2.length === 2) {
        this.groupC2 = this.chartFilterOptions2[1].key;
      } else if (notEmptyString(this.c2Key, 2)) {
        this.groupC2 = this.assignGroupKey(2);
      }
    } else {
      this.groupC2 = this.toMode;
    }
    if (this.contextOpts.length  < 2) {
      this.context = this.contextOpts.length > 0? this.contextOpts[0].key : 'standard';
    }
    switch (this.type) {
      case "shula":
        this.groupC2 = "graha";
        this.c2Key = "su";
        this.fromMode = "birth";
        this.toMode = "transit";
        break;
      case "caughadia":
        this.fromMode = "caughadia";
        this.toMode = "birth";
        this.groupC2 = "caughadia";
        this.c2Key = "context";
        break;
    }
  }

  assignGroupKey(num = 1) {
    const cKey = num === 1 ? this.c1Key : this.c2Key;
    let groupKey = cKey.split("__").shift();
    if (groupKey === 'graha') {
      const opts = num === 1 ? this.chartFilterOptions1 : this.chartFilterOptions2;
      const groupRow = opts.find(op => op.key.endsWith('graha'));
      if (groupRow instanceof Object) {
        groupKey = groupRow.key;
      }
    } 
    return groupKey;
  }

  orderStyle(key = "") {
    const order = this.controlOrder.indexOf(key) + 1;
    return { order };
  }

  get controlOrder() {
    let controlKeys = [
      'singleMode',
      'fromMode',
      'groupC1',
      'c1D9',
      'c1Key',
      'context',
      'aspectQuality',
      'orb',
      'kutaStrength',
      'toMode',
      'groupC2',
      'c2D9',
      'lordRev',
      'c2Key',
      'remove'
    ];
    if (this.c1D9Before.length > 2) {
      controlKeys = moveBefore(controlKeys, 'c1D9', this.c1D9Before);
    }
    if (this.toModeBefore.length > 2) {
      controlKeys = moveBefore(controlKeys, 'toMode', this.toModeBefore);
    }
    return controlKeys;
  }

  get toModeBefore() {
    return this.singleMode? 'groupC1' : '-';
  }

  get c1D9Before() {
    switch (this.type) {
      case "sarvatobhadra":
        return 'groupC2';
      case "kota":
      case "chandra_kalanala":
        return 'context';
      default:
        return '-';
    }
  }

  get contextClass() {
    switch (this.type) {
      case "transit":
      case "predictive":
      case "kota":
      case "shula":
      case "sarvatobhadra":
      case "chandra_kalanala":
        return 'wide';
      default:
        return 'narrow';
    }
  }

  matchAspectQuality() {
    switch (this.aspectQuality) {
      case "applying":
        return -1;
      case "separating":
        return 1;
      default:
        return 0;
    }
  }

  chartConditionOptions(chartNum: number): Array<KeyName> {
    return chartNum > 1 && this.secondaryKeyOpts.length > 1? this.secondaryKeyOpts : this.matchChartConditionOptions(chartNum);
  }

  matchChartConditionOptions(chartNum: number): Array<KeyName> {
    const groupKey = chartNum < 2 ? this.groupC1 : this.groupC2;
    const matched = this.allOptions.find((os) => os.key === groupKey);
    return matched instanceof Object
      ? [this.objectPrompt, ...matched.options.filter(op => this.filterByFrom(op.key))]
      : [this.objectPrompt];
  }

  filterByFrom(key: string) {
    if (this.groupC1 === "predictivegraha") {
      if (this.fromMode.startsWith("level")) {
        const [start, end] = key.split("__").pop();
        return start !== 'graha' || ["sa", "ju", "ma", "su", "ve", "me", "mo", "ra", "ke"].includes(end);
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  get wrapperClasses() {
    const cls = [this.singleMode ? "single" : "double"];
    if (!this.showKey2 && !this.showVarga1) {
      cls.push('wide-controls');
    }
    cls.push(this.type.replace(/_/g,'-'));
    cls.push(this.groupC1.replace(/_/g,'-'));
    return cls;
  }

  get chartOptSets() {
    return this.allOptions;
  }

  get chartTypePrompt() {
    const cts = this.chartModes.filter(cm => cm.key === "");
    return cts.length > 0? cts[0] : { key: "", name: "Chart type..." };
  }

  get chartModeOpts() {
    return [this.chartTypePrompt, ...this.chartModes.filter((cm) => cm.double && notEmptyString(cm.key, 2))];
  }

  get chartModeOpts2() {
    if (this.context === "in_sign") {
      return this.chartModes.filter(cm => cm.key.endsWith("signs"))
    } else {
      return [
      this.chartTypePrompt,
        ...this.chartModes.filter((cm) =>
          this.singleMode ? cm.single : cm.double
        ),
      ];
    }
  }

  get trueIcon() {
    return this.isTrue ? "plus-circle" : "minus-circle";
  }

  get trueType() {
    return this.isTrue ? "is-success" : "is-danger";
  }

  get trueToggleTitle() {
    return this.isTrue ? "Negate condition" : "Make positive";
  }

  get objectPrompt() {
    return { key: "", name: "Object...", charts: [] };
  }

  get objectTypePrompt() {
    return { key: "", name: "Object type...", charts: [] };
  }

  get contextPrompt() {
    return { key: "", name: "Context...", charts: [] };
  }

  get showKutaStrengths() {
    return this.groupC1 === "kutas";
  }

  get showObject1() {
    switch (this.fromMode) {
      case "birth_asc":
        return false;
      default:
        return true;
    }
  }

  get showVarga1() {
    switch (this.type) {
      case "panchapakshi":
      case "caughadia":
      case "transit":
      case "sarvatobhadra":
      case "shula":
      case "chandra_kalanala":
        return false;
      default:
        return this.showObject1
    }
  }

  get isAspect() {
    const ctx = this.contextOptions.find(co => co.key === this.context);
    return ctx instanceof Object ? ctx.isAspect : false
  }

   get showOrb() {
    switch (this.type) {
      case "panchapakshi":
      case "caughadia":
      case "transit":
      case "sarvatobhadra":
      case "shula":
      case "chandra_kalanala":
        return this.isAspect;
      default:
        return false;
    }
  }

  get showContext() {
    return this.showObject1 && this.contextOptions.filter(op => op.key.length > 1).length > 1;
  }

  get hasDashaType1() {
    return this.fromMode.startsWith("level_");
  }

  get showKey2() {
    switch (this.type) {
      case "chandra_kalanala":
      case "shula":
      case "panchapakshi":
        return false;
      default:
        switch (this.context) {
          case "shubha_kartari_yoga":
          case "papa_kartari_yoga":
          case "funcbm_shubha_kartari_yoga":
          case "funcbm_papa_kartari_yoga":
            return false;
          default:
            return true;
        }
    }
  }

  get secondConditionNum() {
    switch (this.type) {
      case "sarvatobhadra":
        return 1;
      default:
        return 2;
    }
  }

  get showSecondaryD9() {
    switch (this.type) {
      case "sarvatobhadra":
      case "kota":
      case "chandra_kalanala":
      case "shula":
      case "panchapakshi":
      case "caughadia":
        return false;
      case "transit":
        return !this.hasDashaType1 && this.showObject1;
      default:
        return true;
    }
  }

  get showAspectModeSwitch() {
    switch (this.type) {
      case "sarvatobhadra":
      case "kota":
      case "chandra_kalanala":
      case "shula":
      case "panchapakshi":
      case "caughadia":
        return false;
      case "transit":
        return !this.hasDashaType1 && this.showObject1;
      default:
        return true;
    }
  }

  get comparativeMode() {
    switch (this.type) {
      case "transit":
      case "kota":
      case "sarvatobhadra":
      case "chandra_kalanala":
      case "shula":
      case "caughadia":
      case "panchapakshi":
        return false;
      default:
        return true;
    }
  }

  get showFilterOpts1() {
    switch (this.type) {
      case "panchapakshi":
        return false;
      default:
        return this.chartFilterOptions1.filter(opt => notEmptyString(opt.key, 2)).length > 1;
    }
  }

  get showToMode() {
    return this.comparativeMode;
  }

  get showFilterOpts2() {
    return this.comparativeMode || this.chartFilterOptions2.length > 1;
  }

  get kutaStrengthOpts() {
    const innerStrengths = this.kutaStrengthSteps.slice(1);
    const opts = innerStrengths.map((end, vi) => {
      const prefix = end < 100 ? "<=" : "<";
      const start = vi === 0 ? 0 : innerStrengths[vi - 1];
      return {
        key: [start, end].join(","),
        name: [prefix, " ", end, "%"].join(""),
      };
    });
    opts.unshift({ key: [0, 0].join(","), name: "0.00%" });
    opts.push({ key: [100, 100].join(","), name: "100.00%" });
    return opts;
  }

  get kutaStrengthClasses() {
    if (this.showKutaStrengths) {
      return ["active"];
    } else {
      return ["inactive"];
    }
  }

  get stateCompareTypes() {
    return ["p_karana", "p_tithi", "p_yoga", "p_vara"];
  }

  get chartFilterOptions1(): any[] {
    return [
      this.objectTypePrompt,
      ...this.chartOptSets.filter(
        (co) => co.charts.includes(1) && this.allowType(co.key) && this.allowFrom(co.key)
      ),
    ];
  }

  allowType(key: string) {
    switch (this.context) {
      case "state_compare":
        return this.stateCompareTypes.includes(key) || emptyString(this.c1Key);
      default:
        return true;
    }
  }

  allowFrom(key: string) {
    switch (key) {
      case "birth_asc":
      case "ascendant":
      case "predictiveascendant":
        return this.fromMode === "birth_asc";
      default:
        return this.fromMode !== "birth_asc";
    }
  }

  get useSecondaryFilter() {
    return this.secondaryFilterOpts.length > 1;
  }

  get chartFilterOptions2(): any[] {
    return this.useSecondaryFilter ? this.secondaryFilterOpts : this.getChartFilterOptions2();
  }

  getChartFilterOptions2(): any[] {
    const skipKeysTypes = ["transit"];
    const contextOpt = this.contextOpts.find((c) => c.key === this.context);
    const c2groups = contextOpt instanceof Object ? contextOpt.c2groups : [];
    
    const opts = this.chartOptSets.filter(
      (co) =>
        co instanceof Object && 
        co.charts.includes(2) &&
        this.filterByContext(co.key) &&
        (!this.signOnly || co.key.endsWith("signs")) &&
        (c2groups.length < 1 || skipKeysTypes.includes(this.type) ||
          c2groups.includes(co.key) ||
          c2groups.includes("all"))
    );

    return opts.length > 1 ? [this.objectTypePrompt, ...opts] : opts;
  }

  filterByContext(key: string) {
    switch (this.type) {
      case 'transit':
        switch (this.context) {
          case "shubha_kartari_yoga":
          case "papa_kartari_yoga":
            return false;
          case "has_dignity":
            return key === "dignities";
          case "in_house":
            return key === "houses";
          case "in_sign":
            return ["predictivesigns", "signs"].includes(key);
          default:
            return ["dignities", "houses"].includes(key) === false;
        }
      default:
        return true;
    }
  }

  get aspectQualities() {
    return aspectQualities;
  }

  get signOnly() {
    return filterBySignOnly(this.c1Key);
  }

  get isPredictive() {
    return ["transit", "predictive"].includes(this.type);
  }

  get hasYamaOpt1() {
    return this.c1Key.includes('yama_') || this.c1Key.includes('day_') || this.c1Key.includes('birth_bird');
  }

  isTransitionContextKey(optKey = '') {
    return ['ic', 'mc', 'ds', 'as', 'rise', 'set', 'dik_bala_transition'].includes(optKey);
  }

  get contextOptions() {
    const isKuta = this.groupC1 === "kutas";
    const showAspects = mayBeAspected(this.c1Key);
    const promptIndex = this.signOnly? -1 : this.contextOpts.findIndex(co => co.key.length < 2);
    //const hasDashaOption = (opt: ContextOption) => Object.keys(opt).includes("isDasha") && opt.isDasha === true;
    // && (this.type !== "transit" || hasDashaOption(opt) === this.hasDashaType1) // extra condition
    const opts = this.contextOpts.filter((opt) => {
      if (opt.key === "has_dignity") {
        return this.fromMode.startsWith("level_");
      } if (this.signOnly) {
        return opt.key === "in_sign";
      } else if (this.type === 'panchapakshi') {
        switch (this.fromMode) {
          case 'panchapakshi':
            return opt.key.startsWith("action_");
          default:
            return !opt.key.startsWith("action_");
        }
      } else {
        return opt.isKuta === isKuta && (!opt.isAspect || showAspects) && (this.singleMode || !singleModeOnlyContexts.includes(opt.key))
      }
    }).filter(op => !this.isPredictive || (op.pIndex >= 0 && (this.hasYamaOpt1 || this.isTransitionContextKey(op.key))));
    if (this.isPredictive) {
      opts.sort((a, b) => a.pIndex - b.pIndex);
    }
    if (promptIndex < 0) {
      opts.unshift({...this.contextPrompt, isKuta: false, c2groups: ["all"], isAspect: false });
    }
    return opts;
  }

  get showAspectQuality() {
    const contextOpt = this.contextOpts.find((ct) => ct.key === this.context);
    if (contextOpt) {
      return contextOpt.isAspect;
    } else {
      return false;
    }
  }

  get showLordshipDir() {
    return this.groupC1 === "lordship";
  }

  get aspectQualityClasses() {
    const cls = [];
    if (this.showAspectQuality) {
      cls.push("active");
      switch (this.aspectQualityState) {
        case -1:
          cls.push("off");
          break;
        case 1:
          cls.push("on");
          break;
        case 0:
          cls.push("neutral");
          break;
      }
    } else {
      cls.push("inactive");
    }
    return cls;
  }

  vargaNumClasses(chartNum = 1) {
    const val = chartNum < 2 ? this.c1D9 : this.c2D9;
    return val === true ? ["on", "d9"] : ["off", "d1"];
  }

  get singleModeClasses() {
    return this.singleMode ? ["on", "single"] : ["off", "paired"];
  }

  get showFromMode() {
    return !this.singleMode && this.chartModeOpts.length > 1;
  }

  get lordshipSwitchClasses() {
    const cls = [];
    if (this.showLordshipDir) {
      cls.push("active");
      if (this.lordRev) {
        cls.push("on", "lb");
      } else {
        cls.push("off", "la");
      }
    } else {
      cls.push("inactive");
    }
    return cls;
  }

  matchFromMode() {
    switch (this.type) {
      case "sarvatobhadra":
      case "kota":
      case "chandra_kalanala":
      case "shula":
        return this.type;
      default:
        return this.fromMode;
    }
  }

  matchToMode() {
    switch (this.type) {
      case "transit":
        return "birth";
      case "sarvatobhadra":
      case "kota":
        return this.groupC2;
      case "chandra_kalanala":
      case "shula":
        return this.context;
      default:
        return this.toMode;
    }
  }

  matchC2Key() {
    switch (this.type) {
      case "chandra_kalanala":
      case "shula":
        return this.c1Key;
      default:
        return this.c2Key;
    }
  }

  pushUpdate() {
    const aspectQuality = this.showAspectQuality ? this.aspectQuality : "";
    const varga1 = this.c1D9 ? 9 : 1;
    const varga2 = this.c2D9 ? 9 : 1;
    const fromMode = this.matchFromMode();
    const toMode = this.matchToMode();
    const c2Key = this.matchC2Key();
    const data = {
      isTrue: this.isTrue,
      fromMode,
      toMode,
      c1Key: this.c1Key,
      c2Key,
      aspectQuality,
      varga1,
      varga2,
      context: this.context,
      orb: this.orb,
      parents: this.parents,
      type: this.type,
      lordRev: this.lordRev,
      kutaRange: this.kutaRange,
    };
    bus.$emit("update-condition", data);
  }

  toggleTrue() {
    this.isTrue = !this.isTrue;
  }

  remove() {
    const par = this.$parent.$parent;
    const keys = Object.keys(par.$props);
    const index = this.parents[this.parents.length - 1];
    if (keys.includes("conditionSet")) {
      const condSet = par.$props.conditionSet;
      if (index >= 0 && index < condSet.conditionRefs.length) {
        condSet.conditionRefs.splice(index, 1);
      }
    }
  }

  applyingTooltip(v) {
    switch (v) {
      case -1:
        return "applying";
      case 0:
        return "neutral";
      case 1:
        return "separating";
      default:
        return "";
    }
  }

  @Watch("singleMode")
  changeSingleMode() {
    if (this.singleMode) {
      if (this.prevFromMode.length > 2 && this.prevFromMode !== "single") {
        this.toMode = this.prevFromMode;
      }
      this.fromMode = "single";
    } else {
      this.fromMode = this.prevFromMode;
      if (this.fromMode === this.toMode) {
        this.toMode = this.fromMode === "male" ? "female" : "male";
      }
    }
  }

  @Watch("aspectQualityState")
  changeAspectQualityState() {
    if (this.showAspectQuality) {
      switch (this.aspectQualityState) {
        case -1:
          this.aspectQuality = "applying";
          break;
        case 1:
          this.aspectQuality = "separating";
          break;
        case 0:
          this.aspectQuality = "neutral";
          break;
      }
    } else {
      this.aspectQuality = "";
    }
    this.pushUpdate();
  }

  @Watch("groupC1")
  changeGroupC1() {
    switch (this.groupC1) {
      case "kutas":
        if (emptyString(this.groupC2, 2)) {
          this.groupC2 = "kutas";
        }
        break;
      case "predictiveascendant":
        this.c1Key = "predictiveascendant__birth_asc";
        this.context = "in_sign";
        this.groupC2 = "predictivesigns";
        break;
    }
    if (this.stateCompareTypes.includes(this.groupC1)) {
      this.groupC2 = this.groupC1;
      this.context = "state_compare";
    }
  }

  @Watch("groupC2")
  changeGroupC2() {
    if (this.stateCompareTypes.includes(this.groupC2)) {
      this.groupC1 = this.groupC2;
      this.context = "state_compare";
    }
    this.pushUpdate();
  }

  @Watch("fromMode")
  changeFromMode(newVal, prevVal) {
    if (newVal !== prevVal) {
      if (prevVal !== "single" && notEmptyString(prevVal, 2)) {
        this.prevFromMode = prevVal;
      }
      if (emptyString(this.toMode, 2) && this.fromMode !== "single") {
        switch (this.fromMode) {
          case "female":
            this.toMode = "male";
            break;
          case "male":
            this.toMode = "female";
            break;
        }
      }
      if (newVal.endsWith("birth_asc")) {
        this.c1Key = "predictiveascendant__birth_asc";
        this.context = "in_sign";
        this.groupC2 = "predictivesigns";
      }
      if (newVal.endsWith("panchapakshi")) {
        this.groupC2 = "panchapakshi";
      }
      if (this.type === "panchapakshi") {
        if (newVal.endsWith("transit") || newVal.endsWith("birth")) {
          this.groupC1 = "panchapakshitransit";          
        } else {
          this.groupC1 = "panchapakshi";
        }
        this.toMode = "birth";
        this.c2Key = "context";
      }
      if (newVal.endsWith("caughadia") && this.type === "caughadia") {
        this.groupC1 = "caughadia";
        this.c2Key = "context";
        this.toMode = "birth";
      }
      this.pushUpdate();
    }
  }

  @Watch("kutaStrength")
  changeKutaStrength() {
    this.kutaRange = this.kutaStrength.split(",").map(smartCastFloat);
    this.pushUpdate();
  }

  @Watch("toMode")
  changeToMode() {
    this.pushUpdate();
  }

  @Watch("c1D9")
  changeC1D9() {
    this.condition.varga1 = this.c1D9 ? 9 : 1;
    this.pushUpdate();
  }

  @Watch("c2D9")
  changeC2D9() {
    this.condition.varga2 = this.c2D9 ? 9 : 1;
    this.pushUpdate();
  }

  @Watch("lordRev")
  changeLordRev() {
    this.pushUpdate();
  }

  @Watch("isTrue")
  changeIsTrue() {
    this.pushUpdate();
  }

  @Watch("c1Key")
  changeC1Key() {
    this.pushUpdate();
  }

  @Watch("c2Key")
  changeC2Key() {
    this.pushUpdate();
  }

  @Watch("orb")
  changeOrb() {
    this.orb = smartCastFloat(this.orb);
    this.pushUpdate();
  }

  @Watch("context")
  changeContext() {
    if (!this.showAspectQuality) {
      this.aspectQualityState = 0;
      this.aspectQuality = "";
    }
    
    switch (this.context) {
      case "in_house":
      case "house":
        this.groupC2 = "houses";
        break;
      case "in_sign":
      case "sign":
        this.groupC2 = this.isPredictive? "predictivesigns" : "signs";
        break;
      case "nakshatra":
      case "in_nakshatra":
        this.groupC2 = "nakshatras";
        break;
      case "has_dignity":
        this.groupC2 = "dignities";
        break;
    }
    this.pushUpdate();
    setTimeout(() => {
      if (this.chartFilterOptions2.length === 1) {
        this.groupC2 = this.chartFilterOptions2[0].key;
      }
    }, 250)
  }

  @Watch("type")
  changeType() {
    this.changing = true;
    this.sync();
    setTimeout(this.sync, 250);
    setTimeout(() => {
      this.changing = false;
    }, 500);
  }

}
</script>