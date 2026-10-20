<script>
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { normalizeFieldDef } from '@/utils/common/ant'

export default {
  name: 'SmartFormDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const fieldMap = this.params.fields || {}
    const formModel = {}
    const rules = {}
    Object.keys(fieldMap).forEach(key => {
      const meta = normalizeFieldDef(key, fieldMap[key])
      formModel[meta.name] = meta.initialValue
      if (meta.rules) {
        rules[meta.name] = meta.rules
      }
    })
    return {
      loading: false,
      formModel,
      rules,
    }
  },
  methods: {
    setFieldValue (name, value) {
      this.$set(this.formModel, name, value)
    },
    async handleConfirm () {
      const onConfirm = this.params.callback
      try {
        await this.$refs.formRef.validate()
        this.loading = true
        if (onConfirm && R.type(onConfirm).includes('Function')) {
          await onConfirm({ ...this.formModel })
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
    const { title, width = 400 } = this.params
    const fieldMap = this.params.fields || {}
    const formItem = (key, def) => {
      const meta = normalizeFieldDef(key, def)
      const { name, label, placeholder = '', render, extra } = meta
      const inputProps = {
        placeholder,
        value: this.formModel[name],
      }
      const inputOn = {
        input: (e) => {
          const val = e && e.target ? e.target.value : e
          this.setFieldValue(name, val)
        },
        change: (e) => {
          const val = e && e.target ? e.target.value : e
          this.setFieldValue(name, val)
        },
      }
      let inputVnode
      if (render && R.type(render) === 'Function') {
        inputVnode = render({ fd: this.formModel, setFieldValue: this.setFieldValue })
      } else if (name === 'password') {
        inputVnode = h('a-input-password', {
          props: inputProps,
          on: inputOn,
        })
      } else {
        inputVnode = h('a-input', {
          props: inputProps,
          on: inputOn,
        })
      }
      const children = [inputVnode]
      if (extra) {
        const extraContent = typeof extra === 'function' ? extra(h) : extra
        if (extraContent) {
          children.push(h('div', { slot: 'extra' }, [extraContent]))
        }
      }
      return h('a-form-model-item', {
        props: { label, prop: name },
      }, children)
    }
    const RenderForm = () => {
      const fieldKeys = Object.keys(fieldMap)
      if (!fieldKeys.length) return null
      const items = fieldKeys.map(k => formItem(k, fieldMap[k]))
      const form = h('a-form-model', {
        ref: 'formRef',
        class: 'mt-3',
        props: {
          model: this.formModel,
          rules: this.rules,
        },
      }, items)
      return h('div', { slot: 'body' }, [form])
    }
    const RenderHeader = () => {
      if (!title) return null
      return h('div', { slot: 'header' }, [title])
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
