<template>
  <div>
    <a-form-model
      ref="formRef"
      class="mt-3"
      :model="form.fd"
      :rules="modelRules"
      @submit="handleConfirm">
      <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])" v-bind="formItemLayout">
        <domain-project
          ref="domainProjectRef"
          :form="form.fd"
          v-model:project="projectId"
          v-model:domain="domainId"
          :ignoreStorage="ignoreLocalFormStorage"
          :form-draft-key="baremetalDraftFields.domainProject" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_177')" class="mb-0" v-bind="formItemLayout" v-if="!isInstallOperationSystem" prop="zone">
        <cloudregion-zone
          ref="cloudregionZoneRef"
          :model="form.fd"
          :zone-params="params.zone"
          :cloudregion-params="params.region"
          :form-draft-key="baremetalDraftFields.cloudregionZone"
          filterBrandResource="compute_engine"
          @update:cloudregion="onCloudregionUpdate"
          @update:zone="onZoneUpdate" />
      </a-form-model-item>
      <a-form-model-item
        :label="$t('compute.text_228')"
        v-bind="formItemLayout"
        :extra="$t('compute.text_301')"
        prop="name">
        <a-input v-model:value="form.fd.name" :placeholder="$t('validator.resourceCreateName')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_312')" v-bind="formItemLayout" v-if="!isInstallOperationSystem" prop="description">
        <a-input v-model:value="form.fd.description" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_294')" v-bind="formItemLayout" prop="count">
        <a-input-number v-model:value="form.fd.count" :min="1" :max="100" :disabled="isInstallOperationSystem" />
      </a-form-model-item>
      <!-- ServerPassword / ServerNetwork / OsSelect 已 end-state（:model + validate） -->
      <a-form-model-item v-bind="formItemLayout" :label="$t('compute.text_267')" :extra="$t('compute.text_302')">
        <os-select
          ref="osSelectRef"
          type="baremetal"
          :form="form"
          :model="form.fd"
          :types="osSelectTypes"
          hypervisor="baremetal"
          :image-params="imageParams"
          :ignore-storage="ignoreLocalFormStorage"
          :form-draft-key="baremetalDraftFields.osSelect"
          @updateImageMsg="setSelectedImage"
          v-model:imageType="osSelectImageType" />
      </a-form-model-item>
      <a-form-model-item v-bind="formItemLayout" :label="$t('compute.text_178')" prop="specifications">
        <a-select v-model:value="form.fd.specifications" @change="specificationChange" :disabled="isInstallOperationSystem">
          <a-select-option v-for="i in specOptions" :key="i.value" :value="i.value">
            {{i.text}}
          </a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item v-bind="formItemLayout" :label="$t('compute.text_303')">
        <div class="d-flex flex-wrap">
          <template v-for="(item, idx) of diskOptionsDate" :key="idx">
            <div class="disk-option-item">
              <a-card hoverable>
                <template slot="title">
                  <icon type="res-disk" />
                  {{ item.title }}
                  <a-tooltip :title="$t('compute.text_304')">
                    <icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" v-show="(idx === 0 && !isShowFalseIcon) || idx !== 0" />
                  </a-tooltip>
                  <a-tooltip :title="$t('compute.text_305')">
                    <icon type="close-circle" theme="twoTone" twoToneColor="#eb2f96" v-show="idx === 0 && isShowFalseIcon" />
                  </a-tooltip>
                </template>
                <a href="javascript:;" slot="extra" @click="handleDiskItemRemove(idx)" v-show="idx === diskOptionsDate.length - 1">{{$t('compute.perform_delete')}}</a>
                <div class="d-flex align-items-center">
                  <ve-pie :data="item.chartData" :settings="chartSettings" :events="chartFun(idx)" width="200px" height="200px" :legend-visible="false" />
                  <div class="flex-fill ml-2">
                    <template v-for="k in item.diskInfo" :key="k">
                      <div>
                        <a-checkbox defaultChecked disabled>
                          {{k}}
                        </a-checkbox>
                      </div>
                    </template>
                    <a-tag color="blue">{{$t('compute.text_306', [item.size])}}</a-tag>
                  </div>
                </div>
              </a-card>
            </div>
          </template>
        </div>
      </a-form-model-item>
      <a-form-model-item v-bind="offsetFormItemLayout">
        <a-button type="primary" @click="addDisk" :disabled="specOptions.length === 0">{{$t('compute.text_307')}}</a-button>
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_308')" v-bind="formItemLayout" v-if="!isCheckedIso">
        <server-password ref="passwordRef" :form="form" :model="form.fd" :login-types="loginTypes" :isSnapshotImageType="false" :form-draft-key="baremetalDraftFields.loginConfig" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1154')" class="mb-0" v-bind="formItemLayout" prop="__meta__">
        <tag
          v-model:value="form.fd.__meta__"
          :allowNoValue="false"
          :default-checked="tagDefaultChecked" />
      </a-form-model-item>
      <a-divider orientation="left">{{$t('compute.text_309')}}</a-divider>
      <a-form-model-item :label="$t('compute.text_104')" v-bind="formItemLayout" class="mb-0">
        <server-network
          ref="networkRef"
          :model="form.fd"
          :form="form"
          :isBonding="isBonding"
          :network-list-params="networkParam"
          :network-resource-mapper="networkResourceMapper"
          :schedtag-params="params.policySchedtag"
          :networkVpcParams="params.vpcParams"
          :vpcResource="vpcResource"
          :vpcResourceMapper="vpcResourceMapper"
          :ignore-auto-network-type="isFormBackfill"
          :form-draft-key="baremetalDraftFields.serverNetwork" />
      </a-form-model-item>
      <a-form-model-item v-bind="offsetFormItemLayout">
        <a-checkbox v-model:checked="isBonding">{{$t('compute.text_310')}}</a-checkbox>
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_311')" v-bind="formItemLayout" class="mb-0" v-if="!isInstallOperationSystem">
        <sched-policy
          ref="schedPolicyRef"
          server-type="baremetal"
          :model="form.fd"
          :form="form"
          :disabled-host="policyHostDisabled"
          :policy-host-params="params.policyHostParams"

          :policy-schedtag-params="policySchedtagParams"
          :init-schedtags="schedPolicyInitSchedtags"
          :init-prefer-host="workflowInitPreferHost"
          :preserve-init-prefer-host="preserveAdvanceInitProps"
          :form-draft-key="baremetalDraftFields.schedPolicy"
          @change="hostChange"
          :hostData="filterHostData" />
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_312')" v-bind="formItemLayout" v-if="isInstallOperationSystem" prop="description">
        <a-input v-model:value="form.fd.description" />
      </a-form-model-item>
      <bottom-bar
        :loading="submiting"
        :form="form"
        :selectedSpecItem="selectedSpecItem"
        type="baremetal"
        :isOpenWorkflow="isOpenWorkflow"
        :isOpenOrderSetWorkflow="isOpenOrderSetWorkflow"
        v-model:errors="errors"
        :isServertemplate="false"
        :hasMeterService="hasMeterService"
        :isInitForm="isInitForm"
        :isModifyWorkflow="isModifyWorkflow"
        @add-cart="addShopCart"
        @cancel="handleCancel" />
    </a-form-model>
  </div>
</template>
<script>
import WindowsMixin from '@/mixins/windows'
import workflowMixin from '@/mixins/workflow'
import CreateMixin from './mixins'

export default {
  name: 'BaremetalCreateIDC',
  mixins: [WindowsMixin, workflowMixin, CreateMixin],
  // onValuesChange → CreateMixin watch form.fd.*（zone/cloudregion/imageType/domain）
}
</script>

<style lang="less" scoped>
.disk-option-item {
  & + .disk-option-item {
    margin-left: 15px;
  }
}
</style>
