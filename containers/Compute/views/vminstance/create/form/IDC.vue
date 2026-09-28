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
      <a-form-model-item :label="$t('compute.text_228')" v-if="!isServertemplate" prop="name">
        <a-input v-model:value="form.fd.name" />
        <template v-slot:extra>
          <name-repeated res="servers" :name="form.fd.name" :default-text="$t('compute.text_893')" />
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
      <a-form-model-item :label="$t('compute.text_176')" :extra="$t('compute.text_1151')">
        <hypervisor-radio ref="hypervisorRadioRef" :model="form.fd" :type="form.fi.createType" :hypervisors="hypervisors" :form-draft-key="vmDraftFields.hypervisor" />
      </a-form-model-item>
      <a-form-model-item
        :label="$t('compute.text_1365')" v-if="isKvm" v-show="form.fi.capability.host_cpu_archs && form.fi.capability.host_cpu_archs.length > 1">
        <os-arch
          ref="osArchRef"
          v-model:value="form.fd.os_arch"
          :form="form"
          :options="archOptions"
          :form-draft-key="vmDraftFields.osArch" />
      </a-form-model-item>
      <a-form-model-item v-if="form.fd.hypervisor === 'kvm'">
        <template #label>
          {{ $t('compute.text_1152') }}&nbsp;
          <a-tooltip :title="$t('compute.vgpu_check.tooltip')">
            <a-icon type="question-circle-o" />
          </a-tooltip>
        </template>
        <pci ref="pciRef" :pciDevTypeOptions="pciDevTypeOptions" :form="form" :model="form.fd" :pci-options="pciOptions" :form-draft-key="vmDraftFields.pci" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1058')" class="mb-0">
        <cpu-radio :model="form.fd" :options="form.fi.cpuMem.cpus || []" :showUnlimited="true" :form="form" :hypervisor="form.fd.hypervisor" :showCpuSocketsInit="form.fd.hypervisor === 'esxi' && effectiveInitFormData.hypervisor === 'esxi' && effectiveInitFormData.cpu_sockets" :cpuSocketsInit="effectiveInitFormData.cpu_sockets" :form-draft-key="vmDraftFields.vcpu" @change="cpuChange" />
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
        <div slot="extra" v-if="showSkuCreateTip">
          {{ $t('compute.text_196') }}<help-link href="/sku">{{ $t('compute.perform_create') }}</help-link>
        </div>
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_267')" :extra="extra">
        <os-select
          ref="osSelectRef"
          :type="type"
          :uefi="uefi"
          :vgaPci="vgaPci"
          :form="form"
          :model="form.fd"
          :hypervisor="form.fd.hypervisor"
          :image-params="imageParams"
          :cacheImageParams="cacheImageParams"
          :cloudproviderParamsExtra="cloudproviderParamsExtra"
          :ignore-storage="ignoreLocalFormStorage"
          :form-draft-key="vmDraftFields.osSelect"
          @updateImageMsg="updateFi" />
      </a-form-model-item>
      <a-form-model-item v-if="isKvm && form.fd.imageType === 'iso'" class="mb-0">
        <template #label>
          {{ $t('compute.kickstart') }}&nbsp;
          <a-tooltip :title="$t('compute.kickstart.tooltip')">
            <a-icon type="question-circle-o" />
          </a-tooltip>
        </template>
        <kickstart :form="form" />
      </a-form-model-item>
      <a-form-model-item v-if="isShowAgent" :label="$t('compute.agent.label')" :extra="$t('compute.agent.extra')">
        <a-checkbox
          :checked="!!form.fd.deploy_telegraf"
          @change="e => { form.fd.deploy_telegraf = e.target.checked }">{{ $t('compute.agent.install.plugin') }}</a-checkbox>
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_49')" class="mb-0">
        <system-disk
          ref="systemDiskRef"
          v-if="form.fd.hypervisor"
          :model="form.fd"
          :isServertemplate="isServertemplate"
          :type="type"
          :form="form"
          :hypervisor="form.fd.hypervisor"
          :sku="form.fd.sku"
          :capability-data="form.fi.capability"
          :image="form.fi.imageMsg"
          :defaultSize="systemdiskDefaultSize"
          :isHostImageType="isHostImageType"
          :imageType="form.fi.imageType"
          :storageParams="storageParams"
          :storageHostParams="storageHostParams"
          :domain="project_domain"
          :isStorageShow="isStorageShow"
          :isAutoResetShow="isKvm"
          @storageHostChange="storageHostChange"
          :form-draft-key="vmDraftFields.systemDisk" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_50')">
        <data-disk
          v-if="form.fd.hypervisor"
          ref="dataDiskRef"
          :model="form.fd"
          :form="form"
          :type="type"
          :hypervisor="form.fd.hypervisor"
          :sku="form.fd.sku"
          :capability-data="form.fi.capability"
          :isSnapshotImageType="isSnapshotImageType"
          :isHostImageType="isHostImageType"
          :imageType="form.fi.imageType"
          :defaultType="form.fd.systemDiskType"
          :domain="project_domain"
          :isWindows="isWindows"
          :isStorageShow="isStorageShow"
          :enableMointpoint="true"
          :storageParams="dataDiskStorageParams"
          :storageHostParams="storageHostParams"
          :isAutoResetShow="isKvm"
          :isInitForm="isFormBackfill"
          @storageHostChange="storageHostChange"
          :form-draft-key="vmDraftFields.dataDisk" />
        <div slot="extra" class="warning-color" v-if="isStorageShow && form.fi.imageType !== 'backup' && form.fi.imageType !== 'snapshot'">{{ $t('compute.select_storage_no_schetag') }}</div>
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1372')" v-if="showServerAccount">
        <server-account :form="form" :hypervisor="form.fd.hypervisor" :instance_capabilities="form.fi.capability.instance_capabilities" :osType="osType" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_308')" v-if="!isIso">
        <server-password ref="passwordRef" :form="form" :model="form.fd" :login-types="loginTypes" :isSnapshotImageType="isSnapshotImageType" :form-draft-key="vmDraftFields.loginConfig" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_104')" class="mb-0">
        <server-network
          ref="networkRef"
          :model="form.fd"
          :form="form"
          :isServertemplate="isServertemplate"
          :network-list-params="networkParam"
          :schedtag-params="schedtagParams"
          :networkVpcParams="networkVpcParams"
          :vpcResource="vpcResource"
          :hypervisor="form.fd.hypervisor"
          :serverCount="form.fd.count"
          :vpcResourceMapper="vpcResourceMapper"
          :networkResourceMapper="networkResourceMapper"
          :showMacConfig="form.fd.hypervisor === 'kvm'"
          :showDeviceConfig="form.fd.hypervisor === 'kvm'"
          :showSecgroupConfig="form.fd.hypervisor === 'kvm'"
          :secgroupParams="networkSecgroupParams"
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
        <eip-config
          ref="eipConfigRef"
          v-if="showEip"
          :model="form.fd"

          :eip-params="eipParams"
          :hypervisor="form.fd.hypervisor"
          :showBind="false"
          :isServertemplate="isServertemplate"
          :cloud-env="type"
          :form="form"
          :formItemLayout="formItemLayout"
          :form-draft-key="vmDraftFields.eip" />
        <a-form-model-item
          v-if="!isServertemplate"
          :validate-status="hostNameValidate.validateStatus"
          :help="hostNameValidate.errorMsg">
          <template #label>
            {{ $t('common_388') }}&nbsp;
            <a-tooltip :title="hostNameTips">
              <a-icon type="question-circle-o" />
            </a-tooltip>
          </template>
          <host-name ref="hostNameRef" :model="form.fd" :isWindows="isWindows" @change="handleHostNameChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_105')" v-if="isKvm">
          <secgroup-config
            ref="secgroupRef"
            :form="form"
            :model="form.fd"
            :isSnapshotImageType="isSnapshotImageType"

            :secgroup-params="secgroupParams"
            :hypervisor="form.fd.hypervisor"
            :showSecgroupBind="showSecgroupBind"
            :ignore-auto-type-reset="preserveAdvanceInitProps"
            :init-secgroups="workflowInitSecgroups" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_311')" class="mb-0">
          <sched-policy
            ref="schedPolicyRef"
            :model="form.fd"
            :form="form"
            :server-type="form.fi.createType"
            :disabled-host="policyHostDisabled"
            :policy-host-params="policyHostParams"

            :policy-schedtag-params="policySchedtagParams"
            :showSchedCloudprovider="showSchedCloudprovider"
            :cloudproviderParamsExtra="cloudproviderParamsExtra"
            :init-prefer-host="workflowInitPreferHost"
            :preserve-init-prefer-host="preserveAdvanceInitProps"
            :init-schedtags="workflowInitSchedtags"
            :form-draft-key="vmDraftFields.schedPolicy" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.repo.port_mapping')" v-if="showPortMapping">
          <labels
            ref="labelRef"
            :model="form.fd"
            :disableConf="portMappingDisableConf"
            :init-pairs="workflowInitPortMappings"
            :title="$t('compute.repo.port_mapping')"
            :keyLabel="$t('compute.repo.container_port')"
            :valueLabel="$t('compute.repo.host_port')"
            :keyPlaceholder="$t('compute.repo.example', ['443'])"
            :valuePlaceholder="$t('compute.repo.example', ['443'])"
            :valueTooltip="$t('compute.port_mappings.host_port_tip', [20000, 25000])"
            show-protocol />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1155')" class="mb-0" v-if="isKvm">
          <bios
            ref="biosRef"
            :model="form.fd"
            :form="form"
            :uefi="uefi"
            :isArm="isArm"
            :showDefault="true"
            :form-draft-key="vmDraftFields.bios" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.vdi_protocol')" class="mb-0" v-if="isKvm">
          <vdi
            ref="vdiRef"
            :model="form.fd"
            :form="form"
            :showDefault="true"
            :form-draft-key="vmDraftFields.vdi" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.vga')" class="mb-0" v-if="isKvm">
          <vga
            ref="vgaRef"
            :model="form.fd"
            :vdi="vdi"
            :form="form"
            :showDefault="true"
            :form-draft-key="vmDraftFields.vga" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.machine')" class="mb-0" v-if="isKvm">
          <machine
            ref="machineRef"
            :form="form"
            :isArm="isArm"
            :showDefault="true"
            :form-draft-key="vmDraftFields.machine" />
        </a-form-model-item>
        <a-form-model-item v-show="!isServertemplate" v-if="isKvm && isLocalDisk" :label="$t('compute.text_1156')" :extra="$t('compute.text_1157')">
          <backup
            ref="backupRef"
            :model="form.fd"
            :disabled="form.fd.systemDiskType"
            :disabled-items="backupDisableds"
            :domain="form.fd.domain"
            :availableHostCount="availableHostCount"
            :hostParams="backupHostParams"
            :form-draft-key="vmDraftFields.backup" />
        </a-form-model-item>
        <a-form-model-item v-if="isKvm" :label="$t('compute.text_494')" :extra="$t('compute.daemon.tooltip')">
          <a-switch
            :checked="!!form.fd.is_daemon"
            :checkedChildren="$t('compute.text_115')"
            :unCheckedChildren="$t('compute.text_116')"
            @change="val => { form.fd.is_daemon = val }" />
        </a-form-model-item>
        <a-form-model-item v-show="!isServertemplate" v-if="isKvm" :label="$t('dictionary.instancegroup')" :extra="$t('compute.text_1158')">
          <instance-groups
            ref="instanceGroupsRef"
            :model="form.fd"

            :params="instanceGroupsParams" />
        </a-form-model-item>
        <a-form-model-item v-show="!isServertemplate" v-if="isKvm && enableEncryption" :label="$t('compute.server.encryption')" :extra="$t('compute.server.encryption.extra')">
          <encrypt-keys
            ref="encryptKeysRef"
            :form="form"
            :model="form.fd"

            :form-draft-key="vmDraftFields.encryptKeys" />
        </a-form-model-item>
        <custom-data v-if="showCustomData" ref="customData" :model="form.fd" :form="form" />
        <!-- <a-form-item v-if="!isOpenSourceVersion" :label="$t('compute.bastionHost.bastion_host')">
          <bastion-host :form="form" :model="form.fd" :form-draft-key="vmDraftFields.bastionHost" />
        </a-form-item> -->
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
import EipConfig from '@Compute/sections/EipConfig'
import EncryptKeys from '@Compute/sections/encryptkeys'
import Vdi from '@Compute/sections/VDI'
import Vga from '@Compute/sections/VGA'
import Machine from '@Compute/sections/Machine'
import { NETWORK_OPTIONS_MAP, hasVgaGpuInPciForm } from '@Compute/constants'
import Kickstart from '@Compute/sections/Kickstart'
import OsArch from '@/sections/OsArch'
import { IMAGES_TYPE_MAP, STORAGE_TYPES, HOST_CPU_ARCHS, getOsArchParam, isOsArch, mapHostCpuArchOptions } from '@/constants/compute'
import { HYPERVISORS_MAP } from '@/constants'
import { diskSupportTypeMedium, getOriginDiskKey } from '@/utils/common/hypervisor'
import { hasPermission } from '@/utils/auth'
import mixin from './mixin'
export default {
  name: 'VM_IDCCreate',
  components: {
    SecgroupConfig,
    EipConfig,
    OsArch,
    Vdi,
    Vga,
    Machine,
    EncryptKeys,
    Kickstart,
  },
  mixins: [mixin],
  data () {
    return {
      isLocalDisk: true,
      timer: null,
      isFirstInit: true,
      storageHosts: {}, // 所有磁盘的storage-host
      storageHostParams: {}, // 第一个选择的块存储
    }
  },
  computed: {
    isKvm () {
      return this.form.fd.hypervisor === HYPERVISORS_MAP.kvm.key
    },
    isIso () {
      return this.form.fd.imageType === IMAGES_TYPE_MAP.iso.key
    },
    isArm () {
      return isOsArch(this.form.fd.os_arch, 'arm')
    },
    isLoongarch64 () {
      return isOsArch(this.form.fd.os_arch, 'loongarch64')
    },
    isRiscv64 () {
      return isOsArch(this.form.fd.os_arch, 'riscv64')
    },
    vdi () {
      return this.form.fd.vdi
    },
    hypervisors () {
      const { hypervisors = [] } = this.form.fi.capability
      return hypervisors.filter(v => v !== 'pod')
    },
    networkSecgroupParams () {
      const ret = {
        limit: 20,
        scope: this.$store.getters.scope,
      }
      if (this.form.fi.networkVpcObj && this.form.fi.networkVpcObj.id) {
        ret.vpc_id = this.form.fi.networkVpcObj.id
      }
      return ret
    },
    cloudregionParams () {
      return {
        cloud_env: 'onpremise',
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
    instanceGroupsParams () {
      return {
        ...this.scopeParams,
        enabled: true,
      }
    },
    cacheImageParams () {
      const params = {
        cloudregion_id: _.get(this.form.fd, 'cloudregion.key'),
        os_arch: getOsArchParam(this.form.fd.os_arch),
      }
      if (!params.cloudregion_id) return {}
      if (this.form.fd.imageType === 'vmware') {
        params.image_type = 'system'
      }
      return params
    },
    showSku () {
      if (this.form.fd.hypervisor) {
        return true
      }
      return false
    },
    /** 仅 IDC 且有套餐页/创建权限时展示「没有您想要的？可以新建」 */
    showSkuCreateTip () {
      if (this.type !== 'idc') return false
      if (this.$isScopedPolicyMenuHidden('sub_hidden_menus.sku')) return false
      if (!hasPermission({ key: 'serverskus_list' })) return false
      if (!hasPermission({ key: 'skus_create' })) return false
      return true
    },
    skuParam () {
      return {
        limit: 0,
        public_cloud: false,
        postpaid_status: 'available',
        cpu_core_count: this.form.fd.vcpu,
        memory_size_mb: this.form.fd.vmem,
        cloudregion: _.get(this.form, 'fd.cloudregion.key'),
        provider: 'OneCloud',
        ...this.scopeParams,
      }
    },
    policyHostParams () {
      const zone = _.get(this.form.fd, 'zone.key')
      if (zone) {
        const params = {
          enabled: 1,
          usable: true,
          zone,
          hypervisor: this.form.fd.hypervisor,
          os_arch: getOsArchParam(this.form.fd.os_arch),
          ...this.scopeParams,
        }
        if ([HYPERVISORS_MAP.esxi.key, HYPERVISORS_MAP.kvm.key].includes(params.hypervisor)) {
          if (this.form.fd.systemDiskStorage) {
            params.storage_id = this.form.fd.systemDiskStorage
          }
          if (this.storageHostParams.disk &&
            this.storageHostParams.disk !== 'system' &&
            this.storageHostParams.storageHosts &&
            this.storageHostParams.storageHosts.length &&
            !params.storage_id) {
            const diskId = this.storageHostParams.disk
            const storageId = this.form.fd.dataDiskStorages?.[diskId] || this.form.fd[`dataDiskStorages[${diskId}]`]
            if (storageId) params.storage_id = storageId
          }
          params.cloudprovider = this.form.fd.prefer_manager
        }
        return params
      }
      return {}
    },
    backupHostParams () {
      const zone = _.get(this.form.fd, 'zone.key')
      if (zone) {
        const params = {
          enabled: 1,
          usable: true,
          zone,
          hypervisor: this.form.fd.hypervisor,
          os_arch: getOsArchParam(this.form.fd.os_arch),
          ...this.scopeParams,
        }
        return params
      }
      return {}
    },
    networkParam () {
      if (!this.cloudregionZoneParams.cloudregion) return {}
      const params = {
        filter: 'server_type.notin(ipmi, pxe, eip, hostlocal)',
        usable: true,
        ...this.cloudregionZoneParams,
        ...this.scopeParams,
        host_type: 'hypervisor',
      }
      if ([HYPERVISORS_MAP.esxi.key].includes(this.form.fd.hypervisor)) {
        params.host_type = 'esxi'
      }
      if ([HYPERVISORS_MAP.proxmox.key].includes(this.form.fd.hypervisor)) {
        params.host_type = 'proxmox'
      }
      if ([HYPERVISORS_MAP.esxi.key, HYPERVISORS_MAP.kvm.key].includes(this.form.fd.hypervisor)) {
        if (this.form.fd.systemDiskStorage) {
          params.storage_id = this.form.fd.systemDiskStorage
        }
        if (this.storageHostParams.disk &&
          this.storageHostParams.disk !== 'system' &&
          this.storageHostParams.storageHosts &&
          this.storageHostParams.storageHosts.length &&
          !params.storage_id) {
          const diskId = this.storageHostParams.disk
          const storageId = this.form.fd.dataDiskStorages?.[diskId] || this.form.fd[`dataDiskStorages[${diskId}]`]
          if (storageId) params.storage_id = storageId
        }
      }
      return params
    },
    instanceSpecParmas () {
      return {
        usable: true,
        enabled: true,
        cloudregion: _.get(this.form.fd, 'cloudregion.key'),
      }
    },
    collectPciModels () {
      const fd = this.form.fd
      const pciModels = []
      if (fd.pciModel && typeof fd.pciModel === 'object' && !Array.isArray(fd.pciModel)) {
        Object.values(fd.pciModel).forEach((v) => {
          if (R.is(Array, v)) pciModels.push(...v)
          else if (v != null && v !== '') pciModels.push(v)
        })
        return pciModels
      }
      Object.keys(fd).filter(key => key.includes('pciModel')).forEach(key => {
        if (R.is(Array, fd[key])) {
          pciModels.push(...fd[key])
        } else {
          pciModels.push(fd[key])
        }
      })
      return pciModels
    },
    uefi () {
      const { pciEnable } = this.form.fd
      const pciModels = this.collectPciModels
      if (this.isKvm && pciEnable && pciModels.length) {
        if (this.isWindows && hasVgaGpuInPciForm(this.form.fd)) {
          return true
        }
      }
      return false
    },
    vgaPci () {
      const { pciEnable } = this.form.fd
      const pciModels = this.collectPciModels
      if (this.isKvm && pciEnable && pciModels.length) {
        if (hasVgaGpuInPciForm(this.form.fd)) {
          return true
        }
      }
      return false
    },
    cloudproviderParamsExtra () {
      const params = {
        ...this.scopeParams,
      }
      if (this.cloudregionZoneParams?.cloudregion) {
        params.cloudregion_id = this.cloudregionZoneParams.cloudregion
      }
      return params
    },
    showSchedCloudprovider () { // 创建VMware机器时，镜像类型不是 VMware 平台镜像时调度策略可以选择指定云账号
      let show = false
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.esxi.key) {
        if (this.form.fd.imageType !== IMAGES_TYPE_MAP.vmware.key) {
          show = true
        }
        if (!this.form.fd.systemDiskStorage) {
          show = true
        }
      }
      return show
    },
    systemdiskSizeDisabled () {
      // if (this.form.fd.hypervisor === HYPERVISORS_MAP.esxi.key) {
      //   const vmLocalImageType = [IMAGES_TYPE_MAP.vmware.key]
      //   if (vmLocalImageType.includes(this.form.fd.imageType)) {
      //     return true
      //   }
      // }
      return false
    },
    systemdiskDefaultSize () {
      if (this.isIso) {
        return 30
      }
      return null
    },
    availableHostCount () { // 可用的宿主机数量
      if (R.is(Object, this.form.fi.capability)) {
        return this.form.fi.capability.available_host_count || 0
      }
      return 0
    },
    eipParams () {
      if (!this.cloudregionZoneParams.cloudregion) return {}
      return {
        project: this.project,
        region: this.cloudregionZoneParams.cloudregion,
      }
    },
    showEip () {
      const { vpcs, networkType } = this.form.fd
      if (networkType === NETWORK_OPTIONS_MAP.default.key) {
        return false
      }
      if (R.is(Object, vpcs)) {
        const vpcList = Object.values(vpcs)
        if (vpcList.length && !~vpcList.indexOf('default')) {
          return this.enableEip
        }
      }
      return false
    },
    storageParams () {
      const { systemDiskType = {}, hypervisor } = this.form.fd
      let key = systemDiskType.key || ''
      const params = {
        ...this.scopeParams,
        // usable: true, // 包含了 enable:true, status为online的数据
        brand: HYPERVISORS_MAP[this.form.fd.hypervisor]?.brand, // kvm,vmware支持指定存储
        manager: this.form.fd.prefer_manager,
      }

      // 磁盘区分介质
      if (diskSupportTypeMedium(hypervisor)) {
        const medium = getOriginDiskKey(key, true)
        key = getOriginDiskKey(key)
        params.filter = [
          `storage_type.contains("${key}")`,
          `medium_type.contains("${medium}")`,
        ]
      } else {
        params.filter = [
          `storage_type.contains("${key}")`,
        ]
      }
      return params
    },
    dataDiskStorageParams () {
      const { dataDiskSizes = {}, hypervisor } = this.form.fd
      let dataDiskType = ''
      let medium = ''
      for (const key in dataDiskSizes) {
        const typeObj = this.form.fd.dataDiskTypes?.[key] || this.form.fd[`dataDiskTypes[${key}]`]
        if (typeObj) {
          dataDiskType = typeObj.key
          // 磁盘区分介质
          if (diskSupportTypeMedium(hypervisor)) {
            medium = getOriginDiskKey(dataDiskType, true)
            dataDiskType = getOriginDiskKey(dataDiskType)
          } else {
            dataDiskType = getOriginDiskKey(dataDiskType)
          }
        }
      }
      const params = {
        ...this.scopeParams,
        // usable: true, // 包含了 host status online 和 account 正常
        brand: HYPERVISORS_MAP[this.form.fd.hypervisor]?.brand, // kvm,vmware支持指定存储
        manager: this.form.fd.prefer_manager,
      }
      if (dataDiskType) {
        if (medium) {
          params.filter = [
            `storage_type.contains("${dataDiskType}")`,
            `medium_type.contains("${medium}")`,
          ]
        } else {
          params.filter = [`storage_type.contains("${dataDiskType}")`]
        }
      }
      return params
    },
    isStorageShow () { // 是否开启了指定存储
      if ([HYPERVISORS_MAP.esxi.key, HYPERVISORS_MAP.kvm.key].includes(this.form.fd.hypervisor)) {
        if (this.form.fd.systemDiskStorage) {
          return true
        }
        if (this.storageHostParams.disk &&
          this.storageHostParams.disk !== 'system' &&
          this.storageHostParams.storageHosts &&
          this.storageHostParams.storageHosts.length) {
          const diskId = this.storageHostParams.disk
          if (this.form.fd.dataDiskStorages?.[diskId] || this.form.fd[`dataDiskStorages[${diskId}]`]) {
            return true
          }
        }
      }
      return false
    },
    imageParams () {
      const params = {
        ...this.scopeParams,
        os_arch: getOsArchParam(this.form.fd.os_arch),
      }
      return params
    },
    archOptions () {
      let opts = []
      if (this.form.fi.capability.host_cpu_archs && this.form.fi.capability.host_cpu_archs.length) {
        opts = mapHostCpuArchOptions(this.form.fi.capability.host_cpu_archs)
      }
      return opts.sort((a, b) => a.order - b.order)
    },
    extra () {
      if (this.isIso && this.isWindows) {
        return this.$t('compute.iso_windows_help')
      }
      return this.$t('compute.text_302')
    },
    enableEncryption () {
      return this.$appConfig.isPrivate && !this.$store.getters.isSysCE
    },
    isShowAgent () {
      if (this.isIso || !this.osType) return false
      if (this.isWindows) {
        return !this.isArm
      }
      return true
    },
  },
  watch: {
    'form.fi.imageMsg': {
      deep: true,
      handler (val, oldVal) {
        if (R.equals(val, oldVal)) return
        this.$nextTick(() => {
          // 回填期间镜像异步到位：不要清 imageType / 不要按镜像重置盘
          if (this.isFormBackfill || this.form?.fi?.diskDraftRestoring) return
          if (this.canUseCreateFormDraft && !this._diskDraftSkipImageResetOnce) {
            // 仅同 session 数据盘草稿才跳过清空；跨 tab local 不回填数据盘，无需保护
            if (!this.isCreateFormFieldDraftFromLocal(this.vmDraftFields.dataDisk)) {
              const diskDraft = this.readCreateFormFieldDraft(this.vmDraftFields.dataDisk)
              if (diskDraft?.__dataDiskKeys?.length) {
                this._diskDraftSkipImageResetOnce = true
                return
              }
            }
          }
          // this.form.fi.dataDiskDisabled = false
          // this.form.fi.sysDiskDisabled = false
          this.form.fi.imageType = ''
          if (this.form.fd.imageType === IMAGES_TYPE_MAP.host.key) {
            const { root_image: rootImage, data_images: dataImages } = this.form.fi.imageMsg
            const systemDiskSize = rootImage.min_disk_mb / 1024
            const { hypervisor } = this.form.fd
            const { data_storage_types2 } = this.form.fi.capability
            const medium = data_storage_types2[hypervisor][0].split('/')[1]
            const systemDiskType = {
              key: data_storage_types2[hypervisor][0],
              label: STORAGE_TYPES[HYPERVISORS_MAP.kvm.key].local.label,
            }
            this.setFormFieldsAndSyncFd({
              systemDiskSize,
              systemDiskType,
            })
            // 重置数据盘数据
            this._resetDataDisk()
            if (dataImages) {
              dataImages.forEach(val => {
                this.$refs.dataDiskRef.add({ size: val.min_disk_mb / 1024, min: val.min_disk_mb / 1024, minusDisabled: true, medium })
              })
            }
          }
          if (this.form.fd.imageType === IMAGES_TYPE_MAP.snapshot.key || this.form.fd.imageType === IMAGES_TYPE_MAP.backup.key) {
            // 镜像类型为主机快照或主机备份的话要回填数据并禁用
            const snapshots = _.cloneDeep(this.form.fi.imageMsg.server_config.disks)
            if (!snapshots) return
            let sysDisk = snapshots.find(val => val.disk_type === 'sys')
            if (!sysDisk) {
              sysDisk = snapshots.shift()
            }
            const dataDisks = snapshots.filter(val => val.disk_type !== 'sys')
            const { matchType, matchLabel } = this.matchStorage(sysDisk.backend, sysDisk.medium, 'storage_types2')
            const data = {
              systemDiskType: {
                key: matchType,
                label: matchLabel || STORAGE_TYPES[HYPERVISORS_MAP.kvm.key][matchType].label,
              },
              systemDiskSize: sysDisk.size / 1024,
            }
            if (val && R.is(Object, val.server_config)) {
              if (val.server_config.vcpu_count) {
                const cpuValue = val.server_config.vcpu_count
                data.vcpu = cpuValue
                this.cpuChange(cpuValue)
                if (val.server_config.vmem_size) data.vmem = val.server_config.vmem_size
              }
            }
            this.setFormFieldsAndSyncFd(data)
            // 重置数据盘数据
            this._resetDataDisk()
            dataDisks.forEach(val => {
              const { matchType, matchMedium } = this.matchStorage(val.backend, val.medium, 'data_storage_types2')
              this.$refs.dataDiskRef.add({ diskType: matchType, size: val.size / 1024, sizeDisabled: true, medium: matchMedium })
            })
            this.form.fi.imageType = this.form.fd.imageType
            // this.form.fi.dataDiskDisabled = true
            // this.form.fi.sysDiskDisabled = true
          } else {
            if (oldVal && R.is(Object, oldVal.server_config)) { // 说明是从主机快照切换过去的
              this.cpuChange(this.form.fd.vcpu)
            }
          }
        })
      },
    },
    // onValuesChange → form.fd watches（capability / sku / disk / sched / backup）
    'form.fd.zone' (val, oldVal) {
      if (R.equals(val, oldVal)) return
      this.fetchCapability()
    },
    'form.fd.cloudregion' (val, oldVal) {
      if (R.equals(val, oldVal)) return
      this.fetchCapability()
      this.$nextTick(this.fetchInstanceSpecs)
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
    'form.fd.backupEnable' (val) {
      if (!val) return
      const keepBackup = this.isFormBackfill ||
        this.form?.fi?.advanceDraftRestoring ||
        this.$refs.backupRef?.pendingBackup ||
        this.$refs.backupRef?.backupDraftRestoring
      if (!keepBackup) {
        this.form.fd.backup = undefined
      }
    },
    'form.fd.systemDiskType': {
      deep: true,
      handler () { this.setIsLocalDisk() },
    },
    'form.fd.dataDiskTypes': {
      deep: true,
      handler () { this.setIsLocalDisk() },
    },
    uefi (val) {
      this.setBios(val)
    },
    isArm (val, oldV) {
      this.setBios(val)
    },
    isShowAgent (val) {
      this.$nextTick(() => {
        if (!this.form?.fd) return
        if (!val) {
          this.form.fd.deploy_telegraf = false
          return
        }
        // 控件草稿优先：镜像/架构异步到位后不要把草稿 false 冲成 true
        if (this.canUseCreateFormDraft) {
          const draft = this.readCreateFormFieldDraft(this.vmDraftFields.deployTelegraf)
          if (draft !== null && draft !== undefined) {
            this.form.fd.deploy_telegraf = !!draft
            return
          }
        }
        this.form.fd.deploy_telegraf = true
      })
    },
    'form.fd.imageType': {
      handler (val) {
        if (val === IMAGES_TYPE_MAP.iso.key) {
          this.form.fd.kickstart_enabled = false
        }
      },
    },
  },
  mounted () {
    // this.$nextTick(() => {
    //   this.init()
    // })
  },
  unmounted () {
    this.timer = null
  },
  methods: {
    matchStorage (backend, medium, key) {
      const { hypervisor } = this.form.fd
      const types = (this.form.fi.capability[key] || {})[hypervisor] || []
      const typeMaths = types.filter(val => val.split('/')[0] === backend)
      const mediumMaths = typeMaths.filter(val => val.split('/')[1] === medium)
      if (mediumMaths.length) {
        return {
          matchType: mediumMaths[0],
          matchLabel: STORAGE_TYPES[hypervisor]?.[mediumMaths[0].split('/')[1]]?.label || mediumMaths[0],
        }
      }
      if (typeMaths.length) {
        return {
          matchType: typeMaths[0],
          matchLabel: STORAGE_TYPES[hypervisor]?.[typeMaths[0].split('/')[1]]?.label || typeMaths[0],
        }
      }
      return { matchType: `${backend}/${medium}`, matchLabel: '' }
    },
    vpcResourceMapper (list) {
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.esxi.key) {
        return list.filter(val => val.id === 'default')
      }
      return list
    },
    storageHostChange (val) {
      const { disk } = this.storageHostParams
      if (val.disk) {
        this.storageHosts[val.disk] = val
      }
      // 由第一块选择块存储的盘来确定块存储所在的host
      if (!disk || disk === val.disk) { // 第一块盘选
        if (val.storageHosts && val.storageHosts.length) {
          this.storageHostParams = val
        } else { // 清空操作
          let changeNew = false
          for (const key in this.storageHosts) {
            if (this.storageHosts[key].storageHosts && this.storageHosts[key].storageHosts.length) {
              this.storageHostParams = this.storageHosts[key] // 选其他已选的hosts作为新的范围
              changeNew = true
              break
            }
          }
          if (!changeNew) this.storageHostParams = {}
        }
      }
    },
    setIsLocalDisk () {
      const isLocal = (v = '') => { return v.startsWith('local') }
      const isSysLocal = isLocal(_.get(this.form, 'fd.systemDiskType.key'))
      let isDiskLocal = true
      const { dataDiskTypes } = this.form.fd || {}
      if (R.is(Object, dataDiskTypes)) {
        const diskTypeItem = dataDiskTypes[Object.keys(dataDiskTypes)[0]]
        if (diskTypeItem && diskTypeItem.key) {
          isDiskLocal = isLocal(diskTypeItem.key)
        }
      }
      this.isLocalDisk = isSysLocal && isDiskLocal
    },
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
          let hypervisors = R.is(Object, data) ? (data.hypervisors || []) : []
          if (hypervisors.includes(HYPERVISORS_MAP.kvm.key)) { // kvm 排序为第一个
            hypervisors = [HYPERVISORS_MAP.kvm.key].concat(hypervisors).filter(val => val !== 'baremetal')
          }
          hypervisors = Array.from(new Set(hypervisors))
          this.form.fi.capability = {
            ...data,
            hypervisors,
          }
          this.form.fd.hypervisor = this.form.fd.hypervisor || hypervisors[0]
          const osArchInit = this.form.fd.os_arch
          if (osArchInit) {
            setTimeout(() => {
              this.form.fd.os_arch = osArchInit
            }, 1000)
          }
          this.init()
          this.$nextTick(this.fetchInstanceSpecs)
        })
    },
    fetchInstanceSpecs () {
      if (!this.instanceSpecParmas.cloudregion) return
      this.serverskusM.get({ id: 'instance-specs', params: this.instanceSpecParmas })
        .then(({ data }) => {
          this.form.fi.cpuMem = data
          this.cpuChange(this.form.fd.vcpu)
        })
    },
    setBios (val) {
      const biosKey = 'bios'
      this.form.fd[biosKey] = val ? 'UEFI' : 'BIOS'
    },
    gpuChange (val) {
      if (!val) {
        this.form.fd.gpu = ''
      }
    },
    init () {
      if (this.isFirstInit) {
        this.initOsArch()
        this.isFirstInit = false
      }
    },
    initOsArch () {
      this.timer = setTimeout(() => {
        const { os_arch } = this.$route.query
        // 数据延迟回填
        if (os_arch) {
          let canUseOsArch = ''
          if (os_arch.indexOf('x86') !== -1) {
            canUseOsArch = HOST_CPU_ARCHS.x86.key
          } else if (os_arch.indexOf('aarch') !== -1) {
            canUseOsArch = HOST_CPU_ARCHS.arm.key
          }
          if (!canUseOsArch) return
          this.form.fd.os_arch = canUseOsArch
        }
      }, 3000)
    },
  },
}
</script>
