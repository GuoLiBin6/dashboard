<template>
  <base-dialog :width="900" @cancel="cancelDialog">
    <div slot="header">{{$t('db.text_203')}}</div>
    <div slot="body" class="mt-3">
      <dialog-selected-tips :name="$t('dictionary.dbinstanceaccounts')" :action="params.title" :count="params.data.length" />
      <dialog-table :columns="params.columns.slice(0, 3)" :data="params.data" />
      <a-form-model ref="formRef" :model="form.fd" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('db.text_344')" prop="host">
          <template #extra>
            <div>
              <p class="mb-0">{{$t('db.text_345')}}</p>
            </div>
          </template>
          <a-input v-model:value="form.fd.host" disabled />
        </a-form-model-item>
        <a-form-model-item :label="$t('db.text_28')">
          <account-privileges
            :privileges="params.data[0].dbinstanceprivileges || []"
            :rdsItem="params.rdsItem" />
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
import { CreateServerForm } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import AccountPrivileges from '../components/AccountPrivileges'

export default {
  name: 'RDSAccountUpdatePrivilegeDialog',
  components: {
    AccountPrivileges,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loading: false,
      form: {
        fd: {
          host: initialValues.host,
        },
      },
      rules: {
        host: [
          { required: true, message: this.$t('db.text_347') },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: CreateServerForm.wrapperCol },
        labelCol: { span: CreateServerForm.labelCol },
      },
    }
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
        const values = {
          ...this.form.fd,
        }
        await this.params.list.onManager('performAction', {
          id: this.params.data[0].id,
          steadyStatus: ['available'],
          managerArgs: {
            action: 'set-privileges',
            data: values,
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
