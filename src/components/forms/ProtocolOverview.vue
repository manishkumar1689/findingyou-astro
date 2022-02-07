<template>
  <fragment>
    <form class="edit-form compability-overview">
      <header class="section top vertical">
        <h2>Full Synthesis of Compatibility Protocol</h2>
        <div class="top-bar horizontal">
          <slot></slot>
          <b-field class="horizontal">
            <b-input
              type="text"
              v-model="name"
              placeholder="Name"
              title="Protocol Name"
            />
          </b-field>
          <b-button
            type="is-success"
            icon-left="content-save"
            class="save"
            @click="saveContextual"
            >{{ saveLabel }}</b-button
          >
          <b-checkbox class="clone-protocol" v-if="hasId" v-model="cloneMode"
            >Clone</b-checkbox
          >
          <b-button
            type="is-danger"
            icon-left="trash-can-outline"
            @click="promptDelete"
            >Delete</b-button
          >
        </div>
      </header>
      <div class="section main columns-2">
        <fieldset
          class="column top left collection-percents"
          :class="percentClasses"
        >
          <b-field
            v-for="(type, ti) in types"
            :key="['collection-type', ti].join('-')"
          >
            <b-switch
              @change.native="changeEqualPercents(equalPercents)"
              v-model="type.enabled"
              type="is-success"
              >{{ type.name }}</b-switch
            >
            <b-slider
              type="is-primary"
              v-model="type.percent"
              :min="0"
              :max="100"
              :step="categoryStep"
              :disabled="fixedType(type)"
              :class="typeClasses(type)"
              :custom-formatter="roundPercent"
              @change="changePercent(type)"
            >
              <b-slider-tick :value="0">0%</b-slider-tick>
              <b-slider-tick :value="50">50%</b-slider-tick>
              <b-slider-tick :value="100">100%</b-slider-tick>
            </b-slider>
            <strong @click="toggleLock(type)" class="percent">{{
              type.percent | percDec2
            }}</strong>
          </b-field>
          <b-checkbox
            icon-left="equal-box"
            v-model="equalPercents"
            class="equal"
            >Equalize</b-checkbox
          >
          <b-field label="Number of paired charts to analyse">
          <b-slider :min="0" :max="maxPcLimitStepIndex" v-model="pcLimitIndex" aria-label="Number of paired charts" :tooltip="false">
              <b-slider-tick v-for="(stepValue, stepIndex) in pcLimitSteps" :key="['limit-step', stepValue, stepIndex].join('-')" :value="stepIndex">{{stepValue}}</b-slider-tick>
          </b-slider>
      </b-field>
        </fieldset>
        <fieldset class="column bottom left">
          <legend>Settings</legend>
          <b-field class="vertical sidereal-tropical">
            <div class="options vertical">
              <b-radio
                v-model="offsetMode"
                name="offsetMode"
                native-value="sidereal"
                >Sidereal Rāśis and Nakṣatras</b-radio
              >
              <b-radio
                v-model="offsetMode"
                name="offsetMode"
                native-value="mixed"
                >Tropical Rāśis and Sidereal Nakṣatras</b-radio
              >
            </div>
            <b-select v-model="ayanamsha">
              <option
                v-for="(ayaOpt, ai) in ayanamshaOpts"
                :key="['ayanamsha-opt', ayaOpt.key, ai].join('-')"
                :value="ayaOpt.key"
              >
                {{ ayaOpt.name }}
              </option>
            </b-select>
          </b-field>
          <b-field class="vertical whole-signs">
            <div class="options vertical">
              <div
                v-for="(setting, si) in aspectConfigOpts"
                :key="['aspect-config', si].join('-')"
                class="item"
              >
                <b-radio
                  v-model="aspectMode"
                  name="aspectMode"
                  :native-value="setting.key"
                  >{{ setting.name }}</b-radio
                >
                <template v-if="aspectMode === setting.key">
                  <b-checkbox
                    v-for="(subOpt, soi) in setting.options"
                    :key="['aspect-config', si, soi].join('-')"
                    v-model="subAspectModes[subOpt.key]"
                    @change.native="checkCustomOrbs"
                    class="indented"
                    >{{ subOpt.name }}</b-checkbox
                  >
                </template>
              </div>
            </div>
          </b-field>
        </fieldset>
        <fieldset class="column mid left">
          <legend>All Charts with Current Protocol</legend>
          <div class="column vertical"></div>
        </fieldset>
        <fieldset class="column bottom left">
          <legend>Score Categories from this protocol</legend>
          <div class="column vertical categories-list">
            <b-field
              v-for="(cat, ci) in categories"
              :key="['compatiblity-category', cat.key, ci].join('-')"
              :class="categoryRowClasses(ci)"
            >
              <b-input
                type="text"
                v-model="cat.name"
                :title="cat.key"
                placeholder="Display name"
                class="name"
              />
              <b-input
                type="number"
                v-model="cat.maxScore"
                placeholder="Max score"
                :min="4"
                :max="100"
                class="max"
              />
              <b-button
                v-if="ci > 0"
                icon-left="minus"
                @click.stop="removeCategory(ci)"
              />
            </b-field>
            <b-button icon-left="plus" @click.stop="addCategory"
              >Add category</b-button
            >
          </div>
        </fieldset>
        <fieldset v-if="showCustomOrbs" class="column bottom left">
          <legend>Custom Orbs</legend>
          <b-table :data="customOrbs" class="custom-orbs" :mobile-cards="false">
            <template slot-scope="props">
              <b-table-column class="graha" :class="props.row.key" field="key">
                <i class="icon" :class="props.row.key | toGrahaClass"></i>
              </b-table-column>
              <b-table-column
                v-for="(aspect, ai) in props.row.orbs"
                :key="['aspect-orb', aspect.key, ai].join('-')"
                :class="aspect.key"
                :field="aspect.key"
                :label="aspect.key"
              >
                <template v-slot:header="{ column }">
                  <i class="icon" :class="['icon', column.label].join('-')"></i>
                </template>
                <b-input
                  type="text"
                  pattern="[0-9](\.[0-9]+)"
                  :min="0"
                  :max="30"
                  :maxlength="4"
                  :has-counter="false"
                  v-model="customOrbs[props.index].orbs[ai].value"
                />º
              </b-table-column>
            </template>
          </b-table>
        </fieldset>
      </div>
    </form>

    <div class="results"></div>
  </fragment>
</template>

<script lang="ts">
import { State, Action, Getter } from "vuex-class";
import { Component, Prop, Watch, Vue } from "vue-property-decorator";
import { notEmptyString, isNumeric, emptyString } from "../../api/validators";
import { bus } from "../../main";
import {
  sanitize,
} from "../../api/converters";
import {
  DictionaryState,
  SettingState,
  UserState,
} from "../../store/types";
import grahaValues from "../../api/mappings/graha-values";
import { FilterSet } from "../../api/composables/FilterSet";
import {
  CustomOrbRow,
  KeyNameMax,
} from "../../api/interfaces";
import { Protocol, RulesCollection } from "../../api/models/Condition";
import {
  defaultCompatibilityCategoryOpts,
  pairedChartRatings,
  aspectConfigOptions,
} from "../../api/mappings/compatibility-sets";
import ayanamshaValues from "../../api/mappings/ayanamsha-values";

interface CollectionType {
  key: string;
  name: string;
  percent?: number;
  enabled?: boolean;
}

@Component({
  components: {},
  filters: FilterSet,
})
export default class ProtocolOverview extends Vue {
  @Prop({ default: () => new Protocol() })
  readonly protocol: Protocol;
  @State("dictionary") dictionary: DictionaryState;
  @State("user") user: UserState;
  @State("settings") settings: SettingState;

  private categories: Array<KeyNameMax> = [];

  private types: Array<CollectionType> = [];

  private lockedTypeKeys: Array<string> = [];

  private name = "";

  private changing = false;

  private equalPercents = false;

  // Toggles ayanamsha mode. If tropical ayanamsha mode is tropical
  // and thus set to zero. If sidereal, editors may choose an offset
  private offsetMode = "sidereal";

  private ayanamsha = "true_citra";

  private aspectMode = "whole_sign";

  private subAspectModes: any = {};

  private showCustomOrbs = false;

  private customOrbs: Array<CustomOrbRow> = [];

  private cloneMode = false;

  private pcLimitIndex = 3;

  private pcLimitSteps = [
    100,
    250,
    500,
    1000,
    5000,
    10000,
    50000
  ];

  created() {
    //this.sync();
    setTimeout(() => {
      this.sync();
    }, 500);
  }

  mounted() {
    this.sync();
  }

  async sync() {
    this.name = this.protocol.name;
    this.categories = this.protocol.categories.map((c) => {
      const { key, name } = c;
      let { maxScore } = c;
      if (typeof maxScore !== "number") {
        maxScore = 10;
      }
      return {
        key,
        name,
        maxScore,
      };
    });
    if (this.protocol.categories.length < 1 && defaultCompatibilityCategoryOpts.length > 0) {
      this.categories = defaultCompatibilityCategoryOpts.slice(0, 1);
    }
    this.types = this.typeList.map((tp) => {
      const collection = this.protocol.collections.find(
        (c) => c.type === tp.key
      );
      let percent = 0;
      let enabled = false;
      if (collection) {
        enabled = true;
        percent = collection.percent;
      }
      return { ...tp, percent, enabled };
    });
    for (const entry of this.protocol.settings.entries()) {
      const [key, value] = entry;
      this[key] = value;
    }
    this.offsetMode = this.ayanamsha === "tropical" ? "tropical" : "sidereal";

    this.aspectConfigOpts.forEach((aspOpt) => {
      if (aspOpt.options instanceof Array) {
        aspOpt.options.forEach((subOpt) => {
          const v = this.protocol.settings.get(subOpt.key);
          this.subAspectModes[subOpt.key] = v === true;
        });
      }
    });
    this.buildCustomOrbGrid();
    this.checkCustomOrbs();
  }

  get typeList() {
    return [
      //{ key: "rel_potential", name: "Rel. Potential" },
      //{ key: "similarities", name: "Similarities" },
      { key: "mirroring", name: "Mirroring" },
      { key: "synastry", name: "Synastry" },
      { key: "composite", name: "Composite" },
      { key: "kutas", name: "Kūṭas" },
      //{ key: "dashas", name: "Daśas" },
      //{ key: "ashtavarga", name: "Aṣṭakāvarga" },
    ];
  }

  get maxPcLimitStepIndex() {
    return this.pcLimitSteps.length - 1;
  }

  buildCustomOrbGrid() {
    const aspects = [
      "conjunction",
      "semi-sextile",
      "sextile",
      "square",
      "trine",
      "inconjunction",
      "opposition",
      "parallel",
      "contra-parallel",
    ];
    const grahaKeys = grahaValues.map((gv) => gv.key);
    const mapAspects = (key) => {
      return {
        key,
        value: 1,
      };
    };
    const currVal = this.protocol.settings.get("customOrbs");
    const hasCustomOrbs = currVal instanceof Array && currVal.length > 0;

    this.customOrbs = grahaKeys.map((gk, ri) => {
      const row = hasCustomOrbs ? currVal.find((r) => r.key === gk) : null;
      const orbs =
        row instanceof Object && row.orbs.length > 0
          ? row.orbs
          : aspects.map(mapAspects);
      return {
        key: gk,
        orbs,
      };
    });
  }

  get saveLabel() {
    return this.cloneMode ? "Clone" : "Save";
  }

  get ayanamshaOpts() {
    const first = { key: "-", name: "Select ayanamsha...", value: 0 };
    return [first, ...ayanamshaValues];
  }

  get aspectConfigOpts() {
    return aspectConfigOptions;
  }

  get pairedOpts() {
    return pairedChartRatings;
  }

  get hasId() {
    return notEmptyString(this.protocol._id, 12);
  }

  get id() {
    return this.hasId ? this.protocol._id : "";
  }

  get categoryStep() {
    return this.equalPercents ? 0.01 : 0.25;
  }

  get percentClasses() {
    return this.equalPercents ? "equal" : "custom";
  }

  checkCustomOrbs() {
    const customOrbEntry = Object.entries(this.subAspectModes).find(
      (entry) => entry[0] === "custom_orbs"
    );
    let valid = false;
    if (customOrbEntry instanceof Array) {
      valid = customOrbEntry[1] === true;
    }
    this.showCustomOrbs = valid;
  }

  save() {
    /* this.protocol.categories = this.categories
    .filter((c) => c.key.length > 2 && c.name.length > 2)
    .map((c) => {
      if (typeof c.maxScore === "string") {
        c.maxScore = parseInt(c.maxScore);
      }
      return c;
    }); */
    this.types.forEach((type) => {
      const collection = this.protocol.collections.find(
        (rs) => rs.type === type.key
      );
      const hasCollection = collection instanceof Object;
      if (hasCollection) {
        collection.percent = type.enabled ? type.percent : 0;
      }
      if (type.enabled && !hasCollection) {
        this.protocol.collections.push(
          new RulesCollection({
            type: type.key,
            percent: type.percent,
            rules: [],
          })
        );
      }
      if (emptyString(this.protocol.name)) {
        this.protocol.name = this.name;
      }
      const { name, notes, collections, userRecord } = this.protocol;
      const user = emptyString(userRecord._id, 12)
        ? this.user._id
        : userRecord._id;
      const keys = [];
      const settings = [];

      if (this.protocol.settings.has("pairedChartRating")) {
        settings.push({
          key: "pairedChartRating",
          value: this.protocol.settings.get("pairedChartRating"),
        });
      }

      if (this.offsetMode === "tropical") {
        this.ayanamsha = "tropical";
      } else if (this.ayanamsha.length < 4) {
        this.ayanamsha = "true_citra";
      }
      settings.push({ key: "ayanamsha", value: this.ayanamsha });
      settings.push({ key: "aspectMode", value: this.aspectMode });

      Object.entries(this.subAspectModes).forEach((entry) => {
        const [key, value] = entry;
        settings.push({ key, value, type: "string" });
      });

      if (this.showCustomOrbs) {
        settings.push({
          key: "customOrbs",
          value: this.customOrbs,
          type: "key_num_grid",
        });
      }
      const filteredCategories = this.categories
        .map((ct, ci) => {
          if (emptyString(ct.key, 4)) {
            ct.key = sanitize(ct.name);
            if (emptyString(ct.key, 2)) {
              ct.key = [ct.key, ci].join("_");
            }
          }
          return ct;
        })
        .filter(
          (ct) => ct.name.length > 2 && ct.key.length > 2 && ct.maxScore > 0
        );
      if (collections.length > 0) {
        const catKeys = filteredCategories.map(ct => ct.key);
        collections.forEach(col => {
          if (col.rules.length > 0) {
            col.rules.forEach(rule => {
              rule.scores = rule.scores.filter(sc => catKeys.includes(sc.key));
            });
          }
        });
      }
      const protocol = {
        user,
        name,
        notes,
        categories: filteredCategories,
        collections,
        settings,
      };
      this.protocol.categories = filteredCategories;
      bus.$emit("save-protocol", protocol);
      bus.$on("sync-protocol", this.sync);
    });
  }

  changePercent(type, roundMode = false) {
    if (!this.changing) {
      this.changing = true;
      setTimeout(() => {
        const { percent, key } = type;
        if (roundMode) {
          this.types = this.types.map((tp) => {
            if (!tp.enabled) {
              tp.percent = 0;
            }
            return tp;
          });
        }
        let total = this.types
          .filter((tp) => tp.enabled)
          .map((tp) => tp.percent)
          .reduce((a, b) => a + b, 0);
        if (total !== 100 || roundMode) {
          const percentLocked = roundMode
            ? 0
            : this.types
                .filter((tp) => this.isLocked(tp))
                .map((tp) => tp.percent)
                .reduce((a, b) => a + b, 0);

          const remainder = 100 - percent - percentLocked;
          const otherTotal = total - percent;
          const multiplier = remainder / otherTotal;
          let newOtherTotal = 0;
          type.percent = Math.floor(type.percent);
          this.types = this.types.map((tp) => {
            if (this.isLocked(tp) === false) {
              if (
                tp.enabled &&
                (tp.key !== key || roundMode) &&
                tp.percent > 0
              ) {
                tp.percent = Math.floor(tp.percent * multiplier);
                newOtherTotal += tp.percent;
              } else if (tp.key === key) {
                tp.percent = Math.floor(tp.percent);
              }
            }
            return tp;
          });
          if (newOtherTotal < remainder) {
            let numAdjusted = 0;
            this.types = this.types.map((tp) => {
              if (
                tp.enabled &&
                (roundMode || tp.key !== key) &&
                tp.percent > 0 &&
                numAdjusted < 1
              ) {
                if (this.isLocked(tp) === false) {
                  tp.percent += 1;
                  numAdjusted++;
                }
              }
              return tp;
            });
          }
          total = this.types.map((tp) => tp.percent).reduce((a, b) => a + b, 0);
          if (total !== 100) {
            const first = this.types.find((tp) => {
              return (
                tp.enabled && tp.key !== key && this.isLocked(tp) === false
              );
            });
            if (first) {
              const newVal = first.percent + 100 - total;
              first.percent = newVal < 0 ? 0 : newVal;
            }
          }
          total = this.types.map((tp) => tp.percent).reduce((a, b) => a + b, 0);
          if (total !== 100) {
            type.percent += 100 - total;
          }
        }
        setTimeout(() => {
          this.changing = false;
        }, 125);
      }, 125);
    }
  }

  isLocked(type) {
    return this.lockedTypeKeys.includes(type.key);
  }

  addCategory() {
    this.categories.push({
      key: "",
      name: "",
      maxScore: 10,
    });
  }
  removeCategory(index: number) {
    if (index >= 0 && index < this.categories.length) {
      this.categories.splice(index, 1);
    }
  }
  isNewCategory(ci) {
    return ci > this.protocol.categories.length - 1;
  }

  categoryRowClasses(ci) {
    const cls = [];
    if (this.isNewCategory(ci)) {
      cls.push("new-category");
    }
    return cls;
  }

  createNew() {
    bus.$emit("create-new-protocol", this.protocol);
  }

  saveContextual() {
    this.protocol.name = this.name;
    if (this.cloneMode) {
      this.createNew();
      this.cloneMode = false;
    } else {
      this.save();
    }
  }

  fixedType(type: CollectionType) {
    return type.enabled === false || this.equalPercents === true;
  }

  typeClasses(type: CollectionType) {
    const cls = [];
    if (type.enabled) {
      cls.push("active");
      if (this.isLocked(type)) {
        cls.push("locked");
      }
    }
    return cls;
  }

  toggleLock(type: CollectionType) {
    const keyIndex = this.lockedTypeKeys.indexOf(type.key);
    if (type.enabled) {
      if (keyIndex < 0) {
        this.lockedTypeKeys.push(type.key);
      } else {
        this.lockedTypeKeys.splice(keyIndex, 1);
      }
    }
  }

  promptDelete() {
    const message = `Are you sure you to delete ${this.name}`;
    this.$buefy.dialog.confirm({
      title: "Delete protocol",
      message,
      type: "is-danger",
      onConfirm: () => this.delete(),
    });
  }

  delete() {
    this.cloneMode = false;
  }

  roundPercent(v) {
    v = Math.round(v * 100) / 100;
    return v.toString();
  }

  @Watch("equalPercents")
  changeEqualPercents(newVal) {
    if (newVal === true) {
      const numEnabled = this.types.filter((tp) => tp.enabled).length;
      const pc = 100 / numEnabled;
      this.types = this.types.map((tp) => {
        tp.percent = tp.enabled ? pc : 0;
        return tp;
      });
    } else {
      const firstEnabled = this.types.find((tp) => tp.enabled);

      if (firstEnabled) {
        this.changing = false;
        this.changePercent(firstEnabled, true);
      }
    }
  }

  @Watch("protocol")
  changeProtocol() {
    this.sync();
  }

  @Watch("pcLimitIndex")
  changePcLimitIndex() {
    const pcSearchLimit = this.pcLimitIndex >= 0 && this.pcLimitIndex < this.pcLimitSteps.length ? this.pcLimitSteps[this.pcLimitIndex] : 1000;
    this.$ls.set("max-pc-limit", pcSearchLimit);
  }

  @Watch("offsetMode")
  changeOffsetMode(newVal) {
    switch (newVal) {
      case "tropical":
        this.ayanamsha = "-";
        break;
    }
  }
}
</script>
