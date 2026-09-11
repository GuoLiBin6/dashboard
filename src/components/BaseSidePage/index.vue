<template>
  <teleport to="body">
    <div class="side-page-wrap" :style="wrapComputedStyle">
      <div class="side-page" :class="{ 'first-side-page': isFirstSidePage }">
        <div class="side-page-header" id="side-page-header">
          <!-- close：吸附左上角 -->
          <div class="side-page-custom-close" :class="{ 'is-back': !isFirstSidePage }">
            <div class="side-page-close-inner" @click="cancel">
              <icon :type="iconType" />
            </div>
          </div>
          <!-- header info -->
          <div class="side-page-header-info d-flex align-items-center">
            <div class="side-page-header-lead flex-grow-0 flex-shrink-0">
              <div class="side-page-header-icon d-flex align-items-center justify-content-center">
                <icon :type="icon" />
              </div>
            </div>
            <div class="w-100" style="min-width: 0;">
              <div class="side-page-header-content">
                <div class="side-page-header-type">{{ title }}</div>
                <div class="d-flex mt-1 w-100 align-items-center">
                  <h5 class="side-page-header-title text-truncate mb-0">{{ resName }}</h5>
                  <template v-if="loaded && !hasError">
                    <icon
                      v-if="!isBillSidepage"
                      class="side-page-refresh ml-2"
                      type="refresh"
                      :spin="refreshDetail"
                      @click="refreshDetailHandler()" />
                    <div class="ml-3 flex-shrink-0 d-flex pr-2">
                      <div class="pr-4 side-page-header-actions"><slot name="actions" /></div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <!-- header tabs -->
          <div class="side-page-header-tabs">
            <a-tabs
              :active-key="currentTab"
              :animated="false"
              :tab-bar-gutter="0"
              :tab-bar-style="{ padding: '0 14px', marginBottom: 0 }"
              @change="handleTabChange">
              <a-tab-pane
                v-for="item of filteredTabs"
                :key="item.key"
                :tab="item.label"
                :disabled="hasError || item.disabled" />
            </a-tabs>
          </div>
        </div>
        <div class="side-page-inner-content">
          <div class="side-page-container" id="side-page-container">
            <template v-if="!loaded">
              <loading-block :layout="loadingLayout" />
            </template>
            <template v-else>
              <template v-if="hasError">
                <data-empty :description="errorInfo.detail" />
              </template>
              <template v-else>
                <a-skeleton v-if="refreshDetail" active :paragraph="{ rows: 6 }" />
                <slot v-else />
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import * as R from 'ramda'
import { mapGetters, mapState } from 'vuex'
import Clickoutside from '@/directives/clickoutside'
import { getHttpErrorMessage } from '@/utils/error'
import { isScopedPolicyMenuHidden } from '@/utils/scopedPolicy'

export default {
  name: 'BaseSidePage',
  directives: {
    Clickoutside,
  },
  // 根节点为 teleport，无法透传 attrs；侧栏历史写法常带 :actions，会触发 extraneous 警告
  inheritAttrs: false,
  inject: ['requestError'],
  props: {
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    resName: {
      type: String,
      required: true,
      default: '',
    },
    currentTab: {
      type: String,
      // required: true,
    },
    tabs: {
      type: Array,
      required: true,
    },
    loaded: Boolean,
    // 兼容旧侧栏 :actions="params.actions"；实际操作用具名 slot actions
    actions: {
      type: [Array, Function, Object],
      default: null,
    },
  },
  data () {
    return {
      loadingLayout: [
        [10],
        [8, 9],
        [2, 4, 7, 5],
        [13, 9],
        [4, 3, 8],
        [8, 6, 8],
        [13, 9],
      ],
      wrapStyle: { left: '300px' },
      refreshDetail: false,
      _autoInitTabKey: '',
    }
  },
  provide: {
    inBaseSidePage: true,
  },
  computed: {
    ...mapGetters(['globalRounded']),
    ...mapState('sidePage', {
      sidepageLeft: state => state.sidepageLeft,
    }),
    ...mapState('common', {
      cloudShellHeight: state => state.openCloudShell ? state.cloudShellHeight : 0,
    }),
    ...mapState('setting', {
      l2MenuVisibleForStore: state => state.l2MenuVisible,
      l2MenuContentShow: state => state.l2MenuContentShow,
    }),
    errorInfo () {
      return this.requestError.error && getHttpErrorMessage(this.requestError.error)
    },
    hasError () {
      return !R.isNil(this.errorInfo) && !R.isEmpty(this.errorInfo)
    },
    windowId () {
      return this.$parent.windowId
    },
    sidePageIds () {
      return this.$store.state.sidePage.sidePageIds
    },
    isFirstSidePage () {
      return this.sidePageIds[0] === this.windowId
    },
    iconType () {
      return this.isFirstSidePage ? 'close-outlined' : 'left'
    },
    isBillSidepage () {
      return this.windowId.startsWith('Bill')
    },
    filteredTabs () {
      const filteredTabs = []
      if (this.tabs && this.tabs.length) {
        this.tabs.map(item => {
          if (!(item.key === 'event-drawer' && isScopedPolicyMenuHidden('sub_hidden_menus.log'))) {
            filteredTabs.push(item)
          }
        })
      }
      return filteredTabs
    },
    /** app-page 左边界（viewport 坐标估算，用于钳制 sidepage left） */
    appPageLeftPx () {
      if (!this.globalRounded) return 0
      // 与 CSS 变量默认值一致：inset 5 / l2 160 / gap 8
      const inset = 5
      const gap = 8
      const l2 = 160
      const l2Shown = this.l2MenuVisibleForStore && this.l2MenuContentShow
      return l2Shown ? inset + l2 + gap : inset
    },
    wrapComputedStyle () {
      const style = {
        ...(this.wrapStyle || {}),
      }
      if (this.globalRounded) {
        // teleport 到 body，必须用 fallback：CSS 变量定义在 #app 上，body 下不会继承
        const inset = 'var(--oc-page-inset, 5px)'
        const navbar = 'var(--oc-navbar-height, 60px)'
        const gap = 'var(--oc-page-gap, 8px)'
        style.top = `calc(${inset} + ${navbar} + ${gap})`
        style.right = inset
        style.bottom = this.cloudShellHeight > 0
          ? `calc(${inset} + ${this.cloudShellHeight}px + ${inset})`
          : inset
        style.borderRadius = '6px'
        style.overflow = 'hidden'
      } else {
        style.top = '60px'
        style.right = 0
        style.bottom = `${this.cloudShellHeight || 0}px`
      }
      return style
    },
  },
  watch: {
    sidepageLeft: {
      handler (val, oldVal) {
        if (val !== oldVal) {
          this.applySidepageLeft(val)
        }
      },
      immediate: true,
    },
    globalRounded () {
      this.applySidepageLeft(this.sidepageLeft)
    },
    l2MenuVisibleForStore () {
      this.applySidepageLeft(this.sidepageLeft)
    },
    l2MenuContentShow () {
      this.applySidepageLeft(this.sidepageLeft)
    },
  },
  mounted () {
    this.$nextTick(() => {
      // 避免 currentTab 由父组件/store 异步回填时反复触发 tab-change 导致递归更新
      if (!this.currentTab && this.filteredTabs && this.filteredTabs.length > 0) {
        const first = this.filteredTabs[0] && this.filteredTabs[0].key
        if (first && first !== this._autoInitTabKey) {
          this._autoInitTabKey = first
          this.handleTabChange(first)
        }
      }
    })
  },
  methods: {
    applySidepageLeft (val) {
      const minWidth = 800
      const rawLeft = val || 300
      const rightInset = this.globalRounded ? 5 : 0
      const minLeft = this.appPageLeftPx
      const maxLeft = Math.max(minLeft, (window?.innerWidth || 0) - rightInset - minWidth)
      const nextLeft = Math.min(Math.max(rawLeft, minLeft), maxLeft)
      this.wrapStyle.left = `${nextLeft}px`
    },
    cancel () {
      this.$emit('cancel')
    },
    handleTabChange (key) {
      // Tabs 在 active-key 受控更新时可能重复触发 change；同 key 不再向上 emit，避免递归更新
      if (key === this.currentTab) return
      this.$emit('tab-change', key)
    },
    refreshDetailHandler () {
      this.refreshDetail = true
      const idx = this.filteredTabs.findIndex(item => item.key === this.currentTab)
      if (idx === 0) {
        this.$bus.$emit('refresh-detail')
      }
      setTimeout(() => {
        this.refreshDetail = false
      }, 500)
    },
  },
}
</script>

<style lang="less">
@import "../../styles/less/theme";

.side-page-wrap {
  position: fixed;
  z-index: 97;
  background-color: #fff;
  left: 500px;
  right: 0;
  bottom: 0;
  top: 60px;
  /* 阴影放在 wrap 上，避免 overflow:hidden 裁切子元素阴影 */
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.08);
}

.side-page {
  height: 100%;
}

.side-page-header {
  background-color: #fff;
  height: 124px;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  border-bottom: 1px solid #f0f0f0;
}

/* 关闭按钮吸附左上角 */
.side-page-custom-close {
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  width: 64px;
  height: 64px;
  z-index: 2;

  .side-page-close-inner {
    background-color: var(--ant-color-primary, @primary-color);
    position: absolute;
    left: -32px;
    top: -32px;
    width: 100%;
    height: 100%;
    cursor: pointer;
    transform: rotate(45deg);
    color: #fff;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--ant-color-primary, @primary-color) 28%, transparent);
    transition-property: background-color, box-shadow;
    transition-duration: 0.15s;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);

    .oc-icon {
      transform: rotate(-45deg);
      position: absolute;
      right: 6px;
      top: 24px;
      color: #fff;
      font-size: 15px;
    }

    &:hover {
      background-color: color-mix(in srgb, var(--ant-color-primary, @primary-color) 88%, #000);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--ant-color-primary, @primary-color) 36%, transparent);
    }
  }

  /* left 字形视觉偏小，略放大以和关闭图标观感一致 */
  &.is-back .side-page-close-inner .oc-icon {
    font-size: 18px;
    right: 5px;
    top: 23px;
  }
}

.side-page-header-info {
  height: 80px;
  padding: 0 24px 0 16px;
  gap: 16px;
}

/* 关闭下方的图标列 */
.side-page-header-lead {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 64px;
  height: 100%;
  padding: 28px 0 8px;
  box-sizing: border-box;
}

.side-page-header-icon {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;

  .oc-icon {
    font-size: 36px;
    color: var(--oc-color-text, rgba(0, 0, 0, 0.75));
  }
}

.side-page-header-content {
  min-width: 0;
}

.side-page-header-type {
  font-size: 13px;
  line-height: 20px;
  color: var(--oc-color-text-secondary, rgba(0, 0, 0, 0.55));
}

.side-page-header-title {
  min-width: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  color: var(--oc-color-text-heading, rgba(0, 0, 0, 0.88));
}

.side-page-refresh {
  color: var(--oc-color-text-secondary, rgba(0, 0, 0, 0.55));
  cursor: pointer;
  font-size: 16px;

  &:hover {
    color: var(--ant-color-primary, @primary-color);
  }
}

.side-page-header-actions {
  font-size: 14px;
}

.side-page-header-tabs {
  height: 44px;
  overflow: hidden;

  .ant-tabs,
  .ant-tabs-nav,
  .ant-tabs-nav-wrap,
  .ant-tabs-nav-list {
    height: 100%;
  }

  .ant-tabs-nav {
    margin: 0 !important;
  }

  .ant-tabs-nav::before {
    border-bottom: none !important;
  }

  .ant-tabs-tab {
    height: 100%;
    margin: 0 !important;
    // gutter 并入左右 padding，底线按完整 tab 宽（含 padding），文字间距保持约 32px
    padding: 0 16px !important;
    font-size: 14px;
    color: var(--oc-color-text, rgba(0, 0, 0, 0.75));

    &:hover {
      color: var(--ant-color-primary, @primary-color);
    }

    &.ant-tabs-tab-active::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
      background: var(--ant-color-primary, @primary-color);
    }
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: var(--ant-color-primary, @primary-color) !important;
    font-weight: 600;
    text-shadow: none !important;
  }

  // 改用 tab::after，隐藏默认按文字宽度计算的 ink-bar
  .ant-tabs-ink-bar {
    display: none !important;
  }

  .ant-tabs-content-holder {
    display: none;
  }
}

.side-page-inner-content {
  position: absolute;
  top: 124px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}

.side-page-container {
  height: 100%;
  width: 100%;
  padding: 20px 30px;
  box-sizing: border-box;
}
</style>
