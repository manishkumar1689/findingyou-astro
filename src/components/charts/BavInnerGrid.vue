<template>
  <div class="middle-inner-frame narrow" @click="cycleMode">
    <template v-if="simpleMode">
    <div v-for="(bavSection, bi) in bavValues" :key="['inner-middle', bavSection.house, bavSection.sign, bi].join('-')" class="house" :class="bavHouseClasses(bavSection)">
      <span v-for="(subSec, si) in bavSection.values" :key="['inner-middle-subsec', bavSection.house, subSec.key].join('-')" class="sub-sec" :class="bavSubsecClasses(subSec, bavSection, bi, si)" :title="bavTooltip(subSec, bavSection)">
        {{subSec.value}}
      </span>
    </div>
    </template>
    <template v-if="fullMode">
      <div v-for="line in gridLines" :key="line.key" class="grid-line" :class="line.key"></div>
      <template v-for="(gridSet, bi) in bavGrid">
        <template v-for="(gridRow, si) in gridSet.values" >
          <span v-for="(itemKey, i) in gridRow.values" :key="['bav-inner-grid-match', gridSet.house, gridRow.key, bi, si, i, itemKey].join('-')" class="item-match" :class="matchItemClass(gridSet, gridRow,itemKey, bi, si)" :style="matchItemStyle(gridSet, gridRow,itemKey)">
          </span>
        </template>
      </template>
    </template>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Chart } from "../../api/models/Chart";
import { DictionaryState, SettingState } from "@/store/types";
import { KeyNumValue, SignValueGrid, SignValueSet } from "@/api/interfaces";
import { buildAsktakavargaSignSet, buildAsktakavargaSignValueSet } from "@/api/mappings/ashtakavarga-values";
import { notEmptyString } from "@/api/validators";
import { bus } from "@/main";
import { capitalize } from "@/api/converters";

@Component({
  name: "BavInnerGrid",
  components: {
  },
})
export default class BavInnerGrid extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly c2: Chart;
  @State("settings") settings: SettingState;
  @State("dictionary") dictionary: DictionaryState;

  private bavValues: SignValueSet[] = [];

  private bavGrid: SignValueGrid[] = [];

  private mode = 'simple';

  private keys = ["sa", "ju", "ma", "su", "ve", "me", "mo", "as"];

  created() {
    bus.$on("bav-outer-mode", mode => {
      switch (mode) {
        case "full":
        case "simple":
          this.mode = mode;
          break;
      }
    });
  }

  mounted() {
    this.load();
  }

  load() {
    this.c2.setAyanamshaItem(this.settings.ayanamsha);
    this.chart.setAyanamshaItem(this.settings.ayanamsha);
    this.bavValues = buildAsktakavargaSignSet(this.chart).map(row => {
      const house = this.chart.signHouseMap.get(row.sign);
      return {...row, house };
    });
    this.bavGrid = buildAsktakavargaSignValueSet(this.chart);
    this.bavValues.sort((a, b) => a.house - b.house);
  }

  get show() {
    return this.mode !== 'none' && notEmptyString(this.mode, 2);
  }

  get simpleMode() {
    return this.mode !== 'full';
  }

  get fullMode() {
    return this.mode === 'full';
  }

  get gridLines() {
    return Array.from(Array(7)).map((_, i) => {
      return { 
        key: ['bav-grid-line', (i+1)].join('-')
      }
    })
  }



  bavHouseClasses(bavSection: SignValueSet) {
    const posIndex = bavSection.house < 12? bavSection.house : 0;
    const secIndex = Math.floor(posIndex / 3);
    const posClass = ['top', 'left', 'bottom', 'right'][secIndex % 4];
    const subClass = ['item', (posIndex % 3) + 1].join('-');
    return [['house', bavSection.house].join('-'), posClass, subClass];
  }

  bavSubsecClasses(bavSubSec: KeyNumValue, bavSection: SignValueSet, secIndex = 0, index = 0) {
    const seqIndex = secIndex < 11? ((secIndex + 1) * 8) + index : index;
    const sideIndex = seqIndex % 24;
    const posClass = index === 0 ? 'first' : index === 7? 'last' : 'mid';
    const cls = [['graha', bavSubSec.key].join('-'), ['index', index].join('-'), ['side-index', sideIndex].join('-'), posClass];
    
    if (this.c2.grahas.length > 3 && this.chart.jd !== this.c2.jd) {
      const gr = this.c2.graha(bavSubSec.key);
      gr.setAyanamshaItem(this.settings.ayanamsha)
      if (bavSection.sign === gr.sign) {
        cls.push('in-house');
      }
    } 
    return cls;
  }


  get grahaSet() {
    return this.keys.map(key => {
      const gr = this.c2.graha(key);
      return { 
        key,
        lng: gr.longitude,
        kakshaIndex: Math.floor(((gr.longitude - this.chart.firstHouseLng) % 360) * (96/360))
      }
    })
  }

  matchItemClass(gridSet, gridRow,itemKey = "", bi = 0, si = 0) {
    const cls = [['item', bi, si, itemKey].join('-'), ['house', gridSet.house].join('-'), ['row', gridRow.key].join('-')];
    const itemIndex = this.keys.indexOf(itemKey);
    const targetIndex = ((gridSet.house - 1) * 8) + itemIndex;
    const gr = this.grahaSet.find(g => g.kakshaIndex === targetIndex);
    if (gr && gr.key === gridRow.key) {
      cls.push('in-transit');
    }
    return cls;
  }

  matchItemStyle(gridSet, gridRow, itemKey = "") {
    
    const houseSecs = [[12, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]];
    const secIndex = houseSecs.findIndex(nums => nums.includes(gridSet.house));
    const innerIndex = houseSecs[secIndex].indexOf(gridSet.house);
    const startPositions = [{ top: 0, right: 0, from: 'right' }, { top: 0, left: 0, from: 'top' }, { bottom: 0, left: 0, from: 'left' }, { bottom: 0, right: 0, from: 'bottom' }];
    const startCriteria = startPositions[secIndex];
    const gr1 = this.keys.indexOf(gridRow.key);
    const gr2 = this.keys.indexOf(itemKey);
    const entries = [];
    const { from } = startCriteria;
    Object.entries(startCriteria).forEach(entry => {
      const [k, v] = entry;
      if (k !== 'from') {
        const subtract = (0.25 * (gr1/8));
        const len = (1 - subtract) * (23.25 / 24);
        const offset = subtract / 2;
        const prop = k === from? (((innerIndex * 8) + gr2 + 0.75) / 24  * len) + offset : (gr1 * (0.125 / 8.25)) + (0.125 / 64);
        entries.push([k, `${(prop * 100)}%`]);
      }
    });
    return Object.fromEntries(entries);
  }

  bavTooltip(subSec: KeyNumValue, subSection: SignValueSet) {
    const lex = this.dictionary.graha(subSec.key);
    const label = lex instanceof Object ? lex.text("en", "standard") : subSec.key;
    return `${capitalize(label)}: ${subSec.value} (${subSection.sign})`;
  }

  cycleMode() {
    const modes = ['simple', 'full', 'none'];
    const currIndex = modes.indexOf(this.mode);
    const nextIndex = currIndex < 0? 0 : (currIndex + 1) % 3;
    this.mode = modes[nextIndex];
  }

  get hasChart() {
    return this.chart instanceof Chart && this.chart.grahas.length > 6;
  }

  @Watch('chart')
  changeChart() {
    setTimeout(() => {
      this.load();
    }, 500);
  }

  @Watch('mode')
  changeMode() {
    bus.$emit('bav-inner-mode', this.mode);
  }

}
</script>
<style lang="scss">
@import "@/styles/variables.scss";
#main .subpanes  .graha-chart {
  .middle-inner-frame {
      top: 10%;
      left: 10%;
      right: 10%;
      bottom: 10%;
      cursor: pointer;
      outline: dashed 0.5px $medium-grey;
      background-repeat: no-repeat;
      background-size: 120%;
      background-position: center center;
      border: solid 0.5px $medium-grey;
      opacity: 0;
      transition: opacity 1s ease-in-out;
      .item-match {
        position: absolute;
        width: 0.25em;
        height: 0.25em;
        background-color: $dark-grey;
        border-radius: 50%;
        pointer-events: all;
        &.in-transit {
          background-color: $red-label;
        }
      }
      .grid-line {
        position: absolute;
        outline: solid 0.5px $medium-grey;
        pointer-events: all;
      }
      .bav-grid-line-1 {
        top: 1.5625%;
        bottom: 1.5625%;
        left: 1.5625%;
        right: 1.5625%;
      }
      .bav-grid-line-2 {
        top: 3.125%;
        bottom: 3.125%;
        left: 3.125%;
        right: 3.125%;
      }
      .bav-grid-line-3 {
        top: 4.6875%;
        bottom: 4.6875%;
        left: 4.6875%;
        right: 4.6875%;
      }
      .bav-grid-line-4 {
        top: 6.25%;
        bottom: 6.25%;
        left: 6.25%;
        right: 6.25%;
      }
      .bav-grid-line-5 {
        top: 7.8125%;
        bottom: 7.8125%;
        left: 7.8125%;
        right: 7.8125%;
      }
      .bav-grid-line-6 {
        top: 9.375%;
        bottom: 9.375%;
        left: 9.375%;
        right: 9.375%;
      }
      .bav-grid-line-7 {
        top: 10.9375%;
        bottom: 10.9375%;
        left: 10.9375%;
        right: 10.9375%;
      }
      .house {
        position: absolute;
        display: flex;
        font-size: 0.3333em;
        pointer-events: all;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        .sub-sec {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          &.in-house {
            background-color: $medium-grey;
            border-radius: 50%;
            &.graha-sa.index-0 { background-color: #a9affc }
            &.graha-ju.index-1 { background-color: #fcdea9; } 
            &.graha-ma.index-2 { background-color: #fcafa9; }
            &.graha-su.index-3 { background-color: #fca9b7; }
            &.graha-ve.index-4 { background-color: #f9a9fc; }
            &.graha-me.index-5 { background-color: #adfca9; }
            &.graha-mo.index-6 { background-color: #d0d1d0; }
            &.graha-as.index-7 { background-color: #a9fcfb; }
          }
        }
        &.top {
          flex-flow: row-reverse nowrap;
          top: 0;
          &.item-1 {
            right: 1.5%;
          }
          &.item-2 {
            right: 34%;
          }
          &.item-3 {
            right: 67%;
          }
        }
        &.left {
          flex-flow: column nowrap;
          left: 0;
          &.item-1 {
            top: 1.5%;
          }
          &.item-2 {
            top: 34%;
          }
          &.item-3 {
            top: 67%;
          }
        }
        &.bottom {
          flex-flow: row nowrap;
          bottom: 0;
          &.item-1 {
            left: 1.5%;
          }
          &.item-2 {
            left: 34%;
          }
          &.item-3 {
            left: 67%;
          }
        }
        &.right {
          flex-flow: column-reverse nowrap;
          right: 0;
          &.item-1 {
            bottom: 1.5%;
          }
          &.item-2 {
            bottom: 34%;
          }
          &.item-3 {
            bottom: 67%;
          }
        }
        &.top,
        &.bottom {
          width: 31.6666%;
          height: 3.335%;
          .sub-sec {
            height: 100%;
            width: 12.5%;
            pointer-events: all;
          }
        }
        &.left,
        &.right {
          height: 31.6666%;
          width: 3.3335%;
          .sub-sec {
            width: 100%;
            height: 12.5%;
            &::before {
              content: "";
              position: absolute;
              left: 0;
              right: 0;
              top: 0;
            }
          }
        }
      }
  }

  .double-chart {
    .middle-inner-frame {
      clip-path: polygon(0% 0%, 0% 100%, 3.2% 100%, 3.2% 3.2%, 96.8% 3.2%, 96.8% 96.8%, 3.2% 96.8%, 3.2% 100%, 100% 100%, 100% 0%);
    }
  }

  .triple-chart {
    .middle-inner-frame {
      clip-path: polygon(0% 0%, 0% 100%, 12.5% 100%, 12.5% 12.5%, 87.5% 12.5%, 87.5% 87.5%, 12.5% 87.5%, 12.5% 100%, 100% 100%, 100% 0%);
    }
  }
  &:hover {
    .middle-inner-frame {
      opacity: 1;
    }
  }
  &.show-middle-inner-frame {
    .chart .middle-inner-frame {
      opacity: 1;
      outline: solid 0.5px $medium-grey;
      background-image: url("/img/drawings/lines-96.svg");
      .house {
        opacity: 1;
      }
    }
  }
}
</style>