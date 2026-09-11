import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

const TITLE_STYLE = {
  display: 'block',
  overflow: 'hidden',
  fontSize: '16px',
  lineHeight: 1.4,
}

const CONTENT_STYLE = {
  marginTop: '8px',
  fontSize: '14px',
}

const confirm = {
  name: 'ConfirmDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      defaultParams: {
        width: 420,
        type: 'confirm',
        header: this.$t('common.text00079'),
        okText: this.$t('dialog.ok'),
        cancelText: this.$t('dialog.cancel'),
      },
      types: {
        confirm: {
          iconProps: { class: 'warning-color', type: 'question-circle' },
        },
      },
    }
  },
  methods: {
    async handleConfirm () {
      const { onOk } = this.params
      try {
        this.loading = true
        if (onOk) {
          await onOk()
        }
      } catch (err) {
        throw err
      } finally {
        this.cancelDialog()
        this.loading = false
      }
    },
  },
  render (h) {
    const { title, type, okText, cancelText, content, header } = Object.assign(this.defaultParams, this.params)
    const { iconProps } = this.types[type] || {}
    const icon = iconProps ? h('icon', { class: iconProps.class, attrs: { type: iconProps.type } }) : null
    const RenderTitle = () => {
      if (!title) return null
      return h('span', {
        class: 'heading-color',
        style: TITLE_STYLE,
      }, [title])
    }
    const RenderContent = () => {
      if (!content) return null
      return h('div', {
        class: 'text-color',
        style: CONTENT_STYLE,
      }, [content])
    }
    const headerNode = h('div', { slot: 'header' }, [header])
    const bodyNode = h('div', { slot: 'body' }, [
      h('div', { class: 'd-flex' }, [
        h('span', { style: 'font-size: 22px;margin-top:-5px' }, [icon]),
        h('div', { class: 'pl-2 w-100 bd-highlight' }, [
          RenderTitle(),
          RenderContent(),
        ]),
      ]),
    ])
    const footerNode = h('div', { slot: 'footer' }, [
      h('a-button', {
        attrs: { type: 'primary' },
        on: { click: this.handleConfirm },
        props: { loading: this.loading },
      }, [okText]),
      h('a-button', {
        on: { click: this.cancelDialog },
      }, [cancelText]),
    ])
    return h('base-dialog', {
      props: { width: 420 },
      on: { cancel: this.cancelDialog },
    }, [headerNode, bodyNode, footerNode])
  },
}

export default confirm
