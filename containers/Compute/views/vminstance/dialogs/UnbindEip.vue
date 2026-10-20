<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1264')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1264')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_1265')" :extra="$t('compute.text_1266')" prop="auto_delete">
          <a-switch v-model:checked="form.auto_delete" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
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
  name: 'VmUnbindEipDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        auto_delete: false,
      },
    }
  },
  computed: {
    columns () {
      const fields = ['name', 'metadata', 'ip']
      return this.params.columns.filter(item => {
        const { field } = item
        return fields.indexOf(field) > -1
      })
    },
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
            action: 'dissociate-eip',
            data: {
              auto_delete: this.form.auto_delete,
            },
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
