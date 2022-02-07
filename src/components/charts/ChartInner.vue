<template>
  <div class="frame" :class="frameClasses">
    <slot></slot>
    <div
      v-for="(body, bi) in getGrahas()"
      :key="['graha-icon', body.key, bi].join('-')"
      class="graha-item"
      :class="matchBodyClassNames(body, posType, posNum)"
      :style="positions.get(body.key)"
      @mouseenter="showAspects(body)"
      @mouseleave="hideAspects(body)"
    >
      <div
        role="button"
        class="trigger"
        slot="trigger"
         v-if="!switching"
        @click.prevent="openBody(body, posNum)"
        :key="['graha-info', body.key].join('-')"
      >
        <span
          class="symbol"
          :class="body.key | toGrahaClass"
          :style="calcBodyInHouseScale(body)"
          :title="grahaTitle(body)"
        ></span>
        <degree
          :deg="calcWithinSign(body)"
          :precision="-1"
          classes="value longitude"
          :tooltip="false"
        />
      </div>
      <b-collapse
        class="info"
        :open="matchOpenBody(body, posNum)"
        :aria-id="['graha-info-', body.key].join('-')"
      >
        <GrahaDetails
          :body="body"
          :ayanamsha="ayanamsha"
          :key="['graha-details', body.key, index].join('-')"
        />
      </b-collapse>
    </div>
  </div>    
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import {
  decPlaces,
  subtractLng360,
} from "../../api/converters";
import { Graha } from "../../api/models/Graha";
import { HouseBound, houseBoundItems } from "../../api/models/HouseBound";
import {
  AspectFracIndex,
  House,
  IconPosition,
  KeyPosValue,
  XYPos,
} from "../../api/interfaces";
import {
  matchHouseDegToSignLabel,
} from "../../api/mappers";
import { FilterSet } from "../../api/composables/FilterSet";
import Degree from "../widgets/Degree.vue";
import GrahaDetails from "../widgets/GrahaDetails.vue";
import {
  DictionaryState,
} from "../../store/types";
import {
  applyDashaTransitClasses,
  buildWHousesFromAscendant,
  matchHouseNum,
} from "../../api/helpers";
import { applyAyanamsha, Chart, ChartWidgetData } from "../../api/models/Chart";

@Component({
  filters: {
    ...FilterSet,
    absPosition(xy: XYPos) {
      return `left: ${xy.x}%; top: ${xy.y}%;`;
    }
  },
  components: {
    Degree,
    GrahaDetails
  }
})
export default class ChartInner extends Vue {
  @Prop({ default: () => new ChartWidgetData(new Chart(null)) }) readonly data: ChartWidgetData;
  @Prop({ default: () => new Map() }) readonly drishtiMatches: Map<string, Array<AspectFracIndex>>;
  @Prop({ default: 0 }) readonly mainAscendant: number;
  @Prop({ default: false }) readonly switching: boolean;
  @Prop({ default: "as" }) readonly refPoint: string;
  @Prop({ default: () => [] }) readonly transitKeys: string[];

  @State("dictionary") dictionary: DictionaryState;

  private oldPositions: KeyPosValue[] = [];
  private positions: Map<string, IconPosition> = new Map();
  private initialized = false;
  private positioned = false;
  
  get chart() { return this.data.chart; }
  get ayanamsha() { return this.data.ayanamsha; }
  get position() { return this.data.position; }
  get type() { return this.data.type; }
  get index() { return this.data.index; }
  get vargaNum() { return this.data.vargaNum; }
  get mode() { return this.data.mode; }
  get midMode() { return this.data.midMode; }
  get timespaceMode() { return this.data.timespaceMode; }
  get height() { return this.data.height; }
  get width() { return this.data.width; }
  get maxHeight() { return this.data.maxHeight; }
  get maxWidth() { return this.data.maxWidth; }
  get zoomLevel() { return this.data.zoomLevel; }
  get chalitBhava() { return this.data.chalitBhava; }
  get hasComposite() { return this.data.hasComposite; }
  get isCurrent() { return this.data.isCurrent; }
  get openBodyRef() { return this.data.openBodyRef; }

  get isInner() { return this.position === "inner"; }

  mounted() {
    this.buildPositions();
    setTimeout(() => {
      this.initialized = true;
    }, 1000);
  }

  buildPositions() {
    this.getGrahas().forEach(bd => {
      this.calcBodyInHousePos(bd);
    });
  }

  calcBodyInHousePos(body: Graha) {
    const { top, left, transformPos } = this.calcBodyInHouseCss(body);
    this.positions.set(body.key, { top, left,transform: transformPos });
  }

  matchStepIndex(steps: XYPos[], index = 0, axis = "x", defPos = "") {
    if (index >= 0 && index < steps.length) {
      return `${steps[index][axis]}%`;
    } else {
      return defPos;
    }
  }

  
  calcBodyInHouseScale(body: Graha) {
    const { transformScale } = this.calcBodyInHouseCss(body);
    return { transform: transformScale };
  }


  matchMiddle(house: HouseBound) {
    switch (this.posType) {
      case "outer":
        return house.middleOuter;
      default:
        return house.middle;
    }
  }

  calcLng(body: Graha) {
    return subtractLng360(body.lng, this.ayanamsha.value);
  }

  calcWithinSign(body: Graha) {
    return this.calcLng(body) % 30;
  }

  grahaTitle(body: Graha) {
    return `${body.key} : ${decPlaces(this.calcLng(body), 5)}`;
  }

  calcBodyInHouseCss(body: Graha) {
    const house = this.houseBounds.find(
      hb => hb.num === this.matchAdjustedHouseNum(body)
    );
    let numInHouse = 0;
    let inSignIndex = 0;
    let xy = { x: 0, y: 0 };
    let scale = 2;
    let translate = 0;
    let axis = "Y";
    if (house) {
      xy = this.matchMiddle(house);
      const { dir } = this.posType === "inner" ? house : { dir: house.outerDir };
      const bodies = this.getGrahas();
      const otherGrahasInSign = bodies.filter(
        b => this.matchAdjustedHouseNum(b) === house.num
      );
      numInHouse = otherGrahasInSign.length;
      const min = Math.min(...[body.longitude,...otherGrahasInSign.map(b => b.longitude)]);
      const max = Math.max(...[body.longitude,...otherGrahasInSign.map(b => b.longitude)]);
      const span = max - min;
      const addToLower = min >= 330 && span > 30;
      const addToEnd = (lng: number) => (addToLower && lng < 30)? lng + 360 : lng;
      otherGrahasInSign.sort((a, b) => addToEnd(a.longitude) - addToEnd(b.longitude));
      inSignIndex = otherGrahasInSign.findIndex(b => b.key === body.key);
      scale = 4 / Math.pow(numInHouse < 2 ? 2 : numInHouse, 1 / 2);

      switch (dir) {
        case "left-to-right":
        case "right-to-left":
          axis = "X";
          break;
      }

      const multiplier = axis === "X" && numInHouse < 4 ? 250 : 150;
      translate = (inSignIndex - (numInHouse - 1) / 2) * multiplier * scale;
      switch (dir) {
        case "bottom-to-top":
        case "right-to-left":
          translate = 0 - translate;
          break;
      }
    }
    const translateAxis = "translate" + axis;
    const {x, y} = xy;
    return {
      left: `${x}%`,
      top: `${y}%`,
      x,
      y,
      transformPos: `${translateAxis}(${translate}%)`,
      transformScale: `scale(${scale})`
    };
  }

  matchBodyClassNames(body: Graha, type = "inner", set = 1) {
    const house = this.houseBounds.find(
      hb => hb.num === this.matchAdjustedHouseNum(body)
    );
    let cls = [];
    if (house) {
      const num = this.getGrahas().filter(
        b => this.matchAdjustedHouseNum(b) === house.num
      ).length;
      cls = type === "inner" ? house.classNames : house.outerClassNames;
      cls.push(["size", num].join("-"));
      if (house.orientation === "horizontal" && num > 3) {
        cls.push("value-below");
      }
    }
    if (this.matchOpenBody(body, set)) {
      cls.push("open");
    }
    applyDashaTransitClasses(this.transitKeys, body, cls);
    return cls;
  }

  matchOpenBody(body: Graha, set = 1) {
    return this.openBodyRef.key === body.key && this.openBodyRef.set === set;
  }

  get posNum(): number {
    return this.position === "outer-2"? 2 : 1;
  }

  get posType(): string {
    return this.position.split('-').shift();
  }

  openBody(body: Graha, set = 1) {
    this.data.openBodyRef = !this.matchOpenBody(body)
      ? { key: body.key, set }
      : { key: "", set: 1 };
  }

  calcChalitDiff(lng: number) {
    return 30 - ((Math.floor(lng / 30) * 30) % 30 - (this.matchRefAsc() % 30 - 15));
  }

  get isMidMode() {
    switch (this.type) {
      case 'timespace':
      case 'midpoint':
        return true;
      default:
        return false;
    }
  }

  matchRefAsc() {
    const { value } = this.ayanamsha;
    return this.hasComposite &&
      this.isMidMode &&
      this.chart.bodies.length > 0
        ? subtractLng360(this.midAscendant(), value)
        : this.getAscendant().longitude;
  }

  midAscendant() {
    return this.midMode === "timespace" && this.timespaceMode === "surface"
      ? this.chart.surface.ascendant
      : this.chart.ascendant;
  }

  matchHouseSign(house: House): number {
    const { lng } = house;
    const offset = this.chalitBhava? this.calcChalitDiff(lng) : 0;
    return Math.floor(((lng + offset) % 360) / 30) + 1;
  }

  houseDegToSignLabel(house: House): string {
    return matchHouseDegToSignLabel(house, this.matchRefAsc(), this.chalitBhava);
  }

  getAscendant(): Graha {
    const asc = this.chart.ascendantGraha;
    asc.setAyanamshaItem(this.ayanamsha);
    asc.setVarga(this.vargaNum);
    return asc;
  }

  buildGrahas(grahas: Array<Graha>) {
    grahas.forEach(gr => {
      gr.setAyanamshaItem(this.ayanamsha);
      gr.setVarga(this.vargaNum);
    });
    return grahas;
  }

  showAspects(body: Graha) {
    if (this.isInner) {
      const aspects = this.drishtiMatches.get(body.key);
      if (aspects instanceof Array && aspects.length > 0) {
        const houseIndex = body.house - 1;
        const houses = aspects.map(av => {
          const houseNum = ((houseIndex + av.index) % 12) + 1;
          return {
            house: houseNum,
            percent: av.frac * 100
          };
        });
        this.updateAspectedHouse(houses);
      }
    }
  }

  updateAspectedHouse(houses = []) {
    const { aspectedHouses } = this.$parent.$parent.$data;
    if (aspectedHouses instanceof Array) {
      this.$set(this.$parent.$parent, "aspectedHouses", houses);
    }
  }

  hideAspects() {
    this.updateAspectedHouse([]);
  }

  getGrahas(): Array<Graha> {
    const grahas = [...this.chart.bodies, this.chart.ascendantGraha];
    return this.buildGrahas(grahas);
  }

  get houseBounds(): Array<HouseBound> {
    return houseBoundItems();
  }

  matchAdjustedHouseNum(body: Graha) {
    const hs = buildWHousesFromAscendant(this.mainAscendant, this.chalitBhava);
    return matchHouseNum(body.longitude, hs);
  }

  get frameClasses() {
    const typeClass = this.type === "cMid"? "c-mid" : this.type;
    const cls = [typeClass];
    switch (this.position) {
      case "outer-1":
        cls.push("outer-frame","first");
        break;
      case "outer-2":
        cls.push("outer-frame","second");
        break;
      default:
        cls.push("inner-frame");
        break;
    }
    if (this.hasComposite) {
      cls.push("c-mid");
    } else if (this.isCurrent) {
      if (this.position === "inner" && this.type === "c1") {
        cls.push("c1");
      } else {
        cls.push("c2");
      }
    }
    return cls;
  }

  @Watch("chart")
  changeChart(newVal, oldVal) {
    if (newVal instanceof Chart && oldVal instanceof Chart && this.initialized) {
      this.changeAyanamsha(this.ayanamsha);
      this.buildPositions();
      setTimeout(() => {
        this.oldPositions = this.getGrahas().map(bd => {
          const house = this.houseBounds.find(
            hb => hb.num === this.matchAdjustedHouseNum(bd)
          );
          const {x, y} = this.matchMiddle(house);
          return {
            x,
            y,
            longitude: bd.longitude,
            key: bd.key
          }
        });
      }, 250);
    }
  }

  @Watch("transitKeys")
  changeTransitKeys() {
    this.buildPositions();
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    applyAyanamsha(this.chart, this.getGrahas(), newVal);
  }

}
</script>
