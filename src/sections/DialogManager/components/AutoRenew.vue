<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1232')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning" v-if="tip">
        <template #message>{{tip}}</template>
      </a-alert>
      <dialog-selected-tips :name="params.name" :count="params.data.length" :action="$t('compute.text_1232')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_1233')">
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
  name: 'AutoRenewDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        autoRenew: this.params.data[0].auto_renew,
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
      const showFields = ['name', 'billing_type', 'brand']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    tip () {
      return this.params.alert
    },
  },
  methods: {
    doResourceRenewFeeSubmit (data) {
      const selectedIds = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: selectedIds,
        managerArgs: {
          action: 'set-auto-renew',
          data: {
            auto_renew: data.autoRenew,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doResourceRenewFeeSubmit(this.form)
        this.loading = false
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
