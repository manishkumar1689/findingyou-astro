<template>
  <fragment>
    <form class="edit-form synastry-scoring" :class="wrapperClasses">
      <fieldset class="categories vertical">
        <b-field label="Rule name" class="row"
          ><b-input type="text" v-model="ruleName" maxlength="32" :has-counter="false"
        /></b-field>
        <div v-if="initialised" class="section rule-sets-widget">
          <condition-set-fieldset
            :allOptions="optionGroups"
            :conditionSet="ruleSet.conditionSet"
            :contextOpts="contextOpts"
            :type="type"
            :parents="[0]"
            :chartModes="chartModeOpts"
          />
        </div>
        <div class="notes-scores horizontal">
          <b-field label="Predictive text" class="column notes-container vertical rule-notes"
            ><b-input type="textarea" v-model="ruleNotes" :rows="3" cols="48"
          /></b-field>
          <div class="vertical score-sets">
            <b-field
              v-for="(opt, index) in categoryOpts"
              :key="['category-opt', 1, opt.key, index].join('-')"
              :label="renderCategory(opt)"
              class="row numeric"
              ><b-input
                type="number"
                :name="opt.key"
                v-model="scoreSet[opt.key]"
                :native-value="opt.key"
                :maxlength="4"
                :min="0"
                :max="opt.maxScore"
                class="score"
                @change.native="updateScores"
            /></b-field>
            <p class="total">{{ currentTotalDisplay }}</p>
            
          </div>
          
        <div v-if="showSaveRule" class="actions">
          <b-button
            @click="cloneRule"
            icon-left="content-save"
            type="is-light"
            >Clone rule</b-button
          >
          <b-button
            @click="saveRuleSet"
            icon-left="content-save"
            type="is-success"
            >Save rule and show matches</b-button
          >
        </div>
        </div>
      </fieldset>
      <div class="section bottom horizontal">
        <div class="saved-rule-sets column">
          <div
            v-for="(rs, rsi) in ruleSets"
            :key="['saved-rule-set', rsi].join('-')"
            class="rule-set"
            :class="ruleSetClasses(rsi)"
          >
            <details>
              <summary>
                <h4>{{ rs.name }}</h4>
                <b-button
                  v-if="ruleIndexEditable(rsi)"
                  class="edit"
                  type="is-primary is-light"
                  @click="openRule(rsi)"
                  >Edit</b-button
                >
              </summary>
                <condition-set-row
                :conditionSet="rs.conditionSet"
                :indices="[0]"
                :allOptions="optionGroups"
                :contextOpts="contextOpts"
                :chartModes="chartModeOpts"
                :type="type"
              />
              <score-values :scores="rs.scores" keyBase="saved-score" />
              </details>
          </div>
          <b-button
            class="add"
            icon-left="plus"
            type="is-info"
            @click="addRuleSet"
            >Add rule</b-button
          >
        </div>
        <div class="matches column">
          <b-progress v-if="showSaveRule" class="loading-progress placeholder" type="is-success" size="is-large" :show-value="true">Loading matches</b-progress>
          <b-table
          v-if="hasResults"
          :data="matches"
          :mobile-cards="false"
        >
            <template slot-scope="props">
              <b-table-column class="names" field="names" label="Names">
                <b-tooltip :label="props.row.info.relType|toWords">
                  {{props.row.names}}
                </b-tooltip>
              </b-table-column>
              <b-table-column field="duration" label="Duration">{{props.row.durationString}}</b-table-column>
              <b-table-column class="quality attribute" field="quality" label="Quality">{{ props.row.qualityNames }}</b-table-column
              >
            <b-table-column class="edit view" field="edit" label="View">
            <b-icon
              icon="eye"
              type="is-info"
              @click.native="openFullChart(props.row)"
              title="Open paired chart widgets in new tab"
            />
          </b-table-column>
            </template>
          </b-table>
          <h3 v-if="!hasResults" class="no-results placeholder">No matches found</h3>
        </div>
      </div>
    </form>
  </fragment>
</template>

<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Watch, Vue } from "vue-property-decorator";
import { notEmptyString } from "../../api/validators";
import { bus } from "../../main";
import { capitalize } from "../../api/converters";
import { DictionaryState, SettingState, UserState } from "../../store/types";
import { FilterSet } from "../../api/composables/FilterSet";
import ConditionSetFieldset from "../widgets/ConditionSetFieldset.vue";
import ConditionSetRow from "../widgets/ConditionSetRow.vue";
import ScoreValues from "../widgets/ScoreValues.vue";
import { KeyName, KeyNameMax } from "../../api/interfaces";
import { RuleSet, RulesCollection } from "../../api/models/Condition";
import { contextTypes } from "../../api/mappings/compatibility-sets";
import {
  BuildCompatibilityOptions,
  chartModes,
  ChartOptGroup,
} from "@/api/mappings/paired-options";
import { ProtocolSearchResult } from "@/api/models/ProtocolSearchResult";

@Component({
  components: { ConditionSetFieldset, ScoreValues, ConditionSetRow },
  filters: FilterSet,
})
export default class SynastryForm extends Vue {
  @Prop({ default: () => new RulesCollection() })
  readonly collection: RulesCollection;
  @Prop({ default: () => [] }) categories: Array<KeyNameMax>;
  @Prop({ default: "synastry" }) type: string;
  @State("dictionary") dictionary: DictionaryState;
  @State("user") user: UserState;
  @State("settings") settings: SettingState;

  private optionGroups: Array<ChartOptGroup> = [];
  private ruleName = "";
  private ruleNotes = "";
  private scoreSet: any = {};
  private operator = "and";
  private ruleSet: RuleSet = new RuleSet();
  private selectedConditionRef: Array<number> = [];
  private selectGrahas = [];
  private ruleSets = [];
  private ruleIndex = 0;
  private selectedCollectionId = "";
  private initialised = false;
  private changing = false;
  private showSaveRule = false;
  private matches: ProtocolSearchResult[] = [];
  private hasCheckedMatches = false;

  created() {
    setTimeout(this.sync, 250);
    const bm = new BuildCompatibilityOptions(this.type, this.dictionary);
    this.optionGroups = bm.groups();

    bus.$on("update-condition", (data) => {
      const { parents, type } = data;
      if (type === this.type) {
        this.ruleSet.updateCondition(data, parents);
        this.showSaveRule = this.currentRuleIsValid();
      }
    });
    bus.$on("update-rule-matches", ({matches, colRef}) => {
      if (colRef === this.collection.type && matches instanceof Array) {
        const cacheKey = "paired-tag-options";
        const tagOpts = Vue.ls.get(cacheKey);
        this.hasCheckedMatches = true;
        if (tagOpts instanceof Array) {
          this.matches = matches.map((row) => new ProtocolSearchResult(row, tagOpts));
        }
      }
    });
  }

  async sync(openIndex = 0) {
    let rules: Array<RuleSet> = [];
    if (this.collection.rules.length > 0) {
      rules = this.collection.rules;
    }
    const hasRules = rules.length > 0;
    if (!hasRules) {
      const tempRules = this.$ls.get(this.tempKey);
      if (tempRules instanceof Array) {
        rules = tempRules;
      } else if (this.type === "synastry") {
        const trs = this.$ls.get("rules");
        if (trs instanceof Array) {
          rules = trs;
        }
      }
    }
    if (!hasRules) {
      rules = [new RuleSet()];
    }
    this.ruleSets = rules
      .filter((r) => r instanceof Object)
      .map((r) => new RuleSet(r));
    if (this.ruleSets.length > 0) {
      this.openRule(openIndex);
    }
  }

  syncScores() {
    const keys = Object.keys(this.scoreSet);
    this.categoryOpts.forEach((opt) => {
      const { key } = opt;
      if (keys.indexOf(key) < 0) {
        this.scoreSet[key] = 0;
      }
    });
  }

  get chartModeOpts() {
    return chartModes;
  }

  getCategoryOptions(category: string): Array<KeyName> {
    let opts = [];
    const optGroup = this.optionGroups.find((og) => og.key === category);
    if (optGroup) {
      opts = optGroup.options;
    }
    return opts;
  }

  openRule(index: number) {
    if (index >= 0 && index < this.ruleSets.length) {
      this.ruleIndex = index;
      this.ruleSet = this.ruleSets[index];
      this.ruleName = this.ruleSet.name;
      this.ruleNotes = this.ruleSet.notes;
      if (this.ruleSet.scores.length > 0) {
        this.ruleSet.scores.forEach((sc) => {
          this.scoreSet[sc.key] = sc.value;
        });
      } else {
        Object.keys(this.scoreSet).forEach((key) => {
          this.scoreSet[key] = 0;
        });
      }
      setTimeout(() => {
        this.initialised = true;
        this.syncScores();
        const {path} = this.$route;
        if (path.includes("/compatibility/")) {
          const subSec = path.split("/compatibility/").pop().split("/").shift();
          if (subSec === this.type) {
            this.loadMatches();
          }
          this.showSaveRule = this.currentRuleIsValid();
        }
      }, 250);
    }
  }

  loadMatches() {
    this.matches = [];
    if (this.currentRuleIsValid()) {
      bus.$emit("save-protocol-rule", {
        type: this.type,
        rule: this.ruleSet,
        index: this.ruleIndex,
        saveRule: false,
        message: ``,
      });
    }
  }
  // Called when condition is updated or loaded
  currentRuleIsValid() {
    if (this.ruleSet.isValid && this.ruleSet.conditionSet.conditionRefs.length > 0) {
      return this.ruleSet.conditionSet.conditionRefs.every(cr => cr.isValid);
    } else {
      return false;
    }
  }

  get contextOpts() {
    return contextTypes;
  }

  get categoryOpts() {
    return this.categories;
  }

  get numRuleSets() {
    return this.ruleSets.length;
  }

  showGroup(key: string, chartNum = 1) {
    const refKey = ["groupC", chartNum].join("");
    return this[refKey] === key;
  }

  grahaName(key: string) {
    let name = key;
    const lex = this.dictionary.graha(key);
    if (lex instanceof Object && lex.hasText()) {
      name = capitalize(lex.text("en", "lt"));
    }
    return name;
  }

  get wrapperClasses() {
    const cls = [];
    if (this.hasCheckedMatches) {
      cls.push('show-results');
    } else {
      cls.push('show-progress');
    }
    return cls;
  }

  get hasConditions() {
    return this.ruleSet.conditionSet.length > 0;
  }

  get conditionRefs() {
    return this.ruleSet.conditionSet.conditionRefs;
  }

  get conditionSet() {
    return this.ruleSet.conditionSet;
  }

  get lastConditionIndex() {
    return this.conditionRefs.length - 1;
  }

  get ruleSetName() {
    return notEmptyString(this.ruleSet.name) ? this.ruleSet.name : "[none]";
  }

  get scoreRows() {
    return this.ruleSet.scores;
  }

  get currentTotal() {
    return this.scoreRows.length > 0
      ? this.scoreRows.map((sc) => sc.value).reduce((a, b) => a + b, 0)
      : -1;
  }

  get currentTotalDisplay() {
    return this.currentTotal < 0 ? "" : this.currentTotal.toString();
  }

  get tempKey() {
    return [this.type, "rules"].join("_");
  }

  get hasResults() {
    return this.matches.length > 0;
  }

  renderCategory(opt: KeyNameMax) {
    return `${opt.name} (${opt.maxScore})`;
  }

  saveRuleSet() {
    if (this.ruleIndex >= 0 && this.ruleIndex < this.ruleSets.length) {
      this.ruleSets[this.ruleIndex] = this.ruleSet;
      this.$ls.set(this.tempKey, this.ruleSets);
      this.matches = [];
      this.hasCheckedMatches = false;
      bus.$emit("save-protocol-rule", {
        type: this.type,
        rule: this.ruleSet,
        index: this.ruleIndex,
        saveRule: true,
        message: `Saved rule: ${this.ruleSet.name}`,
      });
    }
  }

  addRuleSet() {
    this.ruleSets.push(new RuleSet());
    setTimeout(() => {
      this.ruleIndex = this.ruleSets.length - 1;
      this.openRule(this.ruleIndex);
    }, 500);
  }

  removeCondition(index = 0) {
    this.ruleSet.removeCondition(index);
  }

  updateCondition() {
    -this.ruleSet.setName(this.ruleName);
    if (this.selectedConditionRef.length < 1) {
      if (this.conditionRefs.length > 0) {
        this.selectedConditionRef = [0];
      }
    }
    this.ruleSet.setScores(this.scoreSet);
  }

  updateScores() {
    this.ruleSet.setScores(this.scoreSet);
  }

  ruleIndexEditable(index: number): boolean {
    if (this.ruleIndex !== index && index >= 0) {
      const rule = this.ruleSets[index];
      if (rule instanceof Object) {
        return rule.hasConditions;
      }
    }
    return false;
  }

  ruleSetClasses(index: number) {
    return this.ruleIndex === index ? "active" : "inactive";
  }

  cloneRule() {
    const numRules = this.ruleSets.length;
    if (this.ruleIndex >= 0 && this.ruleIndex < this.ruleSets.length) {
      this.collection.addRule(Object.assign({}, this.ruleSets[this.ruleIndex]));
      this.sync(numRules);
    }
  }

  openFullChart(row: ProtocolSearchResult) {
    if (row.c1Id.length > 8 && row.c2Id.length > 8) {
      const pids = [row.c1Id, row.c2Id].join(",");
      window.open("/astro/paired?pids=" + pids, "_blank");
    }
  }

  @Watch("ruleName")
  changeRuleName(newVal) {
    this.ruleSet.setName(newVal);
  }

  @Watch("ruleNotes")
  changeRuleNotes(newVal) {
    this.ruleSet.setNotes(newVal);
  }

  @Watch("collection")
  changeCollection() {
    setTimeout(this.sync, 250);
  }
}
</script>
