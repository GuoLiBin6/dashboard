<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])">
          <domain-project :form="form" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.instance_backup_name')" prop="name">
          <a-input
            v-model:value="form.name"
            :placeholder="$t('common.tips.input', [$t('compute.instance_backup_name')])" />
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.backup_storage')"
          prop="storage">
          <base-select
            style="width: 100%"
            v-model:value="form.storage"
            :params="storageParams"
            :select-props="{ placeholder: $t('compute.text_1022', [$t('compute.backup_storage')]) }"
            resource="backupstorages"
            :filterable="true"
            :isDefaultSelect="true" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.unpack_name')" prop="package_name">
          <a-input
            v-model:value="form.package_name"
            :placeholder="$t('common.tips.input', [$t('compute.unpack_name')])" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import DomainProject from '@/sections/DomainProject/model'
import { isRequired } from '@/utils/validate'

export default {
  name: 'ImportUnpackDialog',
  components: {
    DomainProject,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.text_679'),
      form: {
        domain: { key: this.$store.getters.userInfo.projectDomainId, label: this.$store.getters.userInfo.projectDomain },
        project: { key: this.$store.getters.userInfo.projectId, label: this.$store.getters.userInfo.projectName },
        name: undefined,
        storage: undefined,
        package_name: undefined,
      },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('common.tips.input', [this.$t('compute.instance_backup_name')]) },
        ],
        storage: [
          { required: true, message: this.$t('compute.text_1022', [this.$t('compute.backup_storage')]), trigger: 'change' },
        ],
        package_name: [
          { required: true, message: this.$t('common.tips.input', [this.$t('compute.unpack_name')]) },
        ],
      },
      storageParams: {},
    }
  },
  methods: {
    doImportUnpackSubmit () {
      const { name, package_name, storage, project } = this.form
      const params = {
        package_name,
        name,
        backup_storage_id: storage,
        project_id: project.key,
      }
      return this.params.onManager('create', {
        managerArgs: {
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doImportUnpackSubmit()
        this.params.refresh && this.params.refresh()
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
