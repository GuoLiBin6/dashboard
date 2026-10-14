<template>
  <a-form-item>
    <a-radio-group :value="machineValue" @change="handleMachineChange">
      <a-radio-button :value="opt.value" v-for="opt in machineOptions" :key="opt.value">{{ opt.text }}</a-radio-button>
    </a-radio-group>
  </a-form-item>
</template>

<script>
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'Machine',
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
    field: {
      type: String,
      default: 'machine',
    },
    isArm: {
      type: Boolean,
      required: true,
    },
    showDefault: {
      type: Boolean,
    },
  },
  computed: {
    machineValue () {
      return this.form?.fd?.[this.field]
    },
    machineOptions () {
      var options = []
      if (this.showDefault) {
        options.push({
          text: this.$t('compute.text_1'),
          value: '',
        })
      }
      if (this.isArm) {
        options.push(
          {
            text: 'VIRT',
            value: 'virt',
          },
        )
      } else {
        options.push(
          {
            text: 'PC',
            value: 'pc',
          },
          {
            text: 'Q35',
            value: 'q35',
          },
        )
      }
      return options
    },
    selectableMachineValues () {
      return this.machineOptions.map(item => item.value)
    },
  },
  watch: {
    selectableMachineValues: {
      immediate: true,
      handler () {
        this.$nextTick(() => {
          this.restoreFormFieldDraftFields()
          this.ensureValidMachine()
        })
      },
    },
  },
  methods: {
    fieldSet (val) {
      if (this.form?.fd) {
        this.form.fd[this.field] = val
      }
    },
    handleMachineChange (e) {
      const val = e.target.value
      this.fieldSet(val)
      this.$emit('change', { value: val })
    },
    /** 架构切换后当前值不在选项里时落到第一项（避免 radio 无选中） */
    ensureValidMachine () {
      if (!this.form?.fd || !this.selectableMachineValues.length) return
      const current = this.form.fd[this.field]
      if (this.selectableMachineValues.includes(current)) return
      const next = this.selectableMachineValues[0]
      if (next === undefined) return
      this.fieldSet(next)
    },
    serializeFormFieldDraft () {
      const value = this.form?.fd?.[this.field]
      if (value === undefined || value === null) return undefined
      return value
    },
    applyCreateFormFieldDraft (draft) {
      if (draft === undefined || draft === null) return
      if (!this.selectableMachineValues.includes(draft)) return
      const current = this.form?.fd?.[this.field]
      if (current === draft || String(current) === String(draft)) return
      this.fieldSet(draft)
    },
  },
}
</script>
