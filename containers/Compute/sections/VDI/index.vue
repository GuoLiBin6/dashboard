<template>
  <a-form-model-item :prop="field">
    <a-radio-group
      v-model:value="model[field]"
      @change="handleVdiChange">
      <a-radio-button v-if="showDefault" value="">{{ $t('compute.text_1') }}</a-radio-button>
      <a-radio-button value="vnc">VNC</a-radio-button>
      <a-radio-button value="spice">SPICE</a-radio-button>
    </a-radio-group>
  </a-form-model-item>
</template>

<script>
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'VDI',
  mixins: [createFormFieldDraftMixin],
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    formDraftKind: {
      type: String,
      default: 'selection',
    },
    form: {
      type: Object,
    },
    model: {
      type: Object,
      required: true,
    },
    field: {
      type: String,
      default: 'vdi',
    },
    showDefault: {
      type: Boolean,
    },
  },
  computed: {
    selectableVdiOptions () {
      const opts = []
      if (this.showDefault) opts.push('')
      opts.push('vnc', 'spice')
      return opts
    },
  },
  watch: {
    selectableVdiOptions: {
      immediate: true,
      handler () {
        this.$nextTick(() => this.restoreFormFieldDraftFields())
      },
    },
  },
  methods: {
    handleVdiChange (e) {
      const val = e.target.value
      this.$set(this.model, this.field, val)
      this.$emit('change', { value: val })
    },
    serializeFormFieldDraft () {
      const value = this.model[this.field]
      if (value === undefined || value === null) return undefined
      return value
    },
    applyCreateFormFieldDraft (draft) {
      if (draft === undefined || draft === null) return
      if (!this.selectableVdiOptions.includes(draft)) return
      const current = this.model[this.field]
      if (current === draft || String(current) === String(draft)) return
      this.$set(this.model, this.field, draft)
    },
  },
}
</script>
