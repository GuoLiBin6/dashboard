<template>
  <div class="app-container" :style="appContainerStyle">
    <template v-if="$store.state.auth.canRenderDefaultLayout">
      <navbar />
      <div class="app-content position-relative h-100">
        <sidebar-drawer
          v-if="isShowMenu"
          :active-menu="l2Menu"
          @hover-menu="handleHoverMenu"
          @leave-menu="handleLeaveMenu" />
        <l2-menu :l2-menu="l2Menu" v-if="l2MenuVisible && isShowMenu" />
        <div
          class="app-page-shell"
          :class="{ 'l2-menu-show': showL2Collapse && l2MenuVisibleForStore }">
          <div
            id="app-page"
            class="app-page">
            <div
              v-if="showL2Collapse"
              class="level-2-menu-collapse"
              @click="toggleL2Menu">
              <div class="level-2-menu-collapse-bg" />
              <div class="level-2-menu-collapse-icon d-flex align-items-center">
                <icon type="left" style="font-size: 12px;" v-show="l2MenuVisibleForStore" />
                <icon type="left" style="font-size: 12px;transform: rotate(180deg);" v-show="!l2MenuVisibleForStore" />
              </div>
            </div>
            <div
              class="app-page-scroll"
              :class="{ 'is-scrolling': isPageScrolling }"
              :style="appPageWrapperStyle"
              @scroll="handleAppPageScroll">
              <top-alert />
              <div class="app-page-content">
                <slot />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="h-100 d-flex align-items-center justify-content-center">
        <a-spin />
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Navbar from '@scope/layouts/Navbar'
import TopAlert from '@/sections/TopAlert'
import { menusConfig } from '@/router/routes'
import L2Menu from '../Sidebar/Menu'
import SidebarDrawer from '../Sidebar/Drawer'

const SCROLLBAR_HIDE_DELAY = 800

export default {
  name: 'DefaultLayout',
  components: {
    SidebarDrawer,
    Navbar,
    TopAlert,
    'l2-menu': L2Menu,
  },
  data () {
    return {
      l2MenuVisible: false,
      l2Menu: {},
      menuitems: menusConfig,
      isPageScrolling: false,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'globalRounded']),
    ...mapState('common', {
      openCloudShell: state => state.openCloudShell,
      cloudShellHeight: state => state.cloudShellHeight,
    }),
    isShowMenu () {
      const { globalSetting } = this.$store.state
      if (!globalSetting || (globalSetting && !globalSetting.value) || (globalSetting.value && !globalSetting.value.key)) {
        return true
      }
      return globalSetting.value.key.length > 0
    },
    l2MenuVisibleForStore () {
      return this.$store.state.setting.l2MenuVisible
    },
    // 有二级菜单的页面才显示折叠按钮；跟 app-page-shell 一起位移
    showL2Collapse () {
      return this.l2MenuVisible && this.isShowMenu && this.$route?.name !== 'Dashboard'
    },
    appPageWrapperStyle () {
      // 圆角布局下高度由 CSS top/bottom 决定；有底栏时用 padding-bottom 让位
      if (this.globalRounded) {
        return {
          display: 'flex',
          flexDirection: 'column',
        }
      }
      return {
        flex: '1 1 100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }
    },
    appContainerStyle () {
      if (this.openCloudShell) {
        const shellGap = this.globalRounded ? 5 : 0
        return {
          maxHeight: `calc(100% - ${this.cloudShellHeight + shellGap}px)`,
          flex: '1 1 auto',
        }
      }
      return {}
    },
  },
  watch: {
    $route: {
      handler (val, oldVal) {
        this.updateL2MenuByRoute(val, oldVal)
      },
      immediate: true,
    },
    showL2Collapse: {
      handler (val) {
        this.$store.commit('setting/SET_L2_MENU_CONTENT_SHOW', !!val)
      },
      immediate: true,
    },
  },
  beforeUnmount () {
    if (this._scrollbarHideTimer) {
      clearTimeout(this._scrollbarHideTimer)
      this._scrollbarHideTimer = null
    }
  },
  methods: {
    handleAppPageScroll () {
      this.isPageScrolling = true
      if (this._scrollbarHideTimer) clearTimeout(this._scrollbarHideTimer)
      this._scrollbarHideTimer = setTimeout(() => {
        this.isPageScrolling = false
        this._scrollbarHideTimer = null
      }, SCROLLBAR_HIDE_DELAY)
    },
    updateL2MenuByRoute (val, oldVal) {
      if (!val || !val.matched || !val.matched.length) return
      const newParentPath = val.matched[0]?.path
      const oldParentPath = oldVal?.matched?.[0]?.path
      if (oldVal && newParentPath === oldParentPath) return
      const firstMatched = val.matched[0]
      if (!firstMatched?.meta) {
        this.l2Menu = {}
        this.l2MenuVisible = false
        return
      }
      for (let i = 0, len = this.menuitems.length; i < len; i++) {
        const item = this.menuitems[i]
        if (item?.meta?.group === firstMatched.meta.group) {
          this.l2Menu = item
          this.l2MenuVisible = !!item.menus
          return
        }
      }
      this.l2Menu = {}
      this.l2MenuVisible = false
    },
    handleHoverMenu (item) {
      if (!item) return
      // hover 一级菜单时，临时展示该一级菜单的二级菜单
      if (item.menus) {
        this.l2Menu = item
        this.l2MenuVisible = true
      }
    },
    handleLeaveMenu () {
      // 离开后恢复为当前路由所在 group 的菜单
      this.updateL2MenuByRoute(this.$route, null)
    },
    toggleL2Menu () {
      this.$store.commit('setting/SET_L2_MENU_VISIBLE', !this.l2MenuVisibleForStore)
    },
  },
}
</script>

<style lang="less" scoped>
.app-content {
  padding-top: 60px;
  display: flex;
  flex-direction: column;
}
.app-page-shell {
  position: relative;
  // 高于 level-2-wrap(z-index:5)，避免折叠按钮被二级菜单盖住
  z-index: 6;
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  // 与 level-2-wrap width 动画同步，按钮随 shell 一起移动
  transition: margin-left .2s ease;

  &.l2-menu-show {
    margin-left: 160px;
  }
}
.app-page {
  position: relative;
  // margin-bottom: 74px;
  padding: 15px 15px 0 15px;
  flex: 1 1 0%;
  min-height: 0;
  // 纵向只在这一层滚动；子级不要再 overflow-y:auto，否则与这里叠成双竖条
  // 横向不要在这一层滚动：宽表格由 vxe-table 内部滚动，否则会出现「页面一条 + 表格一条」双横向滚动条
  overflow-y: auto;
  overflow-x: hidden;
}
.app-page-content {
  flex: 1;
  overflow: visible;
  min-height: 0;
  // height: 100%;
}

// 始终收在 app-page 内侧左缘，不探出
.level-2-menu-collapse {
  position: absolute;
  left: 0;
  top: 50%;
  margin-top: -33px;
  height: 66px;
  width: 12px;
  z-index: 6;
  cursor: pointer;

  .level-2-menu-collapse-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: none;
    // 左侧高、右侧低（箭头朝右）
    border-left: 12px solid #EBEBEB;
    z-index: 1;
  }

  .level-2-menu-collapse-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    background-color: transparent;
    color: #C1C1C1;
    justify-content: center;
  }

  &:hover {
    .level-2-menu-collapse-bg {
      border-left-color: #DEDEDE;
    }
    .level-2-menu-collapse-icon {
      color: #888;
    }
  }
}
</style>
