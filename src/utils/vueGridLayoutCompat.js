/**
 * vue-grid-layout@2 在 Vue 3 下的兼容层：
 * 1) 基类 created 写 `this._provided.eventBus = new Vue()`，Vue3 无 `_provided` 直接炸；
 *    且 Vue3 实例无可靠 $on/$emit → beforeCreate 预置 `_provided`，用自定义 eventBus 吞掉 new Vue()。
 * 2) provide/inject：GridItem 注入我们的 eventBus。
 * 3) dragEvent 里 `this.layout = moveElement(...)` 给 prop 赋值会炸 → 原地 mutate + emit update:layout。
 */
import VueGridLayout from 'vue-grid-layout'
import { getLayoutItem, moveElement, compact } from '@/utils/vueGridLayoutHelpers'

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
  beforeCreate () {
    const bus = createEventBus()
    this._compatEventBus = bus
    // Vue3 无 this._provided；基类 created 会赋值 eventBus，用 getter 固定为我们的 bus，setter 吞掉 new Vue()
    const provided = Object.create(null)
    Object.defineProperty(provided, 'eventBus', {
      configurable: true,
      enumerable: true,
      get () { return bus },
      set () { /* ignore new Vue() */ },
    })
    this._provided = provided
  },
  provide () {
    return {
      eventBus: this._compatEventBus,
      layout: this,
    }
  },
  created () {
    // 基类 created 已通过 _provided getter 把 drag/resize handler 挂到同一 bus，此处只对齐 this.eventBus
    this.eventBus = this._compatEventBus
  },
  methods: {
    dragEvent (eventName, id, x, y, h, w) {
      let l = getLayoutItem(this.layout, id)
      if (l === undefined || l === null) {
        l = { x: 0, y: 0 }
      }

      if (eventName === 'dragmove' || eventName === 'dragstart') {
        this.placeholder.i = id
        this.placeholder.x = l.x
        this.placeholder.y = l.y
        this.placeholder.w = w
        this.placeholder.h = h
        this.$nextTick(() => {
          this.isDragging = true
        })
        this.eventBus.$emit('updateWidth', this.width)
      } else {
        this.$nextTick(() => {
          this.isDragging = false
        })
      }

      // 勿赋值 this.layout（Vue3 prop 只读）；moveElement / compact 均原地修改
      moveElement(this.layout, l, x, y, true, this.preventCollision)
      compact(this.layout, this.verticalCompact)
      this.eventBus.$emit('compact')
      this.updateHeight()
      this.$emit('update:layout', this.layout)
      if (eventName === 'dragend') this.$emit('layout-updated', this.layout)
    },
  },
}

export const GridItem = VueGridLayout.GridItem

export default {
  GridLayout,
  GridItem,
}
