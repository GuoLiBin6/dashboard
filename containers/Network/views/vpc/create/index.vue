<template>
  <div>
    <page-header :title="$t('network.text_723')" :tabs="cloudEnvOptions" v-model:currentTab="cloudEnv" />
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form.fd"
        :rules="rules"
        hideRequiredMark>
        <a-form-model-item v-bind="formItemLayout" :label="$t('network.text_205', [$t('dictionary.domain')])" v-if="$store.getters.isAdminMode" prop="project_domain">
          <domain-select v-model:value="form.fd.project_domain" @change="handleDomainChange" />
        </a-form-model-item>
        <a-form-model-item v-if="isPublic" :label="$t('regionMap.enable_world_map')" v-bind="formItemLayout" prop="enableWorldMap">
          <a-switch v-model:checked="form.fd.enableWorldMap" />
        </a-form-model-item>
        <a-form-model-item v-if="isPublic && form.fd.enableWorldMap" :label="$t('compute.region_map')" v-bind="formItemLayout">
          <region-map
            :region-filter-params="regionMapParams"
            filter-brand-resource="network_manage"
            :region-mapper="filterMapCloudregionList"
            split-key="provider"
            @select="onRegionSelect"
            @params-change="onRegionMapParamsChange" />
        </a-form-model-item>
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :key="`vpc-area-${cloudEnv}`"
          :model="form.fd"
          :wrapperCol="formItemLayout.wrapperCol"
          :labelCol="formItemLayout.labelCol"
          :names="areaselectsName"
          :cloudregionParams="regionParams"
          :providerParams="providerParams"
          :isRequired="true"
          :provider-multiple="isPublic"
          :cloudregion-multiple="isPublic"
          :cloudregionMapper="cloudregionMapper"
          :defaultActiveFirstOption="isPublic ? [] : true"
          v-model:region="regionList"
          filterBrandResource="network_manage"
          @change="handleRegionChange" />
        <a-form-model-item :label="$t('network.text_21')" v-bind="formItemLayout" prop="name">
          <a-input v-model:value="form.fd.name" :placeholder="$t('network.text_684')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" v-bind="formItemLayout" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item v-if="isShowIp" :label="$t('network.vpc.cidr_block.ipv4.label')" v-bind="formItemLayout" :extra="$t('network.text_686')" prop="cidr_block">
          <a-input v-model:value="form.fd.cidr_block" :placeholder="$t('network.text_687')" v-if="cloudEnv !== 'onpremise'" />
          <a-select v-model:value="form.fd.cidr_block" allowClear v-else>
            <a-select-option value="192.168.0.0/16">192.168.0.0/16</a-select-option>
            <a-select-option value="172.16.0.0/12">172.16.0.0/12</a-select-option>
            <a-select-option value="10.0.0.0/8">10.0.0.0/8</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item v-if="isShowIp" :label="$t('network.vpc.cidr_block.ipv6.label')" v-bind="formItemLayout" :extra="$t('network.text_686')" prop="cidr_block6">
          <a-input v-model:value="form.fd.cidr_block6" :placeholder="$t('network.vpc.prefix6.prompt')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.external_access_mode_label')" v-if="cloudEnv === 'public' || cloudEnv === 'onpremise'" v-bind="formItemLayout" prop="external_access_mode">
          <a-switch v-model:checked="form.fd.external_access_mode" :disabled="!isAws && cloudEnv !== 'onpremise'" />
          <template v-slot:extra>{{ $t('network.external_access_mode_extra') }}</template>
        </a-form-model-item>
        <template v-if="cloudEnv === 'public' || cloudEnv === 'private'">
          <a-form-model-item :label="$t('compute.text_15')" required v-bind="formItemLayout" v-show="cloudEnv === 'public' || cloudEnv === 'private'" prop="cloudprovider">
            <base-select
              class="w-50"
              v-model:value="form.fd.cloudprovider"
              resource="cloudproviders"
              :params="cloudproviderParams"
              :isDefaultSelect="true"
              :needParams="true"
              :showSync="true"
              :select-props="{ placeholder: $t('compute.text_149') }"
              v-model:resList="cloudproviderData"
              @change="handleProviderChange" />
          </a-form-model-item>
        </template>
        <a-form-model-item v-if="isGoogle" :label="$t('network.text_242')" v-bind="formItemLayout" prop="globalvpc_id">
          <base-select
              class="w-50"
              v-model:value="form.fd.globalvpc_id"
              resource="globalvpcs"
              :params="globalvpcParams"
              :isDefaultSelect="true"
              :needParams="true"
              :showSync="true"
              :select-props="{ placeholder: $t('compute.text_149') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" v-bind="formItemLayout" prop="__meta__">
          <tag
            :value="form.fd.__meta__" @change="v => { form.fd.__meta__ = v }" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <template #right>
        <a-button class="ml-3 float-right" @click="() => $router.back()">{{$t('common.cancel')}}</a-button>
        <a-button class="float-right" type="primary" @click="handleConfirm" :loading="loading">{{ $t('common_258') }}</a-button>
      </template>
    </page-footer>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import RegionMap from '@Compute/sections/RegionMap'
import validateForm, { REGEXP } from '@/utils/validate'
import AreaSelects from '@/sections/AreaSelects/model'
import DomainSelect from '@/sections/DomainSelect'
import { getCloudEnvOptions } from '@/utils/common/hypervisor'
import { cloudregionFilterByCapability } from '@/utils/common/capability'
import Tag from '@/sections/Tag'
import { HYPERVISORS_MAP, PROVIDER_MAP, resolveHypervisorKey } from '@/constants'

const { networkSegment, networkSegment6 } = REGEXP

export default {
  name: 'VPCCreate',
  components: {
    AreaSelects,
    RegionMap,
    DomainSelect,
    Tag,
  },
  data () {
    const cloudEnvOptions = getCloudEnvOptions('network_manage_brands', true)
    const queryType = this.$route.query.type
    let cloudEnv = queryType === 'idc' ? 'onpremise' : this.$route.query.type
    let routerQuery = this.$route.query.type
    if (!cloudEnvOptions.find(val => val.key === cloudEnv)) {
      cloudEnv = cloudEnvOptions[0].key
      routerQuery = cloudEnv === 'onpremise' ? 'idc' : cloudEnv
    }
    return {
      loading: false,
      isGoogle: false,
      isAws: false,
      cloudEnvOptions,
      cloudEnv,
      routerQuery,
      form: {
        fd: {
          enableWorldMap: false,
          project_domain: this.$store.getters.userInfo.projectDomainId,
          name: undefined,
          description: undefined,
          cloudprovider: undefined,
          globalvpc_id: undefined,
          cidr_block: undefined,
          cidr_block6: undefined,
          external_access_mode: true,
          __meta__: undefined,
          provider: undefined,
          cloudregion: undefined,
        },
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_688') },
          { validator: this.$validate('broadName') },
        ],
        cloudprovider: [
          { required: true, message: this.$t('network.text_689') },
        ],
        globalvpc_id: [
          { required: true },
        ],
        cidr_block: [
          { validator: this.validatePublicIpPrefix4, trigger: 'blur' },
        ],
        cidr_block6: [
          { validator: this.validatePublicIpPrefix6, trigger: 'blur' },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 17 },
          xl: { span: 19 },
          xxl: { span: 21 },
        },
        labelCol: {
          md: { span: 7 },
          xl: { span: 5 },
          xxl: { span: 3 },
        },
      },
      project_domain: this.$store.getters.userInfo.projectDomainId,
      cloudproviderData: [],
      cloudregion: '',
      regionList: {},
      cloudprovider: '',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo', 'capability']),
    isPublic () {
      return this.cloudEnv === 'public'
    },
    cloudproviderParams () {
      const regionIds = this.normalizeAreaValues(
        this.form.fd.cloudregion || this.cloudregion,
      )
      if (!regionIds.length) {
        return {}
      }
      const brands = this.normalizeAreaValues(this.form.fd.provider)
        .map(p => this.mapAreaProviderToBrand(p))
        .filter(Boolean)
      const params = {
        limit: 0,
        enabled: 1,
        details: true,
        scope: this.scope,
        read_only: false,
      }
      if (regionIds.length) {
        params.cloudregion_id = regionIds
      }
      if (brands.length) {
        params.brand = brands
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.project_domain
        delete params.scope
        delete params.domain_id
      }
      return params
    },
    globalvpcParams () {
      const params = {
        scope: this.scope,
        limit: 0,
        details: true,
      }
      if (this.cloudprovider) {
        params.manager_id = this.cloudprovider
      }
      return params
    },
    providerParams () {
      const ret = {
        usable: false,
        cloud_env: this.cloudEnv,
      }
      if (this.isAdminMode) {
        ret.project_domain = this.project_domain
      }
      return ret
    },
    regionParams () {
      const res = {
        cloud_env: this.cloudEnv,
        usable: false,
        status: 'inservice',
      }
      if (this.cloudEnv === 'idc') {
        if (this.isAdminMode) {
          return {
            show_emulated: true,
            project_domain: this.project_domain,
          }
        }
        return {
          show_emulated: true,
        }
      } else if (this.cloudEnv === 'public') {
        if (this.isAdminMode) {
          res.project_domain = this.project_domain
        }
      }
      return res
    },
    areaselectsName () {
      if (this.cloudEnv === 'private' || this.cloudEnv === 'onpremise') {
        return ['cloudregion']
      }
      return ['provider', 'cloudregion']
    },
    regionMapParams () {
      const params = {
        cloud_env: 'public',
        usable: false,
        status: 'inservice',
      }
      if (this.isAdminMode) {
        params.project_domain = this.project_domain
      } else {
        params.scope = this.scope
      }
      return params
    },
    currentCloudregion () {
      return this.regionList[this.cloudregion]
    },
    isHCSO () {
      if (this.currentCloudregion) {
        return this.currentCloudregion.provider === HYPERVISORS_MAP.hcso.provider
      }
      return false
    },
    isHCS () {
      if (this.currentCloudregion) {
        return this.currentCloudregion.provider === HYPERVISORS_MAP.hcs.provider
      }
      return false
    },
    isShowIp () {
      if (this.currentCloudregion && this.currentCloudregion.provider === HYPERVISORS_MAP.zettakit.provider) {
        return false
      }
      return true
    },
  },
  watch: {
    cloudEnv () {
      this.cloudregion = ''
      this.cloudprovider = ''
      this.isGoogle = false
      this.isAws = false
      const isPublic = this.cloudEnv === 'public'
      this.form.fd.provider = isPublic ? [] : undefined
      this.form.fd.cloudregion = isPublic ? [] : undefined
      this.form.fd.cloudprovider = undefined
      this.form.fd.enableWorldMap = false
      this.cloudproviderData = []
      this.regionList = {}
      this.$nextTick(() => {
        this.$refs.areaSelects && this.$refs.areaSelects.fetchs(this.areaselectsName)
      })
    },
    'form.fd.cloudregion' (val) {
      const regionId = this.pickSingleAreaValue(val)
      this.cloudregion = regionId || ''
    },
  },
  provide () {
    return {
      form: this.form,
    }
  },
  methods: {
    validatePublicIpPrefix4 (rule, value, callback) {
      if (value) {
        if (!networkSegment.regexp.test(value)) {
          callback(new Error(networkSegment.message))
          return
        }
        const maskNum = (value && value.split('/').length > 1) ? value.split('/')[1] : null
        const min = 8
        const max = 24
        if (maskNum < min || maskNum > max) {
          callback(new Error(this.$t('network.ipaddr.mask.error', [min, max])))
          return
        }
      } else if (!this.form.fd.cidr_block6) {
        callback(new Error(this.$t('network.cidr_block.empty.error')))
        return
      }
      callback()
    },
    validatePublicIpPrefix6 (rule, value, callback) {
      if (value) {
        if (!networkSegment6.regexp.test(value)) {
          callback(new Error(networkSegment6.message))
          return
        }
        const maskNum = (value && value.split('/').length > 1) ? value.split('/')[1] : null
        const min = 48
        const max = 64
        if (maskNum < min || maskNum > max) {
          callback(new Error(this.$t('network.ipaddr.mask.error', [min, max])))
          return
        }
        if (!value.toLowerCase().startsWith('fd')) {
          callback(new Error(this.$t('network.ipv6.private_prefix.error')))
          return
        }
      } else if (!this.form.fd.cidr_block) {
        callback(new Error(this.$t('network.cidr_block.empty.error')))
        return
      }
      callback()
    },
    handleRegionChange (data) {
      const regionPayload = data.cloudregion
      if (R.isEmpty(regionPayload) || R.isNil(regionPayload)) return
      const value = regionPayload.value
      const item = Array.isArray(value) ? value[0] : value
      if (!item?.provider) return
      const provider = String(item.provider).toLowerCase()
      this.isGoogle = provider === 'google'
      this.isAws = provider === 'aws'
    },
    handleProviderChange (data) {
      this.cloudprovider = data
      const item = (this.cloudproviderData || []).find(i => i.id === data)
      if (!item) return
      const provider = String(item.provider || '').toLowerCase()
      this.isGoogle = provider === 'google'
      this.isAws = provider === 'aws'
    },
    /** 公有云：云订阅无区域；provider 取订阅 provider，region 取已选中匹配该 provider 的第一项 */
    resolvePublicSubmitLocation (values) {
      const regionIds = this.normalizeAreaValues(values.cloudregion)
      const managerId = values.cloudprovider
      if (!this.isPublic || !managerId) {
        return {
          cloudregionId: this.pickSingleAreaValue(values.cloudregion),
          provider: this.pickSingleAreaValue(values.provider),
        }
      }
      const cloudproviderItem = (this.cloudproviderData || []).find(i => i.id === managerId)
      const subscriptionProvider = cloudproviderItem?.provider
      let cloudregionId = this.pickSingleAreaValue(values.cloudregion)
      if (subscriptionProvider && regionIds.length) {
        const matched = regionIds.find((regionId) => {
          const region = this.regionList[regionId]
          if (!region) return false
          return this.isAreaProviderMatch(subscriptionProvider, region.provider || region.brand)
        })
        cloudregionId = matched || regionIds[0]
      }
      return {
        cloudregionId,
        provider: subscriptionProvider || this.pickSingleAreaValue(values.provider),
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
    toAreaValue (value) {
      if (value === undefined || value === null) return []
      return Array.isArray(value) ? value : [value]
    },
    mapAreaProviderToBrand (value) {
      if (!value) return undefined
      if (PROVIDER_MAP[value]) {
        return PROVIDER_MAP[value].brand || PROVIDER_MAP[value].provider
      }
      const hv = HYPERVISORS_MAP[String(value).toLowerCase()]
      if (hv) {
        return hv.brand || hv.provider
      }
      return value
    },
    getSelectedProviderNames () {
      return this.normalizeAreaValues(this.form.fd.provider).map(p => String(p))
    },
    normalizeAreaProviderKey (val) {
      return resolveHypervisorKey(val)
    },
    isAreaProviderMatch (selected, itemProvider) {
      return this.normalizeAreaProviderKey(selected) === this.normalizeAreaProviderKey(itemProvider)
    },
    filterCloudregionListByProvider (list = []) {
      if (!this.isPublic) return list
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
        resource: 'network_manage',
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
    clearPublicLocationFields () {
      this.form.fd.provider = []
      this.form.fd.cloudregion = []
      this.form.fd.cloudprovider = undefined
      this.cloudregion = ''
      this.cloudprovider = ''
      this.isGoogle = false
      this.isAws = false
    },
    onRegionSelect (payload) {
      const regions = payload?.nearbyRegions || []
      if (!regions.length) {
        this.clearPublicLocationFields()
        this.$nextTick(() => {
          this.$refs.areaSelects && this.$refs.areaSelects.fetchs(this.areaselectsName)
        })
        return
      }
      this.applyMapSelectionToAreaSelects(regions)
    },
    onRegionMapParamsChange () {
      if (!this.form.fd.enableWorldMap) return
      this.onRegionSelect({ nearbyRegions: [] })
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
      this.form.fd.cloudprovider = undefined
      this.cloudprovider = ''
      await this.$nextTick()
      const areaRef = this.$refs.areaSelects
      if (areaRef) {
        await areaRef.applyMultipleSelection({
          provider: this.toAreaValue(providerKeys),
          cloudregion: this.toAreaValue(cloudregionIds),
        })
      }
    },
    cloudregionMapper (data) {
      let list = data
      if (this.cloudEnv === 'private') {
        list = list.filter(item => item.provider !== 'ZStack')
      }
      return this.filterCloudregionListByProvider(list)
    },
    handleDomainChange (val) {
      this.project_domain = val
      this.form.fd.project_domain = val
      this.$refs.areaSelects.fetchs(this.areaselectsName)
    },
    doCreate (data) {
      return new this.$Manager('vpcs').create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        let cloudregionId = this.pickSingleAreaValue(values.cloudregion)
        let provider = this.pickSingleAreaValue(values.provider)
        if (this.isPublic) {
          const resolved = this.resolvePublicSubmitLocation(values)
          cloudregionId = resolved.cloudregionId
          provider = resolved.provider
        }
        let params = {}
        if (cloudregionId) {
          params = {
            cloudregion_id: cloudregionId,
            manager: values.cloudprovider,
            name: values.name,
            description: values.description,
          }
        } else {
          params = {
            cloudregion_id: cloudregionId,
            name: values.name,
            description: values.description,
          }
        }
        if (this.isPublic && provider) {
          params.provider = provider
        }
        if (values.cidr_block) {
          params.cidr_block = values.cidr_block
        }
        if (values.cidr_block6) {
          params.cidr_block6 = values.cidr_block6.toLowerCase()
        }
        if (this.isGoogle) {
          params.globalvpc_id = values.globalvpc_id
        }
        if (values.project_domain) {
          params.project_domain = values.project_domain
        }
        params.__meta__ = values.__meta__
        if (this.cloudEnv === 'public') {
          params.external_access_mode = values.external_access_mode ? 'eip' : 'none'
        } else if (this.cloudEnv === 'onpremise') {
          params.external_access_mode = values.external_access_mode ? 'eip-distgw' : 'none'
        }
        await this.doCreate(params)
        this.loading = false
        this.$message.success(this.$t('k8s.text_184'))
        this.$router.push('/vpc')
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
