<template>
  <div class="cloudshell-box" v-cloudshellDragResize="handleResize" v-if="openCloudShell" :style="cloudShellStyle">
    <div class="cloudshell-wrapper">
      <div class="cloudshell-header">
        <div class="cloudshell-header-title">
          <icon type="cloudshell" class="icon" />
          <span class="ml-1">CloudShell</span>
        </div>
        <div class="cloudshell-actions">
          <div class="cloudshell-action" @click="handleResizeChange('minimize')">
            <icon type="minimize" class="action-icon" />
          </div>
          <div class="cloudshell-action" @click="handleResizeChange('bigger')">
            <icon type="bigger" class="action-icon" />
          </div>
          <div class="cloudshell-action" @click="handleResizeChange('smaller')">
            <icon type="smaller" class="action-icon" />
          </div>
          <div class="cloudshell-action cloudshell-action-close" @click="closeCloudShell">
            <icon type="close-outlined" class="action-icon" />
          </div>
        </div>
      </div>
      <div class="cloudshell-content">
        <xterm ref="xterm" :connectParams="connectParams" class="w-100 h-100" @close="onCloudShellClose" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getMaxCloudShellHeight } from '@/utils/cloudshell'

export default {
  name: 'OcTerm',
  data () {
    return {
      connectParams: '',
      viewportRev: 0,
      isMaximized: false,
    }
  },
  computed: {
    ...mapState('common', {
      openCloudShell: state => state.openCloudShell,
      cloudShellHeight: state => state.cloudShellHeight,
    }),
    cloudShellStyle () {
      void this.viewportRev
      const maxHeight = getMaxCloudShellHeight()
      const height = this.openCloudShell ? Math.min(this.cloudShellHeight, maxHeight) : 0
      return {
        height: `${height}px`,
        maxHeight: `${maxHeight}px`,
        flex: `0 0 ${height}px`,
      }
    },
  },
  watch: {
    openCloudShell (val) {
      this.$nextTick(() => {
        if (val) {
          this.isMaximized = false
          this.bindViewportListener()
          this.syncCloudShellHeight()
          this.fetchData()
        } else {
          this.isMaximized = false
          this.unbindViewportListener()
          this.connectParams = ''
        }
      })
    },
    $route (to) {
      if (to.path && to.path.startsWith('/auth/login')) {
        this.$store.commit('common/SET_OPEN_CLOUDSHELL', false)
      }
    },
  },
  mounted () {
    if (this.openCloudShell) {
      this.bindViewportListener()
      this.syncCloudShellHeight()
    }
  },
  beforeUnmount () {
    this.unbindViewportListener()
  },
  methods: {
    bindViewportListener () {
      if (this._onViewportChange) return
      this._onViewportChange = () => {
        if (this._viewportRaf) cancelAnimationFrame(this._viewportRaf)
        this._viewportRaf = requestAnimationFrame(() => {
          this._viewportRaf = 0
          this.viewportRev += 1
          this.syncCloudShellHeight()
          if (this.$refs.xterm?.term) this.$refs.xterm.term.fit()
        })
      }
      window.addEventListener('resize', this._onViewportChange, { passive: true })
    },
    unbindViewportListener () {
      if (this._onViewportChange) {
        window.removeEventListener('resize', this._onViewportChange)
        this._onViewportChange = null
      }
      if (this._viewportRaf) {
        cancelAnimationFrame(this._viewportRaf)
        this._viewportRaf = 0
      }
    },
    applyDomHeight (height, maxHeight) {
      const containerDom = document.querySelector('.cloudshell-box')
      if (!containerDom) return
      containerDom.style.height = `${height}px`
      containerDom.style.maxHeight = `${maxHeight}px`
      containerDom.style.flex = `0 0 ${height}px`
      const dragDom = containerDom.querySelector('.cloudshell-wrapper')
      if (dragDom) {
        dragDom.style.height = `${height}px`
        dragDom.style.flex = `0 0 ${height}px`
      }
    },
    syncCloudShellHeight () {
      const maxHeight = getMaxCloudShellHeight()
      // 最大化随窗口贴合安全上边界；非最大化仅防止越界
      const next = this.isMaximized ? maxHeight : Math.min(this.cloudShellHeight, maxHeight)
      if (next !== this.cloudShellHeight) {
        this.$store.commit('common/SET_CLOUDSHELL_HEIGHT', next)
      }
      this.applyDomHeight(next, maxHeight)
    },
    async fetchData () {
      const { data } = await new this.$Manager('webconsole', 'v1').objectRpc({
        methodname: 'DoCloudShell',
      })
      this.$nextTick(() => {
        this.connectParams = data.connect_params
      })
    },
    closeCloudShell () {
      this.$store.commit('common/SET_OPEN_CLOUDSHELL', false)
    },
    handleResize () {
      const containerDom = document.querySelector('.cloudshell-box')
      if (containerDom) {
        const maxHeight = getMaxCloudShellHeight()
        const height = Math.min(containerDom.getBoundingClientRect().height, maxHeight)
        this.isMaximized = height >= maxHeight - 1
        this.$store.commit('common/SET_CLOUDSHELL_HEIGHT', height)
        this.applyDomHeight(height, maxHeight)
      }
      if (this.$refs.xterm) this.$refs.xterm.term.fit()
    },
    onCloudShellClose () {
      console.log('cloudshell close!!!')
      this.$nextTick(() => {
        this.closeCloudShell()
      })
    },
    handleResizeChange (type) {
      const containerDom = document.querySelector('.cloudshell-box')
      const headerHeight = 28
      const maxHeight = getMaxCloudShellHeight()
      let height = maxHeight
      if (type === 'bigger') {
        this.isMaximized = true
        height = maxHeight
      } else if (type === 'smaller') {
        this.isMaximized = false
        height = Math.min(350, maxHeight)
      } else if (type === 'minimize') {
        this.isMaximized = false
        if (containerDom.clientHeight <= headerHeight + 2) {
          height = Math.min(350, maxHeight)
        } else {
          height = headerHeight
        }
      }
      this.applyDomHeight(height, maxHeight)
      this.$store.commit('common/SET_CLOUDSHELL_HEIGHT', height)
      if (this.$refs.xterm) this.$refs.xterm.term.fit()
    },
  },
}
</script>

<style lang="scss" scoped>
.cloudshell-box {
  width: 100%;
  // height: 350px;
  position: relative;
  // flex: 0 0 350px;
  overflow: hidden;
}
.cloudshell-wrapper {
  // position: fixed;
  // top: calc(100vh - 355px);
  // height: 350px;
  // width: calc(100vw - 10px);
  // left: 5px;
  // right: 5px;
  // bottom: 5px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  background: #000;
  // border-radius: 3px;
}
.cloudshell-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 28px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 0 10px;
  background-color: #eaeaea;
  color: rgba(0, 0, 0, 0.45);
  box-sizing: border-box;
  .cloudshell-header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 100%;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
    line-height: 1;
    user-select: none;
    .icon {
      font-size: 15px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }
  .cloudshell-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 100%;
  }
  .cloudshell-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.45);
    transition: background-color 0.15s ease, color 0.15s ease;
    .action-icon {
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      pointer-events: none; // 点击落在父级，避免 icon 吞事件
    }
    &:hover {
      color: #1677ff;
      background: rgba(0, 0, 0, 0.06);
    }
  }
}
.cloudshell-content {
  position: absolute;
  top: 28px;
  bottom: 10px;
  left: 10px;
  right: 10px;
  background: #000;
  padding-bottom: 10px;
  :deep(#xterm) {
    height: 100% !important;
    min-height: auto !important;
  }
  :deep(.xterm-viewport) {
    height: 100%!important;
    overflow-y: auto;
  }
  :deep(.xterm-viewport::-webkit-scrollbar) {
    width: 15px;
  }
}
</style>
