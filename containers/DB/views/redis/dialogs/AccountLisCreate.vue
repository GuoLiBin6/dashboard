<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('db.text_282')}}</div>
    <a-form-model ref="formRef" slot="body" :model="form" :rules="rules" class="mt-3" v-bind="formItemLayout">
      <a-form-model-item :label="$t('db.text_283')" prop="name">
        <a-input :placeholder="$t('validator.dbName')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_284')" prop="account_privilege">
        <a-radio-group v-model:value="form.account_privilege">
          <a-radio v-for="k in Object.keys(privileges)" :key="k" :value="k">
            {{privileges[k]}}
          </a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_195')">
        <server-password :loginTypes="loginTypes" :form="form" />
      </a-form-model-item>
    </a-form-model>
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
import validateForm from '@/utils/validate'
import { ACCOUNT_PRIVILEGES } from '../constants'
export default {
  name: 'RedisAccountDialog',
  components: {
    ServerPassword,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loading: false,
      loginTypes: ['random', 'password'],
      form: {
        name: initialValues.name,
        account_privilege: 'read',
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
    rules () {
      const rules = {
        name: [
          { required: true, message: this.$t('db.text_136') },
          { validator: validateForm('dbName') },
        ],
        account_privilege: [
          { required: true, message: this.$t('db.text_136') },
        ],
      }
      if (this.form.loginType === 'password') {
        rules.password = PASSWORD_RULES
      }
      return rules
    },
    privileges () {
      const ret = ACCOUNT_PRIVILEGES
      if (this.params.redisItem.brand === 'Qcloud') {
        delete ret.repl
      }
      return ret
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const params = {
          ...this.form,
          elasticcache: this.params.redisItem.id,
        }
        if (params.loginType === 'random') {
          params.reset_password = true
        }
        delete params.loginType
        await this.params.list.onManager('create', {
          managerArgs: {
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
