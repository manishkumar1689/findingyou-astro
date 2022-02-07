<template>
  <grid-item class="kuta-bars" :index="paneIndex" :chart="chart" :chart2="chart2">
    <h4>{{ this.title }}</h4>
    <div class="kuta-bar-chart widget" :class="wrapperClasses">
      <h4 class="total-row">{{totalRow.score}} out of {{totalRow.max}}</h4>
      <b-table v-if="!refreshing" :data="singleValues" :mobile-cards="false" :row-class="rowClasses">
        <template slot-scope="props">
          <b-table-column class="head" field="head" label="Kuta">
            <span
              :title="optionName(props.row.key)"
              class="kuta-item-label"
              :class="optionClasses(props.row.key)"
            >
              {{ props.row.head }}
            </span>
          </b-table-column>
          <b-table-column
            class="percent bar-cell"
            header-class="subject c1"
            field="amount"
            label="%"
          >
            <div class="bar" :style="calcStyle(props.row)"></div>
          </b-table-column>
          <b-table-column
            class="score"
            header-class="score"
            field="Score"
            :label="matchRowLabel('max')"
          >{{ props.row.score }} / {{ props.row.max }}</b-table-column>
        </template>
      </b-table>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import { Graha } from "../../api/models/Graha";
import { KutaGrahaItem } from "../../api/models/KutaGrahaItem";
import { KutaValueSet } from "../../api/models/KutaValueSet";
import { KeyKeys } from "../../api/interfaces";
import { isNumeric, notEmptyString } from "../../api/validators";
import { FilterSet } from "../../api/composables/FilterSet";
import { bus } from "../../main";
import { DictionaryState, SettingState } from "../../store/types";
import { deepClone } from "../../api/helpers";
import { Chart, applyAyanamsha } from "../../api/models/Chart";
import { KutaBuilder } from "../../api/KutaBuilder";
import { syncOptions, setWidgetOption } from "../../store/local";
import { Nakshatra } from "../../api/models/Nakshatra";
import { fetchSetting } from "../../api/methods";

@Component({
  filters: FilterSet,
  components: {
    GridItem
  }
})
export default class Kuta extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "chart" }) context: string;
  @State("settings") settings: SettingState;
  @State("dictionary") dictionary: DictionaryState;

  vargaNum = 1;
  switching = false;
  private c1: Chart;
  private c2: Chart;
  private activeTab = 0;

  private c2Key = "mo";

  private c1Key = "mo";

  private builder: KutaBuilder = new KutaBuilder();

  /*
    Varṇa Kūṭa
Vaśya Kūṭa
Graha Maitri
Rāśi Kūṭa
Dina Kūṭa
Yoni Kūṭa
Gana Kūṭa
Nādī Kūṭa
Rajju
Vedha
Mahendra
Strī Dīrghā
  */

  private dvadashaKeys = [
    "varna",
    "vashya",
    "grahamaitri",
    "rashi",
    "tara",
    "yoni",
    "gana",
    "nadi",
    "rajju",
    "vedha",
    "mahendra",
    "stri"
  ];

  private itemOptions = new Map<string, string>();

  private totalRow: KutaValueSet = new KutaValueSet();

  private pairKeys = ["as", "mo", "ve", "su"];

  private compatabilitySet = new Map<string, any>();

  private valueSets = new Map<string, KutaValueSet>();

  private singleValues: Array<KutaValueSet> = [];

  private showItemOptions = false;
  private selectedKuta: KutaValueSet = null;
  private refreshing = false;

  created() {
    this.loadCompatibility();

    this.c1 = deepClone(this.chart);
    if (this.hasC2) {
      this.c2 = deepClone(this.chart2);
    }
  }

  mounted() {
    syncOptions(this, this.context, "AshtaKuta", this.paneIndex);
    setTimeout(() => {
      this.changeAyanamsha(this.ayanamsha);
    }, 250);
    setTimeout(() => {
      this.calcKutas();
    }, 1000);
    bus.$on("escape", () => {
      this.hideItemOptions();
    });
  }

  loadCompatibility() {
    const cacheKey = "kuta_variants";
    const cs = this.$ls.get(cacheKey);
    if (cs === null) {
      fetchSetting(cacheKey).then(data => {
        if (data instanceof Object) {
          if (data.value instanceof Object) {
            this.compatabilitySet = new Map(Object.entries(data.value));
            this.$ls.set(cacheKey, data.value);
          }
        }
      });
    } else if (cs instanceof Object) {
      this.compatabilitySet = new Map(Object.entries(cs));
      
    }
    setTimeout(() => {
      this.itemVariants
        .filter(iv => iv.keys.length > 0)
        .forEach(iv => {
          this.itemOptions.set(iv.key, iv.keys[0]);
        });
      const itemOpts = this.$ls.get("kuta_item_options");
      if (itemOpts instanceof Object) {
        Object.entries(itemOpts).forEach(entry => {
          const [key, value] = entry;
          if (typeof value === "string") {
            this.itemOptions.set(key, value);
          }
        });
      } else {
        this.$ls.set("kuta_item_options", Object.fromEntries(this.itemOptions));
      }
      this.builder = new KutaBuilder(this.dictionary, this.compatabilitySet, this.itemOptions);
    }, 1000);
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

  get subject1() {
    return this.hasC1 ? this.c1.shortName : "";
  }

  get subject2() {
    return this.hasC2 ? this.c2.mediumName : "";
  }

  get gender1() {
    return this.hasC1 ? this.genderLabel(this.c1) : "-";
  }

  get gender2() {
    return this.hasC2 ? this.genderLabel(this.c2) : "-";
  }

  get wrapperClasses() {
    const cls = [["tab", this.activeTab].join("-")];
    if (this.showItemOptions) {
      cls.push("show-item-options");
    }
    return cls;
  }

  get sub1Classes() {
    const cls = [];
    return cls;
  }

  get sub2Classes() {
    const cls = [];
    return cls;
  }

  genderLabel(chart: Chart) {
    const parts = [];
    const { gender } = chart.subject;
    switch (gender) {
      case "f":
      case "m":
        parts.push(chart.subject.gender.toUpperCase());
        break;
    }
    if (this.sameGender) {
      parts.push("1");
    }
    return parts.join(" ");
  }

  get sameGender() {
    let same = false;
    if (this.hasC1 && this.hasC2) {
      same = this.c1.subject.gender === this.c2.subject.gender;
    }
    return same;
  }

  get coreBodies() {
    return ["su", "mo", "ma", "me", "ju", "ve", "sa"];
  }

  get extraObjects() {
    return ["as", "ds"];
  }
  get activePairKeys() {
    return this.refreshing
      ? []
      : this.allKeys.filter(k => this.pairKeys.includes(k));
  }

  get itemVariants(): Array<KeyKeys> {
    const itemVars: Array<KeyKeys> = [];
    for (const [key, value] of this.compatabilitySet.entries()) {
      if (value instanceof Object) {
        const { variants } = value;
        if (variants instanceof Object) {
          const keys = Object.keys(variants);
          if (keys.length > 0) {
            itemVars.push({ key, keys });
          }
        }
      }
    }
    return itemVars;
  }

  get types() {
    return [
      {
        key: "ashta",
        dict: "_0_08"
      },
      {
        key: "dvadasha",
        dict: "_0_12"
      },
      {
        key: "other",
        dict: "_0_other"
      }
    ];
  }

  get allKeys() {
    return [...this.coreBodies, ...this.extraObjects];
  }

  calcTotalRow(refValues: Array<any>) {
    const total = refValues
      .filter(sv => sv instanceof KutaValueSet)
      .map(sv => sv.score)
      .reduce((a, b) => a + b, 0);
    const maxTotal = refValues
      .filter(sv => typeof sv.max === "number")
      .map(sv => sv.max)
      .reduce((a, b) => a + b, 0);
    return {
      score: total,
      max: maxTotal
    };
  }
  
  assignBaseLabel(key: string, result: KutaValueSet) {
    const settings = this.compatabilitySet.get(key);
    let refKey = key;
    let numKeySuffix = 0;
    if (settings instanceof Object) {
      const { dictionary } = settings;
      if (dictionary instanceof Object) {
        const { name } = dictionary;
        if (name) {
          refKey = name;
          numKeySuffix = null;
        }
      }
    }
    result.head = this.dictName(refKey, numKeySuffix);
  }

  buildSingleValues() {
    this.singleValues = this.dvadashaKeys.map(key => {
      const row = this.valueSets.get(key);
      const result = row instanceof KutaValueSet ? row : new KutaValueSet(null);
      this.assignBaseLabel(key, result);
      return result;
    });
    const { score, max } = this.calcTotalRow(this.singleValues);
    this.totalRow = new KutaValueSet({
      key: "total",
      head: "Total",
      score,
      max
    });
  }

  matchRowLabel(field: string) {
    const col = this.singleColumns.find(col => col.key === field);
    if (col instanceof Object) {
      return col.label;
    }
  }

  get singleColumns() {
    const cols = [
      {
        key: "head",
        label: "Kuta"
      }
    ];
    cols.push({
      key: "c1",
      label: this.gender1
    });
    cols.push({
      key: "c2",
      label: this.gender2
    });
    cols.push({
      key: "score",
      label: "Score"
    });
    cols.push({
      key: "max",
      label: "Max"
    });
    return cols;
  }

  grahaName(key: string, long = false) {
    const lex = this.dictionary.graha(key);
    const hasLex = lex instanceof Object && lex.hasText();
    if (long) {
      return hasLex ? lex.alt("sa", "en") : [key, "c"].join("");
    } else {
      return hasLex ? lex.alt("sa", "en") : [key, "c"].join("").toUpperCase();
    }
  }

  buildGrahas(set = 1): Array<Graha> {
    const c = set === 2 ? this.c2 : this.c1;
    const grahas = [
      ...c.bodies.filter(gr => this.coreBodies.includes(gr.key)),
      c.ascendantGraha,
      c.descendantGraha
    ];
    applyAyanamsha(c, grahas, this.ayanamsha);
    return grahas;
  }

  get title() {
    return `Kūṭas (Natal to Transit)`;
  }

  matchGraha(c: Chart, grahaKey: string) {
    const gr = c instanceof Object? c.graha(grahaKey) : null;
    if (gr instanceof Graha) {
      gr.setAyanamshaItem(this.ayanamsha);
    }
    return gr;
  }

  nakInfo(nak: Nakshatra) {
    let label = "";
    let yoniLabel = "";
    if (nak instanceof Object) {
      const { key } = nak;

      label = key;
      if (key) {
        const lex = this.dictionary.lexeme("nakshatra", key);
        if (lex) {
          label = lex.text("sa", "short", "lt");
        }
        const lexY = this.dictionary.lexeme(
          "kuta",
          ["yoni", nak.yoni].join("_")
        );
        if (lexY) {
          yoniLabel = lexY.text("en");
        }
      }
      return { ...nak, pada: nak.pada, label, yoniLabel };
    }
  }

  calcKutas() {
    const gr1 = this.matchGraha(this.c1, this.c1Key);
    const gr2 = this.matchGraha(this.c2, this.c2Key);
    this.valueSets = new Map<string, KutaValueSet>();
    if (gr1 instanceof Graha && gr2 instanceof Graha) {
      const nak1 = this.nakInfo(gr1.nakshatra);
      const nak2 = this.nakInfo(gr2.nakshatra);
      if (nak1 && nak2 instanceof Object) {
        const { s1, s2, valid } = this.buildSubjects(gr1, gr2);
        if (valid) {
          this.dvadashaKeys.forEach(key => {
            const result = this.calcItem(key, [s1, s2]);
            this.valueSets.set(key, result);
          });
        }
      }
    }
    this.buildSingleValues();
  }

  calcItem(key: string, dataSets: Array<KutaGrahaItem>) {
    return this.builder.calcItem(key, dataSets);
  }

  buildSubjects(gr1: Graha, gr2: Graha) {
    let s1 = null;
    let s2 = null;
    if (gr1 instanceof Graha && gr2 instanceof Graha) {
      const nak1 = this.nakInfo(gr1.nakshatra);
      const nak2 = this.nakInfo(gr2.nakshatra);
      if (nak1 && nak2 instanceof Object) {
        s1 = new KutaGrahaItem(
          gr1,
          this.c1.subject.gender,
          nak1,
          this.c1.moonWaxing
        );
        s2 = new KutaGrahaItem(
          gr2,
          this.c2.subject.gender,
          nak2,
          this.c2.moonWaxing
        );
      }
    }
    return {
      s1,
      s2,
      valid: s1 instanceof KutaGrahaItem && s2 instanceof KutaGrahaItem
    };
  }

  

  optionName(typeKey: string) {
    const opt = this.itemOptions.get(typeKey);
    let str = "standard";
    if (opt) {
      str = this.typeLabel(opt);
    }
    return str;
  }

  optionClasses(typeKey: string) {
    const optRow = this.itemVariants.find(iv => iv.key === typeKey);
    const cls = [];
    if (optRow) {
      if (this.selectedKuta instanceof KutaValueSet) {
        if (typeKey === this.selectedKuta.key) {
          cls.push("selected");
        }
      }
    }
    return cls;
  }

  rowClasses(row, index) {
    return [["row", index].join('-'), row.key === "total" ? "total-row" : "body-row"];
  }

  dictName(subcat: string, num = null, category = "kuta", lang = "en") {
    return this.builder.dictName(subcat, num, category, lang);
  }

  typeLabel(key: string) {
    const parts = key.split("__");
    let dictKey = key;
    if (parts.length > 1) {
      const [first, second] = parts;
      let subPart = second;
      switch (second) {
        case "one":
          subPart = "1";
          break;
        case "two":
          subPart = "2";
          break;
      }
      dictKey = [first, subPart].join("_");
    }
    const dictName = this.dictName(dictKey);
    return notEmptyString(dictName) ? dictName : key;
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
      if (set === 2) {
        setTimeout(() => {
          this.calcKutas();
        }, 250);
      }
    }
  }

  parseKutaValue(val) {
    let str = val;
    if (typeof val === "string") {
      const parts = val.split("/");
      if (parts.length > 1) {
        const [type, numId, score] = parts;
        switch (type) {
          case "sign":
            str = `<i class="icon icon-${numId}" title="${score}"></i>`;
            break;
        }
      }
    }
    return str;
  }

  hideItemOptions() {
    this.showItemOptions = false;
    this.selectedKuta = null;
  }

  calcStyle(item: KutaValueSet) {
    const percent = (item.score / item.max) * 100;
    return { width: `${percent}%`};
  }

/*   @Watch("c1Key")
  changeC1Key(newVal) {
    this.calcKutas();
  }

  @Watch("c2Key")
  changeC2Key(newVal) {
    this.calcKutas();
  } */

  @Watch("chart")
  changeChart(newVal) {
    this.updateChart(newVal, 1);
  }

  @Watch("chart2")
  changeChart2(newVal) {
    this.updateChart(newVal, 2);
  }

  @Watch("ayanamsha")
  changeAyanamsha(newVal) {
    this.triggerSwitch();
    applyAyanamsha(this.c1, this.buildGrahas(1), newVal);
    if (this.hasC2) {
      applyAyanamsha(this.c2, this.buildGrahas(2), newVal);
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
      "KutaBarChart",
      this.paneIndex,
      "vargaNum",
      newVal
    );
  }
}
</script>
