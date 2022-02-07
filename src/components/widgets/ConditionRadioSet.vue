<template>
  <b-field v-if="show">
    <b-radio
      v-for="(opt, index) in radioOptions"
      :key="renderKey(opt.key, index)"
      :name="name"
      v-model="value"
      :native-value="opt.key"
      >{{ opt.name }}
    </b-radio>
  </b-field>
</template>
<script lang="ts">
import { bus } from "@/main";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { KeyName } from "../../api/interfaces";

@Component({
  name: "ConditionRadioSet",
})
export default class ConditionRadioSet extends Vue {
  @Prop({ default: () => [] }) radioOptions: Array<KeyName>;
  @Prop({ default: 1 }) chartNum: number;
  @Prop({ default: "" }) readonly name: string;
  @Prop({ default: false }) readonly show: boolean;

  private value = "";

  private initialised = false;

  mounted() {
    setTimeout(this.sync, 500);
    bus.$on("switch-condition", () => {
      this.sync();
    });
  }

  sync() {
    const keys = Object.keys(this.$parent.$data);
    if (keys.includes(this.modelKey)) {
      this.value = this.$parent.$data[this.modelKey];
      setTimeout(() => {
        this.initialised = true;
      }, 250);
    }
  }

  get keyBase(): string {
    return [this.name, "set", this.chartNum].join("-");
  }

  get modelKey(): string {
    return `c${this.chartNum}Key`;
  }

  renderKey(optKey: string, index = 0) {
    return [this.keyBase, index, optKey].join("-");
  }

  @Watch("value")
  changeValue() {
    if (this.initialised) {
      const keys = Object.keys(this.$parent.$data);
      if (keys.includes(this.modelKey)) {
        this.$parent.$data[this.modelKey] = this.value;
      }
    }
  }
}
</script>