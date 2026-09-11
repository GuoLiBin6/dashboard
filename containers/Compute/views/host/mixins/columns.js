import _ from 'lodash'
import PasswordFetcher from '@Compute/sections/PasswordFetcher'
import {
  getRegionTableColumn,
  getStatusTableColumn,
  getBrandTableColumn,
  getEnabledTableColumn,
  getNameDescriptionTableColumn,
  getPublicScopeTableColumn,
  getProjectDomainTableColumn,
  getTagTableColumn,
  getAccountTableColumn,
  getOsArch,
  getTimeTableColumn,
  getCopyWithContentTableColumn,
} from '@/utils/common/tableColumn'
import { sizestr, bytesPerSecondStr } from '@/utils/utils'
import i18n from '@/locales'
import { getHostSpecInfo } from '../utils/index'

export default {
  created () {
    const getStatusToolTip = (row) => {
      if (row.metadata) {
        const sysWarn = row.metadata.sys_warn
        const sysError = row.metadata.sys_error
        const titleCon = sysWarn || sysError
        if (titleCon) {
          // const aLink = <side-page-trigger vm={this} name='HostSidePage' id={row.id} list={this.list} tab='event-drawer'>查看日志</side-page-trigger>
          const h = this.$createElement
          const aIcon = h('icon', {
            props: { type: 'exclamation-circle' },
            class: { 'ml-1 oc-pointer': true, 'warning-color': sysWarn, 'error-color': sysError },
          })
          return h('a-tooltip', {
            props: { placement: 'right', title: titleCon },
          }, [aIcon])
        }
      }
      return null
    }
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        addBackup: true,
        formRules: [
          { required: true, message: i18n.t('compute.text_210') },
          // { validator: this.$validate('serverCreateName') },
        ],
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
        cellWrapSlots: row => {
          const h = this.$createElement
          return {
            append: () => {
              var ret = []
              if (row.is_baremetal) {
                ret.push(h('a-tooltip', { props: { title: i18n.t('compute.text_562') } }, [
                  h('icon', { class: 'ml-2', props: { type: 'res-host' }, style: { color: '#1890ff' } }),
                ]))
              }
              if (row.isolated_device_count) {
                ret.push(h('a-tooltip', { props: { title: i18n.t('compute.text_113') } }, [
                  h('icon', { class: 'ml-2', props: { type: 'passthrough' } }),
                ]))
              }
              if (row.page_size_kb > 4) {
                ret.push(h('a-tooltip', { props: { title: i18n.t('compute.large_page_memory_tips') } }, [
                  h('icon', { class: 'ml-2', props: { type: 'large-page-memory' } }),
                ]))
              }
              return ret
            },
          }
        },
      }),
      getStatusTableColumn({
        statusModule: 'host',
        minWidth: 100,
        vm: this,
      }),
      getEnabledTableColumn(),
      getStatusTableColumn({
        field: 'host_status',
        title: i18n.t('compute.text_502'),
        statusModule: 'host_status',
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return [
            hFn('div', { class: 'd-flex align-items-center text-truncate' }, [
              hFn('status', { props: { status: row.host_status, statusModule: 'host_status' } }),
              getStatusToolTip(row),
            ].filter(Boolean)),
          ]
        },
      }),
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'hosts',
        columns: () => this.columns,
        editCheck: (row) => (row.provider || '').toLowerCase() !== 'bingocloud',
      }),
      {
        field: 'custom_ip',
        title: 'IP',
        width: 200,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const cellWrap = []
            if (row.access_ip) {
              cellWrap.push(
                hFn('div', { class: 'd-flex' }, [
                  hFn('list-body-cell-wrap', { props: { row, field: 'access_ip', copy: true } }, [
                    hFn('span', { class: 'text-color-help' }, this.$t('compute.text_1319')),
                  ]),
                ]),
              )
            }
            if (row.ipmi_ip) {
              cellWrap.push(
                hFn('div', { class: 'd-flex' }, [
                  hFn('list-body-cell-wrap', { props: { row, field: 'ipmi_ip', copy: true } }, [
                    hFn('span', { class: 'text-color-help' }, this.$t('compute.text_1320')),
                  ]),
                ]),
              )
            }
            if (row.public_ip) {
              cellWrap.push(
                hFn('div', { class: 'd-flex' }, [
                  hFn('list-body-cell-wrap', { props: { row, field: 'public_ip', copy: true } }, [
                    hFn('span', { class: 'text-color-help' }, ' (EIP) '),
                  ]),
                ]),
              )
            }
            return cellWrap
          },
        },
        formatter: ({ row }) => {
          const list = []
          if (row.access_ip) {
            list.push(`${row.access_ip}${this.$t('compute.text_1319')}`)
          }
          if (row.ipmi_ip) {
            list.push(`${row.ipmi_ip}${this.$t('compute.text_1320')}`)
          }
          if (row.public_ip) {
            list.push(`${row.public_ip} (EIP)`)
          }
          return list.length ? list.join(',') : '-'
        },
      },
      {
        field: 'id',
        title: 'IPMI',
        width: 60,
        slots: {
          default: ({ cellValue, row }) => {
            if (!row.is_baremetal) {
              return '-'
            } else {
              return [this.$createElement(PasswordFetcher, { props: { serverId: row.id, resourceType: 'baremetals' } })]
            }
          },
        },
      },
      {
        field: 'server_id',
        title: i18n.t('compute.text_566'),
        width: 70,
        slots: {
          default: ({ cellValue, row }) => {
            if (!row.is_baremetal) {
              return '-'
            } else {
              return [this.$createElement(PasswordFetcher, { props: { serverId: row.server_id, resourceType: 'servers' } })]
            }
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
          default: ({ row }, h) => {
            if (this.isPreLoad && row.nonsystem_guests === undefined) return [this.$createElement('data-loading')]
            return `${row.nonsystem_guests}`
          },
        },
        formatter: ({ row }) => {
          return row.nonsystem_guests || '-'
        },
      },
      getOsArch({ field: 'cpu_architecture' }),
      {
        field: 'cpu_usage',
        title: this.$t('compute.text_563'),
        minWidth: 120,
        showOverflow: false,
        sortable: true,
        // sortBy: 'order_by_cpu_commit',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const { cpu_count = 0, cpu_used = 0 } = getHostSpecInfo(row)
            const title = `${this.$t('common_407')}: ${Math.round(cpu_used)}\n${this.$t('common_234')}: ${Math.round(cpu_count)}`
            return [hFn('UsedPercent', {
              props: {
                used: cpu_used,
                total: cpu_count,
                title,
                usedFormatter: (val) => val > 0 ? (Math.max(Math.round(val), 1)) : Math.round(val),
                totalFormatter: (val) => val > 0 ? (Math.max(Math.round(val), 1)) : Math.round(val),
              },
            })]
          },
          header: ({ column }, h) => {
            const hFn = h || this.$createElement
            return [
              hFn('span', {}, [
                hFn('span', {}, column.title),
                hFn('a-tooltip', { class: 'ml-1', props: { title: this.$t('compute.order_by_used_percent') } }, [
                  hFn('icon', { props: { type: 'question-circle' }, style: { color: '#aaa' } }),
                ]),
              ]),
            ]
          },
        },
        formatter: ({ row }) => {
          const { cpu_count = 0, cpu_used = 0 } = getHostSpecInfo(row)
          const title = `${this.$t('common_407')}: ${Math.round(cpu_used)}, ${this.$t('common_234')}: ${Math.round(cpu_count)}`
          return title
        },
      },
      {
        field: 'virtual_cpu_usage',
        title: this.$t('compute.text_563_1'),
        minWidth: 120,
        showOverflow: false,
        sortable: true,
        // sortBy: 'order_by_cpu_commit',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const { cpu_commit = 0, cpu_count = 0, cpu_count_virtual = 0, cpu_commit_bound } = getHostSpecInfo(row)
            const title = `${this.$t('common_233')}: ${Math.round(cpu_commit)}\n` +
              `${this.$t('common_234')}: ${Math.round(cpu_count_virtual)}\n` +
              `${this.$t('compute.text_594')}: ${(cpu_commit / cpu_count).toFixed(2)}\n` +
              `${this.$t('compute.cpu_commit_bound')}: ${cpu_commit_bound}`
            return [hFn('UsedPercent', {
              props: {
                used: cpu_commit,
                total: cpu_count_virtual,
                usedLabel: this.$t('common_233'),
                title,
                text: `${Math.round(cpu_commit)}/${Math.round(cpu_count_virtual)}`,
              },
            })]
          },
          header: ({ column }, h) => {
            const hFn = h || this.$createElement
            return [
              hFn('span', {}, [
                hFn('span', {}, column.title),
                hFn('a-tooltip', { class: 'ml-1', props: { title: this.$t('compute.order_by_commit_percent') } }, [
                  hFn('icon', { props: { type: 'question-circle' }, style: { color: '#aaa' } }),
                ]),
              ]),
            ]
          },
        },
        formatter: ({ row }) => {
          const { cpu_commit = 0, cpu_count_virtual = 0 } = getHostSpecInfo(row)
          const title = `${this.$t('common_233')}: ${Math.round(cpu_commit)}, ${this.$t('common_234')}: ${Math.round(cpu_count_virtual)}`
          return title
        },
      },
      {
        field: 'mem_usage',
        title: this.$t('compute.text_564'),
        minWidth: 120,
        showOverflow: false,
        sortable: true,
        // sortBy: 'order_by_mem_commit',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const { mem_size, mem_used } = getHostSpecInfo(row)
            const title = `${this.$t('common_407')}: ${sizestr(mem_used, 'M', 1024)}\n${this.$t('common_234')}: ${sizestr(mem_size, 'M', 1024)}`
            return [hFn('UsedPercent', { props: { title, used: mem_used, total: mem_size, usedFormatter: (val) => sizestr(val, 'M', 1024), totalFormatter: (val) => sizestr(val, 'M', 1024) } })]
          },
          header: ({ column }, h) => {
            const hFn = h || this.$createElement
            return [hFn('span', {}, [hFn('span', {}, column.title), hFn('a-tooltip', { class: 'ml-1', props: { title: this.$t('compute.order_by_used_percent') } }, [hFn('icon', { props: { type: 'question-circle' }, style: { color: '#aaa' } })])])]
          },
        },
        formatter: ({ row }) => {
          const { mem_size, mem_used } = getHostSpecInfo(row)
          const title = `${this.$t('common_407')}: ${sizestr(mem_used, 'M', 1024)}, ${this.$t('common_234')}: ${sizestr(mem_size, 'M', 1024)}`
          return title
        },
      },
      {
        field: 'virtual_mem_usage',
        title: this.$t('compute.text_564_1'),
        minWidth: 120,
        showOverflow: false,
        sortable: true,
        // sortBy: 'order_by_mem_commit',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const { mem_size_virtual, mem_commit, mem_size, mem_commit_bound } = getHostSpecInfo(row)
            const title = `${this.$t('common_233')}: ${sizestr(mem_commit, 'M', 1024)}\n` +
              `${this.$t('common_234')}: ${sizestr(mem_size_virtual, 'M', 1024)}\n` +
              `${this.$t('compute.text_594')}: ${(mem_commit / mem_size).toFixed(2)}\n` +
              `${this.$t('compute.memory_commit_bound')}: ${mem_commit_bound}`
            return [hFn('UsedPercent', { props: { title, used: mem_commit, total: mem_size_virtual, usedLabel: this.$t('common_233'), usedFormatter: (val) => sizestr(val, 'M', 1024), totalFormatter: (val) => sizestr(val, 'M', 1024) } })]
          },
          header: ({ column }, h) => {
            const hFn = h || this.$createElement
            return [hFn('span', {}, [hFn('span', {}, column.title), hFn('a-tooltip', { class: 'ml-1', props: { title: this.$t('compute.order_by_commit_percent') } }, [hFn('icon', { props: { type: 'question-circle' }, style: { color: '#aaa' } })])])]
          },
        },
        formatter: ({ row }) => {
          const { mem_size_virtual, mem_commit } = getHostSpecInfo(row)
          const title = `${this.$t('common_233')}: ${sizestr(mem_commit, 'M', 1024)}, ${this.$t('common_234')}: ${sizestr(mem_size_virtual, 'M', 1024)}`
          return title
        },
      },
      {
        field: 'storage_usage',
        title: this.$t('compute.text_565'),
        minWidth: 120,
        showOverflow: false,
        sortable: true,
        // sortBy: 'order_by_mem_commit',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const { storage_size, actual_storage_used } = getHostSpecInfo(row)
            const title = `${this.$t('common_407')}: ${sizestr(actual_storage_used, 'M', 1024)}\n${this.$t('common_234')}: ${sizestr(storage_size, 'M', 1024)}`
            return [hFn('UsedPercent', { props: { title, used: actual_storage_used, total: storage_size, usedFormatter: (val) => sizestr(val, 'M', 1024), totalFormatter: (val) => sizestr(val, 'M', 1024) } })]
          },
          header: ({ column }, h) => {
            const hFn = h || this.$createElement
            return [hFn('span', {}, [hFn('span', {}, column.title), hFn('a-tooltip', { class: 'ml-1', props: { title: this.$t('compute.order_by_used_percent') } }, [hFn('icon', { props: { type: 'question-circle' }, style: { color: '#aaa' } })])])]
          },
        },
        formatter: ({ row }) => {
          const { storage_size, actual_storage_used } = getHostSpecInfo(row)
          const title = `${this.$t('common_407')}: ${sizestr(actual_storage_used, 'M', 1024)}, ${this.$t('common_234')}: ${sizestr(storage_size, 'M', 1024)}`
          return title
        },
      },
      {
        field: 'virtual_storage_usage',
        title: this.$t('compute.text_565_1'),
        minWidth: 120,
        showOverflow: false,
        sortable: true,
        // sortBy: 'order_by_storage_virtual',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const { storage_size_virtual, storage_commit, storage_size } = getHostSpecInfo(row)
            const title = `${this.$t('common_233')}: ${sizestr(storage_commit, 'M', 1024)}\n` +
              `${this.$t('common_234')}: ${sizestr(storage_size_virtual, 'M', 1024)}\n` +
              `${this.$t('compute.text_594')}: ${(storage_commit / storage_size).toFixed(2)}\n` +
              `${this.$t('compute.storage_commit_bound')}: ${(storage_size_virtual / storage_size).toFixed(2)}`
            return [hFn('UsedPercent', { props: { title, used: storage_commit, total: storage_size_virtual, usedLabel: this.$t('common_233'), usedFormatter: (val) => sizestr(val, 'M', 1024), totalFormatter: (val) => sizestr(val, 'M', 1024) } })]
          },
          header: ({ column }, h) => {
            const hFn = h || this.$createElement
            return [hFn('span', {}, [hFn('span', {}, column.title), hFn('a-tooltip', { class: 'ml-1', props: { title: this.$t('compute.order_by_commit_percent') } }, [hFn('icon', { props: { type: 'question-circle' }, style: { color: '#aaa' } })])])]
          },
        },
        formatter: ({ row }) => {
          const { storage_size_virtual, storage_commit } = getHostSpecInfo(row)
          const title = `${this.$t('common_233')}: ${sizestr(storage_commit, 'M', 1024)}, ${this.$t('common_234')}: ${sizestr(storage_size_virtual, 'M', 1024)}`
          return title
        },
      },
      {
        field: 'disk_rate',
        title: i18n.t('common.disk_rate'),
        minWidth: 100,
        slots: {
          default: ({ row }) => {
            if (row.alert_data && row.alert_data.hasOwnProperty('disk_read_rate') && row.alert_data.hasOwnProperty('disk_write_rate')) {
              return [
                <div>{i18n.t('common.disk_read_rate_value', [bytesPerSecondStr(row.alert_data.disk_read_rate)])}</div>,
                <div>{i18n.t('common.disk_write_rate_value', [bytesPerSecondStr(row.alert_data.disk_write_rate)])}</div>,
              ]
            }
            return '-'
          },
        },
        formatter: ({ row }) => {
          if (row.alert_data && row.alert_data.hasOwnProperty('disk_read_rate') && row.alert_data.hasOwnProperty('disk_write_rate')) {
            return `${i18n.t('common.disk_read_rate_value', [bytesPerSecondStr(row.alert_data.disk_read_rate)])} / ${i18n.t('common.disk_write_rate_value', [bytesPerSecondStr(row.alert_data.disk_write_rate)])}`
          }
          return '-'
        },
      },
      {
        field: 'net_iops',
        title: i18n.t('common.net_iops'),
        minWidth: 100,
        slots: {
          default: ({ row }) => {
            if (row.alert_data && row.alert_data.hasOwnProperty('net_in_rate') && row.alert_data.hasOwnProperty('net_out_rate')) {
              return [
                <div>{i18n.t('common.net_in_rate_value', [bytesPerSecondStr(row.alert_data.net_in_rate)])}</div>,
                <div>{i18n.t('common.net_out_rate_value', [bytesPerSecondStr(row.alert_data.net_out_rate)])}</div>,
              ]
            }
            return '-'
          },
        },
        formatter: ({ row }) => {
          if (row.alert_data && row.alert_data.hasOwnProperty('net_in_rate') && row.alert_data.hasOwnProperty('net_out_rate')) {
            return `${i18n.t('common.net_in_rate_value', [bytesPerSecondStr(row.alert_data.net_in_rate)])} / ${i18n.t('common.net_out_rate_value', [bytesPerSecondStr(row.alert_data.net_out_rate)])}`
          }
          return '-'
        },
      },
      {
        field: 'manufacture',
        title: i18n.t('compute.text_847'),
        width: 70,
        slots: {
          default: ({ row }) => {
            if (row.sys_info && row.sys_info.oem_name) {
              const oem_name = row.sys_info.oem_name.replaceAll(' ', '_')
              const icons = {
                dell: { height: '25px' },
                hp: { height: '25px' },
                hpe: { height: '30px' },
                inspur: { height: '50px' },
                lenovo: { height: '10px' },
                supermicro: { height: '30px' },
                huawei: { height: '30px' },
                red_hat: { height: '30px' },
                ieit_systems: { height: '30px' },
              }
              const arr = Object.keys(icons)
              if (!arr.includes(oem_name)) {
                return row.sys_info.oem_name
              }
              const imgSrc = new URL(`../../physicalmachine/assets/${oem_name}.svg`, import.meta.url).href
              return [
                this.$createElement('a-tooltip', { props: { title: row.sys_info.oem_name } }, [
                  this.$createElement('img', { attrs: { src: imgSrc }, style: icons[oem_name] }),
                ]),
              ]
            }
          },
        },
        formatter: ({ row }) => {
          if (row.sys_info && row.sys_info.oem_name) {
            return row.sys_info.oem_name
          }
          return '-'
        },
      },
      {
        field: 'model',
        title: this.$t('compute.text_580'),
        formatter: ({ cellValue, row }) => {
          return ((row.sys_info || {}).model) || '-'
        },
      },
      getCopyWithContentTableColumn({
        field: 'sn',
        title: this.$t('compute.text_591'),
      }),
      {
        field: 'host_type',
        title: this.$t('compute.host.host_type.title'),
        width: 80,
        formatter: ({ cellValue, row }) => {
          let ret = '-'
          if (row.host_type === 'container') {
            ret = this.$t('compute.host.host_type.container.title')
          } else if (row.host_type === 'kvm' || row.host_type === 'hypervisor') {
            ret = this.$t('compute.host.host_type.kvm.title')
          } else if (row.host_type === 'baremetal') {
            ret = this.$t('compute.host.host_type.baremetal.title')
          } else if (row.host_type) {
            ret = row.host_type
          }
          return ret
        },
      },
      {
        field: 'schedtags',
        title: i18n.t('compute.text_541'),
        width: 120,
        // type: 'expand',
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const tags = _.sortBy(row.schedtags, ['default', 'name'])
            if (!tags.length) {
              return [hFn('div', { class: 'text-color-help' }, this.$t('compute.text_1322'))]
            }
            const list = tags.map(tag => hFn('a-tag', { class: 'mb-2 mr-1', props: { color: 'blue' } }, tag.name))
            return [
              hFn('list-body-cell-popover', {
                props: { text: this.$t('compute.text_619', [tags.length]), maxWidth: '400px' },
              }, [hFn('div', { style: { display: 'inline-flex', flexWrap: 'wrap' } }, list)]),
            ]
          },
        },
        formatter: ({ row }) => {
          const tags = _.sortBy(row.schedtags, ['default', 'name'])
          if (tags.length > 0) {
            return tags.map(tag => tag.name)
          }
          return this.$t('compute.text_1322')
        },
      },
      getBrandTableColumn(),
      getAccountTableColumn({ vm: this }),
      getPublicScopeTableColumn({ vm: this, resource: 'hosts' }),
      getProjectDomainTableColumn({ vm: this }),
      getRegionTableColumn({ vm: this }),
      {
        field: 'alert_data',
        title: this.$t('compute.alert_status'),
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('host_hidden_columns.alert_data')
        },
        slots: {
          header: () => {
            return [
              this.$createElement('span', { style: 'margin-right:5px' }, this.$t('compute.alert_status')),
              this.$createElement('help-tooltip', { props: { name: 'alertDataTimeRange' } }),
            ]
          },
          default: ({ row }) => {
            const state = row.alert_data?.alert_state || 'init'
            return [
              this.$createElement('status', {
                props: {
                  status: state,
                  statusModule: 'monitorresources',
                },
              }),
            ]
          },
        },
      },
      getTimeTableColumn(),
    ]
  },
}
