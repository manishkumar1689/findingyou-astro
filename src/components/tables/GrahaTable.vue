<template>
  <GridItem class="graha-table" :index="paneIndex" :chart="chart">
    <h4>{{ mainLabel }}</h4>
    <div class="graha-listing widget">
      <b-tabs v-model="activeTab">
        <b-tab-item label="Coordinates">
      <b-table
        v-if="hasBodies"
        :data="bodies"
        :row-class="(row, index) => assignRowClasses(row, index)"
        :mobile-cards="false"
      >
        <template slot-scope="props">
          <b-table-column
            class="name"
            :class="props.row.key"
            field="name"
            label
          >
            <i class="icon" :class="props.row.key | toGrahaClass"></i>
          </b-table-column>
          <b-table-column class="longitude" field="lng" :label="longitudeLabel">
            <SignDegree :deg="props.row.longitude" :seconds="true" />
          </b-table-column>
          <b-table-column
            class="latitude numeric"
            field="lt"
            :label="latitudeLabel"
            >{{ props.row.latitude | toDMSLatMid }}</b-table-column
          >
          <b-table-column
            class="declination numeric"
            field="declination"
            :label="declinationLabel"
            >{{ props.row.declination | toDMSLatMid }}</b-table-column
          >
          <b-table-column
            class="speed numeric"
            field="lngSpeed"
            :label="speedLabel"
            >{{ props.row.lngSpeed | toDMSpeed }}</b-table-column
          >
        </template>
      </b-table>
        </b-tab-item>
        <b-tab-item label="Dig Bala">
          <b-table
        v-if="hasBodies"
        :data="extraValues"
        :row-class="(row, index) => assignRowClasses(row, index)"
        :mobile-cards="false"
      >
        <template slot-scope="props">
          <b-table-column
            class="name"
            :class="props.row.key"
            field="name"
            label
          >
            <i class="icon" :class="props.row.key | toGrahaClass"></i>
          </b-table-column>
          <b-table-column class="longitude" field="lng" :label="longitudeLabel">
            <SignDegree :deg="props.row.longitude" :seconds="true" />
          </b-table-column>
          <b-table-column
            class="dig-bala"
            field="digBala"
            label="Dig Bala"
            >{{ props.row.digBala | dec2 }}</b-table-column
          >
          <b-table-column
            class="vargottama"
            field="vargottama"
            label="Vargottama"
            >{{ props.row.vargottama | yesNo }}</b-table-column
          >
        </template>
      </b-table>
        </b-tab-item>
      </b-tabs>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { DictionaryState, SettingState } from "../../store/types";
import { Graha } from "../../api/models/Graha";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import { Relationship } from "../../api/models/Relationship";
import { zeroPad } from "../../api/converters";
import { Nakshatra } from "../../api/models/Nakshatra";
import SignDegree from "../widgets/SignDegree.vue";
import { Chart } from "../../api/models/Chart";
import GridItem from "../widgets/GridItem.vue";
import { isNumeric } from "../../api/validators";
import { deepClone } from "../../api/helpers";

@Component({
  filters: FilterSet,
  components: {
    SignDegree,
    GridItem,
  },
})
export default class GrahaTable extends Vue {
  @State("dictionary") dictionary: DictionaryState;
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @State("settings") settings: SettingState;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: "" }) context: string;

  vargaNum = 1;
  private switching = false;
  private ch: Chart;
  private activeTab = 0;

  created() {
    this.ch = deepClone(this.chart);
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get hasBodies(): boolean {
    return (
      this.ch instanceof Chart && this.ch.grahas.length > 0 && !this.switching
    );
  }

  get coreGrahaKeys(): Array<string> {
    return ["su","mo","ma", "me","ju","ve","sa"];
  }

  get extraValues() {
    return this.hasBodies? this.coreGrahaKeys.map(key => {
      const gr = this.ch.graha(key);
      gr.setAyanamshaItem(this.ayanamsha);
      return {
        key,
        longitude: gr.longitude,
        digBala: this.ch.digBala(key),
        vargottama: gr.vargottama,
      }
    }) : [];
  }

  get bodies(): Array<Graha> {
    return this.hasBodies ? this.ch.bodies : [];
  }

  get mainLabel(): string {
    return this.dictionary.text("graha", 0);
  }
  get longitudeLabel(): string {
    return this.dictionary.text("col", "longitude");
  }
  get latitudeLabel(): string {
    return this.dictionary.text("col", "latitude");
  }
  get declinationLabel(): string {
    return this.dictionary.text("col", "declination");
  }
  get speedLabel(): string {
    return this.dictionary.text("col", "speed");
  }

  grahaName(key: string) {
    let str = key;
    const lex = this.dictionary.graha(key);
    if (lex) {
      str = lex.text("en");
    }
    return str;
  }

  grahaNames(keys: Array<string> = []) {
    return keys.map((key) => this.grahaName(key)).join(", ");
  }

  nakshatraName(nakshatra: Nakshatra) {
    let str = nakshatra.num.toString();
    const name = this.dictionary.text(
      "nakshatra",
      "n27_" + zeroPad(nakshatra.num, 2)
    );
    if (name) {
      str = name;
    }
    return str;
  }

  assignRowClasses(row: Graha, index: number) {
    return [["index", index].join("-"), ["graha", row.key].join("-")];
  }
  showOtherRelations(relation: Relationship) {
    return `natural: ${relation.natural}, temporary: ${relation.temporary}`;
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
    }
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    this.bodies.forEach((gr) => {
      gr.setAyanamshaItem(newVal);
    });
  }

  @Watch("vargaNum")
  changeVarga(newVal) {
    if (isNumeric(newVal)) {
      const num = parseInt(newVal);
      this.triggerSwitch();
      this.ch.setVarga(num);
      this.bodies.forEach((gr) => {
        gr.setVarga(num);
      });
    }
  }
}
</script>
