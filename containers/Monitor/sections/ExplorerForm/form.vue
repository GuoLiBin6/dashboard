<template>
  <a-card :title="title" size="small" class="monitor-form" :class="{ 'hideBody': !panelShow }">
    <div slot="extra">
      <a-icon type="delete" v-if="showDelete" @click="remove" class="mr-2 remove-icon" />
      <a-icon :type="panelShow ? 'up' : 'down'" @click="toggle" />
    </div>
    <div v-show="panelShow">
      <a-form-model
        :model="form.fd">
        <a-form-model-item :label="$t('monitor.monitor_metric')" class="mb-0">
          <metric
            ref="metricRef"
            :form="form"
            :model="form.fd"
            :field-map="metricFieldMap"
            :res_type_measurements="res_type_measurements"
            :res_types="res_types"
            :loading="metricLoading"
            @metricChange="getMetricInfo"
            @metricClear="resetChart" />
        </a-form-model-item>
        <a-form-model-item :label="$t('monitor.monitor_filters')">
          <filters
            :form="form"
            :model="form.fd"
            :field-map="filterFieldMap"
            ref="filtersRef"
            :init-filters="initFilters"
            @remove="$nextTick(toParams)"
            :loading="metricInfoLoading"
            :metricInfo="metricInfo"
            @tagValuesChange="tagValuesChange" />
        </a-form-model-item>
      </a-form-model>
      <a-form-model
        ref="shellFormRef"
        :model="form.fd"
        :rules="shellRules">
        <a-form-model-item :label="$t('monitor.monitor_group')" prop="group_by">
          <base-select
            :value="form.fd.group_by"
            :options="groupbyOpts"
            @change="val => { shellSet('group_by', val); groupbyChange(val) }"
            class="w-100"
            :select-props="{ mode: 'multiple', placeholder: $t('monitor.text_114'), allowClear: true }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('monitor.monitor_function')" prop="function">
          <base-select
            :value="form.fd.function"
            :options="functionOpts"
            @change="val => shellSet('function', val)"
            class="w-100"
            :select-props="{ placeholder: $t('monitor.text_115'), allowClear: allowClearGroupFunction }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('monitor.monitor_result_function')" prop="result_function">
          <base-select
            :value="form.fd.result_function"
            :options="resultFunctionOpts"
            @change="val => shellSet('result_function', val)"
            class="w-100"
            :select-props="{ placeholder: $t('monitor.text_115'), allowClear: true }" />
        </a-form-model-item>
        <a-form-model-item v-if="form.fd.result_function === 'percentile'" :label="$t('monitor.monitor_percentile')" prop="percentile">
          <a-input-number :min="1" :max="99" :value="form.fd.percentile" @change="val => shellSet('percentile', val)" placeholder="1~99" />
        </a-form-model-item>
        <a-form-model-item v-if="showChartTypes" :label="$t('monitor.chart_form')">
          <a-checkbox-group
            :value="chartTypes"
            :options="chartTypeOptions"
            @change="chartTypesChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.name')" v-if="!queryOnly" prop="name">
          <a-input :value="form.fd.name" @update:value="v => shellSet('name', v)" :placeholder="$t('common.placeholder')" />
        </a-form-model-item>
      </a-form-model>
    </div>
  </a-card>
</template>

<script>
import _ from 'lodash'
import * as R from 'ramda'
import Metric from '@Monitor/sections/Metric'
import Filters from '@Monitor/sections/Filters'
import { metric_zh } from '@Monitor/constants'
import {
  CHART_TYPE_HEATMAP,
  CHART_TYPE_LINE,
  DEFAULT_CHART_TYPES,
  DEFAULT_PERCENT_CHART_TYPES,
  getMetricUnit,
  isPercentUnit,
  parseChartTypesFromPanel,
} from '@Monitor/utils/chartTypes'
import { uuid, getRequestT } from '@/utils/utils'
import { buildMetricFieldMap, buildFilterFieldMap } from '../fields'

export default {
  name: 'ExplorerForm',
  components: {
    Metric,
    Filters,
  },
  props: {
    panel: {
      type: Object,
      default: () => ({}),
    },
    queryOnly: {
      type: Boolean,
      default: true,
    },
    // 仅监控查询 / 监控面板开启图表形式配置
    enableChartTypes: {
      type: Boolean,
      default: false,
    },
    showDelete: {
      type: Boolean,
      default: false,
    },
    defaultPanelShow: {
      type: Boolean,
    },
    timeRangeParams: {
      type: Object,
      default: () => ({}),
    },
    extraParams: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    const initialValue = {}
    const initFilters = []
    const initTagOperators = {}
    if (this.panel && ((this.panel.common_alert_metric_details && this.panel.common_alert_metric_details.length > 0) || (this.panel?.setting && this.panel.setting.conditions))) {
      const f = this.panel?.common_alert_metric_details?.[0] || this.panel?.setting?.conditions?.[0]?.query?.model
      const q = _.get(this.panel, 'settings.conditions[0].query.model') || this.panel?.setting?.conditions?.[0]?.query?.model
      const r = _.get(this.panel, 'settings.conditions[0].query.result_reducer') || this.panel?.setting?.conditions?.[0]?.query?.result_reducer
      initialValue.name = this.panel.name || this.panel.panel_name || ''
      initialValue.res_type = f.res_type || this.panel?.common_alert_metric_details?.[0]?.res_type
      initialValue.metric_key = f.measurement || this.panel?.common_alert_metric_details?.[0]?.measurement
      initialValue.metric_value = f.field
      initialValue.tags = {}
      if (q) {
        if (q.group_by) {
          const _g = q.group_by.filter((g) => { return g.type === 'tag' && g.params && g.params[0] })
          if (_g.length) {
            initialValue.group_by = _g.map(item => {
              return item.params[0]
            })
          }
        }
        if (q.tags) {
          q.tags.map((tag) => {
            const key = uuid()
            initialValue.tags[key] = tag
            initFilters.push({ key: key, tagValueOpts: [] })
            initTagOperators[key] = tag.operator
          })
        }
        initialValue.function = ''
        if (q.select && q.select.length > 0 && q.select[0].length > 1) {
          const s = q.select[0]
          const _t = s[s.length - 1].type
          if (_t) initialValue.function = _t.toUpperCase()
        }
      }
      if (r) {
        initialValue.result_function = r.type
        if (r.params && r.params.length) {
          if (r.params[0] === 50) {
            initialValue.result_function = 'p50'
          } else if (r.params[0] === 95) {
            initialValue.result_function = 'p95'
          } else {
            initialValue.percentile = r.params[0]
          }
        }
      }
    }
    const getkey = (index, key, defaultValue) => {
      if (initialValue.tags && initialValue.tags[index] && initialValue.tags[index][key]) {
        if (key === 'value') {
          const v = initialValue.tags[index][key]
          if (v.startsWith('/^') && v.endsWith('$/')) {
            const values = v.replace('/^', '').replace('$/', '').split('|').map(item => {
              let k = item
              if (k.startsWith('^')) k = k.replace('^', '')
              if (k.endsWith('$')) k = k.replace('$', '')
              return k
            })
            return values
          } else {
            return [v]
          }
        }
        if (key === 'operator') {
          const v = initialValue.tags[index][key]
          if (v === '=') return '=~'
          if (v === '!=') return '!~'
        }
        return initialValue.tags[index][key]
      } else {
        return defaultValue
      }
    }

    const selectRequired = [{ required: true, message: this.$t('common.select') }]
    const metricFieldMap = buildMetricFieldMap({
      res_type: initialValue.res_type,
      metric_key: initialValue.metric_key,
      metric_value: initialValue.metric_value,
    })
    const defaultFilterFieldMap = buildFilterFieldMap()
    const filterFieldMap = {
      tagCondition: i => [
        defaultFilterFieldMap.tagCondition(i)[0],
        {
          initialValue: getkey(i, 'condition', 'AND'),
          rules: selectRequired,
        },
      ],
      tagKey: i => [
        defaultFilterFieldMap.tagKey(i)[0],
        {
          initialValue: getkey(i, 'key', ''),
          rules: [],
        },
      ],
      tagOperator: i => [
        defaultFilterFieldMap.tagOperator(i)[0],
        {
          initialValue: getkey(i, 'operator', '=~'),
          rules: selectRequired,
        },
      ],
      tagValue: i => [
        defaultFilterFieldMap.tagValue(i)[0],
        {
          initialValue: getkey(i, 'value', []),
          rules: [],
        },
      ],
    }

    const shellRules = {
      percentile: [{ required: true, message: this.$t('common.tips.input', [this.$t('monitor.monitor_percentile')]) }],
    }
    if (!this.queryOnly) {
      shellRules.name = [
        { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
      ]
    }

    return {
      prevName: initialValue.name,
      form: {
        fd: {
          metric_res_type: initialValue.res_type,
          metric_key: initialValue.metric_key,
          metric_value: initialValue.metric_value,
          group_by: initialValue.group_by || [],
          function: initialValue.function,
          result_function: initialValue.result_function,
          percentile: initialValue.percentile,
          name: initialValue.name || '',
          tagOperators: initTagOperators,
        },
      },
      shellRules,
      metricFieldMap,
      filterFieldMap,
      initFilters: initFilters,
      groupbyOpts: [],
      functionOpts: [],
      resultFunctionOpts: [
        {
          key: 'p50',
          label: 'P50',
        },
        {
          key: 'p95',
          label: 'P95',
        },
        {
          key: 'min',
          label: 'MIN',
        },
        {
          key: 'max',
          label: 'MAX',
        },
        {
          key: 'avg',
          label: 'MEAN',
        },
        {
          key: 'sum',
          label: 'SUM',
        },
        {
          key: 'count',
          label: 'COUNT',
        },
        {
          key: 'percentile',
          label: 'PERCENTILE',
        },
      ],
      metricKeyOpts: [],
      metricInfo: {},
      metricKeyItem: {},
      mertricItem: {},
      panelShow: this.defaultPanelShow,
      oldParams: {},
      oldResParams: {},
      metricLoading: false,
      metricInfoLoading: false,
      res_type_measurements: {},
      res_types: [],
      allowClearGroupFunction: true,
      chartTypes: parseChartTypesFromPanel(this.panel, {
        isPercent: true,
        queryOnly: this.queryOnly,
      }),
      chartTypeOptions: [
        { label: this.$t('monitor.chart_line'), value: CHART_TYPE_LINE },
        { label: this.$t('monitor.chart_heatmap'), value: CHART_TYPE_HEATMAP },
      ],
    }
  },
  computed: {
    title () {
      if (!this.panelShow && this.form.fd.metric_key) {
        return this.getTitle()
      }
      return this.$t('monitor.monitor_fill_filters')
    },
    metricUnit () {
      // 优先用当前选中指标；编辑回填时 mertricItem 可能尚未就绪，回退 panel 中的单位
      return getMetricUnit(this.mertricItem) ||
        _.get(this.panel, 'common_alert_metric_details[0].field_description.unit') ||
        _.get(this.panel, 'common_alert_metric_details[0].unit') ||
        ''
    },
    showChartTypes () {
      return this.enableChartTypes && isPercentUnit(this.metricUnit)
    },
  },
  watch: {
    defaultPanelShow (val) {
      this.panelShow = val
    },
    timeRangeParams () {
      this.getMeasurement()
    },
    showChartTypes (val) {
      if (val) {
        if (!this.chartTypes || !this.chartTypes.length) {
          // 监控查询 / 新建：百分比默认双图；已落库旧面板：仅折线
          const isPersistedPanel = !!(this.panel && (this.panel.id || this.panel.panel_id))
          this.chartTypes = this.queryOnly || !isPersistedPanel
            ? [...DEFAULT_PERCENT_CHART_TYPES]
            : [...DEFAULT_CHART_TYPES]
        } else if (this.queryOnly) {
          // 监控查询切到 % 指标时，恢复默认折线+热力图
          this.chartTypes = [...DEFAULT_PERCENT_CHART_TYPES]
        }
        this.$emit('chartTypesChange', this.chartTypes)
      } else {
        this.$emit('chartTypesChange', [CHART_TYPE_LINE])
      }
    },
  },
  created () {
    this.getMeasurement()
    this.$emit('chartTypesChange', this.showChartTypes ? this.chartTypes : [CHART_TYPE_LINE])
  },
  methods: {
    shellSet (key, value, { emitParams = true } = {}) {
      this.$set(this.form.fd, key, value)
      if (key === 'name') {
        this.$emit('nameChange', value)
      }
      if (emitParams) this.$nextTick(this.toParams)
    },
    chartTypesChange (val) {
      // 至少保留一种图表形式
      this.chartTypes = (val && val.length) ? val : [CHART_TYPE_LINE]
      this.$emit('chartTypesChange', this.chartTypes)
    },
    getTitle () {
      let padding = ' '
      if (this.$store.getters.setting.language === 'zh-CN') {
        padding = ''
      }
      let label = this.metricKeyItem && this.metricKeyItem.metric_res_type ? this.$t(`dictionary.${this.metricKeyItem.metric_res_type}`) + padding : ''
      label += this.metricKeyItem && this.metricKeyItem.label ? this.metricKeyItem.label : '-'
      const metricLabel = _.get(this.mertricItem, 'description.display_name')
      const metricName = _.get(this.mertricItem, 'description.name')
      if (metricLabel) {
        label += `(${metric_zh[metricLabel] ? metric_zh[metricLabel] + ' ' + metricName : metricLabel + ' ' + metricName})`
      }
      return label
    },
    resetChart () {
      this.$emit('resetChart')
      this.$refs.filtersRef.reset()
    },
    remove () {
      this.$emit('remove')
    },
    groupbyChange (a) {
      if (!a || a.length === 0) {
        this.shellSet('function', '', { emitParams: false })
        this.allowClearGroupFunction = true
      } else {
        this.allowClearGroupFunction = false
        if (this.functionOpts && this.functionOpts.length) {
          const mean = this.functionOpts.find(val => val.key.toLowerCase() === 'mean')
          this.shellSet('function', mean.key, { emitParams: false })
        }
      }
    },
    tagValuesChange (item) {
      this.$nextTick(this.toParams)
      const values = { ...this.form.fd }
      if ((values.hasOwnProperty('metric_key') && !values.metric_key) || (values.hasOwnProperty('metric_value') && !values.metric_value)) {
        this.resetChart()
      }
    },
    async getMeasurement () {
      try {
        this.metricLoading = true
        const params = { scope: this.$store.getters.scope, ...this.timeRangeParams, ...this.extraParams }
        const { data: { res_type_measurements, res_types } } = await new this.$Manager('unifiedmonitors', 'v1').get({ id: 'measurements', params })
        this.res_type_measurements = res_type_measurements
        this.res_types = res_types
        this.metricLoading = false
      } catch (error) {
        this.metricLoading = false
        throw error
      }
    },
    async getMetricInfo ({ metricKey, mertric, mertricItem, metricKeyItem }) {
      try {
        this.metricKeyItem = metricKeyItem || {}
        this.mertricItem = mertricItem || {}
        const title = this.getTitle()
        if (this.prevName === '' || this.form.fd.name === this.prevName) {
          this.shellSet('name', title, { emitParams: false })
          this.prevName = title
        }
        this.$emit('mertricItemChange', { ...mertricItem, title: title, metricKeyItem })
        const params = {
          $t: getRequestT(),
          database: metricKeyItem && metricKeyItem.database ? metricKeyItem.database : 'telegraf',
          measurement: metricKey,
          field: mertric,
          scope: this.$store.getters.scope,
          ...this.timeRangeParams,
          ...this.extraParams,
        }
        this.metricInfoLoading = true
        const { data } = await new this.$Manager('unifiedmonitors', 'v1').get({ id: 'metric-measurement', params })
        this.metricInfo = data
        if (R.is(Array, this.metricInfo.tag_key)) {
          this.groupbyOpts = this.metricInfo.tag_key.map(v => ({ key: v, label: v }))
        }
        const Aggregations = _.get(this.metricInfo, 'func.field_opt_value.Aggregations')
        if (R.is(Array, Aggregations)) {
          this.functionOpts = Aggregations.map(v => ({ key: v, label: this.$te(`monitor.func.${v}`) ? this.$t(`monitor.func.${v}`) : v }))
        }
        const groupBy = this.form.fd.group_by || []
        const func = this.form.fd.function
        const resetGroupBy = groupBy.filter(key => (this.metricInfo?.tag_key || []).includes(key))
        this.shellSet('group_by', resetGroupBy, { emitParams: false })
        if (!~(Aggregations || []).indexOf(func)) {
          this.shellSet('function', undefined, { emitParams: false })
        }
        this.$nextTick(this.toParams)
        this.metricInfoLoading = false
      } catch (error) {
        this.metricInfo.tag_key = []
        this.metricInfo.func = {}
        this.metricInfoLoading = false
        throw error
      }
    },
    toggle () {
      this.panelShow = !this.panelShow
    },
    async toParams (ignoreEmit) {
      const fd = { ...this.form.fd }
      const params = {
        database: this.metricKeyItem && this.metricKeyItem.database ? this.metricKeyItem.database : 'telegraf',
      }
      const resParams = {}
      const tags = []
      if (!this.queryOnly) {
        try {
          if (this.$refs.shellFormRef) {
            await this.$refs.shellFormRef.validate()
          }
          if (typeof this.$refs.metricRef?.validate === 'function') {
            await this.$refs.metricRef.validate()
          }
          if (typeof this.$refs.filtersRef?.validate === 'function') {
            await this.$refs.filtersRef.validate()
          }
        } catch (e) {
          return
        }
        params.name = fd.name
      }
      if (fd.metric_key) params.measurement = fd.metric_key
      if (fd.metric_value) params.select = [[{ type: 'field', params: [fd.metric_value] }]]
      if (R.is(Object, fd.tagValues)) {
        R.forEachObjIndexed((value, key) => {
          let val = value
          if ((fd.tagOperators[key] === '=~' || fd.tagOperators[key] === '!~') && val && val.length) {
            const arr = Array.isArray(val) ? val : [val]
            val = `/${arr.map(v => `^${v}$`).join('|')}/`
          } else {
            val = R.is(Array, val) ? (val.length ? val[0] : '') : val
          }
          if (val) {
            const tag = {
              key: fd.tagKeys[key],
              value: val,
              operator: fd.tagOperators[key],
            }
            if (fd.tagConditions && fd.tagConditions[key]) {
              tag.condition = fd.tagConditions[key]
            }
            tags.push(tag)
          }
        }, fd.tagValues)
      }
      if (tags.length) {
        params.tags = tags
      }
      if ((R.is(Array, fd.group_by) && fd.group_by.length)) {
        params.group_by = fd.group_by.map(group_by => {
          return { type: 'tag', params: [group_by] }
        })
      }
      if (fd.result_function) {
        resParams.type = fd.result_function
        if (fd.result_function === 'percentile') {
          if (fd.percentile) {
            resParams.params = [Math.max(1, Math.min(fd.percentile, 99))]
          } else {
            delete resParams.params
            delete resParams.type
          }
        } else if (fd.result_function === 'p50') {
          resParams.type = 'percentile'
          resParams.params = [50]
        } else if (fd.result_function === 'p95') {
          resParams.type = 'percentile'
          resParams.params = [95]
        }
      }
      if (!fd.metric_key || !fd.metric_value) {
        this.oldParams = params
        return params
      }
      if (R.is(String, fd.function) && fd.function.length) {
        params.select[0].push({ type: fd.function.toLowerCase(), params: [] })
      }
      if (R.equals(this.oldParams, params) && R.equals(this.oldResParams, resParams)) return params
      this.$emit('paramsChange', params, resParams)
      this.oldResParams = resParams
      this.oldParams = params // 记录为上一次 params
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../../src/styles/less/theme';

.monitor-form {
  &.hideBody :deep(.ant-card-body) {
    padding: 0 !important;
  }
  .remove-icon {
    transition: color 0.1s ease-in;
    &:hover {
      color: @error-color;
    }
  }
  // 让 label 和 wrapper 基于父元素宽度，而不是固定的 span
  :deep(.ant-form-item) {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
  }
  ::v-deep .ant-form-item-label,
  :deep(.ant-form-item-label > label) {
    width: 150px !important;
    flex: 0 0 150px !important;
    padding-right: 8px;
  }
  // // 覆盖 Ant Design 的栅格类
  :deep(.ant-col) {
    width: auto !important;
    max-width: none !important;
  }
  :deep(.ant-form-item-control-wrapper) {
    flex: 1 1 auto;
    width: auto !important;
    min-width: 0;
    max-width: 100%;
  }
  :deep(.ant-form-item-control) {
    width: 100%;
  }
}

</style>
