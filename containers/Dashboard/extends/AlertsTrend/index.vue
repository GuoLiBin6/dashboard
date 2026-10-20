<template>
  <div class="h-100 position-relative">
    <div class="dashboard-card-wrap">
      <div class="dashboard-card-header">
        <div class="dashboard-card-header-left">{{ fd.name }}<icon class="ml-2" type="loading" v-if="loading" /></div>
        <div class="dashboard-card-header-right">
          <slot name="actions" :handle-edit="handleEdit" />
          <router-link v-if="!edit" to="/monitoroverview" class="ml-2">
            <icon type="arrow-right" style="font-size:18px" />
          </router-link>
        </div>
      </div>
      <div class="dashboard-card-body flex-column justify-content-center">
        <template v-if="chartOptions.xAxis.data.length">
          <div class="flex-fill position-relative">
            <div class="dashboard-fco-wrap">
              <e-chart :options="chartOptions" style="height: 100%; width: 100%;" autoresize />
            </div>
          </div>
        </template>
        <template v-else>
          <a-empty />
        </template>
      </div>
    </div>
    <base-drawer v-model:visible="visible" :title="$t('dashboard.text_5')" @ok="handleSubmit">
      <a-form-model ref="formRef" hideRequiredMark :model="fd" :rules="rules">
        <a-form-model-item :label="$t('dashboard.text_6')" prop="name">
          <a-input v-model:value="fd.name" />
        </a-form-model-item>
      </a-form-model>
    </base-drawer>
  </div>
</template>

<script>
// import i18n from 'vue-i18n'
import { mapGetters } from 'vuex'
import BaseDrawer from '@Dashboard/components/BaseDrawer'
import { chartColors } from '@/constants'
import { getCurrency } from '@/utils/common/cookie'
import { currencyUnitMap } from '@/constants/currency'
import { getSignature } from '@/utils/crypto'
// import OverviewLine from '@Monitor/components/MonitorCard/sections/chart/line'
export default {
  name: 'AlertsTrend',
  components: {
    BaseDrawer,
  },
  props: {
    options: {
      type: Object,
      required: true,
    },
    params: Object,
    edit: Boolean,
    dataRangeParams: {
      type: Object,
    },
  },
  data () {
    const initialNameValue = (this.params && this.params.name) || this.$t('dashboard.alerts_trend')
    return {
      data: [],
      visible: false,
      loading: false,
      seriesData: [],
      fd: {
        name: initialNameValue,
        currency: (this.params && this.params.currency) || getCurrency(),
      },
      rules: {
        name: [
          { required: true, message: this.$t('dashboard.text_8') },
        ],
      },
      chartOptions: {
        tooltip: {
          show: true,
          trigger: 'axis',
          axisPointer: {
            type: 'none',
          },
        },
        grid: {
          left: 50,
          bottom: 30,
          top: 30,
          right: 20,
          width: 'auto',
        },
        xAxis: {
          type: 'category',
          data: [],
        },
        yAxis: {
          type: 'value',
        },
        series: [],
        color: chartColors,
      },
    }
  },
  computed: {
    ...mapGetters(['scope', 'capability', 'isAdminMode', 'isDomainMode', 'isProjectMode', 'userInfo']),
    newCurrencys () {
      return this.CURRENCYS.filter(v => {
        return this.currencyOpts.find(obj => obj.item_id === v.key)
      })
    },
    currencySign () {
      return currencyUnitMap[this.fd.currency]?.sign || currencyUnitMap.CNY.sign
    },
    extraParams () {
      const ret = {}
      if (this.scope === 'domain') ret.domain_id = this.userInfo?.projectDomainId
      if (this.scope === 'project') ret.project_id = this.userInfo?.projectId
      return ret
    },
  },
  watch: {
    fd: {
      handler () {
        this.fetchData()
      },
      deep: true,
    },
    'dataRangeParams.scope': {
      handler (val) {
        this.fetchData()
      },
      immediate: true,
    },
    'dataRangeParams.domain': {
      handler (val) {
        this.fetchData()
      },
      immediate: true,
    },
    'dataRangeParams.project': {
      handler (val) {
        this.fetchData()
      },
      immediate: true,
    },
  },
  created () {
    this.$emit('update', this.options.i, { ...this.fd })
    this.fetchData()
  },
  methods: {
    refresh () {
      return this.fetchData()
    },
    getDate () {
      const end = this.$moment()
      const start = this.$moment().subtract(30, 'days')
      return {
        start_date: start.format('YYYY-MM-DD') + 'TZ',
        end_date: end.format('YYYY-MM-DD') + 'TZ',
        // start_date: '2021-05-01TZ',
        // end_date: '2021-05-31TZ',
        data_type: 'day',
      }
    },
    commonParams () {
      const extendParams = {
        scope: this.scope,
      }
      Object.assign(extendParams, this.extraParams)
      return extendParams
    },
    chartQueryData () {
      const extendParams = this.commonParams()
      const ret = {
        from: '720h',
        interval: '24h',
        metric_query: [
          {
            model: {
              database: 'monitor',
              measurement: 'alert_record_history',
              select: [
                [{ params: ['res_num'], type: 'field' }, { type: 'sum' }],
              ],
              group_by: [{
                type: 'tag',
                params: ['res_type'],
              }],
            },
          },
        ],
        unit: true,
        ...extendParams,
      }
      const tags = []
      if (this.isAdminMode) {
        if (this.dataRangeParams?.scope === 'domain' && this.dataRangeParams?.domain) {
          tags.push({
            key: 'domain_id',
            operator: '=',
            value: this.dataRangeParams?.domain,
          })
        }
        if (this.dataRangeParams?.scope === 'project' && this.dataRangeParams?.project) {
          tags.push({
            key: 'project_id',
            operator: '=',
            value: this.dataRangeParams?.project,
          })
        }
      }
      if (this.isDomainMode) {
        if (this.dataRangeParams?.scope === 'project' && this.dataRangeParams?.project) {
          tags.push({
            key: 'project_id',
            operator: '=',
            value: this.dataRangeParams?.project,
          })
        }
      }
      if (tags.length) {
        ret.metric_query[0].model.tags = tags
      }
      return ret
    },
    tabChartData (rawDatas) {
      const chartData = {
        columns: [],
        rows: [],
      }
      const list = []
      const dateList = []
      if (rawDatas && rawDatas.length > 0) {
        chartData.columns = []
        const _temp = {}
        rawDatas.map((item) => {
          const points = item.points
          if (!item.points) {
            return
          }
          const columnName = item.raw_name ? this.$t(`dictionary.${item.raw_name}`) : this.$t('monitor.overview_alert.undefined')
          chartData.columns.push(columnName)
          let series = points.map((item) => {
            return { name: item[1], value: item[0] }
          })
          series = series.sort((a, b) => {
            return a.name - b.name
          })
          for (const i in series) {
            const d = new Date(series[i].name)
            const rn = `${d.getMonth() + 1}-${d.getDate()}`
            if (_temp.hasOwnProperty(rn)) {
              _temp[rn][columnName] = series[i].value
            } else {
              _temp[rn] = { name: rn }
              _temp[rn][columnName] = series[i].value
            }
          }
        })
        // base data
        const initData = {}
        chartData.columns.map((item) => { initData[item] = 0 })
        // fill data
        const rows = []
        const now = new Date()
        for (let i = 30; i > 0; i--) {
          const cur = new Date(now - i * 24 * 60 * 60 * 1000)
          const rn = `${cur.getMonth() + 1}-${cur.getDate()}`
          dateList.push(rn)
          if (_temp.hasOwnProperty(rn)) {
            rows.push(Object.assign({}, initData, _temp[rn]))
          } else {
            rows.push(Object.assign({}, { name: rn }, initData))
          }
        }
        // 拼接数据
        chartData.columns.map((item, index) => {
          list.push({
            type: 'bar',
            name: item,
            stack: 'total',
            data: [],
          })
          rows.map(item2 => {
            list[index].data.push(item2[item])
          })
        })
      }
      return { dateList, list }
    },
    async fetchData () {
      this.loading = true
      try {
        var queryData = this.chartQueryData()
        queryData.signature = getSignature(queryData)
        const { data = {} } = await new this.$Manager('unifiedmonitors', 'v1').performAction({ id: 'query', action: '', data: queryData, params: { $t: new Date().getSeconds() } })
        const { series = [] } = data
        const newData = this.tabChartData(series)
        this.chartOptions.xAxis.data = newData.dateList
        this.chartOptions.series = newData.list
      } finally {
        this.loading = false
      }
    },
    handleEdit () {
      this.visible = true
    },
    async handleSubmit () {
      try {
        await this.$refs.formRef.validate()
        this.$emit('update', this.options.i, { ...this.fd })
        this.visible = false
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
