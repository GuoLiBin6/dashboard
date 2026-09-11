<template>
  <!-- 全局圆角：自管固定定位，避免 antd Popover 回写 top -->
  <template v-if="globalRounded && item.menus">
    <li
      ref="trigger"
      class="l1-menu-item"
      :class="{ active: activeMenu.index === item.index }"
      @mouseenter="handleMouseenter"
      @mouseleave="handleMouseleave">
      <a class="d-flex align-items-center" @click="handleL1LinkClick">
        <div class="l1-menu-item-icon flex-shrink-0 flex-grow-0">
          <icon :type="item.meta.icon" />
        </div>
        <div class="l1-menu-item-label flex-fill text-truncate mr-2" :title="getLabel(item.meta)">{{ getLabel(item.meta) }}</div>
        <div class="l1-menu-item-right-icon flex-shrink-0 flex-grow-0">
          <icon type="left" style="transform: rotate(180deg);" />
        </div>
      </a>
    </li>
    <teleport to="body">
      <transition name="l2-zoom-big">
        <div
          v-show="visible"
          ref="panel"
          class="l2-menus-popover l2-fixed-panel global-rounded"
          :class="{ 'cloudshell-open': openCloudShell, 'light-theme': light }"
          :style="fixedPanelStyle"
          @mouseenter="handleOverlayMouseenter"
          @mouseleave="handleOverlayMouseleave">
          <div class="l2-fixed-panel-inner">
            <div class="l2-menu-list-wrap">
              <l2-menu-content
                :menus="menus"
                :get-label="getLabel"
                :show-menu="showMenu"
                @route-change="handleL2LinkClick" />
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </template>
  <a-popover
    v-else-if="item.menus"
    placement="right"
    :overlay-class-name="overlayClassName"
    destroy-tooltip-on-hide
    trigger="hover"
    :align="popoverAlign"
    :open="visible"
    :get-popup-container="getPopupContainer"
    :overlay-style="popoverOverlayStyle"
    @openChange="handleVisibleChange">
    <li
      class="l1-menu-item"
      :class="{ active: activeMenu.index === item.index }"
      @mouseenter="handleMouseenter"
      @mouseleave="handleMouseleave">
      <a class="d-flex align-items-center" @click="handleL1LinkClick">
        <div class="l1-menu-item-icon flex-shrink-0 flex-grow-0">
          <icon :type="item.meta.icon" />
        </div>
        <div class="l1-menu-item-label flex-fill text-truncate mr-2" :title="getLabel(item.meta)">{{ getLabel(item.meta) }}</div>
        <div class="l1-menu-item-right-icon flex-shrink-0 flex-grow-0">
          <icon type="left" style="transform: rotate(180deg);" />
        </div>
      </a>
    </li>
    <template #content>
      <div class="l2-menu-list-wrap" @mouseenter="handleOverlayMouseenter" @mouseleave="handleOverlayMouseleave">
        <l2-menu-content
          :menus="menus"
          :get-label="getLabel"
          :show-menu="showMenu"
          @route-change="handleL2LinkClick" />
      </div>
    </template>
  </a-popover>
  <li v-else class="l1-menu-item" :class="{ active: activeMenu.index === item.index }">
    <a
      class="d-flex align-items-center"
      @click="handleL1LinkClick">
      <div class="l1-menu-item-icon">
        <icon :type="item.meta.icon" />
      </div>
      <div class="l1-menu-item-label flex-fill text-truncate mr-2" :title="getLabel(item.meta)">{{ getLabel(item.meta) }}</div>
    </a>
  </li>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import L2MenuContent from './L2MenuContent.vue'

export default {
  name: 'ProductsListSub',
  components: {
    L2MenuContent,
  },
  props: {
    item: {
      type: Object,
    },
    getLabel: Function,
    showMenu: Function,
    activeMenu: Object,
    popoverAlign: Object,
  },
  data () {
    return {
      visible: false,
      closeTimer: null,
      panelTop: 72,
      panelLeft: 0,
      panelMaxHeight: 400,
    }
  },
  computed: {
    ...mapGetters(['globalRounded', 'theme']),
    ...mapState('common', {
      openCloudShell: state => state.openCloudShell,
      cloudShellHeight: state => state.cloudShellHeight,
    }),
    overlayClassName () {
      let classname = 'l2-menus-popover'
      if (this.light) {
        classname += ' light-theme'
      }
      if (this.openCloudShell) {
        classname += ' cloudshell-open'
      }
      return classname
    },
    light () {
      return this.theme === 'light'
    },
    pageChromeOffset () {
      if (!this.globalRounded) return 60
      return 72 + 5
    },
    bottomSafeGap () {
      return this.globalRounded ? 5 : 0
    },
    popoverMaxHeight () {
      const cloudShellOffset = this.openCloudShell ? this.cloudShellHeight : 0
      const baseHeight = this.globalRounded ? this.pageChromeOffset : 60
      return `calc(100vh - ${baseHeight + cloudShellOffset}px)`
    },
    popoverOverlayStyle () {
      return {
        '--popover-max-height': this.popoverMaxHeight,
      }
    },
    fixedPanelStyle () {
      return {
        position: 'fixed',
        top: `${this.panelTop}px`,
        left: `${this.panelLeft}px`,
        maxHeight: `${this.panelMaxHeight}px`,
        zIndex: 1100,
      }
    },
    menus () {
      const menus = this.item.menus
      if (!menus) return []
      const res = []
      menus.forEach(m2item => {
        const m2 = { ...m2item }
        if (this.showMenu(m2)) {
          if (m2.submenus) {
            let flag = false
            const submenus = []
            m2.submenus.forEach(m3item => {
              if (this.showMenu(m3item)) {
                submenus.push(m3item)
                flag = true
              }
            })
            if (flag) {
              m2.submenus = submenus
              res.push(m2)
            }
          } else {
            res.push(m2)
          }
        }
      })
      return res
    },
  },
  watch: {
    openCloudShell: {
      handler () {
        if (this.visible) this.updateFixedPanel()
      },
    },
    cloudShellHeight: {
      handler () {
        if (this.visible) this.updateFixedPanel()
      },
    },
  },
  beforeUnmount () {
    this.cancelClose()
  },
  methods: {
    getNavbarBottom () {
      const navbar = document.querySelector('.navbar-wrap') || document.querySelector('#navbar') || document.querySelector('.navbar')
      if (navbar && navbar.getBoundingClientRect) {
        const bottom = navbar.getBoundingClientRect().bottom
        if (Number.isFinite(bottom)) {
          return this.globalRounded ? Math.max(72, Math.ceil(bottom)) : Math.ceil(bottom)
        }
      }
      return this.globalRounded ? 72 : 60
    },
    getMaxBottom () {
      const viewH = document.documentElement.clientHeight || window.innerHeight
      const cloudShellOffset = this.openCloudShell ? this.cloudShellHeight : 0
      return viewH - this.bottomSafeGap - cloudShellOffset
    },
    getTriggerEl () {
      return this.$refs.trigger || (this.$el && this.$el.querySelector && this.$el.querySelector('.l1-menu-item')) || this.$el
    },
    updateFixedPanel () {
      if (!this.globalRounded || !this.visible) return
      const trigger = this.getTriggerEl()
      if (!trigger || !trigger.getBoundingClientRect) return

      const minTop = this.getNavbarBottom()
      const maxBottom = this.getMaxBottom()
      const maxPanelH = Math.max(80, Math.floor(maxBottom - minTop))
      const triggerRect = trigger.getBoundingClientRect()
      const triggerCenter = triggerRect.top + triggerRect.height / 2
      const left = Math.round(triggerRect.right + 12)

      this.panelLeft = left
      this.panelMaxHeight = maxPanelH

      this.$nextTick(() => {
        const panel = this.$refs.panel
        if (!panel) return
        panel.style.maxHeight = `${maxPanelH}px`
        const inner = panel.querySelector('.l2-fixed-panel-inner') || panel
        // 用内容高度，避免入场 scale 动画影响 getBoundingClientRect
        const measuredH = Math.ceil(inner.scrollHeight) || maxPanelH
        const h = Math.min(measuredH, maxPanelH)
        let top = triggerCenter - h / 2
        top = Math.min(Math.max(top, minTop), maxBottom - h)
        if (top < minTop) top = minTop
        top = Math.round(top)
        this.panelTop = top
        this.panelMaxHeight = Math.max(80, Math.floor(maxBottom - top))
      })
    },
    cancelClose () {
      if (this.closeTimer) {
        clearTimeout(this.closeTimer)
        this.closeTimer = null
      }
    },
    scheduleClose () {
      this.cancelClose()
      this.closeTimer = setTimeout(() => {
        this.handleVisibleChange(false)
      }, 180)
    },
    handleMouseenter () {
      this.cancelClose()
      this.handleVisibleChange(true)
      this.$emit('hover', this.item)
    },
    handleMouseleave () {
      this.scheduleClose()
      this.$emit('leave', this.item)
    },
    handleOverlayMouseenter () {
      this.cancelClose()
      this.handleVisibleChange(true)
    },
    handleOverlayMouseleave () {
      this.scheduleClose()
    },
    searchPath (menus) {
      for (let i = 0, len = menus.length; i < len; i++) {
        const m2 = menus[i]
        if (this.showMenu(m2)) {
          if (m2.submenus) {
            for (let j = 0, jlen = m2.submenus.length; j < jlen; j++) {
              const m3 = m2.submenus[j]
              if (this.showMenu(m3)) {
                return m3.path
              }
            }
          } else {
            return m2.path
          }
        }
      }
    },
    handleVisibleChange (visible) {
      if (visible && this.globalRounded) {
        // 先按一级项估算位置，避免首帧闪到 (0,0)
        const trigger = this.getTriggerEl()
        if (trigger && trigger.getBoundingClientRect) {
          const rect = trigger.getBoundingClientRect()
          const minTop = this.getNavbarBottom()
          const maxBottom = this.getMaxBottom()
          this.panelLeft = Math.round(rect.right + 12)
          this.panelTop = Math.max(minTop, Math.round(rect.top))
          this.panelMaxHeight = Math.max(80, Math.floor(maxBottom - minTop))
        }
        this.visible = true
        this.$nextTick(() => this.updateFixedPanel())
        return
      }
      this.visible = visible
    },
    handleL2LinkClick () {
      this.visible = false
      this.$emit('route-change')
    },
    handleL1LinkClick () {
      this.visible = false
      this.$emit('route-change')
      let path
      if (this.item.menus) {
        path = this.searchPath(this.item.menus)
      } else {
        path = this.item.menu.path
      }
      this.$router.push(path)
    },
    getPopupContainer () {
      return document.querySelector('#sidebar-wrap') || document.body
    },
  },
}
</script>

<style lang="less">
@import "../../styles/less/theme";

// 对齐 antd zoom-big：二级面板进出场
.l2-zoom-big-enter-active,
.l2-zoom-big-leave-active {
  transition: opacity 0.2s cubic-bezier(0.08, 0.82, 0.17, 1),
    transform 0.2s cubic-bezier(0.08, 0.82, 0.17, 1);
  transform-origin: left center;
}
.l2-zoom-big-enter-from,
.l2-zoom-big-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.l2-zoom-big-enter-to,
.l2-zoom-big-leave-from {
  opacity: 1;
  transform: scale(1);
}

.l2-fixed-panel {
  padding: 0;
  pointer-events: auto;
  .l2-fixed-panel-inner {
    background-color: @sidebar-dark-bg-color;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    height: 100%;
    max-height: inherit;
  }
  .l2-menu-list-wrap {
    max-height: inherit;
    overflow-y: auto;
    min-width: 168px;
    max-width: 168px;
    box-sizing: border-box;
    margin-right: -6px;
    padding: 6px 6px 20px 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
    &::-webkit-scrollbar {
      width: 4px;
      background: transparent;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.22);
      border-radius: 2px;
    }
  }
  .l2-menu-list {
    padding: 2px 8px 0 12px;
    &:last-child {
      padding-bottom: 4px;
    }
    .l2-menu-group {
      padding-bottom: 4px;
      margin-bottom: 2px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    &:last-child .l2-menu-group {
      border-bottom: none;
      margin-bottom: 0;
    }
    .l2-menu-group-title {
      font-size: 14px;
      line-height: 22px;
      color: rgba(255, 255, 255, 0.45);
      margin: 4px 0 2px;
      padding: 0;
      margin-left: 3px;
    }
    .l2-menu-item {
      position: relative;
      display: block;
      margin: 1px 0;
      padding: 5px 8px 5px 20px;
      text-indent: 0;
      border-radius: 0;
      font-size: 14px;
      line-height: 22px;
      color: rgba(255, 255, 255, 0.75);
      background: transparent !important;
      text-decoration: none;
      transition: color 0.15s ease;
      &:hover,
      &:focus,
      &:active {
        text-decoration: none;
      }
      &:hover,
      &.active {
        background: transparent !important;
        color: #fff;
        text-decoration: none;
        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transform: translate(4px, -50%);
          background-color: var(--oc-sidebar-accent-color, @primary-5);
        }
      }
    }
  }
}

.l2-fixed-panel.light-theme {
  .l2-fixed-panel-inner {
    background-color: @sidebar-light-bg-color;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  .l2-menu-list-wrap {
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.18);
    }
  }
  .l2-menu-list {
    .l2-menu-group {
      border-bottom-color: rgba(0, 0, 0, 0.08);
    }
    .l2-menu-group-title {
      color: rgba(0, 0, 0, 0.45);
    }
    .l2-menu-item {
      color: @sidebar-light-text-color;
      &:hover,
      &.active {
        color: var(--ant-color-primary, @primary-color);
      }
    }
  }
}

.l2-menus-popover:not(.l2-fixed-panel) {
  padding: 0;
  .ant-popover-inner {
    background-color: @sidebar-dark-bg-color;
  }
  .ant-popover-arrow {
    display: none;
  }
  .ant-popover-inner-content {
    padding: 0;
    margin-top: 0;
    max-height: calc(100vh - 120px);
    overflow: auto;
    min-width: 180px;
    max-width: 180px;
  }
  &.cloudshell-open {
    :deep(.ant-popover-inner-content) {
      max-height: var(--popover-max-height, calc(100vh - 120px)) !important;
    }
  }
  &.light-theme {
    .ant-popover-inner {
      background-color: @sidebar-light-bg-color;
    }
    .l2-menu-list {
      .l2-menu-group-title {
        color: rgba(0, 0, 0, 0.65);
        font-weight: 500;
      }
      .l2-menu-item {
        color: @sidebar-light-text-color;
        &:hover {
          background-color: @primary-1;
          color: @sidebar-light-hover-text-color;
        }
        &.active {
          background-color: @primary-1 !important;
          color: @sidebar-light-active-text-color;
        }
      }
    }
  }
}
.l2-menu-list-wrap {
  padding: 8px 0;
}
.l2-fixed-panel .l2-menu-list-wrap {
  padding: 6px 6px 20px 0;
}
.l2-menu-list {
  padding: 10px 10px 0 20px;
  .l2-menu-group {
    padding-bottom: 10px;
    border-bottom: 1px solid #E2E2E2;
  }
  &:last-child .l2-menu-group {
    border-bottom:none
  }
  .l2-menu-group-title {
    font-size: 14px;
    color: rgba(255, 255, 255, .7);
    line-height: 24px;
    margin-bottom: 6px;
    margin-top: 6px;
    padding: 0 2px;
  }
  .l2-menu-item {
    display: block;
    padding-bottom: 4px;
    padding-top: 4px;
    padding-left: 18px;
    padding-right: 16px;
    font-size: 14px;
    color: @sidebar-dark-text-color;
    text-decoration: none;
    &:hover,
    &:focus,
    &:active {
      text-decoration: none;
    }
    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: @sidebar-dark-hover-text-color;
    }
    &.active {
      background-color: rgba(255, 255, 255, 0.12) !important;
      color: @sidebar-dark-active-text-color;
    }
  }
}
.l2-fixed-panel .l2-menu-list {
  padding: 2px 8px 0 12px;
  .l2-menu-group {
    padding-bottom: 4px;
    margin-bottom: 2px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  &:last-child .l2-menu-group {
    border-bottom: none;
    margin-bottom: 0;
  }
  .l2-menu-group-title {
    font-size: 14px;
    line-height: 22px;
    color: rgba(255, 255, 255, 0.45);
    margin: 4px 0 2px;
    padding: 0;
    margin-left: 3px;
  }
  .l2-menu-item {
    position: relative;
    margin: 1px 0;
    padding: 5px 8px 5px 20px;
    line-height: 22px;
    color: rgba(255, 255, 255, 0.75);
    background: transparent !important;
    text-decoration: none;
    &:hover,
    &:focus,
    &:active,
    &.active {
      text-decoration: none;
    }
    &:hover {
      background-color: transparent !important;
      color: #fff;
    }
    &.active {
      background-color: transparent !important;
      color: #fff;
    }
  }
}
</style>
