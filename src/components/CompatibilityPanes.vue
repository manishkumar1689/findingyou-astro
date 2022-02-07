<template>
  <div class="main-view compatibility-wrapper" :class="wrapperClasses">
    <b-tabs v-model="activeTab" :multiline="true">
      <b-tab-item label="Full Synthesis">
        <ProtocolOverview :protocol="protocol">
          <ProtocolSelector
            v-if="isActive('overview')"
            :protocolList="protocolList"
            :protocolId="selectedProtocolId"
          />
        </ProtocolOverview>
      </b-tab-item>
      <b-tab-item label="Paired Charts">
        <PairedOverview :protocol="protocol">
          <ProtocolSelector
            v-if="isActive('paired-charts')"
            :protocolList="protocolList"
            :protocolId="selectedProtocolId"
          />
        </PairedOverview>
      </b-tab-item>
      <b-tab-item label="Mirroring" :disabled="paneDisabled('mirroring')">
        <SynastryForm
          :collection="mirroringCollection"
          :categories="protocol.categories"
          type="mirroring"
        />
      </b-tab-item>
      <b-tab-item label="Synastry" :disabled="paneDisabled('synastry')">
        <SynastryForm
          :collection="synastryCollection"
          :categories="protocol.categories"
          type="synastry"
        />
      </b-tab-item>
      <b-tab-item label="Composite" :disabled="paneDisabled('composite')">
        <SynastryForm
          :collection="compositeCollection"
          :categories="protocol.categories"
          type="composite"
        />
      </b-tab-item>
      <b-tab-item label="Kūṭas" :disabled="paneDisabled('kutas')">
        <SynastryForm
          :collection="kutasCollection"
          :categories="protocol.categories"
          type="kutas"
        />
      </b-tab-item>
    </b-tabs>
  </div>
</template>
<script lang="ts">
import { Component, Watch, Vue } from "vue-property-decorator";
import { State } from "vuex-class";
import { isNumeric, notEmptyString } from "../api/validators";
import { FilterSet } from "../api/composables/FilterSet";
import SynastryForm from "./forms/SynastryForm.vue";
import ProtocolOverview from "./forms/ProtocolOverview.vue";
import PairedOverview from "./forms/PairedOverview.vue";
import ProtocolSelector from "./widgets/ProtocolSelector.vue";
import { UserState } from "../store/types";
import { bus } from "@/main";
import { Protocol, RulesCollection } from "@/api/models/Condition";
import { fetchProtocols, saveProtocol, saveRuleSet } from "@/api/methods";
import { smartCastInt } from "@/api/converters";

@Component({
  components: {
    SynastryForm,
    ProtocolOverview,
    PairedOverview,
    ProtocolSelector,
  },
  filters: {
    ...FilterSet,
  },
})
export default class CompatibilityPanes extends Vue {
  @State("user") user: UserState;
  private activeTab = 0;

  private protocols: Array<Protocol> = [];

  private protocol = new Protocol();

  private selectedProtocolId = "";

  private tabs = [
    { key: "overview", className: "overview" },
    { key: "paired-charts", className: "paired-charts-view" },
    //{ key: "rel-potential", className: "rel-potential-view" },
    //{ key: "similarities", className: "similarities-view" },
    { key: "mirroring", className: "mirroring-view" },
    { key: "synastry", className: "synastry-view" },
    { key: "composite", className: "composite-view" },
    { key: "kutas", className: "kutas-view" },
    //{ key: "dashas", className: "dashas-view" },
    //{ key: "ashtavarga", className: "ashtavarga-view" },
  ];

  saving = false;

  created() {
    const { path } = this.$route;

    const parts = path.substring(1).split("/");
    if (parts.length > 1) {
      const subsec = parts.pop();
      const tabIndex = this.tabs.findIndex((tb) => tb.key === subsec);
      if (tabIndex > 0) {
        this.activeTab = tabIndex;
      }
    }
    this.syncProtocols();
    bus.$on("save-protocol-rule", ({ type, rule, index, message, saveRule }) => {
      if (!this.saving) {
        const matchIndex = this.protocol.collections.findIndex(
          (rc) => rc.type === type
        );
        if (
          matchIndex >= 0 &&
          matchIndex < this.protocol.collections.length &&
          rule instanceof Object &&
          index >= 0
        ) {
          this.protocol.collections[matchIndex].rules[index] = rule;
        }
        this.saving = true;
        const limit = this.$ls.get("max-pc-limit");
        const limitInt = isNumeric(limit)? smartCastInt(limit) : 1000;
        saveRuleSet(rule,this.protocol._id, type, index, saveRule === true, limitInt).then((data) => {
          if (data.valid) {
            if (notEmptyString(message, 3)) {
              this.showMessage(message, 5000);
            }
            if (data.matches instanceof Array) {
             bus.$emit("update-rule-matches", { matches: data.matches, colRef: type }); 
            }
          }
          setTimeout(() => {
              this.saving = false;
            }, 2000);
        });
      }
    });
    bus.$on("save-protocol", (protocol) => {
      this.saveProtocol(protocol);
    });
    bus.$on("create-new-protocol", (protocol) => {
      this.saveProtocol(protocol, true);
    });
    bus.$on("show-message", ({ message, duration }) => {
      this.showMessage(message, duration);
    });
  }

  async syncProtocols() {
    const protocols = await fetchProtocols(this.user._id);
    if (protocols instanceof Array && protocols.length > 0) {
      this.protocols = protocols.map((pr) => new Protocol(pr));
      const selectedId = this.$ls.get("selectedProtocolId");
      if (notEmptyString(selectedId, 12)) {
        this.selectedProtocolId = selectedId;
      } else {
        this.selectedProtocolId = protocols[0]._id;
      }
      this.matchProtocol();
    }
  }

  saveProtocol(protocol, newMode = false) {
    if (!this.saving) {
      this.saving = true;
      const idRef = newMode ? "" : this.id;
      if (!newMode) {
        const catKeys = this.protocol.categories.map(ct => ct.key);
        protocol.collections.forEach((col) => {
          if (col.rules instanceof Array) {
            col.rules.forEach((rule) => {
              if (rule.scores instanceof Array) {
                rule.scores = rule.scores.filter(sc => catKeys.includes(sc.key));
              }
            })
          }
        });
      }
      const protocolData =
        protocol instanceof Protocol ? protocol.toObject() : protocol;
      saveProtocol(protocolData, idRef).then((data) => {
        if (data.valid) {
          this.selectedProtocolId = data.item._id;
          const message = "Protocol settings saved";
          this.showMessage(message, 5000);
          bus.$emit("sync-protocol", true);
          if (newMode) {
            this.syncProtocols();
          }
        }

        setTimeout(() => {
          this.saving = false;
        }, 2000);
      });
    }
  }

  get protocolList() {
    return this.protocols.map((pr) => {
      return {
        key: pr._id,
        name: `${pr.name} (${pr.length}): ${pr.userRecord.nickName}`,
      };
    });
  }

  matchProtocol() {
    if (
      notEmptyString(this.selectedProtocolId, 12) &&
      this.protocols.length > 0
    ) {
      const protocol = this.protocols.find(
        (pr) => pr._id === this.selectedProtocolId
      );
      if (protocol instanceof Protocol) {
        this.protocol = protocol;
      }
    }
  }

  get id() {
    return this.selectedProtocolId;
  }

  get synastryCollection() {
    return this.matchCollectionByType("synastry");
  }

  get compositeCollection() {
    return this.matchCollectionByType("composite");
  }

  get mirroringCollection() {
    return this.matchCollectionByType("mirroring");
  }

  get kutasCollection() {
    return this.matchCollectionByType("kutas");
  }

  isActive(tabKey: string) {
    if (this.activeTab >= 0 && this.activeTab < this.tabs.length) {
      return this.tabs[this.activeTab].key === tabKey;
    }
    return false;
  }

  matchCollectionByType(type: string): RulesCollection {
    let collection = new RulesCollection({ type });
    if (
      this.protocol instanceof Protocol &&
      this.protocol.collections.length > 0
    ) {
      collection = this.protocol.collections.find((rc) => rc.type === type);
    }
    return collection;
  }

  showMessage(message: string, duration = 2000) {
    this.$buefy.toast.open({
      duration,
      message,
      position: "is-bottom",
      type: "is-success",
    });
  }

  get wrapperClasses() {
    const cls = [];
    if (this.activeTab < this.tabs.length) {
      const row = this.tabs[this.activeTab];
      if (row) {
        cls.push(row.className);
      }
    }
    return cls;
  }

  paneDisabled(type: string) {
    const col = this.protocol.collections.find((c) => c.type === type);
    let disabled = true;
    if (col instanceof Object) {
      disabled = col.percent < 0.5;
    }
    return disabled;
  }

  @Watch("selectedProtocolId")
  changeSelectedProtocolId(newVal) {
    this.$ls.set("selectedProtocolId", newVal);
    this.matchProtocol();
  }

  @Watch("activeTab")
  changeActiveTab() {
    if (this.activeTab < this.tabs.length) {
      const row = this.tabs[this.activeTab];
      if (row) {
        bus.$emit("change-compatibility-tab", row.key);
        const newPath = "/" + ["compatibility", row.key].join("/");
        const { path } = this.$route;
        if (newPath !== path) {
          this.$router.push(newPath);
        }
      }
    }
  }
}
</script>
