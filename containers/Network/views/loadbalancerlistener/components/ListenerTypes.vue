<template>
  <a-form-item>
    <a-radio-group :disabled="disabled" :value="innerValue" @change="onChange">
      <a-radio-button v-for="item in listenerTypeOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
    </a-radio-group>
  </a-form-item>
</template>

<script>
import { resolveFieldMeta } from '@/utils/common/ant'

const FIELD = 'listener_type'

export default {
  name: 'LbListenerType',
  inject: {
    lbListenerFieldMap: { default: null },
  },
  props: {
    form: {
      type: Object,
    },
    listenerTypeOpts: {
      type: Array,
      default: () => [
        { label: 'TCP', key: 'tcp' },
        { label: 'UDP', key: 'udp' },
        { label: 'HTTP', key: 'http' },
        { label: 'HTTPS', key: 'https' },
      ],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    const initial = resolveFieldMeta(this.lbListenerFieldMap?.[FIELD], FIELD)?.initialValue
    return {
      innerValue: initial,
    }
  },
  created () {
    const meta = resolveFieldMeta(this.lbListenerFieldMap?.[FIELD], FIELD) || {}
    const { name: _n, ...opts } = meta
    const form = this.getForm()
    if (form) {
      if (!form.registered) form.registered = new Set()
      form.registered.add(FIELD)
      if (!form.fieldOpts) form.fieldOpts = {}
      form.fieldOpts[FIELD] = opts
    }
  },
  mounted () {
    const form = this.getForm()
    if (form?.fd && form.fd[FIELD] !== undefined) {
      this.innerValue = form.fd[FIELD]
    }
    this.syncToForm(this.innerValue)
  },
  methods: {
    getForm () {
      if (this.form) return this.form
      let cur = this.$parent
      while (cur) {
        if (cur.form) return cur.form
        cur = cur.$parent
      }
      return null
    },
    syncToForm (v) {
      const form = this.getForm()
      if (!form?.fd) return
      this.$set(form.fd, FIELD, v)
    },
    onChange (e) {
      const v = e && e.target ? e.target.value : e
      this.innerValue = v
      this.syncToForm(v)
    },
  },
}
</script>
