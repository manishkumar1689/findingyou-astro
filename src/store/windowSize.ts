import { Module, GetterTree, ActionTree, MutationTree } from "vuex";
import { WindowState, RootState } from "./types";

export const state: WindowState = {
  height: 0,
  width: 0,
};

const actions: ActionTree<WindowState, RootState> = {
  assignWindow({ commit }) {
    const w = {
      height: window.innerHeight,
      width: window.innerWidth,
    };
    commit("windowLoaded", w);
  },
};

const getters: GetterTree<WindowState, RootState> = {
  windowSize(state): WindowState {
    return state;
  },
};

const mutations: MutationTree<WindowState> = {
  windowLoaded(state, payload: WindowState) {
    const { width, height } = payload;
    state.width = width;
    state.height = height;
  },
};

const namespaced = true;

export const windowSize: Module<WindowState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
};
