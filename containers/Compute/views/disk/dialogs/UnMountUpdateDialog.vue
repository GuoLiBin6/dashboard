<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.disk_perform_detach')}}</div>
    <div slot="body">
      <a-alert :message="$t('compute.text_440')" banner />
      <dialog-selected-tips :count="params.data.length" :action="$t('compute.disk_perform_detach')" :name="$t('dictionary.disk')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark>
        <a-form-model-item class="mb-0" prop="keep_disk">
          <a-checkbox v-model:checked="form.keep_disk" :disabled="disabledKeepDisk">{{ $t('compute.disk.detach') }}</a-checkbox>
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
  name: 'DiskUnMountUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const initKeepDisk = this.params.data[0] && (this.params.data[0].provider === 'VMware' || this.params.data[0].provider === 'Nutanix')
    return {
      loading: false,
      form: {
        keep_disk: initKeepDisk,
      },
      disabledKeepDisk: initKeepDisk,
      serversOpts: [],
    }
  },
  created () {
    const params = {
      details: false,
      disk: this.params.data[0].id,
    }
    new this.$Manager('servers').list({ params })
      .then((res) => {
        this.serversOpts = res.data.data
      })
  },
  methods: {
    async doUpdate () {
      const guestId = this.params.data[0] && this.params.data[0].guests[0] && this.params.data[0].guests[0].id
      const diskId = this.params.data[0] && this.params.data[0].id
      if (this.form.keep_disk) {
        await new this.$Manager('disks').update({
          id: diskId,
          data: {
            auto_delete: true,
          },
        })
      }
      return new this.$Manager('servers').performAction({
        action: 'detachdisk',
        id: guestId,
        data: {
          disk_id: this.params.data[0].id,
          keep_disk: !this.form.keep_disk,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doUpdate()
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
