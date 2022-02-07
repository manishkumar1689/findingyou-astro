<template>
    <div class="inner">
      <div class="items collapsible">
        <ol>
          <li
            v-for="(item, index) in items"
            :key="['life-event', eventType, index].join('-')"
            class="life-event"
          >
            <span class="edit-controls">
              <b-icon icon="eye" class="load" @click.native="select(item)" />
              <b-icon v-if="mayShowControls(item)" class="remove" @click.native="handleDelete(item)" icon="trash-can-outline" />
            </span>
            <span class="name" @click="select(item)">{{item.label}}</span>
            <em class="age" @click="select(item)" :title="item.dateDisplay">{{ageDisplay(item)}}</em>
          </li>
        </ol>
        <b-button @click="newEvent" icon-left="plus" :rounded="true" type="is-small">{{newEventLabel}}</b-button>
      </div>
    </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { UserState } from "../../store/types";
import { Chart } from "../../api/models/Chart";
import { bus } from "../../main";
import {
  deleteUserChart,
  fetchLifeCharts,
} from "../../api/methods";
import { julToDateParts } from "@/api/julian-date";
import { ChartInput } from "@/api/models/ChartForm";
import { notEmptyString } from "@/api/validators";

@Component
export default class LifeEventsList extends Vue {
  @Prop({ default: new Chart(null) }) chart: Chart;
  @State("user") user: UserState;

  private items: Array<any> = [];

  private eventType = "event";

  created() {
    this.sync();
    bus.$on("chart-loaded", (chart, index) => {
      if (index === 0 && chart instanceof Chart) { 
        const itemIndex = this.items.findIndex(item => item._id === chart._id);
        const {_id, user, parent, geo, jd, subject, tzOffset, tz, isDefaultBirthChart} = chart;
        const editedItem = this.mapItem({_id, user, parent, ...geo, jd, ...subject, tzOffset, tz, isDefaultBirthChart});
        if (itemIndex >= 0) {
          this.items[itemIndex] = editedItem;
        } else {
          this.items.push(editedItem);
          this.items.sort((a, b) => a.jd - b.jd);
        }
      }
    });
  }

  sync() {
    if (this.chart instanceof Object) {
      const { _id, parent } = this.chart;
      const refId = notEmptyString(parent, 16)? parent : _id;
      const allowedTypes = ['birth', this.eventType];
      fetchLifeCharts(refId).then(result => {
        if (result.valid) {
          this.items = result.items.filter(item => allowedTypes.includes(item.eventType)).map(this.mapItem);
        }
      });
    }
  }

  mapItem(item: ChartInput) {
    const dateDisplay = julToDateParts(item.jd, item.tzOffset).dmyDate;
    const parts = [item.name];
    if (item.eventType === "birth") {
      parts.push(`(${item.eventType})`);
    }
    const label = parts.join(" ");
    return {...item, label, dateDisplay};
  }

  ageDisplay(item: ChartInput) {
    let age = -1;
    if (this.parentJd > 0) {
      age = Math.floor((item.jd - this.parentJd) / 365.25);
    }
    return age >= 0 ? age.toString(10) : "";
  }

  select(item: ChartInput) {
    if (item instanceof Object) {
      bus.$emit("load-life-event", item);
    }
  }

  get parentSubjectName() {
    return this.items.length > 0? this.items[0].name : "";
  }

  get parentJd() {
    return this.items.length > 0? this.items[0].jd : 0;
  }

  get newEventLabel() {
    return `New ${this.eventType}`;
  }

  mayShowControls(item: ChartInput) {
    return item.eventType !== "birth";
  }

  toast(message: string, duration = 3000) {
    this.$buefy.toast.open({
      duration,
      message,
      position: "is-bottom",
      type: "is-success"
    });
  }

  newEvent() {
    bus.$emit("new-event", this.eventType);
  }

  handleDelete(item: ChartInput) {
    if (item instanceof Object) {
      const label = [this.parentSubjectName, item.name].join(' → ')
      this.$buefy.dialog.confirm({
        message: `Are you sure you wish to delete "${label}"`,
        cancelText: "Keep",
        confirmText: "Delete",
        type: "is-danger",
        onConfirm: () => this.delete(item),
      });
    }
  }

  delete(item: ChartInput) {
    const { _id, name } = item;
    deleteUserChart(this.user._id, _id).then(result => {
      if (result.valid) {
        this.toast(`${name} deleted`);
        if (this.items.length > 1) {
          const itemIndex = this.items.findIndex(it => it._id === _id);
          if (itemIndex > 0) {
            this.items.splice(itemIndex, 1);
            const item = this.items[0];
            bus.$emit("load-life-event", item);
          }
        }     
      }
    });
  }

  @Watch('chart')
  changeChart() {
    this.sync();
  }

}
</script>
