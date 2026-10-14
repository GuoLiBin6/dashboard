<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body" v-loading="loading">
     <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('common_633')" prop="redirect_uri">
          <a-input :placeholder="$t('common_634')" v-model:value="form.redirect_uri" />
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
  name: 'CredentialOpendIdCreate',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        redirect_uri: '',
      },
      rules: {
        redirect_uri: [
          { required: true, message: this.$t('common_634') },
          { validator: this.$validate('url') },
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
          action: 'create-oidc-secret',
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
