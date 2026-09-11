/**
 * 必须作为入口最早 import：在 filters / antd icons 等模块求值前配置 compat，
 * 否则 COMPONENT_ASYNC / FILTERS 等 deprecation 会在 configureCompat 之前刷屏。
 */
import { configureCompat } from 'vue'

configureCompat({
  MODE: 2,
  ATTR_FALSE_VALUE: true,
  ATTR_ENUMERATED_COERCION: true,
  // icons-vue / antdv4 大量函数组件；开启 COMPONENT_ASYNC 会误判并弄丢 props
  COMPONENT_ASYNC: false,
})

if (typeof window !== 'undefined') {
  window.__OC_COMPAT__ = { COMPONENT_ASYNC: false }

  // DevTools 的 installHook 会绕过 app.config.warnHandler，这里再挡一层迁移噪音
  const origWarn = console.warn
  console.warn = (...args) => {
    const msg = args.map((a) => String(a ?? '')).join(' ')
    if (
      msg.includes('(deprecation') ||
      msg.includes('compat behavior is disabled') ||
      msg.includes('[intlify] Not found') ||
      msg.includes('[intlify] Fall back to translate') ||
      msg.includes('has already been registered in target app')
    ) {
      return
    }
    origWarn.apply(console, args)
  }
}
