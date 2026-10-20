<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.elasticcaches')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" class="mt-3">
        <a-form-model-item v-if="this.params.data[0].provider === 'Huawei'" :label="$t('db.text_291')" prop="old_password">
           <a-input-password v-model:value="form.old_password" />
        </a-form-model-item>
        <a-form-model-item :label="$t('db.text_286')">
            <server-password :loginTypes="['random', 'password']" :form="form" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import ServerPassword, { PASSWORD_RULES } from '@Compute/sections/ServerPassword/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { passwordValidator } from '@/utils/validate'

export default {
  name: 'RedisResetPassworddialog',
  components: {
    ServerPassword,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      form: {
        old_password: undefined,
        loginType: 'random',
        password: undefined,
      },
      loading: false,
    }
  },
  computed: {
    rules () {
      const rules = {}
      if (this.form.loginType === 'password') {
        rules.password = PASSWORD_RULES
      }
      if (this.params.data[0].provider === 'Huawei') {
        rules.old_password = [
          { required: true, message: this.$t('db.text_207') },
          { validator: passwordValidator },
        ]
      }
      return rules
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (values.loginType === 'random') {
          values.reset_password = true
        }
        await this.params.onManager('performAction', {
          id: this.params.data[0].id,
          steadyStatus: 'running',
          managerArgs: {
            action: 'reset-password',
            data: {
              ...values,
            },
          },
        })
        this.cancelDialog()
        this.params.refresh()
        this.$message.success(this.$t('db.text_149'))
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
