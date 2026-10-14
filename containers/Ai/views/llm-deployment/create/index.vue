<template>
  <div>
    <page-header :title="$t('aice.llm_deployment_create')" />
    <page-body>
      <a-form-model
        ref="formRef"
        :model="form.fd"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
        class="mt-4">
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input v-model:value="form.fd.name" :placeholder="$t('validator.resourceName')" />
          <template v-slot:extra>
            <name-repeated res="llm_deployments" :name="form.fd.name" />
          </template>
        </a-form-model-item>

        <a-form-model-item :label="$t('aice.llm_sku')" prop="llm_sku_id">
          <llm-sku-select
            v-model:value="form.fd.llm_sku_id"
            :params="skuParams"
            :select-props="{
              placeholder: $t('common.tips.select', [$t('aice.llm_sku')]),
            }"
            @change="handleSkuChange" />
        </a-form-model-item>

        <a-form-model-item
          v-if="showPreferHosts"
          :label="$t('aice.local_path_import.prefer_hosts')"
          prop="prefer_hosts"
          :extra="$t('aice.local_path_import.prefer_hosts_deploy_hint')">
          <base-select
            v-model:value="form.fd.prefer_hosts"
            resource="hosts"
            :params="localPathHostParams"
            :select-props="{
              mode: 'multiple',
              placeholder: $t('common.tips.select', [$t('dictionary.host')]),
            }" />
        </a-form-model-item>

        <a-divider orientation="left">{{ $t('aice.llm_deployment.create.deployment') }}</a-divider>

        <a-form-model-item :label="$t('compute.text_104')" class="mb-0">
          <server-network
            ref="networkRef"
            :model="form.fd"
            :form="form"
            :network-list-params="networkParams"
            :schedtag-params="resourcesParams.schedtag"
            :network-resource-mapper="networkResourceMapper"
            :hiddenNetworkOptions="['schedtag']"
            defaultNetworkType="default"
            :hiddenAdd="true"
            :isDialog="true" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <template v-slot:right>
        <a-button type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.create') }}</a-button>
        <a-button class="ml-2" @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <side-errors
          :error-title="$t('aice.llm_deployment.create.schedulable_check.title')"
          :errors="errors"
          @update:errors="errors = {}" />
      </template>
    </page-footer>
  </div>
</template>

<script>
import * as R from 'ramda'
import ServerNetwork from '@Compute/sections/ServerNetwork'
import { NETWORK_OPTIONS_MAP } from '@Compute/constants'
import LlmSkuSelect from '@Ai/sections/LlmSkuSelect'
import { normalizePreferHosts } from '@Ai/utils/localPathImport'
import { checkSkuSchedulable, getSchedulableCheckErrors } from '@Ai/utils/skuSchedulableCheck'
import NameRepeated from '@/sections/NameRepeated'
import SideErrors from '@/sections/SideErrors'
import { Manager } from '@/utils/manager'

export default {
  name: 'LlmDeploymentCreate',
  components: { LlmSkuSelect, ServerNetwork, NameRepeated, SideErrors },
  provide () {
    return {
      form: this.form,
    }
  },
  data () {
    return {
      loading: false,
      selectedSkuDetail: null,
      errors: {},
      form: {
        fd: {
          name: '',
          llm_sku_id: undefined,
          prefer_hosts: [],
        },
        fi: {
          networkList: [],
          capability: { max_nic_count: 8 },
        },
      },
      rules: {
        name: [
          { required: true, message: this.$t('common.tips.input', [this.$t('common.name')]) },
          { validator: this.$validate('resourceName') },
        ],
        llm_sku_id: [
          { required: true, message: this.$t('common.tips.select', [this.$t('aice.llm_sku')]) },
        ],
        prefer_hosts: [
          {
            validator: (rule, value, callback) => {
              if (!this.showPreferHosts) {
                callback()
                return
              }
              const hosts = normalizePreferHosts(value)
              if (hosts.length === 0) {
                callback(this.$t('aice.local_path_import.prefer_hosts_required'))
                return
              }
              callback()
            },
          },
        ],
      },
      manager: new Manager('llm_deployments'),
      skuManager: new Manager('llm_skus'),
    }
  },
  computed: {
    showPreferHosts () {
      return this.selectedSkuDetail?.source === 'local_path'
    },
    localPathHostParams () {
      return {
        limit: 20,
        scope: this.$store.getters.scope,
        host_status: 'online',
        host_type: 'container',
      }
    },
    skuParams () {
      return {
        scope: this.$store.getters.scope,
        details: true,
        limit: 20,
        filter: [
          'status.equals(ready)',
          'llm_type.in(vllm,ollama,sglang)',
        ],
      }
    },
    networkParams () {
      return {
        scope: this.$store.getters.scope,
        limit: 20,
        usable: true,
        host_type: 'container',
        filter: 'server_type.in(guest,hostlocal)',
      }
    },
    resourcesParams () {
      return {
        schedtag: {
          limit: 1024,
          filter: ['resource_type.equals(networks)'],
        },
      }
    },
  },
  created () {
    const skuId = this.$route.query.from_sku
    if (skuId) {
      this.applyFromSku(skuId)
    }
  },
  methods: {
    async loadSkuDetail (skuId) {
      if (!skuId) {
        this.selectedSkuDetail = null
        this.form.fd.prefer_hosts = []
        return
      }
      try {
        const { data } = await this.skuManager.get({ id: skuId })
        this.selectedSkuDetail = data
        if (data?.source === 'local_path') {
          const hosts = normalizePreferHosts(data.prefer_hosts)
          this.$nextTick(() => {
            this.form.fd.prefer_hosts = hosts
          })
        } else {
          this.form.fd.prefer_hosts = []
        }
      } catch (error) {
        this.selectedSkuDetail = null
        throw error
      }
    },
    handleSkuChange (skuId) {
      this.errors = {}
      this.loadSkuDetail(skuId)
    },
    applyFromSku (skuId) {
      this.$nextTick(() => {
        this.form.fd.llm_sku_id = skuId
        this.loadSkuDetail(skuId)
      })
    },
    networkResourceMapper (list) {
      return (list || []).filter(val => val.server_type === 'guest' || val.server_type === 'hostlocal')
    },
    genNetworks (values) {
      const networkType = this.form.fd.networkType
      if (networkType === NETWORK_OPTIONS_MAP.manual.key) {
        const ret = []
        R.forEachObjIndexed((value, key) => {
          const obj = { network: value }
          if (values.networkIps?.[key]) obj.address = values.networkIps[key]
          if (values.networkMacs?.[key]) obj.mac = values.networkMacs[key]
          ret.push(obj)
        }, values.networks || {})
        return ret
      }
      if (networkType === NETWORK_OPTIONS_MAP.schedtag.key) {
        const ret = []
        R.forEachObjIndexed((value, key) => {
          const obj = { id: value }
          const strategy = values.networkPolicys?.[key]
          if (strategy) obj.strategy = strategy
          ret.push({ schedtags: [obj] })
        }, values.networkSchedtags || {})
        return ret
      }
      return [{ exit: false }]
    },
    buildPayload (values) {
      const payload = {
        name: values.name,
        llm_sku_id: values.llm_sku_id,
        replicas: 1,
        placement_strategy: 'spread',
        access_policy: 'authed',
        auto_start: true,
        nets: this.genNetworks(values),
      }
      if (this.showPreferHosts) {
        payload.prefer_hosts = normalizePreferHosts(values.prefer_hosts)
      }
      return payload
    },
    handleCancel () {
      this.$router.back()
    },
    async handleSubmit () {
      try {
        await this.$refs.formRef.validate()
        if (typeof this.$refs.networkRef?.validate === 'function') {
          await this.$refs.networkRef.validate()
        }
        const values = { ...this.form.fd }
        this.loading = true
        this.errors = {}
        const { data: check } = await checkSkuSchedulable(this.skuManager, values.llm_sku_id)
        if (!check.schedulable) {
          this.errors = getSchedulableCheckErrors(check)
          return
        }
        const payload = this.buildPayload(values)
        await this.manager.create({ data: payload })
        this.$message.success(this.$t('common.success'))
        this.$router.push({ name: 'LlmDeploymentList' })
      } catch (error) {
        this.loading = false
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
