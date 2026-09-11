import {
  getNameDescriptionTableColumn,
  getTimeTableColumn,
  getEnabledTableColumn,
  getCopyWithContentTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'
import validateForm from '@/utils/validate'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        formRules: [
          { required: true, message: i18n.t('compute.text_210') },
          { validator: validateForm('serverCreateName') },
        ],
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getEnabledTableColumn(),
      {
        title: i18n.t('compute.text_175'),
        field: 'type',
        formatter: ({ row }) => {
          if (row.type === 'host') {
            return i18n.t('compute.host_port')
          }
          if (row.type === 'guest') {
            return i18n.t('compute.guest_port')
          }
          return '-'
        },
      },
      {
        title: i18n.t('compute.target_name'),
        field: 'target',
      },
      {
        title: i18n.t('compute.target_ip'),
        field: 'target_ips',
        slots: {
          default: ({ row }, h) => {
            const { target_ips = '' } = row
            const ips = target_ips.split(',')
            return ips.map(ip => {
              return h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  field: 'ip',
                  row: { ip },
                  title: ip,
                },
              })
            })
          },
        },
      },
      getCopyWithContentTableColumn({
        field: 'mac_addr',
        title: i18n.t('compute.target_mac'),
        hideField: true,
        message: (row) => {
          return row.mac_addr
        },
        slotCallback: (row) => {
          return row.mac_addr
        },
      }),
      {
        title: i18n.t('compute.flow_count'),
        field: 'flow_count',
      },
      getTimeTableColumn(),
    ]
  },
}
