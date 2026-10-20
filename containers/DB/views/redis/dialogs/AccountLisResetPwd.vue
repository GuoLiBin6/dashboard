<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('db.text_201')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="params.name ? params.name : $t('dictionary.elasticcaches')" :count="params.data.length" :action="$t('db.text_201')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" class="mt-3">
        <a-form-model-item :label="$t('db.text_285')">
          {{ params.data[0].name }}
        </a-form-model-item>
        <a-form-model-item :label="$t('db.text_286')">
          <server-password :loginTypes="['random', 'password']" :form="form" />
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
import ServerPassword, { PASSWORD_RULES } from '@Compute/sections/ServerPassword/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'RedisAccountLisResetPwdDialog',
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
    }
  },
  computed: {
    rules () {
      const rules = {}
      if (this.form.loginType === 'password') {
        rules.password = PASSWORD_RULES
      }
      return rules
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const params = { ...this.form }
        if (params.loginType === 'random') {
          params.reset_password = true
        }
        delete params.loginType
        if (this.params.redisItem) {
          params.elasticcache = this.params.redisItem.id
        }
        await this.params.list.onManager('performAction', {
          id: this.params.data[0].id,
          steadyStatus: this.params.steadyStatus,
          managerArgs: {
            action: 'reset-password',
            data: params,
          },
        })
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
