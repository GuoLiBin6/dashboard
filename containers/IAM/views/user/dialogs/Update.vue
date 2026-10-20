<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('system.text_479')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.user')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item v-if="params.data.length<=1" :label="$t('scope.text_245')" prop="displayname">
          <a-input :placeholder="$t('system.displayname_tip')" v-model:value="form.displayname" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.text_475')" prop="allow_web_console">
          <a-switch :checkedChildren="$t('system.text_134')" :unCheckedChildren="$t('system.text_135')" v-model:checked="form.allow_web_console" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.text_483')" :extra="mfaExtra" prop="enable_mfa">
          <a-switch :disabled="!!mfaExtra" :checkedChildren="$t('system.text_134')" :unCheckedChildren="$t('system.text_135')" v-model:checked="form.enable_mfa" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'UserUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        allow_web_console: this.params.data[0].allow_web_console,
        enable_mfa: this.params.data[0].enable_mfa,
        displayname: this.params.data[0].displayname || '',
      },
      rules: {
        displayname: [{ required: false }],
      },
      mfaExtra: '',
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
  },
  created () {
    this.fetchApiServiceConfig()
  },
  methods: {
    async fetchApiServiceConfig () {
      try {
        const response = await new this.$Manager('service_settings', 'v1').list()
        const config = (response.data && response.data.yunionapi) || {}
        if (!config.enable_totp) {
          this.mfaExtra = this.$t('system.text_509')
        }
        return config
      } catch (error) {
        if (error.response && error.response.status) {
          this.mfaExtra = this.$t('system.text_510')
        }
        throw error
      }
    },
    async handleConfirm () {
      this.loading = true
      const { data = [], onManager } = this.params
      try {
        await this.$refs.formRef.validate()
        let isSelf = false
        await onManager('batchUpdate', {
          id: data.map(({ id }) => {
            if (id === this.userInfo.id) isSelf = true
            return id
          }),
          managerArgs: {
            data: this.form,
          },
        })
        this.cancelDialog()
        if (data.length === 1 && isSelf) {
          await this.$store.dispatch('auth/getInfo')
        }
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
