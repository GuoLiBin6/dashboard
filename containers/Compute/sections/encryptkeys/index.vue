<template>
  <div>
    <a-form-model-item class="mb-0" prop="encryptEnable">
      <a-radio-group :value="model.encryptEnable" @change="change">
        <a-radio-button value="">{{ $t('compute.text_116') }}</a-radio-button>
        <a-radio-button value="new">{{ $t('compute.prompt.encrypt.new') }}</a-radio-button>
        <a-radio-button value="existing">{{ $t('compute.prompt.encrypt.existing') }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="showAlgs" prop="encrypt_key_alg">
      <a-radio-group :value="model.encrypt_key_alg" @change="e => $set(model, 'encrypt_key_alg', e.target.value)">
        <a-radio-button value="">{{ $t('compute.text_1') }}</a-radio-button>
        <a-radio-button value="aes-256">AES256</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="showKeys" prop="encrypt_key_id">
      <a-select :value="model.encrypt_key_id" :placeholder="$t('compute.prompt.encrypt_key')" @change="v => $set(model, 'encrypt_key_id', v)">
        <a-select-option v-for="item in encryptKeyOptions" :key="item.value" :value="item.value">
          {{item.text}}
        </a-select-option>
      </a-select>
    </a-form-model-item>
  </div>
</template>

<script>
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'EncryptKeys',
  mixins: [createFormFieldDraftMixin],
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    formDraftKind: {
      type: String,
      default: 'selection',
    },
    form: {
      type: Object,
      validator: val => !val || typeof val === 'object',
    },
    model: {
      type: Object,
      required: true,
    },
  },
  data () {
    const enableInit = this.model.encryptEnable
    return {
      showKeys: enableInit === 'existing',
      showAlgs: enableInit === 'new',
      encryptKeyOptions: [],
    }
  },
  watch: {
    encryptKeyOptions: {
      immediate: true,
      handler () {
        this.$nextTick(() => {
          if (this.isFormFieldDraftFromLocal()) {
            this.tryRestoreEncryptSubFields(this.getCurrentEncryptEnable())
            return
          }
          this.restoreFormFieldDraftFields()
        })
      },
    },
  },
  created () {
    this.fetchEncryptKeyOptions()
  },
  methods: {
    writeFields (vals) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach((key) => {
        this.$set(this.model, key, vals[key])
      })
    },
    getCurrentEncryptEnable () {
      return this.model.encryptEnable || ''
    },
    getCreateFormFieldDraftSnapshot () {
      const encryptEnable = this.model.encryptEnable || ''
      if (!encryptEnable) {
        return null
      }
      const ret = { encryptEnable }
      if (encryptEnable === 'new') {
        ret.encrypt_key_alg = this.model.encrypt_key_alg || ''
      }
      if (encryptEnable === 'existing') {
        const id = this.model.encrypt_key_id
        if (id) ret.encrypt_key_id = id
      }
      return ret
    },
    applyCreateFormFieldDraft (draft) {
      if (!draft) return
      if (this.isFormFieldDraftFromLocal()) return
      this.tryApplyEncryptDraft(draft)
    },
    tryApplyEncryptDraft (draft) {
      if (!draft) return false
      const encryptEnable = draft.encryptEnable || ''
      this.showKeys = encryptEnable === 'existing'
      this.showAlgs = encryptEnable === 'new'
      this.writeFields({ encryptEnable })
      this.$nextTick(() => this.applyEncryptSubFields(draft, encryptEnable))
      return true
    },
    tryRestoreEncryptSubFields (encryptEnable) {
      if (!this.canRestoreFormFieldDraft() || !encryptEnable) return true
      const draft = this.readFormFieldDraft()
      if (!draft || draft.encryptEnable !== encryptEnable) return true
      return this.applyEncryptSubFields(draft, encryptEnable)
    },
    applyEncryptSubFields (draft, encryptEnable) {
      if (!draft) return true
      if (encryptEnable === 'new') {
        const alg = draft.encrypt_key_alg != null ? draft.encrypt_key_alg : ''
        this.writeFields({ encrypt_key_alg: alg })
        return true
      }
      if (encryptEnable === 'existing') {
        if (!draft.encrypt_key_id) return true
        if (!this.encryptKeyOptions.length) return false
        if (!this.encryptKeyOptions.some(o => o.value === draft.encrypt_key_id)) return true
        this.writeFields({ encrypt_key_id: draft.encrypt_key_id })
        return true
      }
      return true
    },
    change (val) {
      const v = val && val.target ? val.target.value : val
      this.$set(this.model, 'encryptEnable', v)
      if (v === 'existing') {
        this.showKeys = true
        this.showAlgs = false
      } else if (v === 'new') {
        this.showKeys = false
        this.showAlgs = true
      } else {
        this.showKeys = false
        this.showAlgs = false
        this.$delete(this.model, 'encrypt_key_alg')
        this.$delete(this.model, 'encrypt_key_id')
      }
      this.$nextTick(() => this.tryRestoreEncryptSubFields(v))
    },
    async fetchEncryptKeyOptions () {
      const credManager = new this.$Manager('credentials', 'v1')
      const result = await credManager.rpc({ methodname: 'GetEncryptKeysRpc' })
      const opts = []
      for (let i = 0; i < result.data.length; i++) {
        const value = result.data[i].key_id
        const text = result.data[i].key_name + ' (' + result.data[i].key_id + ',' + result.data[i].alg.toUpperCase() + ')'
        opts.push({ value: value, text: text })
      }
      this.encryptKeyOptions = opts
    },
    async validate () {
      return true
    },
  },
}
</script>
