import { getTimeTableColumn } from '@/utils/common/tableColumn'
import {
  getConfigTypeTableColumn,
  getAttirubuteTableColumn,
} from '../utils/columns'
export default {
  created () {
    this.columns = [
      {
        title: this.$t('system.text_101'),
        field: 'name',
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
                  hideField: true,
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
      getConfigTypeTableColumn(),
      getAttirubuteTableColumn({ vm: this }),
      getTimeTableColumn(),
    ]
  },
}
