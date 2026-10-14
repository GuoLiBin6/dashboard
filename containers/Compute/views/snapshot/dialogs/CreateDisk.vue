<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.snapshot')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])">
          <domain-project
            :form="form"
            :labelInValue="false" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.resourceCreateName')" />
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
import DomainProject from '@/sections/DomainProject/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'SnapshotCreateDiskDialog',
  components: {
    DomainProject,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { domain_id, tenant_id } = this.params.data[0]

    return {
      loading: false,
      action: this.$t('compute.create_disk'),
      form: {
        domain: domain_id,
        project: tenant_id,
        name: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: this.$validate('resourceCreateName') },
        ],
      },
      disabled: false,
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    columns () {
      const showFields = ['name', 'size', 'storage_type']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  methods: {
    async doCreateDiskSubmit () {
      const manager = new this.$Manager('disks')
      return manager.create({
        data: {
          project_id: this.form.project,
          name: this.form.name,
          snapshot_id: this.params.data[0].id,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreateDiskSubmit()
        this.$message.success(this.$t('k8s.text_184'))
        this.$router.push('/disk')
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
