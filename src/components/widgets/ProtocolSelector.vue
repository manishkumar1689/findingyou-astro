<template>
  <b-field title="folder-open-outline" class="horizontal collections">
    <b-icon icon="folder-open-outline" size="is-medium" />
    <b-select v-model="selectedProtocolId">
      <option
        v-for="(opt, ri) in protocolList"
        :value="opt.key"
        :key="['protocol-list', opt.key, ri].join('-')"
      >
        {{ opt.name }}
      </option>
    </b-select>
  </b-field>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { KeyName } from "../../api/interfaces";

@Component({
  name: "ProtocolSelector",
})
export default class ProtocolSelector extends Vue {
  @Prop({ default: () => [] }) protocolList: Array<KeyName>;
  @Prop({ default: "" }) protocolId: string;

  private selectedProtocolId = "";

  created() {
    setTimeout(() => {
      this.selectedProtocolId = this.protocolId;
    }, 250);
  }

  mounted() {
    this.selectedProtocolId = this.protocolId;
  }

  @Watch("selectedProtocolId")
  changeSelectedProtocolId(newVal) {
    if (
      Object.keys(this.$parent.$parent.$parent.$parent.$data).includes(
        "selectedProtocolId"
      )
    ) {
      this.$set(
        this.$parent.$parent.$parent.$parent,
        "selectedProtocolId",
        newVal
      );
    }
  }
}
</script>
