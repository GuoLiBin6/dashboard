import {
  getNameDescriptionTableColumn,
  getProjectDomainTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        title: i18n.t('network.text_21'),
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      {
        field: 'intranet_ip_addr',
        title: i18n.t('network.ssh-proxy.intranet_ip_addr'),
        minWidth: 120,
        slots: {
          default: ({ row }, h) => {
            return [h('div', [
              h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: 'intranet_ip_addr',
                  row: row,
                },
              }, [
                h('span', { style: { color: 'var(--oc-color-text-secondary)' } }, row.intranet_ip_addr || '-'),
              ]),
            ])]
          },
        },
      },
      {
        field: 'host',
        title: i18n.t('network.ssh-proxy.host'),
        minWidth: 120,
        slots: {
          default: ({ row }, h) => {
            return [h('div', [
              h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: 'host',
                  row: row,
                },
              }, [
                h('span', { style: { color: 'var(--oc-color-text-secondary)' } }, row.host || '-'),
              ]),
            ])]
          },
        },
      },
      { field: 'port', title: i18n.t('network.ssh-proxy.port') },
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
