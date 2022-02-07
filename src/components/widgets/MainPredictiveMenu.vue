<template>
  <div class="widget-menu predictive-menu widget flip-side">
    <ul v-if="menuItems.length > 0" class="widget-menu">
      <li v-for="(cat, ci) in menuItems" :key="cat.itemKey" :class="catClasses(ci)">
        <div class="label" @click="expand(ci)">{{ cat.name }}</div>
        <ol v-if="cat.widgets.length > 0">
          <li>
            <b-select
                title="Varga"
                v-model="vargas[ci]"
                class="varga-selector"
              >
              <option
                v-for="vo in vargaOptions"
                :value="vo.key"
                :key="['varga-key', vo.key, ci].join('-')"
              >{{ vo.name }}</option>
            </b-select>
          </li>
          <li v-for="(opt, oi) in cat.widgets" :key="opt.itemKey" class="widget-item" :class="itemClasses(ci, oi)">
            <b-radio v-model="components[ci]" :disabled="!opt.enabled" :native-value="opt.component">{{ opt.title }}</b-radio>
          </li>
        </ol>
      </li>
    </ul>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import vargaValues from "../../api/mappings/varga-values";
import { bus } from "../../main";
import { DictionaryState } from "../../store/types";
import { PredictiveOption } from "@/api/interfaces";
import { matchMainPredictiveSettings, predictiveMenuItems } from "@/store/local";

@Component
export default class MainPredictiveMenu extends Vue {
  @Prop({ default: 0 }) index: number;
  @Prop({ default: "" }) context: string;
  @State("dictionary") dictionary: DictionaryState;

  private vargas: number[] = [1, 1, 1];

  private components: string[] = ["Birth", "Transit", "SingleChart"];
  
  private expanded = 2;

  created() {
    setTimeout(this.syncSettings, 500);
  }

  syncSettings() {
    const { vargas, components, settings } = matchMainPredictiveSettings(this.context, this.index);
    bus.$emit('predictive-main', settings);
    this.vargas = vargas;
    this.components = components;
    this.$set(this.$parent.$parent, "vargaNum", settings.widget.varga);
  }

  saveSetting() {
    const settingMap: Map<string, PredictiveOption> = new Map();
    this.menuItems.forEach((row, rowIndex) => {
      const varga = this.vargas[rowIndex];
      const component = this.components[rowIndex];
      settingMap.set(row.key, {varga, component});
    });
    const settings = Object.fromEntries(settingMap.entries());
    this.$ls.set('predictive-main-widget', settings);
    bus.$emit('predictive-main', settings);
    this.$set(this.$parent.$parent, "vargaNum", settings.widget.varga);
    
  }

  catClasses(index: number) {
    const cls = [this.expanded === index ? "expanded" : "contracted"];
    return cls;
  }

  itemClasses(catIndex: number, index: number) {
    const cls = [['index', catIndex, index].join('-')];
    return cls;
  }

  get menuItems() {
    return predictiveMenuItems(this.context, this.index);
  }

  get id() {
    return ["menu", this.index, Math.floor(Math.random() * 512)].join("-");
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

  expand(index: number) {
    this.expanded = this.isExpanded(index) ? -1 : index;
  }

  contract() {
    this.expanded = -1;
  }

  isExpanded(index: number) {
    return this.expanded === index;
  }

  selectSubComponent(index = 0, component = "" ) {
    if (index >= 0 && index < this.components.length) {
      this.components[index] = component;
    }
  }

  @Watch('components')
  changeComponents() {
    this.saveSetting();
  }

  @Watch('vargas')
  changeVargas() {
    this.saveSetting();
  }

  get isDouble() {
    const { mode } = this.$parent.$parent.$props;
    switch (mode) {
      case "single":
        return this.context === "p3";
      default:
        return false;
    }
  }
}
</script>
