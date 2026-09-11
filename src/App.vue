<template>
  <icon-context-provider>
    <a-config-provider :locale="locale" :theme="antdTheme">
      <div
        id="app"
        :class="{ 'app-global-rounded': showGlobalRounded, 'oc-theme-light': theme === 'light' }"
        :style="appGlobalBgStyle"
        @click="handleAppAction">
      <component :is="layout">
        <router-view style="height: 100%;" />
      </component>
      <oc-term />
      <dialog-manager />
      <side-page-manager />
      <window-resize-listener />
    </div>
    </a-config-provider>
  </icon-context-provider>
</template>

<script>
import * as R from 'ramda'
import { mapGetters, mapState } from 'vuex'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import jaJP from 'ant-design-vue/es/locale/ja_JP'
import FullScreenLayout from '@/layouts/FullScreen'
// 同步加载：异步 Layout + 默认插槽在生产分包下易触发 renderSlot null.ce
import DefaultLayout from '@scope/layouts/Default'
import DialogManager from '@/sections/DialogManager'
import SidePageManager from '@/sections/SidePageManager'
import WindowResizeListener from '@/sections/WindowResizeListener'
import notificationListener from '@/utils/notificationListener'
import i18n from '@/locales'
import { hexToRgbChannels, resolveThemeBgColor, isThemeBgNone, THEME_BG_ALPHA } from '@/utils/theme/utils'
import setting from '@/config/setting'
import WindowsMixin from '@/mixins/windows'
import LogoutMixin from '@/mixins/logout'
import AuthTabSyncMixin from '@/mixins/authTabSync'
import IconContextProvider from '@/IconContextProvider'
import { isCE } from '@/utils/utils'

const antdLocales = {
  'zh-CN': zhCN,
  en: enUS,
  'ja-JP': jaJP,
}

export default {
  name: 'App',
  components: {
    IconContextProvider,
    DefaultLayout,
    FullScreenLayout,
    DialogManager,
    SidePageManager,
    WindowResizeListener,
  },
  mixins: [WindowsMixin, LogoutMixin, AuthTabSyncMixin],
  data () {
    return {
      monitorAlertTimer: null,
      antdTheme: {
        token: {
          colorPrimary: process.env.THEME_COLOR || '#1890ff',
          // info（含 a-alert type=info）默认蓝，需与主题色对齐
          colorInfo: process.env.THEME_COLOR || '#1890ff',
          colorLink: process.env.THEME_COLOR || '#1890ff',
          colorLinkHover: process.env.THEME_COLOR || '#1890ff',
          colorLinkActive: process.env.THEME_COLOR || '#1890ff',
          colorText: 'rgba(0, 0, 0, 0.75)',
          colorTextSecondary: 'rgba(0, 0, 0, 0.55)',
          colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
          colorTextQuaternary: 'rgba(0, 0, 0, 0.35)',
          colorTextHeading: 'rgba(0, 0, 0, 0.88)',
          fontWeightStrong: 600,
          fontSize: 14,
        },
      },
    }
  },
  computed: {
    locale () {
      return antdLocales[this.$store?.getters?.setting?.language] || zhCN
    },
    ...mapGetters(['auth', 'theme', 'themeColor', 'themeBgColor', 'scope', 'globalRounded', 'isSysCE']),
    ...mapState({
      globalSetting: state => state.globalSetting,
      tenant: state => state.auth.tenant,
      session: state => state.auth.auth.session,
    }),
    // 仅商业版应用可配置背景色
    enableThemeBg () {
      return !isCE() && !this.isSysCE
    },
    layout () {
      const route = this.$route || {}
      const path = route.path || ''
      const meta = route.meta || {}
      // 登录/认证相关路由一律使用全屏布局，避免 meta 异常导致只渲染 DefaultLayout
      if (path.startsWith('/auth') || meta.authPage || meta.layout === 'full-screen') {
        return 'FullScreenLayout'
      }
      return 'DefaultLayout'
    },
    // 业务页与登录/认证页统一套圆角壳与主题色底（由 setting.globalRounded 控制）
    showGlobalRounded () {
      if (!this.globalRounded) return false
      if (this.layout === 'DefaultLayout') return true
      const route = this.$route || {}
      const path = route.path || ''
      const meta = route.meta || {}
      return path.startsWith('/auth') || !!meta.authPage
    },
    // 全局圆角壳背景：直接绑 style，避免 animation forwards 锁死旧色
    appGlobalBgStyle () {
      if (!this.showGlobalRounded) return undefined
      const raw = this.enableThemeBg ? this.themeBgColor : null
      const hex = resolveThemeBgColor(raw)
      const rgb = hexToRgbChannels(hex)
      // 「无背景」用实色灰；彩色半透明
      const alpha = isThemeBgNone(raw) ? 1 : THEME_BG_ALPHA
      return {
        '--oc-global-bg-rgb': rgb,
        '--oc-global-bg-alpha': alpha,
        backgroundColor: `rgba(${rgb}, ${alpha})`,
      }
    },
  },
  watch: {
    'auth.auth' (val, oldVal) {
      if (val && !R.equals(val, oldVal)) {
        if (val.session) {
          this.connect(val.session)
        }
      }
    },
    'globalSetting.value.dictionary': {
      handler (val, oldVal) {
        i18n.setOriginDictionary()
        if (!R.equals(val, oldVal) && !R.isNil(val) && !R.isEmpty(val)) {
          if (!R.isNil(val.en) && !R.isEmpty(val.en)) {
            i18n.mergeLocaleMessage('en', {
              dictionary: val.en,
            })
          }
          if (!R.isNil(val.zh) && !R.isEmpty(val.zh)) {
            i18n.mergeLocaleMessage('zh-CN', {
              dictionary: val.zh,
            })
          }
          if (!R.isNil(val.ja) && !R.isEmpty(val.ja)) {
            i18n.mergeLocaleMessage('ja-JP', {
              dictionary: val.ja,
            })
          }
        }
        i18n.deepReplaceDictionary()
      },
      immediate: true,
    },
    themeColor: {
      handler (val) {
        const primary = val || process.env.THEME_COLOR || '#1890ff'
        // 换新 token 引用，确保 ConfigProvider / cssinjs 重新衍生 colorInfo*
        this.antdTheme.token = {
          ...this.antdTheme.token,
          colorPrimary: primary,
          colorInfo: primary,
          colorLink: primary,
          // link 按钮 hover/active 默认衍生自 colorInfo，不跟 colorLink，需显式同步为主题色
          colorLinkHover: primary,
          colorLinkActive: primary,
        }
        document.documentElement.style.setProperty('--antd-wave-shadow-color', primary)
        document.documentElement.style.setProperty('--ant-color-primary', primary)
        document.documentElement.style.setProperty('--ant-color-info', primary)
        document.documentElement.style.setProperty('--ant-color-link', primary)
        document.documentElement.style.setProperty('--ant-color-link-hover', primary)
      },
      immediate: true,
    },
  },
  created () {
    this.initIO()
    this.initMonitorAlertNotify()
  },
  beforeUnmount () {
    // 组件销毁时清除定时器
    if (this.monitorAlertTimer) {
      clearInterval(this.monitorAlertTimer)
      this.monitorAlertTimer = null
    }
  },
  methods: {
    initIO () {
      if (!this.$appConfig.isPrivate) return
      const options = {}
      if (process.env.NODE_ENV === 'production') {
        options.server = '/'
      }
      this.notificationListener = notificationListener(this.$store, options)
      this.socket = this.notificationListener.getSocket()
      this.connect(this.auth && this.auth.auth && this.auth.auth.session)
    },
    connect (session) {
      if (!session || !this.socket) return
      this.socket.io.opts.query.session = session
      this.socket.connect()
    },
    initMonitorAlertNotify () {
      // 防止重复创建定时器
      if (this.monitorAlertTimer) {
        clearInterval(this.monitorAlertTimer)
      }
      this.monitorAlertTimer = setInterval(() => {
        // 检测是否已登录，未登录则不执行 dispatch
        if (!this.session) return
        this.$store.dispatch('monitor/loadMonitorResourceAlerts')
      }, setting.monitorAlertNotifyTriggerTime)
      this.createDialog('MonitorAlertNotifyDialog', {})
    },
  },
}
</script>

<style lang="scss" scoped>
#app {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
