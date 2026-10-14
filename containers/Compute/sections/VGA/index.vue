<template>
  <a-form-model-item :prop="field">
    <a-radio-group
      v-model:value="model[field]"
      @change="changeHandle">
      <a-radio-button :value="opt.value" v-for="opt in vgaOptions" :key="opt.value">{{ opt.text }}</a-radio-button>
    </a-radio-group>
  </a-form-model-item>
</template>

<script>
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'VGA',
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
    vdi: {
      type: String,
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
      default: 'vga',
    },
    showDefault: {
      type: Boolean,
    },
  },
  computed: {
    vgaOptions () {
      var options = []
      if (this.showDefault) {
        options.push({
          text: this.$t('compute.text_1'),
          value: '',
        })
      }
      if (this.vdi === 'vnc') {
        options.push({
          text: 'Standard',
          value: 'std',
        })
      }
      options.push(
        {
          text: 'QXL',
          value: 'qxl',
        },
      )
      return options
    },
    selectableVgaValues () {
      return this.vgaOptions.map(item => item.value)
    },
  },
  watch: {
    vdi: {
      handler () {
        const vga = this.model[this.field]
        if (!this.selectableVgaValues.includes(vga)) {
          const next = this.selectableVgaValues[0]
          if (next !== undefined) {
            this.$set(this.model, this.field, next)
          }
        }
      },
    },
    selectableVgaValues: {
      immediate: true,
      handler () {
        this.$nextTick(() => this.restoreFormFieldDraftFields())
      },
    },
  },
  methods: {
    changeHandle (e) {
      const val = e?.target?.value
      this.$set(this.model, this.field, val)
    },
    serializeFormFieldDraft () {
      const value = this.model[this.field]
      if (value === undefined || value === null) return undefined
      return value
    },
    applyCreateFormFieldDraft (draft) {
      if (draft === undefined || draft === null) return
      if (!this.selectableVgaValues.includes(draft)) return
      const current = this.model[this.field]
      if (current === draft || String(current) === String(draft)) return
      this.$set(this.model, this.field, draft)
    },
  },
}
</script>
