<template>
  <a-row>
    <a-col :span="6">
      <a-form-item
        :name="fieldItemName(resolvedFieldMap.period)"
        :rules="fieldItemRules(resolvedFieldMap.period)">
        <base-select :value="fieldVal(resolvedFieldMap.period)" @change="v => fieldSet(resolvedFieldMap.period, v)" :options="preiodOpts" minWidth="90px" />
      </a-form-item>
    </a-col>
    <a-col :span="6">
      <a-form-item
        :name="fieldItemName(resolvedFieldMap.alert_duration)"
        :rules="fieldItemRules(resolvedFieldMap.alert_duration)">
        <base-select :value="fieldVal(resolvedFieldMap.alert_duration)" @change="v => fieldSet(resolvedFieldMap.alert_duration, v)" :options="durationOpts" minWidth="120px" />
      </a-form-item>
    </a-col>
    <a-col :span="4">
      <a-form-item
        :name="fieldItemName(resolvedFieldMap.reduce)"
        :rules="fieldItemRules(resolvedFieldMap.reduce)">
        <base-select :value="fieldVal(resolvedFieldMap.reduce)" @change="v => fieldSet(resolvedFieldMap.reduce, v)" :options="reduceOpts" :disabled="disabled" minWidth="70px" />
      </a-form-item>
    </a-col>
    <a-col :span="3">
      <a-form-item
        :name="fieldItemName(resolvedFieldMap.comparator)"
        :rules="fieldItemRules(resolvedFieldMap.comparator)">
        <base-select :value="fieldVal(resolvedFieldMap.comparator)" @change="onComparatorChange" :options="comparatorOpts" minWidth="70px" :disabled="disabled" />
      </a-form-item>
    </a-col>
    <a-col :span="5" v-show="showThreshold">
      <a-form-item
        :name="fieldItemName(resolvedFieldMap.threshold)"
        :rules="showThreshold ? fieldItemRules(resolvedFieldMap.threshold) : []">
        <threshold-input :value="fieldVal(resolvedFieldMap.threshold)" @change="thresholdChange" :unit="unit" :disabled="disabled" />
      </a-form-item>
    </a-col>
  </a-row>
</template>

<script>
import * as R from 'ramda'
import { preiodMaps } from '@Monitor/constants'
import { buildAlertConditionFieldMap } from '@Monitor/sections/fields'
import { resolveFieldMeta } from '@/utils/common/ant'
import ThresholdInput from './ThresholdInput.vue'

export default {
  name: 'AlertCondition',
  components: {
    ThresholdInput,
  },
  props: {
    fieldMap: {
      type: Object,
      default: null,
      validator: val => !val || (R.is(Array, val.period) && R.is(Array, val.comparator) && R.is(Array, val.threshold)),
    },
    /** a-form-model：与 field 字段名对齐（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
      default: '',
    },
  },
  inject: ['form'],
  data () {
    const fieldDef = this.fieldMap || buildAlertConditionFieldMap()
    let showThreshold = true
    if (fieldDef.comparator.initialValue === 'nodata') {
      showThreshold = false
    }
    let threshold
    if (fieldDef.threshold?.initialValue !== undefined) {
      threshold = fieldDef.threshold.initialValue
    }

    return {
      preiodOpts: Object.values(preiodMaps),
      durationOpts: [
        { key: 1, label: this.$t('monitor.duration.label', [1]) },
        { key: 2, label: this.$t('monitor.duration.label', [2]) },
        { key: 3, label: this.$t('monitor.duration.label', [3]) },
        { key: 6, label: this.$t('monitor.duration.label', [6]) },
        { key: 12, label: this.$t('monitor.duration.label', [12]) },
        { key: 24, label: this.$t('monitor.duration.label', [24]) },
        { key: 48, label: this.$t('monitor.duration.label', [48]) },
        { key: 96, label: this.$t('monitor.duration.label', [96]) },
      ],
      reduceOpts: [
        { key: 'avg', label: this.$t('monitor.avg') },
        { key: 'min', label: this.$t('monitor.min') },
        { key: 'max', label: this.$t('monitor.max') },
      ],
      comparatorOpts: [
        { key: '>=', label: '>=' },
        { key: '<=', label: '<=' },
        { key: '==', label: '==' },
        { key: 'nodata', label: 'No Data' },
      ],
      threshold: { value: threshold, base: 1 },
      showThreshold: showThreshold,
    }
  },
  computed: {
    resolvedFieldMap () {
      return this.fieldMap || buildAlertConditionFieldMap()
    },
  },
  created () {
    ;['period', 'alert_duration', 'reduce', 'comparator', 'threshold'].forEach((key) => {
      const fieldDef = this.resolvedFieldMap[key]
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return
      const { name, ...opts } = meta
      if (this.model[name] === undefined && opts.initialValue !== undefined) {
        this.$set(this.model, name, opts.initialValue)
      }
    })
  },
  methods: {
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const v = this.model[name]
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      if (!resolveFieldMeta(fieldTuple)) return
      this.$set(this.model, resolveFieldMeta(fieldTuple)?.name, value)
    },
    fieldItemName (fieldDef) {
      return resolveFieldMeta(fieldDef)?.name
    },
    fieldItemRules (fieldDef) {
      return resolveFieldMeta(fieldDef)?.rules || []
    },
    /** Form.Item 已绑 name+rules，由父 formRef.validate 展示红字 */
    async validate () {
      return true
    },
    thresholdChange (v) {
      this.fieldSet(this.resolvedFieldMap.threshold, v)
      this.$emit('thresholdChange', v)
    },
    onComparatorChange (e) {
      const val = e?.target?.value ?? e
      this.fieldSet(this.resolvedFieldMap.comparator, val)
      if (val === 'nodata') {
        this.showThreshold = false
      } else {
        this.showThreshold = true
      }
      this.$emit('comparatorChange', val)
    },
  },
}
</script>
