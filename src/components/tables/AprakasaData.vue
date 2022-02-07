<template>
  <div class="aprikasa-data pane">
    <div v-if="hasValues" class="aprakasa sub-pane">
      <h3>Aprakasa</h3>
      <MixedValues :values="values" :offset="offset" />
    </div>
    <div v-if="hasKarana" class="karana sub-pane">
      <h3>Karana</h3>
      <MixedValues :values="karanaValues" :offset="offset" />
    </div>
    <div v-if="hasVara" class="hora sub-pane">
      <h3>Vara</h3>
      <MixedValues :values="varaValues" :offset="offset" />
    </div>
    <div v-if="hasHora" class="hora sub-pane">
      <h3>Hora</h3>
      <MixedValues :values="horaValues" :offset="offset" />
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import MixedValues from "../widgets/MixedValues.vue";
import { NameValue } from "../../api/interfaces";
import { KaranaSet } from "../../api/models/KaranaSet";
import { VaraSet } from "../../api/models/VaraSet";
import { HoraSet } from "../../api/models/HoraSet";
import { camelToTitle } from "../../api/converters";
@Component({
  components: {
    MixedValues
  }
})
export default class AprakasaData extends Vue {
  @Prop({ default: () => [] }) readonly values: Array<NameValue>;
  @Prop({ default: () => new KaranaSet() }) readonly karana: KaranaSet;
  @Prop({ default: () => new HoraSet() }) readonly hora: HoraSet;
  @Prop({ default: () => new VaraSet() }) readonly vara: VaraSet;
  @Prop({ default: 0 }) readonly offset: number;

  get hasValues() {
    return this.values.length > 0;
  }

  get hasKarana() {
    return this.karana.name.length > 0;
  }

  get karanaValues(): Array<NameValue> {
    return Object.entries(this.karana).map(entry => {
      const [key, value] = entry;
      const name = camelToTitle(key);
      let format = "";
      switch (key) {
        case "percent":
          format = "percent";
          break;
        case "locations":
          format = "commas";
          break;
      }
      return { key, name, value, format };
    });
  }

  get horaValues(): Array<NameValue> {
    return Object.entries(this.hora).map(entry => {
      const [key, value] = entry;
      const name = camelToTitle(key);
      let format = "text";
      switch (key) {
        case "weekDay":
          format = "dayName";
          break;
        case "ruler":
          format = "grahaName";
          break;
      }
      return { key, name, value, format };
    });
  }

  get varaValues(): Array<NameValue> {
    return Object.entries(this.vara).map(entry => {
      const [key, value] = entry;
      const name = camelToTitle(key);
      let format = "text";
      switch (key) {
        case "sunRise":
          format = "datetime";
          break;
        case "weekDay":
          format = "dayName";
          break;
        case "ruler":
          format = "grahaName";
          break;
        case "percent":
          format = "dec5";
          break;
      }
      return { key, name, value, format };
    });
  }

  get hasHora() {
    return this.hora.ruler.length > 0;
  }

  get hasVara() {
    return this.vara.ruler.length > 0;
  }
}
</script>
