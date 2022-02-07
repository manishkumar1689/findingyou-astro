<template>
  <GridItem class="mrityubhaga" :index="paneIndex" :chart="chart">
    <h4>{{ mainLabel }}</h4>
    <div class="mrityu widget">
      <b-table
        v-if="hasBodies"
        :data="bodies"
        :row-class="(row, index) => assignRowClasses(row, index)"
        :mobile-cards="false"
      >
        <template slot-scope="props">
          <b-table-column
            class="graha"
            field="key"
            label
            :title="props.row.key | toGrahaName"
          >
            <i class="symbol" :class="props.row.key | toGrahaClass"></i>
          </b-table-column>
          <b-table-column
            class="lng numeric"
            field="lng"
            :label="longitudeLabel"
          >
            <SignDegree :deg="props.row.longitude" :seconds="true" />
          </b-table-column>
          <b-table-column class="lng" field="signLng" :label="orbLabel">
            {{ toDMDiff(props.row.getMrityubhagaDiff(rangeType)) }}
          </b-table-column>
          <b-table-column
            class="mrityu numeric"
            field="degree"
            :label="mbLabel"
          >
            <SignDegree
              :deg="props.row.getMrityubhaga(rangeType)"
              :seconds="false"
            />
          </b-table-column>
        </template>
      </b-table>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import {
  MrityubhagaSet,
  MrityubhagaItem,
} from "../../api/models/MrityubhagaSet";
import { isNumeric } from "../../api/validators";
import { degAsDm } from "../../api/converters";
import { Chart } from "../../api/models/Chart";
import { DictionaryState, SettingState } from "../../store/types";
import SignDegree from "../widgets/SignDegree.vue";
import { Graha } from "../../api/models/Graha";
import GridItem from "../widgets/GridItem.vue";
import { setWidgetOption, syncOptions } from "../../store/local";
import { deepClone } from "../../api/helpers";

@Component({
  filters: FilterSet,
  components: {
    SignDegree,
    GridItem,
  },
})
export default class MrityubhagaTable extends Vue {
  @State("dictionary") dictionary: DictionaryState;
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @State("settings") settings: SettingState;
  @Prop({ default: "standard" }) readonly range: string;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: "" }) context: string;

  vargaNum = 1;
  private ch: Chart;
  private rangeType = "standard";

  created() {
    this.ch = deepClone(this.chart);
    syncOptions(this, this.context, "SingleChart", this.paneIndex);
  }

  get ayanamsha() {
    return this.settings.ayanamsha;
  }

  get mainLabel(): string {
    return this.dictionary.text("infobox", "mb");
  }
  get longitudeLabel(): string {
    return this.dictionary.text("col", "longitude");
  }
  get orbLabel(): string {
    return this.dictionary.text("col", "orb");
  }
  get mbLabel(): string {
    return this.dictionary.text("col", "mb");
  }

  get bodies(): Array<Graha> {
    const gks = ["as", "su", "mo", "ma", "me", "ju", "ve", "sa"];
    return [
      this.ch.ascendantGraha,
      ...this.chart.bodies.filter((b) => gks.includes(b.key)),
      this.ch.gulikaGraha,
      this.ch.mandiGraha,
    ];
  }

  get hasBodies(): boolean {
    return this.ch.bodies.length > 0;
  }

  toDM(lng: number) {
    return degAsDm(lng, "prefix", true);
  }

  toDMDiff(lng: number) {
    return lng > -360 ? degAsDm(lng, "prefix") : "-";
  }

  assignRowClasses(row: MrityubhagaItem, index: number) {
    return [
      ["index", index].join("-"),
      ["mrityubhaga", index].join("-"),
      row.active ? "active" : "inactive",
    ];
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
      this.ch.setVarga(num);
      this.bodies.forEach((gr) => {
        gr.setVarga(num);
      });
      setWidgetOption(
        this.context,
        "SingleChart",
        this.paneIndex,
        "vargaNum",
        newVal
      );
    }
  }
}
</script>
