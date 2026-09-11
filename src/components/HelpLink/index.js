import { h } from 'vue'
import router from '@/router'
import i18n from '@/locales'
import './style.scss'

export default {
  name: 'HelpLink',
  props: {
    blank: {
      type: Boolean,
      default: true,
    },
    href: {
      type: String,
      required: true,
    },
  },
  render () {
    let { blank, href } = this.$props

    const format = path => {
      if (path.startsWith('http') || path.startsWith('https')) return path
      if (!path.startsWith('/')) {
        console.error(i18n.t('common_15'))
        path += '/'
      }
      if (path.startsWith('/v1') || path.startsWith('/v2')) {
        path = path.replace(/\/v[12]/, '') // 去掉 /v2 或者 /v1
      }
      return router.resolve(path).href
    }
    href = format(href)

    const target = blank ? '_blank' : '_self'
    const slots = this.$slots
    const defaultSlot = slots.default
    const slotChildren = typeof defaultSlot === 'function' ? defaultSlot() : defaultSlot
    const text = slotChildren ? h('span', null, slotChildren) : href
    const children = [
      h('span', { class: 'flex-fill text-truncate' }, [text]),
    ]
    if (blank) {
      children.push(h('icon', {
        class: 'ml-1 flex-grow-1 flex-shrink-1',
        type: 'blank',
      }))
    }
    // Vue3 h()：href/target 须作为 props 传入，attrs 不会落到 DOM
    return h('a', {
      class: 'help-link d-inline-flex align-items-center',
      href,
      target,
      title: href,
      style: 'max-width: 100%;',
    }, children)
  },
}
