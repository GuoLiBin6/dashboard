<template>
  <div class="redis-create-index db-create-index pb-5">
    <page-header :title="$t('db.text_280')" />
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        v-bind="formItemLayout"
        :model="form.fd"
        :rules="rules"
        hideRequiredMark>
        <a-form-model-item :label="$t('db.text_281')" prop="project">
          <domain-project
            ref="domainProjectRef"
            :form="form.fd"
            :labelInValue="false"
            :form-draft-key="redisDraftFields.domainProject"
            @fetchDomainCallback="fetchDomainCallback"
            @fetchProjectCallback="fetchProjectCallback" />
        </a-form-model-item>
        <a-form-model-item :label="$t('db.text_60')" prop="generate_name">
          <a-input v-model:value="form.fd.generate_name" :placeholder="$t('validator.resourceCreateName')" />
          <template #extra>
            <name-repeated res="dbinstances" :name="form.fd.generate_name" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea
            v-model:value="form.fd.description"
            :auto-size="{ minRows: 1, maxRows: 3 }"
            :placeholder="$t('common_367')" />
        </a-form-model-item>
        <!-- 计费方式 -->
        <clearing-radios :model="form.fd" v-bind="formItemLayout" :auto_renew="false" />
        <a-form-model-item :label="$t('db.text_71')" v-if="form.fd.billing_type !== 'prepaid'">
          <duration
            :model="form.fd"
            :form="form"
            :form-draft-key="redisDraftFields.duration"
            v-model:durationStandard="form.fd.durationStandard"
            v-model:duration="form.fd.duration" />
        </a-form-model-item>
        <a-form-model-item :label="$t('db.text_265')" prop="count">
          <a-input-number v-model:value="form.fd.count" :min="1" :max="10" />
        </a-form-model-item>
        <!-- 区域 -->
        <item-area
          ref="ITEM_AREA"
          :model="form.fd"
          v-if="form.fd.project"
          class="mb-0"
          :defaultActiveFirstOption="['provider', 'cloudregion']"
          filterBrandResource="redis_engine"
          @fetchsDone="onAreaSelectsFetchsDone" />
        <!-- 套餐 -->
        <s-k-u ref="REF_SKU" />
        <a-form-model-item :label="$t('db.text_143')">
          <server-password
            ref="passwordRef"
            :model="form.fd"
            :loginTypes="loginTypes"

            :form="form" />
        </a-form-model-item>
        <item-network ref="REF_NETWORK" :model="form.fd" @vpcListChange="handleVpcListChange" />
        <a-form-model-item v-if="form.fd.provider === 'Qcloud'" :label="$t('db.text_144')">
          <secgroup-config
            ref="secgroupRef"
            :model="form.fd"
            :max="5"

            :form="form"
            :secgroup-params="secgroupParams" />
        </a-form-model-item>
        <!-- 标签 -->
        <a-form-model-item :label="$t('table.title.tag')" prop="__meta__">
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
    </page-body>
  </div>
</template>
<script>
import {
  REDIS_CREATE_FORM_DRAFT_FIELD,
  REDIS_CREATE_FORM_DRAFT_FIELDS,
  REDIS_CREATE_FORM_DRAFT_SYNC_FIELDS,
  REDIS_CREATE_FORM_DRAFT_SCOPE,
} from '@DB/views/redis/utils/redisCreateFormDraft'
import ServerPassword from '@Compute/sections/ServerPassword'
import Duration from '@Compute/sections/Duration'
import ItemArea from '@DB/sections/ItemArea'
import ItemNetwork from '@DB/sections/ItemNetwork'
import SecgroupConfig from '@Compute/sections/SecgroupConfig'
import DomainProject from '@/sections/DomainProject/model'
import NameRepeated from '@/sections/NameRepeated'
import Tag from '@/sections/Tag'
import validateForm from '@/utils/validate'
import { getComponentDraft } from '@/utils/createFormDraft'
import createFormDraftMixin from '@/mixins/createFormDraft'
import changeMinxin from './changeMinxin'
import BottomBar from './components/BottomBar'
import SKU from './components/SKU'

export default {
  name: 'IDCCreate',
  components: {
    Duration,
    ItemArea,
    SKU,
    DomainProject,
    ServerPassword,
    ItemNetwork,
    SecgroupConfig,
    BottomBar,
    NameRepeated,
    Tag,
  },
  mixins: [changeMinxin, createFormDraftMixin],
  data () {
    return {
      loginTypes: ['random', 'password'],
      formItemLayout: {
        wrapperCol: {
          lg: { span: 18 },
          xl: { span: 20 },
          xxl: { span: 21 },
        },
        labelCol: {
          lg: { span: 6 },
          xl: { span: 4 },
          xxl: { span: 3 },
        },
      },
      tailFormItemLayout: {
        wrapperCol: {
          lg: { span: 18, offset: 6 },
          xl: { span: 20, offset: 4 },
          xxl: { span: 21, offset: 3 },
        },
      },
      rules: {
        project: [
          { required: true, message: this.$t('db.text_134'), trigger: 'change' },
        ],
        generate_name: [
          { required: true, message: this.$t('db.text_136') },
          { validator: validateForm('resourceCreateName') },
        ],
        count: [
          { required: true, message: this.$t('db.text_257') },
        ],
      },
      project_id: '',
      project_domain: undefined,
      vpcList: [],
      vpc: '',
      tagDefaultChecked: {},
    }
  },
  computed: {
    createFormDraftOptions () {
      return {
        formScope: REDIS_CREATE_FORM_DRAFT_SCOPE,
        disableWhen: () => !!(this.$route.query.workflow || this.$route.query.order_set_id),
      }
    },
    redisDraftFields () {
      return REDIS_CREATE_FORM_DRAFT_FIELDS
    },
    secgroupParams () {
      const ret = {
        project_id: this.project_id,
        ...this.scopeParam,
      }
      if (this.vpc) {
        ret.vpc_id = this.vpc
      }
      return ret
    },
    scopeParams () {
      if (this.$store.getters.isAdminMode) {
        return {
          project_domain: this.project_domain,
        }
      }
      return { scope: this.$store.getters.scope }
    },
    cloudAccountId () {
      const vpcId = this.form.fd.vpc
      const currentVpc = this.vpcList.filter(item => item.id === vpcId)
      if (currentVpc[0]) {
        return currentVpc[0].account_id
      }
      return ''
    },
  },
  provide () {
    return {
      form: this.form,
      scopeParams: this.scopeParams,
      formItemLayout: this.formItemLayout,
      tailFormItemLayout: this.tailFormItemLayout,
      redisItem: this.redisItem,
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
        if (key) return this.readRedisSkuDraftField(key)
        // 聚合草稿供级联回填（勿用当前空表单值）
        const sku = this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.SKU)
        return {
          engine: this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.ENGINE),
          engine_version: this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.ENGINE_VERSION),
          local_category: this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.LOCAL_CATEGORY),
          node_type: this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.NODE_TYPE),
          performance_type: this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.PERFORMANCE_TYPE),
          memory_size_mb: this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.MEMORY_SIZE_MB),
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
        this.$nextTick(() => this.restoreRedisPrepaidBillingDraft())
      }
    },
  },
  created () {
    this._redisPrepaidBillingDraftApplied = false
    this.bindRedisCreateFormFdDrafts()
    this.bindRedisCreateFormCompositeDrafts()
    this.bindRedisPrepaidBillingDrafts()
  },
  mounted () {
    this.$nextTick(() => {
      if (this.form?.fd?.billing_type === 'prepaid') {
        this.restoreRedisPrepaidBillingDraft()
      }
    })
  },
  methods: {
    /**
     * 套餐回填：未交互前优先 local，避开 session 被「默认第一项」级联污染
     */
    readRedisSkuDraftField (fieldKey) {
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
    handleVpcListChange (list) {
      this.vpcList = list
    },
    handleCancel () {
      this.$router.push({ name: 'Redis' })
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
        this.project_id = project
      }
    },
    /** SYNC 字段取值：无值返回 undefined（跳过 flush），禁止 null 误清草稿 */
    getRedisSyncDraftValue (formField) {
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
    bindRedisCreateFormFdDrafts () {
      this._redisCreateFormFdDraftMap = Object.create(null)
      this._redisCreateFormFdDraftMap.billing_type = REDIS_CREATE_FORM_DRAFT_FIELD.BILLING_TYPE
      this.bindCreateFormFieldDraft({
        key: REDIS_CREATE_FORM_DRAFT_FIELD.BILLING_TYPE,
        kind: 'selection',
        get: () => {
          const v = this.form?.fd?.billing_type
          return (v === undefined || v === null || v === '') ? undefined : v
        },
        set: (val) => {
          if (val == null || val === '') return
          if (this.form.fd) this.form.fd.billing_type = val
          if (val === 'prepaid') {
            this.$nextTick(() => this.restoreRedisPrepaidBillingDraft())
          }
        },
      })
      ;(REDIS_CREATE_FORM_DRAFT_SYNC_FIELDS || []).forEach((item) => {
        if (!item?.key || !item.formField) return
        this._redisCreateFormFdDraftMap[item.formField] = item.key
        const formField = item.formField
        this.bindCreateFormFieldDraft({
          key: item.key,
          kind: item.kind || 'selection',
          get: () => this.getRedisSyncDraftValue(formField),
        })
      })
    },
    bindRedisPrepaidBillingDrafts () {
      this.bindCreateFormFieldDraft({
        key: REDIS_CREATE_FORM_DRAFT_FIELD.PREPAID_DURATION,
        kind: 'selection',
        get: () => {
          if (this.form?.fd?.billing_type !== 'prepaid') return null
          const val = this.form.fd.duration
          return (val === undefined || val === null || val === '') ? undefined : val
        },
      })
      this.bindCreateFormFieldDraft({
        key: REDIS_CREATE_FORM_DRAFT_FIELD.AUTO_RENEW,
        kind: 'selection',
        get: () => {
          if (this.form?.fd?.billing_type !== 'prepaid') return null
          const val = this.form.fd.auto_renew
          if (val === undefined || val === null) return undefined
          return !!val
        },
      })
    },
    restoreRedisPrepaidBillingDraft () {
      if (this._redisPrepaidBillingDraftApplied) return
      if (!this.canRestoreCreateFormDraft || !this.form?.fd) return
      if (this.form.fd.billing_type !== 'prepaid') return
      const duration = this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.PREPAID_DURATION)
      const autoRenew = this.readRedisSkuDraftField(REDIS_CREATE_FORM_DRAFT_FIELD.AUTO_RENEW)
      const fields = {}
      if (duration != null && duration !== '') fields.duration = duration
      if (autoRenew != null) fields.auto_renew = !!autoRenew
      if (!Object.keys(fields).length) {
        this._redisPrepaidBillingDraftApplied = true
        return
      }
      this.$nextTick(() => {
        this.$nextTick(() => {
          if (this.form.fd.billing_type !== 'prepaid') return
          Object.assign(this.form.fd, fields)
          this._redisPrepaidBillingDraftApplied = true
        })
      })
    },
    bindRedisCreateFormCompositeDrafts () {
      this.bindCreateFormFieldDraft({
        key: REDIS_CREATE_FORM_DRAFT_FIELD.NETWORK,
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
