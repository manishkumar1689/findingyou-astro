<template>
  <GridItem class="listing" :index="paneIndex" :chart="chart">
    <h4 class="small">{{ title }}</h4>
    <div class="sphuta-data widget">
      <div class="inner">
        <MixedValues :values="lagnas" :seconds="true" />
        <MixedValues :values="upagrahaValues" :seconds="true" />
        <MixedValues :values="firstValues" :seconds="true" />
        <MixedValues :values="secondValues" :seconds="true" />
      </div>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import MixedValues from "../widgets/MixedValues.vue";
import { NameValue } from "../../api/interfaces";
import { Chart } from "../../api/models/Chart";
import lagnaValues from "../../api/mappings/lagna-values";
import sphutaValues from "../../api/mappings/sphuta-values";
import { DictionaryState, SettingState } from "../../store/types";
import GridItem from "../widgets/GridItem.vue";
import { setWidgetOption, syncOptions } from "../../store/local";
import { isNumeric } from "../../api/validators";
import { calcSphutaData } from "../../api/sphuta-helpers";
import { deepClone } from "../../api/helpers";

@Component({
  components: {
    MixedValues,
    GridItem,
  },
})
export default class LagnaSphutaSet extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @State("settings") settings: SettingState;
  @State("dictionary") dictionary: DictionaryState;
  @Prop({ default: "" }) context: string;
  @Prop({ default: 0 }) paneIndex: number;

  vargaNum = 1;

  private ch: Chart;

  private switching = false;

  mounted() {
    syncOptions(this, this.context, "LagnaSphutaSet", this.paneIndex);
  }

  created() {
    this.ch = deepClone(this.chart);
    syncOptions(this, this.context, "LagnaSphutaSet", this.paneIndex);
  }

  get title() {
    return [
      this.dictionary.text("lagna", 0),
      ", ",
      this.dictionary.text("graha", "chaya_0"),
      " & ",
      this.dictionary.text("sphuta", 0),
    ].join("");
  }
  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  getAllSphutas() {
    const allSphutas = calcSphutaData(
      this.chart,
      this.ayanamsha,
      this.vargaNum
    );
    //return this.ch.getSphutaValues(this.ayanamsha.num);
    return allSphutas;
  }

  get lagnas(): Array<NameValue> {
    let items: Array<NameValue> = [];
    if (this.ch instanceof Chart) {
      items = lagnaValues.map((row) => {
        const { key, num } = row;
        const item = this.getAllSphutas().find((s) => s.key === key);
        let value = 0;
        const name = this.dictionary.text("lagna", num);
        if (item) {
          value = item.value;
        }
        return {
          key,
          name,
          value,
          format: "signDeg",
        };
      });
    }
    return items;
  }

  get values(): Array<NameValue> {
    let items: Array<NameValue> = [];
    if (!this.switching && this.ch instanceof Chart) {
      const objects = this.ch.getObjects(this.ayanamsha.num);
      items = sphutaValues.map((row) => {
        let format = "grahaIconClass";
        const { key, num, dict } = row;
        let item: any = null;
        let value = "";
        let name = "";
        if (row.type === "lng") {
          item = this.getAllSphutas().find((s) => s.key === key);
          format = "signDeg";
          name = this.dictionary.text(row.dict, row.num);
        } else {
          item = objects.find((s) => s.key === key);
          const [category, subkey] = row.dict.split("__");
          name = this.dictionary.text(category, subkey);
        }
        if (item) {
          value = item.value;
        }
        return {
          key,
          name,
          value,
          format,
        };
      });
    }
    return items;
  }

  get splitIndex() {
    return this.values.findIndex((item) => item.key === "brghuBindu") + 1;
  }

  get firstValues() {
    return this.values.slice(0, this.splitIndex);
  }

  get secondValues() {
    return this.values.slice(this.splitIndex, this.values.length);
  }

  get upagrahaValues() {
    this.ch.setAyanamshaItem(this.ayanamsha);
    return this.ch.upagrahaValues.map((ug) => {
      const { value, key, num } = ug;
      const name = this.dictionary.text("graha", "chaya_upagraha_" + ug.num);
      return {
        key,
        name,
        value,
        format: "signDeg",
      };
    });
  }

  triggerSwitch() {
    this.switching = true;
    setTimeout(() => {
      this.switching = false;
    }, 25);
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      const num = parseInt(newVal);
      this.triggerSwitch();
      this.ch.setVarga(num);
      this.ch.bodies.forEach((gr) => {
        gr.setVarga(num);
      });
      setWidgetOption(
        this.context,
        "LagnaSphutaSet",
        this.paneIndex,
        "vargaNum",
        newVal
      );
    }
  }
}
</script>
