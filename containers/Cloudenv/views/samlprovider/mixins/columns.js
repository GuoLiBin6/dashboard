import {
  getNameDescriptionTableColumn,
  getCopyWithContentTableColumn,
  getStatusTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        showDesc: false,
        edit: false,
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
      }),
      getCopyWithContentTableColumn({
        field: 'entity_id',
        title: i18n.t('cloudenv.entity_id'),
      }),
      getCopyWithContentTableColumn({
        field: 'auth_url',
        title: i18n.t('cloudenv.auth_url'),
      }),
      getStatusTableColumn({ statusModule: 'common' }),
    ]
  },
}
