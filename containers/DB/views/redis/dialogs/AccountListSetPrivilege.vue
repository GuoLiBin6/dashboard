<template>
    <base-dialog @cancel="cancelDialog">
        <div slot="header">{{params.title}}</div>
        <div slot="body">
           <dialog-selected-tips :name="$t('dictionary.elasticcaches')" :count="params.data.length" :action="params.title" />
           <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
           <a-form-model ref="formRef" :model="form" class="mt-5" v-bind="formItemLayout">
              <a-form-model-item :label="$t('db.text_284')" prop="account_privilege">
                <a-radio-group v-model:value="form.account_privilege">
                    <a-radio v-for="k in Object.keys(privileges)" :key="k" :value="k">
                      {{privileges[k]}}
                    </a-radio>
                </a-radio-group>
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
import { CreateServerForm } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { ACCOUNT_PRIVILEGES } from '../constants'
export default {
  name: 'RedisAccountListSetPrivilegeDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loading: false,
      form: {
        account_privilege: initialValues.account_privilege,
      },
      formItemLayout: {
        wrapperCol: { span: CreateServerForm.wrapperCol },
        labelCol: { span: CreateServerForm.labelCol },
      },
    }
  },
  computed: {
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
        const params = {
          account_privilege: this.form.account_privilege,
          elasticcache: this.params.redisItem.id,
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
