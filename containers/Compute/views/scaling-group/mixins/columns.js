import { getCopyWithContentTableColumn, getStatusTableColumn, getBrandTableColumn, getNameDescriptionTableColumn, getProjectTableColumn, getTimeTableColumn, getEnabledTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            props: {
              name: 'ScalingGroupSidePage',
              id: row.id,
              list: this.list,
              vm: this,
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'scalinggroup', minWidth: 130, vm: this }),
      getEnabledTableColumn(),
      getCopyWithContentTableColumn({
        field: 'guest_template',
        title: i18n.t('res.servertemplate'),
        hideField: true,
        showOverflow: 'ellipsis',
        width: 120,
        slotCallback: (row, h) => {
          if (!row.guest_template) return [h('data-loading')]
          return row.guest_template
        },
      }),
      {
        field: 'instance_number',
        title: i18n.t('compute.text_874'),
        minWidth: 100,
        sortable: true,
        slots: {
          default: ({ row }, h) => {
            if (row.instance_number === undefined) return [h('data-loading')]
            return row.instance_number
          },
        },
      },
      {
        field: 'desire_instance_number',
        title: i18n.t('compute.text_875'),
        minWidth: 100,
        sortable: true,
      },
      {
        field: 'min_instance_number',
        title: i18n.t('compute.text_876'),
        minWidth: 100,
        sortable: true,
      },
      {
        field: 'max_instance_number',
        title: i18n.t('compute.text_877'),
        minWidth: 100,
        sortable: true,
      },
      getBrandTableColumn(),
      getTimeTableColumn(),
      getProjectTableColumn(),
    ]
  },
}
