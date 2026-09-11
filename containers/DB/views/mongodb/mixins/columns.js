
// import PasswordFetcher from '@Compute/sections/PasswordFetcher'
import { sizestr } from '@/utils/utils'
import { getProjectTableColumn, getRegionTableColumn, getStatusTableColumn, getNameDescriptionTableColumn, getBrandTableColumn, getAccountTableColumn, getTagTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        addLock: true,
        addBackup: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name || row.external_id)
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.name')
        },
      }),
      getStatusTableColumn({
        statusModule: 'mongodb',
        vm: this,
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.status')
        },
      }),
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'mongodbs',
        columns: () => this.columns,
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.metadata')
        },
      }),
      {
        field: 'instance_type',
        title: this.$t('cloudenv.text_459'),
        showOverflow: 'ellipsis',
        minWidth: 120,
        sortable: true,
        slots: {
          default: ({ row }, h) => {
            const ret = []
            if (row.instance_type) {
              ret.push(h('div', { class: 'text-truncate', style: { color: 'var(--oc-color-text-heading)' } }, row.instance_type))
            }
            const config = row.vcpu_count + 'C' + sizestr(row.vmem_size_mb || 0, 'M', 1024) + sizestr(row.disk_size_mb || 0, 'M', 1024)
            return ret.concat(h('div', { class: 'text-truncate', style: { color: 'var(--oc-color-text-secondary)' } }, config))
          },
        },
        formatter: ({ row }) => {
          const ret = []
          if (row.instance_type) {
            ret.push(row.instance_type)
          }
          const config = row.vcpu_count + 'C' + sizestr(row.vmem_size_mb || 0, 'M', 1024) + sizestr(row.disk_size_mb || 0, 'M', 1024)
          return ret.concat(config).join(',')
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.instance_type')
        },
      },
      {
        field: 'ip_addr',
        title: i18n.t('db.text_152'),
        minWidth: 200,
        slots: {
          default: ({ row }, h) => {
            if (!row.ip_addr) return '-'
            const ret = row.ip_addr.split(';').map(ip => {
              return h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  row: { ip: `${ip}:${row.port}` },
                  field: 'ip',
                },
              }, `${ip}:${row.port}`)
            })
            return ret
          },
        },
        formatter: ({ row }) => {
          if (!row.ip_addr) return '-'
          const ret = row.ip_addr.split(';').map(ip => {
            return `${ip}:${row.port}`
          })
          return ret.join(',')
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.ip_addr')
        },
      },
      {
        field: 'network_address',
        title: i18n.t('db.network_address'),
        minWidth: 200,
        slots: {
          default: ({ row }, h) => {
            if (!row.network_address) return '-'
            const ret = row.network_address.split(',').map(ip => {
              return h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  row: { ip },
                  field: 'ip',
                },
              }, ip)
            })
            return ret
          },
        },
        formatter: ({ row }) => {
          if (!row.network_address) return '-'
          const ret = row.network_address.split(',').map(ip => {
            return ip
          })
          return ret.join(',')
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.network_address')
        },
      },
      {
        field: 'engine_version',
        title: i18n.t('db.text_377'),
        slots: {
          default: ({ row }, h) => {
            const ret = [h('div', `${row.engine} ${row.engine_version}`)]
            if (row.disk_size_mb) {
              ret.push(h('div', {
                class: 'text-truncate',
                style: { color: 'var(--oc-color-text-secondary)' },
              }, sizestr(row.disk_size_mb, 'M', 1024)))
            }
            return ret
          },
        },
        formatter: ({ row }) => {
          let ret = `${row.engine} ${row.engine_version}`
          if (row.disk_size_mb) {
            ret += `,${sizestr(row.disk_size_mb, 'M', 1024)}`
          }
          return ret
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.engine_version')
        },
      },
      getBrandTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.brand')
        },
      }),
      getAccountTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.account')
        },
      }),
      getProjectTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.tenant')
        },
      }),
      getRegionTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('mongodb_hidden_columns.region')
        },
      }),
    ]
  },
}
