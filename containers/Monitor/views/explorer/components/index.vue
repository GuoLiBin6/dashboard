<template>
  <div class="monitor-explorer" :class="{ 'monitor-explorer--template': isTemplate }">
    <div class="monitor-explorer__toolbar">
      <monitor-header
        class="monitor-explorer__header"
        v-model:time="time"
        v-model:timeGroup="timeGroup"
        :showTimegroup="true"
        :showGroupFunc="true"
        v-model:customTime="customTime"
        :showCustomTimeText="time==='custom'"
        :showCustomTime="!isTemplate"
        customTimeUseTimeStamp
        @refresh="fetchAllData">
        <template #between-refresh-time>
          <a-button
            v-if="!isTemplate"
            type="primary"
            class="mr-3"
            :disabled="addQueryDisabled"
            @click="addQuery">
            {{ $t('monitor.monitor_add') }}
          </a-button>
        </template>
      </monitor-header>
    </div>

    <monitor-forms
      ref="monitorForms"
      class="monitor-explorer__groups"
      :show-add-button="false"
      v-model:addDisabled="addQueryDisabled"
      @add="onAddForm"
      @refresh="refresh"
      @remove="remove"
      @resetChart="resetChart"
      :timeRangeParams="timeRangeParams"
      @mertricItemChange="mertricItemChange"
      @chartTypesChange="chartTypesChange"
      :extraParams="extraParams"
      :multiQuery="!isTemplate"
      :enableChartTypes="true"
      :panel="templateParams?.panel">
      <template #chart="{ index }">
        <monitor-line
          v-if="hasChartData(index)"
          :ref="`monitorLine${index}`"
          :loading="loadingList[index]"
          :description="seriesDescription[index]"
          :metricInfo="metricList[index] && metricList[index][0]"
          :isTemplate="isTemplate"
          :chartTypes="chartTypesList[index] || ['line']"
          :enableHeatmap="true"
          @chartInstance="setChartInstance"
          :series="seriesList[index] || []"
          :reducedResult="resultList[index]"
          :timeFormatStr="timeFormatStr"
          :pager="seriesListPager[index]"
          :reducedResultOrder="resultOrderList[index]"
          showTableExport
          @pageChange="pageChange"
          @exportTable="(total) => exportTable(index, total)"
          @reducedResultOrderChange="(order) => reducedResultOrderChange(index, order)">
          <template #extra>
            <a-button v-if="!isTemplate" class="mr-3" type="link" @click="handleSave(metricList[index], seriesDescription[index], index)">{{ $t('common.save') }}</a-button>
          </template>
        </monitor-line>
        <div v-else class="monitor-query-group__chart-empty">
          <loader v-if="loadingList[index]" :loading="true" />
          <span v-else>{{ $t('monitor.monitor_chart_placeholder') }}</span>
        </div>
      </template>
    </monitor-forms>
  </div>
</template>

<script>
import get from 'lodash/get'
import echarts from 'echarts'
import MonitorForms from '@Monitor/sections/ExplorerForm'
import MonitorLine from '@Monitor/sections/MonitorLine'
import { addMissingSeries } from '@Monitor/utils'
import { buildChartTypesMessage, DEFAULT_CHART_TYPES, parseChartTypesFromPanel } from '@Monitor/utils/chartTypes'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import MonitorHeader from '@/sections/Monitor/Header'
import { getRequestT } from '@/utils/utils'
import { getSignature } from '@/utils/crypto'
import { timeOpts } from '@/constants/monitor'
import MonitorTimeMixin from '@/mixins/monitorTime'
export default {
  name: 'ExplorerIndex',
  components: {
    MonitorForms,
    MonitorLine,
    MonitorHeader,
  },
  mixins: [DialogMixin, WindowsMixin, MonitorTimeMixin],
  props: {
    isTemplate: {
      type: Boolean,
      default: false,
    },
    isTemplateEdit: {
      type: Boolean,
      default: false,
    },
    templateParams: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    return {
      time: this.templateParams?.queryParams?.time || '1h',
      timeGroup: this.templateParams?.queryParams?.timeGroup || '1m',
      customTime: null,
      timeOpts,
      metricList: [],
      seriesList: [],
      resultList: [],
      resultOrderList: [],
      seriesListPager: [],
      chartInstanceList: [],
      loadingList: [],
      seriesDescription: [],
      chartTypesList: [],
      get,
      tablePageSize: 10,
      addQueryDisabled: true,
    }
  },
  computed: {
    timeFormatStr () {
      return this.timeOpts[this.time].timeFormat
    },
    timeRangeParams () {
      const params = {}
      if (this.time === 'custom') {
        if (this.customTime && this.customTime.from && this.customTime.to) {
          params.from = this.customTime.from
          params.to = this.customTime.to
        }
      } else if (this.time === 'last_month') {
        const now = this.$moment()
        const lastMonthStart = this.$moment().subtract(1, 'month').startOf('month')
        const lastMonthEnd = this.$moment().subtract(1, 'month').endOf('month')
        const fromHours = Math.floor(now.diff(lastMonthStart, 'hours', true))
        const toHours = Math.floor(now.diff(lastMonthEnd, 'hours', true))
        params.from = `${fromHours}h`
        params.to = `${toHours}h`
      } else {
        params.from = this.time
      }
      return params
    },
  },
  watch: {
    timeGroup () {
      this.fetchAllData()
    },
    time () {
      this.smartFetchAllData()
    },
    customTime () {
      this.smartFetchAllData()
    },
  },
  methods: {
    hasChartData (index) {
      // 已发起过该组查询，或正在 loading 时展示图表区；否则显示占位提示
      return !!(this.metricList[index] && this.metricList[index].length) || !!this.loadingList[index]
    },
    initTablePageSize (size) {
      this.tablePageSize = size
    },
    smartFetchAllData () {
      this.$nextTick(this.fetchAllData)
    },
    remove (i) {
      this.metricList.splice(i, 1)
      this.chartInstanceList.splice(i, 1)
      this.seriesList.splice(i, 1)
      this.resultList.splice(i, 1)
      this.resultOrderList.splice(i, 1)
      this.loadingList.splice(i, 1)
      this.chartTypesList.splice(i, 1)
      this.seriesDescription.splice(i, 1)
      this.seriesListPager.splice(i, 1)
      this.seriesListPager = this.seriesListPager.map((p, idx) => ({ ...p, seriesIndex: idx }))
    },
    onAddForm () {
      this.metricList.unshift([])
      this.chartInstanceList.unshift(null)
      this.seriesList.unshift([])
      this.resultList.unshift([])
      this.resultOrderList.unshift('')
      this.loadingList.unshift(false)
      this.chartTypesList.unshift([...DEFAULT_CHART_TYPES])
      this.seriesDescription.unshift({})
      this.seriesListPager.unshift({ seriesIndex: 0, total: 0, page: 1, limit: this.tablePageSize })
      this.seriesListPager = this.seriesListPager.map((p, idx) => ({ ...p, seriesIndex: idx }))
    },
    setChartInstance (val, i) {
      this.chartInstanceList.push(val)
      echarts.connect(this.chartInstanceList)
    },
    resetChart (i) {
      if (this.seriesList && this.seriesList.length && this.seriesList[i]) {
        this.seriesList[i] = []
        this.resultList[i] = []
        this.resultOrderList[i] = ''
        this.metricList[i] = []
        this.chartTypesList[i] = [...DEFAULT_CHART_TYPES]
        this.seriesDescription[i].title = ''
      }
    },
    chartTypesChange (val, i) {
      this.chartTypesList[i] = val || [...DEFAULT_CHART_TYPES]
    },
    mertricItemChange (item, i) {
      const t = +this.time.replace(/\D+/, '')
      const existBalance = this.seriesDescription.find(val => val.id === 'balance')
      if (!this.isTemplate && !existBalance && item.id === 'balance' && ~this.time.indexOf('h') && t < 3) {
        this.time = '72h'
        this.$message.warning(this.$t('common_562', [item.label]))
      }
      if (this.isTemplate && (!item.title || item.title === '-') && i === 0 && this.templateParams?.panel?.panel_name) {
        const metricDetails = this.templateParams?.panel?.common_alert_metric_details?.[0] || {}
        const updatedItem = {
          ...item,
          title: this.templateParams?.panel?.panel_name,
          metric_res_type: item.metric_res_type || metricDetails.res_type,
          metricKeyItem: item.metricKeyItem || (metricDetails.measurement ? { measurement: metricDetails.measurement } : item.metricKeyItem),
          key: item.key || metricDetails.field,
        }
        this.seriesDescription[i] = updatedItem
      } else {
        this.seriesDescription[i] = item
      }
    },
    async fetchAllData () {
      const jobs = []
      this.loadingList = []
      for (let i = 0; i < this.metricList.length; i++) {
        const metric_query = this.metricList[i]
        this.loadingList.push(true)
        jobs.push(this.fetchData(metric_query, this.tablePageSize, 0))
      }
      try {
        const moment = this.$moment()
        const res = await Promise.all(jobs)
        this.seriesList = res.map(val => addMissingSeries(get(val, 'series') || [], { ...this.timeRangeParams, interval: this.timeGroup }, moment))
        this.resultList = res.map(val => get(val, 'reduced_result') || [])
        this.resultOrderList = res.map(() => '')
        this.seriesListPager = res.map((val, index) => ({ seriesIndex: index, total: get(val, 'series_total') || 0, page: 1, limit: this.tablePageSize }))
        this.loadingList = this.loadingList.map(v => false)
        this.saveMonitorConfig()
      } catch (error) {
        this.loadingList = this.loadingList.map(v => false)
        throw error
      }
    },
    async _refresh (i, limit, offset, ignoreOrder) {
      try {
        this.loadingList[i] = true
        const { series = [], reduced_result = [], series_total = 0 } = await this.fetchData(this.metricList[i], limit, offset)
        this.seriesList[i] = series
        this.resultList[i] = reduced_result
        if (!ignoreOrder) {
          this.resultOrderList[i] = ''
        }
        this.seriesListPager[i] = { seriesIndex: i, total: series_total, page: 1 + offset / limit, limit: limit }
        this.loadingList[i] = false
      } catch (error) {
        this.seriesList[i] = []
        this.resultList[i] = []
        if (!ignoreOrder) {
          this.resultOrderList[i] = ''
        }
        this.loadingList[i] = false
        throw error
      }
    },
    async refresh (params, resParams, i) {
      const val = { model: params }
      if (resParams.type) {
        val.result_reducer = resParams
      }
      const metric_query = [val]
      this.metricList[i] = metric_query
      await this._refresh(i, this.tablePageSize, 0)
    },
    addQuery () {
      this.$refs.monitorForms && this.$refs.monitorForms.add()
    },
    reducedResultOrderChange (i, order) {
      this.resultOrderList[i] = order
      this.metricList[i][0].result_reducer_order = order
      this._refresh(i, this.seriesListPager[i].limit, 0, true)
    },
    async pageChange (pager) {
      this.tablePageSize = pager.limit
      await this._refresh(pager.seriesIndex, pager.limit, (pager.page - 1) * pager.limit)
      this.saveMonitorConfig({ tablePageSize: pager.limit })
    },
    async fetchData (metric_query, limit, offset) {
      try {
        const data = {
          metric_query,
          interval: this.timeGroup,
          scope: this.$store.getters.scope,
          slimit: limit,
          soffset: offset,
          ...this.timeRangeParams,
        }
        if (!data.metric_query || !data.metric_query.length || !data.from) return
        data.signature = getSignature(data)
        const { data: resdata } = await new this.$Manager('unifiedmonitors', 'v1').performAction({ id: 'query', action: '', data, params: { $t: getRequestT() } })
        return resdata
      } catch (error) {
        throw error
      }
    },
    handleSave (mq, desc, i) {
      const chartTypes = this.chartTypesList[i] || parseChartTypesFromPanel(null, { isPercent: false })
      this.createDialog('CreateMonitorDashboardChart', {
        name: desc.title,
        metric_query: mq,
        timeGroup: this.timeGroup,
        timeRangeParams: this.timeRangeParams,
        chartTypes,
        message: buildChartTypesMessage(chartTypes),
      })
    },
    async exportTable (index, total) {
      try {
        const { series = [], reduced_result = [], series_total = 0 } = await this.fetchData(this.metricList[index], total, 0)
        const lineRef = this.$refs[`monitorLine${index}`]
        const line = Array.isArray(lineRef) ? lineRef[0] : lineRef
        if (line && line.exportFullData) {
          line.exportFullData(series, reduced_result, series_total)
        }
      } catch (error) {
        throw error
      }
    },
    getTemplateParams () {
      const description = this.seriesDescription[0] || {}
      const metric = this.metricList[0]?.[0] || {}
      return {
        panel_name: description.title || description.label || '',
        time: this.time,
        timeGroup: this.timeGroup,
        model: metric.model || {},
        result_reducer: metric.result_reducer || '',
        common_alert_metric_details: [
          {
            res_type: description.metric_res_type || '',
            measurement: description.metricKeyItem?.measurement || '',
            field: description.key || '',
          },
        ],
      }
    },
  },
}
</script>

<style lang="less" scoped>
.monitor-explorer {
  width: 100%;

  &__toolbar {
    margin-bottom: 16px;
  }

  &__header {
    width: 100%;
  }

  &__groups {
    width: 100%;
  }
}

.monitor-query-group__chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  height: 100%;
  padding: 24px;
  color: rgba(0, 0, 0, 0.45);
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}
</style>
