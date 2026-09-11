import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTimeTableColumn,
  getAccountTableColumn,
  getProjectTableColumn,
  getBrandTableColumn,
} from '@/utils/common/tableColumn'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: row => {
          const h = this.$createElement
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({
        statusModule: 'sslCertificate',
        vm: this,
      }),
      {
        field: 'issuer',
        label: this.$t('network.ssl_certificate.issuer'),
      },
      {
        field: 'sans',
        label: this.$t('network.ssl_certificate.sans'),
        slots: {
          default: ({ row }, h) => {
            if (!row.sans) return '-'
            const list = row.sans.split(',').map(sans => {
              return h('div', sans)
            })
            return [h('div', list)]
          },
        },
      },
      getBrandTableColumn(),
      getAccountTableColumn(),
      getProjectTableColumn(),
      getTimeTableColumn(),
      getTimeTableColumn({ field: 'end_date', title: this.$t('network.ssl_certificate.end_date') }),
    ]
  },
}
