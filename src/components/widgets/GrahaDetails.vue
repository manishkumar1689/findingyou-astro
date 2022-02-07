<template>
  <div class="inner">
    <h2 :title="variantNames(body.key)">{{ grahaTerm(body.key) }}</h2>
    <p>
      <span class="text">Longitude</span>
      <degree
        :deg="body.longitude"
        :precision="0"
        :decimals="6"
        classes="value longitude"
      />
    </p>
    <p v-if="showPlanetFields">
      <span class="text">Latitude</span>
      <degree
        :deg="body.lat"
        :precision="0"
        :decimals="6"
        classes="value latitude"
      />
    </p>
    <p v-if="showPlanetFields > 0">
      <span class="text">Declination</span>
      <degree
        :deg="body.declination"
        :precision="0"
        :decimals="6"
        classes="value latitude"
      />
    </p>
    <p v-if="showPlanetFields">
      <span class="text">Speed</span>
      <degree
        :deg="body.lngSpeed"
        :precision="0"
        :decimals="6"
        classes="value speed"
      />
    </p>
    <p v-if="hasCharaKaraka">
      <span class="text">Chara karaka</span>
      <strong class="value" :title="ckFull(body.charaKaraka)">{{
        ckAbbr(body.charaKaraka)
      }}</strong>
    </p>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import { Graha } from "../../api//models/Graha";
import Degree from "../widgets/Degree.vue";
import SignDegree from "../widgets/SignDegree.vue";
import { toWords } from "../../api/helpers";
import { DictionaryState } from "../../store/types";
import { notEmptyString, isNumeric } from "../../api/validators";
import { LtDvPair, AyanamshaItem } from "../../api/interfaces";

@Component({
  filters: {
    ...FilterSet,
    relationshipOwnSign(body: Graha) {
      let rel = toWords(body.relationship);
      if (rel.length < 2 && body.isOwnSign) {
        rel = "own sign";
      }
      return rel;
    },
  },
  components: {
    Degree,
    SignDegree,
  },
})
export default class GrahaDetails extends Vue {
  @Prop({ default: () => new Graha(null) }) body: Graha;
  @Prop({
    default: () => {
      return { num: 0, key: "", name: "", value: 0 };
    },
  })
  ayanamsha: AyanamshaItem;
  @State("dictionary") dictionary: DictionaryState;

  grahaName(key: string) {
    let str = key;
    const lex = this.dictionary.graha(key);
    if (lex) {
      str = lex.text("en", "standard");
    }
    return str;
  }

  grahaTerm(key: string) {
    let str = key;
    const lex = this.dictionary.graha(key);
    if (lex) {
      str = lex.text("en");
      if (lex.lang == "sa" && lex.hasOriginal()) {
        str += ` (${lex.original})`;
      }
    }
    return str;
  }

  variantNames(key: string) {
    let str = this.grahaName(key);
    const lex = this.dictionary.graha(key);
    if (lex) {
      const pairs = lex.variantPairs("sa");
      if (pairs.length > 0) {
        str += " / " + pairs.map((p) => `${p.lt} (${p.dv})`).join(", ");
      }
    }
    return str;
  }

  get showPlanetFields(): boolean {
    return ["as", "ke", "ra"].includes(this.body.key) === false;
  }

  get hasCharaKaraka(): boolean {
    return this.body.charaKaraka > 0;
  }

  charaKarakaLex(charaNum = 0) {
    let out = null;
    if (charaNum > 0) {
      const { charaKaraka } = this.body;

      const lex = this.dictionary.lexeme(
        "graha",
        ["karaka_chara", charaNum].join("_")
      );
      out = lex;
    }
    return out;
  }

  ckFull(charaNum = 0) {
    let str = "";
    const lex = this.charaKarakaLex(charaNum);
    if (lex) {
      str = lex.name;
      if (notEmptyString(lex.original)) {
        str += " / " + lex.original;
      }
    }
    return str;
  }

  ckAbbr(charaNum = 0) {
    let str = "";
    const lex = this.charaKarakaLex(charaNum);
    if (lex) {
      str = lex.text("sa", "short", "lt");
    }
    return str;
  }
  @Watch("ayanamsha")
  changeAyanamshaItem(newVal) {
    this.body.setAyanamshaItem(newVal);
    this.$forceUpdate();
  }
}
</script>
