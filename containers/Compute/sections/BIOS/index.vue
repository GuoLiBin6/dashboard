<template>
  <a-form-model-item :prop="field">
    <a-radio-group
      v-model:value="model[field]"
      @change="handleBiosChange">
      <a-radio-button v-if="showDefault" value="">{{ $t('compute.text_1') }}</a-radio-button>
      <a-tooltip :title="$t('compute.text_1362')" v-if="isArm">
        <a-radio-button value="BIOS" :disabled="isArm">BIOS</a-radio-button>
      </a-tooltip>
      <a-radio-button v-else value="BIOS" :disabled="uefi">BIOS</a-radio-button>
      <a-radio-button value="UEFI">UEFI</a-radio-button>
    </a-radio-group>
  </a-form-model-item>
</template>

<script>
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'BIOS',
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
      default: 'bios',
    },
    uefi: {
      type: Boolean,
    },
    isArm: {
      type: Boolean,
    },
    showDefault: {
      type: Boolean,
    },
  },
  computed: {
    selectableBiosOptions () {
      const opts = []
      if (this.showDefault) opts.push('')
      if (!this.isArm && !this.uefi) opts.push('BIOS')
      opts.push('UEFI')
      return opts
    },
  },
  watch: {
    selectableBiosOptions: {
      immediate: true,
      handler () {
        this.$nextTick(() => this.restoreFormFieldDraftFields())
      },
    },
  },
  methods: {
    handleBiosChange (e) {
      const val = e.target.value
      this.$set(this.model, this.field, val)
      this.$emit('change', val)
    },
    serializeFormFieldDraft () {
      const value = this.model[this.field]
      if (value === undefined || value === null) return undefined
      return value
    },
    applyCreateFormFieldDraft (draft) {
      if (draft === undefined || draft === null) return
      if (!this.selectableBiosOptions.includes(draft)) return
      const current = this.model[this.field]
      if (current === draft || String(current) === String(draft)) return
      this.$set(this.model, this.field, draft)
    },
  },
}
</script>
