<template>
  <fragment>
    <form class="edit-form synastry-scoring" :class="wrapperClasses">
      <b-icon class="close" icon="close" size="is-large" @click.native="close" />
      <h3 class="overlay-title">{{title}}</h3>
      
      <fieldset class="categories vertical">
        <div class="actions horizontal">
          <b-field label="Rule name" class="row"
          >
            <b-input type="text" v-model="ruleName" maxlength="32" :has-counter="false"
        /></b-field>
        <b-field label="Active" class="row">
          <b-switch v-model="active" />
        </b-field>
        <b-select v-model="ruleId">
          <option v-for="opt in ruleOptions" :key="opt.itemKey" :value="opt._id">{{opt.name}}</option>
        </b-select>
        <b-button
            @click="handleDelete"
            icon-left="trash-can-outline"
            type="is-danger"
            size="is-small"
            title="Delete rule set"
            >Delete</b-button
          >
          <b-button
            @click="cloneRule"
            icon-left="content-save"
            type="is-light"
            size="is-small"
            title="Clone rule set"
            >Clone</b-button
          >
          <b-button
            @click="saveRuleSet"
            icon-left="content-save"
            type="is-success"
            title="Save rule set"
            >Save</b-button
          >
        </div>
        <div v-if="initialised" class="section rule-sets-widget">
          <condition-set-fieldset
            v-if="!switching"
            :allOptions="optionGroups"
            :conditionSet="ruleSet.conditionSet"
            :contextOpts="contextOpts"
            :type="type"
            :parents="[0]"
            :chartModes="chartModeOpts"
            :secondaryFilterOpts="secondaryFilterOpts"
            :secondaryKeyOpts="secondaryKeyOpts"
          />
        </div>
        <div class="text-scores-container horizontal">
          <b-field label="Predictive text" class="text-widget vertical"
            ><b-input type="textarea" v-model="ruleText" :rows="3" cols="48"
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
            <b-field class="row">
              <b-input type="text" v-model="newCategory" v-if="addCategoryMode" placeholder="New category" @keyup.native.enter="addScoreCategory"  />
              <b-icon icon="plus" @click.native="addScoreCategory" />
            </b-field>
            <b-field class="row" label="Max score" v-if="showMaxScore">
              <b-input type="number" class="integer" v-model="categoryMaxScore" @keyup.native.enter="hideMaxScore"  />
            </b-field>
            <p class="total" v-if="currentTotal > 0" @click="editMaxScore">{{ currentTotalDisplay }}</p>
            <ol v-if="hasErrors" class="errors">
              <li v-for="(error, ei) in errors" :key="['error',ei].join('-')">{{error}}</li>
            </ol>
          </div>
        </div>
      </fieldset>
      <div v-if="hasRuleId" class="results">
        <ul v-if="hasMatches">
          <li v-for="(match, mi) in matches" :key="['match',mi].join('-')">
            <span class="text-label">Next match</span>
            <em class="start">{{match.start}}</em>
            <em class="end">{{match.end}}</em>
          </li>
        </ul>
        <p v-else>No matches found</p>
      </div>
    </form>
  </fragment>
</template>

<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Watch, Vue } from "vue-property-decorator";
import { bus } from "../../main";
import { capitalize, julToLongDate, sanitize } from "../../api/converters";
import { DictionaryState, SettingState, UserState } from "../../store/types";
import { FilterSet } from "../../api/composables/FilterSet";
import ConditionSetFieldset from "../widgets/ConditionSetFieldset.vue";
import ConditionSetRow from "../widgets/ConditionSetRow.vue";
import ScoreValues from "../widgets/ScoreValues.vue";
import { KeyName, KeyNameMax, StartEndDateString } from "../../api/interfaces";
import { Condition, ConditionSet, RuleSet, Score } from "../../api/models/Condition";
import { contextTypes } from "../../api/mappings/compatibility-sets";
import {
  BuildCompatibilityOptions,
  ChartOptGroup,
} from "@/api/mappings/paired-options";
import { deletePredictiveRuleSet, fetchPredictiveMatches, fetchPredictiveRuleSets, savePredictiveRuleSet } from "@/api/methods";
import { dashaSystemKeySets, mapDashaSystemOption } from "@/api/mappings/dasha-sets";
import { fetchGeo, getGeoTzOffset } from "@/api/geoloc-utils";
import { notEmptyString } from "@/api/validators";

@Component({
  components: { ConditionSetFieldset, ScoreValues, ConditionSetRow },
  filters: FilterSet,
})
export default class PredictorForm extends Vue {
  @Prop({ default: "transit" }) type: string;
  @Prop({ default: "" }) chartId: string;
  @State("dictionary") dictionary: DictionaryState;
  @State("user") user: UserState;
  @State("settings") settings: SettingState;

  private optionGroups: Array<ChartOptGroup> = [];
  private ruleSets: Array<RuleSet> = [];
  private conditionSet: ConditionSet = new ConditionSet();
  private ruleId = "";
  private active = false;
  private ruleIndex = 0;
  private ruleName = "";
  private ruleNotes = "";
  private ruleText = "";
  private scoreSet: any = {};
  private scores: Score[] = [];
  private selectedConditionRef: Array<number> = [];
  private initialised = false;
  private switching = false;
  private showSaveRule = false;
  private newCategory = "";
  private addCategoryMode = false;
  private categoryMaxScore = 10;
  private showMaxScore = false;
  private errors: string[] = [];
  private matches: StartEndDateString[] = [];
  private checking = false;

  created() {
    setTimeout(this.sync, 125);
    bus.$on("update-condition", data => {
      const {parents, type} = data;
      if (type === this.type) {
        this.ruleSet.updateCondition(data, parents);
      }
    });
  }

  async sync() {
    this.buildOptionGroups();
    setTimeout(this.syncRules, 125);
  }

  buildOptionGroups() {
    const bm = new BuildCompatibilityOptions(this.type, this.dictionary);
    this.optionGroups = bm.groups();
  }

  syncScores(init = false) {
    const keys = Object.keys(this.scoreSet);
    this.categoryOpts.forEach((opt) => {
      const { key } = opt;
      if (keys.indexOf(key) < 0) {
        this.scoreSet[key] = 0;
      }
    });
    this.categoryMaxScore = this.matchMaxScore();
    if (init) {
      setTimeout(() => {
        this.initialised = true;
        this.showSaveRule = true;
        this.matchSavedRuleId();
      }, 250);
    }
  }

  syncRules() {
    fetchPredictiveRuleSets(this.user._id).then(results => {
      if (results instanceof Array && results.length > 0) {
        this.ruleSets = results.filter(row => row.type === this.type).map(row => new RuleSet(row));
      } else {
        this.ruleSets = [this.newRuleSet()];
      }
      setTimeout(() =>{
        this.syncRule(true);
      }, 500);
    })
  }

  syncRule(init = false) {
    this.ruleId = this.ruleSet._id;
    this.ruleName = this.ruleSet.name;
    this.ruleText = this.ruleSet.text;
    this.ruleNotes = this.ruleSet.notes;
    this.conditionSet = this.ruleSet.conditionSet;
    this.scores = this.ruleSet.scores;
    this.active = this.ruleSet.active;
    this.categoryOpts.forEach(opt => {
      const row = this.scores.find(sc => sc.key === opt.key);
      if (row instanceof Object) {
        const { value } = row;
        this.scoreSet[opt.key] = value;
      }
    });
    this.syncScores(init);
    if (this.conditionSet.conditionRefs.length > 0) {
      setTimeout(this.checkMatches, 500);
    }
  }



  get ruleOptions() {
    const ruleOpts = this.ruleSets.filter(r => r.type === this.type).map((item, index) => {
      const {_id, name, type } = item;
      const itemKey = [_id, type, index].join('-');
      return {_id, name, type, itemKey }
    });
    return [{ _id: "", type: this.type, name: "New", itemKey: "new-rule-set"},  ...ruleOpts];
  }

  get title() {
    const defTitle = "Predictive Protocol";
    switch (this.type) {
      case "sarvatobhadra":
        return `${defTitle} for Sarvatobhadra`;
      default:
        return "Predictive Protocol";
    }
  }

  get ruleSet(): RuleSet {
    return this.ruleIndex >=0 && this.ruleIndex < this.ruleSets.length? this.ruleSets[this.ruleIndex] : this.newRuleSet();
  }

  matchMaxScore(): number {
    return this.categoryOpts.length > 0 ? this.categoryOpts[0].maxScore : 10;
  }

  newRuleSet(): RuleSet {
    return new RuleSet({
      conditionSet: new ConditionSet(new Condition())
    });
  }

  addRuleSet() {
    this.ruleSets.push(this.newRuleSet());
    this.ruleIndex = this.ruleSets.length - 1;
  }

  addScoreCategory() {
    if (this.addCategoryMode) {
      if (this.newCategory.length > 1) {
        const key = sanitize(this.newCategory, '_');
        const currCatIndex = this.categoryOpts.findIndex(cat => cat.key === key);
        if (currCatIndex < 0) {
          const category = {
            key,
            name: this.newCategory,
            value: 0,
            maxScore: this.categoryMaxScore,
          }
          this.categoryOpts.push(category);
          this.syncScores();
        }
      }
      this.addCategoryMode = false;
    } else {
      this.addCategoryMode = true;
    }
  }

  hideMaxScore() {
    this.showMaxScore = false;
  }

  editMaxScore() {
    this.showMaxScore = true;
  }

  get chartModeItems() {
    switch (this.type) {
      case "sarvatobhadra":
      case "kota":
      case "chandra_kalanala":
      case "shula":
        return [];
      case "caughadia":
        return [
          { key: "caughadia", name: "Caughaḍiyā"},
        ];
      case "panchapakshi":
        return [
          { key: "panchapakshi", name: "Pañca Pakṣi"},
          { key: "transit", name: "Transition (transit)"},
          { key: "birth", name: "Transition (natal)"}
        ];
      default:
        return [
        { key: "", name: "Orient from" },
        { key: "level_1", name: "Mahadaśa of"},
        { key: "level_2", name: "Antardaśa of"},
        { key: "level_3", name: "Pratyantardaśa of"},
        { key: "transit", name: "Transit of"},
        { key: "birth_asc", name: "Birth lagna"},
        /* { key: "mt_transit", name: "MT Transit of"}, */
        /* { key: "progression", name: "Progression of"},
        { key: "p1_progress", name: "P1 Progress of"},
        { key: "p2_progress", name: "P2 Progress of"},
        { key: "p3_progress", name: "P3 Progress of"},
        { key: "dasha_point", name: "DaśaPoint of"},
        { key: "f_dashaPoint", name: "F. DaśaPoint (Mo) of"},
        { key: "f_dasha_point_as", name: "F. DaśaPoint (As) of"},
        { key: "f_dasha_point_su", name: "F. DaśaPoint (Su) of"},
        { key: "f_dasha_point_ma", name: "F. DaśaPoint (Ma) of"},
        { key: "f_dasha_point_me", name: "F. DaśaPoint (Me) of"},
        { key: "f_dasha_point_ju", name: "F. DaśaPoint (Ju) of"},
        { key: "f_dasha_point_ve", name: "F. DaśaPoint (Ve) of"},
        { key: "f_dasha_point_sa", name: "F. DaśaPoint (Sa) of"},
        { key: "f_dasha_point_ra", name: "F. DaśaPoint (Ra) of"},
        { key: "f_dasha_point_ke", name: "F. DaśaPoint (Ke) of"}, */
      ];
    }
  }

  get secondaryFilterOpts() {
    switch (this.type) {
      case "sarvatobhadra":
        return [
          { key: "", name: "Vedha..." },
          { key: "left", name: "Left" },
          { key: "right", name: "Right" },
          { key: "ahead", name: "Ahead" }
        ];
      default:
        return [];
    }
  }

  isDoubleMode() {
    switch (this.type) {
      case "caughadia":
        return false;
      default:
        return true;
    }
  }

  get chartModeOpts() {
    return this.chartModeItems.map(row => {
      return { ...row, single: true, double: this.isDoubleMode() };
    });
  }

  getCategoryOptions(category: string): Array<KeyName> {
    let opts = [];
    const optGroup = this.optionGroups.find((og) => og.key === category);
    if (optGroup) {
      opts = optGroup.options;
    }
    return opts;
  }

  // Called when condition is updated or loaded
  currentRuleIsValid() {
    if (this.ruleSet.isValid && this.ruleSet.conditionSet.conditionRefs.length > 0) {
      return this.ruleSet.conditionSet.conditionRefs.every(cr => cr.isValid);
      //return true;
    } else {
      return false;
    }
  }

  getDashaSystemOptions() {
    return dashaSystemKeySets.map(row => mapDashaSystemOption(row, this.dictionary)).map(row => {
      return {...row, charts: [1, 2], isKuta: false, c2groups: ["all"], isAspect: false, isDasha: true }
    })
  }

  checkMatches() {
    
    if (this.hasRuleId) {
      fetchGeo((data) => {
        if (data instanceof Object && !this.checking) {
          const { latitude, longitude } = data;
          this.checking = true;
          fetchPredictiveMatches(this.ruleId, this.chartId, latitude, longitude).then(result => {
            if (result.valid && result.matches) {
              const offset = getGeoTzOffset();
              this.matches = [{
                start: julToLongDate(result.start, offset),
                end: julToLongDate(result.end, offset),
              }];
            } else {
              this.matches = [];
            }
            this.checking = false;
          });
        }
    });
    }
  }

  get contextOpts() {
    switch (this.type) {
      case 'transit':
        //return [...contextTypes, ...this.getDashaSystemOptions()]
        return contextTypes;
      case 'sarvatobhadra':
        return [
          { key: "", name: "Graha movement..." },
        {
            key: "highspeed",
            name: "High Speed",
        },
        {
          key: "direct",
          name: "Direct",
        },
        {
          key: "retrograde",
          name: "Retrograde",
        }
      ].map(this.mapContext);
      case 'kota':
        return [{
          key: "direct",
          name: "Direct",
        }].map(this.mapContext);
      case "chandra_kalanala":
        return [
          { key: "", name: "In Chakra..." },
          { key: "trident", name: "on Trident" },
          { key: "outside", name: "outside circle" },
          { key: "inside", name: "inside circle" },
        ].map(this.mapContext);
      case "shula":
        return [
          { key: "", name: "In Chakra..." },
          { key: "trident", name: "on Trident" },
          { key: "next", name: "Next to Trident" },
          { key: "elsewhere", name: "Elsewhere" },
        ].map(this.mapContext);
      case "panchapakshi":
        return [
          { key: "action_eats", name: "eats" },
          { key: "action_walks", name: "walks" },
          { key: "action_rules", name: "rules" },
          { key: "action_sleeps", name: "sleeps" },
          { key: "action_dies", name: "dies" },
          { key: "action_is_ruling", name: "Is ruling on day?" },
          { key: "action_is_dying", name: "Is dying on day?" },
          { key: "as", name: "Ascending (ASC)" },
          { key: "mc", name: "Highest (MC)" },
          { key: "ds", name: "Descending (DSC)" },
          { key: "ic", name: "Lowest (IC)" },
          { key: "dik_bala_transition", name: "Has Dik Bala (DK) Transition" },
          { key: "dasha_lord", name: "is Daśa Lord" },
          { key: "antardasha_lord", name: "is Antardaśa lord" },
          { key: "yoga_karaka", name: "is YogaKaraka" },
          { key: "lord_5_9", name: "is 9th or 5th lord" },
          { key: "lord_1_4_7_10", name: "is 1st, 4th, 7th or 10th lord" },
          { key: "lord_6_8_12", name: "is 6th, 8th or 12th lord" },
          { key: "yogi_graha", name: "is Yogi Graha" },
          { key: "avayogi_graha", name: "is AvaYogi Graha" },
        ].map(this.mapContext);
      case "caughadia":
        return [
          { key: "any_below", name: "is not any BELOW" },
          { key: "not_rahu_kala", name: "is not Rāhu Kāla" },
          { key: "rahu_kala", name: "is Rāhu Kāla" },
          { key: "not_gulika_kala", name: "is not Gulika kāla" },
          { key: "gulika_kala", name: "is Gulika kāla" },
          { key: "not_yamaghanta_kala", name: "is not Yamaghaṇṭa kāla" },
          { key: "yamaghabta_kala", name: "is Yamaghaṇṭa kāla" },
        ].map(this.mapContext);
      default:
        return contextTypes;
    }
  }

  get secondaryKeyOpts() {
    switch (this.type) {
      case "kota":
        return [
          { key: "", name: "In Kota Chakra..." },
          { key: "stambha", name: "stambha (inner)" },
          { key: "madhya", name: "madhya (inner-middle)" },
          { key: "prakara", name: "prākāra (boundary wall)" },
          { key: "bahya", name: "bāhya	(exterior)" },
          { key: "entry", name: "entry route" },
         /*  { key: "ne_entry", name: "NE entry route" },
          { key: "se_entry", name: "SE entry route" },
          { key: "sw_entry", name: "SW entry route" },
          { key: "se_entry", name: "SE entry route" }, */
          { key: "exit", name: "exit route" },
        /*   { key: "e_exit", name: "E exit route" },
          { key: "s_exit", name: "S exit route" },
          { key: "w_exit", name: "W exit route" },
          { key: "n_exit", name: "N exit route" }, */
        ];
      default:
        return [];
    }
  }

  mapContext(item) {
    const {key, name} = item;
    return {key, name, isKuta: false, c2groups: ["all"], charts: [1, 2]}
  }

  get defaultScoreOpts() {
    return [{ 
      key: "generic",
      name: "Generic",
      value: 0,
      maxScore: 10
    }]
  }

  get categoryOpts() {
    const { scores } = this.ruleSet;
    return scores.length > 0? scores : this.defaultScoreOpts;
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
    const cls = [this.type.split('_').join('-')];
    return cls;
  }

  get hasRuleId() {
    return notEmptyString(this.ruleId, 12);
  }

  get hasConditions() {
    return this.conditionSet.length > 0;
  }

  get hasMatches() {
    return this.matches.length > 0;
  }

  get conditionRefs() {
    return this.conditionSet.conditionRefs;
  }

  get lastConditionIndex() {
    return this.conditionRefs.length - 1;
  }

  get scoreRows() {
    const keys = Object.keys(this.scoreSet);
    return this.scores.map(row => {
      const value = keys.includes(row.key)? this.scoreSet[row.key] : row.value;
      const item = this.categoryOpts.find(ct => ct.key === row.key);
      const name = item instanceof Object? item.name : row.name;
      return {...row, value: parseInt(value), name };
    });
  }

  get currentTotal() {
    return this.scoreRows.length > 0
      ? this.scoreRows.map((sc) => sc.value).reduce((a, b) => a + b, 0)
      : -1;
  }

  get totalMax() {
    return this.scoreRows.length > 0
      ? this.categoryOpts.map((sc) => sc.maxScore).reduce((a, b) => a + b, 0)
      : -1;
  }

  get currentTotalDisplay() {
    return this.currentTotal < 0 ? "" : [this.currentTotal.toString(), this.totalMax].join(" / ");
  }

  get tempKey() {
    return ['predictive', this.type, "rule"].join("_");
  }

  get hasErrors() {
    return this.errors.length > 0;
  }

  renderCategory(opt: KeyNameMax) {
    return `${opt.name} (${opt.maxScore})`;
  }


  buildSaveRuleSet(cloned = false) {
    if (cloned) {
      setTimeout(() =>{
        this.ruleId = 'cloned';
      }, 250);
    }
    const _id = cloned ? 'cloned' : this.ruleId;
    const name = cloned ? [this.ruleName.split('(').shift(), '(copy)'].join(' ') : this.ruleName;
    return new RuleSet({ 
      _id,
      name,
      type: this.type,
      notes: this.ruleNotes,
      text: this.ruleText,
      conditionSet: this.conditionSet,
      scores: this.scoreRows,
    },this.scoreRows.map(ct => {
      const {key, name, maxScore} = ct;
      return {key, name, maxScore }
    }));
  }


  cloneRule() {
    if (notEmptyString(this.ruleName, 1)) {
      const ruleSet = this.buildSaveRuleSet(true);
      this.ruleSets.push(ruleSet);
    }
  }

  validateRuleSet() {
    this.errors = [];
    const validRule = this.currentRuleIsValid();
    if (!validRule) {
      this.errors.push("Please add at least one condition");
    }
    if (this.ruleName.length < 2) {
      this.errors.push("Please add a name");
    }
    if (this.ruleText.length < 2) {
      this.errors.push("Please add some text");
    }
    return this.errors.length < 1;
  }

  saveRuleSet() {
    this.$ls.set(this.tempKey, this.ruleSet);
    const ruleSet = this.buildSaveRuleSet();
    if (this.validateRuleSet()) {
      savePredictiveRuleSet({
        ...ruleSet,
        user: this.user._id,
        active: this.active,
      }, this.ruleId).then(result => {
        if (result instanceof Object) {
          if (result.valid) {
            const { item } = result;
            let index = this.ruleSets.findIndex(rule => rule._id === item._id);
            if (index < 0) {
              index = this.ruleSets.findIndex(rule => rule._id === 'cloned');
            }
            if (index < 0) {
              this.ruleSets.push(new RuleSet(item));
            } else {
              this.ruleSets[index]._id = item._id;
            }
            setTimeout(() => {
              this.ruleId = item._id;
            }, 125);
            this.saveDefaultPredictiveIds();
            this.checkMatches();
          }
        }
      })
    }
  }

  handleDelete() {
    if (notEmptyString(this.ruleId, 12)) {
      this.$buefy.dialog.confirm({
        message: `Are you sure you wish to delete the rule "${this.ruleName}" for `,
        cancelText: "Keep",
        confirmText: "Delete",
        type: "is-danger",
        onConfirm: () => this.deleteRule(),
      });
    } else {
      const newIndex = this.ruleIndex > 1? this.ruleIndex - 1 : 0;
      this.removeRule(newIndex);
    }
  }

  deleteRule() {
    const newIndex = this.ruleIndex > 1? this.ruleIndex - 1 : 0;
    deletePredictiveRuleSet(this.user._id, this.ruleId).then(result => {
      if (result.deleted) {
      this.ruleSets.splice(this.ruleIndex, 1);
        this.removeRule(newIndex);
      }
    })
  }

  removeRule(newIndex = 0) {
    this.ruleSets.splice(this.ruleIndex, 1);
    if (newIndex < this.ruleSets.length) {
      this.ruleId = this.ruleSets[newIndex]._id;
    }
  }

  saveDefaultPredictiveIds() {
    const stored = this.$ls.get("predictive-protocol-ids");
    const map: Map<string, string> = new Map();
    if (stored instanceof Object) {
      Object.entries(stored).forEach(entry => {
        const [k, v] = entry;
        if (typeof v === "string") {
          map.set(k, v);
        }
      });
    }
    map.set(this.type, this.ruleId);
    this.$ls.set("predictive-protocol-ids", Object.fromEntries(map.entries()));
  }

  matchSavedRuleId() {
    const stored = this.$ls.get("predictive-protocol-ids");
    if (stored instanceof Object) {
      const keys = Object.keys(stored);
      if (keys.includes(this.type)) {
        this.ruleId = stored[this.type];
        this.ruleIndex = this.ruleSets.findIndex(rs => rs._id === this.ruleId);
      }
    }
  }

  close() {
    bus.$emit("close-overlay");
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
    this.scores = this.ruleSet.setScores(this.scoreSet, this.categoryOpts);
  }

  @Watch("ruleId")
  changeRuleId() {
    this.switching = true;
    this.ruleIndex = this.ruleSets.findIndex(r => r._id === this.ruleId);
    setTimeout(() =>{
      this.syncRule(false);
    }, 125);
    setTimeout(() =>{
      this.switching = false;
      this.saveDefaultPredictiveIds();
    }, 250);
  }

  @Watch("ruleName")
  changeRuleName(newVal) {
    this.ruleSet.setName(newVal);
    if (newVal.length > 1) {
      this.validateRuleSet();
    }
  }

  @Watch("ruleText")
  changeRuleText(newVal) {
    this.ruleSet.setText(newVal);
    if (newVal.length > 1) {
      this.validateRuleSet();
    }
  }

  @Watch("ruleNotes")
  changeRuleNotes(newVal) {
    this.ruleSet.setNotes(newVal);
  }

  @Watch("type")
  changeType() {
    this.sync();
  }
}
</script>
<style lang="scss">
@import "@/styles/variables.scss";

#main .predictive-pane {
  position: relative;
  .edit-form {
    position: absolute;
    top: 0;
    left: 0%;
    right: 0%;
    @media (min-width: $min-mlarge-width) {
      left: 2.5%;
      right: 2.5%;
    }
    @media (min-width: $min-large-width) {
      left: 5%;
      right: 5%;
    }
    @media (min-width: $min-xlarge-width) {
      left: 10%;
      right: 10%;
    }
    background-color: white;
    z-index: 200;
    opacity: 0;
    pointer-events: none;
    padding: 1em;
    .rule-sets-widget {
      padding: 1em;
    }
  }

  .actions {
    padding: 0.5em 1em;
    .field,
    .control,
    button {
      margin-right: 0.5em;
    }
  }

  &.show-form {
    .edit-form {
      opacity: 1;
      pointer-events: all;
    }
    .close {
      position: absolute;
      top: 1em;
      right: 0.5em;
      z-index: 240;
    }
  }
  .notes-scores {
    display: grid;
    padding: 1em;
    grid-template-columns: 3fr 1fr;
    textarea {
      width: 100%;
    }
  }
  .overlay-title {
    font-size: 1.25em;
    font-weight: bold;
    text-align: left;
  }
  .rule-sets-widget .condition-set .condition-selector {
    flex-flow: row wrap;
    padding-left: 1.5em;
  }

  .text-scores-container {
    display: grid;
    grid-template-columns: 3fr 1fr;
    padding: 1em;
  }
  .vertical.score-sets {
    display: flex;
    flex-flow: column wrap;
    align-items:flex-end;
    .total {
      width: 4em;
    }
  }
  .integer {
    input {
      max-width: 4.5em;
    }
  }
  .results {
    text-align: left;
    padding: 0.25em 0;
    > p, > ul {
      padding-top: 0.25em;
      border-top: dashed 0.5px $blue; 
    }
    li {
      em {
        display: inline-block;
        &.start::after {
          position: relative;
          margin: 0 0.5em;
          content: "－";
        }
      }
    }
  }
} 
</style>