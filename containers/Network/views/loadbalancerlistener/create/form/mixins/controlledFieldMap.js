/** 监听器步骤：用 field-map 元数据注册校验规则，只写 form.fd */
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  inject: {
    lbListenerFieldMap: { default: null },
  },
  computed: {
    lbFieldMap () {
      return this.fieldMap || this.lbListenerFieldMap || {}
    },
  },
  methods: {
    ensureRegistered () {
      if (!this.form) return null
      if (!this.form.registered) this.form.registered = new Set()
      if (!this.form.fieldOpts) this.form.fieldOpts = {}
      return this.form.registered
    },
    registerFields (keys, fieldMap = this.lbFieldMap) {
      const registered = this.ensureRegistered()
      if (!fieldMap) return
      keys.forEach(key => {
        const meta = resolveFieldMeta(fieldMap[key], key)
        if (!meta) return
        registered && registered.add(meta.name)
        if (this.form.fieldOpts) {
          const { name, ...opts } = meta
          this.form.fieldOpts[name] = opts
        }
      })
    },
    registerFieldPair (fieldDef, key = '') {
      const meta = resolveFieldMeta(fieldDef, key)
      if (!meta) return
      const registered = this.ensureRegistered()
      registered && registered.add(meta.name)
      if (this.form.fieldOpts) {
        const { name, ...opts } = meta
        this.form.fieldOpts[name] = opts
      }
    },
    setField (key, value, fieldMap = this.lbFieldMap) {
      const meta = resolveFieldMeta(fieldMap?.[key], key)
      const field = meta?.name || key
      if (this.form?.fd) {
        this.$set(this.form.fd, field, value)
      }
    },
    setFields (values) {
      Object.keys(values || {}).forEach(k => {
        if (this.form?.fd) this.$set(this.form.fd, k, values[k])
      })
    },
    onRadioField (key, e) {
      this.setField(key, e.target.value)
    },
  },
}
