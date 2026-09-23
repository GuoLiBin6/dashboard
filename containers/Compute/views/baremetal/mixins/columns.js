import PasswordFetcher from '@Compute/sections/PasswordFetcher'
import SystemIcon from '@/sections/SystemIcon'
import { sizestr } from '@/utils/utils'
import { getProjectTableColumn, getStatusTableColumn, getCopyWithContentTableColumn, getIpsTableColumn, getNameDescriptionTableColumn, getTagTableColumn, getRegionTableColumn, getTimeTableColumn, getBrandTableColumn, getAccountTableColumn, getBillingTableColumn } from '@/utils/common/tableColumn'
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
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'server', vm: this }),
      getStatusTableColumn({
        field: 'power_states',
        title: this.$t('compute.power_states'),
        statusModule: 'server',
      }),
      getTagTableColumn({ onManager: this.onManager, resource: 'server', columns: () => this.columns }),
      getIpsTableColumn({ field: 'ip', title: 'IP' }),
      {
        field: 'instance_type',
        title: i18n.t('table.title.flavor'),
        showOverflow: 'ellipsis',
        minWidth: 120,
        sortable: true,
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            const ret = []
            if (row.instance_type) {
              ret.push(hFn('div', { class: 'text-truncate', style: { color: 'var(--oc-color-text-heading)' } }, row.instance_type))
            }
            const config = row.vcpu_count + 'C' + sizestr(row.vmem_size, 'M', 1024) + (row.disk ? sizestr(row.disk, 'M', 1024) : '')
            return ret.concat(hFn('div', { class: 'text-truncate', style: { color: 'var(--oc-color-text-secondary)' } }, config))
          },
        },
      },
      {
        field: 'os_type',
        title: i18n.t('table.title.os'),
        width: 50,
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            let name = (row.metadata && row.metadata.os_distribution) ? row.metadata.os_distribution : row.os_type || ''
            if (name.includes('Windows') || name.includes('windows')) {
              name = 'Windows'
            }
            const version = (row.metadata && row.metadata.os_version) ? `${row.metadata.os_version}` : ''
            const tooltip = (version.includes(name) ? version : `${name} ${version}`) || i18n.t('compute.text_339') // 去重
            return [
              hFn(SystemIcon, { props: { tooltip, name } }),
            ]
          },
        },
      },
      {
        field: 'login_account',
        title: i18n.t('table.title.init_keypair'),
        width: 50,
        slots: {
          default: ({ row }) => {
            return [this.$createElement(PasswordFetcher, { props: { serverId: row.id, resourceType: 'servers' } })]
          },
        },
      },
      getCopyWithContentTableColumn({
        field: 'host',
        title: i18n.t('res.machine'),
        hideField: true,
        slotCallback: (row, h) => {
          if (!row.host) return '-'
          const hFn = h || this.$createElement
          return [hFn('span', {}, row.host)]
        },
        hidden: () => this.$store.getters.isProjectMode,
      }),
      getBrandTableColumn(),
      getBillingTableColumn({
        vm: this,
        hiddenSetBtn: () => this.$isScopedPolicyMenuHidden('baremetal_hidden_menus.server_perform_cancel_expire'),
      }),
      {
        field: 'host_sn',
        title: 'SN',
        minWidth: 70,
        showOverflow: 'ellipsis',
      },
      getProjectTableColumn(),
      getRegionTableColumn(),
      getAccountTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
