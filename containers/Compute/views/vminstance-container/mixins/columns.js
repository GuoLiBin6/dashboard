import { SERVER_TYPE } from '@Compute/constants'
import { formatServerSecgroupText, getNetworkTags, renderNetworkTagNodes } from '@Compute/utils/secgroupDisplay'
import {
  getProjectTableColumn,
  getRegionTableColumn,
  getStatusTableColumn,
  getBrandTableColumn,
  getCopyWithContentTableColumn,
  getIpsTableColumn,
  getNameDescriptionTableColumn,
  getTagTableColumn,
  getBillingTableColumn,
  getTimeTableColumn,
  getOsArch,
} from '@/utils/common/tableColumn'
import { sizestr } from '@/utils/utils'
import { findPlatform, typeClouds } from '@/utils/common/hypervisor'
import i18nLocale from '@/locales'
import { HYPERVISORS_MAP } from '@/constants'

export default {
  data () {
    return {
      columns: [],
    }
  },
  created () {
    this.serverManager = new this.$Manager('servers')
    const doCreateOrSwitchBackup = (obj) => {
      this.execLoading = true
      this.serverManager.performAction({
        id: obj.id,
        action: 'reconcile-backup',
        data: {},
      }).then((res) => {
        this.execLoading = false
        this.$message.success(this.$t('message.exec_success'))
      }).catch((err) => {
        this.execLoading = false
        this.$message.success(this.$t('message.exec_fail'))
        throw err
      })
    }
    const getToolTip = (row) => {
      const num = row.metadata.create_backup_count || row.metadata.switch_backup_count
      let time = row.metadata.create_backup || row.metadata.switch_backup
      if (!time) return null
      const msgKey = row.metadata.create_backup
        ? 'compute.text_1342'
        : (row.metadata.switch_backup ? 'compute.text_1343' : null)
      if (!msgKey) return null
      try {
        time = this.$moment(JSON.parse(time)).format()
      } catch (error) {
        return null
      }
      // 列表内避免 a-tooltip（antdv4 setup 在单元格高频挂载易崩）；图标点击仍可重试，文案用原生 title
      const tip = this.$t(msgKey, {
        num: String(num),
        time: String(time),
        link: this.$t('compute.text_1341'),
      })
      return this.$createElement('icon', {
        props: {
          type: 'exclamation-circle',
        },
        class: 'ml-1 error-color oc-pointer',
        attrs: {
          title: String(tip),
        },
        on: {
          click: () => doCreateOrSwitchBackup(row),
        },
      })
    }
    const columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        addLock: true,
        addEncrypt: true,
        addBackup: true,
        formRules: [
          { required: true, message: i18nLocale.t('compute.text_210') },
          // { validator: this.$validate('resourceCreateName') },
        ],
        statusModule: 'container',
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.name')
        },
      }),
      getStatusTableColumn({
        minWidth: 180,
        statusModule: 'container',
        slotCallback: (row, h) => {
          const log = h('side-page-trigger', {
            class: 'ml-1',
            on: {
              trigger: () => this.handleOpenSidepage(row, 'event-drawer'),
            },
          }, this.$t('common.view_logs'))

          return [
            h('div', { class: 'd-flex align-items-center text-truncate' }, [
              h('status', {
                props: {
                  status: row.status,
                  statusModule: 'container',
                  process: row.progress,
                },
              }),
              row.metadata && getToolTip(row),
              row.status?.includes('fail') ? log : null,
            ]),
          ]
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.status')
        },
      }),
      getStatusTableColumn({
        field: 'power_states',
        title: this.$t('compute.power_states'),
        statusModule: 'container',
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.power_states')
        },
      }),
      {
        field: 'is_gpu',
        title: i18nLocale.t('table.title.type'),
        width: 50,
        slots: {
          default: ({ row }) => {
            let tooltip = i18nLocale.t('compute.text_291', [i18nLocale.t('dictionary.server')])
            let icontype = 'cpu'
            if (row.is_gpu) {
              tooltip = `${this.$t('compute.text_113')}${this.$t('dictionary.server')}`
              icontype = 'gpu'
            }
            if (row.backup_host_id) {
              tooltip = this.$t('compute.backup')
              icontype = 'gaokeyong'
            }
            return [this.$createElement('icon', {
              props: { type: icontype },
              style: { fontSize: '16px' },
              attrs: { title: tooltip },
            })]
          },
        },
        formatter: ({ row }) => {
          let tooltip = i18nLocale.t('compute.text_291', [i18nLocale.t('dictionary.server')])
          if (row.is_gpu) {
            tooltip = `GPU${this.$t('dictionary.server')}`
          }
          if (row.backup_host_id) {
            tooltip = this.$t('compute.backup')
          }
          return tooltip
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.is_gpu')
        },
      },
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'server',
        columns: () => this.columns,
        tipName: this.$t('dictionary.server'),
        editCheck: (row) => row.hypervisor !== typeClouds.hypervisorMap.bingocloud.key,
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.metadata')
        },
      }),
      getIpsTableColumn({
        field: 'ips',
        title: 'IP',
        vm: this,
        sortable: true,
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.ips')
        },
      }),
      {
        field: 'macs',
        title: 'MAC',
        slots: {
          default: ({ row }) => {
            if (this.isPreLoad && !row.macs) return [this.$createElement('data-loading')]
            if (row.macs) {
              return row.macs.split(',').map(mac => {
                return this.$createElement('list-body-cell-wrap', {
                  props: {
                    copy: true,
                    row: { mac },
                    hideField: true,
                    field: 'mac',
                  },
                }, mac)
              })
            }
            return []
          },
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.macs')
        },
      },
      getOsArch({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.os_arch')
        },
      }),
      {
        field: 'instance_type',
        title: i18nLocale.t('table.title.flavor'),
        showOverflow: 'ellipsis',
        minWidth: 120,
        sortable: true,
        slots: {
          default: ({ row }, h) => {
            const ret = []
            if (row.instance_type) {
              ret.push(h('div', { class: 'text-truncate', style: { color: 'var(--oc-color-text-heading)' } }, row.instance_type))
            }
            const config = row.vcpu_count + 'C' + (row.vmem_size / 1024) + 'G' + (row.disk ? sizestr(row.disk, 'M', 1024) : '')
            return ret.concat(h('div', { class: 'text-truncate', style: { color: 'var(--oc-color-text-secondary)' } }, config))
          },
        },
        formatter: ({ row }) => {
          const ret = []
          if (row.instance_type) {
            ret.push(row.instance_type)
          }
          const config = row.vcpu_count + 'C' + (row.vmem_size / 1024) + 'G' + (row.disk ? sizestr(row.disk, 'M', 1024) : '')
          return ret.concat(config).join(', ')
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.instance_type')
        },
      },
      {
        field: 'vcpu_count',
        title: 'CPU',
        sortable: true,
        minWidth: 80,
        slots: {
          default: ({ row }, h) => {
            if (row.vcpu_count) {
              return [
                h('list-body-cell-wrap', {
                  props: {
                    row: { row },
                    hideField: true,
                    field: 'vcpu_count',
                  },
                }, row.vcpu_count),
              ]
            }
            return []
          },
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.vcpu_count')
        },
      },
      {
        field: 'vmem_size',
        title: i18nLocale.t('table.title.vmem_size'),
        sortable: true,
        minWidth: 80,
        slots: {
          default: ({ row }, h) => {
            if (row.vmem_size) {
              const config = (row.vmem_size / 1024) + 'G'
              return [
                h('list-body-cell-wrap', {
                  props: {
                    row: { row },
                    hideField: true,
                    field: 'vmem_size',
                  },
                }, config),
              ]
            }
            return []
          },
        },
        formatter: ({ row }) => {
          if (row.vmem_size) {
            const config = (row.vmem_size / 1024) + 'G'
            return config
          }
          return ''
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.vmem_size')
        },
      },
      {
        field: 'disk',
        title: i18nLocale.t('table.title.disk'),
        sortable: true,
        minWidth: 80,
        slots: {
          default: ({ row }, h) => {
            if (this.isPreLoad && !row.disk) return [h('data-loading')]
            const config = row.disk ? sizestr(row.disk, 'M', 1024) : ''
            return [
              h('list-body-cell-wrap', {
                props: {
                  row: { row },
                  hideField: true,
                  field: 'disk',
                },
              }, config),
            ]
          },
        },
        formatter: ({ row }) => {
          if (!row.disk) return ''
          const config = row.disk ? sizestr(row.disk, 'M', 1024) : ''
          return config
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.disk')
        },
      },
      {
        field: 'cpu_usage',
        title: i18nLocale.t('table.title.cpu_usage'),
        sortable: true,
        minWidth: 150,
        hidden: () => true,
        slots: {
          default: ({ row }, h) => {
            const percent = row.cpu_usage ? row.cpu_usage.toFixed(4) * 100 : 0
            return [
              h('a-progress', {
                props: {
                  percent,
                  size: 'small',
                },
              }),
            ]
          },
        },
      },
      {
        field: 'mem_usage',
        title: i18nLocale.t('table.title.mem_usage'),
        sortable: true,
        minWidth: 150,
        hidden: () => true,
        slots: {
          default: ({ row }, h) => {
            const percent = row.mem_usage ? row.mem_usage.toFixed(4) * 100 : 0
            return [
              h('a-progress', {
                props: {
                  percent,
                  size: 'small',
                },
              }),
            ]
          },
        },
      },
      {
        field: 'disk_usage',
        title: i18nLocale.t('table.title.disk_usage'),
        sortable: true,
        minWidth: 150,
        hidden: () => true,
        slots: {
          default: ({ row }, h) => {
            const percent = row.disk_usage ? row.disk_usage.toFixed(4) * 100 : 0
            return [
              h('a-progress', {
                props: {
                  percent,
                  size: 'small',
                },
              }),
            ]
          },
        },
      },
      {
        field: 'secgroups',
        title: i18nLocale.t('res.secgroup'),
        minWidth: 80,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            if (this.isPreLoad && !row.secgroups && !row.network_tags?.length) return [h('data-loading')]
            const networkTags = getNetworkTags(row)
            if (networkTags.length) return renderNetworkTagNodes(networkTags)
            const text = formatServerSecgroupText(row)
            return text || '-'
          },
        },
        formatter: ({ row }) => {
          return formatServerSecgroupText(row) || '-'
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.secgroups')
        },
      },
      getCopyWithContentTableColumn({
        field: 'vpc',
        title: 'VPC',
        hideField: true,
        slotCallback: (row) => {
          if (this.isPreLoad && !row.vpc) return [this.$createElement('data-loading')]
          return row.vpc
        },
        hidden: () => {
          if (this.$store.getters.isProjectMode) return true
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.vpc')
        },
      }),
      getBillingTableColumn({
        vm: this,
        hiddenSetBtn: () => this.$isScopedPolicyMenuHidden('vminstance_container_hidden_menus.server_perform_cancel_expire'),
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.billing_type')
        },
      }),
      getBrandTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.brand')
        },
      }),
      {
        field: 'host',
        title: i18nLocale.t('res.host'),
        sortable: true,
        showOverflow: 'ellipsis',
        minWidth: 100,
        slots: {
          default: ({ row }) => {
            if (!row.host) return [this.$createElement('data-loading')]
            if (findPlatform(row.hypervisor, 'hypervisor') === SERVER_TYPE.public || row.hypervisor === HYPERVISORS_MAP.hcso.hypervisor || row.hypervisor === HYPERVISORS_MAP.hcs.hypervisor) {
              return '-'
            }
            const text = row.host || '-'
            return [
              this.$createElement('list-body-cell-wrap', {
                props: {
                  copy: true,
                  field: 'host',
                  row,
                  message: text,
                },
              }),
            ]
          },
        },
        formatter: ({ row }) => {
          if (findPlatform(row.hypervisor, 'hypervisor') === SERVER_TYPE.public) {
            return ''
          }
          return row.host || ''
        },
        hidden: () => {
          if (this.$store.getters.isProjectMode) return true
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.host')
        },
      },
      getProjectTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.tenant')
        },
      }),
      getRegionTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.region')
        },
      }),
      getTimeTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('server_hidden_columns.created_at')
        },
      }),
    ]
    if (this.hideColumnFields) {
      this.columns = columns.filter((column) => { return !this.hideColumnFields.includes(column.field) })
    } else {
      this.columns = columns
    }
  },
}
