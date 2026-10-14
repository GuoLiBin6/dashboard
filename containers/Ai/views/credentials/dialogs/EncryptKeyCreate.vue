<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body" v-loading="loading">
     <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('scope.encrypt_key.title.name')" prop="name">
          <a-input :placeholder="$t('scope.encrypt_key.title.name')" v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('scope.encrypt_key.title.alg')" prop="alg">
          <a-radio-group v-model:value="form.alg">
            <a-radio-button value="">{{ $t('compute.text_1') }}</a-radio-button>
            <a-radio-button value="aes-256">AES-256</a-radio-button>
            <a-radio-button value="sm4">SM4</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>
<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CredentialEncryptKeyCreate',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        alg: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('scope.encrypt_key.require_name.prompt') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 19,
        },
        labelCol: {
          span: 5,
        },
      },
    }
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('rpc/credentials', 'v1')
  },
  methods: {
    async handleConfirm () {
      try {
        await this.$refs.formRef.validate()
        await this.manager.performClassAction({
          action: 'create-encrypt-key',
          data: { ...this.form },
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (err) {
        throw err
      }
    },
  },
}
</script>
