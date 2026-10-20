<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1259')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1259')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_1209')" :extra="$t('compute.text_1260')" prop="delete_backup">
          <a-switch v-model:checked="form.delete_backup" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
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
  name: 'VmSwitchBackupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        delete_backup: true,
      },
      purge_backup: false,
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
  },
  created () {
    this.fetchHosts(this.params.data[0])
  },
  methods: {
    async fetchHosts (data) {
      this.loading = true
      try {
        const manager = new this.$Manager('hosts')
        const response = await manager.get({ id: data.host_id })
        if (response.data.host_status !== 'online') {
          this.form.delete_backup = true
          this.purge_backup = true
        } else {
          this.form.delete_backup = false
          this.purge_backup = false
        }
      } finally {
        this.loading = false
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        const ids = this.params.data.map(item => item.id)
        const purgeBackup = this.form.delete_backup ? this.purge_backup : false
        const data = { delete_backup: this.form.delete_backup, purge_backup: purgeBackup }
        await this.params.onManager('batchPerformAction', {
          id: ids,
          steadyStatus: ['running', 'ready'],
          managerArgs: {
            action: 'switch-to-backup',
            data,
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
