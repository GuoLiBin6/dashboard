<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.add_to_bastion')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.add_to_bastion')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form.fd" :rules="rules" v-bind="formItemLayout">
        <bastion-host :form="form" :model="form.fd" inDialog />
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { createVmFormDefaults } from '@Compute/utils/createServer'
import { SERVER_TYPE } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import BastionHost from '../create/components/BastionHost'

export default {
  name: 'VmAddToBastionDialog',
  components: {
    BastionHost,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { defaults: initFd } = createVmFormDefaults(SERVER_TYPE.idc)
    const fd = {
      ...initFd,
    }
    return {
      loading: false,
      form: {
        fd,
      },
      formItemLayout: {
        wrapperCol: {
          span: 18,
        },
        labelCol: {
          span: 6,
        },
      },
      rules: {
        bastion_host_id: [
          { required: true, message: this.$t('compute.bastionHost.bastion_host.placeholder') },
        ],
        bastion_org_id: [
          { required: true, message: this.$t('compute.bastionHost.bastion_org.placeholder') },
        ],
        nodes: [
          { required: true, message: this.$t('compute.bastionHost.node.placeholder') },
        ],
        privileged_accounts: [
          { required: true, message: this.$t('compute.bastionHost.privileged_account.placeholder') },
        ],
        accounts: [
          { required: true, message: this.$t('compute.bastionHost.account.placeholder') },
        ],
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        values.accounts = [values.privileged_accounts].concat(values.accounts)
        delete values.privileged_accounts
        for (const item of this.params.data) {
          await new this.$Manager('bastion_servers').create({
            data: {
              ...values,
              server_id: item.id,
              generate_name: item.name,
            },
          })
        }
        this.params.refresh()
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
