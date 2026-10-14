<template>
  <div>
    <a-form-model-item class="mb-0" :prop="enableProp">
      <a-radio-group v-model:value="form[enableProp]" @change="change">
        <a-radio-button value="">{{ $t('compute.text_116') }}</a-radio-button>
        <a-radio-button value="new">{{ $t('compute.prompt.encrypt.new') }}</a-radio-button>
        <a-radio-button value="existing">{{ $t('compute.prompt.encrypt.existing') }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="showAlgs" :prop="algProp">
      <a-radio-group v-model:value="form[algProp]">
        <a-radio-button value="">{{ $t('compute.text_1') }}</a-radio-button>
        <a-radio-button value="aes-256">AES256</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="showKeys" :prop="idProp">
      <a-select v-model:value="form[idProp]" :placeholder="$t('compute.prompt.encrypt_key')">
        <a-select-option v-for="item in encryptKeyOptions" :key="item.value" :value="item.value">
          {{item.text}}
        </a-select-option>
      </a-select>
    </a-form-model-item>
  </div>
</template>

<script>
export default {
  name: 'EncryptKeys',
  props: {
    form: {
      type: Object,
      required: true,
    },
    enableProp: {
      type: String,
      default: 'encryptEnable',
    },
    algProp: {
      type: String,
      default: 'encrypt_key_alg',
    },
    idProp: {
      type: String,
      default: 'encrypt_key_id',
    },
  },
  data () {
    const enable = this.form[this.enableProp] || ''
    return {
      showKeys: enable === 'existing',
      showAlgs: enable === 'new',
      encryptKeyOptions: [],
    }
  },
  created () {
    this.fetchEncryptKeyOptions()
  },
  methods: {
    change (val) {
      const v = val && val.target ? val.target.value : val
      if (v === 'existing') {
        this.showKeys = true
        this.showAlgs = false
      } else if (v === 'new') {
        this.showKeys = false
        this.showAlgs = true
      } else {
        this.showKeys = false
        this.showAlgs = false
        this.form[this.algProp] = undefined
        this.form[this.idProp] = undefined
      }
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
  },
}
</script>
