<template>
  <div>
    <page-header :title="$t('k8s.text_146')" />
    <a-alert :showIcon="true" type="info" banner class="mt-2">
      <template #message>
        <div>
          <p>{{$t('k8s.text_147')}}</p>
          <p>{{$t('k8s.text_148')}}</p>
          <p>{{$t('k8s.text_149')}}</p>
        </div>
      </template>
    </a-alert>
    <a-alert :showIcon="true" type="error" v-if="!preCheckResp.pass">
      <template #message v-if="showDocsLink()">
        <div>
          {{$t('k8s.provider_image_not_prepared')}}
          <help-link :href="docs[provider.hypervisor]">{{$t('k8s.ref_prepare_doc')}}</help-link>
        </div>
      </template>
    </a-alert>
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form.fd"
        :rules="rules"
        hideRequiredMark>
        <a-form-model-item
          :label="$t('k8s.text_412')"
          prop="project_domain_id">
          <base-select
            v-if="$store.getters.isAdminMode"
            v-model:value="form.fd.project_domain_id"
            @change="domainChange"
            resource="domains"
            version="v1"
            :params="params.domain"
            is-default-select
            filterable />
          <div v-else>{{ $store.getters.userInfo.projectDomain }}</div>
        </a-form-model-item>
        <a-form-model-item
          :label="$t('k8s.platform')"
          prop="provider">
          <a-radio-group
            v-model:value="form.fd.provider"
            v-if="providers.length"
            @change="providerChange">
            <a-radio-button v-for="item in providers" :key="item.value" :value="item">
              {{ item.label }}
            </a-radio-button>
          </a-radio-group>
          <div v-else>{{ $t('common_467') }}</div>
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.region')" class="mb-0" v-if="provider.brand">
          <cloudregion-vpc
            ref="cloudregionVpcRef"
            :model="form.fd"
            :cloudregion-params="cloudregionParams"
            :vpc-params="params.vpcParams"
            @regionChange="onRegionChange"
            @vpcChange="onVpcChange" />
        </a-form-model-item>
        <a-form-model-item
          :label="$t('k8s.text_41')"
          prop="name">
          <a-input v-model:value="form.fd.name" :placeholder="$t('validator.serverName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_152')" v-if="cloudregionId">
          <server-config
            ref="serverConfigRef"
            :form="form"
            :model="form.fd"
            :cloudregionId="cloudregionId"
            :hypervisor="hypervisor"
            :platform="platform"
            :networkParams="params.network" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_153')" prop="version">
          <base-select
            v-model:value="form.fd.version"
            :options="k8sVersionOps"
            :filterable="true"
            :select-props="{ placeholder: $t('k8s.text_154') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_158')">
          <a-switch :checkedChildren="$t('k8s.text_156')" :unCheckedChildren="$t('k8s.text_157')" v-model:checked="isConfigImage" @change="isConfigImageChange" />
        </a-form-model-item>
        <a-form-model-item
          v-if="isConfigImage"
          :label="$t('k8s.text_52')"
          prop="image_repository_url"
          :extra="$t('k8s.text_159')">
          <a-input v-model:value="form.fd.image_repository_url" :placeholder="$t('k8s.text_160')" />
        </a-form-model-item>
        <a-form-model-item v-if="isConfigImage" :wrapper-col="{ span: 20, offset: 3 }">
          <a-checkbox v-model:checked="form.fd.image_repository_insecure">{{$t('k8s.text_161')}}</a-checkbox>
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button class="mr-2" type="primary" @click="handleConfirm" :loading="loading">{{$t('common.create')}}</a-button>
        <a-button @click="cancel">{{ $t('dialog.cancel') }}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
/* import * as R from 'ramda' */
import { mapGetters } from 'vuex'
import ServerConfig from '@K8S/sections/serverConfig'
import { HYPERVISORS_MAP } from '@/constants'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import CloudregionVpc from '@/sections/CloudregionVpc'
import { expandBracketFd } from '@/utils/bracketModel'
import { findPlatform } from '@/utils/common/hypervisor'
import { KUBE_PROVIDER, K8S_HYPERVISORS_MAP } from '../constants'

export default {
  name: 'ClusterCreate',
  components: {
    CloudregionVpc,
    ServerConfig,
  },
  data () {
    return {
      showDocsLink,
      loading: false,
      providers: [],
      provider: {},
      cloudregionId: '',
      capability: {},
      preCheckResp: {
        pass: true,
      },
      docs: DOCS_MAP.cluster(),
      form: {
        fi: {},
        fd: {
          project_domain_id: this.$store.getters.projectDomainId,
          provider: undefined,
          name: '',
          version: undefined,
          image_repository_url: '',
          image_repository_insecure: true,
        },
      },
      isConfigImage: false,
      params: {
        vpcParams: {
          usable: true,
          show_emulated: true,
          order_by: 'created_at',
          order: 'asc',
          scope: this.scope,
          'filter.0': 'external_access_mode.in(eip,eip-distgw)',
        },
        network: {},
        k8sVersions: () => {
          return {
            provider: this.hypervisor || KUBE_PROVIDER,
            resource_type: 'guest',
          }
        },
        domain: {
          scope: this.$store.getters.scope,
          limit: 0,
        },
      },
      k8sVersionOps: [],
    }
  },
  provide () {
    return {
      form: this.form,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'scope', 'isAdminMode', 'isDomainMode']),
    rules () {
      const rules = {
        project_domain_id: [
          { required: true, message: this.$t('k8s.text_413') },
        ],
        provider: [
          { required: true, message: this.$t('k8s.text_164') },
        ],
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { validator: this.$validate('serverName') },
        ],
      }
      if (this.isConfigImage) {
        rules.image_repository_url = [
          { required: true, message: this.$t('k8s.text_53') },
        ]
      }
      return rules
    },
    cloudregionParams () {
      const provider = this.provider
      /* const type = findPlatform(provider, 'hypervisor') */
      const param = {
        usable: true,
        usable_vpc: true,
        project_domain: this.form.fd.project_domain_id,
        brand: provider.brand,
      }
      /*
       * switch (type) {
       *   case 'idc':
       *     param = { cloud_env: 'onpremise' }
       *     break
       *   case 'public':
       *     param = { cloud_env: 'public' }
       *     break
       *   case 'private':
       *     param = { cloud_env: 'private', show_emulated: true }
       *     break
       *   default :
       *     param = { is_on_premise: true }
       * }
       */
      return param
    },
    hypervisor () {
      return this.provider.hypervisor
    },
    platform () {
      return findPlatform(this.hypervisor, 'hypervisor')
    },
  },
  created () {
    this.clustersM = new this.$Manager('kubeclusters', 'v1')
    this.isDomainMode && this.fetchCapability(this.userInfo.projectDomainId)
  },
  methods: {
    onRegionChange (payload) {
      if (payload?.key) this.cloudregionId = payload.key
    },
    onVpcChange (vpcId) {
      if (!vpcId) return
      this.params.network = {
        vpc: vpcId,
        filter: 'server_type.notin(ipmi, pxe)',
        scope: this.scope,
      }
    },
    /*
     * async fetchCapability (id, resource) {
     *   const params = {
     *     show_emulated: true,
     *     resource_type: 'shared',
     *     scope: this.scope,
     *   }
     *   const capabilityParams = { id, spec: 'capability', params }
     *   if (!id) return
     *   this.capabilityParams = capabilityParams
     *   try {
     *     const { data } = await new this.$Manager(`${resource}s`).getSpecific(this.capabilityParams)
     *     let hypervisors = R.is(Object, data) ? (data.hypervisors || []) : []
     *     if (hypervisors.includes(HYPERVISORS_MAP.kvm.key)) { // kvm 排序为第一个
     *       hypervisors = [HYPERVISORS_MAP.kvm.key].concat(hypervisors).filter(val => val !== 'baremetal')
     *     }
     *     hypervisors = Array.from(new Set(hypervisors))
     *     this.form.fi.hypervisors = hypervisors
     *     this.form.fi.capability = data
     *   } catch (error) {
     *     throw error
     *   }
     * },
     */
    domainChange (val) {
      this.form.fd.project_domain_id = val
      this.fetchCapability(val)
    },
    fetchCapability (domainId) {
      new this.$Manager('capabilities', 'v2').list({
        params: {
          domain: domainId,
          scope: this.scope,
        },
      }).then(({ data }) => {
        this.capability = data.data[0]
        this.updateProviders(this.capability)
      })
    },
    updateProviders (capability) {
      const brands = capability.brands || []
      const providers = Object.entries(K8S_HYPERVISORS_MAP).filter(item => {
        const itemProvider = item[1].provider
        return brands.includes(itemProvider)
      }).map(item => item[1])
      this.providers = providers
      if (this.providers.length > 0) {
        // set default provider
        this.provider = this.providers[0]
        this.form.fd.provider = this.provider
        this.preCheckK8sProvider(this.provider)
      }
    },
    providerChange (e) {
      this.provider = e?.target ? e.target.value : (e || this.form.fd.provider)
      this.form.fd.provider = this.provider
      this.cloudregionId = ''
      this.preCheckK8sProvider(this.provider)
      /*
       * const type = findPlatform(provider, 'hypervisor')
       * let param = {
       *   usable: true,
       *   project_domain: this.form.fd.project_domain_id,
       *   brand: provider.brand,
       * }
       * switch (type) {
       *   case 'idc':
       *     param = { cloud_env: 'onpremise' }
       *     break
       *   case 'public':
       *     param = { cloud_env: 'public' }
       *     break
       *   case 'private':
       *     param = { cloud_env: 'private', show_emulated: true }
       *     break
       *   default :
       *     param = { is_on_premise: true }
       * }
       * this.params.cloudregion = {
       *   ...this.params.cloudregion,
       *   ...param,
       * }
       */
    },
    preCheckK8sProvider (provider) {
      this.clustersM.performAction({
        id: 'pre-check',
        action: '',
        data: {
          provider: this.provider.hypervisor,
          resource_type: 'guest',
        },
      }).then(({ data }) => {
        this.preCheckResp = data
        this.fetchK8sVersions()
      })
    },
    fetchK8sVersions () {
      new this.$Manager('kubeclusters/k8s-versions', 'v1').list({
        params: this.params.k8sVersions(),
      }).then(({ data }) => {
        this.k8sVersionOps = data.map(item => ({ key: item, label: item }))
        this.form.fd.version = data[0]
      })
    },
    isConfigImageChange (val) {
      this.isConfigImage = val
    },
    validator (type) {
      return (rule, value, _callback) => {
        if (type === 'vcpu_count') {
          if (value < 4 || value > 32) {
            return _callback(this.$t('k8s.text_172'))
          }
        } else if (type === 'vmem_size') {
          if (value < 4 || value > 128) {
            return _callback(this.$t('k8s.text_173'))
          }
        } else if (type === 'disk') {
          if (value < 1 || value > 500) {
            return _callback(this.$t('k8s.text_174'))
          }
        }
        return _callback()
      }
    },
    k8sVersionsLabelFormat (val) {
      return val.model
    },
    doCreate (data) {
      return new this.$Manager('kubeclusters', 'v1').create({
        data,
      })
    },
    genData (data) {
      const { provider, version: k8sVersion, name, vpc, cloudregion, sku } = data
      const hypervisor = provider.hypervisor
      const values = {
        project_domain_id: data.project_domain_id,
        version: k8sVersion,
        machines: [],
        name,
        resource_type: 'guest',
        cloudregion_id: cloudregion.key,
        vpc_id: vpc.key,
      }
      if (data.image_repository_url) {
        values.image_repository = {}
        values.image_repository.url = data.image_repository_url
      }
      if (data.image_repository_insecure) values.image_repository.insecure = data.image_repository_insecure
      Object.keys(data.sku).map(key => {
        const disks = [{
          index: 0,
          size: data.systemDiskSize[key] * 1024,
          backend: data.systemDiskType[key].key,
        }]
        if (data.systemDiskSchedtag) {
          if (data.systemDiskSchedtag[key] && data.systemDiskPolicy[key]) {
            disks[0].schedtags = [{ id: data.systemDiskSchedtag[key], strategy: data.systemDiskPolicy[key] }]
          }
        }
        if (hypervisor === HYPERVISORS_MAP.kvm.key || hypervisor === HYPERVISORS_MAP.cloudpods.key) {
          const backend = disks[0].backend
          disks[0].backend = backend.split('/')[0]
          disks[0].medium = backend.split('/')[1]
        }
        if (data.image && data.image[key]) {
          disks[0].image_id = data.image[key].key
        }
        const machinesItem = {
          vm: {
            /* vcpu_count: data.vcpu_count[key], */
            /* vmem_size: data.vmem_size[key] * 1024, */
            instance_type: sku[key].name,
            hypervisor,
            disks,
            nets: [{ network: data.network[key] }],
          },
        }
        if (data.ip && data.ip[key]) machinesItem.vm.nets[0].address = data.ip[key]
        if (data.num[key] > 1) {
          for (let i = 0; i < data.num[key]; i++) {
            values.machines.push({ config: machinesItem, role: data.role[key], resource_type: 'vm' })
          }
        } else {
          values.machines.push({ config: machinesItem, role: data.role[key], resource_type: 'vm' })
        }
      })
      return values
    },
    async handleConfirm () {
      if (!this.providers || !this.providers.length) {
        this.$message.error(this.$t('common_468'))
        return
      }
      try {
        await this.$refs.formRef.validate()
        if (typeof this.$refs.cloudregionVpcRef?.validate === 'function') {
          await this.$refs.cloudregionVpcRef.validate()
        }
        if (typeof this.$refs.serverConfigRef?.validate === 'function') {
          await this.$refs.serverConfigRef.validate()
        }
        const values = {
          ...expandBracketFd(this.form.fd),
          provider: this.form.fd.provider || this.provider,
          isConfigImage: this.isConfigImage,
        }
        const genValues = this.genData(values)
        const hasControl = genValues.machines.some(val => val.role === 'controlplane')
        if (!hasControl) {
          this.$message.warning(this.$t('k8s.text_175'))
          this.loading = false
          return
        }
        this.loading = true
        await this.doCreate(genValues)
        this.loading = false
        this.$router.push('/k8s-cluster')
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    cancel () {
      this.$router.push('/k8s-cluster')
    },
  },
}
</script>
