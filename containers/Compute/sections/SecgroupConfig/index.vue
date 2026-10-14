<template>
  <div>
    <a-form-model-item class="mb-0" :prop="typeField">
      <a-radio-group :value="model[typeField]" :disabled="disabled" @change="e => { $set(model, typeField, e.target.value); handleTypeChange(e) }">
        <a-radio-button
          v-for="item of types"
          :key="item.key"
          :value="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item class="mb-0" v-if="isBind" :prop="secgroupField">
      <template #extra>{{$t('compute.text_188', [_max])}}<help-link :href="href">{{$t('compute.text_189')}}</help-link></template>
      <base-select
        remote
        class="w-50 pr-1"
        :value="model[secgroupField]"
        @change="v => $set(model, secgroupField, v)"
        resource="secgroups"
        :params="params"
        :extra-opts="secgroupExtraOpts"
        :showSync="true"
        :select-props="{ allowClear: true, placeholder: $t('compute.text_190'), mode: 'multiple' }"
        @update:initLoaded="onSecgroupInitLoaded" />
    </a-form-model-item>
    <a-form-model-item
      class="mb-0"
      v-if="isNetworkTag"
      :prop="networkTagsField"
      :validate-status="networkTagError ? 'error' : ''"
      :help="networkTagError || undefined">
      <template #extra>{{ $t('validator.secgroupNetworkTag') }}</template>
      <a-select
        ref="networkTagsSelect"
        :value="model[networkTagsField]"
        @change="v => { $set(model, networkTagsField, v); handleNetworkTagsChange(v) }"
        mode="tags"
        allow-clear
        :show-arrow="false"
        dropdown-class-name="secgroup-network-tags-dropdown"
        class="w-50 pr-1"
        :placeholder="$t('compute.network_tag_placeholder')"
        :token-separators="[',']" />
    </a-form-model-item>
  </div>
</template>

<script>
import { SECGROUP_OPTIONS_MAP } from '@Compute/constants'
import { HYPERVISORS_MAP, isUcloudLikeHypervisor } from '@/constants'
import { validate } from '@/utils/validate'

export default {
  name: 'SecgroupConfig',
  mixins: [],
  props: {
    typeField: {
      type: String,
      default: 'secgroup_type',
    },
    secgroupField: {
      type: String,
      default: 'secgroup',
    },
    networkTagsField: {
      type: String,
      default: 'network_tags',
    },
    secgroupParams: {
      type: Object,
      default: () => ({}),
    },
    form: {
      type: Object,
    },
    /** a-form-model end-state：与字段名对齐（通常 form.fd） */
    model: {
      type: Object,
      required: true,
    },
    isSnapshotImageType: { // 表单的镜像类型是否是主机快照
      type: Boolean,
      default: false,
    },
    hypervisor: {
      type: String,
      default: HYPERVISORS_MAP.kvm.key,
    },
    max: {
      type: Number,
    },
    showSecgroupBind: {
      type: Boolean,
      default: true,
    },
    /**
     * 工单回填期间：不要因 showSecgroupBind 短暂变化把已选「指定安全组」冲回默认
     */
    ignoreAutoTypeReset: {
      type: Boolean,
      default: false,
    },
    /**
     * 工单：指定安全组 id 列表。BaseSelect 会在 params 变化时清空，需在 initLoaded 后反复写入
     */
    initSecgroups: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      isBind: this.model[this.typeField] === SECGROUP_OPTIONS_MAP.bind.key,
      isNetworkTag: this.model[this.typeField] === SECGROUP_OPTIONS_MAP.networkTag.key,
      networkTagInputEl: null,
      networkTagComposing: false,
      networkTagSyncing: false,
      networkTagError: '',
      loading: false,
      disabled: false,
      pendingInitSecgroups: [],
      /** id -> name，避免 extraOpts 只用 id 导致标签展示 UUID */
      pendingSecgroupNameMap: {},
    }
  },
  computed: {
    types () {
      const types = { ...SECGROUP_OPTIONS_MAP }
      if (this.isInCloudSphere || !this.showSecgroupBind) {
        delete types.bind
      }
      if (!this.isGoogle) {
        delete types.networkTag
      }
      return types
    },
    params () {
      const params = {
        limit: 20,
        scope: this.$store.getters.scope,
        ...this.secgroupParams,
      }
      if (this.secgroupParams.project_domain) delete params.scope
      return params
    },
    secgroupExtraOpts () {
      return (this.pendingInitSecgroups || []).map(id => ({
        id,
        name: this.pendingSecgroupNameMap[id] || id,
      }))
    },
    href () {
      const url = this.$router.resolve('/secgroup')
      return url.href
    },
    isInCloudSphere () {
      return this.hypervisor.toLowerCase() === HYPERVISORS_MAP.incloudsphere.hypervisor.toLowerCase()
    },
    isAzure () {
      return this.hypervisor.toLowerCase() === HYPERVISORS_MAP.azure.hypervisor.toLowerCase()
    },
    isUCloud () {
      return isUcloudLikeHypervisor(this.hypervisor)
    },
    isZstack () {
      return this.hypervisor.toLowerCase() === HYPERVISORS_MAP.zstack.hypervisor.toLowerCase()
    },
    isGoogle () {
      return this.hypervisor.toLowerCase() === HYPERVISORS_MAP.google.hypervisor.toLowerCase()
    },
    _max () {
      if (this.max) {
        return this.max
      }
      return (this.isAzure || this.isUCloud || this.isZstack) ? 1 : 5
    },
  },
  watch: {
    isSnapshotImageType (val) {
      if (val) {
        this.disabled = true
        this.applyFormFields({
          [this.typeField]: SECGROUP_OPTIONS_MAP.none.key,
        })
        this.isBind = false
        this.isNetworkTag = false
        this.networkTagError = ''
      } else {
        this.disabled = false
      }
    },
    types (val) {
      if (this.ignoreAutoTypeReset) return
      if (!val.bind && this.model[this.typeField] === 'bind') {
        this.applyFormFields({
          [this.typeField]: 'default',
        })
        this.isBind = false
      }
      if (!val.networkTag && this.model[this.typeField] === SECGROUP_OPTIONS_MAP.networkTag.key) {
        this.applyFormFields({
          [this.typeField]: SECGROUP_OPTIONS_MAP.none.key,
        })
        this.isNetworkTag = false
      }
    },
    // 程序化 setFieldsValue 不会走 @change，需同步本地 isBind
    'form.fd.secgroup_type' (val) {
      this.isBind = val === SECGROUP_OPTIONS_MAP.bind.key
      this.isNetworkTag = val === SECGROUP_OPTIONS_MAP.networkTag.key
    },
    initSecgroups: {
      handler (val) {
        const ids = this.normalizeSecgroupIds(val)
        if (ids.length) this.initData(ids)
      },
      immediate: true,
    },
    params: {
      handler () {
        if (this.pendingInitSecgroups.length) {
          this.$nextTick(() => this.writePendingSecgroups())
        }
      },
      deep: true,
    },
    ignoreAutoTypeReset (val) {
      if (!val) {
        this.pendingInitSecgroups = []
        this.pendingSecgroupNameMap = {}
      }
    },
    isNetworkTag (val) {
      if (!val) {
        this.networkTagError = ''
      }
      if (val) {
        this.bindNetworkTagInputKeydown()
      } else {
        this.unbindNetworkTagInputKeydown()
      }
    },
  },
  mounted () {
    this.bindNetworkTagInputKeydown()
  },
  beforeUnmount () {
    this.unbindNetworkTagInputKeydown()
  },
  methods: {
    applyFormFields (vals) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach(k => this.$set(this.model, k, vals[k]))
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
          let settled = false
          const finish = (err) => {
            if (settled) return
            settled = true
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          }
          let ret
          try {
            ret = rule.validator(rule, value, finish)
          } catch (e) {
            finish(e)
            return
          }
          if (ret && typeof ret.then === 'function') {
            ret.then(() => finish()).catch(finish)
          }
          return
        }
        resolve()
      })
    },
    async validate () {
      if (this.isBind) {
        await this.runFieldRule({ validator: this.validateSecgroups }, this.model[this.secgroupField])
      }
      if (this.isNetworkTag) {
        await this.runFieldRule({ validator: this.validateNetworkTags }, this.model[this.networkTagsField])
      }
      return true
    },
    normalizeSecgroupIds (secgroups) {
      if (!Array.isArray(secgroups) || !secgroups.length) return []
      return secgroups.map((item) => {
        if (item == null) return null
        if (typeof item === 'string' || typeof item === 'number') return String(item)
        return item.id || item.key || item.value || null
      }).filter(Boolean)
    },
    /**
     * 设置 pending 并拉取名称（BaseSelect extraOpts 优先于列表项，name 必须是真名）
     * @param {string[]} ids
     */
    setPendingInitSecgroups (ids) {
      const next = this.normalizeSecgroupIds(ids)
      this.pendingInitSecgroups = next
      if (!next.length) {
        this.pendingSecgroupNameMap = {}
        return
      }
      this.ensurePendingSecgroupNames(next)
    },
    /**
     * 批量拉取安全组名称，避免回填标签展示 UUID
     * @param {string[]} ids
     */
    async ensurePendingSecgroupNames (ids) {
      const list = (ids || []).filter(Boolean)
      if (!list.length) return
      const missing = list.filter((id) => {
        const name = this.pendingSecgroupNameMap[id]
        return !name || name === id
      })
      if (!missing.length) return
      const reqToken = missing.slice().sort().join(',')
      this._secgroupNameFetchToken = reqToken
      try {
        const params = {
          limit: missing.length,
          details: true,
          filter: `id.in(${missing.map(id => `'${id}'`).join(',')})`,
        }
        if (this.secgroupParams?.project_domain) {
          params.project_domain = this.secgroupParams.project_domain
        } else {
          params.scope = this.$store.getters.scope
        }
        const { data: { data = [] } } = await new this.$Manager('secgroups', 'v2').list({ params })
        if (this._secgroupNameFetchToken !== reqToken) return
        const next = { ...this.pendingSecgroupNameMap }
        const foundIds = new Set()
        data.forEach((item) => {
          if (item?.id) {
            next[item.id] = item.name || item.id
            foundIds.add(item.id)
          }
        })
        this.pendingSecgroupNameMap = next
        // 接口未返回的 id 视为当前不可用，从 pending 中剔除
        if (missing.some(id => !foundIds.has(id))) {
          this.pendingInitSecgroups = this.pendingInitSecgroups.filter((id) => {
            if (!missing.includes(id)) return true
            return foundIds.has(id)
          })
          if (this.isBind) this.writePendingSecgroups()
        }
      } catch (e) {
        // 拉取失败时保留 pending，避免网络抖动误清空（含过期请求）
      }
    },
    /**
     * 工单回填入口
     * @param {Array} secgroups
     */
    initData (secgroups) {
      const ids = this.normalizeSecgroupIds(secgroups)
      if (!ids.length) return
      this.setPendingInitSecgroups(ids)
      this.isBind = true
      this.writePendingSecgroups()
    },
    writePendingSecgroups () {
      if (!this.pendingInitSecgroups.length) return
      // 回填结束后不再强写，避免覆盖用户手动清空
      if (!this.ignoreAutoTypeReset) {
        this.setPendingInitSecgroups([])
        return
      }
      this.isBind = true
      this.applyFormFields({
        [this.typeField]: SECGROUP_OPTIONS_MAP.bind.key,
        [this.secgroupField]: [...this.pendingInitSecgroups],
      })
    },
    onSecgroupInitLoaded () {
      // BaseSelect params 变化会 clearSelect，列表就绪后再写回
      this.writePendingSecgroups()
    },
    validateSecgroups (rule, value, callback) {
      const max = this._max
      const maxError = this.$t('compute.text_191', [max])
      const minError = this.$t('compute.text_192')
      if (value.length > max) {
        return callback(maxError)
      }
      if (value.length < 1) {
        return callback(minError)
      }
      return callback()
    },
    validateNetworkTags (rule, value, callback) {
      if (!value || !value.length) {
        return callback(this.$t('compute.network_tag_required'))
      }
      const tags = this.normalizeNetworkTags(value)
      const invalidTag = tags.find(tag => validate(tag, 'secgroupNetworkTag') !== true)
      if (invalidTag) {
        return callback(this.$t('validator.secgroupNetworkTag'))
      }
      return callback()
    },
    normalizeNetworkTags (value) {
      return (value || []).map(tag => (tag || '').trim()).filter(Boolean)
    },
    getNetworkTagsValidateError (value) {
      const tags = this.normalizeNetworkTags(value)
      if (!tags.length) return null
      const invalidTag = tags.find(tag => validate(tag, 'secgroupNetworkTag') !== true)
      if (invalidTag) return this.$t('validator.secgroupNetworkTag')
      return null
    },
    syncNetworkTagsValidation (value) {
      this.networkTagError = this.getNetworkTagsValidateError(value) || ''
    },
    handleNetworkTagsChange (value) {
      if (this.networkTagSyncing) return
      const field = this.networkTagsField
      const tags = this.normalizeNetworkTags(value)
      const current = this.normalizeNetworkTags(this.model[field])
      if (JSON.stringify(tags) !== JSON.stringify(current)) {
        this.networkTagSyncing = true
        this.applyFormFields({ [field]: tags })
        this.$nextTick(() => {
          this.networkTagSyncing = false
          this.clearNetworkTagSearchInput()
        })
      }
      this.syncNetworkTagsValidation(tags)
    },
    handleTypeChange (e) {
      const value = e.target.value
      this.isBind = value === SECGROUP_OPTIONS_MAP.bind.key
      this.isNetworkTag = value === SECGROUP_OPTIONS_MAP.networkTag.key
      if (this.isNetworkTag) {
        this.$nextTick(() => {
          this.bindNetworkTagInputKeydown()
        })
      } else {
        this.unbindNetworkTagInputKeydown()
      }
    },
    bindNetworkTagInputKeydown () {
      if (!this.isNetworkTag) return
      this.$nextTick(() => {
        const input = this.$refs.networkTagsSelect?.$el?.querySelector('input')
        if (!input || input === this.networkTagInputEl) return
        this.unbindNetworkTagInputKeydown()
        this.networkTagInputEl = input
        input.addEventListener('keydown', this.handleNetworkTagInputKeyDown, true)
        input.addEventListener('compositionstart', this.handleNetworkTagCompositionStart)
        input.addEventListener('compositionend', this.handleNetworkTagCompositionEnd)
      })
    },
    unbindNetworkTagInputKeydown () {
      if (!this.networkTagInputEl) return
      this.networkTagInputEl.removeEventListener('keydown', this.handleNetworkTagInputKeyDown, true)
      this.networkTagInputEl.removeEventListener('compositionstart', this.handleNetworkTagCompositionStart)
      this.networkTagInputEl.removeEventListener('compositionend', this.handleNetworkTagCompositionEnd)
      this.networkTagInputEl = null
      this.networkTagComposing = false
    },
    handleNetworkTagCompositionStart () {
      this.networkTagComposing = true
    },
    handleNetworkTagCompositionEnd () {
      this.networkTagComposing = false
    },
    handleNetworkTagInputKeyDown (e) {
      if (e.key !== 'Enter') return
      // 中文输入法组字期间，Enter 用于确认候选/英文，不应生成 tag
      if (e.isComposing || e.keyCode === 229 || this.networkTagComposing) return
      e.preventDefault()
      e.stopPropagation()
      const value = (e.target.value || '').trim()
      if (!value) return
      const field = this.networkTagsField
      const current = [...(this.model[field] || [])]
      if (!current.includes(value)) {
        this.networkTagSyncing = true
        this.applyFormFields({
          [field]: [...current, value],
        })
      }
      this.$nextTick(() => {
        this.networkTagSyncing = false
        this.clearNetworkTagSearchInput()
        this.syncNetworkTagsValidation(this.model[field])
      })
    },
    clearNetworkTagSearchInput () {
      const input = this.networkTagInputEl || this.$refs.networkTagsSelect?.$el?.querySelector('input')
      if (!input) return
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
    },
  },
}
</script>

<style lang="less">
.secgroup-network-tags-dropdown {
  display: none !important;
  height: 0 !important;
  overflow: hidden !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
</style>
