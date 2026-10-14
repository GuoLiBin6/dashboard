<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ title }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout" hideRequiredMark>
        <a-form-model-item
          :label="this.$t('common.text00080')"
          prop="comment">
          <a-textarea v-model:value="form.comment" :autoSize="{ minRows: 4, maxRows: 5 }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.workflow_priority')" prop="priority">
          <a-radio-group v-model:value="form.priority">
            <a-radio-button v-for="item in PRIORITY_OPTS" :value="item.key" :key="item.key">{{ item.value }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { is } from 'ramda'
import { mapGetters } from 'vuex'
import workflowMixin from '@/mixins/workflow'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { WORKFLOW_TYPES, PRIORITY_OPTS } from '@/constants/workflow'

export default {
  name: 'CustomeServiceDialog',
  mixins: [workflowMixin, DialogMixin, WindowsMixin],
  data () {
    return {
      PRIORITY_OPTS,
      title: this.$t('common.text00081'),
      loading: false,
      formItemLayout: {
        wrapperCol: {
          span: 19,
        },
        labelCol: {
          span: 5,
        },
      },
      form: {
        comment: '',
        priority: 'minor',
      },
      rules: {
        comment: [{ required: true, message: this.$t('common.text00082') }],
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo']),
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(WORKFLOW_TYPES.CUSTOMER_SERVICE)
    },
  },
  methods: {
    async handleJoinProjectByWorkflowSubmit (values) {
      const variables = {
        process_definition_key: WORKFLOW_TYPES.CUSTOMER_SERVICE,
        initiator: this.userInfo.id,
        comment: values.comment,
        priority: values.priority,
      }
      await this.createWorkflow(variables)
      this.$message.success(this.$t('common.text00083'))
      if (this.params.callback && is(Function, this.params.callback)) {
        this.params.callback()
      } else {
        this.$router.push('/workflow-technical-support')
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
