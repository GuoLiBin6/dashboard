/**
 * 为 @ant-design/icons-vue 提供根级 Icon 上下文，
 * 解决 Vue2 根 + compat 下 inject 拿不到默认值导致的 prefixCls undefined 报错。
 */
import { ref } from 'vue'
import { useProvideIconContext } from '@ant-design/icons-vue/es/components/Context'

export default {
  name: 'IconContextProvider',
  functional: false,
  setup (_, { slots }) {
    useProvideIconContext({
      prefixCls: ref('anticon'),
      rootClassName: ref(''),
      csp: ref(),
    })
    // 完整转发 default slot，勿只取 [0]，避免破坏下游 ConfigProvider / Layout 插槽上下文
    return () => slots.default?.() || null
  },
}
