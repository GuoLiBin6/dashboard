import {
  getNameDescriptionTableColumn,
  getEnabledTableColumn,
  getProjectDomainTableColumn,
  getTimeTableColumn,
  getTagTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        formRules: [
          { required: true, message: i18n.t('system.text_168') },
        ],
        edit: row => row.idp_driver !== 'ldap',
        slotCallback: row => {
          return this.$createElement('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      {
        field: 'displayname',
        title: i18n.t('scope.text_245'),
        slots: {
          default: ({ row }) => {
            return [this.$createElement('list-body-cell-wrap', {
              props: {
                copy: true,
                row,
                field: 'displayname',
                title: row.displayname || '-',
              },
            })]
          },
        },
      },
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'users',
        needExt: true,
        columns: () => this.columns,
      }),
      getEnabledTableColumn(),
      getEnabledTableColumn({
        field: 'allow_web_console',
        title: i18n.t('system.text_512'),
      }),
      getEnabledTableColumn({
        field: 'enable_mfa',
        title: 'MFA',
      }),
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
