<template>
    <base-dialog @cancel="cancelDialog" :width="900">
        <div slot="header">{{params.title}}</div>
        <a-form-model ref="formRef" slot="body" :model="form.fd" :rules="rules" class="mt-3">
            <a-form-model-item :label="$t('db.text_60')" prop="name">
              <a-input :placeholder="$t('validator.dbName')" v-model:value="form.fd.name" />
            </a-form-model-item>
            <a-form-model-item :label="$t('db.text_344')" v-if="params.rdsItem.provider === 'Qcloud'" prop="host">
              <template #extra>
                <div>
                  <p class="mb-0">{{$t('db.text_345')}}</p>
                </div>
              </template>
              <a-input v-model:value="form.fd.host" />
            </a-form-model-item>
            <a-form-model-item :label="$t('db.text_28')" v-if="this.params.rdsItem.brand !== 'Google'">
              <account-privileges :rdsItem="params.rdsItem" />
            </a-form-model-item>
            <a-form-model-item :label="$t('db.text_195')">
              <server-password :loginTypes="loginTypes" :form="form.fd" />
            </a-form-model-item>
        </a-form-model>
         <div slot="footer">
            <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
            <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
         </div>
    </base-dialog>
</template>

<script>
import { RDS_ACCOUNT_PRIVILEGES } from '@DB/constants'
import ServerPassword, { PASSWORD_RULES } from '@Compute/sections/ServerPassword/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import validateForm from '@/utils/validate'
import AccountPrivileges from '../components/AccountPrivileges'
export default {
  name: 'RDSAccountCreateDialog',
  components: {
    AccountPrivileges,
    ServerPassword,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loginTypes: ['random', 'password'],
      loading: false,
      privileges: RDS_ACCOUNT_PRIVILEGES,
      form: {
        fd: {
          name: initialValues.name,
          host: initialValues.host,
          loginType: 'random',
          password: undefined,
        },
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
      }
      if (this.form.fd.loginType === 'password') {
        rules.password = PASSWORD_RULES
      }
      if (this.params.rdsItem.provider === 'Qcloud') {
        rules.host = [
          { required: true, message: this.$t('db.text_347') },
        ]
      }
      return rules
    },
  },
  provide () {
    return {
      form: this.form,
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const params = {
          ...this.form.fd,
          dbinstance: this.params.rdsItem.id,
        }
        delete params.checkPassword
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
