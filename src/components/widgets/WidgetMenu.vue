<template>
  <div class="widget-menu widget flip-side">
    <div class="actions top">
      <span class="action clone" @click="clone" title="Copy with the same settings">
        <b-icon icon="content-copy"></b-icon>
      </span>
      <span v-if="isDouble" class="action clone set-other" @click="cloneSwap" :title="copyAsOtherSubjectName">
        <b-icon icon="content-copy"></b-icon>
      </span>
      <span class="action remove" @click="remove" title="Remove widget">
        <b-icon icon="trash-can-outline"></b-icon>
      </span>
    </div>
    <ul v-if="menuItems.length > 0" class="widget-menu">
      <li v-for="(cat, ci) in menuItems" :key="cat.key" @click="expand(ci)" :class="catClasses(ci)">
        <div class="label">{{ cat.title }}</div>
        <ol v-if="cat.widgets.length > 0">
          <li v-for="(opt, oi) in cat.widgets" :key="opt.itemKey" :class="itemClasses(ci, oi)">
            <div class="label">{{ opt.title }}</div>
            <div class="actions" v-if="opt.enabled">
              <span class="action inplace" @click="inplace(opt)">
                <b-icon icon="plus-circle-outline"></b-icon>
              </span>
              <span class="action add" @click="add(opt)">
                <b-icon icon="arrow-right-circle-outline"></b-icon>
              </span>
              <!-- <b-select
                v-if="opt.hasSettings && isExpanded(oi)"
                placeholder="Varga"
                v-model="vargaNum"
              >
                <option
                  v-for="vo in vargaOptions"
                  :value="vo.key"
                  :key="['varga-key', vo.key, id, oi].join('-')"
                >{{ vo.name }}</option>
              </b-select>-->
            </div>
          </li>
        </ol>
      </li>
    </ul>
  </div>
</template>
<script lang="ts">
import { State } from "vuex-class";
import { Component, Prop, Vue } from "vue-property-decorator";
import vargaValues from "../../api/mappings/varga-values";
import { getWidgetItems, matchPaneContext } from "../../store/local";
import widgetDefaults from "../../api/mappings/widget-defaults";
import { bus } from "../../main";
import { DictionaryState } from "../../store/types";
import { notEmptyString } from "../../api/validators";
import { Chart } from '../../api/models/Chart';

@Component
export default class WidgetMenu extends Vue {
  @Prop({ default: 0 }) index: number;
  @Prop({ default: "" }) context: string;
  @State("dictionary") dictionary: DictionaryState;

  private vargaNum = 1;
  private expanded = -1;

  created() {
    setTimeout(this.syncSettings, 500);
  }

  syncSettings() {
    const { $data } = this.$parent.$parent;
    const dataKeys = Object.keys($data);
    if (dataKeys.includes("vargaNum")) {
      this.vargaNum = $data.vargaNum;
    }
  }
  catClasses(index: number) {
    const cls = [this.expanded === index ? "expanded" : "contracted"];
    return cls;
  }

  itemClasses(catIndex: number, index: number) {
    const cls = [];
    const cItems = this.getCurrentItems();
    if (catIndex < this.menuItems.length) {
      if (this.menuItems[catIndex] instanceof Object) {
        const item = this.menuItems[catIndex].widgets[index];
        const cItemIndex = cItems.findIndex(mi => mi.name === item.name);
        if (this.index === cItemIndex) {
          cls.push("current");
        } else if (cItems.some(mi => mi.name === item.name)) {
          cls.push("active");
        } else if (item instanceof Object) {
          if (!item.enabled) {
            cls.push("inactive");
          }
        }
      }
    }
    return cls;
  }

  get menuItems() {
    let items = [];
    const refKey = matchPaneContext(this.context);
    const categories = widgetDefaults.filter(wc => wc.panes.includes(refKey));
    if (categories instanceof Array) {
      items = categories;
    }
    return items.map((item, mi) => {
      const key = ["wm", this.context, this.index, mi].join("-");
      item.widgets = item.widgets.map(w => {
        const dictKey = ["menu", w.key].join("_");
        const dictTitle = this.dictionary.text("aui", dictKey);
        const title = notEmptyString(dictTitle)
          ? dictTitle
          : notEmptyString(w.title)
          ? w.title
          : w.name;
        const itemKey = [this.context, this.index, mi, w.key].join("-");
        const { settings } = w;
        const hasSettings = settings ? Object.keys(settings).length > 0 : false;
        return { ...w, itemKey, title, hasSettings };
      });
      const title = this.dictionary.text(
        "aui",
        ["menu", item.category].join("_")
      );
      return { ...item, key, title };
    });
  }

  getCurrentItems() {
    return getWidgetItems(this.context);
  }

  get id() {
    return ["menu", this.index, Math.floor(Math.random() * 512)].join("-");
  }

  get vargaOptions() {
    return vargaValues
      .filter(item => item.num <= 60)
      .map(item => {
        const { key, num } = item;
        return {
          key: num,
          name: key.toUpperCase()
        };
      });
  }

  get copyAsOtherSubjectName() {
    let str = "Copy as ";
    const { chart2 } = this.$parent.$parent.$props;
    if (chart2 instanceof Chart) {
      const { subject } = chart2;
      if (subject) {
        str += subject.name;
      }
    }
    return str;
  }

  add(widget) {
    this.manage(widget, "add");
  }

  inplace(widget) {
    this.manage(widget, "inplace");
  }

  remove() {
    const widget = {
      name: "self",
      context: this.context,
      index: this.index
    };
    this.manage(widget, "remove");
  }

  expand(index: number) {
    this.expanded = this.isExpanded(index) ? -1 : index;
  }

  contract() {
    this.expanded = -1;
  }

  isExpanded(index: number) {
    return this.expanded === index;
  }

  get isDouble() {
    const { mode } = this.$parent.$parent.$props;
    switch (mode) {
      case "single":
        return this.context === "p3";
      default:
        return false;
    }
  }

  cloneSwap() {
    const {singleMode} = this.$parent.$parent.$data;
    const newSet = singleMode === 2? 1 : 2;
    this.clone(newSet);
  }

  clone(newSet = 0) {
    const {key} = this.$parent.$parent.$vnode;
    const { $props, $data } = this.$parent.$parent;
    if (typeof key === 'string') {
      const name = key.split('-').shift();
      let { mode, set } = $props;
      if (!set) {
        set = 1;
      }
      if (newSet > 0) {
        set = newSet;
      }
      if (!mode) {
        mode = '';
      }
      const { vargaNum } = $data;
      bus.$emit("manage-widgets", {
          action: 'add',
          context: this.context,
          index: this.index,
          name,
          vargaNum,
          mode,
          set
        });
    }
  }

  manage(widget, action = "inplace") {
    if (widget instanceof Object) {
      const { name } = widget;
      let { vargaNum, mode } = widget;

      if (!vargaNum) {
        vargaNum = this.vargaNum;
      }
      if (!mode) {
        mode = "";
      }
      if (name) {
        bus.$emit("manage-widgets", {
          action,
          context: this.context,
          index: this.index,
          name,
          vargaNum,
          mode
        });
      }
    }
  }
}
</script>
