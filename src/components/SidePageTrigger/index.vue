<template>
  <a
    v-if="isLink && !inBaseDialog"
    class="side-page-trigger-link"
    href="javascript:;"
    @click.prevent="clickHandle">
    <slot />
  </a>
  <span v-else><slot /></span>
</template>

<script>
import * as R from 'ramda'
import { hasPermission } from '@/utils/auth'
import config from './config/index.js'

export default {
  name: 'SidePageTrigger',
  // Vue3：勿将 onTrigger 透传到根 <a>；打开侧栏只依赖 $emit('trigger')，不读 $attrs.onTrigger（声明 emits 后 attrs 中无此函数）
  inheritAttrs: false,
  emits: ['trigger'],
  props: {
    vm: {
      type: Object,
    },
    list: {
      type: Object,
    },
    name: {
      type: String,
    },
    id: {
      type: String,
    },
    tab: {
      type: String,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    params: {
      type: Object,
      default: () => ({}),
    },
    permission: {
      type: String,
    },
    noStore: {
      type: Boolean,
    },
    init: Boolean,
  },
  inject: {
    // 是否处于List中
    inList: {
      default: false,
    },
    // 是否处于SidePage中
    inBaseSidePage: {
      default: false,
    },
    // 是否处于Dialog中
    inBaseDialog: {
      default: false,
    },
  },
  computed: {
    isLink () {
      if (this.noStore) return true // 兼容在http.js那的notification里面调用此组件，会有获取不到this.$store的报错
      const { globalSidePages } = this.$store.state.common
      const names = (globalSidePages && globalSidePages.names) || []
      return hasPermission({ key: this.permission }) && (names.indexOf(this.name) > -1 || !this.name)
    },
  },
  methods: {
    clickHandle () {
      if (this.name && this.id && this.vm) {
        this.updateSidepageLeft()
        const { name, id, vm, options, list, tab, params, init } = this
        vm.sidePageTriggerHandle(vm, name, {
          id,
          ...config[name],
          ...options,
        }, {
          list,
          ...params,
          tab,
        })

        if (!init && tab) {
          vm.initSidePageTab(tab)
        }
        return
      }
      // 列表 name 列：h('side-page-trigger', { on: { trigger } }) — 走 emit，勿依赖 $attrs.onTrigger
      this.updateSidepageLeft()
      this.$emit('trigger')
    },
    findPageListTableByParent (vm) {
      if (!vm) return
      const n = vm.$options.name
      // Vue2 为 _componentTag；Vue3 + vxe-table 2.x 为 VxeTable / VxeGrid（Grid 代理了表格方法）
      if (n === 'VxeTable' || n === 'VxeGrid' || vm.$options._componentTag === 'vxe-table') {
        return vm
      }
      // PageListLite / TableLiteGrid 原生 table
      if (n === 'PageListTable' || n === 'PageListLiteTable' || n === 'TableLiteGrid') {
        return vm
      }
      if (vm.$parent) {
        return this.findPageListTableByParent(vm.$parent)
      }
    },
    /** 从当前触发器所在单元格获取列右边界（兼容 PageListLite / vxe） */
    resolveColumnRight () {
      const minWidth = 800
      const el = this.$el
      if (el && typeof el.closest === 'function') {
        const td = el.closest('td')
        if (td) {
          const columnRect = td.getBoundingClientRect()
          let rightTemp = columnRect.right
          // 列宽超过 150 时，侧栏起点落在列内 150px 处，露出名称前缀
          if (columnRect.width > 150) {
            rightTemp = columnRect.left + 150
          }
          // 避免 sidepage 过窄：回退到同行第一个数据列
          if (window.innerWidth - rightTemp < minWidth) {
            const row = td.parentElement
            const cells = row ? Array.from(row.children).filter(n => n.tagName === 'TD') : []
            const firstData = cells.find(c => !c.classList.contains('is-select')) || cells[1]
            if (firstData) {
              const firstRect = firstData.getBoundingClientRect()
              rightTemp = firstRect.left + 150
            }
          }
          return rightTemp
        }
      }
      // 兼容仍使用 vxe-table 的场景
      if (this.$parent?.field) {
        const table = this.findPageListTableByParent(this.$parent)
        if (table && typeof table.getColumns === 'function') {
          const columns = table.getColumns()
          const firstColumn = columns.length > 1 ? columns[1] : null
          const fieldColumn = R.find(R.propEq('property', this.$parent.field))(columns)
          if (!fieldColumn) return null
          const colId = fieldColumn.id
          const $column = table.$el.querySelector(`.vxe-table--main-wrapper .vxe-table--body-wrapper .vxe-body--column[data-colid=${colId}]`)
          if (!$column) return null
          const columnRect = $column.getBoundingClientRect()
          let rightTemp = columnRect.right
          if (columnRect.width > 150) {
            rightTemp = columnRect.left + 150
          }
          if (window.innerWidth - rightTemp < minWidth && firstColumn) {
            const $firstColumn = table.$el.querySelector(`.vxe-table--main-wrapper .vxe-table--body-wrapper .vxe-body--column[data-colid=${firstColumn.id}]`)
            if ($firstColumn) {
              const firstRect = $firstColumn.getBoundingClientRect()
              rightTemp = firstRect.left + 150
            }
          }
          return rightTemp
        }
      }
      return null
    },
    updateSidepageLeft () {
      if (this.inBaseSidePage || !this.inList) return
      // 每次点击重算：列宽可拖拽调整，不能沿用旧缓存
      const rightTemp = this.resolveColumnRight()
      if (rightTemp == null || Number.isNaN(rightTemp)) return
      this.columnRightTemp = rightTemp
      this.$store.dispatch('sidePage/updateSidepageLeft', rightTemp)
    },
  },
}
</script>

<style lang="less" scoped>
.side-page-trigger-link {
  color: var(--antd-wave-shadow-color, #1890ff);
  cursor: pointer;
  text-decoration: none;
  &:hover {
    color: var(--antd-wave-shadow-color, #1890ff);
    opacity: 0.85;
  }
}
</style>
