<template>
  <a-form-model-item class="mb-0" :prop="field">
    <span v-if="isEmpty">{{$t('compute.hypervisor_empty_tips')}}</span>
    <a-radio-group
      v-else
      v-model:value="model[field]"
      @change="changeHandle">
      <template v-for="item in hypervisorOpts" :key="item.key">
        <a-tooltip :title="disabledHypervisorMap[item.key]">
          <a-radio-button
            :value="item.key"
            :disabled="disabledHypervisorMap[item.key]">
            {{ getLabel(item) }}
          </a-radio-button>
        </a-tooltip>
      </template>
    </a-radio-group>
  </a-form-model-item>
</template>

<script>
import * as R from 'ramda'
import { HYPERVISORS_GROUP, HYPERVISORS_MAP } from '@/constants'
import i18n from '@/locales'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'ProviderRadio',
  mixins: [createFormFieldDraftMixin],
  props: {
    field: {
      type: String,
      default: 'hypervisor',
    },
    model: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      validator: val => Object.keys(HYPERVISORS_GROUP).includes(val),
    },
    hypervisors: {
      type: Array,
      validator: val => R.isEmpty(val) || val.every(hyper => Object.keys(HYPERVISORS_MAP).includes(hyper)),
    },
    ignoreBaremetal: {
      type: Boolean,
      default: true,
    },
    disabledHypervisorMap: {
      type: Object,
      default () {
        return {}
      },
    },
    formDraftKey: {
      type: String,
      default: '',
    },
    formDraftKind: {
      type: String,
      default: 'selection',
    },
  },
  computed: {
    hypervisorOpts () {
      let hyperItems = []
      const hyperGroup = HYPERVISORS_GROUP[this.type]
      if (hyperGroup) {
        hyperItems = Object.values(hyperGroup)
      }
      hyperItems = this.hypervisors.map(val => HYPERVISORS_MAP[val])
      if (this.ignoreBaremetal) {
        hyperItems = hyperItems.filter(val => val.key !== 'baremetal')
      }
      return hyperItems
    },
    isEmpty () {
      return !this.hypervisorOpts?.length
    },
  },
  watch: {
    hypervisorOpts: {
      immediate: true,
      handler (opts) {
        this.$nextTick(() => this.tryRestoreHypervisorDraft(opts))
      },
    },
  },
  methods: {
    fieldSet (value) {
      this.$set(this.model, this.field, value)
    },
    changeHandle (e) {
      const val = e && e.target ? e.target.value : e
      if (!this._hypervisorDraftRestoring) {
        this.markFormFieldDraftTouched()
      }
      this.writeFormFieldDraft(val)
      this.fieldSet(val)
      this.$emit('change', val)
    },
    getLabel (item) {
      if (!item) return ''
      if (item.key === HYPERVISORS_MAP.kvm.key) {
        return this.type === 'private' ? HYPERVISORS_MAP.cloudpods.label : HYPERVISORS_MAP.kvm.label
      }
      return item.label
    },
    tryRestoreHypervisorDraft (opts) {
      if (!Array.isArray(opts) || !opts.length) return
      if (this.isFormFieldDraftTouched()) return
      const hit = this.matchFormFieldDraftInOptions(opts)
      let next = hit?.key
      if (next && this.disabledHypervisorMap?.[next]) next = undefined
      if (!next) {
        const first = opts.find(item => item?.key && !this.disabledHypervisorMap?.[item.key])
        next = first?.key
      }
      if (!next) return
      const current = this.model[this.field]
      if (current === next) return
      this._hypervisorDraftRestoring = true
      try {
        this.fieldSet(next)
        this.$emit('change', next)
      } finally {
        this.$nextTick(() => {
          this._hypervisorDraftRestoring = false
        })
      }
    },
    serializeFormFieldDraft () {
      return this.model[this.field] || undefined
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          let settled = false
          const finish = (err) => {
            if (settled) return
            settled = true
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          }
          let ret
          try {
            ret = rule.validator(rule, value, finish)
          } catch (e) {
            finish(e)
            return
          }
          if (ret && typeof ret.then === 'function') {
            ret.then(() => finish()).catch(finish)
          }
          return
        }
        resolve()
      })
    },
    async validate () {
      await this.runFieldRule(
        { required: true, message: i18n.t('compute.text_215') },
        this.model[this.field],
      )
      return true
    },
  },
}
</script>
