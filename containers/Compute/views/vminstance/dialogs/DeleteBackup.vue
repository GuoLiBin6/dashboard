<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1209')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1209')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_1210')" v-bind="formItemLayout" :extra="$t('compute.text_1211')" prop="purge">
          <a-switch v-model:checked="form.purge" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :disabled="disableAutoPurge" />
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
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'VmDeleteBackupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        purge: false,
      },
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
      const col = this.params.columns.slice(0, 3)
      col.push({
        field: 'backup_host_status',
        title: this.$t('compute.text_1163'),
        width: 120,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }) => {
            return [h('status', { status: row.backup_host_status, statusModule: 'host_status' })]
          },
        },
      })
      return col
    },
    disableAutoPurge () {
      return this.params.data.some((obj) => { return obj.backup_host_status === 'online' })
    },
  },
  mounted () {
    const isOnline = this.params.data.some((obj) => { return obj.backup_host_status === 'online' })
    if (!isOnline) {
      this.form.purge = true
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        const ids = this.params.data.map(item => item.id)
        await this.params.onManager('batchPerformAction', {
          id: ids,
          steadyStatus: ['running', 'ready'],
          managerArgs: {
            action: 'delete-backup',
            data: this.form,
          },
        })
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
