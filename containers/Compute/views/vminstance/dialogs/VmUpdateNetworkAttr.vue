<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('compute.text_247') }}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>
          {{ $t('compute.update_network.alert') }}
        </template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_247')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.num_queues')" prop="num_queues">
          <a-tooltip placement="top" :title="$t('compute.num_queues')">
            <a-input-number
              v-model:value="form.num_queues"
              :min="1"
              :max="16" />
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_860')" prop="driver">
          <a-select v-model:value="form.driver">
            <a-select-option v-for="item of driverArr" :key="item.key" :value="item.key">{{item.label}}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.nics.is_default')" prop="is_default">
          <a-switch v-model:checked="form.is_default" :disabled="is_default_on_init" />
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
  name: 'VmUpdateNetworkAttrDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        num_queues: this.params.data[0].num_queues || 1,
        driver: this.params.data[0].driver || 'virtio',
        is_default: this.params.data[0].is_default || false,
      },
      driverArr: [
        { key: 'virtio', label: 'virtio' },
        { key: 'e1000', label: 'e1000' },
        { key: 'vmxnet3', label: 'vmxnet3' },
        { key: 'rtl8139', label: 'rtl8139' },
      ],
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
    selectedItems () {
      return this.params.data
    },
    is_default_on_init () {
      return this.params.data[0].is_default || this.params.data[0].virtual
    },
  },
  methods: {
    async doUpdateNetworkAttr () {
      const manager = new this.$Manager('servers')
      const sid = this.params.resId
      const nid = this.params.data[0].network_id
      const data = {
        num_queues: this.form.num_queues,
        driver: this.form.driver,
        is_default: this.form.is_default,
      }
      const params = {
        mac: this.params.data[0].mac_addr,
      }
      return manager.update({
        id: `${sid}/networks/${nid}`,
        data,
        params,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doUpdateNetworkAttr()
        this.params.refresh()
        this.cancelDialog()
        this.$message.success(this.$t('compute.text_423'))
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
