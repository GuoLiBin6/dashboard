import {
  getTimeTableColumn,
  getEnabledTableColumn,
  getProjectDomainTableColumn,
} from '@/utils/common/tableColumn'

import i18n from '@/locales'
import {
  getMobileTableColumn,
  getEmailTableColumn,
  getVerifiedContactTypesTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      {
        title: i18n.t('system.text_143'),
        field: 'name',
        sortable: true,
        showOverflow: 'ellipsis',
        minWidth: 100,
        slots: {
          default: ({ row }, h) => {
            return [
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: row,
                  field: 'name',
                  list: this.list,
                  hideField: true,
                  addLock: false,
                  addBackup: false,
                },
              }, [
                h('side-page-trigger', {
                  on: {
                    trigger: () => this.handleOpenSidepage(row),
                  },
                }, row.name),
              ]),
            ]
          },
        },
      },
      getEnabledTableColumn(),
      getMobileTableColumn(),
      getEmailTableColumn(),
      getVerifiedContactTypesTableColumn({ vm: this }),
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
