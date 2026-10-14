<template>
  <a-form-item>
    <a-radio-group :value="innerValue" @change="onChange">
      <a-tooltip v-for="item in schedulerTypeOpts" :key="item.key" :title="item.tooltip" :mouseEnterDelay="0.5">
        <a-radio-button :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
      </a-tooltip>
    </a-radio-group>
  </a-form-item>
</template>

<script>
import { resolveFieldMeta } from '@/utils/common/ant'

const FIELD = 'scheduler'

export default {
  name: 'LbSchedulerType',
  inject: {
    lbListenerFieldMap: { default: null },
  },
  props: {
    schedulerTypeOpts: {
      type: Array,
      default: () => [
        { key: 'rr', label: this.$t('network.text_375') },
        { key: 'wrr', label: this.$t('network.text_376') },
        { key: 'wlc', label: this.$t('network.text_377') },
        { key: 'sch', label: this.$t('network.text_378') },
      ],
    },
    form: {
      type: Object,
      required: true,
      validator: val => !!val.fd,
    },
  },
  data () {
    const initial = resolveFieldMeta(this.lbListenerFieldMap?.[FIELD], FIELD)?.initialValue
    return {
      innerValue: initial,
    }
  },
  watch: {
    schedulerTypeOpts (val) {
      if (val && val.length) {
        const current = this.form.fd[FIELD]
        const next = current || val[0].key
        this.innerValue = next
        this.syncToForm(next)
      }
    },
  },
  created () {
    const meta = resolveFieldMeta(this.lbListenerFieldMap?.[FIELD], FIELD) || {}
    const { name: _n, ...opts } = meta
    if (!this.form.registered) this.form.registered = new Set()
    this.form.registered.add(FIELD)
    if (!this.form.fieldOpts) this.form.fieldOpts = {}
    this.form.fieldOpts[FIELD] = opts
  },
  mounted () {
    const v = this.form.fd[FIELD]
    if (v !== undefined) this.innerValue = v
    this.syncToForm(this.innerValue)
  },
  methods: {
    syncToForm (v) {
      if (this.form?.fd) this.$set(this.form.fd, FIELD, v)
    },
    onChange (e) {
      const v = e && e.target ? e.target.value : e
      this.innerValue = v
      this.syncToForm(v)
    },
  },
}
</script>
