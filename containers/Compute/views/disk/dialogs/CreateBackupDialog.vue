<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.create_disk_backup')}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :action="$t('compute.create_disk_backup')" :name="$t('dictionary.disk')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.backup_name')" prop="name">
          <a-input v-model:value="form.name" />
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
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading" :disabled="confirmDisabled">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'DiskCreateBackupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: undefined,
        storage: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_416') },
        ],
        storage: [
          { required: true, message: this.$t('compute.text_1022', [this.$t('compute.backup_storage')]), trigger: 'change' },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
      storageParams: {},
    }
  },
  methods: {
    doCreate (data) {
      return new this.$Manager('diskbackups').create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          name: this.form.name,
          backup_storage_id: this.form.storage,
          disk_id: this.params.data[0].id,
        }
        await this.doCreate(values)
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
