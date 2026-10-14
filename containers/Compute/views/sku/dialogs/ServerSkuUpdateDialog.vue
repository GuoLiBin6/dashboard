<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.sku')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model :model="form" hideRequiredMark v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.sku.postpaid_status')">
          <a-radio-group v-model:value="form.postpaid">
            <a-radio :value="available">{{ $t('status.sku.available') }}</a-radio>
            <a-radio :value="soldout">{{ $t('status.sku.soldout') }}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.sku.prepaid_status')">
          <a-radio-group v-model:value="form.prepaid">
            <a-radio :value="available">{{ $t('status.sku.available') }}</a-radio>
            <a-radio :value="soldout">{{ $t('status.sku.soldout') }}</a-radio>
          </a-radio-group>
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
  name: 'ServerSkuUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.sku.setup.sell.status'),
      available: 'available',
      soldout: 'soldout',
      form: {
        postpaid: 'available',
        prepaid: 'available',
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
    }
  },
  computed: {
    columns () {
      const showFields = ['name', 'prepaid_status', 'postpaid_status']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  created () {
    try {
      const { data = [] } = this.params
      if (data.length === 1) {
        const { prepaid_status, postpaid_status } = data[0]
        this.form.postpaid = postpaid_status
        this.form.prepaid = prepaid_status
      }
    } catch (err) {}
  },
  methods: {
    async doUpdate () {
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchUpdate', {
        id: ids,
        managerArgs: {
          data: {
            prepaid_status: this.form.prepaid,
            postpaid_status: this.form.postpaid,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doUpdate()
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
