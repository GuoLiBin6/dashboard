<template>
  <div class="metric-fields" :class="{ 'metric-fields--no-type': !showResType }">
    <div v-if="showResType" class="metric-fields__item">
      <base-select
        class="metric-select"
        minWidth="0"
        :value="metric_res_type"
        :options="metricTypeOpts"
        filterable
        :disabled="disabled"
        :select-props="{ placeholder: $t('monitor.text_111'), loading }"
        @change="metricTypeChange" />
    </div>
    <div class="metric-fields__item">
      <base-select
        class="metric-select"
        minWidth="0"
        :value="metric_key"
        :options="metricKeyOpts"
        filterable
        :disabled="disabled"
        v-model:item="metricKeyItem"
        :select-props="{ placeholder: $t('monitor.text_112'), loading }"
        @change="metricKeyChange" />
    </div>
    <div class="metric-fields__item">
      <base-select
        class="metric-select"
        minWidth="0"
        filterable
        :value="metricValue"
        v-model:item="metricValueItem"
        :options="metricOpts"
        :labelFormat="metricValueLabelFormat"
        :disabled="disabled"
        @change="metricValueChange"
        :select-props="{ placeholder: $t('monitor.text_113'), allowClear: true, loading }" />
    </div>
    <div v-if="extra" class="metric-fields__extra">{{ extra }}</div>
  </div>
</template>

<script lang="jsx">
import _ from 'lodash'
import { metric_zh } from '@Monitor/constants'
import { resolveFieldMeta } from '@/utils/common/ant'
import { buildMetricFieldMap } from '../fields'

export default {
  name: 'ExplorerFormMetric',
  props: {
    fieldMap: {
      type: Object,
      default: null,
    },
    form: {
      type: Object,
      default: null,
    },
    /** a-form-model：与 field 字段名对齐的受控对象（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    res_type_measurements: {
      type: Object,
      default: () => ({}),
    },
    res_types: {
      type: Array,
      default: () => [],
    },
    showResType: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    const fieldDef = this.fieldMap || buildMetricFieldMap()
    return {
      metric_key: fieldDef.metric_key?.initialValue,
      metric_res_type: fieldDef.metric_res_type?.initialValue,
      metricValue: fieldDef.metric_value?.initialValue,
      metricValueItem: {},
      metricKeyItem: {},
    }
  },
  computed: {
    resolvedFieldMap () {
      return this.fieldMap || buildMetricFieldMap()
    },
    metricTypeOpts () {
      return this.res_types.map(val => {
        const label = val === 'system' ? this.$t('common.system_service') : this.$t(`dictionary.${val}`)
        return {
          key: val,
          label,
        }
      })
    },
    metricKeyOpts () {
      return (this.res_type_measurements[this.metric_res_type] || []).map(val => {
        let label = val.measurement
        const displayName = val.measurement_display_name
        if (displayName && metric_zh[displayName]) {
          label = metric_zh[displayName]
        }
        return {
          ...val,
          metric_res_type: this.metric_res_type,
          key: val.measurement,
          label,
        }
      })
    },
    metricOpts () {
      const metricKeyItem = this.metricKeyOpts.find(item => item.key === this.metric_key)
      if (metricKeyItem && _.isArray(metricKeyItem.field_key)) {
        return metricKeyItem.field_key.map(val => {
          let label = val
          const fieldDes = metricKeyItem.field_descriptions
          let description = {}
          if (fieldDes) {
            description = fieldDes[val]
            const displayName = _.get(fieldDes, `${val}.display_name`)
            if (displayName && metric_zh[displayName]) label = metric_zh[displayName]
          }
          return {
            key: val,
            label,
            description,
            metric_res_type: metricKeyItem.metric_res_type,
          }
        })
      } else {
        return []
      }
    },
    extra () {
      return ''
    },
  },
  watch: {
    metric_res_type (val) {
      if (!this.metricTypeOpts) {
        this.resetMetric()
      } else {
        const metricKey = this.fieldVal(this.resolvedFieldMap.metric_key)
        const metricValue = this.fieldVal(this.resolvedFieldMap.metric_value)
        if (metricKey) {
          const validMetric = this.metricTypeOpts.find(option => option.key === metricKey)
          if (!validMetric && !this.disabled) {
            this.resetMetric()
          } else {
            this.metricKeyChange(this.metric_key, false)
            this.$nextTick(() => {
              if (metricValue) this.metricValueChange(metricValue)
            })
          }
        }
      }
    },
    metricOpts (opts) {
      const metricValue = this.fieldVal(this.resolvedFieldMap.metric_value)
      if (!metricValue || !opts || !opts.length) return
      const vItem = opts.find(opt => opt.key === metricValue)
      if (!vItem) return
      const current = this.metricValueItem || {}
      const hasDesc = current.description && Object.keys(current.description).length
      if (current.key === vItem.key && hasDesc) return
      this.metricValueChange(metricValue)
    },
  },
  created () {
    this.initModelFields()
  },
  mounted: function () {
    this.$nextTick(function () {
      const metricValue = this.fieldVal(this.resolvedFieldMap.metric_value)
      if (metricValue) {
        this.metricValue = metricValue
        this.metricValueChange(metricValue)
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
          rule.validator(rule, value, (err) => {
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          })
          return
        }
        resolve()
      })
    },
    async runFieldMapRules (fieldTuple, value) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const rules = meta.rules || []
      for (const rule of rules) {
        await this.runFieldRule(rule, value)
      }
    },
    async validate () {
      for (const key of ['metric_res_type', 'metric_key', 'metric_value']) {
        const fieldDef = this.resolvedFieldMap[key]
        if (fieldDef) await this.runFieldMapRules(fieldDef, this.fieldVal(fieldDef))
      }
      return true
    },
    initModelFields () {
      ;['metric_res_type', 'metric_key', 'metric_value'].forEach((key) => {
        const fieldDef = this.resolvedFieldMap[key]
        const meta = resolveFieldMeta(fieldDef)
        if (!meta) return
        const { name, ...opts } = meta
        if (this.model[name] === undefined && opts.initialValue !== undefined) {
          this.$set(this.model, name, opts.initialValue)
        }
      })
    },
    setField (fieldKey, value) {
      this.fieldSet(this.resolvedFieldMap[fieldKey], value)
    },
    metricValueLabelFormat (item) {
      return (<div>
        {item.label}<span class="text-black-50">({item.description.name})</span>
      </div>)
    },
    metricTypeChange (val) {
      this.metric_res_type = val
      this.setField('metric_res_type', val)
    },
    metricKeyChange (val, isNative = true) {
      this.metric_key = val
      this.setField('metric_key', val)
      if (isNative) {
        this.metricValue = undefined
        this.setField('metric_value', undefined)
      }
    },
    metricValueChange (val) {
      this.metricValue = val
      this.setField('metric_value', val)
      if (!val) {
        this.$emit('metricClear')
      } else {
        let vItem = this.metricValueItem
        let kItem = this.metricKeyItem
        if (!vItem) {
          vItem = this.metricOpts.find((opt) => { return opt.key === val })
        }
        if (this.metricKeyItem) {
          kItem = this.metricKeyOpts.find((opt) => { return opt.key === this.metric_key })
        }
        this.$emit('metricChange', { metricKey: this.metric_key, mertric: val, mertricItem: vItem, metricKeyItem: kItem })
      }
    },
    resetMetric () {
      this.metric_key = undefined
      this.metricValue = undefined
      this.fieldSet(this.resolvedFieldMap.metric_key, undefined)
      this.fieldSet(this.resolvedFieldMap.metric_value, undefined)
      this.$emit('metricClear')
    },
  },
}
</script>

<style lang="less" scoped>
.metric-fields {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  min-width: 0;

  &__item {
    flex: 1 1 0;
    min-width: 0;
    margin-bottom: 0 !important;
  }

  &__extra {
    flex: 1 0 100%;
    margin-top: 4px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
  }
}

.metric-select {
  display: block;
  width: 100%;
  min-width: 0;

  :deep(.ant-select) {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>
