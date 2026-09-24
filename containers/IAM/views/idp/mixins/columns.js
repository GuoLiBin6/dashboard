import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getEnabledTableColumn,
  getCopyWithContentTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  methods: {
    getIdpTemplateLabel (row = {}) {
      const v = row.template || row.driver
      if (!v) return '-'
      const key = `idpTmplTitles.${v}`
      if (this.$te(key)) return this.$t(key)
      const lowerKey = `idpTmplTitles.${String(v).toLowerCase()}`
      if (lowerKey !== key && this.$te(lowerKey)) return this.$t(lowerKey)
      return v
    },
  },
  created () {
    const driverOptions = Object.keys(this.$t('idpDrivers')).reduce((prev, current) => {
      prev[current.toLowerCase()] = current
      return prev
    }, {})
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: row => {
          return this.$createElement('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'idp' }),
      getEnabledTableColumn(),
      getStatusTableColumn({ title: i18n.t('system.text_203'), field: 'sync_status', statusModule: 'sync', minWidth: 120 }),
      getEnabledTableColumn({
        title: i18n.t('common_501'),
        field: 'auto_create_user',
        minWidth: 130,
      }),
      {
        field: 'driver',
        title: i18n.t('system.text_204'),
        minWidth: 80,
        showOverflow: 'ellipsis',
        formatter: ({ cellValue }) => {
          return driverOptions[cellValue] || cellValue
        },
      },
      getCopyWithContentTableColumn({
        field: 'template',
        title: i18n.t('common_550'),
        hideField: true,
        message: (row) => this.getIdpTemplateLabel(row),
        slotCallback: (row) => this.getIdpTemplateLabel(row),
      }),
      {
        minWidth: 120,
        field: 'project_domain',
        title: this.$t('common_548'),
        slots: {
          default: ({ row }, h) => {
            if (!row.project_domain) return this.$t('system.text_15')
            return [
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  field: 'project_domain',
                  row: row,
                  hideField: true,
                  message: row.project_domain,
                },
              }, row.project_domain),
            ]
          },
        },
      },
      getTimeTableColumn(),
    ]
  },
}
