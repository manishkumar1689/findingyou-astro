<template>
  <GridItem
    class="panchanga-table"
    :index="paneIndex"
    :chart="chart"
    :showSettings="false"
  >
    <h4>{{ dictionary.text("panchanga", 0) }}</h4>
    <div class="panchanga-values widget">
      <b-table
        :data="getRows()"
        :row-class="(row, index) => assignRowClasses(index)"
        :mobile-cards="false"
      >
        <template slot-scope="props">
          <b-table-column class="key-name" field="keyName" label>
            {{ props.row.keyName }}
          </b-table-column>
          <b-table-column class="main-value" field="mainValue" label="Current">
            <h3>{{ props.row.mainValue }}</h3>
            <p>{{ props.row.subValue }}</p>
          </b-table-column>
          <b-table-column class="icon" field="iconClass" label="Ruler">
            <i class="icon" :class="props.row.iconClass"></i>
          </b-table-column>
        </template>
      </b-table>
      <div class="combo-set hora">
        <div class="value-set"></div>
      </div>
    </div>
  </GridItem>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import GridItem from "../widgets/GridItem.vue";
import { longDate, longTime, percLeft, zeroPad } from "../../api/converters";
import { InfoTableRow } from "../../api/models/InfoTableRow";
import { Chart } from "../../api/models/Chart";
import { DictionaryState } from "../../store/types";
import { AyanamshaItem, DefaultAyanamshaItem } from "../../api/interfaces";
import { Graha } from "@/api/models/Graha";
@Component({
  components: {
    GridItem,
  },
  filters: FilterSet,
})
export default class PanchangaTable extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => DefaultAyanamshaItem })
  readonly ayanamsha: AyanamshaItem;
  @Prop({ default: 0 }) readonly offset: number;
  @Prop({ default: 0 }) readonly paneIndex: number;
  @Prop({ default: "p1" }) readonly context: string;
  @State("dictionary") dictionary: DictionaryState;

  created() {
    if (this.hasChart) {
      this.chart.setAyanamshaItem(this.ayanamsha);
    }
  }
  get currentLabel(): string {
    return this.dictionary.text("col", "current");
  }
  get rulerLabel(): string {
    return this.dictionary.text("col", "ruler");
  }

  get hasChart() {
    return this.chart instanceof Chart && this.chart.hasIndianTime;
  }

  get hasValues(): boolean {
    return this.hasChart && this.chart.grahas.length > 0;
  }

  getRows() {
    const items: Array<InfoTableRow> = [];
    if (this.hasChart) {
      const vara = this.chart.getVara();

      let lex = this.dictionary.lexeme("vara", 1);
      if (this.chart.hasVara && lex instanceof Object) {
        lex = this.dictionary.lexeme("vara", vara.num);
        items.push(
          this.addRow(
            "panchanga/vara",
            lex.text("sa", "standard", "lt"),
            lex.text("en", "standard"),
            ["icon", vara.ruler].join("-")
          )
        );
      }
      if (this.chart.hasIndianTime) {
        lex = this.dictionary.lexeme("tithi", this.chart.tithi.num);
        items.push(
          this.addRow(
            "panchanga/tithi",
            lex.text("sa", "standard", "lt"),
            `left: ${percLeft(this.chart.tithi.percent)}`,
            ["icon", this.chart.tithi.lord].join("-")
          )
        );
        lex = this.dictionary.lexeme("karana", this.chart.karana.num);
        if (lex) {
          items.push(
            this.addRow(
              "panchanga/karana",
              lex.text("sa", "standard", "lt"),
              `left: ${percLeft(this.chart.karana.percent)}`,
              ["icon", this.chart.karana.ruler].join("-")
            )
          );
        }
        lex = this.dictionary.lexeme("yoga", this.chart.yoga.num);
        if (lex) {
          items.push(
            this.addRow(
              "panchanga/yoga",
              lex.text("sa", "standard", "lt"),
              `left: ${percLeft(this.chart.yoga.percent)}`,
              ["icon", this.chart.yoga.ruler].join("-")
            )
          );
        }
        const moon = this.chart.bodies.find((g) => g.key === "mo");
        if (moon instanceof Graha) {
          moon.setAyanamshaItem(this.ayanamsha);
          const moonNak = moon.nakshatra;
          lex = this.dictionary.lexeme("nakshatra", moonNak.key);
          if (lex) {
            items.push(
              this.addRow(
                "panchanga/nakshatra",
                lex.text("sa", "standard", "lt"),
                `left: ${percLeft(moonNak.percent)}`,
                ["icon", moonNak.ruler].join("-")
              )
            );
          }
        }
      }
    }

    return items;
  }

  addRow(
    keyName: string,
    mainValue: string,
    subValue: string,
    iconClass: string,
    iconLabel = ""
  ) {
    const [category, key] = keyName.split("/");
    const termName = this.dictionary.text(category, key);
    return new InfoTableRow(
      termName,
      mainValue,
      subValue,
      iconClass,
      iconLabel
    );
  }

  assignRowClasses(index: number) {
    return [
      ["index", index].join("-"),
      ["panchanga-1", this.chart._id, index].join("-"),
    ];
  }
  longDate(datetime) {
    return longDate(datetime, this.offset);
  }

  longTime(datetime) {
    return longTime(datetime, this.offset);
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    if (this.hasChart) {
      this.chart.bodies.forEach((gr) => {
        gr.setAyanamshaItem(newVal);
      });

      this.chart.setAyanamshaItem(this.ayanamsha);
      this.$forceUpdate();
    }
  }
}
</script>
