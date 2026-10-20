<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1185')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1185')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('compute.bandwidth.symmetric.title')" prop="symmetricBandwidth">
          <a-checkbox v-model:checked="symmetricBandwidth" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.bandwidth.title')" v-if="symmetricBandwidth" prop="bandwidth">
          <a-tooltip placement="top" :title="$t('compute.text_1338', [[bandwidthMax]])">
            <a-input-number v-model:value="form.bandwidth" :parser="getParser" :min="0" :max="bandwidthMax" />
            Mbps
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.bandwidth.tx.title')" v-if="!symmetricBandwidth" prop="tx_bw_limit">
          <a-tooltip placement="top" :title="$t('compute.text_1338', [[bandwidthMax]])">
            <a-input-number v-model:value="form.tx_bw_limit" :parser="getParser" :min="0" :max="bandwidthMax" />
            Mbps
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.bandwidth.rx.title')" v-if="!symmetricBandwidth" prop="rx_bw_limit">
          <a-tooltip placement="top" :title="$t('compute.text_1338', [[bandwidthMax]])">
            <a-input-number v-model:value="form.rx_bw_limit" :parser="getParser" :min="0" :max="bandwidthMax" />
            Mbps
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1041')" v-if="isOpenWorkflow" prop="reason">
          <a-input v-model:value="form.reason" :placeholder="$t('compute.text_1105')" />
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
import WorkflowMixin from '@/mixins/workflow'

export default {
  name: 'VmChangeBandwidthDialog',
  mixins: [DialogMixin, WindowsMixin, WorkflowMixin],
  data () {
    return {
      loading: false,
      form: {
        bandwidth: this.params.data[0].bw_limit || 0,
        tx_bw_limit: this.params.data[0].tx_bw_limit || 0,
        rx_bw_limit: this.params.data[0].rx_bw_limit || 0,
        reason: '',
      },
      rules: {
        bandwidth: [
          { required: true, message: this.$t('compute.text_1188') },
        ],
      },
      bandwidthMax: 100000,
      symmetricBandwidth: !this.params.data[0].tx_bw_limit || !this.params.data[0].rx_bw_limit,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    selectedItems () {
      return this.params.data
    },
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(this.WORKFLOW_TYPES.APPLY_SERVER_CHANGECONFIG)
    },
  },
  methods: {
    async doChangeBandwidth () {
      const manager = new this.$Manager('servers')
      const ids = this.params.data.map(item => item.guest_id)
      const data = {
        bandwidth: this.form.bandwidth,
        tx_bw_limit: this.form.tx_bw_limit,
        rx_bw_limit: this.form.rx_bw_limit,
        mac: this.params.data[0].mac_addr,
      }
      return manager.batchPerformAction({
        ids,
        action: 'change-bandwidth',
        data,
      })
    },
    async doChangeBandwidthByWorkflow () {
      const curData = this.params.data[0]
      const params = {
        bandwidth: this.form.bandwidth,
        tx_bw_limit: this.form.tx_bw_limit,
        rx_bw_limit: this.form.rx_bw_limit,
        mac: curData.mac_addr,
      }
      const resData = this.params.resData
      const serverConf = resData.map((item) => {
        return {
          name: item.name,
          project: item.tenant,
          ip_addr: curData.ip_addr,
          before: {
            bw_limit: curData.bw_limit,
            tx_bw_limit: curData.tx_bw_limit,
            rx_bw_limit: curData.rx_bw_limit,
          },
          after: {
            bw_limit: this.form.bandwidth,
            tx_bw_limit: this.form.tx_bw_limit,
            rx_bw_limit: this.form.rx_bw_limit,
          },
        }
      })
      params.project_id = this.userInfo.projectId
      params.domain = this.userInfo.projectDomainId
      const variables = {
        change_type: 'change-bandwidth',
        project: resData[0].tenant_id,
        project_domain: resData[0].domain_id,
        process_definition_key: this.WORKFLOW_TYPES.APPLY_SERVER_CHANGECONFIG,
        initiator: this.userInfo.id,
        'change-bandwidth-paramter': JSON.stringify(params),
        ids: resData[0].id,
        serverConf: JSON.stringify(serverConf),
        description: this.form.reason,
      }
      await this.createWorkflow(variables)
      this.$message.success(this.$t('common.worflow_tip', [this.$t('compute.text_1185')]))
      this.$router.push('/workflow')
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        if (this.isOpenWorkflow) {
          await this.doChangeBandwidthByWorkflow()
        } else {
          await this.doChangeBandwidth()
        }
        this.params.refresh()
        this.cancelDialog()
        this.$message.success(this.$t('compute.text_423'))
      } finally {
        this.loading = false
      }
    },
    getParser (val) {
      if (isNaN(val)) {
        return 0
      }
      return Math.round(val)
    },
  },
}
</script>
