// import * as R from 'ramda'
import {
  getNameDescriptionTableColumn,
  getBrandTableColumn,
  getAccountTableColumn,
  getRegionTableColumn,
  getProjectDomainTableColumn,
  getStatusTableColumn,
  getTagTableColumn,
} from '@/utils/common/tableColumn'
// import VueI18n from 'vue-i18n'
import i18n from '@/locales'
// import { getTagColor, getTagTitle } from '@/utils/common/tag'
export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        edit: false,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row, ''),
            },
          }, row.name)
        },
      }),
      getTagTableColumn({ onManager: this.onManager, resource: 'waf_instances', columns: () => this.columns, tipName: this.$t('network.waf') }),
      getStatusTableColumn({ statusModule: 'waf', vm: this }),
      {
        field: 'type',
        title: i18n.t('network.waf.type'),
        slots: {
          default: ({ row }, h) => {
            const ret = []
            const type = this.$getI18n(`network.waf.type.${row.type}`, row.type)
            ret.push(h('div', type))
            if (row.brand === 'Qcloud') {
              ret.push(h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: 'cname',
                  row: row,
                },
              }, [h('span', { class: 'text-weak' }, row.cname)]))
            }
            return ret
          },
        },
        formatter: ({ row }) => {
          const ret = []
          const type = this.$getI18n(`network.waf.type.${row.type}`, row.type)
          ret.push(type)
          if (row.brand === 'Qcloud') {
            ret.push(row.cname)
          }
          return ret.join(',')
        },
      },
      getBrandTableColumn(),
      getAccountTableColumn(),
      getProjectDomainTableColumn(),
      getRegionTableColumn(),
    ]
  },
}
