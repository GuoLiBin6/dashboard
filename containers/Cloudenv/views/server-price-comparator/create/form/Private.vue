<template>
  <div>
    <a-form-model
      ref="formRef"
      class="mt-3"
      :model="form.fd"
      :rules="rules"
      v-bind="formItemLayout"
      @submit="submit"
      hideRequiredMark>
      <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])" v-show="false">
        <domain-project
          ref="domainProjectRef"
          :form="form.fd"
          @fetchDomainCallback="fetchDomainCallback"
          @fetchProjectCallback="fetchProjectCallback" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_177')" class="mb-0" v-show="false">
        <cloudregion-zone
          ref="cloudregionZoneRef"
          :model="form.fd"
          :zone-params="zoneParams"
          :cloudregion-params="cloudregionParams"
          filterBrandResource="compute_engine" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_294')" prop="count">
        <a-input-number v-model:value="form.fd.count" @blur="countBlur" :min="1" :max="100" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1058')" class="mb-0">
        <cpu-radio :model="form.fd" :options="form.fi.cpuMem.cpus || []" @change="cpuChange" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_369')" class="mb-0">
        <mem-radio :model="form.fd" :options="form.fi.cpuMem.mems_mb || []" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_109')" v-if="showSku">
        <sku
          ref="skuRef"
          :model="form.fd"
          :type="type"
          :sku-params="skuParam"
          :hypervisor="form.fd.hypervisor" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_49')" class="mb-0">
        <system-disk
          ref="systemDiskRef"
          :model="form.fd"
          :type="type"
          :form="form"
          :hypervisor="form.fd.hypervisor"
          :sku="form.fd.sku"
          :capability-data="form.fi.capability"
          :image="form.fi.imageMsg"
          :sizeDisabled="disabledSysDiskSize" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_50')">
        <data-disk
          v-if="form.fd.hypervisor"
          ref="dataDiskRef"
          :model="form.fd"
          :type="type"
          :form="form"
          :hypervisor="form.fd.hypervisor"
          :sku="form.fd.sku"
          :defaultType="form.fd.systemDiskType"
          :capability-data="form.fi.capability"
          :simplify="true" />
      </a-form-model-item>
      <bottom-bar
        ref="bottomBarRef"
        :loading="submiting"
        :form="form"
        :type="type"
        :dataDiskSizes="dataDiskSizes"
        :isOpenWorkflow="isOpenWorkflow"
        v-model:errors="errors"
        :isServertemplate="isServertemplate"
        :hasMeterService="hasMeterService"
        @getOriginPrice="getOriginPrice" />
    </a-form-model>
  </div>
</template>
<script>
import _ from 'lodash'
import * as R from 'ramda'
import { HYPERVISORS_MAP } from '@/constants'
import mixin from './mixin'

export default {
  name: 'VMPrivateCreate',
  components: {},
  mixins: [mixin],
  computed: {
    cloudregionParams () {
      return {
        cloud_env: 'private',
        usable: true,
        show_emulated: true,
        ...this.scopeParams,
      }
    },
    zoneParams () {
      return {
        usable: true,
        show_emulated: true,
        order_by: 'created_at',
        order: 'asc',
        ...this.scopeParams,
      }
    },
    cacheImageParams () {
      const params = {}
      if (R.is(Object, this.form.fd.sku)) {
        if (this.cloudregionZoneParams.cloudregion) {
          params.cloudregion_id = this.cloudregionZoneParams.cloudregion
        }
      }
      if (!params.cloudregion_id) return {}
      return params
    },
    showSku () {
      if (this.form.fd.vcpu && this.form.fd.vmem) {
        return true
      }
      return false
    },
    skuParam () {
      return {
        limit: 0,
        public_cloud: false,
        postpaid_status: 'available',
        cpu_core_count: this.form.fd.vcpu,
        memory_size_mb: this.form.fd.vmem,
        usable: true,
        enabled: true,
        provider: 'OneCloud',
        ...this.scopeParams,
      }
    },
    policyHostParams () {
      const zone = _.get(this.form.fd, 'zone.key')
      if (zone) {
        return {
          enabled: 1,
          usable: true,
          zone,
          hypervisor: this.form.fd.hypervisor,
        }
      }
      return {}
    },
    networkParam () {
      const params = {
        filter: 'server_type.notin(ipmi, pxe)',
        usable: true,
        zone: _.get(this.form, 'fd.zone.key'),
        ...this.scopeParams,
      }
      return params
    },
    instanceSpecParmas () {
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.hcso.hypervisor || this.form.fd.hypervisor === HYPERVISORS_MAP.hcs.hypervisor) {
        const params = {
          usable: true,
          enabled: true,
          provider: HYPERVISORS_MAP.hcso.provider,
        }
        if (this.form.fd.hypervisor === HYPERVISORS_MAP.hcs.hypervisor) {
          params.provider = HYPERVISORS_MAP.hcs.provider
        }

        if (this.cloudregionZoneParams.cloudregion) {
          params.cloudregion_id = this.cloudregionZoneParams.cloudregion
        }
        return params
      } else {
        return {
          usable: true,
          enabled: true,
          'provider.0': HYPERVISORS_MAP.kvm.provider,
          'provider.1': _.get(HYPERVISORS_MAP, `[${this.form.fd.hypervisor}].provider`),
        }
      }
    },
    cloudproviderParamsExtra () {
      const params = {
        cloud_env: 'private',
        ...this.scopeParams,
      }
      if (this.form.fd.hypervisor && this.form.fd.hypervisor) {
        params.provider = HYPERVISORS_MAP[this.form.fd.hypervisor].provider
      }
      return params
    },
    disabledSysDiskSize () {
      if (this.form.fd.systemDiskType) {
        return this.form.fd.systemDiskType.key === 'nova'
      }
      return false
    },
  },
  watch: {
    // onValuesChange → form.fd watches
    'form.fd.zone' (val, oldVal) {
      if (R.equals(val, oldVal)) return
      this.fetchCapability()
    },
  },
  methods: {
    fetchCapability () {
      const params = {
        show_emulated: true,
        resource_type: 'shared',
        ...this.scopeParams,
      }
      let id = this.cloudregionZoneParams.cloudregion
      let resource = 'cloudregions'
      if (this.cloudregionZoneParams.zone) {
        id = this.cloudregionZoneParams.zone
        resource = 'zones'
      }
      const capabilityParams = { id, spec: 'capability', params }
      if (!id) return
      if (R.equals(this.capabilityParams, capabilityParams)) return // 和已有的参数一样则不发请求
      this.capabilityParams = capabilityParams
      new this.$Manager(resource).getSpecific(this.capabilityParams)
        .then(({ data }) => {
          this.form.fi.capability = {
            ...data,
            hypervisors: data.hypervisors.filter(val => val !== 'baremetal'),
          }
          this.form.fd.hypervisor = this.form.fi.capability.hypervisors[0] // 赋值默认第一个平台
          this.$nextTick(this.fetchInstanceSpecs)
        })
    },
    fetchInstanceSpecs () {
      this.serverskusM.get({ id: 'instance-specs', params: this.instanceSpecParmas })
        .then(({ data }) => {
          this.form.fi.cpuMem = data
          this.cpuChange(this.form.fd.vcpu)
        })
    },
  },
}
</script>
