<template>
  <div class="widget-options widget flip-side">
    <b-select v-if="vargaOptions.length > 0" placeholder="Varga" v-model="vargaNum">
      <option
        v-for="opt in vargaOptions"
        :value="opt.key"
        :key="['varga-key', opt.key, id].join('-')"
      >{{ opt.name }}</option>
    </b-select>
    <b-switch v-if="hasChalitBhava" v-model="chalitBhava">Chalit Bhava</b-switch>
    <b-field v-if="hasSingleMode" title="Chart" class="vertical">
      <b-radio v-model="singleMode" :native-value="1" type="is-danger">{{getLabel(1)}}</b-radio>
      <b-radio v-model="singleMode" :native-value="2" type="is-success">{{getLabel(2)}}</b-radio>
      <b-radio v-if="showSingleCompositeMode" v-model="singleMode" :native-value="3" type="is-success">Midpoint</b-radio>
      <b-radio v-if="showSingleCompositeMode" v-model="singleMode" :native-value="4" type="is-success">Timespace</b-radio>
    </b-field>
    <b-field v-if="hasMidMode" title="Chart" class="vertical">
      <b-radio v-if="showMidModeNone" v-model="midMode" native-value="" type="is-light">None</b-radio>
      <b-radio v-model="midMode" native-value="midpoint" type="is-danger">Midpoint</b-radio>
      <b-radio v-model="midMode" native-value="timespace" type="is-info">Timespace</b-radio>
    </b-field>

    <b-field v-if="showTimespaceMode" title="Chart" class="vertical">
      <b-radio v-model="timespaceMode" native-value="median" type="is-info">Average Lat/Long</b-radio>
      <b-radio v-model="timespaceMode" native-value="surface" type="is-success">Shortest distance</b-radio>
    </b-field>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import vargaValues from "../../api/mappings/varga-values";
import { bus } from '../../main';

@Component
export default class WidgetOptions extends Vue {
  @Prop({ default: 0 }) index: number;

  private vargaNum = 1;

  private singleMode = 1;

  private midMode = 'midpoint';

  private timespaceMode = 'median';

  private chalitBhava = false;

  private hasChalitBhava = false;

  created() {
    setTimeout(() => {
      const { vargaNum, singleMode, chalitBhava } = this.$parent.$parent.$data;
      if (vargaNum) {
        this.vargaNum = vargaNum;
      }
      if (singleMode) {
        this.singleMode = singleMode;
      }
      if (chalitBhava === true || chalitBhava === false) {
        this.chalitBhava = chalitBhava;
        this.hasChalitBhava = true;
      }
      
    }, 500);
    bus.$on("manage-widgets", ({ name, context, index, vargaNum, chalitBhava }) => {
      if (this.parentContext === context && index === this.index) {
        this.vargaNum = vargaNum;
        this.chalitBhava = chalitBhava === true;
      }
    });
  }

  get parentContext() {
    const {context} = this.$parent.$parent.$props;
    return context;
  }

  get id() {
    return ["settings", this.index, Math.floor(Math.random() * 512)].join("-");
  }

  get hasSingleMode() {
    const keys = Object.keys(this.$parent.$parent.$data);
    return this.isDouble && keys.includes("singleMode");
  }
  
  get hasMidMode() {
    const keys = Object.keys(this.$parent.$parent.$data);
    return this.isComposite && keys.includes("midMode");
  }

  get showSingleCompositeMode() {
    const keys = Object.keys(this.$parent.$parent.$data);
    return this.isComposite && keys.includes("singleComposite");
  }

  get showMidModeNone() {
    const keys = Object.keys(this.$parent.$parent.$data);
    return keys.includes("midModeNone");
  }

  get showTimespaceMode() {
    if (this.hasMidMode) {
      const keys = Object.keys(this.$parent.$parent.$data);
      return keys.includes("timespaceMode") && this.midMode === 'timespace';
    } else {
      return false;
    }
  }

  get isDouble() {
    const { mode, context } = this.$parent.$parent.$props;
    switch (mode) {
      case "double":
      case "midpoint_outer":
        return true;
      default:
        return ["p3"].includes(context);
    }
  }

  get isComposite() {
    const { mode, context } = this.$parent.$parent.$props;
    switch (mode) {
      case "midpoint_outer":
      case "midpoint":
        return true;
      default:
        //return context === 'p3';
        return false;
    }
  }

  get vargaOptions() {
    return vargaValues
      .filter(item => item.num <= 60)
      .map(item => {
        const { key, num } = item;
        return {
          key: num,
          name: key.toUpperCase()
        };
      });
  }

  getLabel(set = 1) {
    const { chart, chart2 } = this.$parent.$props;
    const parts = [set];
    const c = set === 2 ? chart2 : chart;
    if (c) {
      parts.push(c.mediumName);
    }
    return parts.join(": ");
  }

  @Watch("vargaNum")
  changeVargaNum(newVal) {
    this.$set(this.$parent.$parent, "vargaNum", newVal);
  }

  @Watch("singleMode")
  changeSingleMode(newVal) {
    this.$set(this.$parent.$parent, "singleMode", newVal);
  }

  @Watch("midMode")
  changeMidMode(newVal) {
    this.$set(this.$parent.$parent, "midMode", newVal);
  }

  @Watch("timespaceMode")
  changeTimespaceMode(newVal) {
    this.$set(this.$parent.$parent, "timespaceMode", newVal);
  }

  @Watch("chalitBhava")
  changeChalitBhava(newVal) {
    this.$set(this.$parent.$parent, "chalitBhava", newVal);
  }
}
</script>
