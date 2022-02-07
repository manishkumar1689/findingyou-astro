<template>
  <fragment>
    <div
      v-for="(item, index) in signSets"
      class="sign"
      :class="signClassNames(index, 'sign')"
      :key="keyString(index, 'sign')"
      :style="item.style"
    >
      <i class="icon" :class="item.sign | toSignClass" :title="item.title"></i>
    </div>
    <div
      v-for="(item, gi) in grahas"
      :key="['graha', type, gi].join('-')"
      class="graha"
      :class="grahaClassNames(item)"
      :style="item.style"
    >
      <i class="icon" :class="item.graha.key | toGrahaClass"></i>
    </div>
  </fragment>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import { SignSet, GrahaStyle } from "../../api/interfaces";

@Component({
  filters: FilterSet,
  components: {}
})
export default class CakraSudarshanaRing extends Vue {
  @Prop({ default: () => [] }) readonly signSets: Array<SignSet>;
  @Prop({ default: () => [] }) readonly grahas: Array<GrahaStyle>;
  @Prop({ default: "lagna" }) type: string;

  signClassNames(index: number, mode: "sign") {
    return [[this.type, "ring"].join("-"), [mode, index].join("-")];
  }

  keyString(index: number, mode = "sign") {
    return [mode, this.type, index].join("-");
  }

  grahaClassNames(item: GrahaStyle) {
    return [
      item.graha.key,
      ["num", item.inSign].join("-"),
      ["index", item.index].join("-"),
      [this.type, "ring"].join("-")
    ];
  }
}
</script>
