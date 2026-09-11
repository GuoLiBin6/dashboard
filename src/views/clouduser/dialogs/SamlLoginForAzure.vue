<template>
    <base-dialog @cancel="cancelDialog">
      <template #header>{{ $t('scope.text_554') }}</template>
      <template #body>
        <h3>{{ $t('common.saml_login_tips') }}</h3>
        <p class="mt-3">{{ $t('common.saml_login_accout') }}：{{email}}<copy :message="email" /></p>
      </template>
      <template #footer>
        <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('common.copy_and_login') }}</a-button>
        <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
      </template>
    </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import SamlMixin from '../mixin'

export default {
  name: 'SamlLoginForAzureDialog',
  mixins: [DialogMixin, WindowsMixin, SamlMixin],
  data () {
    return {
      loading: false,
      email: this.params.data[0].email,
    }
  },
  methods: {
    async handleConfirm () {
      await this.$copyText(this.email)
      this.samlLogin(this.params.data[0])
      this.cancelDialog()
    },
  },
}
</script>

<style lang="less" scoped>
h3 {
  font-size: 16px;
}
</style>
