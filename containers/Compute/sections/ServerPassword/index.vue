<template>
  <div class="server-password">
    <a-form-model-item class="mb-2" :prop="loginTypeField">
      <a-radio-group v-model:value="vmLoginType" :disabled="disabled" @change="loginTypeChange">
        <a-radio-button v-for="item of loginTypeMap" :value="item.key" :key="item.key" :disabled="disabledLoginTypes.includes(item.key)">
          {{ item.label }}
          <help-tooltip v-if="['image', 'keypair'].includes(item.key)" :name="`${item.key}Password`" class="ml-2" />
        </a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="(loginTypeMap && loginTypeMap.keypair) && vmLoginType === loginTypeMap.keypair.key" class="mb-0" :prop="loginKeypairField">
      <template #extra>
        {{$t('compute.text_201')}}<help-link :href="href">{{$t('compute.text_202')}}</help-link>
      </template>
      <base-select
        ref="keypairSelect"
        class="w-50"
        v-model:value="keypairModel"
        resource="keypairs"
        :isDefaultSelect="true"
        :showSync="true"
        :select-props="{ allowClear: true, placeholder: $t('compute.text_203') }"
        @update:initLoaded="onKeypairInitLoaded" />
    </a-form-model-item>
    <a-form-model-item v-if="(loginTypeMap && loginTypeMap.password) && vmLoginType === loginTypeMap.password.key" class="mb-0" :prop="loginPasswordField">
      <a-input-password
        class="w-50"
        v-model:value="passwordModel"
        :placeholder="$t('compute.text_204')" />
    </a-form-model-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import { LOGIN_TYPES_MAP } from '@Compute/constants'
import { passwordValidator } from '@/utils/validate'
import i18n from '@/locales'

import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'ServerPassword',
  mixins: [createFormFieldDraftMixin],
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    /** selection：radio/单选 select/switch 类，local + session 双写、可跨 tab 回填 */
    formDraftKind: {
      type: String,
      default: 'selection',
    },
    loginTypes: {
      type: Array,
    },
    loginTypeField: {
      type: String,
      default: 'loginType',
    },
    loginKeypairField: {
      type: String,
      default: 'loginKeypair',
    },
    loginPasswordField: {
      type: String,
      default: 'loginPassword',
    },
    form: {
      type: Object,
    },
    /** a-form-model end-state（通常 form.fd） */
    model: {
      type: Object,
      required: true,
    },
    isSnapshotImageType: { // 表单的镜像类型是否是主机快照
      type: Boolean,
      default: false,
    },
    disabledLoginTypes: {
      type: Array,
      default: () => ([]),
    },
  },
  data () {
    return {
      vmLoginType: 'random',
      disabled: false,
      pendingKeypair: '',
    }
  },
  computed: {
    loginTypeMap () {
      if (this.loginTypes && this.loginTypes.length > 0) {
        const _ = {}
        for (const k in LOGIN_TYPES_MAP) {
          if (this.loginTypes.includes(k)) {
            _[k] = LOGIN_TYPES_MAP[k]
          }
        }
        return _
      }
      return LOGIN_TYPES_MAP
    },
    href () {
      const url = this.$router.resolve('/keypair')
      return url.href
    },
    keypairModel: {
      get () {
        return this.model[this.loginKeypairField]
      },
      set (v) {
        this.$set(this.model, this.loginKeypairField, v)
      },
    },
    passwordModel: {
      get () {
        return this.model[this.loginPasswordField]
      },
      set (v) {
        this.$set(this.model, this.loginPasswordField, v)
      },
    },
  },
  watch: {
    isSnapshotImageType (val) {
      if (val) {
        this.disabled = true
        const v = LOGIN_TYPES_MAP.image.key
        this.$set(this.model, this.loginTypeField, v)
        this.vmLoginType = v
      } else {
        this.disabled = false
      }
    },
    loginTypeMap: {
      immediate: true,
      handler (val, oldv) {
        if (oldv !== undefined && R.equals(val, oldv)) return
        this.setLoginType()
        this.$nextTick(() => this.restoreFormFieldDraftFields())
      },
    },
  },
  created () {
    this._keypairListLoaded = false
    this.vmLoginType = this.model[this.loginTypeField] || this.vmLoginType
  },
  methods: {
    writeLoginFields (vals) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach((key) => {
        this.$set(this.model, key, vals[key])
      })
    },
    getCreateFormFieldDraftSnapshot () {
      const loginType = this.model[this.loginTypeField]
      if (loginType === undefined) return undefined
      // 手工输入：不落盘类型与密码，提交时清空该控件草稿
      if (loginType === LOGIN_TYPES_MAP.password.key) return null
      const keypair = this.model[this.loginKeypairField]
      return { loginType, keypair: loginType === LOGIN_TYPES_MAP.keypair.key ? keypair : undefined }
    },
    applyCreateFormFieldDraft (draft) {
      if (!draft) return
      // 历史草稿若为手工输入：忽略，不回填为 password
      if (draft.loginType === LOGIN_TYPES_MAP.password.key) return
      const values = {}
      if (draft.loginType && (!this.loginTypes || this.loginTypes.includes(draft.loginType))) {
        values[this.loginTypeField] = draft.loginType
        this.vmLoginType = draft.loginType
      }
      if (draft.loginType === LOGIN_TYPES_MAP.keypair.key && draft.keypair) {
        // 密钥等列表校验后再写，避免空列表时写入非法值
        this.pendingKeypair = draft.keypair
      } else {
        this.pendingKeypair = ''
      }
      if (Object.keys(values).length) this.writeLoginFields(values)
      this.$nextTick(() => this.writePendingKeypair())
    },
    /** 仅 sourceList 非空且命中时回填密钥 */
    writePendingKeypair () {
      if (!this.pendingKeypair) return
      if (this.vmLoginType !== 'keypair' && this.vmLoginType !== this.loginTypeMap?.keypair?.key) return
      const sourceList = this.$refs.keypairSelect?.sourceList || []
      if (!sourceList.length) {
        // 列表空：不写；已加载仍空则丢弃
        if (this._keypairListLoaded) {
          this.pendingKeypair = ''
          this.writeLoginFields({ [this.loginKeypairField]: undefined })
        }
        return
      }
      const hit = sourceList.some(item => item.id === this.pendingKeypair)
      if (!hit) {
        this.pendingKeypair = ''
        this.writeLoginFields({ [this.loginKeypairField]: undefined })
        return
      }
      this.writeLoginFields({ [this.loginKeypairField]: this.pendingKeypair })
    },
    onKeypairInitLoaded () {
      this._keypairListLoaded = true
      this.writePendingKeypair()
    },

    loginTypeChange (e) {
      const v = e && e.target ? e.target.value : e
      this.vmLoginType = v
      this.$set(this.model, this.loginTypeField, v)
    },
    setLoginType () {
      if (this.loginTypeMap && !R.isEmpty(this.loginTypeMap)) {
        const keys = Object.keys(this.loginTypeMap)
        let vmLoginType
        const draft = this.canRestoreFormFieldDraft() ? this.readFormFieldDraft() : null
        const draftLoginType = draft?.loginType === LOGIN_TYPES_MAP.password.key
          ? undefined
          : draft?.loginType
        if (draftLoginType && keys.includes(draftLoginType) && !this.isSnapshotImageType) {
          vmLoginType = draftLoginType
        } else {
          const loginTypeInitailValue = this.model[this.loginTypeField]
          vmLoginType = loginTypeInitailValue
          if (!keys.includes(loginTypeInitailValue) || this.isSnapshotImageType) { // 如果表单中的初始值不在 loginTypeMap 中, 主机快照只支持保留镜像设置
            if (keys.includes(LOGIN_TYPES_MAP.image.key)) { // 如果maps中有"保留镜像设置"，则设置
              vmLoginType = LOGIN_TYPES_MAP.image.key
            } else { // 否则设置第一项
              vmLoginType = keys[0]
            }
          }
        }
        this.$set(this.model, this.loginTypeField, vmLoginType)
        this.vmLoginType = vmLoginType
      }
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
      if (this.loginTypeMap?.keypair && this.vmLoginType === this.loginTypeMap.keypair.key) {
        await this.runFieldRule({ required: true, message: i18n.t('compute.text_203') }, this.model[this.loginKeypairField])
      }
      if (this.loginTypeMap?.password && this.vmLoginType === this.loginTypeMap.password.key) {
        await this.runFieldRule({ required: true, message: i18n.t('compute.text_204') }, this.model[this.loginPasswordField])
        await this.runFieldRule({ validator: passwordValidator }, this.model[this.loginPasswordField])
      }
      return true
    },
  },
}
</script>
