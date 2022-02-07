<template>
  <div class="context-info caughadia-info">
    <div class="subsection left">
      <p class="current-datetime">
        {{extendedDate}}
      </p>
    <div class="row horizontal navigation">
      <b-button class="arrow prev" @click="prevDay">◀︎</b-button>
      <b-button v-if="isNotToday" class="reset" @click="toDay" title="reset to today">⧎</b-button>
      <b-button class="arrow next" @click="nextDay">▶︎</b-button>
    </div>
      
    <p class="location parts-2">
        <b-icon icon="map-marker-outline" />
        <small>{{ locationName }}</small>
    </p>
    <p class="geo-coord">
        {{ geoString }}
    </p>
    <slot></slot>
    </div>
    <div class="subsection right">
      <p class="vara parts-3">
        <strong class="text-label">vāra</strong>
        <span class="value">{{ varaName }}</span>
        <i class="icon" :class="varaRuler | toGrahaClass" :title="varaRuler | toGrahaClass"></i>
      </p>
      <p class="tithi parts-3">
          <strong class="text-label">tithi</strong>
          <span class="value">{{ tithiName }}</span>
          <i class="icon" :class="tithiRuler | toGrahaClass" :title="tithiRuler | toGrahaClass"></i>
      </p>
      <p class="karana parts-3">
          <strong class="text-label">karaṇa</strong>
          <span class="value">{{ karanaName }}</span>
          <i class="icon" :class="karanaRuler | toGrahaClass" :title="karanaRuler | toGrahaClass"></i>
      </p>
      <p class="yoga parts-3">
          <strong class="text-label">yoga</strong>
          <span class="value">{{ yogaName }}</span>
          <i class="icon" :class="yogaRuler | toGrahaClass" :title="yogaRuler | toGrahaClass"></i>
      </p>
      <p class="nakshatra parts-3">
          <strong class="text-label">nakṣatra</strong>
          <span class="value">{{ nakshtraName }}</span>
          <i class="icon" :class="nakshatraRuler | toGrahaClass" :title="nakshatraRuler | toGrahaClass"></i>
      </p>
    </div>
  </div>    
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import {
  julToLongDate,
  julToHMS,
  degAsDms
} from "../../api/converters";
import { DictionaryState } from "../../store/types";
import { Chart } from "../../api/models/Chart";
import { currentJulianDay, julianDayOffsetToNoon, julToDateParts } from "@/api/julian-date";
import { getGeoTzOffset } from "@/api/geoloc-utils";
@Component({
  filters: FilterSet
})
export default class CaughadiaInfo extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => 0 }) readonly currJd: number;
  @Prop({ default: () => null }) readonly geo: any;
  @State("dictionary") dictionary: DictionaryState;

  get mainLabel() {
    return (
      this.dictionary.text("caughadia", "name_0") +
      " & " +
      this.dictionary.text("graha", "chaya_upagraha_1")
    );
  }

  get varaName() {
    const lex = this.dictionary.lexeme("vara", this.chart.vara.num);
    return lex instanceof Object ? lex.text() : '';
  }

  get varaRuler() {
    return this.chart.vara.ruler;
  }

  get tithiName() {
    const lex = this.dictionary.lexeme("tithi", this.chart.tithi.num);
    return lex instanceof Object ? lex.text() : '';
  }

  get tithiRuler() {
    return this.chart.tithi.lord;
  }

  get karanaName() {
    const lex = this.dictionary.lexeme("karana", this.chart.karana.num);
    return lex instanceof Object ? lex.text() : '';
  }

  get karanaRuler() {
    return this.chart.karana.ruler
  }

  get yogaName() {
    const lex = this.dictionary.lexeme("yoga", this.chart.yoga.num);
    return lex instanceof Object ? lex.text() : '';
  }

  get yogaRuler() {
    return this.chart.yoga.ruler;
  }

  get nakshtraName() {
    const lex = this.dictionary.lexeme("nakshatra", this.chart.moon.nakshatra.key);
    return lex instanceof Object ? lex.text() : '';
  }
  
  get nakshatraRuler() {
    return this.chart.moon.nakshatra.ruler;
  }

  get geoString() {
    return [degAsDms(this.chart.geo.lat, "lat", 2, true), degAsDms(this.chart.geo.lng, "lng", 2, true)].join(", ");
  }

  get offset() {
    return 0 - new Date().getTimezoneOffset() * 60;
  }

  get hasGeoData() {
    const keys = this.geo instanceof Object ? Object.keys(this.geo) : [];
    return keys.includes("countryName") && keys.includes("shortTz");
  }

  get tzAbbr() {
    return this.hasGeoData ? this.geo.shortTz : '';
  }

  get hasLocation() {
    return this.hasGeoData && Object.keys(this.geo).includes("location");
  }

  get locationName() {
    return this.hasLocation? this.geo.location : "";
  }

  get extendedDate() {
    return julToDateParts(this.currJd).extended;
  }

  get isNotToday() {
    const nowJd = julianDayOffsetToNoon(currentJulianDay(), getGeoTzOffset());
    return this.currJd < (nowJd - 0.55) || this.currJd > (nowJd + 0.55);
  }

  longTime(jd: number) {
    return julToHMS(jd, this.chart.tzOffset);
  }
  longDate(jd: number) {
    return julToLongDate(jd, this.chart.tzOffset);
  }

  nextDay() {
    this.$emit('moveDay', 1);
  }

  prevDay() {
    this.$emit('moveDay', -1);
  }

  toDay() {
    this.$emit('moveDay', 0);
  }

}
</script>
