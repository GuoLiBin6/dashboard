<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{title}}</template>
    <template #body>
      <dialog-selected-tips :count="params.data.length" :action="title" :name="name" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="params.projectLabel || $t('dictionary.project')" prop="project">
          <base-select
            v-model="form.project"
            :params="projectParams"
            version="v1"
            remote
            :select-props="{ placeholder: this.$t('rules.project') }"
            resource="projects"
            :filterable="true" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ChangeProjectDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const firstData = this.params.data[0]
    const initialValue = this.params.data.length === 1 ? firstData.tenant_id : undefined
    return {
      loading: false,
      form: {
        project: initialValue,
      },
      rules: {
        project: [
          { required: true, message: this.$t('rules.project') },
        ],
      },
    }
  },
  computed: {
    projectParams () {
      const params = {
        scope: this.$store.getters.scope,
        domain_id: 'default',
        limit: 20,
      }
      if (this.$store.getters.l3PermissionEnable) {
        params.domain_id = this.params.data[0].domain_id
      }
      if (this.params.isHiddenDomain) {
        delete params.domain_id
      }
      return params
    },
    name () {
      return this.params.name || this.$t('common.text00006')
    },
    title () {
      return this.params.title || this.$t('common_641', [this.$t('dictionary.project')])
    },
  },
  methods: {
    async doChangeProject (values, ids) {
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: this.params.steadyStatus || ['running', 'ready'],
        managerArgs: {
          action: this.params.action || 'change-project',
          data: values,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        this.loading = true
        await this.doChangeProject(this.form, ids)
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
