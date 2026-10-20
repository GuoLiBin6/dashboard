<template>
  <a-form-model ref="formRef" :model="form.fd" :rules="rules" class="mt-3">
    <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])">
      <domain-project :form="form.fd" v-model:domain="domain" v-model:project="project" :labelInValue="false" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_199')" class="mb-0">
      <cloudregion-zone
        :model="form.fd"
        :cloudregionParams="cloudregionParams"
        :zoneParams="zoneParams"
        v-model:zone="zoneObj"
        filterBrandResource="loadbalancer_engine" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_21')">
      <a-input v-model:value="form.fd.name" :placeholder="$t('validator.resourceName')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.text_7')">
      <a-row :gutter="9">
        <a-col :span="12">
          <oc-select
            width="100%"
            v-model:value="form.fd.vpc"
            show-status
            :status-desc="$t('compute.vpc_status_desc')"
            resource="vpcs"
            label="VPC"
            :formatter="vpcFormatter"
            :params="vpcParams"
            :sort="(arr) => arr.sort((a, b) => a.network_count > b.network_count ? -1 : 1)"
            :placeholder="$t('compute.text_194')" />
        </a-col>
        <a-col :span="12">
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
    <a-form-model-item :label="$t('network.text_16')" v-if="isHCSO || isHCS">
      <a-radio-group v-model:value="form.fd.address_type">
        <a-radio-button value="internet">{{$t('network.text_270')}}</a-radio-button>
        <a-radio-button value="intranet">{{$t('network.text_271')}}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_273')" v-if="isHCSO || isHCS">
      <a-radio-group v-model:value="form.fd.ip">
        <a-radio-button value="ipv4">IPv4</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_221')" v-if="(isHCSO || isHCS) && form.fd.address_type === 'internet'">
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
import CloudregionZone from '@/sections/CloudregionZone/model'
import lbCreate from './mixin'
import { HYPERVISORS_MAP } from '../../../../../../src/constants'

export default {
  name: 'LbOnecloudCreate',
  components: {
    CloudregionZone,
  },
  mixins: [lbCreate],
  provide () {
    return {
      form: this.form,
    }
  },
  data () {
    return {
      zoneObj: {},
      hadVpc: false,
    }
  },
  computed: {
    eipParams () {
      let params = {}
      if (this.form.fd.cloudregion && !R.isEmpty(this.scopeParams)) {
        const region = R.is(Object, this.form.fd.cloudregion) ? this.form.fd.cloudregion.key : this.form.fd.cloudregion
        params = { ...this.scopeParams, usable: true, region: region }
        if (this.isAdminMode || this.isDomainMode) {
          params.project = this.form.fd.project
        }
      }
      if (!R.isEmpty(this.vpcObj) && this.vpcObj.manager_id) {
        params.manager_id = this.vpcObj.manager_id
      }
      return params
    },
    isHCSO () {
      if (this.zoneObj) {
        return this.zoneObj.provider === HYPERVISORS_MAP.hcso.provider
      }
      return false
    },
    isHCS () {
      if (this.zoneObj) {
        return this.zoneObj.provider === HYPERVISORS_MAP.hcs.provider
      }
      return false
    },
  },
  methods: {
    async submit () {
      const { manager_id } = this.vpcObj
      try {
        const values = await this.validateCreateForm()
        const data = {
          manager: manager_id,
          name: values.name.trim(),
          description: values.description,
          project: values.project,
          network: values.network,
          __meta__: values.__meta__,
        }

        if (this.isHCSO || this.isHCS) {
          data.zone = values.zone.key
          data.cloudregion = values.cloudregion.key
          data.address_type = values.address_type
          data.ip = values.ip
          data.vpc = values.vpc
          if (values.eip) data.eip = values.eip
        }
        if (this.isAdminMode) {
          data.domain = values.domain
          data.admin = true
        }
        return data
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
