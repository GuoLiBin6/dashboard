import { NOTIFY_TOPIC_TYPES_MAP, NOTIFY_TOPIC_NAMES_MAP } from '@IAM/constants'
import {
  getEnabledTableColumn,
} from '@/utils/common/tableColumn'

import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      {
        title: i18n.t('system.notify.topic.name'),
        field: 'name',
        sortable: true,
        showOverflow: 'ellipsis',
        minWidth: 100,
        slots: {
          default: ({ row }, h) => {
            const val = NOTIFY_TOPIC_NAMES_MAP[row.name] || row.name
            return [
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: row,
                  field: 'name',
                  message: val,
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
                }, val),
              ]),
            ]
          },
        },
      },
      {
        title: i18n.t('system.notify.topic.type'),
        field: 'type',
        sortable: true,
        minWidth: 100,
        showOverflow: 'title',
        formatter: ({ row }) => {
          return NOTIFY_TOPIC_TYPES_MAP[row.type] ? NOTIFY_TOPIC_TYPES_MAP[row.type].label : '-'
        },
      },
      getEnabledTableColumn(),
    ]
  },
}
