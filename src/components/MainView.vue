<template>
  <div class="main-view">
    <h1>Welcome</h1>
    <nav class="row blocks">
      <router-link to="/ui">
        <h2>Astro</h2>
      </router-link>
      <router-link to="/compatibility">
        <h2>Compatibility</h2>
      </router-link>
    </nav>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({
  components: {},
  filters: {},
})
export default class MainView extends Vue {

}
</script>
