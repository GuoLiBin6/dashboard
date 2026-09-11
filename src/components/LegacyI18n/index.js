/**
 * vue-i18n v8 的 <i18n path="..."> 在 v9+ 变为 <i18n-t keypath="...">。
 * 提供同名组件，兼容旧模板的 path / tag / 具名插槽。
 */
import { h, defineComponent } from 'vue'
import vueI18nCjs from 'vue-i18n/dist/vue-i18n.cjs.js'

const I18nT = vueI18nCjs.I18nT || (vueI18nCjs.default && vueI18nCjs.default.I18nT)

export default defineComponent({
  name: 'i18n',
  inheritAttrs: false,
  props: {
    path: String,
    keypath: String,
    tag: {
      type: [String, Object],
      default: 'span',
    },
    scope: String,
    locale: String,
    plural: [String, Number],
  },
  setup (props, { slots, attrs }) {
    return () => {
      if (!I18nT) {
        return h('span', attrs, slots.default ? slots.default() : [])
      }
      // 透传 class/style/onXxx，保证 @click 等落在 tag 根节点上
      return h(I18nT, {
        keypath: props.keypath || props.path || '',
        tag: props.tag,
        scope: props.scope,
        locale: props.locale,
        plural: props.plural,
        ...attrs,
      }, slots)
    }
  },
})
