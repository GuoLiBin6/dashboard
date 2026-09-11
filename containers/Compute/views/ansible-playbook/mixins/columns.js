import { getStatusTableColumn, getNameDescriptionTableColumn, getProjectTableColumn, getTimeTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        isNameEdit: false,
        showDesc: false,
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'ansiblePlaybook', title: i18n.t('compute.text_229') }),
      getTimeTableColumn({
        field: 'start_time',
        title: i18n.t('compute.text_230'),
      }),
      getTimeTableColumn({
        field: 'end_time',
        title: i18n.t('compute.text_231'),
      }),
      getProjectTableColumn(),
    ]
  },
}
