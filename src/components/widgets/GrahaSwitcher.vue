<template>
  <div class="graha-switcher" :class="classNames">
    <b-field
      v-for="item in grahaItems"
      :key="['gr-item', index, context, chartNum, item.key].join('-')"
      :class="item.classNames"
    >
      <template v-if="multi">
        <b-checkbox
          :name="[chartNum, index, context, item.key].join('_')"
          v-model="selKeys"
          :native-value="item.key"
        >
          <template v-if="item.hasSymbol">
            <span class="icon symbol" :class="item.key | toGrahaClass"></span>
          </template>
          <template v-else>{{ item.short }}</template>
        </b-checkbox>
      </template>
      <template v-else>
        <b-radio
          :name="[chartNum, index, context].join('_')"
          v-model="selected"
          :native-value="item.key"
        >
          <template v-if="item.hasSymbol">
            <span class="icon symbol" :class="item.key | toGrahaClass"></span>
          </template>
          <template v-else>{{ item.short }}</template>
        </b-radio>
      </template>
    </b-field>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import grahaValues from "../../api/mappings/graha-values";
import { DictionaryState } from "../../store/types";
import { FilterSet } from "../../api/composables/FilterSet";

@Component({
  filters: FilterSet
})
export default class GrahaSwitcher extends Vue {
  @Prop({ default: 0 }) keys: Array<string>;
  @Prop({ default: 1 }) chartNum: number;
  @Prop({ default: false }) multi: boolean;
  @Prop({ default: "su" }) selectedKey: string;
  @Prop({ default: () => [] }) selectedKeys: Array<string>;
  @Prop({ default: 0 }) index: number;
  @Prop({ default: "tab_1" }) context: string;
  @State("dictionary") dictionary: DictionaryState;

  private selected = "su";

  private selKeys = [];

  mounted() {
    this.selected = this.selectedKey;
    this.selKeys = this.selectedKeys;
  }

  get classNames(): Array<string> {
    const cls = [
      ["chart", this.chartNum].join("-"),
      ["selected", this.selectedKey].join("-")
    ];
    if (this.multi) {
      cls.push("multiple");
    }
    return cls;
  }

  get grahaItems() {
    const grahas = this.keys
      .map(key => {
        return grahaValues.find(gr => gr.key === key);
      })
      .filter(gr => gr instanceof Object);
    const asc = {
      num: 300,
      jyNum: 301,
      subkey: "bhava__asc",
      key: "as",
      title: "Ascendant"
    };
    const dsc = {
      num: 301,
      jyNum: 302,
      subkey: "bhava__dsc",
      key: "ds",
      title: "Descendant"
    };
    return [...grahas, asc, dsc].map((item: any) => {
      const [cat, sub] = item.subkey.split("__");
      const category = typeof sub === "string" ? cat : "graha";
      const subkey = category !== "graha" ? sub : item.subkey;
      const lex = this.dictionary.lexeme(category, subkey);
      const title = lex instanceof Object ? lex.text("en") : item.title;
      const hasSymbol = category === "graha";
      const short = hasSymbol ? item.key : item.key + "c";
      const classNames = [item.key, hasSymbol? 'symbol' : 'text'];
      return { ...item, title, hasSymbol, short, classNames };
    });
  }

  @Watch("selected")
  changeSelected(newVal) {
    const par = this.$parent.$parent.$parent.$parent;
    const keys = Object.keys(par.$data);
    if (this.chartNum === 1) {
      if (keys.includes("c1Key")) {
        this.$set(par, "c1Key", newVal);
      }
    } else if (this.chartNum === 2) {
      if (keys.includes("c2Key")) {
        this.$set(par, "c2Key", newVal);
      }
    }
  }

  @Watch("selKeys")
  changeSelKeys(newVal) {
    const par = this.$parent.$parent.$parent.$parent;
    const keys = Object.keys(par.$data);
    if (keys.includes("pairKeys")) {
      this.$set(par, "pairKeys", newVal);
    }
  }
}
</script>
