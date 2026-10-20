<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('common.edit') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form">
        <a-form-model-item :label="$t('compute.pci.hot_pluggable')" :extra="$t('compute.pci.hot_pluggable.tips')" prop="hot_pluggable">
          <a-switch v-model:checked="form.hot_pluggable" :checked-children="$t('table.title.on')" :un-checked-children="$t('table.title.off')" />
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
  name: 'UpdateHotPluggableDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        hot_pluggable: this.params.data[0].hot_pluggable,
      },
    }
  },
  created () {
    this.bizManager = new this.$Manager('isolated_device_models')
  },
  methods: {
    doSubmit (data) {
      return this.bizManager.update({
        id: this.params.data[0].id,
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doSubmit({ hot_pluggable: this.form.hot_pluggable })
        this.cancelDialog()
        this.$message.success(this.$t('common.success'))
        this.params.refresh && this.params.refresh()
      } catch (error) {
        this.$message.error(this.$t('common.failed'))
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
