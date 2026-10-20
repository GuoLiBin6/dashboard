<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1232')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('compute.text_1390')}}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1232')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('compute.text_1233')" prop="autoRenew">
          <a-switch v-model:checked="form.autoRenew" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
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
  name: 'VmResourceRenewFeeDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const autoRenew = this.params.data[0].auto_renew

    return {
      loading: false,
      form: {
        autoRenew,
      },
    }
  },
  computed: {
    columns () {
      const showFields = ['name', 'billing_type', 'brand']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  methods: {
    doResourceRenewFeeSubmit () {
      const selectedIds = this.params.data.map(item => item.id)
      return new this.$Manager('servers', 'v2').batchPerformAction({
        ids: selectedIds,
        action: 'set-auto-renew',
        data: {
          auto_renew: this.form.autoRenew,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doResourceRenewFeeSubmit()
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
