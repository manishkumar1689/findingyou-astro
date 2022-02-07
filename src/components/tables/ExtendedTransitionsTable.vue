<template>
  <div class="transitions">
    <b-table
      :data="transitionRows"
      :row-class="(row, index) => assignRowClasses(row, index)"
      :mobile-cards="false"
    >
      <template slot-scope="props">
        <b-table-column
          class="special"
          header-class="special"
          field="special"
          label
        >
          <span v-if="props.row.hasLabel" class="text-label">{{props.row.label}}</span>
          <span v-if="props.row.hasCharaKaraka" class="charakaraka">{{props.row.charaName}}</span>
        </b-table-column>
        <b-table-column
          class="symbol"
          header-class="symbol"
          field="graha"
          label="BB"
        >
            <i v-if="props.row.hasIcon" class="icon" :class="props.row.key | toGrahaClass"></i>
        </b-table-column>
        <b-table-column
          class="rise"
          header-class="transition transition-rise"
          field="rise"
          label="Ascending"
        >
            <b-tooltip :label="toTooltip(props.row, 'rise')">{{ longTime(props.row.rise.jd) }}</b-tooltip>
            <div v-if="grahaIsDikBala(props.row.key, 'rise')" class="dik-bala text-label"></div>
          </b-table-column>
        <b-table-column
          class="set"
          header-class="transition transition-set"
          field="set"
          label="Descending"
        >
          <b-tooltip :label="toTooltip(props.row, 'set')">{{ longTime(props.row.set.jd) }}</b-tooltip>
          <div v-if="grahaIsDikBala(props.row.key, 'set')" class="dik-bala text-label"></div>
        </b-table-column>
        <b-table-column
          class="mc"
          header-class="transition transition-mc"
          field="mc"
          label="Highest"
        >
          <b-tooltip :label="toTooltip(props.row, 'mc')">{{ longTime(props.row.mc.jd) }}</b-tooltip>
          <div v-if="grahaIsDikBala(props.row.key, 'mc')" class="dik-bala text-label"></div>
        </b-table-column>
        <b-table-column
          class="ic"
          header-class="transition transition-ic"
          field="ic"
          label="Lowest"
        >
          <b-tooltip :label="toTooltip(props.row, 'ic')">{{ longTime(props.row.ic.jd) }}</b-tooltip>
          <div v-if="grahaIsDikBala(props.row.key, 'ic')" class="dik-bala text-label"></div>
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue } from "vue-property-decorator";
import { FilterSet } from "../../api/composables/FilterSet";
import {
  degAsDms,
  camelToTitle,
  julToHMS,
  julToLongDate,
} from "../../api/converters";
import { DictionaryState, SettingState } from "../../store/types";
import { Chart } from "../../api/models/Chart";
import { Graha } from "@/api/models/Graha";
import { calcSphutaData } from "@/api/sphuta-helpers";
import { TransitInfoRow } from "@/api/models/TransitInfoRow";
import { hasDikBala } from "@/api/mappings/graha-values";

@Component({
  filters: FilterSet,
  components: {
  }
})
export default class ExtendedTransitionsTable extends Vue {
  @Prop({ default: () => new Chart() }) readonly chart: Chart;
  @Prop({ default: () => []}) readonly transitions: any[];
  @Prop({ default:  -1 }) readonly tzOffset: number;
  @State("dictionary") dictionary: DictionaryState;
  @State("settings") settings: SettingState;

  private geo: any = {};

  loaded = false;

  toTooltip(row, sk = 'rise') {
    let name = row.key;
    const long = degAsDms(row[sk].lng, 'raw', 3);
    if (row.key.length === 2) {
      const lex = this.dictionary.graha(row.key);
      name = lex.text("en", "standard");
    } else {
      name = camelToTitle(name);
    }
    return `${name}: ${long}`;
  }

  get transitionRows() {
    const rows = [];
    const keys = ["su", "mo", "ma", "me", "ve", "ju", "sa", "ra", "ke"];
    keys.forEach(key => {
      const graha = this.chart.graha(key);
      if (graha instanceof Graha) {
        const charaKaraka = graha.charaKaraka;
        const  charaName = this.charaName(graha.charaKaraka);
        const row = new TransitInfoRow(key, graha.longitude, "", this.transitions, charaKaraka, charaName);
        rows.push(row);
      }
    });
    const lotObjs = [{ key: "lotOfFortune", name: "Lot of Fortune"}, {key: "lotOfSpirit", name: "Lot of Spirit"}];
    lotObjs.forEach(obj => {
      const row = new TransitInfoRow(obj.key, this.chart[obj.key], obj.name, this.transitions);
      rows.push(row);
    })
    const allSphutas = calcSphutaData(
      this.chart,
      this.settings.ayanamsha,
    );
    const specialObjs = [
      {key: 'brghuBindu', trKey: 'brghuBindu', name: "Brighu Bindu", type: "lng"},
      {key: 'yogiSphuta', trKey: 'yogi', name: "Yogi Point", type: "lng" },
      {key: 'yogi', trKey: '', name: "Yogi Graha", type: "key" },
      {key: 'avayogiSphuta', trKey: 'avaYogi', name: "AvaYogi Point", type: "lng"},
      {key: 'avayogi', trKey: '', name: 'AvaYogi Graha', type: "key"},
    ]; 
    specialObjs.forEach(row => {
      const refRow = allSphutas.find(r => r.key === row.key);
      if (refRow instanceof Object) {
        const gr = row.type === "key"? this.chart.graha(refRow.value) : null;
        const lng = row.type === "key"? gr.longitude : refRow.value;
        const trKey = row.type === "key"? refRow.value : row.trKey;
        const newRow = new TransitInfoRow(trKey, lng, row.name, this.transitions, 0, "", refRow.value);
        rows.push(newRow);
      }
    });
    return rows;
  }

  grahaIsDikBala(key: string, type: string): boolean {
    return hasDikBala(key, type);
  }

  longTime(jd: number) {
    return julToHMS(jd, this.tzSecs);
  }
  longDate(jd: number) {
    return julToLongDate(jd, this.tzSecs);
  }

  get tzSecs() {
    return this.tzOffset !== 1? this.tzOffset : this.chart.jd;
  }

  charaName(num = 0) {
    const key = ['karaka_chara', num].join('_');
    const lex = this.dictionary.lexeme("graha", key);
    return lex instanceof Object ? lex.text("sa", "short") : '';
  }

  assignRowClasses(row, index) {
    return [['index',index].join('-'), ['row',row.key].join('-')];
  }

}
</script>
<style lang="scss">
@import "@/styles/variables.scss";
#app .transitions {
  thead {
    th {
      .th-wrap {
        max-width: 1em;
        overflow: hidden;
        opacity: 0;
      }
    }
  }
  table {
    thead {
      .th-wrap {
        height: 1.875em;
      }
      .transition {
        position: relative;
        &::before,
        &::after {
          position: absolute;
          left: 0;
          left: 0;
          text-align: center;
          width: 6rem;
        }
        &::before {
          font-size: 1.125em;
          top: 0;
        }
        &::after {
          font-size: 0.75em;
          bottom: 0;
        }
      }
      .transition-rise {
        &::before {
          content: "ASC";
        }
        &::after {
          content: "Ascending";
        }
      }
      .transition-set {
        &::before {
          content: "DESC";
        }
        &::after {
          content: "Descending";
        }
      }
      .transition-mc {
        &::before {
          content: "MC";
        }
        &::after {
          content: "Highest";
        }
      }
      .transition-ic {
        &::before {
          content: "IC";
        }
        &::after {
          content: "Lowest";
        }
      }
    }
    tbody {
      td {
        .text-label {
          white-space: nowrap;
        }
        .dik-bala {
          position: absolute;
          right: 0.0625em;
          top: 0.0625em;
          width: 1em;
          height: 1em;
          font-size: 1.25em;
          background-color: $highlight-color;
          border-radius: 50%;
          box-shadow: 1px 1px 2px 1px rgba($dark-color, 0.25);
          &::before {
            position: absolute;
            font-size: 0.5em;
            display: flex;
            top: 0.375em;
            left: 0.3125em;
            right: 0.3125em;
            bottom: 0.125em;
            text-align: center;
            content: "DK";
          }
        }
      }
    }
  }
}
</style>