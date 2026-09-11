import Vue, { defineAsyncComponent } from 'vue'

// 图表库较重，异步注册，避免拖慢首屏（仍走 plugins/index 的 Vue.use）
export default {
  install () {
    const register = (name, loader) => {
      if (Vue.component(name)) return
      Vue.component(name, defineAsyncComponent(loader))
    }
    register('VeLine', () => import('v-charts/lib/line.common'))
    register('VeHistogram', () => import('v-charts/lib/histogram.common'))
    register('VeBar', () => import('v-charts/lib/bar.common'))
    register('VePie', () => import('v-charts/lib/pie.common'))
    register('VeRing', () => import('v-charts/lib/ring.common'))
  },
}
