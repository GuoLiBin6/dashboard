/**
 * 用于渲染自定义内容的公共dialog
 * createDialog('CommonDialog', {
 *  header: [String],       // 标题
 *  ok: [Function],         // 确定方法
 *  body: [Function],       // 内容
 *  hiddenCancel: [Boolean],// 是否隐藏取消按钮
 * })
 */
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CommonDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
    }
  },
  methods: {
    renderBody () {
      if (!this.params.body) return null
      return this.params.body()
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.params.ok) {
          await this.params.ok()
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
  render (h) {
    const header = h('div', { slot: 'header' }, [this.params.header])
    const body = h('div', { slot: 'body' }, [this.renderBody()])
    const footerChildren = [
      h('a-button', {
        attrs: { type: 'primary' },
        on: { click: this.handleConfirm },
        props: { loading: this.loading },
      }, [this.$t('dialog.ok')]),
    ]
    if (!this.params.hiddenCancel) {
      footerChildren.push(h('a-button', {
        on: { click: this.cancelDialog },
      }, [this.$t('dialog.cancel')]))
    }
    const footer = h('div', { slot: 'footer' }, footerChildren)
    return h('base-dialog', {
      on: { cancel: this.cancelDialog },
      props: {
        width: this.params.width,
        modalProps: this.params.modalProps,
      },
    }, [header, body, footer])
  },
}
