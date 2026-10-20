<template>
  <div>
    <page-header :title="$t('compute.text_892')" />
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form.fd"
        :rules="formRules"
        hideRequiredMark>
        <a-form-model-item class="mb-0" :label="$t('compute.text_297', [$t('dictionary.project')])" prop="project">
          <domain-project :form="form.fd" :labelInValue="false" @update:project="projectChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_228')" prop="generate_name">
          <a-input v-model:value="form.fd.generate_name" :placeholder="$t('validator.serverCreateName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea v-model:value="form.fd.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_176')" prop="brand">
          <a-radio-group v-model:value="form.fd.brand" @change="brandChange">
            <a-radio-button v-for="item in brands" :key="item.brand" :value="item.brand">{{item.label}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_873')" prop="guest_template_id">
          <a-select
            :filterOption="filterOption"
            showSearch
            v-model:value="form.fd.guest_template_id"
            :loading="serverTemplateListLoading"
            @change="(v, option) => handleServerTemplateChange(v, option)">
            <a-select-option v-for="item in serverTemplateList" :row="item" :key="item.id" :value="item.id">{{item.name}}</a-select-option>
          </a-select>
          <template #extra>{{$t('compute.text_894')}}</template>
        </a-form-model-item>
        <network-selects
          isRequired
          :isDefaultFetch="false"
          :defaultActiveFirstOption="false"
          :disabled="networlDisabled"
          ref="NETWORK"
          :label="$t('compute.text_104')"
          :model="form.fd"
          :networkParams="networkParams"
          :vpcParams="vpcParams" />
        <a-form-model-item :label="$t('compute.text_877')" prop="max_instance_number">
          <a-tooltip placement="top" :title="$t('compute.text_895')">
            <a-input-number v-model:value="form.fd.max_instance_number" :min="1" :max="1000" />
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_875')" prop="desire_instance_number">
          <a-tooltip placement="top" :title="$t('compute.text_896')">
            <a-input-number v-model:value="form.fd.desire_instance_number" :min="form.fd.min_instance_number" :max="Math.max(0, form.fd.max_instance_number)" />
          </a-tooltip>
          <template #extra>{{$t('compute.text_897')}}</template>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_876')" prop="min_instance_number">
          <a-tooltip placement="top" :title="$t('compute.text_891')">
            <a-input-number :value="min" @change="handleMinChange" :min="0" :max="Math.max(0, form.fd.desire_instance_number)" />
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_898')" prop="shrink_principle">
          <a-select v-model:value="form.fd.shrink_principle">
            <a-select-option v-for="(v, k) in $t('flexGrouPprinciple')" :key="k" :value="k">{{v}}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item required :label="$t('compute.text_899')">
          <a-radio-group v-model:value="isLoadbalancer">
            <a-radio-button :value="false">{{$t('compute.text_900')}}</a-radio-button>
            <a-tooltip v-if="form.fd.brand === 'Azure'" placement="top" :title="$t('compute.text_901')">
              <a-radio-button :disabled="true" :value="true">{{$t('compute.text_902')}}</a-radio-button>
            </a-tooltip>
            <a-radio-button v-else :value="true">{{$t('compute.text_902')}}</a-radio-button>
          </a-radio-group>
          <div v-if="isLoadbalancer" style="max-width: 920px">
            <bind-lb :model="form.fd" ref="BIND_LB" />
          </div>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_903')" prop="health_check_mode">
          <a-select v-model:value="form.fd.health_check_mode">
            <template v-for="(v, k) in $t('flexGroupHealthCheckMode')" :key="k">
              <a-select-option v-if="k !== 'loadbalancer' || (isLoadbalancer && k === 'loadbalancer')" :value="k">{{v}}</a-select-option>
            </template>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_904')" prop="health_check_cycle">
          <a-select v-model:value="form.fd.health_check_cycle">
            <a-select-option v-for="(v, k) in $t('flexGroupCycles')" :key="k" :value="parseInt(k)">{{v}}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_905')" prop="health_check_gov">
          <a-input-number :min="1" v-model:value="form.fd.health_check_gov" />{{$t('compute.text_767')}}
          <template #extra>{{$t('compute.text_906')}}</template>
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button class="mr-3" type="primary" @click="handleConfirm" :loading="loading">{{$t('compute.text_907')}}</a-button>
        <a-button @click="handleCancel">{{$t('compute.text_908')}}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import { HYPERVISORS_MAP } from '@/constants'
import DomainProject from '@/sections/DomainProject/model'
import NetworkSelects from '@/sections/NetworkSelects/model'
import { typeClouds } from '@/utils/common/hypervisor'
import validateForm from '@/utils/validate'
import { getInitialValue } from '@/utils/common/ant'
import BindLb from '../components/BindLb'
import { SCALING_GROUP_FIELD_MAP, BRANDS, BIND_LB_RULES } from '../constants'

export default {
  name: 'ScalingGroupCreae',
  components: {
    BindLb,
    DomainProject,
    NetworkSelects,
  },
  data () {
    return {
      min: 0,
      BRANDS,
      loading: false,
      isLoadbalancer: false,
      serverTemplateListLoading: false,
      serverTemplateList: [],
      serverTemplate: {},
      healthCheckModeList: [],
      networlDisabled: false,
      form: {
        fd: { ...getInitialValue(SCALING_GROUP_FIELD_MAP) },
        fi: {},
      },
      isDeleteVpc: false,
      isDeleteNetwork: false,
      rules: {
        generate_name: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: validateForm('serverCreateName') },
        ],
        brand: [
          { required: true, message: this.$t('compute.text_882') },
        ],
        guest_template_id: [
          { required: true, message: this.$t('compute.text_878') },
        ],
        vpc: [
          { required: true, message: this.$t('compute.text_194') },
          {
            validator: (rule, value, cb) => {
              if (this.isDeleteVpc) {
                return cb(this.$t('compute.text_909'))
              }
              cb()
            },
          },
        ],
        network: [
          { required: true, message: this.$t('compute.text_195') },
          {
            validator: (rule, value, cb) => {
              if (this.isDeleteNetwork) {
                return cb(this.$t('compute.text_909'))
              }
              cb()
            },
          },
        ],
        max_instance_number: [
          { required: true, message: this.$t('compute.text_880') },
        ],
        desire_instance_number: [
          { required: true, message: this.$t('compute.text_881') },
        ],
        min_instance_number: [
          { required: true, message: this.$t('compute.text_879') },
        ],
        shrink_principle: [
          { required: true, message: this.$t('compute.text_889') },
        ],
        health_check_mode: [
          { required: true, message: this.$t('compute.text_884') },
        ],
        health_check_cycle: [
          { required: true, message: this.$t('compute.text_890') },
        ],
        health_check_gov: [
          { required: true, message: this.$t('compute.text_883') },
        ],
      },
    }
  },
  provide () {
    return {
      form: this.form,
    }
  },
  computed: {
    formRules () {
      return this.isLoadbalancer ? { ...this.rules, ...BIND_LB_RULES } : this.rules
    },
    capabilityBrands () {
      return this.$store.getters.capability.brands
    },
    brands () {
      let supportBrands = BRANDS.filter(brand => {
        return this.capabilityBrands.indexOf(brand) > -1
      })
      supportBrands = [...Object.values(HYPERVISORS_MAP)].filter(item => {
        return supportBrands.includes(item.brand) && item.hypervisor !== HYPERVISORS_MAP.pod.key
      })
      return supportBrands
    },
    project_domain () {
      return this.form.fd.domain ? this.form.fd.domain : this.$store.getters.userInfo.projectDomainId
    },
    project () {
      return this.form.fd.project ? this.form.fd.project : this.$store.getters.userInfo.projectId
    },
    scopeParams () {
      if (this.$store.getters.isAdminMode) {
        return {
          project_domain: this.project_domain,
          tenant: this.form.fd.project,
        }
      }
      return { scope: this.$store.getters.scope }
    },
  },
  watch: {
    isLoadbalancer (v) {
      if (v) {
        this.$nextTick(() => {
          this.$refs.BIND_LB.fetchQueryLbs(this.form.fd.vpc)
        })
      }
      this.form.fd.health_check_mode = v ? 'loadbalancer' : 'normal'
    },
    'form.fd.vpc' () {
      this.vpcChange()
    },
  },
  methods: {
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
    handleMinChange (val) {
      const n = parseInt(val || 0)
      this.min = n
      this.form.fd.min_instance_number = n || undefined
    },
    projectChange () {
      if (this.brands && this.brands.length > 0 && !this.form.fd.brand) {
        this.form.fd.brand = this.brands[0].brand
        this.brandChange()
      }
    },
    vpcChange () {
      if (this.isLoadbalancer) {
        this.$refs.BIND_LB.fetchQueryLbs(this.form.fd.vpc)
      }
    },
    brandChange () {
      const { brand } = this.form.fd
      if (brand === 'Azure') {
        this.isLoadbalancer = false
      }
      this.fetchQueryTs()
    },
    templateChange () {
      this.isDeleteVpc = false
      this.isDeleteNetwork = false
      this.$refs.NETWORK.fetchs(async (rets) => {
        await this.$nextTick()
        const { vpcList, networkList } = rets
        const _vpcId = this.form.fd.vpc
        if (vpcList !== undefined && _vpcId) {
          this.isDeleteVpc = vpcList.length === 0 || !vpcList.find(item => item.id === _vpcId)
          this.$refs.formRef.validateField('vpc')
        }
        const _networkId = this.form.fd.network
        if (networkList !== undefined && _networkId) {
          this.isDeleteNetwork = networkList.length === 0 || !networkList.find(item => item.id === _networkId)
          this.$refs.formRef.validateField('network')
        }
      })
    },
    vpcParams () {
      const { brand } = this.form.fd
      return {
        brand,
        ...this.scopeParams,
        region: this.serverTemplate.region_id,
      }
    },
    networkParams () {
      return {
        ...this.scopeParams,
        zone: this.serverTemplate.zone_id,
      }
    },
    setNetworkValues (row) {
      if (row.config_info && row.config_info.nets && row.config_info.nets.length > 0) {
        const net = row.config_info.nets[0]
        if (net.vpc_id && net.id) {
          this.form.fd.vpc = net.vpc_id
          this.form.fd.network = net.id
          this.networlDisabled = true
          return true
        }
      }
      this.form.fd.vpc = undefined
      this.form.fd.network = undefined
      this.networlDisabled = false
    },
    handleServerTemplateChange (e, option) {
      const row = option?.row || option?.data?.attrs?.row
      if (!row) return
      this.serverTemplate = row
      this.setNetworkValues(row)
      this.form.fd.cloudregion = row.cloudregion_id
      this.templateChange()
    },
    async fetchQueryTs () {
      const manager = new this.$Manager('servertemplates')
      const { brand } = this.form.fd
      this.serverTemplateListLoading = true
      try {
        const { data } = await manager.list({
          params: {
            limit: 0,
            brand,
            filter: 'status.in(ready)',
            ...this.scopeParams,
          },
        })
        if (data.data && data.data.length > 0) {
          const list = data.data
          this.serverTemplateList = list.filter(t => {
            const isNats = t.config_info && t.config_info.nets && t.config_info.nets.length === 1
            return isNats
          })
          this.serverTemplate = this.serverTemplateList[0]
          this.setNetworkValues(this.serverTemplateList[0])
          this.form.fd.cloudregion = this.serverTemplateList[0].cloudregion_id
        } else {
          this.serverTemplateList = []
          this.networlDisabled = false
          this.form.fd.vpc = undefined
          this.form.fd.network = undefined
          this.$refs.NETWORK.networkList = []
          this.$refs.NETWORK.vpcList = []
        }
      } catch (err) {
        throw err
      } finally {
        this.serverTemplateListLoading = false
        const list = this.serverTemplateList
        this.form.fd.guest_template_id = (list && list.length > 0) ? list[0].id : undefined
      }
    },
    formatValues (values) {
      const { brand, network } = values
      if (network) {
        values.networks = [network]
        delete values.network
      }
      if (brand && typeClouds.brandMap[brand]) {
        values.hypervisor = typeClouds.brandMap[brand].hypervisor
      }
      return values
    },
    handleCancel () {
      this.$router.push({
        name: 'ScalingGroup',
      })
    },
    async handleConfirm () {
      const manager = new this.$Manager('scalinggroups', 'v1')
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        this.loading = true
        await manager.create({
          data: Object.assign({}, this.formatValues(values)),
        })
        this.handleCancel()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style>
</style>
