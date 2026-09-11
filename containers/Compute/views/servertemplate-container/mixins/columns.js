import {
  getProjectTableColumn,
  getRegionTableColumn,
  getStatusTableColumn,
  getBrandTableColumn,
  getCopyWithContentTableColumn,
  getNameDescriptionTableColumn,
  getBillingTypeTableColumn,
  getOsArch,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import SystemIcon from '@/sections/SystemIcon'
import { sizestr } from '@/utils/utils'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        // addLock: true,
        addBackup: true,
        formRules: [
          { required: true, message: i18n.t('compute.text_210') },
          { validator: this.$validate('resourceCreateName') },
        ],
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'servertemplate', vm: this }),
      getOsArch({ field: 'content.os_arch' }),
      {
        field: 'instance_type',
        title: i18n.t('table.title.flavor'),
        showOverflow: 'ellipsis',
        minWidth: 120,
        sortable: true,
        slots: {
          default: ({ row }) => {
            if (!row.config_info) return [this.$createElement('data-loading')]
            const { sku, disks } = row.config_info
            const diskSize = disks.map(item => item.size_mb).reduce((a, b) => {
              return a + b
            })
            const ret = []
            if (row.name) {
              ret.push(this.$createElement('div', {
                class: 'text-truncate',
                style: { color: 'var(--oc-color-text-heading)' },
              }, sku.name))
            }
            const config = sku.cpu_core_count + 'C' + sizestr(sku.memory_size_mb, 'M', 1024) + (diskSize ? sizestr(diskSize, 'M', 1024) : '')
            return ret.concat(this.$createElement('div', {
              class: 'text-truncate',
              style: { color: 'var(--oc-color-text-secondary)' },
            }, config))
          },
        },
        formatter: ({ row }) => {
          const { sku, disks } = row.config_info || {}
          const diskSize = disks.map(item => item.size_mb).reduce((a, b) => {
            return a + b
          })
          const ret = []
          if (row.name) {
            ret.push(sku.name)
          }
          const config = sku.cpu_core_count + 'C' + sizestr(sku.memory_size_mb, 'M', 1024) + (diskSize ? sizestr(diskSize, 'M', 1024) : '')
          return ret.concat(config).join(',')
        },
      },
      {
        field: 'os_type',
        title: i18n.t('table.title.os'),
        width: 50,
        slots: {
          default: ({ row }) => {
            let name = (row.metadata && row.metadata.os_distribution) ? row.metadata.os_distribution : row.os_type || ''
            if (name.includes('Windows') || name.includes('windows')) {
              name = 'Windows'
            }
            const version = (row.metadata && row.metadata.os_version) ? `${row.metadata.os_version}` : ''
            const tooltip = (version.includes(name) ? version : `${name} ${version}`) || i18n.t('compute.text_339') // 去重
            return [
              this.$createElement(SystemIcon, { props: { tooltip, name } }),
            ]
          },
        },
        formatter: ({ row }) => {
          let name = (row.metadata && row.metadata.os_distribution) ? row.metadata.os_distribution : row.os_type || ''
          if (name.includes('Windows') || name.includes('windows')) {
            name = 'Windows'
          }
          return name
        },
      },
      {
        field: 'config_info.image',
        title: i18n.t('res.image'),
        showOverflow: 'ellipsis',
        minWidth: 190,
        slots: {
          default: ({ row }) => {
            if (!row.config_info) return [this.$createElement('data-loading')]
            return row.config_info.image
          },
        },
        formatter: ({ row }) => {
          return row.config_info?.image
        },
      },
      getCopyWithContentTableColumn({ field: 'vpc', title: 'VPC', vm: this }),
      getBillingTypeTableColumn(),
      getBrandTableColumn(),
      getProjectTableColumn(),
      getRegionTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
