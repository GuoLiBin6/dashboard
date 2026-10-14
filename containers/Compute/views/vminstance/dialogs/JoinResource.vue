<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1215')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('compute.text_1216')}}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1215')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form">
        <a-form-model-item v-bind="formItemLayout" prop="autoDestroy">
          <a-checkbox v-model:checked="form.autoDestroy">{{$t('compute.text_1217')}}</a-checkbox>
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
  name: 'VmJoinResourceDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        autoDestroy: true,
      },
      formItemLayout: {
        wrapperCol: { span: 12 },
      },
    }
  },
  methods: {
    doJoinResourceSubmit () {
      const selectedIds = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: selectedIds,
        managerArgs: {
          action: 'prepaid-recycle',
          data: {
            auto_delete: this.form.autoDestroy,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doJoinResourceSubmit()
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
