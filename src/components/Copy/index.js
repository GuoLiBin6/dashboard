import { h } from 'vue'
import Icon from '@/components/Icon'
import './index.scss'

export default {
  name: 'Copy',
  props: {
    message: {
      type: [String, Number],
      required: true,
    },
  },
  methods: {
    async doCopy (e) {
      e.stopPropagation()
      try {
        await this.$copyText(String(this.message ?? ''))
        this.$message.success(this.$t('common.copy'))
      } catch (error) {
        this.$message.error(this.$t('common.copyError'))
      }
    },
  },
  render () {
    // 列表单元格里大量 a-tooltip 会在 Vue3/antdv4 下频繁 setup 失败并刷屏卡死；
    // 复制反馈改用 message。icon 必须直接引用组件：h('icon') 不会解析全局组件，图标会空白。
    return h(
      'span',
      {
        class: 'copy-trigger',
        role: 'button',
        tabindex: 0,
        onClick: (e) => this.doCopy(e),
        onKeydown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this.doCopy(e)
          }
        },
        title: this.$t('common.copy'),
      },
      [h(Icon, { type: 'copy', class: 'copy-trigger__icon' })],
    )
  },
}
