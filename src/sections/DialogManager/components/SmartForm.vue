<script>
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
export default {
  name: 'SmartFormDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: this.$form.createForm(this, { name: 'SmartFormDialog' }),
    }
  },
  methods: {
    async handleConfirm () {
      const { callback } = this.params
      const { validateFields } = this.form
      try {
        const values = await validateFields()
        this.loading = true
        if (callback && R.type(callback).includes('Function')) {
          await callback(values)
          this.cancelDialog()
        }
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
  render (h) {
    const { title, decorators, width = 400 } = this.params
    const { getFieldDecorator } = this.form
    const RenderHeader = () => {
      if (!title) return null
      return h('div', { slot: 'header' }, [title])
    }
    const formItem = (decorator) => {
      const [name, options, inputParams] = decorator
      const { label, placeholder = '', render, extra } = inputParams
      const RenderFormVal = () => {
        if (render && R.type(render) === 'Function') {
          return render(this.form)
        }
        if (name === 'password') {
          return h('a-input-password', { attrs: { placeholder } })
        }
        return h('a-input', { attrs: { placeholder } })
      }
      const formItemChildren = []
      formItemChildren.push(getFieldDecorator(name, options)(RenderFormVal()))
      if (extra) {
        formItemChildren.push(h('div', { slot: 'extra' }, [extra()]))
      }
      return h('a-form-item', { attrs: { label } }, formItemChildren)
    }
    const RenderForm = () => {
      const decoratorArrs = Object.keys(decorators)
      const defaultFormItemLayout = {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      }
      const { formItemLayout } = this.params
      const { wrapperCol, labelCol } = formItemLayout || defaultFormItemLayout
      if (!decorators || decoratorArrs.length === 0) return null
      const items = decoratorArrs.map(k => formItem(decorators[k]))
      const form = h('a-form', {
        class: 'mt-3',
        props: { form: this.form, wrapperCol, labelCol },
      }, items)
      return h('div', { slot: 'body' }, [form])
    }
    const RenderFormFooter = () => {
      const okBtn = h('a-button', {
        attrs: { type: 'primary' },
        on: { click: this.handleConfirm },
        props: { loading: this.loading },
      }, [this.$t('dialog.ok')])
      const cancelBtn = h('a-button', {
        on: { click: this.cancelDialog },
      }, [this.$t('dialog.cancel')])
      return h('div', { slot: 'footer' }, [okBtn, cancelBtn])
    }
    return h('base-dialog', {
      on: { cancel: this.cancelDialog },
      props: { width },
    }, [RenderHeader(), RenderForm(), RenderFormFooter()])
  },
}
</script>
