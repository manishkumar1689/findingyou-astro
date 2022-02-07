<template>
  <ol class="dasha-items" :class="listClasses">
    <DashaTreeItem
      v-for="(sub, subIndex) in items"
      :item="sub"
      :jd="jd"
      :tzOffset="tzOffset"
      :maxDepth="maxDepth"
      :key="sub.itemKey"
      :index="index"
      :context="context"
      :parents="parents"
      :itemIndex="subIndex"
      :highlighted="matchHighlightedIndex(subIndex)"
    />
  </ol>
</template>
<script lang="ts">
import { bus } from "@/main";
import { Component, Prop, Vue } from "vue-property-decorator";
import { DashaSpanItem } from "../../api/models/DashaSet";
import DashaTreeItem from "./DashaTreeItem.vue";
@Component({
  name: "DashaTreeItemList",
  components: {
    DashaTreeItem,
  },
})
export default class DashaTreeItemList extends Vue {
  @Prop({ default: () => [] }) readonly items: DashaSpanItem[];
  @Prop({ default: 0 }) readonly jd: number;
  @Prop({ default: 0 }) readonly tzOffset: number;
  @Prop({ default: 0 }) readonly maxDepth: number;
  @Prop({ default: 1 }) readonly depth: number;
  @Prop({ default: 0 }) readonly index: number;
  @Prop({ default: "p1" }) readonly context: string;
  @Prop({ default: () => [] }) readonly parents: number[];

  private highlightedIndex = -1;

  created() {
    bus.$on("dasha-open-jd", (jd: number) => {
      this.highlightedIndex = this.items.findIndex(item => {
        return (jd >= item.startJd && jd < item.endJd);
      });
    });
  }

  get listClasses() {
    const cls = [["depth", this.depth].join("-")];
    if (this.depth > 1) {
      cls.push("children");
    }
    return cls;
  }

  matchHighlightedIndex(index: number) {
    return this.highlightedIndex === index;
  }
}
</script>
