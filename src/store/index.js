import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import modules from './modules'
import { setStore } from './accessor'

Vue.use(Vuex)

const store = new Vuex.Store({
  getters,
  modules,
})

setStore(store)

export default store
