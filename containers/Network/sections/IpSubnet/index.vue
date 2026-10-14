<template>
  <component :is="itemTag" :labelCol="labelCol" :wrapperCol="wrapperCol" :label="label" :required="isRequired">
    <a-row :gutter="8">
      <a-col :span="showIpConfig ? 8 : 12">
        <component
          :is="itemTag"
          :wrapperCol="{ span: 24 }"
          class="mb-0 mr-1"
          :prop="vpcField">
          <base-select
            ref="vpcSelect"
            class="w-100"
            :value="fieldVal(resolvedFields.vpc)"
            @change="v => fieldSet(resolvedFields.vpc, v)"
            :resource="vpcResource"
            remote
            :label-format="vpcLabelFormat"
            :isDefaultSelect="true"
            :need-params="true"
            :params="vpcParmasConcat"
            :mapper="vpcResourceMapper"
            v-model:item="selectedVpc"
            :select-props="{ allowClear: true, placeholder: $t('compute.text_194') }"
            @update:initLoaded="onVpcInitLoaded" />
        </component>
      </a-col>
      <a-col :span="showIpConfig ? 8 : 12">
        <component
          :is="itemTag"
          :wrapperCol="{ span: 24 }"
          class="mb-0 mr-1"
          :prop="networkField">
          <base-select
            ref="networkSelect"
            class="w-100"
            :value="fieldVal(resolvedFields.network)"
            @change="v => fieldSet(resolvedFields.network, v)"
            resource="networks"
            remote
            :need-params="true"
            :isDefaultSelect="true"
            :params="networkParamsConcat"
            :mapper="networkResourceMapper"
            :select-props="{ allowClear: true, placeholder: $t('compute.text_195') }"
            @update:initLoaded="onNetworkInitLoaded" />
            <div slot="extra" v-if="helplink">
              {{helplink.ipSubnetHelp}}<help-link :href="helplink.ipSubnetHref">{{$t('network.text_26')}}</help-link>
            </div>
        </component>
      </a-col>
      <a-col :span="8" v-if="showIpConfig">
        <a-button v-if="!ipShow" type="link" class="mr-1 mt-1" @click="triggerShowIp">{{$t('compute.text_198')}}</a-button>
        <a-row v-else>
          <a-col :span="21">
            <component :is="itemTag" class="mb-0" :wrapperCol="{ span: 24 }" :prop="ipAddrField">
              <a-input
                :placeholder="$t('compute.text_197')"
                :value="fieldVal(resolvedFields.ip_addr)"
                @update:value="v => fieldSet(resolvedFields.ip_addr, v)" />
            </component>
          </a-col>
          <a-col :span="3">
            <a-button type="link" class="mt-1" @click="triggerShowIp">{{$t('compute.text_135')}}</a-button>
          </a-col>
        </a-row>
      </a-col>
    </a-row>
  </component>
</template>

<script>
import i18n from '@/locales'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'
import { EIP_SUBNET_FIELDS } from '@/sections/IpSubnet/ipSubnetsFields'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'IpSubnet',
  mixins: [createFormFieldDraftMixin],
  // 对象写法，避免覆盖 mixin 草稿 inject
  inject: {
    form: { default: undefined },
  },
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    /** a-form-model：与 fields 字段名对齐的受控对象 */
    model: {
      type: Object,
      default: null,
    },
    labelCol: {
      type: Object,
      default: () => {
        return {
          span: 24,
        }
      },
    },
    wrapperCol: {
      type: Object,
      default: () => {
        return {
          span: 24,
        }
      },
    },
    label: {
      type: String,
      default: i18n.t('dictionary.region'),
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    fields: {
      type: Object,
      default: null,
    },
    networkParams: {
      type: Object,
    },
    networkResourceMapper: {
      type: Function,
      default: (data) => { return data },
    },
    vpcParams: {
      type: Object,
    },
    vpcResource: {
      type: String,
      default: 'vpcs', // 还可能是这样的resource cloudregions/{region_id}/vpcs
    },
    vpcResourceMapper: {
      type: Function,
      default: data => { return data },
    },
    showIpConfig: {
      type: Boolean,
      default: true,
    },
    helplink: {
      type: Object,
    },
  },
  data () {
    return {
      ipShow: false,
      selectedVpc: {},
    }
  },
  computed: {
    resolvedFields () {
      return this.fields || EIP_SUBNET_FIELDS
    },
    itemTag () {
      return 'a-form-model-item'
    },
    vpcField () {
      return (Array.isArray(this.resolvedFields.vpc) && this.resolvedFields.vpc[0]) || 'vpc'
    },
    networkField () {
      return (Array.isArray(this.resolvedFields.network) && this.resolvedFields.network[0]) || 'network'
    },
    ipAddrField () {
      return (Array.isArray(this.resolvedFields.ip_addr) && this.resolvedFields.ip_addr[0]) || 'ip_addr'
    },
    vpcParmasConcat () {
      return {
        limit: 0,
        show_emulated: true,
        ...this.vpcParams,
      }
    },
    networkParamsConcat () {
      return {
        vpc: this.selectedVpc.id,
        usable: true,
        ...this.networkParams,
      }
    },
  },
  watch: {
    selectedVpc (val) {
      if (this._ipSubnetDraftRestoring || this._pendingIpSubnetDraft) {
        this.$nextTick(() => this.tryApplyPendingIpSubnetDraft())
      }
    },
    'form.fd.network' () {
      if (this._ipSubnetDraftRestoring || this._pendingIpSubnetDraft) {
        this.$nextTick(() => this.tryApplyPendingIpSubnetDraft())
      }
    },
    vpcParmasConcat: {
      deep: true,
      handler () {
        if (this._pendingIpSubnetDraft) {
          this.$nextTick(() => this.tryApplyPendingIpSubnetDraft())
        }
      },
    },
  },
  created () {
    this._pendingIpSubnetDraft = null
    this._ipSubnetDraftRestoring = false
    this.initModelFields()
  },
  methods: {
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const v = this.model[name]
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      if (!resolveFieldMeta(fieldTuple)) return
      this.$set(this.model, resolveFieldMeta(fieldTuple)?.name, value)
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          rule.validator(rule, value, (err) => {
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          })
          return
        }
        resolve()
      })
    },
    async validate () {
      for (const key of ['vpc', 'network', 'ip_addr']) {
        const fieldDef = this.resolvedFields[key]
        if (!resolveFieldMeta(fieldDef)) continue
        const rules = resolveFieldMeta(fieldDef)?.rules || []
        for (const rule of rules) {
          await this.runFieldRule(rule, this.fieldVal(fieldDef))
        }
      }
      return true
    },
    initModelFields () {
      ;['vpc', 'network', 'ip_addr'].forEach((key) => {
        const fieldDef = this.resolvedFields[key]
        const meta = resolveFieldMeta(fieldDef)
        if (!meta) return
        const { name, ...opts } = meta
        if (this.model[name] === undefined && opts.initialValue !== undefined) {
          this.$set(this.model, name, opts.initialValue)
        } else if (this.model[name] === undefined) {
          this.$set(this.model, name, undefined)
        }
      })
    },
    getCreateFormFieldDraftSnapshot () {
      return null
    },
    applyCreateFormFieldDraft () {},
    async tryApplyPendingIpSubnetDraft () {
      const draft = this._pendingIpSubnetDraft
      if (!draft || this._ipSubnetDraftRestoring) return

      this._ipSubnetDraftRestoring = true
      try {
        if (draft.vpc) {
          const vpcList = this.$refs.vpcSelect?.sourceList || []
          if (!vpcList.length) return
          if (!vpcList.some(item => item.id === draft.vpc)) {
            this._pendingIpSubnetDraft = null
            return
          }
          this.$set(this.model, this.vpcField, draft.vpc)
          if (!this.selectedVpc?.id || this.selectedVpc.id !== draft.vpc) {
            this.selectedVpc = { ...(this.selectedVpc || {}), id: draft.vpc }
          }
          await this.$nextTick()
        }

        if (draft.network) {
          await this.$nextTick()
          const networkList = this.$refs.networkSelect?.sourceList || []
          if (!networkList.length) return
          if (!networkList.some(item => item.id === draft.network)) {
            draft.network = undefined
            this.$set(this.model, this.networkField, undefined)
          } else {
            this.$set(this.model, this.networkField, draft.network)
          }
        }

        const vpcOk = !draft.vpc || this.model[this.vpcField] === draft.vpc
        const networkOk = !draft.network || this.model[this.networkField] === draft.network
        if (vpcOk && networkOk) {
          this._pendingIpSubnetDraft = null
        } else {
          await this.$nextTick()
          this.tryApplyPendingIpSubnetDraft()
        }
      } finally {
        this._ipSubnetDraftRestoring = false
      }
    },
    onVpcInitLoaded () {
      if (this._pendingIpSubnetDraft) this.$nextTick(() => this.tryApplyPendingIpSubnetDraft())
    },
    onNetworkInitLoaded () {
      if (this._pendingIpSubnetDraft) this.$nextTick(() => this.tryApplyPendingIpSubnetDraft())
    },
    triggerShowIp () {
      const next = !this.ipShow
      if (!next) {
        // 取消指定 IP：清字段，避免展示关闭但提交仍带 ip
        this.$set(this.model, this.ipAddrField, undefined)
        if (this.form && this.form.fd) this.$delete(this.form.fd, this.ipAddrField)
      }
      this.ipShow = next
    },
    vpcLabelFormat (item) {
      if (!item.cidr_block) return item.name
      return `${item.name}（${item.cidr_block}）`
    },
  },
}
</script>
