<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ title }}</template>
    <template #body>
      <a-form-model>
        <a-form-model-item :label="$t('common.text00068')">
          <quota-set-to-workflow
            ref="quotaSetRef"
            sence="project"
            :tenant="userInfo.projectId" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import QuotaSetToWorkflow from '@/sections/QuotaSetToWorkflow'
import workflowMixin from '@/mixins/workflow'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { WORKFLOW_TYPES } from '@/constants/workflow'

export default {
  name: 'ApplyProjectQuotaDialog',
  components: {
    QuotaSetToWorkflow,
  },
  mixins: [workflowMixin, DialogMixin, WindowsMixin],
  data () {
    return {
      title: `${this.$t('common.text00069')}${this.$t('dictionary.project')}${this.$t('common.text00070')}`,
      loading: false,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo', 'isDomainMode']),
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(WORKFLOW_TYPES.APPLY_PROJECT_QUOTA)
    },
  },
  methods: {
    async handleApplyQuotaByWorkflowSubmit (quota) {
      const params = { ...quota, tenant: this.userInfo.projectId }
      const variables = {
        project_domain: this.userInfo.projectDomainId,
        project: this.userInfo.projectId,
        process_definition_key: WORKFLOW_TYPES.APPLY_PROJECT_QUOTA,
        initiator: this.userInfo.id,
        paramter: JSON.stringify(params),
      }
      await this.createWorkflow(variables)
      this.$message.success(`${this.$t('common.text00069')}${this.$t('dictionary.project')}${this.$t('common.text00071')}`)
      if (this.params.success) {
        this.params.success()
      } else {
        this.$router.push('/workflow')
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        const quota = this.$refs.quotaSetRef.getParams()
        const oldQuota = this.$refs.quotaSetRef.quotaOptions
        const isChange = this.checkQuotaChangeHandle(oldQuota, quota)
        if (!isChange) {
          this.$message.error(this.$t('common.text00072'))
          return
        }
        if (this.isOpenWorkflow) {
          await this.handleApplyQuotaByWorkflowSubmit(quota)
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
    checkQuotaChangeHandle (oldQuota, quota) {
      let isChange = false
      for (let i = 0; i < oldQuota.length; i++) {
        const item = { ...oldQuota[i] }
        switch (item.key) {
          case 'memory':
            item.originQuota = item.originQuota * 1024
            break
          case 'storage':
            item.originQuota = item.originQuota * 1024
            break
        }
        if (quota[item.key] !== item.originQuota) {
          isChange = true
        }
      }
      return isChange
    },
  },
}
</script>
