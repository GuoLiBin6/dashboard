<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template v-slot:message>
          <div>{{$t('compute.text_1234')}}</div>
        </template>
      </a-alert>
      <dialog-selected-tips :name="$t('compute.vminstance-container')" :count="params.data.length" :action="action" />
      <table-lite-grid class="mb-2" :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_1041')" v-if="isOpenWorkflow" prop="reason">
          <a-input v-model:value="form.reason" :placeholder="$t('compute.text_1105')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1235')" prop="autoStart">
          <a-switch v-model:checked="form.autoStart" />
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
import { BATCH_OPERATE_SERVERS_MAX } from '@/constants/workflow'

export default {
  name: 'VmContainerRestartDialog',
  mixins: [DialogMixin, WindowsMixin, WorkflowMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.text_274'),
      form: {
        reason: '',
        autoStart: false,
      },
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    columns () {
      const showFields = ['name', 'ip', 'instance_type']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(this.WORKFLOW_TYPES.APPLY_SERVER_RESTART)
    },
  },
  methods: {
    async doRestartSubmit () {
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: 'ready',
        managerArgs: {
          action: 'restart',
          data: {
            is_force: this.form.autoStart,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        if (this.isOpenWorkflow) {
          if (this.params.data.length > BATCH_OPERATE_SERVERS_MAX) {
            this.$message.error(this.$t('compute.workflow.operate_servers_check.message', [this.$t('compute.text_274'), BATCH_OPERATE_SERVERS_MAX]))
            this.loading = false
            return
          }
          const projects = new Set(this.params.data.map(item => item.tenant_id))
          if (projects.size > 1) {
            this.$message.error(this.$t('compute.text_1348'))
            this.loading = false
            return
          }
          await this.handleRestartByWorkflowSubmit()
        } else {
          await this.doRestartSubmit()
        }
        this.cancelDialog()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
    async handleRestartByWorkflowSubmit () {
      const ids = this.params.data.map(item => item.id)
      const params = {
        is_force: this.form.autoStart,
      }
      const variables = {
        project: this.params.data[0].tenant_id,
        project_domain: this.params.data[0].domain_id,
        process_definition_key: this.WORKFLOW_TYPES.APPLY_SERVER_RESTART,
        initiator: this.userInfo.id,
        ids: ids.join(','),
        description: this.form.reason,
        paramter: JSON.stringify(params),
      }
      await this.createWorkflow(variables)
      this.$message.success(this.$t('common.worflow_tip', [this.$t('compute.text_274')]))
      this.$router.push('/workflow')
    },
  },
}
</script>
