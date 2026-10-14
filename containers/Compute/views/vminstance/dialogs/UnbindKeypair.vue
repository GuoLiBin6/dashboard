<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_364')}}</div>
    <div slot="body">
      <a-alert class="mb-2" v-if="isOpenStack" :message="$t('compute.text_1267')" type="warning" />
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_364')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_494')" v-bind="formItemLayout" :extra="$t('compute.text_1268')" prop="auto_start">
          <a-switch v-model:checked="form.auto_start" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :disabled="disableAutoStart" />
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
import { HYPERVISORS_MAP, EXTRA_HYPERVISORS } from '@/constants'

const hypervisorMap = Object.assign({}, HYPERVISORS_MAP, EXTRA_HYPERVISORS)

export default {
  name: 'VmUnbindKeypairDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    let autoStartInitialValue = true
    let disableAutoStart = false
    const firstData = this.params.data && this.params.data[0]
    if (firstData && (firstData.status === 'running' || firstData.hypervisor === hypervisorMap.azure.key)) {
      autoStartInitialValue = false
      disableAutoStart = true
    }
    return {
      loading: false,
      disableAutoStart,
      form: {
        auto_start: autoStartInitialValue,
      },
      formItemLayout: {
        wrapperCol: { span: 21 },
        labelCol: { span: 3 },
      },
    }
  },
  computed: {
    isOpenStack () {
      return this.params.data[0].hypervisor === hypervisorMap.openstack.key
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
            action: 'deploy',
            data: {
              auto_start: this.form.auto_start,
              __delete_keypair__: true,
            },
          },
        })
        this.$bus.$emit('VMInstanceListSingleUpdate', [this.params.data[0].id])
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
