<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ title }}</template>
    <template #body>
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item
          :label="$t('common.description')"
          prop="desc">
          <a-input v-model:value="form.desc" />
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
import workflowMixin from '@/mixins/workflow'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { WORKFLOW_TYPES } from '@/constants/workflow'

export default {
  name: 'ApplyJoinProjectDialog',
  mixins: [workflowMixin, DialogMixin, WindowsMixin],
  data () {
    const { formData = {}, type } = this.params
    return {
      title: type === 'modifyWorkflow' ? this.$t('common.modify_workflow') + `(${this.$t('common.text00073')}${this.$t('dictionary.project')})` : `${this.$t('common.text00073')}${this.$t('dictionary.project')}`,
      loading: false,
      form: {
        desc: formData.description || '',
      },
      rules: {
        desc: [{ required: true, message: this.$t('common.text00074') }],
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo']),
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(WORKFLOW_TYPES.APPLY_JOIN_PROJECT)
    },
  },
  methods: {
    async handleJoinProjectByWorkflowSubmit (values) {
      const variables = {
        project_domain: this.userInfo.projectDomainId,
        process_definition_key: WORKFLOW_TYPES.APPLY_JOIN_PROJECT,
        initiator: this.userInfo.id,
        paramter: JSON.stringify({ domain: this.userInfo.domain.id }),
        description: values.desc,
      }
      if (this.type === 'modifyWorkflow') {
        await this.updateWorkflow(variables, this.params.workflow)
        this.params.success && this.params.success()
      } else {
        await this.createWorkflow(variables)
      }
      this.$message.success(this.$t('common.worflow_tip', [this.$t('system.text_498', [this.$t('dictionary.project')])]))
      if (this.params.success) {
        this.params.success()
      } else {
        this.$router.push('/workflow')
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        if (this.isOpenWorkflow) {
          await this.handleJoinProjectByWorkflowSubmit(this.form)
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
