<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('compute.text_1067')}}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.snapshot')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('compute.text_494')" v-bind="formItemLayout" :extra="$t('compute.text_1068')" prop="autoStart">
          <a-switch v-model:checked="form.autoStart" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :disabled="disabled" />
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

export default {
  name: 'DiskRollbackDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.text_1069'),
      form: {
        autoStart: true,
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
      const showFields = ['name', 'brand', 'disk_type']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  watch: {
    'params.data': {
      immediate: true,
      deep: true,
      handler (val) {
        if (val.some(v => !v.guest)) {
          this.disabled = true
          this.form.autoStart = false
        } else {
          this.disabled = false
          this.form.autoStart = true
        }
      },
    },
  },
  methods: {
    async doRollbackDiskSubmit () {
      const params = {
        snapshot_id: this.params.data[0].id,
        auto_start: this.form.autoStart,
      }
      const ids = this.params.data.map(item => item.disk_id)
      const manager = new this.$Manager('disks')
      return manager.performAction({
        id: ids[0],
        action: 'disk-reset',
        data: params,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doRollbackDiskSubmit()
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        // submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
