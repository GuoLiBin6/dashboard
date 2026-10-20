<template>
  <div>
    <a-form-item :label="$t('db.text_54')">
      <a-radio-group :value="fieldVal(fieldMap.billing_type)" @change="e => onBillTypeChange(e.target.value)">
        <a-radio-button
          :key="key"
          :value="key"
          v-for="key in Object.keys(BILL_TYPES_MAP)">{{BILL_TYPES_MAP[key].label}}</a-radio-button>
      </a-radio-group>
      <div v-if="fieldVal(fieldMap.billing_type) === 'prepaid'">
        <a-radio-group :value="fieldVal(fieldMap.duration)" @change="e => fieldSet(fieldMap.duration, e.target.value)">
            <a-radio-button
              :key="item.value"
              :value="item.value"
              v-for="item in BUY_DURATIONS_OPTIONS">
              {{item.label}}</a-radio-button>
        </a-radio-group>
      </div>
    </a-form-item>
  </div>
</template>
<script>
import { resolveFieldMeta } from '@/utils/common/ant'
import { BILL_TYPES_MAP, BUY_DURATIONS_OPTIONS } from '../constants/index.js'
const defaultFieldMap = {
  billing_type: { name: 'billing_type', initialValue: 'postpaid' },
  duration: { name: 'duration', initialValue: '1M' },
}

export default {
  inject: ['form'],
  props: {
    fieldMap: {
      type: Object,
      default: () => {
        return defaultFieldMap
      },
    },
  },
  data () {
    return {
      BILL_TYPES_MAP,
      BUY_DURATIONS_OPTIONS,
    }
  },
  computed: {
    boundFd () {
      return this.form?.fd || this.form
    },
  },
  created () {
    this.ensureFieldInitials(this.fieldMap, ['billing_type', 'duration'])
  },
  methods: {
    fieldName (fieldTuple) {
      return resolveFieldMeta(fieldTuple)?.name
    },
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const m = this.boundFd
      const v = m ? m[name] : undefined
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const { name, ...opts } = meta
      const m = this.boundFd
      if (!m) return
      if (m[name] === undefined && opts.initialValue !== undefined && value === undefined) {
        this.$set(m, name, opts.initialValue)
        return
      }
      this.$set(m, name, value)
    },
    ensureFieldInitials (fieldMap, keys) {
      const list = keys || Object.keys(fieldMap || {})
      list.forEach((key) => {
        const fieldDef = fieldMap[key]
        const meta = resolveFieldMeta(fieldDef)
        if (!meta) return
        const { name, ...opts } = meta
        if (this.boundFd && this.boundFd[name] === undefined && opts.initialValue !== undefined) {
          this.$set(this.boundFd, name, opts.initialValue)
        }
      })
    },

    onBillTypeChange (val) {
      this.fieldSet(this.fieldMap.billing_type, val)
    },
  },
}
</script>
