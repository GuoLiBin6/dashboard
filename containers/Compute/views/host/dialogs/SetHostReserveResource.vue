<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ title }}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template v-slot:message>{{$t('compute.text_560')}}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.host')" :count="params.data.length" :action="title" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.each_reserved_passthrough')" />
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
import { sizestr } from '@/utils/utils'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import {
  getNameDescriptionTableColumn,
} from '@/utils/common/tableColumn'
import { getIsolatedDeviceCountColumns } from '../utils/columns'

export default {
  name: 'SetHostReserveResourceDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const initValue = this.params.data[0].reserved_resource_for_gpu
    const getRsVal = (val) => {
      return Math.ceil(val / this.params.data[0].isolated_device_count)
    }
    return {
      title: this.$t('compute.setup_passthrough_reserve'),
      loading: false,
      form: {
        cpu: getRsVal(initValue.reserved_cpu),
        memory: getRsVal(initValue.reserved_memory / 1024),
        disk: getRsVal(initValue.reserved_storage / 1024),
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
              onTrigger: () => this.handleOpenSidepage(row, 'host-detail'),
            }, {
              default: () => row.name,
            })
          },
        }),
        getIsolatedDeviceCountColumns(),
        {
          field: '',
          title: this.$t('compute.text_501'),
          minWidth: 100,
          showOverflow: 'title',
          slots: {
            default: ({ row }) => {
              const rs = row.reserved_resource_for_gpu || {}
              const ret = []
              if (rs.reserved_cpu) {
                const config = rs.reserved_cpu + 'C' + (rs.reserved_memory ? sizestr(rs.reserved_memory, 'M', 1024) : '') + (rs.reserved_storage ? sizestr(rs.reserved_storage, 'M', 1024) : '')
                return ret.concat(
                  h('div', { class: 'text-truncate', style: { color: 'var(--oc-color-text-secondary)' } }, config),
                )
              }
              return ret
            },
          },
        },
      ],
    }
  },
  methods: {
    doSubmit (data) {
      const ids = this.params.data.map((item) => { return item.id })
      return new this.$Manager('hosts').batchPerformAction({
        ids,
        action: 'set-reserved-resource-for-isolated-device',
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
      this.sidePageTriggerHandle(this, 'HostSidePage', {
        id: row.id,
        resource: 'hosts',
        getParams: this.getParam,
      }, {
        list: this.list,
      })
    },
  },
}
</script>
