<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ title }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.gpu')" :count="params.data.length" :action="title" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.text_170')" />
        <a-form-model-item label="CPU" prop="cpu">
          <a-input-number v-model:value="form.cpu" :min="1" :step="1" :precision="0" /> {{$t('compute.text_167')}}
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_168')" prop="memory">
          <a-input-number v-model:value="form.memory" :min="1" :step="1" :precision="0" /> G
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_169')" prop="disk">
          <a-input-number v-model:value="form.disk" :min="1" :step="1" :precision="0" /> G
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
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import {
  getNameDescriptionTableColumn,
  getCopyWithContentTableColumn,
} from '@/utils/common/tableColumn'
import {
  getReserveResourceColumn,
} from '../utils/columns'

export default {
  name: 'SetReserveResourceDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const DEVICE_MAP = {
      '10de': 'nvidia',
      1002: 'amd',
    }
    const initValue = this.params.data[0]
    return {
      title: this.$t('compute.text_490'),
      loading: false,
      form: {
        cpu: initValue.reserved_cpu,
        memory: initValue.reserved_memory / 1024,
        disk: initValue.reserved_storage / 1024,
      },
      rules: {
        cpu: [{ required: true, message: ' ', trigger: 'change' }],
        memory: [{ required: true, message: ' ', trigger: 'change' }],
        disk: [{ required: true, message: ' ', trigger: 'change' }],
      },
      columns: [
        getNameDescriptionTableColumn({
          onManager: this.params.onManager,
          hideField: true,
          slotCallback: row => {
            return h('side-page-trigger', {
              onTrigger: () => this.handleOpenSidepage(row, 'gpu-detail'),
            }, {
              default: () => row.name,
            })
          },
        }),
        {
          field: 'model',
          title: this.$t('compute.text_482'),
          minWidth: 120,
          showOverflow: 'ellipsis',
          slots: {
            default: ({ row }) => {
              const device = row.vendor_device_id.split(':')[0]
              if (!device) {
                return row.model
              }
              return [
                h('div', { class: 'd-flex' }, [
                  h('span', { class: 'text-truncate' }, row.model),
                  h('icon', { class: 'ml-1', style: 'line-height: 24px', type: DEVICE_MAP[device] }),
                ]),
              ]
            },
          },
        },
        getCopyWithContentTableColumn({
          field: 'host',
          title: this.$t('compute.text_484'),
          hideField: true,
          slotCallback: row => row.host || row.host_id,
        }),
        getReserveResourceColumn(),
      ],
    }
  },
  methods: {
    doSubmit (data) {
      const ids = this.params.data.map((item) => item.id)
      return new this.$Manager('isolated_devices').batchUpdate({
        ids,
        data: {
          reserved_cpu: data.cpu,
          reserved_memory: data.memory * 1024,
          reserved_storage: data.disk * 1024,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doSubmit(this.form)
        this.loading = false
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
    handleOpenSidepage (row, tab) {
      this.initSidePageTab(tab)
      this.sidePageTriggerHandle(this, 'GpuSidePage', {
        id: row.id,
        resource: 'isolated_devices',
        currentTab: 'servers-list',
      }, {
        list: this.list,
      })
    },
  },
}
</script>
