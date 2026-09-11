import { getNameDescriptionTableColumn, getEnabledTableColumn, getCopyWithContentTableColumn, getTimeTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
      }),
      getEnabledTableColumn(),
      getCopyWithContentTableColumn({
        field: 'schedtag',
        title: i18n.t('cloudenv.text_18'),
        hideField: true,
        slotCallback: (row) => {
          if (this.isPreLoad && !row.schedtag) return [this.$createElement('data-loading')]
          return row.schedtag
        },
      }),
      getCopyWithContentTableColumn({
        field: 'condition',
        title: i18n.t('cloudenv.text_22'),
      }),
      getTimeTableColumn(),
    ]
  },
}
