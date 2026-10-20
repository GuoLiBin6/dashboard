<template>
  <div class="rds-create-index pb-5">
    <page-header :title="$t('db.text_140')" />
    <a-form-model
      ref="formRef"
      hideRequiredMark
      class="mt-3"
      :model="form.fd"
      :rules="rules">
      <a-form-model-item :label="$t('db.text_139', [$t('dictionary.project')])" prop="project">
        <domain-project
          ref="domainProjectRef"
          :form="form.fd"
          :labelInValue="false"
          :form-draft-key="rdsDraftFields.domainProject"
          @fetchDomainCallback="fetchDomainCallback"
          @fetchProjectCallback="fetchProjectCallback" />
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_60')" prop="generate_name">
        <a-input v-model:value="form.fd.generate_name" :placeholder="$t('validator.resourceCreateName')" />
        <template #extra>
          <name-repeated
            res="dbinstances"
            :name="form.fd.generate_name"
            :default-text="$t('db.text_142')" />
        </template>
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')" prop="description">
        <a-textarea
          v-model:value="form.fd.description"
          :auto-size="{ minRows: 1, maxRows: 3 }"
          :placeholder="$t('common_367')" />
      </a-form-model-item>
      <clearing-radios :model="form.fd" :auto_renew="false" />
      <a-form-model-item :label="$t('db.text_71')" v-if="form.fd.billing_type !== 'prepaid'">
        <duration
          :model="form.fd"
          :form="form"
          :form-draft-key="rdsDraftFields.duration"
          v-model:durationStandard="form.fd.durationStandard"
          v-model:duration="form.fd.duration" />
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_265')" prop="__count__">
        <a-input-number v-model:value="form.fd.__count__" />
      </a-form-model-item>
      <!-- 区域 -->
      <item-area
        ref="ITEM_AREA"
        :model="form.fd"
        :billingType="form.fd.billing_type"
        v-if="form.fd.project"
        class="mb-0"
        :isRequired="true"
        :names="['provider', 'cloudregion']"
        :defaultActiveFirstOption="true"
        filterBrandResource="rds_engine"
        @fetchsDone="onAreaSelectsFetchsDone" />
      <!-- 套餐信息 -->
      <s-k-u ref="SKU" />
      <a-form-model-item v-if="form.fd.provider !== 'Aliyun'" :label="$t('db.text_143')">
        <server-password
          ref="passwordRef"
          :model="form.fd"
          :loginTypes="loginTypes"
          :form="form" />
      </a-form-model-item>
      <item-network ref="NETWORK" :model="form.fd" @vpcListChange="handleVpcListChange" />
      <a-form-model-item v-if="showSecgroup(form)" :label="$t('db.text_144')">
        <secgroup-config
          ref="secgroupRef"
          :model="form.fd"
          :max="getSecgroupMax(form)"

          :form="form"
          :secgroup-params="secgroupParams" />
      </a-form-model-item>
      <!-- 标签 -->
      <a-form-model-item :label="$t('table.title.tag')" class="mb-3" prop="__meta__">
        <tag
          :value="form.fd.__meta__"
          @change="v => { form.fd.__meta__ = v }"
          :allowNoValue="false"
          :default-checked="tagDefaultChecked" />
      </a-form-model-item>
      <bottom-bar
        :provider="provider"
        :values="form.fd"
        :cloudAccountId="cloudAccountId"
        @cancel="handleCancel" />
    </a-form-model>
  </div>
</template>
<script>
import ServerPassword from '@Compute/sections/ServerPassword'
import SecgroupConfig from '@Compute/sections/SecgroupConfig'
import Duration from '@Compute/sections/Duration'
import ItemArea from '@DB/sections/ItemArea'
import ItemNetwork from '@DB/sections/ItemNetwork'
import NameRepeated from '@/sections/NameRepeated'
import DomainProject from '@/sections/DomainProject/model'
import Tag from '@/sections/Tag'
import validateForm from '@/utils/validate'
import { getComponentDraft } from '@/utils/createFormDraft'
import {
  RDS_CREATE_FORM_DRAFT_FIELD,
  RDS_CREATE_FORM_DRAFT_FIELDS,
  RDS_CREATE_FORM_DRAFT_SYNC_FIELDS,
  RDS_CREATE_FORM_DRAFT_SCOPE,
} from '@DB/views/rds/utils/rdsCreateFormDraft'
import createFormDraftMixin from '@/mixins/createFormDraft'
import changeMinxin from './changeMinxin'
import BottomBar from './components/BottomBar'
import SKU from './components/SKU'

export default {
  name: 'RDSCreate',
  components: {
    SKU,
    DomainProject,
    BottomBar,
    ServerPassword,
    ItemArea,
    ItemNetwork,
    SecgroupConfig,
    NameRepeated,
    Duration,
    Tag,
  },
  mixins: [changeMinxin, createFormDraftMixin],
  data () {
    return {
      loginTypes: ['random', 'password'],
      rules: {
        project: [
          { required: true, message: this.$t('db.text_134'), trigger: 'change' },
        ],
        generate_name: [
          { required: true, message: this.$t('db.text_136') },
          { validator: validateForm('resourceCreateName') },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      },
      tailFormItemLayout: {
        wrapperCol: {
          lg: { span: 18, offset: 6 },
          xl: { span: 20, offset: 4 },
          xxl: { span: 21, offset: 3 },
        },
      },
      scopeParams: {
        scope: this.$store.getters.scope,
        project_domain: '',
      },
      vpcList: [],
      vpc: '',
      tagDefaultChecked: {},
    }
  },
  computed: {
    createFormDraftOptions () {
      return {
        formScope: RDS_CREATE_FORM_DRAFT_SCOPE,
        // 工单修改 / 购物车改单期间禁用，避免与回填数据打架
        disableWhen: () => !!(this.$route.query.workflow || this.$route.query.order_set_id),
      }
    },
    rdsDraftFields () {
      return RDS_CREATE_FORM_DRAFT_FIELDS
    },
    providers () {
      if (this.form.fd.billing_type === 'prepaid') {
        return ['Aliyun', 'Huawei']
      }
      return ['Aliyun', 'Huawei', 'Google', 'Aws']
    },
    cloudAccountId () {
      const vpcId = this.form.fd.vpc
      const currentVpc = this.vpcList.filter(item => item.id === vpcId)
      if (currentVpc[0]) {
        return currentVpc[0].account_id
      }
      return ''
    },
    secgroupParams () {
      const ret = {}
      if (this.vpc) {
        ret.vpc_id = this.vpc
      }
      return ret
    },
  },
  provide () {
    return {
      form: this.form,
      scopeParams: this.scopeParams,
      tailFormItemLayout: this.tailFormItemLayout,
      validateCreateForm: () => this.validateCreateForm(),
      getCreateFormDraftScope: () => this.getCreateFormDraftScope(),
      canUseCreateFormFieldDraft: () => this.canRestoreCreateFormDraft,
      canRestoreCreateFormFieldDraft: () => this.canRestoreCreateFormDraft,
      canBackupCreateFormFieldDraft: () => this.canBackupCreateFormDraft,
      canBackupCreateFormFieldDraftOnSubmit: () => this.canBackupCreateFormDraftOnSubmit,
      registerCreateFormFieldDraftFlush: (fn) => this.registerCreateFormFieldDraftFlush(fn),
      readCreateFormFieldDraft: (key) => this.readCreateFormFieldDraft(key),
      writeCreateFormFieldDraft: (key, data, options) => this.writeCreateFormFieldDraft(key, data, options),
      bindCreateFormFieldDraft: (spec) => this.bindCreateFormFieldDraft(spec),
      flushCreateFormFieldDrafts: () => this.flushCreateFormFieldDrafts(),
      isCreateFormFieldTouched: (key) => this.isCreateFormFieldTouched(key),
      markCreateFormFieldTouched: (key) => this.markCreateFormFieldTouched(key),
      isCreateFormFieldDraftFromLocal: (key) => this.isCreateFormFieldDraftFromLocal(key),
      getCreateFormDraftPreferred: (key) => {
        if (key) return this.readRdsSkuDraftField(key)
        // 聚合草稿供 Filters/SizeFilters/List 级联回填
        const sku = this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.SKU)
        return {
          engine: this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.ENGINE),
          engine_version: this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.ENGINE_VERSION),
          category: this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.CATEGORY),
          storage_type: this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.STORAGE_TYPE),
          vcpu_count: this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.VCPU_COUNT),
          vmem_size_mb: this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.VMEM_SIZE_MB),
          zones: this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.ZONES),
          sku,
          sku_id: sku?.id,
          sku_name: sku?.name,
        }
      },
    }
  },
  watch: {
    'form.fd.billing_type' (val) {
      if (val === 'prepaid') {
        this.$nextTick(() => this.restoreRdsPrepaidBillingDraft())
      }
    },
  },
  created () {
    this._rdsPrepaidBillingDraftApplied = false
    this.bindRdsCreateFormFdDrafts()
    this.bindRdsCreateFormCompositeDrafts()
    this.bindRdsPrepaidBillingDrafts()
  },
  mounted () {
    this.$nextTick(() => {
      if (this.form?.fd?.billing_type === 'prepaid') {
        this.restoreRdsPrepaidBillingDraft()
      }
    })
  },
  methods: {
    /**
     * 套餐回填：未交互前优先 local，避开 session 被「默认第一项」级联污染
     */
    readRdsSkuDraftField (fieldKey) {
      if (!fieldKey || !this.canRestoreCreateFormDraft) return null
      if (!this.createFormDraftUserInteracted) {
        const scope = this.getCreateFormDraftScope()
        if (scope) {
          const fromLs = getComponentDraft(scope, fieldKey)
          if (fromLs != null && fromLs !== '') return fromLs
        }
      }
      return this.readCreateFormFieldDraft(fieldKey)
    },
    showSecgroup (form) {
      const provider = form.fd?.provider
      if (provider === 'Qcloud') {
        return form.fd?.category !== 'basic'
      }

      return ['Huawei', 'Aliyun'].includes(provider)
    },
    getSecgroupMax (form) {
      const secgroupMaxMap = {
        Huawei: 1,
        Qcloud: 5,
        Aliyun: 3,
      }
      const provider = form.fd?.provider
      return secgroupMaxMap[provider] || 5
    },
    handleVpcListChange (list) {
      this.vpcList = list
    },
    handleCancel () {
      this.$router.push({ name: 'RDSIndex' })
    },
    onAreaSelectsFetchsDone () {},
    fetchDomainCallback () {
      const domain = this.$route.query.domain_id
      if (domain) {
        this.$set(this.form.fd, 'domain', domain)
        this.domain_change()
      }
    },
    fetchProjectCallback () {
      const project = this.$route.query.tenant_id
      if (project) {
        this.$set(this.form.fd, 'project', project)
      }
    },
    /** SYNC 字段取值：无值返回 undefined（跳过 flush），禁止 null 误清草稿 */
    getRdsSyncDraftValue (formField) {
      if (formField === 'sku') {
        const sku = this.form?.fd?.sku
        if (!sku || typeof sku !== 'object') return undefined
        if (!sku.id && !sku.name) return undefined
        return { id: sku.id, name: sku.name }
      }
      const val = this.form?.fd?.[formField]
      if (val === undefined || val === null || val === '') return undefined
      return val
    },
    bindRdsCreateFormFdDrafts () {
      this._rdsCreateFormFdDraftMap = Object.create(null)
      // billing_type：set 时同步 fd，并在 prepaid 时回填购买时长/自动续费
      this._rdsCreateFormFdDraftMap.billing_type = RDS_CREATE_FORM_DRAFT_FIELD.BILLING_TYPE
      this.bindCreateFormFieldDraft({
        key: RDS_CREATE_FORM_DRAFT_FIELD.BILLING_TYPE,
        kind: 'selection',
        get: () => {
          const v = this.form?.fd?.billing_type
          return (v === undefined || v === null || v === '') ? undefined : v
        },
        set: (val) => {
          if (val == null || val === '') return
          if (this.form.fd) this.form.fd.billing_type = val
          if (val === 'prepaid') {
            this.$nextTick(() => this.restoreRdsPrepaidBillingDraft())
          }
        },
      })
      // 套餐级联：仅 flush 落盘；回填由 Filters/SizeFilters/List 对照 options 自管
      ;(RDS_CREATE_FORM_DRAFT_SYNC_FIELDS || []).forEach((item) => {
        if (!item?.key || !item.formField) return
        this._rdsCreateFormFdDraftMap[item.formField] = item.key
        const formField = item.formField
        this.bindCreateFormFieldDraft({
          key: item.key,
          kind: item.kind || 'selection',
          get: () => this.getRdsSyncDraftValue(formField),
        })
      })
    },
    /**
     * 包年包月：ClearingRadios 的 duration / auto_renew（与到期释放 Duration 组件 key 分离）
     */
    bindRdsPrepaidBillingDrafts () {
      this.bindCreateFormFieldDraft({
        key: RDS_CREATE_FORM_DRAFT_FIELD.PREPAID_DURATION,
        kind: 'selection',
        get: () => {
          if (this.form?.fd?.billing_type !== 'prepaid') return null
          const val = this.form.fd.duration
          return (val === undefined || val === null || val === '') ? undefined : val
        },
      })
      this.bindCreateFormFieldDraft({
        key: RDS_CREATE_FORM_DRAFT_FIELD.AUTO_RENEW,
        kind: 'selection',
        get: () => {
          if (this.form?.fd?.billing_type !== 'prepaid') return null
          const val = this.form.fd.auto_renew
          if (val === undefined || val === null) return undefined
          return !!val
        },
      })
    },
    restoreRdsPrepaidBillingDraft () {
      if (this._rdsPrepaidBillingDraftApplied) return
      if (!this.canRestoreCreateFormDraft || !this.form?.fd) return
      if (this.form.fd.billing_type !== 'prepaid') return
      const duration = this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.PREPAID_DURATION)
      const autoRenew = this.readRdsSkuDraftField(RDS_CREATE_FORM_DRAFT_FIELD.AUTO_RENEW)
      const fields = {}
      if (duration != null && duration !== '') fields.duration = duration
      if (autoRenew != null) fields.auto_renew = !!autoRenew
      if (!Object.keys(fields).length) {
        this._rdsPrepaidBillingDraftApplied = true
        return
      }
      this.$nextTick(() => {
        this.$nextTick(() => {
          if (this.form.fd.billing_type !== 'prepaid') return
          Object.assign(this.form.fd, fields)
          this._rdsPrepaidBillingDraftApplied = true
        })
      })
    },
    bindRdsCreateFormCompositeDrafts () {
      this.bindCreateFormFieldDraft({
        key: RDS_CREATE_FORM_DRAFT_FIELD.NETWORK,
        kind: 'composite',
        get: () => {
          const vpc = this.form.fd.vpc
          const network = this.form.fd.network
          if (vpc == null && network == null) return undefined
          return { vpc, network }
        },
        set: (val) => {
          if (!val || !this.form?.fd) return
          if (val.vpc != null) this.$set(this.form.fd, 'vpc', val.vpc)
          if (val.network != null) this.$set(this.form.fd, 'network', val.network)
        },
      })
    },
  },
}
</script>
