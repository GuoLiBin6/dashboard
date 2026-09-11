<template>
  <a-drawer
    placement="left"
    id="sidebar-wrap"
    :closable="false"
    :open="drawerVisible"
    :zIndex="97"
    :maskStyle="maskStyle"
    :contentWrapperStyle="contentWrapperStyle"
    :getContainer="getDrawerContainer"
    :width="width"
    :body-style="wrapStyle"
    @close="handleClose">
    <products-list
      @route-change="handleClose"
      @hover="$emit('hover-menu', $event)"
      @leave="$emit('leave-menu', $event)"
      :active-menu="activeMenu"
      :popover-align="popoverAlign" />
  </a-drawer>
</template>

<script>
import get from 'lodash/get'
import { mapGetters, mapState } from 'vuex'
import ProductsList from '@/sections/ProductsList'

export default {
  name: 'Sidebar',
  components: {
    ProductsList,
  },
  props: {
    activeMenu: Object,
  },
  data () {
    return {
      width: 200,
    }
  },
  computed: {
    ...mapGetters(['common', 'globalRounded', 'theme']),
    sidebarBgColor () {
      return this.theme === 'light' ? '#f0f2f5' : '#001529'
    },
    ...mapState('common', {
      openCloudShell: state => state.openCloudShell,
      cloudShellHeight: state => state.cloudShellHeight,
    }),
    sidebar () {
      return this.common.sidebar
    },
    drawerVisible () {
      return get(this.common, 'sidebar.drawerVisible', false)
    },
    // 全局圆角：一二级间距收紧（原 8px 偏疏）
    popoverAlign () {
      return { offset: [this.globalRounded ? 12 : 0, 0] }
    },
    contentWrapperStyle () {
      const style = { zIndex: 98 }
      if (!this.globalRounded) return style
      return {
        ...style,
        top: '72px',
        left: '5px',
        bottom: '5px',
        height: 'auto',
        borderRadius: '6px',
        overflow: 'hidden',
        background: this.sidebarBgColor,
      }
    },
    maskStyle () {
      const style = { zIndex: 97 }
      if (!this.globalRounded) return style
      return {
        ...style,
        top: '72px',
        left: '5px',
        right: '5px',
        bottom: '5px',
        borderRadius: '6px',
      }
    },
    wrapStyle () {
      // 全局圆角时保留 8px 顶距；body 同步深色底，避免 antd 默认白底露出白边
      const paddingTop = this.globalRounded ? 8 : 60
      const style = {
        paddingTop: `${paddingTop}px`,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        height: '100%',
      }
      if (this.globalRounded) {
        style.background = this.sidebarBgColor
      }
      if (this.openCloudShell) {
        style.height = `calc(100% - ${this.cloudShellHeight}px)`
      }
      return style
    },
  },
  methods: {
    getDrawerContainer () {
      // 全局圆角：挂到 #app，避免 #app-page overflow:hidden 裁剪浮层；关闭时保持原挂载
      if (this.globalRounded) {
        return document.querySelector('#app') || document.body
      }
      return document.querySelector('#app-page') || document.body
    },
    handleClose () {
      this.$store.dispatch('common/updateObject', {
        name: 'sidebar',
        data: {
          drawerVisible: false,
        },
      })
    },
  },
}
</script>
