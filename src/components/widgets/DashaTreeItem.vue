<template>
  <li :class="wrapperClasses">
    <div class="item" :class="expandClass" @click.stop="select">
      <span class="toggle" :class="expandClass" @click.stop="toggleExpand"></span>
      <span class="icon" :class="item.iconClasses"></span>
      <b-tooltip class="date" :label="dateText" position="is-bottom">
        {{
        item.startDate
        }}
      </b-tooltip>
    </div>
    <DashaTreeItemList
      v-if="hasChildren"
      :items="children"
      :depth="nextDepth"
      :jd="jd"
      :tzOffset="tzOffset"
      :maxDepth="maxDepth"
      :index="index"
      :context="context"
      :parents="nakshatraTrail"
    />
  </li>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import {
  DashaSpan,
  DashaSpanItem,
  defaultDashaSpanItem,
  fetchDashaSet,
  calcDashaSpans,
  mapDashaItem,
} from "../../api/models/DashaSet";
import { bus } from "../../main";

@Component({
  name: "DashaTreeItem",
  components: {
    DashaTreeItemList: () => import("./DashaTreeItemList.vue"),
  },
})
export default class DashaTreeItem extends Vue {
  @Prop({ default: () => defaultDashaSpanItem }) readonly item: DashaSpanItem;
  @Prop({ default: 0 }) readonly jd: number;
  @Prop({ default: 0 }) readonly tzOffset: number;
  @Prop({ default: 3 }) readonly maxDepth: number;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: 0 }) readonly itemIndex: number;
  @Prop({ default: "p1" }) readonly context: string;
  @Prop({ default: () => [] }) readonly parents: number[];
  @Prop({ default: false }) readonly highlighted: boolean;

  private expanded = false;

  private loaded = false;

  private childItems: Array<DashaSpanItem> = [];

  private selected = false;

  mounted() {
    setTimeout(() => {
      this.loaded = true;
      if (this.item.depth < 4) {
        this.expanded = this.highlighted === true && this.hasChildren;
      }
    }, 250);
  }

  get children() {
    return this.childrenLoaded ? this.item.children : this.childItems;
  }

  get hasChildren() {
    return this.children.length > 0 && this.jd > 0;
  }

  get childrenLoaded() {
    return (
      this.loaded &&
      this.item.children instanceof Array &&
      this.item.children.length > 0
    );
  }

  get expandClass() {
    const cls = [];
    if (!this.expandable) {
      cls.push("max-depth");
    } else if (this.expanded) {
      cls.push("is-expanded");
    } else {
      cls.push("is-contracted");
    }
    if (this.hasChildren) {
      cls.push("has-children");
    }
    if (this.highlighted) {
      cls.push("highlighted");
    }
    return cls;
  }

  get wrapperClasses() {
    const cls = [
      ["depth", this.item.depth].join("-"),
      ["lord", this.item.key].join("-"),
    ];
    if (this.expanded) {
      cls.push("expanded");
    }
    if (this.selected) {
      cls.push("selected");
    }
    return cls;
  }

  get age() {
    const units = [];
    let prefix = "";
    if (this.item.age instanceof Object) {
      const { age } = this.item;
      const showDays = this.item.depth > 2 || (age.years < 1 && age.months < 1);
      if (age.years > 0) {
        units.push(`${age.years}y`);
      }
      if (age.months > 0 || (age.days > 0 && showDays)) {
        units.push(`${age.months}m`);
      }
      if (showDays) {
        if (age.days > 0) {
          units.push(`${age.days}d`);
        }
      }
      if (age.negative) {
        prefix = "-";
      }
    }
    return prefix + units.join(" ");
  }

  get dateText() {
    return ["to", this.item.endDate, "➤", this.age].join(" ");
  }

  get nextDepth() {
    return this.item.depth + 1;
  }

  get expandable() {
    return this.item.depth < 5;
  }

  toggleExpand() {
    if (!this.hasChildren && !this.expanded) {
      this.loadMore();
    }
    this.expanded = !this.expanded;
  }

  select() {
    this.selected = true;
    bus.$emit("dasha-span-item", {
      ...this.item,
      index: this.index,
      context: this.context,
      trail: this.nakshatraTrail,
      itemIndex: this.itemIndex,
    });
    // const offsetJd = this.item.startJd + ((this.item.endJd - this.item.startJd) / 8);
    bus.$emit("dasha-open-jd", this.item.startJd);
    bus.$on("dasha-span-item", (data) => {
      const { trail } = data;
      if (trail instanceof Array && trail.length > 0) {
        const sameTrail = this.nakshatraTrail.every((n) => trail.includes(n)) &&
          trail.length === this.nakshatraTrail.length &&
          this.itemIndex === data.itemIndex;
        if (!sameTrail) {
          this.selected = false;
        }
      }
    });
  }

  get nakshatraTrail() {
    return [...this.parents, this.itemIndex];
  }

  loadMore() {
    if (this.item.depth > 2 && this.item.depth < 5) {
      const dashaSet = fetchDashaSet(this.item.system);
      if (dashaSet.nakshatraMatches.length > 0) {
        this.childItems = calcDashaSpans(
          dashaSet,
          this.item.nakNum,
          this.item.startJd,
          this.item.endJd,
          this.item.depth,
          this.item.system
        )
          .map((row) => new DashaSpan(row))
          .map((span, spanIndex) =>
            mapDashaItem(
              span,
              spanIndex,
              this.jd,
              dashaSet,
              this.nextDepth,
              this.maxDepth,
              this.tzOffset
            )
          );
      }
    }
  }
}
</script>
