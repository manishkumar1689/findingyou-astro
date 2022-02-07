import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

function lazyLoad(view) {
  return () => import(`@/views/${view}.vue`);
}

const routes = [
  {
    path: "/",
    name: "Home",
    component: lazyLoad("Home"),
  },
  {
    path: "/ui/:tab?/:subtab?",
    name: "AstroUI",
    component: lazyLoad("AstroUI"),
  },
  {
    path: "/compatibility/:tab?",
    name: "Compatibility",
    component: lazyLoad("Compatibility"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: "/astro/",
  routes,
});

export default router;
