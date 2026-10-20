<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_363')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.region')" :count="params.data.length" :action="$t('cloudenv.text_363')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('cloudenv.text_364')" prop="enabled">
          <a-switch :checkedChildren="$t('cloudenv.text_84')" :unCheckedChildren="$t('cloudenv.text_85')" v-model:checked="form.enabled" />
          <div slot="extra">{{$t('cloudenv.text_365')}}</div>
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
import { Manager } from '@/utils/manager'

export default {
  name: 'SetRegionAutoSyncDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const data = this.params.data[0]
    return {
      loading: false,
      form: {
        enabled: data.enabled,
      },
    }
  },
  methods: {
    updateAutoSyncStatus (values, ids) {
      const manager = new Manager(`cloudproviders/${this.params.cloudproviderId}/cloudregions`)
      if (ids.length > 1) { // 批量操作
        return manager.batchUpdate({
          ids,
          data: {
            enabled: values.enabled,
          },
        })
      } else {
        return manager.update({
          id: ids[0],
          data: {
            enabled: values.enabled,
          },
        })
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        await this.updateAutoSyncStatus(this.form, ids)
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        // validation or API error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
