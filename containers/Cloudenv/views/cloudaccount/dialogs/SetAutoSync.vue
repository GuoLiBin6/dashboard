<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_106')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.cloudaccount')" :count="params.data.length" :action="$t('cloudenv.text_106')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('cloudenv.text_83')" prop="enable_auto_sync">
          <a-switch :checkedChildren="$t('cloudenv.text_84')" :unCheckedChildren="$t('cloudenv.text_85')" v-model:checked="form.enable_auto_sync" @change="enableChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_86')" prop="sync_interval_seconds" v-if="showTime">
          <a-input-number
            v-model:value="form.sync_interval_seconds"
            :min="30" />
          <span class="ml-1">{{$t('cloudenv.text_87')}}</span>
          <div slot="extra">{{$t('cloudenv.text_280')}}</div>
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

const MIN_TIME = 30 // 分钟
const DEFAULT_TIME = 60 // 分钟

export default {
  name: 'CloudaccountSetAutoSyncDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const data = this.params.data[0]
    const exsitInterval = parseInt(data.sync_interval_seconds / 60)
    return {
      loading: false,
      showTime: data.enable_auto_sync,
      form: {
        enable_auto_sync: data.enable_auto_sync,
        sync_interval_seconds: exsitInterval >= MIN_TIME ? exsitInterval : DEFAULT_TIME,
      },
    }
  },
  methods: {
    enableChange (val) {
      this.showTime = val
    },
    // 更新自动同步状态
    updateAutoSyncStatus (data, ids) {
      // 是否需要更新
      const isUpdate = this.params.data.some(item => item.enable_auto_sync !== data.enable_auto_sync)
      if (!isUpdate) return Promise.resolve()
      const action = data.enable_auto_sync ? 'enable-auto-sync' : 'disable-auto-sync'
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: this.params.steadyStatus,
        managerArgs: {
          action,
          data: {
            sync_interval_seconds: data.sync_interval_seconds * 60,
          },
        },
      })
    },
    // 更新自动同步时间间隔
    updateAutoSyncInterval (data, ids) {
      // 是否需要更新
      const isUpdate = this.params.data.some(item => item.sync_interval_seconds !== data.sync_interval_seconds)
      if (!isUpdate) return Promise.resolve()
      return this.params.onManager('batchUpdate', {
        id: ids,
        steadyStatus: this.params.steadyStatus,
        managerArgs: {
          data: {
            sync_interval_seconds: data.sync_interval_seconds * 60,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        const values = { ...this.form }
        await this.updateAutoSyncStatus(values, ids)
        await this.updateAutoSyncInterval(values, ids)
        this.cancelDialog()
      } catch (error) {
        // validation or API error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
