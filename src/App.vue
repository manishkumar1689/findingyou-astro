<template>
  <div id="app" :class="wrapperClasses">
    <aside id="nav-aside">
      <nav v-if="isLoggedIn" id="nav">
        <ul class="menu">
          <li
            v-for="item in mainMenu"
            :key="item.key"
            :class="item.classNames"
            @click="linkSelected"
          >
            <template v-if="item.reload">
              <a :href="item.to" class="reload">{{item.label}}</a>
            </template>
            <template v-else>
              <template v-if="item.hasIcon">
                <span class="action" @click="handleIconClick(item)">
                  <b-icon :icon="item.icon" size="is-small"></b-icon>
                </span>
              </template>
              <router-link :to="item.to" :active="item.active">{{
                item.label
              }}</router-link>
            </template>
          </li>
        </ul>
      </nav>
      <div v-if="isLoggedIn" class="actions top">
        <div class="refresh" @click="clearCaches" title="Clear caches">
          <b-icon icon="refresh"></b-icon>
        </div>
        <b-tooltip class="logout-trigger" :label="loggedInHint" position="is-bottom">
          <b-icon icon="logout" @click.native="logout" ></b-icon>
        </b-tooltip>
        <b-tooltip class="web-info info-widget" :label="webInfo.label" position="is-bottom">
          <b-icon icon="web" :class="webInfo.className"></b-icon>
        </b-tooltip>
        <div class="clock-info info-widget" position="is-bottom" :multilined="true">
          <b-icon icon="clock"></b-icon>
          <dl class="inner">
            <template v-for="item in dateInfo">
              <template>
                <dt :key="item.key">{{item.label}}</dt>
                <dd :key="item.key2">{{item.value}}</dd>
              </template>
            </template>
          </dl>
        </div>
      </div>
      <footer class="side-footer">
        <p>
          <span class="copy">{{copyInfo}}</span>
          <em>{{webInfoLabel}}</em>
        </p>
      </footer>
    </aside>

    <main id="main" :class="mainClassNames">
      <template v-if="isLoggedIn">
        <router-view />
      </template>
      <template v-else>
        <Login />
      </template>
    </main>
    <div class="toggle-main-nav" @click="toggleMainNav">
      <b-icon icon="dots-vertical" />
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { State, Action } from "vuex-class";
import { fetchLexemes, fetchRoddenValues } from "./api/methods";
import Login from "./components/Login.vue";
import { bus } from "./main";
import { WindowState, UserState } from "./store/types";
import { assignAspectClass, exitFullScreen } from "./api/dom";
import { notEmptyString } from "./api/validators";
import { currentJulianDate, JulDate } from "./api/julian-date";
import { decPlaces } from "./api/converters";
const nsWindow = "window";
const nsUser = "user";
const nsDict = "dictionary";
@Component({
  components: {
    Login,
  },
})
export default class App extends Vue {
  @State("window") window: WindowState;
  @State("user") user: UserState;
  @Action("assignWindow", { namespace: nsWindow }) assignWindow: any;
  @Action("assignUser", { namespace: nsUser }) assignUser: any;
  @Action("assignItems", { namespace: nsDict }) assignItems: any;
  isLoggedIn = false;

  showMainNav = false;

  private version = 0.532;

  julianDate = currentJulianDate();

  mainMenuItems = [
    { to: "/manage", label: "Home", reload: true },
    { to: "/ui", label: "Astro" },
    { to: "/compatibility", label: "Compatibility Protocols" },
    { to: "/manage/tech", label: "Files & Planetary Stations", reload: true },
    { to: "/manage/dictionary", label: "Dictionary", icon: "book-alphabet", reload: true },
    { to: "/manage/snippets", label: "Snippets", reload: true },
    { to: "/manage/settings", label: "Settings", reload: true },
    { to: "/manage/users", label: "Users", reload: true },
    { to: "/manage/charts", label: "Chart List",reload: true },
  ];

  mounted() {
    this.assignWindow();
    assignAspectClass(this.window);
  }

  created() {
    const storedVersion = this.$ls.get("version");
    const currVer = storedVersion ? storedVersion : 0;
    if (currVer !== this.version) {
      this.clearCaches();
      setTimeout(() => {
        this.$ls.set("version", this.version);
      }, 1000);
    }
    const user = this.$ls.get("user");
    if (user instanceof Object) {
      const { active } = user;
      if (active) {
        this.isLoggedIn = true;
        this.assignUser(user);
      }
    }
    this.loadDictionary();
    bus.$on("login", (valid: boolean) => {
      if (valid) {
        this.isLoggedIn = true;
      }
    });
    bus.$on("show-chart-sidebar", (active: boolean) => {
      if (active) {
        this.showMainNav = false;
      }
    });
    bus.$on("escape", () => {
      this.showMainNav = false;
    });

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("resize", () => {
      this.assignWindow();
      assignAspectClass(this.window);
      bus.$emit("resize", true);
    });
    window.addEventListener("keypress", (e: KeyboardEvent) => {
      switch (e.which) {
        case 13:
          exitFullScreen();
          break;
      }
    });
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        exitFullScreen();
      }
      bus.$emit("resize", true);
      bus.$emit("fullscreen", document.fullscreen);
    });
    this.julianDate = currentJulianDate();
    
  }

  loadDictionary() {
    const lexItems = this.$ls.get("dictionary");
    if (lexItems instanceof Array) {
      this.assignItems(lexItems);
    } else {
      fetchLexemes("").then((data) => {
        if (data.valid) {
          if (data.items instanceof Array) {
            this.assignItems(data.items);
            this.$ls.set("dictionary", data.items);
          }
        }
      });
      fetchRoddenValues();
    }
  }

  logout() {
    this.$ls.remove("user");
    this.isLoggedIn = false;
    this.$router.push("/");
  }

  handleKeyDown(e) {
    switch (e.which) {
      case 37:
        bus.$emit("prev", true);
        break;
      case 39:
        bus.$emit("next", true);
        break;
      case 27:
        bus.$emit("escape", true);
        break;
    }
  }

  toggleMainNav() {
    this.showMainNav = !this.showMainNav;
  }

  clearCaches(key = null) {
    if (window.localStorage instanceof Object) {
      const keys = Object.keys(window.localStorage).map((k) =>
        k.replace(/^fy_/, "")
      );
      const hasFilter = notEmptyString(key);
      keys
        .filter((k) => !hasFilter || key === k)
        .forEach((k) => {
          switch (k) {
            case "user":
            case "c1":
            case "c2":
            case "selected-pc":
              break;
            default:
              this.$ls.remove(k);
              break;
          }
        });
      if (!hasFilter) {
        bus.$emit("reload", true);
      }
    }
  }

  linkSelected(e) {
    if (e.target instanceof HTMLElement) {
      const { tagName } = e.target;
      if (tagName.toLowerCase() === "a") {
        this.showMainNav = false;
      }
    }
  }

  get loggedInHint(): string {
    let str = "";
    if (this.isLoggedIn) {
      str = `Logged in as ${this.user.fullName}`;
    }
    return str;
  }

  get webInfo() {
    const {host} = window.location;
    return {
      label: ['Host', host].join(': '),
      className: host.split(".").shift().split(":").shift(),
    };
  }

  get webInfoLabel() {
    return this.webInfo.label;
  }

  get copyInfo(): string {
    const year = new Date().getFullYear();
    return `© FindingYou ${year}`;
  }

  get mainMenu() {
    const toParts = (localPath: string) =>
      localPath.length > 2 ? localPath.substring(1).split("/") : ["home"];
    const { path } = this.$route;
    const pathSection = toParts(path).shift();
    return this.mainMenuItems.map((mi) => {
      const parts = toParts(mi.to);
      const refName = parts.join("--");
      const key = ["menu-item", refName].join("-");
      const section = parts.shift();
      const active = pathSection === section;
      const classNames = [section];
      const keys = Object.keys(mi);
      const icon = keys.includes("icon") ? mi.icon : "";
      const hasIcon = icon.length > 1;
      if (section !== refName) {
        classNames.push(refName);
      }
      if (active) {
        classNames.push("active");
      }
      return { ...mi, key, active, classNames, icon, hasIcon, refName };
    });
  }

  get wrapperClasses() {
    const cls = [];
    if (this.showMainNav) {
      cls.push("show-main-nav");
    }
    return cls;
  }

  get mainClassNames() {
    const { path } = this.$route;
    const parts = path.length > 2 ? path.substring(1).split("/") : ["home"];
    const first = parts[0] === "ui" ? "astro" : parts[0];
    const cls = [first];
    if (parts.length > 1) {
      cls.push(parts.slice(0, 2).join("--"));
    }
    if (parts.length > 2) {
      cls.push(parts.slice(0, 3).join("--"));
    }
    if (!this.isLoggedIn) {
      cls.push('show-login');
      cls.push('home');
    }
    return cls;
  }

  get dateInfo() {
    const items = [];
    if (this.julianDate instanceof JulDate) {
      items.push({ label: "Julian day", value: decPlaces(this.julianDate.jd, 4)});
      items.push({
        label: "Date/time",
        value: this.julianDate.dmyHm,
      });
      items.push({
        label: "Timezone", 
        value: this.julianDate.offsetHrs,
      });
    }
    return items.map((item, index) => {
      const key = ['date-info', index].join('-');
      const key2 = ['date-info-2', index].join('-');
      return {...item, key, key2};
    });
  }

  handleIconClick(item) {
    switch (item.refName) {
      case "dictionary":
        this.clearCaches("dictionary");
        setTimeout(this.loadDictionary, 500);
        setTimeout(() => {
          bus.$emit("reload", true);
        }, 2500);
        break;
    }
  }
}
</script>
<style lang="scss">
@import "./styles/app.scss";
</style>
