<template>
  <a-form-model ref="formRef" :model="form.fd" :rules="rules" class="mt-3" v-bind="formItemLayout">
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
    <a-form-model-item :label="$t('compute.text_176')">
      <a-radio-group :defaultValue="hypervisorOpts[0].key">
        <a-radio-button v-for="item in hypervisorOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_19')">
      <base-select
        show-sync
        v-model:value="form.fd.cluster_id"
        resource="loadbalancerclusters"
        need-params
        filterable
        :params="clusterParams"
        :select-props="{ placeholder: $t('network.text_79') }" />
      <div slot="extra" v-if="isAdminMode">{{$t('network.text_281')}}<help-link href="/cluster">{{$t('network.text_282')}}</help-link></div>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_211')">
      <a-row :gutter="8">
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
          <a-form-model-item>
            <base-select
              v-model:value="form.fd.network"
              resource="networks"
              need-params
              filterable
              isDefaultSelect
              :params="networkParams"
              v-model:item="networkObj"
              :select-props="{ placeholder: $t('network.text_212') }" />
          </a-form-model-item>
        </a-col>
      </a-row>
    </a-form-model-item>
    <eip-config
      v-if="showEip"
      ref="eipConfigRef"

      :eip-params="eipParams"
      hypervisor="kvm"
      cloud-env="idc"
      :form="form"
      :model="form.fd"
      :formItemLayout="formItemLayout" />
    <a-form-model-item :label="$t('table.title.tag')">
      <tag :value="form.fd.__meta__" @change="v => { form.fd.__meta__ = v }" :allowNoValue="false" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { mapGetters } from 'vuex'
import EipConfig from '@Compute/sections/EipConfig'
import CloudregionZone from '@/sections/CloudregionZone/model'
import { HYPERVISORS_MAP } from '@/constants'
import lbCreate from './mixin'
export default {
  name: 'LbOnecloudCreate',
  components: {
    CloudregionZone,
    EipConfig,
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
    ...mapGetters(['isAdminMode']),
    clusterParams () {
      let params = {}
      if (this.zoneObj && this.zoneObj.id && !R.isEmpty(this.scopeParams)) {
        params.zone = this.zoneObj.id
        params.limit = 0
        params = Object.assign(params, this.scopeParams)
      }
      return params
    },
    networkParams () {
      let params = {}
      if (this.form.fd.vpc && !R.isEmpty(this.scopeParams)) {
        params = { ...this.scopeParams, usable: true }
        params.limit = 0
        params.vpc = this.form.fd.vpc
        if (this.zoneObj && this.zoneObj.id) params.zone = this.zoneObj.id
        if (this.form.fd.vpc === 'default') {
          params.lb_cluster_id = this.form.fd.cluster_id
        }
      }
      return params
    },
    cloudregionParams () { // 覆盖 mixin
      return {
        scope: this.$store.getters.scope,
        usable: true,
        is_on_premise: true,
      }
    },
    // 当前只支持oneCloud
    hypervisorOpts () {
      return [HYPERVISORS_MAP.kvm]
    },
    eipParams () {
      const cloudregion = _.get(this.form.fd, 'cloudregion.key')
      if (!cloudregion) return {}
      return {
        project: this.project,
        region: cloudregion,
      }
    },
    showEip () {
      const { vpc } = this.form.fd
      if (!vpc || vpc === 'default') {
        return false
      }
      return true
    },
  },
  methods: {
    async submit () {
      try {
        const values = await this.validateCreateForm()
        const data = {
          cluster_id: values.cluster_id,
          name: values.name.trim(),
          description: values.description,
          vpc: values.vpc,
          network: values.network,
          domain: values.domain,
          project: values.project,
          __meta__: values.__meta__,
        }
        if (values.eip_type === 'new') {
          data.eip_bgp_type = values.eip_bgp_type
          data.eip_bw = values.eip_bw
          data.eip_charge_type = values.eip_charge_type
        } else if (values.eip_type === 'bind') {
          data.eip = values.eip
          data.address_type = 'internet'
        }
        return data
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
