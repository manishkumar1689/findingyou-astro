<template>
  <div v-if="hasSubject" :class="wrapperClasses">
    <h4 class="subject">
      <span class="name">{{name}}</span>
      <em v-if="hasGender" class="gender">{{gender}}</em>
    </h4>
    <div class="dateime">
      <span class="local-time">{{ localDt }}</span>
      <span class="utc-offset">{{ chart.tzText }}</span>
    </div>
    <div v-if="hasPlacenames" class="topynyms horizontal flex-row">
      <span class="placenames">{{ placenames }}</span>
    </div>
    <div class="geo-loc horizontal flex-row" :title="chart.geo | asDecString">
      <span class="lat">{{ chart.geo.lat | toDMSLat }}</span>
      <span class="lng">{{ chart.geo.lng | toDMSLng }}</span>
      <span v-if="hasAltitude" class="alt">{{ chart.geo.alt | toAltStr }}</span>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Chart } from "../../api/models/Chart";
import { julToLongDate } from "../../api/converters";
import { FilterSet } from "../../api/composables/FilterSet";
import { isNumeric, notEmptyString } from "../../api/validators";

@Component({
  filters: FilterSet
})
export default class ChartInfo extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: false }) readonly doubleMode: boolean;
  @Prop({ default: 1 }) readonly chartNum: number;

  get hasSubject(): boolean {
    return (
      this.chart instanceof Chart &&
      this.chart.subject instanceof Object &&
      isNumeric(this.chart.jd) &&
      this.chart.jd > 0
    );
  }

  get wrapperClasses() {
    const cls = this.doubleMode ? ["subject-info"] : ["chart-info"];
    cls.push(["chart", this.chartNum].join("-"));
    return cls;
  }

  get name() {
    return this.hasSubject ? this.chart.subject.name : "";
  }

  get gender() {
    return this.hasSubject && notEmptyString(this.chart.subject.gender)
      ? this.chart.subject.gender
      : "";
  }

  get hasGender() {
    return this.gender.length > 0 && this.gender !== "-";
  }

  get hasPlacenames(): boolean {
    return this.hasSubject ? this.chart.placenames.length > 0 : false;
  }

  get placenames() {
    return this.hasSubject
      ? this.chart.placenames
          .map(p => p.name)
          .reverse()
          .join(", ")
      : "";
  }

  get localDt() {
    return this.hasSubject
      ? julToLongDate(this.chart.jd, this.chart.tzOffset)
      : "";
  }

  get hasGeo() {
    return this.hasSubject && this.chart.geo instanceof Object;
  }

  get geo() {
    return this.hasGeo ? this.chart.geo : { lat: 0, lng: 0, alt: 0 };
  }

  get hasAltitude() {
    return this.hasGeo ? this.geo.alt !== 0 : false;
  }
}
</script>