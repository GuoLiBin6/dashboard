/**
 * vue-grid-layout@2 在 Vue 3 下 provide/inject 失效：
 * GridLayout.created 写的是 this._provided.eventBus = new Vue()，
 * GridItem inject 到的 eventBus 为 null，created 里 $on 报错。
 */
import VueGridLayout from 'vue-grid-layout'

function createEventBus () {
  const listeners = Object.create(null)
  return {
    $on (event, fn) {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(fn)
    },
    $off (event, fn) {
      const arr = listeners[event]
      if (!arr) return
      if (!fn) {
        listeners[event] = []
        return
      }
      const i = arr.indexOf(fn)
      if (i > -1) arr.splice(i, 1)
    },
    $emit (event, ...args) {
      const arr = listeners[event]
      if (!arr) return
      arr.slice().forEach((fn) => fn(...args))
    },
    $destroy () {
      Object.keys(listeners).forEach((key) => {
        listeners[key] = []
      })
    },
  }
}

export const GridLayout = {
  extends: VueGridLayout.GridLayout,
  name: 'GridLayout',
  data () {
    return {
      compatEventBus: createEventBus(),
    }
  },
  provide () {
    return {
      eventBus: this.compatEventBus,
      layout: this,
    }
  },
  created () {
    this.eventBus = this.compatEventBus
    this.eventBus.$on('resizeEvent', this.resizeEventHandler)
    this.eventBus.$on('dragEvent', this.dragEventHandler)
  },
}

export const GridItem = VueGridLayout.GridItem

export default {
  GridLayout,
  GridItem,
}
