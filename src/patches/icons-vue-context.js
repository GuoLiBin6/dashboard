/**
 * 补丁：用 Symbol.for 做全局 key，保证与 ant-design-vue 内 Icon 的 inject 使用同一 key，
 * 并保证 inject 无 provider 时一定返回默认值，避免 prefixCls undefined。
 */
import { inject, provide, ref } from 'vue'

const contextKey = Symbol.for('iconContext')
const defaultContext = {
  prefixCls: ref('anticon'),
  rootClassName: ref(''),
  csp: ref(),
}

export function useProvideIconContext (props) {
  provide(contextKey, props)
  return props
}

export function useInjectIconContext () {
  const value = inject(contextKey, defaultContext)
  return value ?? defaultContext
}
