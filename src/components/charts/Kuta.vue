<template>
  <grid-item class="ashta-kuta" :index="paneIndex" :chart="chart" :chart2="chart2">
    <h4>{{ title }}</h4>

    <div class="ashta-kuta-chart widget" :class="wrapperClasses">
      <ul class="kuta-type-selector plain">
        <li v-for="kt in kutaTypes" :key="kt.itemKey" class="kuta-type">
          <b-radio :name="kt.key" :native-value="kt.key" v-model="kutaType">{{kt.label}}</b-radio>
        </li>
      </ul>
      <b-tabs v-model="activeTab">
        <b-tab-item label="Single Kutas">
          <GrahaSwitcher
            :keys="allKeys"
            :chartNum="1"
            :subjectName="subject1"
            :index="paneIndex"
            :selectedKey="c1Key"
            context="tab_1"
            class="vertical left"
          />

          <GrahaSwitcher
            :keys="allKeys"
            :chartNum="2"
            :subjectName="subject2"
            :selectedKey="c2Key"
            :index="paneIndex"
            context="tab_1"
            class="vertical right"
          />
          <b-table v-if="!refreshing" :data="singleValues" :mobile-cards="false" :row-class="rowClasses">
            <template slot-scope="props">
              <b-table-column class="head" field="head" label="Kuta">
                <span
                  @click="selectKutaItem(props.row)"
                  :title="optionName(props.row.key)"
                  class="kuta-item-label"
                  :class="optionClasses(props.row.key)"
                >
                  <template v-if="props.row.hasTooltip">
                    <b-tooltip :label="props.row.tooltip" type="is-info" :multilined="true">{{props.row.head}}</b-tooltip>
                  </template>
                  <template v-else>{{ props.row.head }}</template>
                </span>
              </b-table-column>
              <b-table-column
                class="main c1 subject"
                header-class="subject c1"
                field="c1"
                :label="matchRowLabel('c1')"
              >
                <span class="value" v-html="parseKutaValue(props.row.c1Value)"></span>
              </b-table-column>
              <b-table-column
                class="main c2 subject"
                header-class="subject c2"
                field="c2"
                :label="matchRowLabel('c2')"
              >
                <span class="value" v-html="parseKutaValue(props.row.c2Value)"></span>
              </b-table-column>
              <b-table-column
                class="main score numeric"
                header-class="score numeric"
                field="score"
                :label="matchRowLabel('score')"
              >{{ props.row.score }}</b-table-column>
              <b-table-column
                class="main max numeric"
                header-class="max numeric"
                field="max"
                :label="matchRowLabel('max')"
              >{{ props.row.max }}</b-table-column>
            </template>
          </b-table>
        </b-tab-item>
        <b-tab-item label="Multiple Kutas">
          <GrahaSwitcher
            class="horizontal"
            :keys="allKeys"
            :multi="true"
            :selectedKeys="pairKeys"
            :index="paneIndex"
            context="tab_2"
          />
          <b-table
            v-if="!refreshing"
            :data="multiValues"
            :mobile-cards="false"
            :row-class="rowClasses"
          >
            <template slot-scope="props">
              <b-table-column class="head" field="head" label="Kuta">
                <span
                  @click="selectKutaItem(props.row)"
                  :title="optionName(props.row.key)"
                  class="kuta-item-label"
                  :class="optionClasses(props.row.key)"
                  :custom-key="multiColKey('head')"
                >{{ props.row.head }}</span>
              </b-table-column>
              <b-table-column
                class="main score numeric"
                v-for="cell in props.row.cells"
                :key="multiColKey(cell.grahaKey)"
                :custom-key="multiColKey(cell.grahaKey)"
                :header-class="['score subscore', cell.grahaKey].join(' ')"
                :class="cell.grahaKey"
                :field="cell.grahaKey"
                :label="cell.grahaKey"
              >
                <template slot="header" slot-scope="{ column }">
                  <b-tooltip :label="grahaName(column.label)">
                    <span class="icon" :class="column.label|toGrahaClass"></span>
                  </b-tooltip>
                </template>
                {{cell.score}}
              </b-table-column>
              <b-table-column
                class="score numeric"
                header-class="score numeric"
                :custom-key="multiColKey('total')"
                field="total"
                label="Total"
              >{{ props.row.total }}</b-table-column>
              <b-table-column
                class="max numeric"
                header-class="max numeric"
                field="max"
                :custom-key="multiColKey('max')"
                label="Max"
              >{{ props.row.max }}</b-table-column>
            </template>
          </b-table>
        </b-tab-item>
      </b-tabs>

      <div v-if="showItemOptions" class="item-options" @click.prevent.stop="dismissItemOption">
        <b-field :label="selectedKuta.head">
          <b-select v-if="currOptions.length > 0" v-model="currOption">
            <option v-for="opt in currOptions" :value="opt.key" :key="opt.key">{{ opt.label }}</option>
          </b-select>
        </b-field>
      </div>
      <h4 class="subject-name subject-1" :class="sub1Classes">{{ subject1 }}</h4>
      <h4 class="subject-name subject-2" :class="sub2Classes">{{ subject2 }}</h4>
    </div>
  </grid-item>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import GridItem from "../widgets/GridItem.vue";
import { Graha } from "../../api/models/Graha";
import { KutaGrahaItem } from "../../api/models/KutaGrahaItem";
import { KutaValueSet, KutaMultiSet } from "../../api/models/KutaValueSet";
import {
  KeyKeys,
  KeyLabel,
} from "../../api/interfaces";
import { isNumeric, notEmptyString } from "../../api/validators";
import { FilterSet } from "../../api/composables/FilterSet";
import GrahaSwitcher from "../widgets/GrahaSwitcher.vue";
import { bus } from "../../main";
import { DictionaryState, SettingState } from "../../store/types";
import {
  deepClone,
} from "../../api/helpers";
import { Chart, applyAyanamsha } from "../../api/models/Chart";
import {KutaBuilder} from "../../api/KutaBuilder";
import { syncOptions, setWidgetOption } from "../../store/local";
import { Nakshatra } from "../../api/models/Nakshatra";
import { fetchSetting } from "../../api/methods";

@Component({
  filters: FilterSet,
  components: {
    GrahaSwitcher,
    GridItem
  }
})
export default class Kuta extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => new Chart() }) readonly chart2: Chart;
  @Prop({ default: 0 }) paneIndex: number;
  @State("settings") settings: SettingState;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "chart" }) context: string;
  @State("dictionary") dictionary: DictionaryState;

  vargaNum = 1;
  switching = false;
  private c1: Chart;
  private c2: Chart;
  private activeTab = 0;

  private tabKeys = [
    { key: "single", name: "Single Kutas" },
    { key: "paired", name: "Paired Kutas" }
  ];

  private c2Key = "mo";

  private c1Key = "mo";

  private kutaType = "ashta";

  private builder: KutaBuilder = new KutaBuilder();

  private ashtaKeys = [
    "varna",
    "vashya",
    "tara",
    "yoni",
    "grahamaitri",
    "gana",
    "rashi",
    "nadi"
  ];

  private extraDvadashaKeys = ["rajju", "vedha", "stri", "mahendra"];

  private otherKeys = ["gotra", "vihanga", "yonyanukulya", "vainashika","bhuta_nakshatras","bhuta_rashis","ayavyaya", "rnadhana_1", "rnadhana_2", "rnadhana_3"];

  private itemOptions = new Map<string, string>();

  private pairKeys = ["as", "mo", "ve", "su"];

  private compatabilitySet = new Map<string, any>();

  private valueSets = new Map<string, KutaValueSet>();

  private singleValues: Array<KutaValueSet> = [];

  private multiSets = new Map<string, KutaMultiSet>();

  private multiValues: Array<KutaMultiSet> = [];

  private showItemOptions = false;
  private currOptions: Array<KeyLabel> = [];
  private currOption = "";
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
    const cls = [this.kutaType, ["tab", this.activeTab].join("-")];
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

  get dvadashaKeys() {
    return [...this.ashtaKeys, ...this.extraDvadashaKeys];
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

  get kutaTypes() {
    return this.types.map(kt => {
      let label = kt.key;
      const dictName = this.dictName(kt.dict, "");
      if (notEmptyString(dictName) && kt.dict !== dictName) {
        label = dictName;
      }
      const itemKey = ["kt", this.paneIndex, this.context, kt.key].join("-");
      return { ...kt, itemKey, label };
    });
  }

  get allKeys() {
    return [...this.coreBodies, ...this.extraObjects];
  }

  calcKutas() {
    switch (this.activeTab) {
      case 1:
        this.calcMultiKutas();
        break;
      default:
        this.calcSingleKutas();
        break;
    }
  }

  calcTotalRow(refValues: Array<any>) {
    const total = refValues
      .filter(sv => sv instanceof KutaValueSet || sv instanceof KutaMultiSet)
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
  
  assignBaseLabel(key: string, result: KutaValueSet | KutaMultiSet) {
    const settings = this.compatabilitySet.get(key);
    let refKey = key;
    let numKeySuffix = 0;
    if (settings instanceof Object) {
      const { dictionary } = settings;
      if (dictionary instanceof Object) {
        const { name, tooltip } = dictionary;
        if (name) {
          refKey = name;
          numKeySuffix = null;
        }
        if (tooltip) {
          result.tooltip = tooltip;
        }
      }
    }
    result.head = this.dictName(refKey, numKeySuffix);
  }

  buildSingleValues() {
    this.singleValues = this.currentKeys.map(key => {
      const row = this.valueSets.get(key);
      const result = row instanceof KutaValueSet ? row : new KutaValueSet(null);
      this.assignBaseLabel(key, result);
      return result;
    });
    const { score, max } = this.calcTotalRow(this.singleValues);
    const totalRow = new KutaValueSet({
      key: "total",
      head: "Total",
      score,
      max
    });
    this.singleValues.push(totalRow);
  }

  get currentKeys() {
    switch (this.kutaType) {
      case "dvadasha":
        return this.dvadashaKeys;
      case "other":
        return this.otherKeys;
      default:
        return this.ashtaKeys;
    }
  }

  buildMultiValues() {
    this.multiValues = this.currentKeys.map(key => {
      
      const row = this.multiSets.get(key);
      const result =
        row instanceof KutaMultiSet ? row : new KutaMultiSet("", "", []);
      this.assignBaseLabel(key, result);
      return result;
    });
    const totals = new Map<string, number[]>();
    this.multiValues.forEach(mv => {
      mv.cells.forEach(cell => {
        if (totals.has(cell.grahaKey)) {
          const [score, max] = totals.get(cell.grahaKey);
          totals.set(cell.grahaKey, [score + cell.score, max + cell.max]);
        } else {
          totals.set(cell.grahaKey, [cell.score, cell.max]);
        }
      });
    });
    const totalCells = Object.entries(Object.fromEntries(totals)).map(entry => {
      const [grahaKey, pair] = entry;
      const [score, max] = pair;
      return {
        key: "subtotal",
        grahaKey,
        score,
        max
      };
    });

    const totalRow = new KutaMultiSet("total", "Total", totalCells);
    this.multiValues.push(totalRow);
  }

  multiColKey(key: string) {
    return ["gr-kt", this.paneIndex, key].join("-");
  }

  matchRowLabel(field: string) {
    const refCols = this.activeTab < 1 ? this.singleColumns : this.multiColumns;
    const col = refCols.find(col => col.key === field);
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

  get multiColumns() {
    const cols = [
      {
        key: "head",
        label: "Kuta"
      }
    ];
    this.activePairKeys.forEach(gk => {
      const label = this.grahaName(gk);
      cols.push({
        key: gk,
        label
      });
    });
    cols.push({
      key: "total",
      label: "Total"
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
    return this.dictionary.text("kuta", "_0_08");
  }

  matchGraha(c: Chart, grahaKey: string) {
    const gr = c.graha(grahaKey);
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

  calcSingleKutas() {
    const gr1 = this.matchGraha(this.c1, this.c1Key);
    const gr2 = this.matchGraha(this.c2, this.c2Key);
    this.valueSets = new Map<string, KutaValueSet>();
    if (gr1 instanceof Graha && gr2 instanceof Graha) {
      const nak1 = this.nakInfo(gr1.nakshatra);
      const nak2 = this.nakInfo(gr2.nakshatra);
      if (nak1 && nak2 instanceof Object) {
        const { s1, s2, valid } = this.buildSubjects(gr1, gr2);
        if (valid) {
          this.currentKeys.forEach(key => {
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

  calcMultiKutas() {
    if (this.activePairKeys.length > 0) {
      this.multiSets = new Map<string, KutaMultiSet>();
      this.activePairKeys.forEach(gk => {
        const gr1 = this.matchGraha(this.c1, gk);
        const gr2 = this.matchGraha(this.c2, gk);
        if (gr1 instanceof Graha && gr2 instanceof Graha) {
          const { s1, s2, valid } = this.buildSubjects(gr1, gr2);
          if (valid) {
            this.currentKeys.forEach(key => {
              const item = this.calcItem(key, [s1, s2]);
              const cell = { ...item, grahaKey: gk };
              if (this.multiSets.has(key)) {
                const refRow = this.multiSets.get(key);
                refRow.cells.push(cell);
                this.multiSets.set(key, refRow);
              } else {
                this.multiSets.set(
                  key,
                  new KutaMultiSet(key, item.head, [cell])
                );
              }
            });
          }
        }
      });
      this.buildMultiValues();
    }
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
      if (optRow.keys.length > 1) {
        cls.push("has-options");
      }
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

  selectKutaItem(item: KutaValueSet) {
    const optSet = this.itemVariants.find(iv => iv.key === item.key);
    if (optSet instanceof Object) {
      const { keys } = optSet;
      if (keys instanceof Array && keys.length > 1) {
        this.currOptions = keys.map(key => {
          const label = this.typeLabel(key);
          return { key, label };
        });
        this.currOption = this.itemOptions.get(item.key);
        this.showItemOptions = true;
        this.selectedKuta = item;
      }
    }
  }

  hideItemOptions() {
    this.showItemOptions = false;
    this.selectedKuta = null;
  }

  applyItemOption() {
    if (this.showItemOptions && this.selectedKuta instanceof KutaValueSet) {
      this.itemOptions.set(this.selectedKuta.key, this.currOption);
      this.$ls.set("kuta_item_options", Object.fromEntries(this.itemOptions));
      setTimeout(() => {
        this.calcKutas();
      }, 250);
    }
    this.hideItemOptions();
  }

  dismissItemOption(e) {
    const { target } = e;
    if (target.classList.contains("label")) {
      this.hideItemOptions();
    }
  }

  @Watch("currOption")
  changeCurrOption(newVal) {
    if (this.showItemOptions && notEmptyString(newVal)) {
      this.applyItemOption();
    }
  }

  @Watch("activeTab")
  changeActiveTab(newVal) {
    this.calcKutas();
  }

  @Watch("pairKeys")
  changePairKeys(newVal) {
    this.refreshing = true;
    this.calcKutas();
    setTimeout(() => {
      this.refreshing = false;
      this.calcKutas();
    }, 500);
  }

  @Watch("kutaType")
  changeKutaType(newVal) {
    this.calcKutas();
  }

  @Watch("c1Key")
  changeC1Key(newVal) {
    this.calcKutas();
  }

  @Watch("c2Key")
  changeC2Key(newVal) {
    this.calcKutas();
  }

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
      "AshtaKuta",
      this.paneIndex,
      "vargaNum",
      newVal
    );
  }
}
</script>
