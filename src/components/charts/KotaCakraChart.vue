<template>
  <grid-item class="kota-cakra" :index="paneIndex" :chart="chart" :chart2="chart2">
    <h4>
      <slot name="title">{{ title }}</slot>
    </h4>
    <div class="kota-cakra-chart widget" :class="wrapperClasses">
      <section class="chart" ref="chart">
        <div
          v-for="(item, index) in nakshatraItems()"
          class="nakshatra"
          :class="item.classNames"
          :key="[item.key, index].join('-')"
        >
          <div class="name" :title="item.title">{{ item.short }}</div>
          <ul v-if="item.grahaItems.length > 0" class="grahas">
            <li
              v-for="grItem in item.grahaItems"
              class="graha"
              :class="grItem.classNames"
              :key="grItem.key"
            >
                <i
                  class="icon"
                  :class="grItem.graha.key | toGrahaClass"
                ></i>
              <div class="info-box row">
                <span class="nakshatra num">{{ grItem.graha.nakshatra28 }}</span>
                <span class="angle within-nakshatra">{{ grItem.graha.withinNakshatra28 | toDMS0 }}</span>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import { Graha } from "../../api/models/Graha";
import nakshatraValues from "../../api/mappings/nakshatra-values";
import { matchKotaPala } from "../../api/mappings/kota-values";
import { isNumeric, notEmptyString } from "../../api/validators";
import {
  mapGrahaItem
} from "../../api/mappers";
import { FilterSet } from "../../api/composables/FilterSet";
import Degree from "../widgets/Degree.vue";
import { DictionaryState, SettingState } from "../../store/types";
import {
  matchNakshatra28,
  matchNakshatra28Item,
  matchLord,
  deepClone
} from "../../api/helpers";
import { Chart, applyAyanamsha, fetchCurrentTimespace, combineCharts } from "../../api/models/Chart";
import { syncOptions, setWidgetOption } from "../../store/local";

@Component({
  filters: FilterSet,
  components: {
    Degree,
    GridItem
  }
})
export default class KotaCakraChart extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @State("settings") settings: SettingState;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "chart" }) context: string;
  @Prop({ default: () => [] }) readonly transitKeys: string[];
  @State("dictionary") dictionary: DictionaryState;

  vargaNum = 1;
  switching = false;
  private singleMode = 1;
  private c1: Chart;
  private c2: Chart;
  private cMid: Chart;
  private midMode = "midpoint";
  private midModeNone = true;

  created() {
    this.sync();
  }

  sync() {
    const first = this.singleMode === 1? this.chart : this.chart2;
    const second = this.singleMode === 1? this.chart2 : this.chart;
    this.c1 = deepClone(first);
    if (this.hasC2) {
      this.c2 = deepClone(second);
    }
    if (this.context === "p3") {
      this.cMid = fetchCurrentTimespace();
    }
  }

  mounted() {
    syncOptions(this, this.context, "KotaCakraChart", this.paneIndex);
    setTimeout(() => {
      this.changeAyanamsha(this.ayanamsha);
    }, 250);
  }

  get hasC1() {
    return this.chart instanceof Chart && this.chart.grahas.length > 0;
  }

  get hasC2() {
    return this.chart2 instanceof Chart && this.chart2.grahas.length > 0;
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  matchSet(set = 1) {
    if (set < 3) {
      return set === 2 ? this.c2 : this.c1;
    } else {
      return this.midMode === "timespace"? this.cMid : combineCharts(this.c1,this.c2, this.ayanamsha);
    }
  }

  buildGrahas(set = 1): Array<Graha> {
    const coreBodies = ["as", "su", "mo", "ma", "ju", "sa", "ve", "me", "ke", "ra"];
    const c = this.matchSet(set);
    return [
      ...c.bodies.filter(gr => coreBodies.includes(gr.key)),
      c.ascendantGraha
    ];
  }

  get title() {
    return this.dictionary.text("chakra", "kota_0");
  }

  get hasMid() {
    return this.context === "p3" && this.cMid instanceof Chart && this.cMid.jd > 0 && this.midMode.length > 3;
  }

  get showBirthGrahas() {
    switch (this.context) {
      case "predictive":
        return false;
      default:
        return true;
    }
  }

  get wrapperClasses() {
    const cls = [['context', this.context].join('-')];
    switch (this.context) {
      case 'predictive':
        cls.push('predictive');
        break;
      default:
        cls.push('comparative');
        break;
    }
    return cls;
  }

  nakshatraItems() {
    const innerStart = 1;
    const firstOffset = innerStart < 2 ? 1 : 0;
    const grahas = this.buildGrahas(1);
    const grahas2 = this.hasC2 ? this.buildGrahas(2) : [];
    const grahas3 = this.hasMid ? this.buildGrahas(3) : [];
    const moon = grahas.find(gr => gr.key === "mo");
    const moonNak = moon instanceof Graha ? moon.nakshatra28 : 0;
    return moonNak > 0 && this.switching
      ? []
      : nakshatraValues
          .map((nk, index) => {
            const nkRelNum = index + 1 + moonNak - 19;
            const nkNum =
              nkRelNum > 28
                ? nkRelNum - 28
                : nkRelNum < 1
                ? nkRelNum + 28
                : nkRelNum;
            const { num, ref, dictKey, itemKey } = matchNakshatra28(nkNum - 1);
            const nkItem = matchNakshatra28Item(nakshatraValues, num, itemKey);
            if (nkItem) {
              let short = ref;
              let long = ref;

              const lex = this.dictionary.lexeme("nakshatra", dictKey);
              if (lex) {
                short = lex.text("sa", "short", "lt");
                long = lex.text("sa", "default");
              }
              const set1 = this.singleMode === 1 ? 1 : 2;
              const set2 = this.singleMode === 1 ? 2 : 1;
              const g1 = this.showBirthGrahas? grahas
                .filter(gr => gr.nakshatra28 === num)
                .map((gr, gi) => mapGrahaItem(gr, gi, set1, "kc", this.transitKeys)) : [];
              const g2 = this.hasC2
                ? grahas2
                    .filter(gr => gr.nakshatra28 === num)
                    .map((gr, gi) => mapGrahaItem(gr, gi, set2, "kc", this.transitKeys))
                : [];
              const g3 = this.hasMid
                ? grahas3
                    .filter(gr => gr.nakshatra28 === num)
                    .map((gr, gi) => mapGrahaItem(gr, gi, 3, "kc", this.transitKeys))
                : [];
              const grahaItems = [...g1, ...g2, ...g3];
              const abhjitClass =
                num < 22 ? "before" : num === 22 ? "abhjit" : "after";
              const majorGroupNum = Math.floor(index / 7) + 1;
              const subGroupNum = (index % 7) + 1;
              const isInner = subGroupNum === innerStart;
              const isOuter = subGroupNum <= 4;
              const groupNum = isInner
                ? 0
                : isOuter
                ? majorGroupNum * 2 - 1
                : majorGroupNum * 2;
              const subNum = isInner
                ? majorGroupNum
                : isOuter
                ? subGroupNum - firstOffset
                : subGroupNum - 4;
              const groupClass = ["group", groupNum].join("-");
              const subClass = ["sub", subNum].join("-");
              const dirClass = isInner ? "middle" : isOuter ? "in" : "out";
              const title = num + ": " + long;
              const classNames = [
                itemKey.replace(/_/g, "-"),
                abhjitClass,
                groupClass,
                subClass,
                dirClass
              ];
              return {
              ...nkItem,
                short,
                long,
                grahaItems,
                classNames,
                title
              };
            }
          })
          .filter(nkItem => nkItem instanceof Object);
  }

  triggerSwitch() {
    this.switching = true;
    setTimeout(() => {
      this.switching = false;
    }, 100);
  }

  updateChart(newVal, set = 1) {
    if (newVal instanceof Chart) {
      this.triggerSwitch();
      if (set === 2) {
        this.c2 = deepClone(newVal);
      } else {
        this.c1 = deepClone(newVal);
      }
      setTimeout(() => {
        this.changeAyanamsha(this.ayanamsha);
      }, 250);
    }
  }

  @Watch("chart")
  changeChart(newVal) {
    const refNum = this.singleMode === 1? 1 : 2;
    this.updateChart(newVal, refNum);
  }

  @Watch("chart2")
  changeChart2(newVal) {
    const refNum = this.singleMode === 1? 2 : 1;
    this.updateChart(newVal, refNum);
  }

  @Watch("singleMode")
  changeSingleMode(newVal) {
    this.triggerSwitch();
    this.sync();
    setTimeout(() => {
      this.changeAyanamsha(this.ayanamsha);
    }, 250);
  }

  @Watch("midMode")
  changeMidMode(newVal) {
    this.triggerSwitch();
    this.sync();
    setTimeout(() => {
      this.changeAyanamsha(this.ayanamsha);
    }, 250);
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    this.triggerSwitch();
    applyAyanamsha(this.c1, this.buildGrahas(1), newVal);
    if (this.hasC2) {
      applyAyanamsha(this.c2, this.buildGrahas(2), newVal);
      if (this.hasMid) {
        applyAyanamsha(this.cMid, this.buildGrahas(3), newVal);
      }
    }
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      this.triggerSwitch();
      const num = parseInt(newVal);
      this.c1.setVarga(num);

      this.buildGrahas(1).forEach(gr => {
        gr.setVarga(num);
      });
      this.c1.moon.setVarga(this.vargaNum);
      this.c1.sun.setVarga(this.vargaNum);
      if (this.hasC2) {
        this.c2.setVarga(num);
        this.buildGrahas(2).forEach(gr => {
          gr.setVarga(num);
        });
        this.c2.moon.setVarga(this.vargaNum);
        this.c2.sun.setVarga(this.vargaNum);
      }
    }
    setWidgetOption(
      this.context,
      "KotaCakraChart",
      this.paneIndex,
      "vargaNum",
      newVal
    );
  }
}
</script>
<style lang="scss" scoped>
@import "@/styles/variables.scss";

#app .kota-cakra {
    .kota-cakra-chart {
      background-image: url("/img/drawings/chakra-kota.svg");
      background-repeat: no-repeat;
      background-position: center center;
      background-size: 102.5%;
      .chart {
        > .nakshatra {
          position: absolute;
          width: 2em;
          text-align: center;
          height: 1em;
          line-height: 1em;
          overflow: visible;

          margin: -0.5em 0 0 -1em;
          .name {
            font-size: 0.875em;
          }
          .grahas {
            position: absolute;
            display: flex;
            flex-flow: row wrap;
            left: -1em;
            right: -1em;
            justify-content: center;
            align-content: center;
            top: 0;
            li {
              .icon {
                height: 1em;
                width: 1em;
                font-size: 0.75em;
                margin: 0.25em;
              }
            }
          }

          &.group-0 {
            &.sub-1,
            &.sub-3 {
              top: 50%;
            }
            &.sub-2 {
              top: 63%;
              .grahas {
                top: -1em;
              }
              .grahas {
                top: -1em;
              }
            }
            &.sub-4 {
              top: 37%;

              .grahas {
                top: 1em;
              }
            }

            &.sub-1 {
              left: 63%;
              .name {
                transform: rotate(90deg);
              }

              .grahas {
                left: -3.5em;
              }
            }

            &.sub-3 {
              left: 36%;
              .name {
                transform: rotate(-90deg);
              }
              .grahas {
                left: 2em;
              }
            }

            &.sub-2,
            &.sub-4 {
              left: 50%;
            }
          }
          &.group-5,
          &.group-1 {
            top: 50%;
          }

          &.group-1 {
            > .name {
              margin-top: 2.25em;
            }
            &.sub-1 {
              left: 73%;
            }
            &.sub-2 {
              left: 84%;
            }
            &.sub-3 {
              left: 95%;
            }
          }

          &.group-2 {
            > .name {
              margin-top: 0.125em;
              margin-left: -5.75em;
              transform: rotate(45deg);
            }
            &.sub-1 {
              top: 95%;
              left: 95%;
            }
            &.sub-2 {
              top: 84%;
              left: 84%;
            }
            &.sub-3 {
              top: 73%;
              left: 73%;
            }
          }

          &.group-3 {
            left: 50%;
            > .name {
              margin-left: -4.5em;
              transform: rotate(90deg);
            }
            &.sub-1 {
              top: 73%;
            }
            &.sub-2 {
              top: 84%;
            }
            &.sub-3 {
              top: 95%;
            }
          }

          &.group-4 {
            > .name {
              margin-top: -3em;
              margin-left: -0.5em;
              transform: rotate(-45deg);
            }
            &.sub-1 {
              top: 95%;
              left: 5%;
            }
            &.sub-2 {
              top: 84%;
              left: 16%;
            }
            &.sub-3 {
              top: 73%;
              left: 27%;
            }
          }

          &.group-5 {
            > .name {
              margin-top: -2.25em;
            }
            &.sub-1 {
              left: 27%;
            }
            &.sub-2 {
              left: 16%;
            }
            &.sub-3 {
              left: 5%;
            }
          }

          &.group-6 {
            > .name {
              margin-top: -0.5em;
              margin-left: 3.75em;
              transform: rotate(45deg);
            }
            &.sub-1 {
              top: 5%;
              left: 5%;
            }
            &.sub-2 {
              top: 16%;
              left: 16%;
            }
            &.sub-3 {
              top: 27%;
              left: 27%;
            }
          }

          &.group-7 {
            > .name {
              margin-top: -0.75em;
              margin-left: 3.5em;
              transform: rotate(90deg);
            }
            left: 50%;
            &.sub-1 {
              top: 27%;
            }
            &.sub-2 {
              top: 16%;
            }
            &.sub-3 {
              top: 5%;
            }
          }

          &.group-8 {
            > .name {
              margin-top: 2.75em;
              margin-left: 0.5em;
              transform: rotate(-45deg);
            }
            &.sub-1 {
              top: 5%;
              left: 95%;
            }
            &.sub-2 {
              top: 16%;
              left: 84%;
            }
            &.sub-3 {
              top: 27%;
              left: 73%;
            }
          }
        }
      }
      &.comparative {
        .chart  > .nakshatra  .grahas  li {
          &.set-1  .icon {
            color: $blue-label;
          }
          &.set-2  .icon {
            color: $red-label;
          }
          &.set-3 .icon {
            color: $green-label;
          }
        }
      }

      &.predictive {
        .chart > .nakshatra .grahas  li {
          .icon {
            transform: scale(1.5);
          }
        }
      }
    }
  }

.info-box {
  position: absolute;
  bottom: 2em;
  left: 0.5em;
  pointer-events: none;
  background-color: white;
  border: solid 1px $dark-color;
  padding: 0.5em;
  opacity: 0;
  transition: opacity 0.3333s ease-in-out;
  font-size: 0.75em;
  width: 7.5em;
  white-space: nowrap;
  border-radius: 0.5em;
  box-shadow: 1px 1px 1px $light-grey;
  text-align: center;
  .num {
    &::after {
      content: ":";
    }
  }
}

.group-8.sub-1,
.group-7.sub-3,
.group-6.sub-1 {
  .info-box {
    bottom: auto;
    top: 1em;
  }
}

.group-8.sub-1,
.group-8.sub-2,
.group-1.sub-3 ,
.group-2.sub-1 {
  .info-box {
    left: -6em;
  }
}

li.graha {
  position: relative;
  cursor: pointer;
  &:hover {
    .info-box {
      opacity: 1;
      pointer-events: all;
    }
  }
}


</style>
