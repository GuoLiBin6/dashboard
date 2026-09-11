import { getNameDescriptionTableColumn, getStatusTableColumn, getBrandTableColumn, getRegionTableColumn, getAccountTableColumn, getProjectTableColumn, getTimeTableColumn } from '@/utils/common/tableColumn'
// import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        edit: false,
        editDesc: false,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, [row.name])
        },
      }),
      getStatusTableColumn({ statusModule: 'tablestore', vm: this }),
      // {
      //   field: 'spec',
      //   title: i18n.t('storage.spec'),
      //   width: 120,
      //   formatter: ({ row }) => {
      //     return row.spec || '-'
      //   },
      // },
      // {
      //   field: 'acl',
      //   title: i18n.t('storage.instance_model'),
      //   width: 120,
      //   formatter: ({ row }) => {
      //     return row.acl || '-'
      //   },
      // },
      getBrandTableColumn(),
      getAccountTableColumn(),
      getProjectTableColumn(),
      getRegionTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
