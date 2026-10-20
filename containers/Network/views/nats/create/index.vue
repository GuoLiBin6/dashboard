<template>
  <div>
    <page-header :title="$t('network.create_nat')" />
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form.fd"
        :rules="rules"
        hideRequiredMark>
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.domain')])" v-if="$store.getters.isAdminMode" prop="project_domain">
          <domain-select v-model:value="form.fd.project_domain" @change="handleDomainChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.fd.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <!-- 计费方式 -->
        <clearing-radios :model="form.fd" :auto_renew="false" />
        <a-form-model-item :label="$t('network.expired_release')" v-if="form.fd.billing_type !== 'prepaid'">
          <duration
            :model="form.fd"
            :form="form"
            v-model:durationStandard="form.fd.durationStandard"
            v-model:duration="form.fd.duration" />
        </a-form-model-item>
        <a-form-model-item :label="$t('regionMap.enable_world_map')" prop="enableWorldMap">
          <a-switch v-model:checked="form.fd.enableWorldMap" />
        </a-form-model-item>
        <a-form-model-item v-if="form.fd.enableWorldMap" :label="$t('compute.region_map')">
          <region-map
            :region-filter-params="regionMapParams"
            filter-brand-resource="nat"
            :region-mapper="filterMapCloudregionList"
            split-key="provider"
            @select="onRegionSelect"
            @params-change="onRegionMapParamsChange" />
        </a-form-model-item>
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :model="form.fd"
          :names="areaselectsName"
          :providerParams="providerParams"
          :cloudregionParams="regionParams"
          :provider-multiple="true"
          :cloudregion-multiple="true"
          :cloudregion-mapper="filterCloudregionListByProvider"
          :defaultActiveFirstOption="areaDefaultActiveFirstOption"
          :isRequired="true"
          filterBrandResource="nat"
          @change="handleRegionChange" />
        <!-- 套餐 -->
        <s-k-u ref="REF_SKU" />
        <!-- 网络 -->
        <template>
          <network-selects
            ref="REF_NETWORK"
            :model="form.fd"
            :label="$t('network.text_16')"
            :isDefaultFetch="false"
            :vpcFormat="vpcFormat"
            :vpcParams="vpcParams"
            :networkParams="netParams" />
        </template>
        <template>
          <eip-config
            v-if="resolvedProvider && resolvedProvider !== 'Huawei'"
            ref="eipConfigRef"
            :model="form.fd"

            :eip-params="eipParams"
            :hypervisor="hypervisor"
            :showBind="false"
            :isServertemplate="false"
            :cloud-env="cloudEnv"
            :form="form"
            :hasPublicIp="false" />
        </template>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag
            :value="form.fd.__meta__" @change="v => { form.fd.__meta__ = v }" />
        </a-form-model-item>
      </a-form-model>
      <bottom-bar :values="form.fd" :cloudAccountId="cloudAccountId" />
    </page-body>
  </div>
</template>

<script lang="jsx">
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import Duration from '@Compute/sections/Duration'
import EipConfig from '@Compute/sections/EipConfig'
import RegionMap from '@Compute/sections/RegionMap'
import DomainSelect from '@/sections/DomainSelect'
import NetworkSelects from '@/sections/NetworkSelects/model'
import AreaSelects from '@/sections/AreaSelects/model'
import Tag from '@/sections/Tag'
import { HYPERVISORS_MAP, PROVIDER_MAP, resolveHypervisorKey } from '@/constants'
import { cloudregionFilterByCapability } from '@/utils/common/capability'
import changeMinxin from './changeMinxin'
import BottomBar from './components/BottomBar'
import SKU from './components/SKU'

export default {
  name: 'NatCreate',
  components: {
    DomainSelect,
    Duration,
    AreaSelects,
    RegionMap,
    SKU,
    NetworkSelects,
    EipConfig,
    BottomBar,
    Tag,
  },
  mixins: [changeMinxin],
  data () {
    return {
      loading: false,
      rules: {
        name: [
          { required: true, message: this.$t('network.text_218') },
        ],
        project_domain: [
          { required: true, message: this.$t('rules.domain') },
        ],
      },
      selectedRegionItem: {},
      tailFormItemLayout: {
        wrapperCol: {
          lg: { span: 18, offset: 6 },
          xl: { span: 20, offset: 4 },
          xxl: { span: 21, offset: 3 },
        },
      },
      vpcList: [],
      project_domain: undefined,
      scopeParams: {},
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo', 'capability']),
    areaselectsName () {
      return ['provider', 'cloudregion']
    },
    areaDefaultActiveFirstOption () {
      // 多选也默认选中首项，避免进入页面区域为空导致套餐/VPC 全空
      return true
    },
    cloudEnv () {
      return 'public'
    },
    providers () {
      return this.normalizeAreaValues(this.form.fd.provider)
    },
    selectedCloudregionIds () {
      return this.normalizeAreaValues(this.form.fd.cloudregion)
    },
    hasMultipleAreaSelection () {
      const { provider, cloudregion } = this.form.fd
      const isMultiValue = val => Array.isArray(val) && val.length > 1
      return isMultiValue(provider) || isMultiValue(cloudregion)
    },
    needsSkuForAreaDownstream () {
      return this.hasMultipleAreaSelection && !R.is(Object, this.form.fd.sku)
    },
    resolvedProvider () {
      const sku = this.form.fd.sku
      if (R.is(Object, sku) && sku.provider) return sku.provider
      return this.pickSingleAreaValue(this.form.fd.provider)
    },
    resolvedAreaFilterParams () {
      const sku = this.form.fd.sku
      const fromForm = {
        provider: this.pickSingleAreaValue(this.form.fd.provider),
        cloudregion: this.pickSingleAreaValue(this.form.fd.cloudregion),
      }
      if (R.is(Object, sku)) {
        const skuZones = this.parseSkuZoneIds(sku)
        return {
          provider: sku.provider || fromForm.provider,
          cloudregion: sku.cloudregion_id || fromForm.cloudregion,
          zone: skuZones[0],
          zones: skuZones,
        }
      }
      if (this.hasMultipleAreaSelection) {
        return {}
      }
      return fromForm
    },
    hypervisor () {
      const provider = this.resolvedProvider
      if (provider && PROVIDER_MAP[provider]) {
        return PROVIDER_MAP[provider].hypervisor
      }
      return ''
    },
    cloudAccountId () {
      const currentVpc = this.vpcList.filter(item => item.id === this.form.fd.vpc)
      if (currentVpc[0]) {
        return currentVpc[0].account_id
      }
      return ''
    },
    providerParams () {
      const params = {
        limit: 0,
        enabled: 1,
        scope: this.scope,
        provider: (this.capability.nat_brands || []).filter(v => v !== 'Aws'),
      }
      if (!this.capability.nat_brands || this.capability.nat_brands.length === 0) {
        params.provider = 'Other'
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    regionMapParams () {
      const params = {
        usable: true,
        show_emulated: true,
        ...this.scopeParams,
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    regionParams () {
      const params = {
        usable: true,
        show_emulated: true,
        ...this.scopeParams,
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    vpcParams () {
      const regionIds = this.getVpcNetworkRegionIds()
      if (!regionIds.length) return {}
      const params = { scope: this.scope }
      this.applyCloudregionListParam(params, regionIds)
      return params
    },
    netParams () {
      const regionIds = this.getVpcNetworkRegionIds()
      if (!regionIds.length) return {}
      const params = { scope: this.scope }
      this.applyCloudregionListParam(params, regionIds)
      const { zones: resolvedZones } = this.resolvedAreaFilterParams
      const zones = (resolvedZones && resolvedZones.length)
        ? resolvedZones
        : this.normalizeAreaValues(this.form.fd.zone)
      if (zones && zones.length) {
        params.zones = zones
      }
      return params
    },
    eipParams () {
      const regionIds = this.getVpcNetworkRegionIds()
      if (!regionIds.length) return {}
      const params = {}
      this.applyCloudregionListParam(params, regionIds)
      return params
    },
  },
  watch: {
    // sku 变更后强制同步 VPC 参数依赖，触发 NetworkSelects 拉取
    'form.fd.sku': {
      handler (val) {
        if (R.is(Object, val) && val.cloudregion_id) {
          this.$nextTick(() => this.fetchVpc())
        }
      },
    },
    'form.fd.cloudregion_id' (val) {
      if (val) {
        this.$nextTick(() => this.fetchVpc())
      }
    },
  },
  created () {
    this.initScopeParams()
    this.form.fd.project_domain = this.$store.getters.userInfo.projectDomainId
  },
  methods: {
    initScopeParams () {
      if (this.isAdminMode) {
        this.scopeParams = {
          project_domain: this.project_domain || this.userInfo.projectDomainId,
        }
      } else {
        this.scopeParams = { scope: this.scope }
      }
    },
    pickSingleAreaValue (value) {
      if (Array.isArray(value)) return value[0] || undefined
      return value || undefined
    },
    normalizeAreaValues (value) {
      if (Array.isArray(value)) return value.filter(Boolean)
      return value ? [value] : []
    },
    // VPC/网络/EIP：优先 resolved（套餐），否则用 area-selects 全部已选区域
    getVpcNetworkRegionIds () {
      const { cloudregion: resolvedRegion } = this.resolvedAreaFilterParams
      if (resolvedRegion) return [resolvedRegion]
      return this.normalizeAreaValues(this.form.fd.cloudregion)
    },
    applyCloudregionListParam (params, regionIds = []) {
      if (!regionIds.length) return
      if (regionIds.length === 1) {
        params.cloudregion_id = regionIds[0]
        return
      }
      this.appendSkuFilter(params, `cloudregion_id.in(${regionIds.join(',')})`)
    },
    toAreaValue (value) {
      if (value === undefined || value === null) return []
      return Array.isArray(value) ? value : [value]
    },
    parseSkuZoneIds (sku) {
      if (!sku) return []
      if (Array.isArray(sku.zone_ids)) return sku.zone_ids.filter(Boolean)
      if (typeof sku.zone_ids === 'string' && sku.zone_ids) {
        return sku.zone_ids.split(',').filter(Boolean)
      }
      if (sku.zone_id) return [sku.zone_id]
      return []
    },
    mapAreaProviderFilterValues (providerValues = []) {
      return providerValues.map(p => (
        PROVIDER_MAP[p]
          ? PROVIDER_MAP[p].provider
          : (HYPERVISORS_MAP[String(p).toLowerCase()]?.provider || p)
      ))
    },
    getSelectedProviderNames () {
      return this.providers.map(p => String(p))
    },
    normalizeAreaProviderKey (val) {
      return resolveHypervisorKey(val)
    },
    isAreaProviderMatch (selected, itemProvider) {
      return this.normalizeAreaProviderKey(selected) === this.normalizeAreaProviderKey(itemProvider)
    },
    filterCloudregionListByProvider (list = []) {
      const providers = this.getSelectedProviderNames()
      if (!providers.length) return list
      return list.filter(item => {
        const raw = item.provider || item.brand || ''
        return providers.some(p => this.isAreaProviderMatch(p, raw))
      })
    },
    filterMapCloudregionList (list = []) {
      return cloudregionFilterByCapability({
        dataList: list,
        capability: this.capability,
        resource: 'nat',
      })
    },
    matchProviderFromList (list, hypervisor) {
      const hvKey = String(hypervisor || '').toLowerCase()
      const hvObj = HYPERVISORS_MAP[hvKey]
      if (!hvObj || !list?.length) return null
      const hvProvider = String(hvObj.provider || '').toLowerCase()
      return list.find(item => {
        const name = String(item.name || '').toLowerCase()
        const provider = String(item.provider || '').toLowerCase()
        return name === hvKey || name === hvProvider || provider === hvKey || provider === hvProvider
      }) || null
    },
    syncAreaHiddenFields () {
      const cloudregionIds = this.normalizeAreaValues(this.form.fd.cloudregion)
      this.$set(
        this.form.fd,
        'cloudregion_id',
        cloudregionIds.length === 1 ? cloudregionIds[0] : undefined,
      )
    },
    syncResolvedLocationFields () {
      const { cloudregion } = this.resolvedAreaFilterParams
      if (cloudregion) {
        this.$set(this.form.fd, 'cloudregion_id', cloudregion)
      }
    },
    appendSkuFilter (params, filter) {
      if (!params.filter) {
        params.filter = [filter]
        return
      }
      if (!Array.isArray(params.filter)) {
        params.filter = [params.filter]
      }
      params.filter.push(filter)
    },
    buildSkuFetchParams () {
      // 直接读表单字段，避免 computed form.fd 非响应导致区域一直为空
      const regionIds = this.normalizeAreaValues(this.form.fd.cloudregion)
      if (!regionIds.length) return null
      const params = {
        scope: 'domain',
      }
      if (regionIds.length === 1) {
        params.cloudregion_id = regionIds[0]
      } else {
        this.appendSkuFilter(params, `cloudregion_id.in(${regionIds.join(',')})`)
      }
      if (this.form.fd.billing_type === 'postpaid') {
        params.postpaid_status = 'available'
      } else {
        params.prepaid_status = 'available'
      }
      const providerValues = this.normalizeAreaValues(this.form.fd.provider)
      if (providerValues.length === 1) {
        params.provider = providerValues[0]
      } else if (providerValues.length > 1) {
        const providers = this.mapAreaProviderFilterValues(providerValues)
        this.appendSkuFilter(params, `provider.in(${providers.join(',')})`)
      }
      return params
    },
    refreshSkuByAreaSelection () {
      this.$set(this.form.fd, 'sku', undefined)
      this.$nextTick(() => {
        const params = this.buildSkuFetchParams()
        if (params && this.$refs.REF_SKU) {
          this.$refs.REF_SKU.fetchSkus(params)
        } else if (this.$refs.REF_SKU && this.$refs.REF_SKU.$refs.SKU_LIST) {
          this.$refs.REF_SKU.$refs.SKU_LIST.skuList = []
        }
      })
    },
    clearPublicLocationFields () {
      this.$set(this.form.fd, 'provider', [])
      this.$set(this.form.fd, 'cloudregion', [])
      this.$set(this.form.fd, 'sku', undefined)
      this.$set(this.form.fd, 'cloudregion_id', undefined)
    },
    onRegionSelect (payload) {
      const regions = payload?.nearbyRegions || []
      if (!regions.length) {
        this.clearPublicLocationFields()
        this.$nextTick(() => {
          this.refreshAreaSelects()
        })
        return
      }
      this.applyMapSelectionToAreaSelects(regions)
    },
    onRegionMapParamsChange () {
      if (!this.form.fd.enableWorldMap) return
      this.onRegionSelect({ nearbyRegions: [] })
    },
    refreshAreaSelects () {
      if (!this.$refs.areaSelects) return
      this.$refs.areaSelects.fetchs(this.areaselectsName)
    },
    async applyMapSelectionToAreaSelects (regions = []) {
      const providerList = this.$refs.areaSelects?.providerList || []
      const providerKeys = [...new Set(regions.map(item => {
        const raw = item.provider || item.brand
        if (!raw) return null
        const hvKey = resolveHypervisorKey(raw)
        const matched = this.matchProviderFromList(providerList, hvKey)
        return matched ? matched.name : hvKey
      }).filter(Boolean))]
      const cloudregionIds = regions.map(item => item.id).filter(Boolean)
      this.$set(this.form.fd, 'sku', undefined)
      await this.$nextTick()
      const areaRef = this.$refs.areaSelects
      if (areaRef) {
        await areaRef.applyMultipleSelection({
          provider: this.toAreaValue(providerKeys),
          cloudregion: this.toAreaValue(cloudregionIds),
        })
      }
      this.refreshSkuByAreaSelection()
    },
    vpcFormat (vpc) {
      const { name, manager } = vpc
      return (
        <div class='d-flex'>
          <span class='text-truncate flex-fill mr-2' title={ name }>{ name }</span>
          <span style="color: #8492a6; font-size: 13px">{ this.$t('network.manager', [manager]) }</span>
        </div>
      )
    },
    fetchVpc () {
      const regionIds = this.getVpcNetworkRegionIds()
      if (!regionIds.length) return
      this.$refs.REF_NETWORK && this.$refs.REF_NETWORK.fetchVpc(this.vpcListChange)
    },
    vpcListChange ({ vpcList }) {
      this.vpcList = vpcList
    },
    handleDomainChange (val) {
      this.project_domain = val
      this.initScopeParams()
      this.$refs.areaSelects && this.$refs.areaSelects.fetchs(this.areaselectsName)
    },
    handleRegionChange () {
      this.syncAreaHiddenFields()
      this.refreshSkuByAreaSelection()
    },
  },
}
</script>
