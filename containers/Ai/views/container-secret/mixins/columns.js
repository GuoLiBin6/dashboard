import {
  getNameDescriptionTableColumn,
  getTagTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'

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
          }, row.name || '-')
        },
      }),
      {
        field: 'type',
        title: this.$t('table.title.type'),
        width: 140,
        formatter: ({ row }) => {
          if (row.type === 'container_image') {
            return this.$t('common.container_image_secret')
          } else if (row.type === 'container_secret') {
            return this.$t('common.container_secret')
          } else {
            return row.type || '-'
          }
        },
      },
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'credentials',
        columns: () => this.columns,
        tipName: this.$t('aice.container_secret'),
      }),
      getTimeTableColumn({
        field: 'created_at',
        title: this.$t('table.title.create_time'),
      }),
    ]
  },
}
