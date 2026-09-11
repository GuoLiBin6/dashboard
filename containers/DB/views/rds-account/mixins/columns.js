import PasswordFetcher from '@Compute/sections/PasswordFetcher'
import { RDS_ACCOUNT_PRIVILEGES } from '@DB/constants'
import { getStatusTableColumn, getNameDescriptionTableColumn } from '@/utils/common/tableColumn'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        vm: this,
        onManager: this.onManager,
        hideField: true,
        edit: false,
        slotCallback: row => {
          return this.$createElement('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'rdsAccount' }),
      {
        field: 'host',
        title: this.$t('db.text_344'),
        minWidth: 100,
      },
      {
        field: 'password',
        title: this.$t('db.text_195'),
        minWidth: 100,
        slots: {
          default: ({ row }, h) => {
            return [h(PasswordFetcher, {
              props: {
                serverId: row.id,
                resourceType: 'dbinstanceaccounts',
              },
            })]
          },
        },
      },
      {
        field: 'dbinstanceprivileges',
        minWidth: 200,
        title: this.$t('db.text_196'),
        slots: {
          default: ({ row }, h) => {
            if (row.dbinstanceprivileges && row.dbinstanceprivileges.length > 0) {
              return row.dbinstanceprivileges.map(({ database, privileges }) => {
                return h('div', [
                  database,
                  ' ',
                  h('span', { style: 'color:#666;margin:0 0 0 3px' }, `(${RDS_ACCOUNT_PRIVILEGES[privileges] ? RDS_ACCOUNT_PRIVILEGES[privileges] : privileges})`),
                ])
              })
            }
            return '-'
          },
        },
      },
    ]
  },
}
