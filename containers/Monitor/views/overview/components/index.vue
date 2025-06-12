<template>
  <div class="overview-index">
    <a-row v-if="scope !=='project'">
      <overview-nav :items="navs" @change="changeNav" />
    </a-row>
    <a-row>
      <div class="monitor-overview-chart mb-2">
        <div class="title-wrapper">
          <div class="title">
            {{ $t('monitor.dashboard.overview.title') }}
            <help-tooltip name="monitorDashboardOverviewTips" />
          </div>
        </div>
        <summary-cards :scope="curNav.scope" :accountTopology="accountTopology" :scopeId="curNav.id" style="padding-top: 1em;" />
      </div>
    </a-row>
    <a-row>
      <div class="monitor-overview-chart mb-2">
        <div class="title-wrapper">
          <div class="title">
            {{ $t('monitor.dashboard.account.title') }}
          </div>
        </div>
        <account-cards :data="accountTopology" :loading="topologyLoading" style="padding-top: 1em;" />
      </div>
    </a-row>
    <a-row>
      <a-col :span="8">
        <div class="monitor-overview-chart mb-2">
          <div class="title-wrapper">
            <div class="title">{{ $t('monitor.overview_alert_sum') }}</div>
          </div>
          <overview-ring
            yAxisFormat="0"
            chartHeigth="299px"
            :chartData="ringChart.chartData"
            :chartEvents="ringChartEvent()"
            :title="$t('monitor.overview_alert_sum_pie')"
            :subtitle="ringChart.subtitle"
            :loading="ringChart.loading"
            :exportExcelColumns="exportExcelColumns"
            :exportName="$t('monitor.overview_alert_sum')" />
        </div>
      </a-col>
      <a-col :span="16">
        <div class="monitor-overview-chart mb-2">
          <div class="title-wrapper">
            <div class="title">{{  $t('monitor.overview_alert_trend') }}</div>
          </div>
          <overview-line
            yAxisFormat="0"
            chartHeigth="299px"
            :isHistogram="true"
            :chartData="lineChart.chartData"
            :chartSetting="lineChart.chartSetting"
            :loading="lineChart.loading"  />
        </div>
      </a-col>
    </a-row>
    <a-row>
      <overview-card :scope="curNav.scope" :extraParams="extraParams" @changeNav="updateNavs" />
    </a-row>
  </div>
</template>

<script>
import OverviewRing from '@Monitor/components/MonitorCard/sections/chart/ring'
import OverviewLine from '@Monitor/components/MonitorCard/sections/chart/line'
import OverviewCard from '@Monitor/components/MonitorCard/OverviewCard'
import OverviewNav from '@Monitor/components/MonitorCard/sections/nav'
import { getSignature } from '@/utils/crypto'
import SummaryCards from './SummaryCards'
import AccountCards from './AccountCards'

export default {
  name: 'OverviewIndex',
  components: {
    SummaryCards,
    OverviewRing,
    OverviewLine,
    OverviewCard,
    OverviewNav,
    AccountCards,
  },
  data () {
    const scope = this.$store.getters.scope
    const u = this.$store.getters.userInfo
    const navs = []
    if (scope === 'system') {
      navs.push({ id: 'system', location: this.$t('cloudenv.text_457'), title: this.$t('cloudenv.text_457'), scope })
    } else if (scope === 'domain') {
      navs.push({ id: u.projectDomainId, location: this.$t('dictionary.domain'), title: u.projectDomain, scope })
    } else if (scope === 'project') {
      navs.push({ id: u.projectId, location: this.$t('dictionary.project'), title: u.projectName, scope })
    }
    return {
      scope: scope,
      navs: navs,
      curNav: navs[0],
      ringChart: { loading: true },
      lineChart: {
        loading: true,
        chartSetting: {},
        chartData: { rows: [], columns: [] },
      },
      loading: false,
      topologyLoading: false,
      exportExcelColumns: {
        [this.$t('common_151')]: {
          field: 'name',
        },
        [this.$t('monitor.text_98')]: {
          field: 'count',
        },
      },
      accountTopology: {},
    }
  },
  computed: {
    scopeLevel () {
      return Math.max(['project', 'domain', 'system'].indexOf(this.curNav.scope) + 1, 0)
    },
    extraParams () {
      const ret = {}
      if (this.curNav.scope === 'domain') ret.domain_id = this.curNav.id
      if (this.curNav.scope === 'project') ret.project_id = this.curNav.id
      return ret
    },
  },
  watch: {
    'curNav.scope' () {
      this.$nextTick(() => {
        this.fetchAllCharts()
      })
    },
  },
  created () {
    this.manager = new this.$Manager('global_topology', 'v1')
    this.fetchAllCharts()
    this.fetchData()
  },
  methods: {
    updateNavs (row) {
      if (!row || !row.tags) {
        console.log(`toNav ${row}`)
        return
      }
      const tags = row.tags
      console.log(tags)
      // system -> domain
      if (this.scopeLevel > 2 && tags.domain_id) {
        this.navs = this.navs.slice(0, 1)
        this.navs.push({ id: tags.domain_id, location: this.$t('dictionary.domain'), name: tags.project_domain, scope: 'domain' })
      }
      // domain -> project
      if (this.scopeLevel > 1 && tags.tenant_id) {
        const end = this.navs[0].scope === 'system' ? 2 : 1
        this.navs = this.navs.slice(0, end)
        this.navs.push({ id: tags.tenant_id, location: this.$t('dictionary.project'), name: tags.tenant, scope: 'project' })
      }
      this.changeNav(this.navs[this.navs.length - 1])
    },
    changeNav: function (e) {
      this.curNav = e
    },
    ringChartEvent: function () {
      const self = this
      return {
        click: function (e) {
          self.toHistory(e)
        },
      }
    },
    toHistory: function (e) {
      const matchs = this.ringChart.chartData.rows.filter(row => { return row.name === e.name && row.count === e.value })
      if (matchs.length > 0) {
        this.$router.push({ path: '/alertrecord', query: { res_type: matchs[0].raw_name } })
      }
    },
    async fetchAllCharts () {
      await this.fetchPieChartData()
      // 近30日告警趋势图
      await this.fetchTabChartData()
    },
    commonParams () {
      const extendParams = {
        scope: this.curNav.scope,
      }
      Object.assign(extendParams, this.extraParams)
      return extendParams
    },
    chartQueryData () {
      const extendParams = this.commonParams()
      return {
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
    },
    tabChartData (rawDatas) {
      const chartData = {
        columns: [],
        rows: [],
      }
      if (rawDatas && rawDatas.length > 0) {
        const name = this.$t('common_648')
        chartData.columns = [name]
        const _temp = {}
        rawDatas.map((item) => {
          const points = item.points
          if (!item.points) {
            return
          }
          let raw_name = item.raw_name
          if (raw_name === '{res_type=host}') raw_name = 'host'
          if (raw_name === '{res_type=agent}') raw_name = 'agent'
          const columnName = item.raw_name ? (this.$te(`dictionary.${raw_name}`) ? this.$t(`dictionary.${raw_name}`) : raw_name) : this.$t('monitor.overview_alert.undefined')
          chartData.columns.push(columnName)
          let series = points.map((item) => {
            return { [name]: item[1], value: item[0] }
          })
          series = series.sort((a, b) => {
            return a[name] - b[name]
          })
          for (const i in series) {
            const d = new Date(series[i][name])
            const rn = `${d.getMonth() + 1}/${d.getDate()}`
            if (_temp.hasOwnProperty(rn)) {
              _temp[rn][columnName] = series[i].value
            } else {
              _temp[rn] = { [name]: rn }
              _temp[rn][columnName] = series[i].value
            }
          }
        })

        // base data
        const initData = {}
        chartData.columns.slice(1).map((item) => { initData[item] = 0 })
        // fill data
        const rows = []
        const now = new Date()
        for (let i = 30; i > 0; i--) {
          const cur = new Date(now - i * 24 * 60 * 60 * 1000)
          const rn = `${cur.getMonth() + 1}/${cur.getDate()}`
          if (_temp.hasOwnProperty(rn)) {
            rows.push(Object.assign({}, initData, _temp[rn]))
          } else {
            rows.push(Object.assign({}, { [name]: rn }, initData))
          }
        }
        chartData.rows = rows
      }
      return chartData
    },
    async fetchTabChartData (measurement, field) {
      try {
        this.lineChart.loading = true
        this.lineChart.chartData = {
          columns: [],
          rows: [],
        }
        var data = this.chartQueryData()
        data.signature = getSignature(data)
        const { data: { series = [] } } = await new this.$Manager('unifiedmonitors', 'v1').performAction({ id: 'query', action: '', data, params: { $t: new Date().getSeconds() } })

        const self = this
        this.$nextTick(_ => {
          this.lineChart.rawDatas = series
          this.lineChart.chartData = self.tabChartData(series)
          this.lineChart.chartSetting.stack = { alerts: this.lineChart.chartData.columns.slice(1) }
          this.lineChart.loading = false
        })
        console.log(this.lineChart)
      } catch (error) {
        this.lineChart.loading = false
        throw error
      } finally {
        this.lineChart.loading = false
      }
    },
    async fetchPieChartData () {
      try {
        this.ringChart.loading = true
        this.ringChart.chartData = {
          columns: [],
          rows: [],
        }

        const params = this.commonParams()
        const { data: series = { } } = await new this.$Manager('alertrecords', 'v1').get({ id: 'total-alert', params: params })

        this.$nextTick(_ => {
          const chartData = {
            columns: ['name', 'count', 'raw_name'],
            rows: [],
          }

          let count = 0
          if (Object.keys(series).length > 0) {
            for (const item in series) {
              count += series[item]
              chartData.rows.push({ raw_name: item, name: this.$t(`dictionary.${item}`), count: series[item] })
            }
          } else {
            chartData.rows.push({ raw_name: '', name: '', count: 0 })
          }
          this.ringChart.subtitle = String(count)
          this.ringChart.chartData = chartData
          this.ringChart.loading = false
        })
      } catch (error) {
        this.ringChart.loading = false
        throw error
      }
    },
    async fetchData () {
      this.topologyLoading = true
      try {
        this.manager.list({
          params: {
            scope: this.$store.getters.scope,
            simple: false,
          },
        }).then((res) => {
          const data = res.data?.data || []
          this.accountTopology = this.arrangeData(data[0] || {})
          this.topologyLoading = false
        })
      } catch (e) {
        this.topologyLoading = false
        throw e
      }
    },
    arrangeData (dataSource) {
      const { accounts = [] } = dataSource
      const root = {
        name: this.brandName,
        id: '1',
        type: 'brand',
        cpu_count: 0,
        mem_size: 0,
        vcpu_count: 0,
        vmem_size: 0,
        server_count: 0,
        host_count: 0,
        storage_size: 0,
        storage_size_mb: 0,
        storage_actual_size: 0,
        storage_actual_size_mb: 0,
        showStorageVirtualSize: false,
        storage_virtual_size: 0,
        storage_virtual_size_mb: 0,
        gpu_count: 0,
        gpu_used_count: 0,
        children: [],
      }
      accounts.forEach((account, accountIdx) => {
        const acc = {
          ...account,
          type: 'account',
          cpu_count: 0,
          mem_size: 0,
          vcpu_count: 0,
          vmem_size: 0,
          server_count: 0,
          host_count: 0,
          storage_size: 0,
          storage_actual_size: 0,
          showStorageVirtualSize: false,
          storage_virtual_size: 0,
          storage_size_mb: (account.storage_size_gb || 0) * 1024,
          storage_actual_size_mb: (account.storage_size_used_gb || 0) * 1024,
          storage_virtual_size_mb: (account.storage_size_gb || 0) * 1024 * (account.storage_cmt_bound || 0),
          gpu_count: 0,
          gpu_used_count: 0,
          name: account.name,
          children: [],
        }
        const { regions = [] } = account
        regions.map((region, regionIdx) => {
          const reg = {
            ...region,
            type: 'region',
            cpu_count: 0,
            mem_size: 0,
            vcpu_count: 0,
            vmem_size: 0,
            server_count: 0,
            host_count: 0,
            storage_size: 0,
            storage_actual_size: 0,
            showStorageVirtualSize: false,
            storage_virtual_size: 0,
            gpu_count: 0,
            gpu_used_count: 0,
            children: [],
          }
          const { zones = [] } = region
          zones.forEach((zone, zoneIdx) => {
            const zo = {
              ...zone,
              type: 'zone',
              cpu_count: 0,
              mem_size: 0,
              vcpu_count: 0,
              vmem_size: 0,
              server_count: 0,
              host_count: 0,
              storage_size: 0,
              storage_actual_size: 0,
              showStorageVirtualSize: false,
              storage_virtual_size: 0,
              gpu_count: 0,
              gpu_used_count: 0,
              children: [],
            }
            const { hosts = [], storages = [] } = zone
            hosts.forEach((host, hostIdx) => {
              const ho = {
                ...host,
                type: 'host',
                children: [],
                vcpu_count: 0,
                vmem_size: 0,
              }
              delete ho.servers
              delete ho.isolate_devices
              const { servers = [], isolate_devices = [] } = host
              ho.server_count = servers.length
              ho.gpu_count = isolate_devices.length
              ho.gpu_used_count = isolate_devices.filter(item => item.guest_id).length
              const serverList = servers.map((server, serverIdx) => {
                ho.vcpu_count += (server.vcpu_count || 0)
                ho.vmem_size += (server.vmem_size || 0)
                return {
                  ...server,
                  type: 'server',
                }
              })
              const gpuList = isolate_devices.map((gpu, gpuIdx) => {
                return {
                  ...gpu,
                  type: 'gpu',
                }
              })
              if (serverList.length) {
                ho.children.push({
                  name: 'serverList',
                  type: 'server',
                  id: `vm-${accountIdx}-${regionIdx}-${zoneIdx}-${hostIdx}-1`,
                  list: [...serverList],
                  otherList: [...gpuList],
                })
              }
              if (gpuList.length) {
                ho.children.push({
                  name: 'gpuList',
                  type: 'isolate_device',
                  id: `gpu-${accountIdx}-${regionIdx}-${zoneIdx}-${hostIdx}-2`,
                  otherList: [...serverList],
                  list: [...gpuList],
                })
              }
              zo.cpu_count += ho.cpu_count
              zo.mem_size += ho.mem_size
              zo.vcpu_count += ho.vcpu_count
              zo.vmem_size += ho.vmem_size
              zo.server_count += ho.server_count
              zo.gpu_count += ho.gpu_count
              zo.gpu_used_count += ho.gpu_used_count
              zo.children.push(ho)
            })
            storages.forEach((storage, storageIdx) => {
              // const sto = {
              //   name: storage.name,
              //   id: storage.id,
              //   icon: storageImg,
              //   type: 'storage',
              //   children: [],
              // }
              zo.storage_size += storage.capacity || 0
              zo.storage_actual_size += storage.actual_capacity_used || 0
              if (storage.hasOwnProperty('cmtbound')) {
                zo.showStorageVirtualSize = true
                zo.storage_virtual_size += storage.capacity * (storage.cmtbound || 1)
              }
              // zo.children.push(sto)
            })
            reg.cpu_count += zo.cpu_count
            reg.mem_size += zo.mem_size
            reg.vcpu_count += zo.vcpu_count
            reg.vmem_size += zo.vmem_size
            reg.server_count += zo.server_count
            reg.gpu_count += zo.gpu_count
            reg.gpu_used_count += zo.gpu_used_count
            reg.host_count += hosts.length
            reg.storage_size += zo.storage_size
            reg.storage_actual_size += zo.storage_actual_size
            reg.storage_virtual_size += zo.storage_virtual_size
            if (zo.showStorageVirtualSize) {
              reg.showStorageVirtualSize = true
            }
            reg.children.push(zo)
          })
          // vpcs.forEach((vpc, vpcIdx) => {
          //   const vp = {
          //     ...vpc,
          //     icon: vpcImg,
          //     type: 'vpc',
          //     iconWidth: 50,
          //     iconHeight: 50,
          //     children: [],
          //   }
          //   const { wires = [] } = vpc
          //   wires.forEach((wire, wireIdx) => {
          //     const wi = {
          //       ...wire,
          //       icon: wireImg,
          //       type: 'wire',
          //       iconWidth: 45,
          //       iconHeight: 45,
          //       children: [],
          //     }
          //     const { networks = [] } = wire
          //     networks.forEach((network, networkIdx) => {
          //       const net = {
          //         ...network,
          //         icon: netImg,
          //         type: 'network',
          //         iconWidth: 40,
          //         iconHeight: 40,
          //         children: [],
          //       }
          //       wi.children.push(net)
          //     })
          //     vp.children.push(wi)
          //   })
          //   reg.children.push(vp)
          // })
          acc.cpu_count += reg.cpu_count
          acc.mem_size += reg.mem_size
          acc.vcpu_count += reg.vcpu_count
          acc.vmem_size += reg.vmem_size
          acc.server_count += reg.server_count
          acc.host_count += reg.host_count
          acc.gpu_count += reg.gpu_count
          acc.gpu_used_count += reg.gpu_used_count
          acc.storage_size += reg.storage_size
          acc.storage_actual_size += reg.storage_actual_size
          acc.storage_virtual_size += reg.storage_virtual_size
          if (reg.showStorageVirtualSize || acc.storage_virtual_size_mb > 0) {
            acc.showStorageVirtualSize = true
          }
          acc.children.push(reg)
        })
        root.cpu_count += acc.cpu_count
        root.mem_size += acc.mem_size
        root.vcpu_count += acc.vcpu_count
        root.vmem_size += acc.vmem_size
        root.server_count += acc.server_count
        root.host_count += acc.host_count
        root.storage_size += acc.storage_size
        root.storage_size_mb += (acc.storage_size_mb || acc.storage_size)
        root.storage_virtual_size_mb += (acc.storage_virtual_size_mb || acc.storage_virtual_size)
        root.storage_actual_size += acc.storage_actual_size
        root.storage_actual_size_mb += (acc.storage_actual_size_mb || acc.storage_actual_size)
        root.storage_virtual_size += acc.storage_virtual_size
        if (acc.showStorageVirtualSize || acc.storage_virtual_size_mb > 0) {
          root.showStorageVirtualSize = true
        }
        root.gpu_count += acc.gpu_count
        root.gpu_used_count += acc.gpu_used_count
        root.children.push(acc)
      })
      return root
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../../../src/styles/less/theme';

.monitor-overview-chart {
  border: 1px solid #F1F1F1;
  padding: 6px 24px 12px 6px;
  margin-left: 6px;
  margin-right: 6px;

  .header {
    font-weight: 500;
    .title-wrapper {
      .subtitle {
        font-size: 12px;
        color: #ccc;
      }
    }
  }
}
</style>
