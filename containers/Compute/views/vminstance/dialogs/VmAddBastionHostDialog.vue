<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('compute.bastionHost.add_bastion_host') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form.fd" :rules="rules" hideRequiredMark v-bind="formItemLayout">
        <bastion-host
          :form="form"
          :model="form.fd"
          :inDialog="true" />
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>
<script>
import BastionHost from '@Compute/views/vminstance/create/components/BastionHost'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { uuid } from '@/utils/utils'

export default {
  name: 'VmAddBastionHostDialog',
  components: {
    BastionHost,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const fd = {
      bastion_host_enable: false,
      bastion_host_id: undefined,
      bastion_org_id: undefined,
      nodes: undefined,
      port: 22,
      privileged_accounts: undefined,
      accounts: undefined,
      bastion_domain_id: undefined,
    }
    return {
      loading: false,
      form: {
        fd,
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
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
        port: [
          { type: 'number', min: 0, max: 65535, message: this.$t('compute.bastionHost.port.placeholder'), trigger: 'blur', transform: (v) => parseInt(v) },
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
      try {
        const curItem = this.params.data[0]
        const bsManager = new this.$Manager('bastion_servers')
        await this.$refs.formRef.validate()
        this.loading = true
        const values = this.form.fd
        const data = {
          bastion_host_id: values.bastion_host_id,
          bastion_org_id: values.bastion_org_id,
          nodes: values.nodes,
          port: values.port,
          accounts: [values.privileged_accounts].concat(values.accounts),
          server_id: curItem.id,
          name: curItem.name,
          os_type: curItem.os_type,
          bastion_domain_id: values.bastion_domain_id,
        }
        bsManager.create({ data, params: { $t: uuid() } })
        this.$message.success(this.$t('common.success'))
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
