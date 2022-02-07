<template>
  <ul class="mixed-values">
    <li v-for="row in values" :key="row.key" :class="row.format|typeClass">
      <span class="name">{{ row.name }}</span>
      <template v-if="row.format === 'grahaIconClass'">
        <strong
          class="symbol"
          :class="smartFilter(row.value, row.format)"
          :title="smartFilter(row.value, 'grahaName')"
        ></strong>
      </template>
      <template v-else-if="row.format === 'signDeg'">
        <SignDegree :deg="row.value" :seconds="seconds" />
      </template>
      <template v-else>
        <strong class="value">{{ smartFilter(row.value, row.format) }}</strong>
      </template>
    </li>
  </ul>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { NameValue, AyanamshaItem } from "../../api/interfaces";
import SignDegree from "./SignDegree.vue";

import {
  decPlaces,
  degDec,
  percDec,
  toCommas,
  toGrahaObj,
  longDate
} from "../../api/converters";

@Component({
  filters: {
    typeClass(val) {
      switch (val) {
        case "signDeg":
          return "sign-deg";
        case "grahaIconClass":
          return "graha";
        default:
          return "plain";
      }
    }
  },
  components: {
    SignDegree
  }
})
export default class MixedValues extends Vue {
  @Prop({ default: () => [] }) values: Array<NameValue>;
  @Prop({ default: 0 }) readonly offset: number;
  @Prop({ default: 0 }) readonly seconds: boolean;
  ayanamsha: AyanamshaItem;

  smartFilter(value: any, format: string) {
    switch (format) {
      case "dec4":
        return decPlaces(value, 4);
      case "grahaName":
        return toGrahaObj(value).name;
      case "grahaIconClass":
        return ["icon", toGrahaObj(value).key].join("-");
      case "commas":
        return toCommas(value);
      case "dec3":
        return decPlaces(value, 3);
      case "dec2":
        return decPlaces(value, 2);
      case "dec5":
        return decPlaces(value, 5);
      case "percent":
        return percDec(value, 4);
      case "deg":
        return degDec(value, 4);
      case "datetime":
        return longDate(value, this.offset);
      default:
        return value;
    }
  }
}
</script>
