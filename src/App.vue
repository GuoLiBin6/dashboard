<template>
  <icon-context-provider>
    <a-config-provider :locale="locale" :theme="antdTheme">
      <div
        id="app"
        :class="{ 'app-global-rounded': showGlobalRounded, 'oc-theme-light': theme === 'light', 'oc-dark-mode': darkMode }"
        :style="appGlobalBgStyle"
        @click="handleAppAction">
      <component :is="layout" :key="layout">
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
import { theme as antdThemeConfig } from 'ant-design-vue'
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
import { hexToRgbChannels, resolveThemeBgColor, resolveDarkPrimary, resolveLightPrimary } from '@/utils/theme/utils'
import { applyDarkModeClass, applyDarkBgColor } from '@/utils/theme/darkMode'
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
    }
  },
  computed: {
    locale () {
      return antdLocales[this.$store?.getters?.setting?.language] || zhCN
    },
    ...mapGetters(['auth', 'theme', 'themeColor', 'themeBgColor', 'darkBgColor', 'darkMode', 'scope', 'globalRounded', 'isSysCE']),
    // 实际生效的主色：按明暗模式分别做微调（暗色换柔和版本，浅色压掉个别过淡的色）
    primaryColor () {
      const hex = this.themeColor || process.env.THEME_COLOR || '#1890ff'
      return this.darkMode ? resolveDarkPrimary(hex) : resolveLightPrimary(hex)
    },
    // antd 主题：深色模式走 darkAlgorithm，浅色保持原 token
    antdTheme () {
      const primary = this.primaryColor || process.env.THEME_COLOR || '#1890ff'
      const token = {
        colorPrimary: primary,
        // info（含 a-alert type=info）默认蓝，需与主题色对齐
        colorInfo: primary,
        colorLink: primary,
        colorLinkHover: primary,
        colorLinkActive: primary,
        fontWeightStrong: 600,
        fontSize: 14,
      }
      if (this.darkMode) {
        return {
          algorithm: antdThemeConfig.darkAlgorithm,
          token: {
            ...token,
            colorBgContainer: '#1a1c21',
            colorBgElevated: '#262931',
            colorBgLayout: this.darkBgColor,
            colorBorder: 'rgba(255, 255, 255, 0.42)',
            colorBorderSecondary: '#262931',
            // 文字分三档，避免全站纯白过亮 / 次级过灰看不清
            colorText: 'rgba(255, 255, 255, 0.88)',
            colorTextHeading: 'rgba(255, 255, 255, 0.88)',
            colorTextSecondary: 'rgba(255, 255, 255, 0.66)',
            colorTextTertiary: 'rgba(255, 255, 255, 0.5)',
            colorTextQuaternary: 'rgba(255, 255, 255, 0.35)',
            // 禁用态单独给一档暗弱值，避免跟随 colorBorder 提亮后看起来像可用
            colorTextDisabled: 'rgba(255, 255, 255, 0.3)',
            colorBgContainerDisabled: 'rgba(255, 255, 255, 0.15)',
          },
        }
      }
      return {
        algorithm: antdThemeConfig.defaultAlgorithm,
        token: {
          ...token,
          colorText: '#606266',
          colorTextSecondary: '#909399',
          colorTextTertiary: '#909399',
          colorTextQuaternary: '#c0c4cc',
          colorTextHeading: '#303133',
        },
      }
    },
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
      // 深色模式：使用深色色板里选中的底色（未选则用默认色）
      if (this.darkMode) {
        const hex = this.darkBgColor
        return {
          '--oc-global-bg-rgb': hexToRgbChannels(hex),
          '--oc-global-bg-alpha': 1,
          backgroundColor: hex,
        }
      }
      const raw = this.enableThemeBg ? this.themeBgColor : null
      const hex = resolveThemeBgColor(raw)
      const rgb = hexToRgbChannels(hex)
      // 色板已按明度派生为实色，这里直接用实色（无背景 → 灰）
      const alpha = 1
      return {
        '--oc-global-bg-rgb': rgb,
        '--oc-global-bg-alpha': alpha,
        backgroundColor: `rgba(${rgb}, ${alpha})`,
      }
    },
  },
  watch: {
    // 深色底写进 <html> 内联变量，body / #app / 非圆角壳一起跟随
    darkBgColor: {
      handler (hex) {
        applyDarkBgColor(this.darkMode ? hex : '')
      },
      immediate: true,
    },
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
    // 跟随 primaryColor：深色模式下换风格/换主题色都要重写变量
    primaryColor: {
      handler (val) {
        const primary = val || process.env.THEME_COLOR || '#1890ff'
        document.documentElement.style.setProperty('--antd-wave-shadow-color', primary)
        document.documentElement.style.setProperty('--ant-color-primary', primary)
        document.documentElement.style.setProperty('--ant-color-info', primary)
        document.documentElement.style.setProperty('--ant-color-link', primary)
        document.documentElement.style.setProperty('--ant-color-link-hover', primary)
      },
      immediate: true,
    },
    darkMode: {
      handler (val) {
        this.applyDarkMode(val)
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
    // 深色模式标记挂到 html 上：Modal / Dropdown / Select 等浮层挂在 body，也能命中
    applyDarkMode (on) {
      applyDarkModeClass(!!on)
      applyDarkBgColor(on ? this.darkBgColor : '')
    },
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
