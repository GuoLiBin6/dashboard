import './config/compat'
import './config/vue.config'
import { Buffer } from 'buffer'
import Vue, { createApp, defineAsyncComponent } from 'vue'
// dayjs locale 须在 ant-design-vue 之前加载，保证 DatePicker 与业务共用同一实例语言包
import '@/utils/dayjs'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// import '../mock'
import VXETable from 'vxe-table'
import VXETablePluginAntd from 'vxe-table-plugin-antd'
import VxeUIBase from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'
import 'vxe-table-plugin-antd/dist/style.css'

import './styles/less/index.less'
import './styles/scss/index.scss'

import { uuid } from '@/utils/utils'
import { openWebConsole } from '@/utils/webconsole'
import '@/utils/polyfill'
import '@/config/appBuryPoint'
import setting from '@/config/setting'

import store from './store'
import router from './router'
import i18n, { i18nPlugin } from './locales'
import App from './App.vue'
import antdGlobalConfig from './plugins/antdGlobalConfig'
import antdFormLegacyCompat, { decoratorDirective } from './plugins/antdFormLegacyCompat'

import componentsPlugin from './components'
import './directives'
import './plugins'
import './permission'
import './filters'

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  // axios 取消请求（同 key 覆盖 / 硬超时）不作为错误刷屏
  const isAxiosCancel = !!(
    reason &&
    (reason.__CANCEL__ ||
      reason.name === 'Cancel' ||
      reason.name === 'CanceledError' ||
      (reason.constructor && reason.constructor.name === 'Cancel'))
  )
  if (isAxiosCancel) {
    event.preventDefault?.()
    return
  }
  // eslint-disable-next-line no-console
  console.error('[window:unhandledrejection]', reason)
})

// Vite5 默认不再注入 Node 全局变量，这里补齐浏览器端 Buffer（用于验证码等 base64 转换）
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer
}

// xe-utils v3 已内置 browse；不再从子路径手动挂载，避免 Vite 无法解析旧路径

// 拦截并阻止含 undefined 的非法 URL 请求（如 /auth/login/undefined），避免主题库等拼错 URL
if (typeof window !== 'undefined') {
  try {
    const isInvalidUrl = (u) => {
      const s = String(u ?? '')
      return s.includes('/undefined') || s.endsWith('/undefined') || s.includes('auth/login/undefined')
    }

    const origFetch = window.fetch
    if (typeof origFetch === 'function') {
      window.fetch = function patchedFetch (input, init) {
        const url = typeof input === 'string' ? input : input?.url
        if (isInvalidUrl(url)) {
          return Promise.resolve(new Response('', { status: 404, statusText: 'Not Found' }))
        }
        return origFetch.call(this, input, init)
      }
    }

    const origOpen = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open
    if (typeof origOpen === 'function') {
      window.XMLHttpRequest.prototype.open = function patchedOpen (method, url, ...rest) {
        if (isInvalidUrl(url)) {
          const fakeUrl = 'about:blank'
          return origOpen.call(this, method, fakeUrl, ...rest)
        }
        return origOpen.call(this, method, url, ...rest)
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[patch] fetch/xhr block invalid url failed', e)
  }
}

VXETable.use(VXETablePluginAntd)

// 调试兜底：用于确认浏览器已加载到最新 compat（可在 Console 看 window.__OC_COMPAT__）
if (typeof window !== 'undefined' && !window.__OC_COMPAT__) {
  window.__OC_COMPAT__ = { COMPONENT_ASYNC: false }
}

// vxe-table / vxe-pc-ui 内部通过 VxeUI.getI18n(key, args) 做文案插值（如「{0}条/页」「共 {0} 条记录」）。
// 若只调用 t(key) 而忽略 args，页码/总数/每页条数等数字会全部丢失。
function vxeTableI18n (key, args) {
  if (args === undefined || args === null) {
    return String(i18n.t(key))
  }
  // vxe 文案多为 "{0}{1}..." 列表占位。vue-i18n v11 必须用 **数组** 作为第二参数才能替换 {0}；
  // 若改成 {0: x} 对象形式，{0} 不会被替换，界面上会出现「共  条记录」、条/页数字为空。
  if (Array.isArray(args)) {
    return String(i18n.t(key, args))
  }
  return String(i18n.t(key, args))
}

// 使用 Vue 3 createApp + vue-router 4 的标准挂载方式
// compat：Vue.directive 写入 singletonApp，createApp 会继承
Vue.directive('decorator', decoratorDirective)
const app = createApp(App)
// 勿再写 app.component('a-icon', AIcon)：已移除 AIcon；若运行时报 AIcon is not defined，请删掉上述注册行并保存，重启 dev（清 node_modules/.vite）

// 定位运行时渲染错误（例如 Symbol 转字符串异常）
app.config.errorHandler = (err, vm, info) => {
  try {
    const name = vm && vm.$options && (vm.$options.name || vm.$options._componentTag)
    // eslint-disable-next-line no-console
    console.error('[vue:errorHandler]', name, info, err && (err.message || err), err && err.stack ? err.stack : err)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[vue:errorHandler] failed', e)
  }
}

// 抑制迁移期 deprecation 在 console 里被 hook 放大导致的递归 warn（与 Tooltip/Trigger 同栈时尤甚）
app.config.warnHandler = (msg, _vm, trace) => {
  const s = String(msg || '')
  if (
    s.includes('(deprecation') ||
    s.includes('compat behavior is disabled') ||
    s.includes('has already been registered in target app')
  ) return
  // eslint-disable-next-line no-console
  console.warn('[vue:warn]', msg, trace)
}

// 兼容原有 Vue 2 写法的全局属性（@vue/compat 会把它们映射到组件实例上）
app.config.globalProperties.$log = window.console.log
app.config.globalProperties.$appConfig = {
  isPrivate: process.env.VUE_APP_IS_PRIVATE,
  webConsolePath: process.env.VUE_APP_WEB_CONSOLE_PATH,
}
app.config.globalProperties.$openWebConsole = openWebConsole

app.use(store)
app.use(router)
// 安装 vue-i18n 插件（legacy: true），让 $t/$te 等在组件里可用
app.use(i18nPlugin)
// legacy mixin 会在 beforeCreate 往实例挂 $t/$te；卸载时会 delete。
// 异步回调 / 计算属性在边界时机可能读到空值，这里用 globalProperties 兜底。
;[
  ['$t', (...args) => i18n.t(...args)],
  ['$te', (key, locale) => i18n.te(key, locale)],
  ['$tm', (key) => i18n.tm(key)],
  ['$d', (...args) => i18n.d(...args)],
  ['$n', (...args) => i18n.n(...args)],
  ['$rt', (...args) => i18n.rt(...args)],
].forEach(([key, fn]) => {
  if (typeof app.config.globalProperties[key] !== 'function') {
    app.config.globalProperties[key] = fn
  }
})
app.use(Antd)
app.use(VxeUIBase, { i18n: vxeTableI18n })
app.use(antdFormLegacyCompat)
// 显式再挂一次，避免 compat / HMR 下指令丢失
app.directive('decorator', decoratorDirective)
app.use(componentsPlugin)
app.use(VXETable, {
  i18n: vxeTableI18n,
  table: {
    // Vue2/vxe3 时代无此默认；vxe4 默认 autoResize+animat 会在拖窗/布局变化时连环重算
    autoResize: false,
    animat: false,
    resizeConfig: {
      refreshDelay: 250,
    },
  },
})
app.use(antdGlobalConfig)
app.component('downloadExcel', defineAsyncComponent(() => import('vue-json-excel')))

async function start () {
  try {
    await Promise.all([
      store.dispatch('app/fetchCompayInfo'),
      store.dispatch('app/fetchWorkflowEnabledKeys', { $t: uuid() }),
    ])
  } finally {
    app.mount('#app')
  }
}

window.app = app
window.buildInfo = process.env.VUE_APP_BUILDINFO
document.title = process.env.VUE_APP_IS_PRIVATE ? '' : (process.env.PRODUCT ? setting.product[setting.language] || 'Cloudpods' : 'Cloudpods')
window.env = process.env

start()
