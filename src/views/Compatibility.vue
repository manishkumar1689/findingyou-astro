<template>
  <div class="compatibility-data">
    <CompatibilityPanes />
  </div>
</template>

<script>
// @ is an alias to /src
import CompatibilityPanes from "@/components/CompatibilityPanes.vue";

export default {
  name: "Compatibility",
  components: {
    CompatibilityPanes,
  },
};
</script>
