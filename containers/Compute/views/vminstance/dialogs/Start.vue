<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="params.name || $t('dictionary.server')" :count="dataList.length" :action="action" />
      <dialog-table :data="dataList" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('compute.text_1041')" v-bind="formItemLayout" v-if="isOpenWorkflow" prop="reason">
          <a-input v-model:value="form.reason" :placeholder="$t('compute.text_1105')" />
        </a-form-model-item>
        <a-form-model-item v-if="showQemuVersion" :label="$t('compute.qemu_version')" v-bind="formItemLayout" prop="qemu_version">
          <a-select
            v-model:value="form.qemu_version"
            style="width: 200px"
            :placeholder="$t('common.select')">
            <a-select-option value="">{{ $t('compute.text_1') }}</a-select-option>
            <a-select-option value="4.2.0">4.2.0</a-select-option>
            <a-select-option value="10.0.7">10.0.7</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="mb-0" v-show="canAutoPrepaid" prop="auto_prepaid">
          <a-checkbox
          v-model:checked="form.auto_prepaid">
            {{$t('compute.change_to_prepaid')}}
          </a-checkbox>
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
import { getNameDescriptionTableColumn, getStatusTableColumn } from '@/utils/common/tableColumn'

export default {
  name: 'VmStartDialog',
  mixins: [DialogMixin, WindowsMixin, WorkflowMixin],
  data () {
    const { type, formData = {} } = this.params
    return {
      loading: false,
      type,
      action: type === 'modifyWorkflow' ? this.$t('common.modify_workflow') + `(${this.$t('compute.text_272')})` : this.$t('compute.text_272'),
      form: {
        reason: formData.reason || '',
        auto_prepaid: formData.auto_prepaid || false,
        qemu_version: formData.qemu_version || '',
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
      dataList: [],
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    columns () {
      if (this.type === 'modifyWorkflow') {
        return [getNameDescriptionTableColumn(), getStatusTableColumn({ statusModule: 'server' })]
      }
      const showFields = ['name', 'ip', 'instance_type']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    // 腾讯云、阿里云、火山云、金山云的按量付费机器，关机可停止付费
    // 腾讯云、阿里云包年包月机器，关机停止付费会转为按量付费机器
    canAutoPrepaid () {
      return this.dataList.every(item => {
        return ['qcloud', 'aliyun', 'ksyun'].includes(item.brand.toLocaleLowerCase())
      }) && this.dataList.some(item => {
        return item.billing_type === 'postpaid'
      })
    },
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(this.WORKFLOW_TYPES.APPLY_SERVER_START)
    },
    /** 所选机器均为 KVM 时才展示 QEMU 版本 */
    showQemuVersion () {
      return this.dataList.length > 0 && this.dataList.every(item => item.hypervisor === 'kvm')
    },
  },
  created () {
    this.initData()
  },
  methods: {
    async initData () {
      if (this.type === 'modifyWorkflow' && this.params.ids) {
        const list = await new this.$Manager('servers', 'v2').batchGet({
          id: this.params.ids,
        })
        this.dataList = list.data?.data || []
      } else {
        this.dataList = this.params.data || []
      }
    },
    buildStartParams () {
      const data = {}
      if (this.form.auto_prepaid) {
        data.auto_prepaid = true
      }
      if (this.showQemuVersion && this.form.qemu_version) {
        data.qemu_version = this.form.qemu_version
      }
      return data
    },
    async doShutDownSubmit () {
      const data = this.buildStartParams()
      const ids = this.dataList.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: 'running',
        managerArgs: {
          action: 'start',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.isOpenWorkflow) {
          if (this.dataList.length > BATCH_OPERATE_SERVERS_MAX) {
            this.$message.error(this.$t('compute.workflow.operate_servers_check.message', [this.$t('compute.text_273'), BATCH_OPERATE_SERVERS_MAX]))
            this.loading = false
            return
          }
          const projects = new Set(this.dataList.map(item => item.tenant_id))
          if (projects.size > 1) {
            this.$message.error(this.$t('compute.text_1348'))
            this.loading = false
            return
          }
          await this.handleShutDownByWorkflowSubmit()
        } else {
          await this.doShutDownSubmit()
        }
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async handleShutDownByWorkflowSubmit () {
      const ids = this.dataList.map(item => item.id)
      await this.$refs.formRef.validate()
      const params = this.buildStartParams()
      const variables = {
        project: this.dataList[0].tenant_id,
        project_domain: this.dataList[0].domain_id,
        process_definition_key: this.WORKFLOW_TYPES.APPLY_SERVER_START,
        initiator: this.userInfo.id,
        ids: ids.join(','),
        description: this.form.reason,
        paramter: JSON.stringify(params),
      }
      if (this.type === 'modifyWorkflow') {
        await this.updateWorkflow(variables, this.params.workflow)
        this.params.success && this.params.success()
      } else {
        await this.createWorkflow(variables)
      }
      this.$message.success(this.$t('common.worflow_tip', [this.$t('compute.text_272')]))
      this.$router.push('/workflow')
    },
  },
}
</script>
