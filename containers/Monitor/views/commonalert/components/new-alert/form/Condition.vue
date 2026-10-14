<template>
  <div>
    <a-row v-for="(item) in conditionList" :key="item.key" :gutter="2">
      <a-col :span="4">
        <a-form-item>
          <base-select
            :value="fieldVal(resolvedFieldMap.metric_key(item.key))"
            :options="metricKeyOpts"
            filterable
            :disabled="disabled"
            :select-props="{ placeholder: $t('monitor.text_112'), loading }"
            @change="(v) => { fieldSet(resolvedFieldMap.metric_key(item.key), v); metricKeyChange(v, item) }" />
        </a-form-item>
      </a-col>
      <a-col :span="4">
        <a-form-item>
          <base-select
            filterable
            :value="fieldVal(resolvedFieldMap.metric_value(item.key))"
            :options="metricOptsMap[item.key]"
            :labelFormat="metricValueLabelFormat"
            :disabled="disabled"
            @change="(v) => { fieldSet(resolvedFieldMap.metric_value(item.key), v); metricValueChange(v, item) }"
            :select-props="{ placeholder: $t('monitor.text_113'), allowClear: true, loading }" />
        </a-form-item>
      </a-col>
      <a-col :span="4">
        <a-form-item>
          <base-select :value="fieldVal(resolvedFieldMap.reduce(item.key))" @change="v => fieldSet(resolvedFieldMap.reduce(item.key), v)" :options="reduceOpts" :disabled="disabled" minWidth="70px" />
        </a-form-item>
      </a-col>
      <a-col :span="3">
        <a-form-item>
          <base-select :value="fieldVal(resolvedFieldMap.comparator(item.key))" @change="v => { fieldSet(resolvedFieldMap.comparator(item.key), v); onComparatorChange(v, item) }" :options="comparatorOpts" minWidth="70px" :disabled="disabled" />
        </a-form-item>
      </a-col>
      <template v-if="showThresholdMap[item.key]">
        <template v-if="isRangeType(item.key)">
          <a-col :span="8">
            <div class="d-flex" style="gap: 8px; align-items: flex-start;">
              <div style="flex: 1;">
                <a-form-item style="margin-bottom: 0;">
                  <threshold-input :value="fieldVal(resolvedFieldMap.threshold_start(item.key))" @change="v => { fieldSet(resolvedFieldMap.threshold_start(item.key), v); handleRangeValueChange(item.key, 'end') }" :unit="unitMap[item.key]" :disabled="disabled" />
                </a-form-item>
              </div>
              <span style="flex-shrink: 0; padding: 0 4px; display: flex; align-items: center; height: 32px; line-height: 32px; margin-top: 4px;">~</span>
              <div style="flex: 1;">
                <a-form-item style="margin-bottom: 0;">
                  <threshold-input :value="fieldVal(resolvedFieldMap.threshold_end(item.key))" @change="v => { fieldSet(resolvedFieldMap.threshold_end(item.key), v); handleRangeValueChange(item.key, 'start') }" :unit="unitMap[item.key]" :disabled="disabled" />
                </a-form-item>
              </div>
            </div>
          </a-col>
        </template>
        <a-col v-else :span="8">
          <a-form-item>
            <threshold-input :value="fieldVal(resolvedFieldMap.threshold(item.key))" @change="v => fieldSet(resolvedFieldMap.threshold(item.key), v)" :unit="unitMap[item.key]" :disabled="disabled" />
          </a-form-item>
        </a-col>
      </template>
      <a-button shape="circle" icon="minus" size="small" @click="del(item)" class="mt-2 ml-2" :disabled="disabled" />
    </a-row>
    <a-row :span="2">
      <div class="d-flex align-items-center">
        <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" :disabled="disabled" />
        <a-button type="link" @click="add" :disabled="disabled">{{$t('monitor.commonalert.add_condition')}}</a-button>
      </div>
    </a-row>
  </div>
</template>

<script lang="jsx">
import _ from 'lodash'
import { metric_zh } from '@Monitor/constants'
import { uuid } from '@/utils/utils'
import { buildConditionFieldMap } from '@Monitor/sections/fields'
import { resolveFieldMeta } from '@/utils/common/ant'
import thresholdInput from './thresholdInput'
export default {
  name: 'AlertCondition',
  components: {
    thresholdInput,
  },
  props: {
    fieldMap: {
      type: Object,
      default: null,
    },
    /** a-form-model：与 field 字段名对齐（通常为 form.fd）；支持 bracket 嵌套 */
    model: {
      type: Object,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    res_type_measurements: {
      type: Object,
      default: () => ({}),
    },
    metric_res_type: {
      type: String,
    },
  },
  inject: ['form'],
  data () {
    return {
      reduceOpts: [
        { key: 'avg', label: this.$t('monitor.avg') },
        { key: 'min', label: this.$t('monitor.min') },
        { key: 'max', label: this.$t('monitor.max') },
        { key: 'last', label: this.$t('monitor.last') },
        { key: 'delta', label: this.$t('monitor.delta') },
      ],
      comparatorOpts: [
        { key: '>=', label: this.$t('monitor.greater_than') },
        { key: '<=', label: this.$t('monitor.less_than') },
        { key: '==', label: this.$t('monitor.equals') },
        { key: 'within_range', label: this.$t('monitor.within_range') },
        { key: 'outside_range', label: this.$t('monitor.outside_range') },
        { key: 'nodata', label: this.$t('monitor.no_data') },
      ],
      unitMap: {},
      metricKeyItemMap: {},
      conditionList: [],
      metricOptsMap: {},
      showThresholdMap: {},
      metricMap: {},
      rangeValidateTimers: {},
    }
  },
  computed: {
    resolvedFieldMap () {
      return this.fieldMap || buildConditionFieldMap({
        getFd: () => this.fdModel,
        t: key => this.$t(key),
      })
    },
    fdModel () {
      return this.model
    },
    hasDeltaCondition () {
      const reduce = this.fdModel?.reduce
      return this.conditionList.some(item => reduce && reduce[item.key] === 'delta')
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
          metric_res_type: this.form.fd.metric_res_type,
          key: val.measurement,
          label,
        }
      })
    },
  },
  watch: {
    hasDeltaCondition: {
      handler (v) {
        this.$emit('delta-change', v)
      },
      immediate: true,
    },
    conditionList: {
      handler () {
        this.$nextTick(() => this.registerAllConditionFields())
      },
      deep: true,
    },
  },
  methods: {

    parseBracketName (name) {
      const m = typeof name === 'string' && name.match(/^(\w+)\[([^\]]+)\]$/)
      if (!m) return null
      return { root: m[1], key: m[2] }
    },
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const target = this.fdModel
      if (target) {
        const nested = this.parseBracketName(name)
        let v
        if (nested && target[nested.root] && typeof target[nested.root] === 'object') {
          v = target[nested.root][nested.key]
        } else if (Object.prototype.hasOwnProperty.call(target, name)) {
          v = target[name]
        }
        if (v !== undefined) return v
        if (opts.initialValue !== undefined) return opts.initialValue
      }
      return undefined
    },
    fieldSet (fieldTuple, value) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const { name } = meta
      const target = this.fdModel
      if (!target) return
      const nested = this.parseBracketName(name)
      if (nested) {
        if (!target[nested.root] || typeof target[nested.root] !== 'object') {
          this.$set(target, nested.root, {})
        }
        this.$set(target[nested.root], nested.key, value)
      } else {
        this.$set(target, name, value)
      }
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
      if (!this.fdModel) return true
      for (const item of this.conditionList) {
        const keys = ['metric_key', 'metric_value', 'reduce', 'comparator']
        if (this.showThresholdMap[item.key] !== false) {
          const comparator = this.fieldVal(this.resolvedFieldMap.comparator(item.key))
          if (comparator === 'within_range' || comparator === 'outside_range') {
            keys.push('threshold_start', 'threshold_end')
          } else {
            keys.push('threshold')
          }
        }
        for (const f of keys) {
          const fn = this.resolvedFieldMap[f]
          if (typeof fn !== 'function') continue
          const fieldDef = fn(item.key)
          await this.runFieldMapRules(fieldDef, this.fieldVal(fieldDef))
        }
      }
      return true
    },
    /** 批量写入 flat bracket keys → model 嵌套 */
    writeFields (values) {
      if (!values || typeof values !== 'object') return
      Object.keys(values).forEach((name) => {
        this.fieldSet({ name: name }, values[name])
      })
    },
    registerAllConditionFields () {
      this.conditionList.forEach(item => {
        this.registerConditionFields(item.key)
      })
    },
    registerConditionFields (itemKey) {
      ;['metric_key', 'metric_value', 'reduce', 'comparator', 'threshold', 'threshold_start', 'threshold_end'].forEach(f => {
        const fn = this.resolvedFieldMap[f]
        if (typeof fn === 'function') {
          const fieldDef = fn(itemKey)
          if (this.fdModel && Array.isArray(fieldDef)) {
            const [, opts = {}] = fieldDef
            if (opts.initialValue !== undefined) {
              const nested = this.parseBracketName(fieldDef[0])
              if (nested) {
                const root = this.fdModel[nested.root]
                if (!root || root[nested.key] === undefined) {
                  this.fieldSet(fieldDef, opts.initialValue)
                }
              } else if (this.fdModel[fieldDef[0]] === undefined) {
                this.fieldSet(fieldDef, opts.initialValue)
              }
            }
          }
        }
      })
    },
    add (params = {}) {
      const key = uuid()
      this.conditionList.push({ key })
      this.showThresholdMap[key] = params.comparator !== 'nodata'
      this.$nextTick(() => this.registerConditionFields(key))
    },
    del (item) {
      const index = this.conditionList.findIndex(val => val.key === item.key)
      this.conditionList.splice(index, 1)
      delete this.metricMap[item.key]
    },
    reset (execAdd = true) {
      this.conditionList.forEach(item => {
        const fields = ['metric_key', 'metric_value', 'reduce', 'comparator', 'threshold', 'threshold_start', 'threshold_end']
        fields.forEach(f => {
          this.$delete(this.form.fd, f)
          this.$delete(this.form.fd, `${f}[${item.key}]`)
        })
      })

      this.metricKeyMap = {}
      this.showThresholdMap = {}
      this.metricMap = {}
      this.unitMap = {}
      this.metricKeyItemMap = {}
      this.conditionList = []

      execAdd && this.add()
    },
    onComparatorChange (v, item) {
      if (v === 'nodata') {
        this.showThresholdMap[item.key] = false
      } else {
        this.showThresholdMap[item.key] = true
        const thresholdKey = `threshold[${item.key}]`
        const currentThreshold = this.fieldVal({ name: thresholdKey })
        const isRange = v === 'within_range' || v === 'outside_range'
        if (isRange) {
          let thresholdArray = []
          if (currentThreshold !== undefined && currentThreshold !== null && !Array.isArray(currentThreshold)) {
            thresholdArray = [currentThreshold, currentThreshold]
          } else if (Array.isArray(currentThreshold) && currentThreshold.length >= 2) {
            thresholdArray = currentThreshold
          } else {
            thresholdArray = [1, 2]
          }
          this.writeFields({
            [thresholdKey]: thresholdArray,
            [`threshold_start[${item.key}]`]: thresholdArray[0],
            [`threshold_end[${item.key}]`]: thresholdArray[1],
          })
        } else {
          if (Array.isArray(currentThreshold) && currentThreshold.length > 0) {
            this.writeFields({
              [thresholdKey]: currentThreshold[0],
            })
          }
        }
      }
    },
    isRangeType (key) {
      const comparator = this.fieldVal([`comparator[${key}]`, {}])
      return comparator === 'within_range' || comparator === 'outside_range'
    },
    metricValueLabelFormat (item) {
      return (<div>
        {item.label}<span class="text-black-50">({item.description.name})</span>
      </div>)
    },
    metricKeyChange (val, item) {
      const mertricItem = this.metricKeyOpts.find(item => item.key === val)
      this.metricKeyItemMap = {
        [`${item.key}`]: mertricItem,
      }
      const metricOpts = this.getMetricOpts(val)
      this.$set(this.metricOptsMap, item.key, metricOpts)
    },
    metricValueChange (val, item) {
      if (val) {
        const metricKey = this.fieldVal([`metric_key[${item.key}]`, {}])
        const metricOpts = this.getMetricOpts(metricKey)
        const metricValueItem = metricOpts.find((opt) => { return opt.key === val })
        const metricKeyItem = this.metricKeyItemMap[item.key]

        this.unitMap[item.key] = metricValueItem?.description?.unit
        this.metricMap[item.key] = { metricKey, mertric: val, mertricItem: metricValueItem, metricKeyItem }
        this.$emit('metricChange', this.metricMap)
      }
    },
    getMetricOpts (metric_key) {
      const metricKeyItem = this.metricKeyOpts.find(item => item.key === metric_key)
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
    handleRangeValueChange (key, targetField) {
      const timerKey = `${key}_${targetField}`
      if (this.rangeValidateTimers[timerKey]) {
        clearTimeout(this.rangeValidateTimers[timerKey])
      }
      this.rangeValidateTimers[timerKey] = setTimeout(() => {
        const startValue = this.fieldVal([`threshold_start[${key}]`, {}])
        const endValue = this.fieldVal([`threshold_end[${key}]`, {}])
        if (startValue !== undefined && startValue !== null && endValue !== undefined && endValue !== null) {
          this.writeFields({
            [`threshold[${key}]`]: [startValue, endValue],
          })
        }
        delete this.rangeValidateTimers[timerKey]
      }, 300)
    },
  },
}
</script>
