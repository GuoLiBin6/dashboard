<template>
  <div class="explorer-filters">
    <div v-for="(item, i) in filters" :key="item.key" class="explorer-filters__row">
      <div v-if="i !== 0" class="explorer-filters__condition">
        <base-select
          minWidth="0"
          :filterable="false"
          optionLabelProp="label"
          idKey="key"
          nameKey="label"
          :value="getFilterValue(resolvedFieldMap.tagCondition(item.key)[0])"
          :options="conditionOpts"
          :disabled="disabled"
          @change="val => onFilterFieldChange(resolvedFieldMap.tagCondition(item.key), val, () => handleFilterFieldChange())"
          :select-props="{ placeholder: $t('common.select') }" />
      </div>
      <div class="explorer-filters__key">
        <base-select
          class="w-100"
          minWidth="0"
          optionLabelProp="label"
          idKey="key"
          nameKey="label"
          :value="getFilterValue(resolvedFieldMap.tagKey(item.key)[0])"
          :options="tagKeyOpts"
          filterable
          :disabled="disabled"
          @change="val => { onFilterFieldChange(resolvedFieldMap.tagKey(item.key), val); tagKeyChange(val, i, item) }"
          :select-props="{ placeholder: $t('monitor.text_109'), allowClear: true, loading }" />
      </div>
      <div class="explorer-filters__operator">
        <base-select
          minWidth="0"
          :filterable="false"
          optionLabelProp="label"
          idKey="key"
          nameKey="label"
          :value="getFilterValue(resolvedFieldMap.tagOperator(item.key)[0])"
          :options="tagOperatorOpts"
          :disabled="disabled"
          @change="val => onFilterFieldChange(resolvedFieldMap.tagOperator(item.key), val, () => handleFilterFieldChange())"
          :select-props="{ placeholder: $t('common.select') }" />
      </div>
      <div class="explorer-filters__value">
        <base-select
          class="w-100"
          minWidth="0"
          optionLabelProp="label"
          idKey="key"
          nameKey="label"
          :value="getFilterValue(resolvedFieldMap.tagValue(item.key)[0])"
          :options="item.tagValueOpts"
          filterable
          needBlur
          :disabled="disabled"
          :select-props="{ mode: 'multiple', placeholder: $t('monitor.text_110'), allowClear: true, loading }"
          @change="val => { onFilterFieldChange(resolvedFieldMap.tagValue(item.key), val); tagValuesChange(val, i, item) }"
          @dropdownChange="val => tagValuesDropdownChange(val, i, item)"
          @blur="val => { onFilterFieldChange(resolvedFieldMap.tagValue(item.key), val); tagValuesChange(val, i, item) }" />
      </div>
      <div v-if="!disabled && i !== 0" class="explorer-filters__remove">
        <a-button shape="circle" size="small" @click="remove(i)">
          <template #icon><icon type="minus" /></template>
        </a-button>
      </div>
    </div>
    <div class="d-flex align-items-center" v-if="!disabled">
      <a-button type="primary" shape="circle" size="small" @click="add">
        <template #icon><icon type="plus" /></template>
      </a-button>
      <a-button type="link" @click="add">{{ $t('monitor.monitor_add_filters') }}</a-button>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { filterKeyMap } from '@Monitor/constants'
import { uuid } from '@/utils/utils'
import { resolveFieldMeta } from '@/utils/common/ant'
import { buildFilterFieldMap } from '../fields'
export default {
  name: 'ExplorerFormFilters',
  props: {
    form: {
      type: Object,
      default: null,
    },
    /** a-form-model：与 field 字段名对齐的受控对象（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
    },
    initFilters: {
      type: [],
      default: () => ([]),
    },
    fieldMap: {
      type: Object,
      default: null,
      validator: val => !val || (R.is(Function, val.tagCondition) && R.is(Function, val.tagKey) && R.is(Function, val.tagValue) && R.is(Function, val.tagOperator)),
    },
    metricInfo: {
      type: Object,
      default: () => ({}),
    },
    tagOperatorOpts: {
      type: Array,
      default: () => [
        { key: '=~', label: 'IN' },
        { key: '!~', label: 'NOT IN' },
      ],
    },
    conditionOpts: {
      type: Array,
      default: () => [
        { key: 'AND', label: 'AND' },
        { key: 'OR', label: 'OR' },
      ],
    },
    tags: {
      type: Array,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    let filters = [{ key: uuid(), tagValueOpts: [] }]
    if (this.initFilters) {
      filters = this.initFilters
    }
    return {
      filters: filters,
      dropdownVisible: {},
    }
  },
  computed: {
    resolvedFieldMap () {
      return this.fieldMap || buildFilterFieldMap()
    },
    fdModel () {
      return this.model
    },
    tagKeyOpts () {
      if (R.is(Array, this.metricInfo.tag_key)) {
        return this.metricInfo.tag_key.map(v => {
          const zh = filterKeyMap[v]
          const label = zh ? (R.is(Object, zh) ? `${this.$t(zh.t)} (${v})` : `${zh} (${v})`) : (v.startsWith('user:') ? v.replace('user:', this.$t('monitor.tag_key')) : v)
          return {
            key: v,
            label,
          }
        }).filter(item => item.key !== 'paltform')
      }
      return []
    },
  },
  watch: {
    metricInfo: {
      deep: true,
      handler: function (val1, val2) {
        if (!R.equals(val1, val2)) {
          if (this.tags && this.tags.length) {
            this.fillFilters(this.tags)
          }
          this.fillFilterValues()
        }
      },
    },
    filters: {
      handler () {
        this.$nextTick(() => this.registerExplorerFilterFields())
      },
      deep: true,
    },
  },
  mounted () {
    this.registerExplorerFilterFields()
    if (this.tags && this.tags.length) {
      this.fillFilters(this.tags)
    }
  },
  methods: {

    /** 解析 tagKeys[uuid] → { root, key }；非嵌套返回 null */
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
      for (const item of this.filters) {
        const tuples = [
          this.resolvedFieldMap.tagCondition(item.key),
          this.resolvedFieldMap.tagKey(item.key),
          this.resolvedFieldMap.tagOperator(item.key),
          this.resolvedFieldMap.tagValue(item.key),
        ]
        for (const fieldDef of tuples) {
          await this.runFieldMapRules(fieldDef, this.fieldVal(fieldDef))
        }
      }
      return true
    },
    registerExplorerFilterFields () {
      this.filters.forEach(item => {
        const tuples = [
          this.resolvedFieldMap.tagCondition(item.key),
          this.resolvedFieldMap.tagKey(item.key),
          this.resolvedFieldMap.tagOperator(item.key),
          this.resolvedFieldMap.tagValue(item.key),
        ]
        tuples.forEach((fieldDef) => {
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
        })
      })
    },
    onFilterFieldChange (fieldTuple, val, callback) {
      this.fieldSet(fieldTuple, val)
      if (callback) callback()
    },
    getFilterValue (name) {
      const val = this.fieldVal({ name: name })
      // 空串/null 当作未选，避免与 placeholder 叠字
      if (val === '' || val === null) return undefined
      return val
    },
    fillFilters (tags) {
      const tagFields = {}
      this.filters = tags.map(item => {
        const key = uuid()
        const { tagCondition, tagKey, tagValue, tagOperator } = this.resolvedFieldMap
        let operator = item.operator
        let value = item.value
        if (operator === '=') {
          operator = '=~'
        } else if (operator === '!=') {
          operator = '!~'
        }
        if (R.is(Array, value)) {
          // keep
        } else if (R.is(String, value)) {
          if (value.startsWith('/^') && value.endsWith('$/')) {
            value = value.replace('/^', '').replace('$/', '').split('|').map(v => v.replace('^', '').replace('$', ''))
          } else if (value.startsWith('["') && value.endsWith('"]')) {
            value = value.replace('[', '').replace(']', '').split(',').map(v => v.replaceAll('"', ''))
          } else if (value !== '') {
            value = [value]
          } else {
            value = []
          }
        } else if (value != null && value !== '') {
          value = [value]
        } else {
          value = []
        }
        tagFields[tagKey(key)[0]] = item.key
        tagFields[tagValue(key)[0]] = value
        tagFields[tagOperator(key)[0]] = operator
        if (item.condition) tagFields[tagCondition(key)[0]] = item.condition
        return {
          key,
          tagValueOpts: this.tagValueOpts(item.key),
        }
      })
      this.$nextTick(() => {
        Object.keys(tagFields).forEach((name) => {
          this.fieldSet([name], tagFields[name])
        })
        this.$forceUpdate()
      })
    },
    fillFilterValues () {
      const values = {
        ...(this.fdModel || {}),
      }
      const filters = R.clone(this.filters)
      this.filters = filters.map(item => {
        const { key = '', tagValueOpts = [] } = item
        if (key && !tagValueOpts.length) {
          const { tagKeys = {} } = values
          if (tagKeys[key]) {
            const tagKey = tagKeys[key]
            const opts = this.tagValueOpts(tagKey)
            item.tagValueOpts = [...opts]
          }
        }
        return item
      })
    },
    tagValuesDropdownChange (val, i, item) {
      this.dropdownVisible[i] = val
      if (!val) {
        this.$emit('tagValuesChange', item)
      }
    },
    tagValuesChange (val, i, item) {
      this.$emit('tagValuesChange', item)
    },
    reset () {
      this.filters = [{ key: uuid(), tagValueOpts: [] }]
    },
    add () {
      this.filters.push({ key: uuid(), tagValueOpts: [] })
    },
    remove (i) {
      this.filters.splice(i, 1)
      this.$emit('remove', i)
    },
    tagKeyChange (val, i, item) {
      this.fieldSet(this.resolvedFieldMap.tagValue(item.key), undefined)
      if (val) {
        this.filters[i].tagValueOpts = this.tagValueOpts(val)
      }
      this.$nextTick(() => {
        this.$emit('tagValuesChange')
      })
    },
    handleFilterFieldChange () {
      this.$nextTick(() => {
        this.$emit('tagValuesChange')
      })
    },
    tagValueOpts (tagKey) {
      if (R.is(Object, this.metricInfo.tag_value) && tagKey) {
        const vals = (this.metricInfo.tag_value[tagKey] || [])
        vals.sort()
        return vals.map(v => {
          let label = v
          if (v === 'OneCloud') {
            label = this.$t('brand')
          }
          return {
            key: v,
            label,
          }
        })
      }
      return []
    },
  },
}
</script>

<style lang="less" scoped>
.explorer-filters {
  width: 100%;
  min-width: 0;

  &__row {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    width: 100%;
    min-width: 0;
  }

  &__condition {
    flex: 0 0 72px;
    width: 72px;
    min-width: 0;
  }

  &__key {
    flex: 1 1 0;
    min-width: 0;
  }

  &__operator {
    flex: 0 0 90px;
    width: 90px;
    min-width: 0;
  }

  &__value {
    flex: 1.2 1 0;
    min-width: 0;
  }

  &__remove {
    flex: 0 0 24px;
    width: 24px;
    min-width: 24px;
  }

  :deep(.ant-select),
  :deep(.base-select),
  :deep(.base-select .ant-select) {
    width: 100% !important;
    min-width: 0 !important;
  }

  // 有选中项时隐藏 placeholder，兜底叠字
  :deep(.ant-select-selection-item ~ .ant-select-selection-placeholder),
  :deep(.ant-select-selection-overflow:not(:empty) ~ .ant-select-selection-placeholder) {
    display: none !important;
    opacity: 0 !important;
  }
  :deep(.ant-select-selection-placeholder) {
    pointer-events: none;
  }
}
</style>
