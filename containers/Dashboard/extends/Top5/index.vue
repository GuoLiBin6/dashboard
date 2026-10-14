<template>
  <div class="h-100 position-relative">
    <div class="dashboard-card-wrap">
      <div class="dashboard-card-header">
        <div class="dashboard-card-header-left">
          {{ fd.name }}<icon class="ml-2" type="loading" v-if="loading" />
          <span v-if="isResDeny" class="ml-2"><icon class="warning-color mr-1" type="warning" />{{ $t('common.permission.403') }}</span>
        </div>
        <div class="dashboard-card-header-right">
          <slot name="actions" :handle-edit="handleEdit" />
          <a class="ml-2" href="javascript:;" v-if="!edit" @click.prevent="goPage">
            <icon type="arrow-right" style="font-size:18px" />
          </a>
        </div>
      </div>
      <div class="dashboard-card-body flex-column justify-content-center">
        <template v-if="seriesData && seriesData.length">
          <div class="flex-fill position-relative">
            <div class="dashboard-fco-wrap">
              <template v-for="item in seriesData" :key="item.name">
                <div class="mt-2 mb-2">
                  <div class="d-flex mini-text">
                    <div class="flex-fill text-truncate" :title="item.name">{{ item.name }}</div>
                    <div class="flex-grow-0 flex-shrink-0 text-color-help ml-2">{{ getLabel(item.value) }}</div>
                  </div>
                  <a-progress :percent="getPercent(item.value)" :showInfo="false" status="normal" :strokeWidth="4" stroke-color="#ADE4B6" />
                </div>
              </template>
            </div>
          </div>
        </template>
        <template v-else>
          <data-empty />
        </template>
      </div>
    </div>
    <base-drawer v-model:visible="visible" :title="$t('dashboard.text_5')" @ok="handleSubmit">
      <a-form-model ref="formRef" hideRequiredMark :model="fd" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('dashboard.text_6')" prop="name">
          <a-input v-model:value="fd.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dashboard.text_56')" prop="resType">
          <a-radio-group v-model:value="fd.resType" @change="handleResTypeChange">
            <a-radio-button value="server">{{$t('dashboard.text_57')}}</a-radio-button>
            <a-radio-button value="host">{{$t('dashboard.text_58')}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('dashboard.text_55')" prop="brand">
          <a-select v-model:value="fd.brand" allowClear :placeholder="$t('dashboard.text_99')" mode="multiple">
            <template v-for="item of brands" :key="item.key">
              <a-select-option :value="item.key">{{ item.label }}</a-select-option>
            </template>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('dashboard.text_20')" prop="usage">
          <a-select v-model:value="fd.usage">
            <template v-for="item of usageOptions[fd.resType]" :key="item.key">
              <a-select-option :value="item.key">{{ item.label }}</a-select-option>
            </template>
          </a-select>
          <div slot="extra" v-if="showDocsLink()">
            <i18n path="metricConfig.create_form.metric_extra">
              <template #link>
                <help-link :href="metricDoc">{{$t('metricConfig.create_form.usage_link')}}</help-link>
              </template>
            </i18n>
          </div>
        </a-form-model-item>
        <a-form-model-item :label="$t('monitor.overview.aggregate')" prop="dimensionId">
          <a-select v-model:value="fd.dimensionId">
            <a-select-option v-for="item in dimentions" :value="item.id" :key="item.id">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="TOP/Bottom" prop="order">
          <a-select v-model:value="fd.order">
            <a-select-option value="TOP">TOP</a-select-option>
            <a-select-option value="BOTTOM">BOTTOM</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('dashboard.text_59')" prop="limit">
          <a-input-number :min="1" :max="100" v-model:value="fd.limit" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dashboard.text_60')" prop="time">
          <a-select v-model:value="fd.time">
            <template v-for="item of timeOptions" :key="item.key">
              <a-select-option :value="item.key">{{ item.label }}</a-select-option>
            </template>
          </a-select>
        </a-form-model-item>
      </a-form-model>
    </base-drawer>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import BaseDrawer from '@Dashboard/components/BaseDrawer'
import { load } from '@Dashboard/utils/cache'
import { getMetricDocs } from '@Dashboard/constants'
import { findPlatform, typeClouds } from '@/utils/common/hypervisor'
import { getRequestT } from '@/utils/utils'
import { hasPermission } from '@/utils/auth'
import { getSignature } from '@/utils/crypto'
import setting from '@/config/setting'
import { showDocsLink } from '@/constants/docs'
import { usageConfig, serverUsageOptions, hostUsageOptions } from './constants'
export default {
  name: 'Top5',
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
    const initialBrandValue = (this.params && this.params.brand && R.split(',', this.params.brand)) || []
    const initialResTypeValue = (this.params && this.params.resType) || 'server'
    const initialDimensionId = (this.params && this.params.dimensionId) || (initialResTypeValue === 'server' ? 'vm_id' : 'host_id')
    let initialUsage = this.params && this.params.usage
    if (!initialUsage) {
      if (initialResTypeValue === 'server') {
        initialUsage = serverUsageOptions[0].key
      }
      if (initialResTypeValue === 'host') {
        initialUsage = hostUsageOptions[0].key
      }
    }
    const initialNameValue = (this.params && this.params.name) || `${serverUsageOptions[0].label}TOP5`
    const initialOrderValue = (this.params && this.params.order) || 'TOP'
    const initialLimit = (this.params && this.params.limit) || 5
    const initialTime = (this.params && this.params.time) || 24 * 60
    return {
      showDocsLink,
      data: [],
      visible: false,
      loading: false,
      seriesData: [],
      fd: {
        name: initialNameValue,
        brand: initialBrandValue,
        resType: initialResTypeValue,
        usage: initialUsage,
        order: initialOrderValue,
        limit: initialLimit,
        time: initialTime,
        dimensionId: initialDimensionId,
      },
      rules: {
        name: [
          { required: true, message: this.$t('dashboard.text_8') },
        ],
        resType: [
          { required: true, message: this.$t('dashboard.text_73') },
        ],
        usage: [
          { required: true, message: this.$t('dashboard.text_22') },
        ],
        order: [
          { required: true, message: this.$t('dashboard.text_74') },
        ],
        limit: [
          { required: true, message: this.$t('dashboard.text_75') },
        ],
        time: [
          { required: true, message: this.$t('dashboard.text_76') },
        ],
        dimensionId: [
          { required: true, message: '' },
        ],
      },
      usageOptions: {
        server: serverUsageOptions,
        host: hostUsageOptions,
      },
      timeOptions: [
        { label: this.$t('timeselect.hour', [1]), key: 60 * 60 },
        { label: this.$t('timeselect.hours', [6]), key: 360 * 60 },
        { label: this.$t('timeselect.hours', [12]), key: 12 * 60 * 60 },
        { label: this.$t('timeselect.days', [1]), key: 24 * 60 * 60 },
        { label: this.$t('timeselect.days', [7]), key: 7 * 24 * 60 * 60 },
        { label: this.$t('timeselect.days', [14]), key: 14 * 24 * 60 * 60 },
        { label: this.$t('timeselect.months', [1]), key: 30 * 24 * 60 * 60 },
      ],
      formItemLayout: {
        wrapperCol: {
          span: 18,
        },
        labelCol: {
          span: 6,
        },
      },
      metricDoc: getMetricDocs(this.$store.getters.scope),
    }
  },
  computed: {
    ...mapGetters(['scope', 'capability', 'isAdminMode', 'isDomainMode', 'isProjectMode', 'userInfo', 'permission']),
    brandEnvs () {
      const brand = this.fd.brand
      return brand.map(key => findPlatform(key))
    },
    maxSeriesData () {
      const dataList = this.seriesData.map(item => Number(item.value))
      const maxData = Math.max.apply(null, dataList)
      return maxData > 100 ? maxData : 100
    },
    brands () {
      const isServer = this.fd.resType === 'server'
      const brands = (this.capability.brands || []).map(item => {
        const opt = typeClouds.brandMap[item]
        if (opt) {
          return {
            label: opt.label,
            key: opt.key,
          }
        }
        return {
          label: item,
          key: item,
        }
      })
      if (isServer) {
        return brands.filter(item => {
          const env = findPlatform(item.key)
          return env !== 'private' || env !== 'idc'
        })
      }
      return brands.filter(item => {
        const env = findPlatform(item.key)
        return env === 'private' || env === 'idc'
      })
    },
    dimentions () {
      const curScope = this.scope
      const scopeLevel = Math.max(['project', 'domain', 'system'].indexOf(curScope) + 1, 0)
      const ret = []
      if (this.fd.resType === 'server') {
        ret.push({ scope: curScope, id: 'vm_id', name: 'vm_name', label: this.$t('cloudenv.text_99') })
      } else {
        ret.push({ scope: curScope, id: 'host_id', name: 'host', label: this.$t('cloudenv.text_101') })
      }
      scopeLevel > 2 && ret.push({
        scope: curScope,
        id: 'domain_id',
        name: 'project_domain',
        label: this.$t('dictionary.domain'),
      })
      scopeLevel > 1 && this.fd.resType === 'server' && ret.push({
        scope: curScope,
        id: 'tenant_id',
        name: 'tenant',
        label: this.$t('dictionary.project'),
      })
      ret.push({ scope: curScope, id: 'brand', name: 'brand', label: this.$t('common.brands') })
      ret.push({ scope: curScope, id: 'cloudregion_id', name: 'cloudregion', label: this.$t('cloudenv.text_10') })
      ret.push({ scope: curScope, id: 'zone_id', name: 'zone', label: this.$t('cloudenv.text_11') })
      return ret
    },
    dimension () {
      return this.dimentions.filter((d) => { return d.id === this.fd.dimensionId })[0]
    },
    isResDeny () {
      const usage = this.params?.usage || ''
      if (usage.endsWith('vm_cpu') || usage.endsWith('vm_mem') || usage.endsWith('vm_disk')) {
        return !hasPermission({ key: 'servers_list', permissionData: this.permission })
      }
      return !hasPermission({ key: 'compute_usages_get' })
    },
  },
  watch: {
    fd: {
      handler () {
        this.$nextTick(() => {
          this.fetchData()
        })
      },
      deep: true,
    },
    'fd.resType' (val) {
      if (this.dimentions.filter(item => item.id === this.fd.dimensionId).length === 0) {
        this.fd.dimensionId = this.dimentions[0].id
      }
      this.changeName(val, this.fd.usage)
    },
    'fd.usage': {
      handler (val) {
        this.changeName(this.fd.resType, val)
      },
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
    const values = { ...this.fd }
    values.brand = R.join(',', values.brand || [])
    this.$emit('update', this.options.i, values)
    this.fetchData()
  },
  methods: {
    refresh () {
      return this.fetchData()
    },
    async fetchData () {
      // if (!this.fd.brand) return
      if (this.isResDeny) return
      this.loading = true
      try {
        const requestData = this.genQueryData()
        requestData.signature = getSignature(requestData)
        const data = await load({
          res: 'unifiedmonitors',
          actionArgs: {
            url: '/v1/unifiedmonitors/query',
            method: 'POST',
            params: {
              $t: getRequestT(),
              ignoreErrorStatusCode: [403],
            },
            data: requestData,
          },
          useManager: false,
          resPath: 'data.series',
        })
        this.seriesData = this.toHistogramChartData(data || [])
      } finally {
        this.loading = false
      }
    },
    toHistogramChartData (series) {
      const { order, limit } = this.fd
      let rows = series.map((item) => {
        const lastPoint = item.points ? item.points[item.points.length - 1] : undefined
        if (lastPoint) {
          return {
            name: this.filterByOem(item.tags[this.dimension.name]),
            id: item.tags[this.dimension.id],
            value: lastPoint[0],
            timestamp: lastPoint[1],
            tags: item.tags,
          }
        }
      })
      rows = rows.sort((a, b) => {
        if (order.toLowerCase() === 'bottom') {
          return a.value - b.value
        } else {
          return b.value - a.value
        }
      })
      if (rows.length > limit) {
        rows = rows.slice(0, limit)
      }
      return rows
    },
    filterByOem (name) {
      if (this.fd.dimensionId === 'brand') {
        if (name === 'OneCloud') {
          return setting.brand[setting.language] || name
        } else if (name === 'Cloudpods') {
          const { companyInfo = {} } = this.$store.state.app
          return setting.language === 'en' ? (companyInfo.inner_copyright_en || name) : (companyInfo.inner_copyright || name)
        }
      }
      return name
    },
    handleEdit () {
      this.visible = true
    },
    async handleSubmit () {
      try {
        await this.$refs.formRef.validate()
        const updateValues = { ...this.fd }
        updateValues.brand = updateValues.brand.join(',')
        this.$emit('update', this.options.i, updateValues)
        this.visible = false
      } catch (error) {
        throw error
      }
    },
    handleResTypeChange (e) {
      const resType = e?.target?.value ?? this.fd.resType
      this.fd.usage = this.usageOptions[resType][0].key
      this.fd.brand = []
    },
    genQueryData () {
      const fd = this.fd
      let ret = ''
      const brandKey = 'brand'
      const brand = this.fd.brand
      const usageKeys = fd.usage.split(',')
      const min = fd.time / 60
      const condition = this.getDomainOrProjectQuery()
      const brandTags = brand.map(key => {
        return {
          key: brandKey,
          value: key,
          operator: '=',
          condition: 'and',
        }
      })
      const rangeTags = []
      if (this.isAdminMode && this.dataRangeParams?.scope === 'domain' && this.dataRangeParams?.domain) {
        rangeTags.push({
          key: 'domain_id',
          value: this.dataRangeParams?.domain,
          operator: '=',
        })
      }
      if (this.isAdminMode && this.dataRangeParams?.scope === 'project' && this.dataRangeParams?.project) {
        rangeTags.push({
          key: 'tenant_id',
          value: this.dataRangeParams?.project,
          operator: '=',
        })
      }
      if (this.isDomainMode && this.dataRangeParams?.scope === 'project' && this.dataRangeParams?.project) {
        rangeTags.push({
          key: 'tenant_id',
          value: this.dataRangeParams?.project,
          operator: '=',
        })
      }
      if (this.brandEnvs.length && this.brandEnvs.every(env => env === 'public')) {
        if (fd.resType === 'server') {
          // ret = `SELECT ${fd.order}("${usageKeys[0]}", "vm_name", "vm_ip", "hypervisor", ${fd.limit}) FROM "${usageKeys[1]}" WHERE time > now() - ${min}m AND "${brandKey}"='${brand}'`
          ret = {
            metric_query: [
              {
                model: {
                  database: 'telegraf',
                  measurement: usageKeys[1],
                  select: [
                    [
                      {
                        type: 'field',
                        params: [usageKeys[0], 'vm_name', 'vm_ip'],
                      },
                      { type: 'mean' },
                      { type: 'abs' },
                    ],
                  ],
                  tags: [
                    {
                      key: this.groupInput(),
                      operator: '!=',
                      value: '',
                    },
                    ...brandTags,
                    ...rangeTags,
                  ],
                  group_by: this.groupBy(usageKeys[0]),
                },
              },
            ],
            scope: this.scope,
            from: `${min}m`,
            interval: `${min}m`,
            unit: true,
          }
        }
        if (condition && condition.length > 0) {
          // ret += ` AND ${condition}`
          ret.metric_query[0].model.tags.push(condition)
        }
        return ret
      } else if (this.brandEnvs.includes('idc') || this.brandEnvs.includes('private')) {
        if (fd.resType === 'server') {
          // ret = `SELECT ${fd.order}("${usageKeys[0]}", "vm_name", "vm_ip", ${fd.limit}) FROM "telegraf"."30day_only"."${usageKeys[1]}" WHERE time > now() - ${min}m AND "${brandKey}"='${brand}'`
          ret = {
            metric_query: [
              {
                model: {
                  database: 'telegraf',
                  measurement: usageKeys[1],
                  select: [
                    [
                      {
                        type: 'field',
                        params: [usageKeys[0], 'vm_name', 'vm_ip'],
                      },
                      { type: 'mean' },
                      { type: 'abs' },
                    ],
                  ],
                  tags: [
                    {
                      key: this.groupInput(),
                      operator: '!=',
                      value: '',
                    },
                    ...brandTags,
                    ...rangeTags,
                  ],
                  group_by: this.groupBy(usageKeys[0]),
                },
              },
            ],
            scope: this.scope,
            from: `${min}m`,
            interval: `${min}m`,
            unit: true,
          }
        }
        if (fd.resType === 'host') {
          // ret = `SELECT ${fd.order}("${usageKeys[0]}", ${fd.limit}) FROM "${usageKeys[1]}" WHERE "res_type" = 'host' AND time > now() - ${min}m AND "${brandKey}" = '${brand}' GROUP BY "host"`
          ret = {
            metric_query: [
              {
                model: {
                  database: 'telegraf',
                  measurement: usageKeys[1],
                  select: [
                    [
                      {
                        type: 'field',
                        params: [usageKeys[0], 'host', 'host_ip'],
                      },
                      { type: 'mean' },
                      { type: 'abs' },
                    ],
                  ],
                  tags: [
                    {
                      key: this.groupInput(),
                      operator: '!=',
                      value: '',
                    },
                    ...brandTags,
                    ...rangeTags,
                  ],
                  group_by: this.groupBy(usageKeys[0]),
                },
              },
            ],
            scope: this.scope,
            from: `${min}m`,
            interval: `${min}m`,
            unit: true,
          }
        }
        if (condition) {
          ret.metric_query[0].model.tags.push(condition)
          // ret += ` AND ${condition}`
        }
        return ret
      } else {
        if (fd.resType === 'server') {
          ret = {
            metric_query: [
              {
                model: {
                  database: 'telegraf',
                  measurement: usageKeys[1],
                  select: [
                    [
                      {
                        type: 'field',
                        params: [usageKeys[0], 'vm_name', 'vm_ip'],
                      },
                      { type: 'mean' },
                      { type: 'abs' },
                    ],
                  ],
                  tags: [
                    {
                      key: this.groupInput(),
                      operator: '!=',
                      value: '',
                    },
                    ...rangeTags,
                  ],
                  group_by: this.groupBy(usageKeys[0]),
                },
              },
            ],
            scope: this.scope,
            from: `${min}m`,
            unit: true,
            interval: `${min}m`,
          }
        }
        if (fd.resType === 'host') {
          ret = {
            metric_query: [
              {
                model: {
                  database: 'telegraf',
                  measurement: usageKeys[1],
                  select: [
                    [
                      {
                        type: 'field',
                        params: [usageKeys[0], 'host', 'host_ip'],
                      },
                      { type: 'mean' },
                      { type: 'abs' },
                    ],
                  ],
                  tags: [
                    {
                      key: this.groupInput(),
                      operator: '!=',
                      value: '',
                    },
                    ...rangeTags,
                  ],
                  group_by: this.groupBy(usageKeys[0]),
                },
              },
            ],
            scope: this.scope,
            from: `${min}m`,
            unit: true,
            interval: `${min}m`,
          }
        }
        if (condition && condition.length > 0) {
          // ret += ` AND ${condition}`
          ret.metric_query[0].model.tags.push(condition)
        }
        return ret
      }
    },
    getLabel (val) {
      const fixedVal = isNaN(Number(val)) ? 0 : Number(val).toFixed(2)
      const formatter = usageConfig[this.fd.usage] && usageConfig[this.fd.usage].formatter
      if (formatter) return formatter(fixedVal)
      return fixedVal
    },
    getPercent (val) {
      const num = (val / this.maxSeriesData).toFixed(2) * 100
      return Number.isFinite(num) ? num : 0
    },
    getDomainOrProjectQuery () {
      if (this.isProjectMode) {
        // return `"tenant_id" = '${this.userInfo.projectId}'`
        return {
          key: 'tenant_id',
          value: this.userInfo.projectId,
          operator: '=',
        }
      } else if (this.isDomainMode) {
        // return `"domain_id" = '${this.userInfo.projectDomainId}'`
        return {
          key: 'domain_id',
          value: this.userInfo.projectDomainId,
          operator: '=',
        }
      }
      return null
    },
    groupInput () {
      if (this.fd.resType === 'host') {
        return 'project_domain'
      }
      switch (this.dimension.scope) {
        case 'system':
          return 'project_domain'
        default:
          return 'tenant'
      }
    },
    groupBy (field) {
      const ret = []

      if (this.dimension.name === 'tenant') {
        ret.push({ type: 'field', params: ['tenant'] })
      } else {
        ret.push({ type: 'field', params: [this.dimension.name] })
        ret.push({ type: 'field', params: [this.dimension.id] })
      }
      return ret
    },
    goPage () {
      this.$router.push('/monitoroverview')
    },
    changeName (resType, usage) {
      let usage_label = ''
      if (resType === 'server') {
        usage_label = serverUsageOptions.find(item => item.key === usage)?.label
      }
      if (resType === 'host') {
        usage_label = hostUsageOptions.find(item => item.key === usage)?.label
      }
      this.fd.name = `${usage_label}TOP5`
    },
  },
}
</script>
