<template>
  <div class="page-footer-space">
    <div class="page-footer p-3 bg-white" :style="pageFooterStyle">
      <div class="page-footer_inner d-flex h-100 w-100 align-items-center">
        <template v-if="hasDefaultSlot">
          <div class="d-flex flex-fill justify-content-end align-items-center"><slot /></div>
        </template>
        <template v-else>
          <div class="d-flex flex-fill align-items-center"><slot name="left" /></div>
          <div class="d-flex align-items-center justify-content-end ml-3"><slot name="right" /></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { Comment, Fragment, Text } from 'vue'
import { mapState, mapGetters } from 'vuex'

let pageFooterCount = 0

function applyFooterHeightVar () {
  const app = document.getElementById('app')
  const page = document.getElementById('app-page')
  if (pageFooterCount > 0) {
    app && app.style.setProperty('--oc-page-footer-height', '74px')
    page && page.style.setProperty('--oc-page-footer-height', '74px')
  } else {
    app && app.style.removeProperty('--oc-page-footer-height')
    page && page.style.removeProperty('--oc-page-footer-height')
  }
}

function slotHasContent (slot) {
  if (!slot) return false
  const nodes = typeof slot === 'function' ? slot() : slot
  if (!Array.isArray(nodes) || !nodes.length) return false
  return nodes.some((n) => {
    if (!n) return false
    if (n.type === Comment) return false
    if (n.type === Text && !String(n.children || '').trim()) return false
    if (n.type === Fragment) return slotHasContent(() => n.children || [])
    return true
  })
}

export default {
  name: 'PageFooter',
  inheritAttrs: false,
  props: {
    // 兼容旧用法：占位已统一由 .page-footer-space 提供，不再区分
    isForm: {
      type: Boolean,
      default: false,
    },
    footerStyle: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    ...mapGetters(['globalRounded']),
    ...mapState({
      setting: state => state.setting,
    }),
    ...mapState('common', {
      cloudShellHeight: state => state.openCloudShell ? state.cloudShellHeight : 0,
    }),
    hasDefaultSlot () {
      return slotHasContent(this.$slots.default)
    },
    l2MenuVisibleForStore () {
      return this.setting?.l2MenuVisible
    },
    // 与 layout 一致：用户展开偏好 + 当前确有二级菜单内容时才让位
    l2MenuShown () {
      return !!(this.l2MenuVisibleForStore && this.setting?.l2MenuContentShow)
    },
    pageFooterStyle () {
      const style = { ...(this.footerStyle || {}) }
      if (this.globalRounded) {
        // 与 app-page 可视区域对齐（含 inset / L2 / gap）
        style.left = this.l2MenuShown
          ? 'calc(var(--oc-page-inset) + var(--oc-l2-width) + var(--oc-page-gap))'
          : 'var(--oc-page-inset)'
        style.right = 'var(--oc-page-inset)'
        style.bottom = this.cloudShellHeight > 0
          ? `calc(var(--oc-page-inset) + ${this.cloudShellHeight}px + var(--oc-page-inset))`
          : 'var(--oc-page-inset)'
        style.borderRadius = '0 0 6px 6px'
      } else {
        if (!this.l2MenuShown) {
          style.left = 0
        }
        style.bottom = `${this.cloudShellHeight}px`
      }
      return style
    },
  },
  watch: {
    globalRounded () {
      this.$nextTick(applyFooterHeightVar)
    },
  },
  mounted () {
    this.syncFooterHeightVar(true)
  },
  beforeUnmount () {
    this.syncFooterHeightVar(false)
  },
  methods: {
    syncFooterHeightVar (on) {
      pageFooterCount = Math.max(0, pageFooterCount + (on ? 1 : -1))
      this.$nextTick(applyFooterHeightVar)
    },
  },
}
</script>

<style lang="less" scoped>
// 文档流占位：fixed 底栏本身不占高度，必须用占位块把内容顶起来
.page-footer-space {
  position: relative;
  font-size: 12px;
  height: 74px;
  flex-shrink: 0;
}

.page-footer {
  z-index: 10;
  position: fixed;
  left: 160px;
  right: 0;
  height: 74px;
  box-shadow: 0 -2px 4px 0 rgba(237, 237, 237, 0.5), 0 -2px 4px 0 rgba(237, 237, 237, 0.5);
  box-sizing: border-box;
}

.page-footer_inner {
  min-width: 0;
}
</style>
