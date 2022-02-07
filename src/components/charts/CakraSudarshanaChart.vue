<template>
  <grid-item class="cakra-sudarshana" :index="paneIndex" :chart="chart">
    <h4>{{ this.title }}</h4>
    <div class="cakra-sudarshana-chart widget">
      <section class="chart" :class="wrapperClasses" ref="chart">
        <CakraSudarshanaRing :signSets="lagnaSigns()" :grahas="lagnaRingGrahas()" type="lagna" />
        <CakraSudarshanaRing :signSets="moonSigns()" :grahas="moonRingGrahas()" type="moon" />
        <CakraSudarshanaRing :signSets="sunSigns()" :grahas="sunRingGrahas()" type="sun" />
      </section>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import CakraSudarshanaRing from "../widgets/CakraSudarshanaRing.vue";
import { subtractLng360 } from "../../api/converters";
import { Graha } from "../../api/models/Graha";
import {
  SignValue,
  SignSet,
  GrahaStyle
} from "../../api/interfaces";
import { FilterSet } from "../../api/composables/FilterSet";
import { DictionaryState, SettingState } from "../../store/types";
import {
  plotOnCircle,
  renderOffsetStyle,
  toSignValues,
  deepClone
} from "../../api/helpers";
import { Chart, applyAyanamsha } from "../../api/models/Chart";
import { isNumeric } from "../../api/validators";
import { setWidgetOption, syncOptions } from "../../store/local";

@Component({
  filters: FilterSet,
  components: {
    GridItem,
    CakraSudarshanaRing
  }
})
export default class CakraSudarshanaChart extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @State("settings") settings: SettingState;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "chart" }) context: string;
  @Prop({ default: 1 }) readonly order: number;
  @State("dictionary") dictionary: DictionaryState;

  vargaNum = 1;
  private switching = false;
  private ch: Chart;

  created() {
    this.ch = deepClone(this.chart);
    syncOptions(this, this.context, "CakraSudarshanaChart", this.paneIndex);
  }

  mounted() {
    setTimeout(() => {
      this.changeAyanamsha(this.ayanamsha);
    }, 500);
  }

  get wrapperClasses() {
    const cls = [["num-grahas", this.getGrahas().length].join("-")];
    return cls;
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  getGrahas(): Array<Graha> {
    const grahas = [...this.ch.bodies, this.ascendant];
    applyAyanamsha(this.ch, grahas, this.ayanamsha);
    return grahas;
  }

  get title() {
    return this.dictionary.text("chakra", "sudar_0");
  }

  get ascendant() {
    return this.ch.ascendantGraha;
  }

  refSign(ref = "as") {
    let sign = 1;
    const body = this.getGrahas().find(gr => gr.key === ref);
    if (body) {
      sign = Math.floor(body.longitude / 30) + 1;
    }
    return sign;
  }

  moonSign() {
    return this.refSign("mo");
  }

  sunSign() {
    return this.refSign("su");
  }

  lagnaSign() {
    return this.refSign("as");
  }

  lagnaRingDeg() {
    return (this.lagnaSign() - 1) * 30;
  }

  moonRingDeg() {
    return (this.moonSign() - 1) * 30;
  }

  sunRingDeg() {
    return (this.sunSign() - 1) * 30;
  }

  get signs() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  lagnaSigns() {
    return this.switching
      ? []
      : toSignValues(this.signs, this.lagnaSign()).map(item =>
          this.buildSignSet(item, "lagna")
        );
  }

  lagnaRingGrahas() {
    return this.buildGrahaOffsets(this.lagnaSigns(), "lagna");
  }

  moonSigns() {
    return this.switching
      ? []
      : toSignValues(this.signs, this.lagnaSign()).map(item =>
          this.buildSignSet(item, "moon")
        );
  }

  moonRingGrahas() {
    return this.buildGrahaOffsets(this.moonSigns(), "moon");
  }

  sunSigns() {
    return this.switching
      ? []
      : toSignValues(this.signs, this.lagnaSign()).map(item =>
          this.buildSignSet(item, "sun")
        );
  }

  sunRingGrahas() {
    return this.buildGrahaOffsets(this.sunSigns(), "sun");
  }

  buildGrahaOffsets(signSets: Array<SignSet>, type = "lagna") {
    const items: Array<GrahaStyle> = [];
    signSets.forEach(set => {
      const numGrahas = set.grahas.length;
      if (numGrahas > 0) {
        const start = (set.sign - 1) * 30;
        set.grahas.forEach((graha, gi) => {
          let offset = 0;
          switch (numGrahas) {
            case 2:
              offset = -7.5 + 15 * gi;
              break;
            case 3:
              offset = -10 + 10 * gi;
              break;
            case 4:
              offset = -12 + 8 * gi;
              break;
            case 5:
              offset = -13.5 + 6.75 * gi;
              break;
            case 6:
              offset = -13.5 + 4.5 * gi;
              break;
          }
          const deg = start + offset;
          const style = this.calcPosStyle(deg, type, "graha");
          items.push({ graha, style, inSign: numGrahas, index: gi });
        });
      }
    });
    return this.switching ? [] : items;
  }

  buildSignSet(item: SignValue, type = "lagna"): SignSet {
    const start = (item.sign - 1) * 30;
    const end = item.sign * 30;
    const grahas = this.getGrahas().filter(
      gr => gr.longitude >= start && gr.longitude < end
    );
    grahas.sort((a, b) => a.longitude - b.longitude);
    const title = this.dictionary.text("rashi", item.sign, {
      lang: "la",
      type: "standard"
    });
    const style = this.calcPosStyle(start, type);
    return { ...item, style, title, grahas };
  }

  calcPosStyle(lng: number, type = "lagna", mode = "sign") {
    let offset = 0;
    let radius = 21;
    switch (type) {
      case "lagna":
        offset = this.lagnaRingDeg();
        break;
      case "moon":
        offset = this.moonRingDeg();
        radius = 33;
        break;
      case "sun":
        offset = this.sunRingDeg();
        radius = 45;
        break;
    }

    switch (mode) {
      case "sign":
        switch (type) {
          case "lagna":
            radius -= 7;
            break;
          default:
            radius -= 6;
            break;
        }
        break;
    }

    const deg = subtractLng360(lng, offset + 90);
    const { x, y } = plotOnCircle(radius, deg);
    return renderOffsetStyle(x, y);
  }

  triggerSwitch() {
    this.switching = true;
    setTimeout(() => {
      this.switching = false;
    }, 100);
  }

  @Watch("chart")
  changeChart(newVal) {
    if (newVal instanceof Chart) {
      this.triggerSwitch();
      this.ch = deepClone(newVal);
      setTimeout(() => {
        applyAyanamsha(this.ch, this.getGrahas(), this.ayanamsha);
      }, 50);
    }
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    this.triggerSwitch();
    applyAyanamsha(this.ch, this.getGrahas(), this.ayanamsha);
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      const num = parseInt(newVal);
      this.triggerSwitch();
      this.ch.setVarga(num);
      this.getGrahas().forEach(gr => {
        gr.setVarga(num);
      });
      setWidgetOption(
        this.context,
        "CakraSudarshanaChart",
        this.paneIndex,
        "vargaNum",
        newVal
      );
    }
  }
}
</script>
<style lang="scss">
  @import "@/styles/variables.scss";
  
.cakra-sudarshana .cakra-sudarshana-chart {
  background-image: url("/img/drawings/chakra-sudarshana.svg");
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 97.5%;
  .chart {
    .graha,
    .sign {
      position: absolute;
    }
    .sign {
      width: 1em;
      height: 1em;
      margin-top: -0.5em;
      margin-left: -0.5em;
      .icon {
        position: absolute;
        font-size: 0.5em;
        top: 0.5em;
        left: 0.5em;
        width: 1em;
        height: 1em;
      }
    }
    .house {
      width: 1.5em;
      height: 1.5em;
      margin-top: -0.75em;
      margin-left: -0.75em;
      font-size: 0.5em;
      border-radius: 50%;
      border: solid 1px $blue;
    }
    .graha {
      width: 1em;
      height: 1em;
      margin: -0.5em 0 0 -0.5em;
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: center;
      .icon {
        font-size: 0.75em;
      }
      &.num-3 {
        > .icon {
          font-size: 0.6875em;
        }
      }
      &.num-4 {
        > .icon {
          font-size: 0.625em;
        }
      }
      &.num-5 {
        > .icon {
          font-size: 0.5625em;
        }
      }
      &.num-6 {
        > .icon {
          font-size: 0.5em;
        }
      }
    }
  }
}
</style>
