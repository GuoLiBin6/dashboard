<template>
  <div>
    <a-form-model
      ref="formRef"
      class="mt-3"
      :model="form.fd"
      :rules="rules"
      @submit="submit"
      hideRequiredMark>
      <servertemplate v-if="isServertemplate" :form="form">
        <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])">
          <domain-project
            ref="domainProjectRef"
            :form="form.fd"
            :form-draft-key="vmDraftFields.domainProject"
            :ignoreStorage="ignoreLocalFormStorage"
            @fetchDomainCallback="fetchDomainCallback"
            @fetchProjectCallback="fetchProjectCallback" />
        </a-form-model-item>
      </servertemplate>
      <!-- <a-divider orientation="left">{{$t('compute.text_300')}}</a-divider> -->
      <a-form-model-item v-if="!isServertemplate" :label="$t('compute.text_297', [$t('dictionary.project')])">
        <domain-project
          ref="domainProjectRef"
          :form="form.fd"
          :form-draft-key="vmDraftFields.domainProject"
          :ignoreStorage="ignoreLocalFormStorage"
          @fetchDomainCallback="fetchDomainCallback"
          @fetchProjectCallback="fetchProjectCallback" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_177')" class="mb-0">
        <cloudregion-zone
          ref="cloudregionZoneRef"
          :model="form.fd"
          :zone-params="zoneParams"
          :cloudregion-params="cloudregionParams"
          :form-draft-key="vmDraftFields.cloudregionZone"
          filterBrandResource="compute_engine" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_15')" v-if="isHCSO || isHCS" prop="cloudprovider">
        <base-select
          resource="cloudproviders"
          v-model:value="form.fd.cloudprovider"
          :params="policycloudproviderParams"
          :isDefaultSelect="true"
          :showSync="true"
          :select-props="{ placeholder: $t('compute.text_149') }" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_228')" v-if="!isServertemplate" prop="name">
        <a-input v-model:value="form.fd.name" :placeholder="$t('compute.text_210')" />
        <template v-slot:extra>
          <name-repeated
            res="servers"
            :name="form.fd.name"
            :default-text="$t('compute.text_893')" />
        </template>
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')" v-if="!isServertemplate" prop="description">
        <a-textarea v-model:value="form.fd.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1041')" v-if="showReason">
        <a-input v-model:value="form.fd.reason" :placeholder="$t('compute.text_1042')" />
      </a-form-model-item>
      <a-form-model-item v-show="!isServertemplate" :label="$t('compute.text_1132')">
        <duration
          useServerDuration
          :model="form.fd"
          v-model:durationStandard="form.fd.durationStandard"
          v-model:duration="form.fd.duration"
          :form="form"
          :form-draft-key="vmDraftFields.duration" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_294')" v-show="!isServertemplate" prop="count">
        <a-input-number v-model:value="form.fd.count" @blur="countBlur" :min="1" :max="100" />
      </a-form-model-item>
      <a-form-model-item v-if="form.fd.hypervisor === 'zettakit' || form.fd.hypervisor === 'kvm'">
        <template #label>
          {{ $t('compute.text_1152') }}&nbsp;
          <a-tooltip :title="$t('compute.vgpu_check.tooltip')">
            <a-icon type="question-circle-o" />
          </a-tooltip>
        </template>
        <pci ref="pciRef" :pciDevTypeOptions="pciDevTypeOptions" :form="form" :model="form.fd" :pci-options="pciOptions" :form-draft-key="vmDraftFields.pci" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1058')" class="mb-0">
        <cpu-radio :model="form.fd" :options="form.fi.cpuMem.cpus || []" :showUnlimited="true" :form="form" :form-draft-key="vmDraftFields.vcpu" @change="cpuChange" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_369')" class="mb-0">
        <mem-radio :model="form.fd" :options="form.fi.cpuMem.mems_mb || []" :showUnlimited="true" :form-draft-key="vmDraftFields.vmem" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_109')" v-if="showSku">
        <sku
          ref="skuRef"
          :model="form.fd"
          :type="type"
          :sku-params="skuParam"
          :hypervisor="form.fd.hypervisor"
          :form-draft-key="vmDraftFields.sku" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_267')" :extra="$t('compute.text_302')">
        <os-select
          ref="osSelectRef"
          :type="type"
          :form="form"
          :model="form.fd"
          :hypervisor="form.fd.hypervisor"
          :os-arch="osArch"
          :image-params="imageParams"
          :cacheImageParams="cacheImageParams"
          :cloudproviderParamsExtra="cloudproviderParamsExtra"
          :ignoreOptions="ignoreImageOptions"
          :ignore-storage="ignoreLocalFormStorage"
          :form-draft-key="vmDraftFields.osSelect"
          @updateImageMsg="updateFi" />
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
          :sizeDisabled="disabledSysDiskSize"
          :form-draft-key="vmDraftFields.systemDisk" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_50')" v-if="form.fd.hypervisor && form.fd.hypervisor !== 'zettakit' && !isCNware">
        <data-disk
          :isInitForm="isFormBackfill"
          :model="form.fd"
          :type="type"
          :form="form"
          :hypervisor="form.fd.hypervisor"
          :sku="form.fd.sku"
          :defaultType="form.fd.systemDiskType"
          :capability-data="form.fi.capability"
          ref="dataDiskRef"
          :form-draft-key="vmDraftFields.dataDisk" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1372')" v-if="showServerAccount">
        <server-account :form="form" :hypervisor="form.fd.hypervisor" :instance_capabilities="form.fi.capability.instance_capabilities" :osType="osType" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_308')">
        <server-password ref="passwordRef" :login-types="loginTypes" :form="form" :model="form.fd" :form-draft-key="vmDraftFields.loginConfig" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_104')" class="mb-0">
        <server-network
          ref="networkRef"
          :model="form.fd"
          :form="form"
          :network-list-params="networkParam"
          :schedtag-params="schedtagParams"
          :networkVpcParams="networkVpcParams"
          :vpcResource="vpcResource"
          :cloudprovider="this.form.fd.cloudprovider"
          :serverCount="form.fd.count"
          :key="serverNetwork"
          :networkResourceMapper="networkResourceMapper"
          :showMacConfig="form.fd.hypervisor === 'kvm'"
          :showPortMapping="showPortMapping"
          :ignore-auto-network-type="ignoreAutoNetworkTypeForDraft"
          :form-draft-key="vmDraftFields.serverNetwork" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1154')" class="mb-0" prop="__meta__">
        <tag
          v-model:value="form.fd.__meta__"
          :default-checked="tagDefaultChecked" />
      </a-form-model-item>
      <advance-config-block ref="advanceConfigBlock" collapsible>
        <a-form-model-item v-if="!isServertemplate">
          <template #label>
            {{ $t('common_388') }}&nbsp;
            <a-tooltip :title="hostNameTips">
              <a-icon type="question-circle-o" />
            </a-tooltip>
          </template>
          <host-name ref="hostNameRef" :model="form.fd" :isWindows="isWindows" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_105')" v-if="showSecgroup">
          <secgroup-config
            ref="secgroupRef"
            :form="form"
            :model="form.fd"

            :secgroup-params="secgroupParams"
            :hypervisor="form.fd.hypervisor"
            :showSecgroupBind="showSecgroupBind"
            :ignore-auto-type-reset="preserveAdvanceInitProps"
            :init-secgroups="workflowInitSecgroups" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_311')" v-show="!isServertemplate" class="mb-0">
          <sched-policy
            ref="schedPolicyRef"
            :model="form.fd"
            :form="form"
            :provider="cloudprovider"
            :server-type="form.fi.createType"
            :disabled-host="policyHostDisabled"
            :policy-host-params="policyHostParams"

            :policy-schedtag-params="policySchedtagParams"
            :init-prefer-host="workflowInitPreferHost"
            :preserve-init-prefer-host="preserveAdvanceInitProps"
            :init-schedtags="workflowInitSchedtags"
            :form-draft-key="vmDraftFields.schedPolicy" />
        </a-form-model-item>
        <custom-data v-if="showCustomData" ref="customData" :model="form.fd" :form="form" />
        <bastion-host ref="bastionHostRef" v-if="!isOpenSourceVersion && hasBastionService" :form="form" :model="form.fd" :form-draft-key="vmDraftFields.bastionHost" />
      </advance-config-block>
      <bottom-bar
        :loading="submiting"
        :form="form"
        :type="type"
        :dataDiskSizes="dataDiskSizes"
        :isOpenWorkflow="isOpenWorkflow"
        :isOpenOrderSetWorkflow="isOpenOrderSetWorkflow"
        :isModifyWorkflow="isModifyWorkflow"
        v-model:errors="errors"
        :isServertemplate="isServertemplate"
        :hasMeterService="hasMeterService"
        @add-cart="addShopCart"
        @cancel="handleCancel" />
    </a-form-model>
  </div>
</template>
<script>
import _ from 'lodash'
import * as R from 'ramda'
import SecgroupConfig from '@Compute/sections/SecgroupConfig'
import { HYPERVISORS_MAP } from '@/constants'
import { getOsArchParam, isOsArch } from '@/constants/compute'
import { uuid } from '@/utils/utils'
import mixin from './mixin'

export default {
  name: 'VMPrivateCreate',
  components: {
    SecgroupConfig,
  },
  mixins: [mixin],
  computed: {
    isArm () {
      return isOsArch(this.form.fd.sku && this.form.fd.sku.cpu_arch, 'arm')
    },
    isLoongarch64 () {
      return isOsArch(this.form.fd.sku && this.form.fd.sku.cpu_arch, 'loongarch64')
    },
    isRiscv64 () {
      return isOsArch(this.form.fd.sku && this.form.fd.sku.cpu_arch, 'riscv64')
    },
    osArch () {
      if (this.form.fd.sku && this.form.fd.sku.cpu_arch) {
        return this.form.fd.sku.cpu_arch
      } else {
        return ''
      }
    },
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
    imageParams () {
      const params = {
        ...this.scopeParams,
      }
      if (R.is(Object, this.form.fd.sku)) {
        if (this.cloudregionZoneParams.cloudregion) {
          params.cloudregion_id = this.cloudregionZoneParams.cloudregion
        }
        params.os_arch = getOsArchParam(this.form.fd.sku.cpu_arch)
      }
      return params
    },
    cacheImageParams () {
      const params = {
        manager_id: this.form.fd.cloudprovider,
      }
      if (this.form.fd.hypervisor !== HYPERVISORS_MAP.cloudpods.hypervisor) {
        params.project_domain = this.project_domain
      }
      if (this.cloudregionZoneParams.cloudregion) {
        params.cloudregion_id = this.cloudregionZoneParams.cloudregion
      }
      // CAS/UIS 等私有云镜像需按 provider 过滤
      if (this.cloudprovider) {
        params.provider = this.cloudprovider
      }
      if (this.form.fd.imageType === 'private_iso') {
        params.filter = 'name.endswith(".iso")'
      }
      if (!params.cloudregion_id) return {}
      return params
    },
    showSku () {
      return true
    },
    skuParam () {
      const params = {
        limit: 0,
        postpaid_status: 'available',
        cpu_core_count: this.form.fd.vcpu,
        memory_size_mb: this.form.fd.vmem,
        usable: true,
        enabled: true,
        ...this.scopeParams,
      }
      if (this.form.fd.hypervisor === 'nutanix' || this.form.fd.hypervisor === 'incloudsphere' || this.form.fd.hypervisor === 'proxmox' || this.form.fd.hypervisor === 'sangfor' || this.form.fd.hypervisor === 'uis' || this.form.fd.hypervisor === 'cas' || this.form.fd.hypervisor === 'cnware') {
        params.is_on_premise = true
        params.usable = false
      } else {
        params.private_cloud = true
        params.cloudregion_id = this.cloudregionZoneParams.cloudregion
      }
      return params
    },
    policyHostParams () {
      const zone = _.get(this.form.fd, 'zone.key')
      if (zone) {
        return {
          enabled: 1,
          usable: true,
          zone,
          hypervisor: this.form.fd.hypervisor,
          ...this.scopeParams,
        }
      }
      return {}
    },
    networkParam () {
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.cnware.hypervisor) {
        return {
          filter: 'server_type.notin(ipmi, pxe, hostlocal)',
          usable: true,
          ...this.scopeParams,
        }
      }
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
        const ret = {
          usable: true,
          enabled: true,
          'provider.0': HYPERVISORS_MAP.kvm.provider,
          'provider.1': _.get(HYPERVISORS_MAP, `[${this.form.fd.hypervisor}].provider`),
        }
        if (this.form.fd.hypervisor === HYPERVISORS_MAP.sangfor.hypervisor || this.form.fd.hypervisor === HYPERVISORS_MAP.cnware.hypervisor) {
          delete ret.usable
        }
        return ret
      }
    },
    cloudprovider () {
      if (this.form.fd.hypervisor && this.form.fd.hypervisor) {
        return HYPERVISORS_MAP[this.form.fd.hypervisor].provider
      }
      return ''
    },
    cloudproviderParamsExtra () {
      const params = {
        manager_id: this.form.fd.cloudprovider,
        ...this.scopeParams,
      }
      if (this.cloudprovider) {
        params.provider = this.cloudprovider
      }
      if (this.cloudregionZoneParams.cloudregion) {
        params.cloudregion_id = this.cloudregionZoneParams.cloudregion
      }
      return params
    },
    disabledSysDiskSize () {
      if (this.form.fd.systemDiskType) {
        return this.form.fd.systemDiskType.key === 'nova'
      }
      return false
    },
    policycloudproviderParams () {
      const params = {
        limit: 0,
        brand: this.form.fd.provider,
        cloudregion_id: this.form.fd.cloudregion?.key || this.form.fd.cloudregion,
        enabled: true,
        filter: 'status.equals(\'connected\')',
        ...this.scopeParams,
      }
      if (this.form.fd.zone) {
        params.zone_id = this.form.fd.zone?.key || this.form.fd.zone
      }
      return params
    },
    showSecgroup () {
      const hiddenSecCloudprovider = ['Nutanix', 'SangFor', 'CNware']
      return !hiddenSecCloudprovider.includes(this.cloudprovider)
    },
    systemDiskTypeDisabled () {
      return this.form.fd.hypervisor === HYPERVISORS_MAP.nutanix.key
    },
    ignoreImageOptions () {
      if (this.isInCloudSphere || this.isCNware) {
        return ['standard', 'customize']
      }
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.proxmox.key) {
        return ['private']
      }
      return []
    },
  },
  watch: {
    // onValuesChange → form.fd watches
    'form.fd.zone' (val, oldVal) {
      if (R.equals(val, oldVal)) return
      this.fetchCapability()
    },
    'form.fd.project' (val, oldVal) {
      if (R.equals(val, oldVal)) return
      this.fetchCapability()
    },
    'form.fd.schedPolicyType' (val) {
      if (val !== 'host') return
      const keepHost = this.isFormBackfill ||
        this.form?.fi?.advanceDraftRestoring ||
        this.$refs.schedPolicyRef?.pendingPreferHost ||
        this.$refs.schedPolicyRef?._draftApplying
      if (!keepHost) {
        this.form.fd.schedPolicyHost = undefined
      }
    },
  },
  methods: {
    fetchCapability () {
      const params = {
        show_emulated: true,
        resource_type: 'shared',
        ...this.scopeParams,
        $t: uuid(),
      }
      if (this.project) {
        params.tenant_id = this.project
      }
      let id = this.cloudregionZoneParams.cloudregion
      let resource = 'cloudregions'
      if (this.cloudregionZoneParams.zone) {
        id = this.cloudregionZoneParams.zone
        resource = 'zones'
      }
      const capabilityParams = { id, spec: 'capability', params, $t: uuid() }
      if (!id) return
      if (R.equals(this.capabilityParams, capabilityParams)) return // 和已有的参数一样则不发请求
      this.capabilityParams = capabilityParams
      new this.$Manager(resource).getSpecific(capabilityParams)
        .then(({ data }) => {
          const { cloudregion = {} } = this.form.fd
          if (resource === 'cloudregions' && cloudregion.key && id !== cloudregion.key) {
            return
          }
          const hypervisors = data.hypervisors.filter(val => val !== 'baremetal' && val !== 'pod')
          this.form.fi.capability = {
            ...data,
            hypervisors,
          }
          // 草稿/工单回填：优先 init / 草稿 hypervisor；否则保留当前；最后默认第一项
          // Hypervisor end-state：只写 form.fd
          const draftHyper = !this.isFormBackfill && this.canUseCreateFormDraft
            ? this.readCreateFormFieldDraftForRestore(this.vmDraftFields.hypervisor)
            : null
          const preferHyper = this.isFormBackfill
            ? (this.effectiveInitFormData?.hypervisor || this.form.fd.hypervisor)
            : (draftHyper || this.form.fd.hypervisor)
          const hypervisor = (preferHyper && hypervisors.includes(preferHyper))
            ? preferHyper
            : hypervisors[0]
          this.form.fd.hypervisor = hypervisor
          this.$nextTick(() => {
            this.fetchInstanceSpecs()
            if (!this._privateCapabilityDraftRestoreOnce) {
              this._privateCapabilityDraftRestoreOnce = true
              this.restoreDeferredFormFieldDrafts()
            }
          })
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
