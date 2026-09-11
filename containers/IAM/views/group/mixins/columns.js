import {
  getNameDescriptionTableColumn,
  getProjectDomainTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
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
        formRules: [{
          required: true,
          message: i18n.t('system.text_168'),
          whitespace: true,
        }],
      }),
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
