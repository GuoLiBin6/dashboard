<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ title }}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template v-slot:message>{{ $t('compute.host.cpu.revert.resource.message') }}</template>
      </a-alert>
      <a-alert class="mb-2" type="warning">
        <template v-slot:message>{{ $t('compute.host.cpu.revert.resource.message_1') }}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.host')" :count="params.data.length" :action="title" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.executable_file_name')" :extra="$t('compute.executable_file_name.extra')" prop="processes_prefix">
          <a-textarea v-model:value="form.processes_prefix" :rows="5" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1058')" :extra="cpuExtra" prop="cpus">
          <a-checkbox-group
            v-model:value="form.cpus"
            style="width: 100%; margin-top: 10px;">
            <a-row>
              <a-col :span="4" v-for="v in hostCpus" :key="v">
                <a-checkbox :value="v - 1">{{ v - 1 }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-model-item>
        <a-form-model-item label="Numa Node" prop="nodes">
          <a-checkbox-group
            v-model:value="form.nodes"
            style="width: 100%; margin-top: 10px;">
            <a-row>
              <a-col :span="4" v-for="v in hostNodes" :key="v">
                <a-checkbox :value="v - 1">{{ v - 1 }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
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
import _ from 'lodash'
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import {
  getNameDescriptionTableColumn,
} from '@/utils/common/tableColumn'

export default {
  name: 'SetHostCpuReserveResourceDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      title: this.$t('compute.host.set_system_reserve_resource'),
      loading: false,
      form: {
        cpus: [],
        processes_prefix: '',
        nodes: [],
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
        {
          field: 'custom_ip',
          title: 'IP',
          width: 200,
          showOverflow: 'ellipsis',
          slots: {
            default: ({ row }) => {
              const cellWrap = []
              if (row.access_ip) {
                cellWrap.push(
                  h('div', { class: 'd-flex' }, [
                    h('list-body-cell-wrap', { row, field: 'access_ip', copy: true }, {
                      default: () => [h('span', { class: 'text-color-help' }, this.$t('compute.text_1319'))],
                    }),
                  ]),
                )
              }
              if (row.ipmi_ip) {
                cellWrap.push(
                  h('div', { class: 'd-flex' }, [
                    h('list-body-cell-wrap', { row, field: 'ipmi_ip', copy: true }, {
                      default: () => [h('span', { class: 'text-color-help' }, this.$t('compute.text_1320'))],
                    }),
                  ]),
                )
              }
              return cellWrap
            },
          },
        },
        {
          field: 'nonsystem_guests',
          sortBy: 'order_by_server_count',
          title: '#VM',
          width: 60,
          sortable: true,
          slots: {
            default: ({ row }) => {
              if (this.isPreLoad && row.nonsystem_guests === undefined) return [h('data-loading')]
              return `${row.nonsystem_guests}`
            },
          },
        },
      ],
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      selectedItems: [],
    }
  },
  computed: {
    cpuExtra () {
      return this.form.cpus.length === 0 ? this.$t('compute.host.cpu_reserve_extra') : null
    },
    selectedItem () {
      return this.selectedItems && this.selectedItems[0]
    },
    isSingle () {
      return this.selectedItems?.length === 1
    },
    hostCpus () {
      const cpuCounts = this.selectedItems.map(item => item.cpu_count)
      return Math.max(...cpuCounts)
    },
    hostNodes () {
      const cpuCounts = this.selectedItems.map(item => (item.sys_info?.topology?.nodes || []).length)
      return Math.max(...cpuCounts)
    },
  },
  created () {
    this.init()
  },
  methods: {
    async init () {
      try {
        const res = await new this.$Manager('hosts').list({
          params: {
            filter: `id.in(${this.params.data.map(item => item.id).join(',')})`,
          },
        })
        this.selectedItems = res.data.data || []
      } catch (error) {
        throw error
      }
      if (this.selectedItems.length === 0) {
        this.selectedItems = this.params.data
      }
      const arr = this.selectedItems.map(item => {
        const reserved_cpus_info = JSON.parse(item.metadata.reserved_cpus_info || '{}')
        const cpus = item.metadata.reserved_cpus_info ? (reserved_cpus_info?.cpus || '').split(',').map(v => parseInt(v)) : []
        const processes_prefix = item.metadata.reserved_cpus_info ? reserved_cpus_info?.processes_prefix || [] : []
        const mems = item.metadata.reserved_cpus_info ? (reserved_cpus_info?.mems || '').split(',').map(v => parseInt(v)) : []
        return { cpus, mems, processes_prefix }
      })
      this.form.cpus = _.intersection(...(arr.map(item => item.cpus)))
      this.form.processes_prefix = _.intersection(...(arr.map(item => item.processes_prefix))).join('\n')
      this.form.nodes = _.intersection(...(arr.map(item => item.mems)))
    },
    doReserveResourceSubmit (values) {
      const { cpus, nodes, processes_prefix = [] } = values
      const ids = this.params.data.map(item => item.id)
      const params = { cpus: cpus.join(','), mems: nodes.join(','), processes_prefix }

      if (this.isSingle) {
        if (cpus.length === 0) {
          return this.params.onManager('performAction', {
            id: ids[0],
            steadyStatus: ['ready'],
            managerArgs: {
              action: 'unreserve-cpus',
            },
          })
        }
        return this.params.onManager('performAction', {
          id: ids[0],
          steadyStatus: ['ready'],
          managerArgs: {
            action: 'reserve-cpus',
            data: params,
          },
        })
      } else {
        if (cpus.length === 0) {
          return this.params.onManager('batchPerformAction', {
            id: ids,
            steadyStatus: ['ready'],
            managerArgs: {
              action: 'unreserve-cpus',
            },
          })
        }
        return this.params.onManager('batchPerformAction', {
          id: ids,
          steadyStatus: ['ready'],
          managerArgs: {
            action: 'reserve-cpus',
            data: params,
          },
        })
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          ...this.form,
          processes_prefix: (this.form.processes_prefix || '').split(/\r*\n/).filter(v => v.trim() !== ''),
        }
        await this.doReserveResourceSubmit(values)
        this.params.refresh && this.params.refresh()
        this.cancelDialog()
        this.$message.success(this.$t('compute.text_423'))
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
