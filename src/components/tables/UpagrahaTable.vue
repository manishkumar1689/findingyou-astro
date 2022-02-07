<template>
  <div class="sets">
    <b-table
      v-if="hasValues"
      :data="values"
      :row-class="(row, index) => assignRowClasses(row, index)"
    >
      <template slot-scope="props">
        <b-table-column
          class="name"
          :class="props.row.key"
          field="name"
          label="Name"
          >{{ props.row.name }}</b-table-column
        >
        <b-table-column class="body" field="body" label="Body">{{
          props.row.body
        }}</b-table-column>
        <b-table-column class="position" field="position" label="Position">{{
          props.row.position
        }}</b-table-column>
        <b-table-column class="parts" field="parts" label="Parts">{{
          props.row.parts
        }}</b-table-column>
        <b-table-column class="value" field="value" label="value">{{
          props.row.value | dec4
        }}</b-table-column>
        <b-table-column class="jd" field="jd" label="JD">{{
          props.row.jd | dec4
        }}</b-table-column>
        <b-table-column class="degree" field="degree" label="Upagraha">{{
          props.row.upagraha | dec4
        }}</b-table-column>
      </template>
    </b-table>
    <MixedValues :values="dataRows" />
    <MixedValues :values="transitions" :offset="offset" />
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { UpagrahaSet } from "../../api/models/UpagrahaSet";
import { UpagrahaValue } from "../../api/models/UpagrahaValue";
import { FilterSet } from "../../api/composables/FilterSet";
import MixedValues from "../widgets/MixedValues.vue";
import { longDate } from "../../api/converters";

@Component({
  components: {
    MixedValues,
  },
  filters: FilterSet,
})
export default class UpagrahaTable extends Vue {
  @Prop({ default: () => new UpagrahaSet() }) readonly data: UpagrahaSet;
  @Prop({ default: 0 }) readonly offset: number;

  get values(): Array<UpagrahaValue> {
    const { values } = this.data;
    let items: Array<UpagrahaValue> = [];
    if (values instanceof Array) {
      items = values;
    }
    return items;
  }

  get hasValues(): boolean {
    return this.values.length > 0;
  }

  get dataRows() {
    const data = this.data.numericValues().map((row) => {
      let format = "plain";
      switch (row.key) {
        case "eighth":
        case "periodHours":
          format = "dec5";
          break;
      }
      return { ...row, format };
    });
    return data;
  }

  get transitions() {
    return [
      {
        name: "Previous sun rise",
        key: "prevRise",
        value: this.data.prevRise.datetime,
      },
      {
        name: "Previous sun set",
        key: "prevSet",
        value: this.data.prevSet.datetime,
      },
      {
        name: "Sun rise",
        key: "rise",
        value: this.data.rise.datetime,
      },
      {
        name: "Sun set",
        key: "set",
        value: this.data.prevSet.datetime,
      },
      {
        name: "Next sun rise",
        key: "nextRise",
        value: this.data.nextRise.datetime,
      },
    ].map((row) => {
      return { ...row, format: "datetime" };
    });
  }

  assignRowClasses(row: UpagrahaValue, index: number) {
    return [["index", index].join("-"), ["upagraha", row.key].join("-")];
  }

  longDate(datetime) {
    return longDate(datetime, this.offset);
  }
}
</script>
