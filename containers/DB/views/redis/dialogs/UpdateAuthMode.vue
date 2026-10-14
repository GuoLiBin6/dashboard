<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <div class="mb-3">
        <a-alert :showIcon="false" :message="alertMsg" banner />
      </div>
      <dialog-selected-tips :name="$t('dictionary.elasticcaches')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        v-if="needPassword"
        ref="formRef"
        :model="form"
        :rules="rules"
        class="mt-3"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('db.text_286')" :extra="$t('db.text_359')">
          <server-password :loginTypes="['random', 'password']" :form="form" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button :loading="loading" @click="handleConfirm" type="primary">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import ServerPassword, { PASSWORD_RULES } from '@Compute/sections/ServerPassword/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'RedisUpdateAuthModeDialog',
  components: {
    ServerPassword,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        loginType: 'random',
        password: undefined,
      },
      formItemLayout: {
        wrapperCol: { span: 19 },
        labelCol: { span: 5 },
      },
    }
  },
  computed: {
    needPassword () {
      return this.params.data[0].provider === 'Qcloud' && this.params.data[0].auth_mode === 'off'
    },
    alertMsg () {
      const data = this.params.data[0]
      if (data.auth_mode !== 'on') {
        return this.$t('db.text_292')
      }
      return this.$t('db.text_293')
    },
    rules () {
      const rules = {}
      if (this.needPassword && this.form.loginType === 'password') {
        rules.password = PASSWORD_RULES
      }
      return rules
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        if (this.needPassword) {
          await this.$refs.formRef.validate()
          const values = { ...this.form }
          if (values.loginType === 'random') {
            values.reset_password = true
          }
          delete values.loginType
          await this.params.onManager('performAction', {
            id: this.params.data[0].id,
            steadyStatus: 'running',
            managerArgs: {
              action: 'reset-password',
              data: values,
            },
          })
        } else {
          await this.params.onManager('performAction', {
            steadyStatus: 'running',
            id: this.params.data[0].id,
            managerArgs: {
              action: 'update-auth-mode',
              data: {
                auth_mode: this.params.data[0].auth_mode === 'on' ? 'off' : 'on',
              },
            },
          })
        }
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
