<template>
  <a-form-model ref="formRef" :model="form.fd" :rules="rules" class="mt-3">
    <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])">
      <domain-project :form="form.fd" v-model:domain="domain" v-model:project="project" :labelInValue="false" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_21')">
      <a-input v-model:value="form.fd.name" :placeholder="$t('validator.resourceName')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
    </a-form-model-item>
    <area-selects
      :model="form.fd"
      v-bind="areaParams"
      filterBrandResource="loadbalancer_engine"
      @providerFetchSuccess="providerFetchSuccess"
      @cloudregionFetchSuccess="cloudregionFetchSuccess"
      @zoneFetchSuccess="zoneFetchSuccess"
      class="mb-0" />
    <a-form-model-item :label="$t('network.text_268')" v-if="isAliyun">
      <base-select
        v-model:value="form.fd.loadbalancer_spec"
        :options="specOpts"
        :select-props="{ placeholder: $t('network.text_269') }" />
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_266')" v-if="isAws">
      <a-radio-group v-model:value="form.fd.instance_type">
        <a-radio-button v-for="item in instanceOpts" :value="item.key" :label="item.label" :key="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_16')">
      <a-radio-group v-model:value="form.fd.address_type">
        <a-radio-button value="internet">{{$t('network.text_270')}}</a-radio-button>
        <a-radio-button value="intranet">{{$t('network.text_271')}}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_272')" v-if="(isAliyun || isQcloud) && form.fd.address_type === 'internet' ">
      <charge-type-radio :model="form.fd" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_273')">
      <a-radio-group v-model:value="form.fd.ip">
        <a-radio-button value="ipv4">IPv4</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('common_711')" v-if="isShowCloudprovider">
      <base-select
        v-model:value="form.fd.manager"
        resource="cloudproviders"
        need-params
        filterable
        :params="cloudproviderParams"
        :select-props="{ placeholder: $t('common_588') }" />
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.text_7')" v-else>
      <a-row :gutter="9">
        <a-col :span="12">
          <oc-select
            width="100%"
            v-model:value="form.fd.vpc"
            @selectChange="handleVpcChange"
            show-status
            :status-desc="$t('compute.vpc_status_desc')"
            resource="vpcs"
            label="VPC"
            :formatter="vpcFormatter"
            :params="vpcParams"
            :sort="(arr) => arr.sort((a, b) => a.network_count > b.network_count ? -1 : 1)"
            :placeholder="$t('compute.text_194')" />
        </a-col>
        <a-col :span="12" v-if="(isQcloud && form.fd.address_type === 'intranet') || !isQcloud">
          <base-select
            v-model:value="form.fd.network"
            resource="networks"
            need-params
            filterable
            v-model:item="networkObj"
            :params="networkParams"
            :select-props="{ placeholder: $t('network.text_275') }" />
        </a-col>
      </a-row>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_221')" v-if="isHuawei && form.fd.address_type === 'internet'">
      <base-select
        v-model:value="form.fd.eip"
        resource="eips"
        need-params
        :params="eipParams"
        :showSync="true"
        :select-props="{ placeholder: $t('network.text_278') }" />
        <div slot="extra">{{$t('system.text_439')}}<help-link href="/eip">{{$t('system.text_440')}}</help-link>
        </div>
    </a-form-model-item>
    <a-form-model-item :label="$t('table.title.tag')">
      <tag :value="form.fd.__meta__" @change="v => { form.fd.__meta__ = v }" :allowNoValue="false" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import * as R from 'ramda'
import { LB_SPEC } from '@Network/views/lb/constants'
import ChargeTypeRadio from '@/sections/ChargeTypeRadio'
import AreaSelects from '@/sections/AreaSelects/model'
import lbCreate from './mixin.js'
export default {
  name: 'LbAliyunCreate',
  components: {
    ChargeTypeRadio,
    AreaSelects,
  },
  mixins: [lbCreate],
  data () {
    return {
      specOpts: LB_SPEC.aliyun,
      instanceOpts: LB_SPEC.aws,
    }
  },
  computed: {
    eipParams () {
      let params = {}
      if (this.form.fd.cloudregion && !R.isEmpty(this.scopeParams)) {
        params = { ...this.scopeParams, usable: true, region: this.form.fd.cloudregion }
        if (this.isAdminMode || this.isDomainMode) {
          params.project = this.form.fd.project
        }
      }
      if (!R.isEmpty(this.vpcObj) && this.vpcObj.manager_id) {
        params.manager_id = this.vpcObj.manager_id
      }
      return params
    },
  },
  methods: {
    providerFetchSuccess (list) {
      const showProvider = ['Aliyun', 'Aws', 'Qcloud', 'Huawei']
      if (list && list.length > 0) {
        return list.filter(item => {
          const { name } = item
          return showProvider.indexOf(name) > -1
        })
      }
      return list
    },
    cloudregionFetchSuccess (list) {
      const showProvider = ['Aliyun', 'Aws', 'Qcloud', 'Huawei']
      if (list && list.length > 0) {
        return list.filter(item => {
          const { provider } = item
          return showProvider.indexOf(provider) > -1
        })
      }
      return list
    },
    zoneFetchSuccess (list) {
      const showProvider = ['Aliyun', 'Aws', 'Qcloud', 'Huawei']
      if (list && list.length > 0) {
        return list.filter(item => {
          const { provider } = item
          return showProvider.indexOf(provider) > -1
        })
      }
      return list
    },
    async submit () {
      try {
        const values = await this.validateCreateForm()
        if (!this.validateIp()) throw Error(this.$t('network.text_276'))
        if (!R.isEmpty(this.vpcObj)) {
          values.manager = this.vpcObj.manager
        }
        if (this.isAdminMode) {
          values.admin = true
        } else {
          delete values.domain
        }
        if (values.charge_type === 'bandwidth') {
          values.egress_mbps = values.bandwidth
        }
        if (this.isAws) {
          values.loadbalancer_spec = values.instance_type
          delete values.instance_type
        }
        return values
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
