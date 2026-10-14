<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.disk_set_auto_reset')}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :name="$t('dictionary.disk')" :action="$t('compute.disk_set_auto_reset')" />
      <dialog-table v-if="params.columns && params.columns.length" :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form">
        <a-form-model-item :label="$t('compute.shutdown_auto_reset')" v-bind="formItemLayout" prop="auto_reset">
          <a-switch v-model:checked="form.auto_reset" :checkedChildren="$t('cloudenv.text_84')" :unCheckedChildren="$t('cloudenv.text_85')" />
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
  name: 'DiskSetAutoResetDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        auto_reset: this.params.data[0].auto_reset || false,
      },
      formItemLayout: {
        labelCol: {
          sm: { span: 3 },
        },
        wrapperCol: {
          sm: { span: 21 },
        },
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.params.onManager('update', {
          id: this.params.data[0].id,
          managerArgs: {
            data: {
              auto_reset: this.form.auto_reset,
            },
          },
        })
        this.params.refresh()
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
