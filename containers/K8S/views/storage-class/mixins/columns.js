import { k8sStatusColumn } from '@K8S/utils/tableColumns'
import { getTimeTableColumn, getNameDescriptionTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'
export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        edit: false,
        showDesc: false,
        slotCallback: row => {
          return this.$createElement('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      k8sStatusColumn(),
      {
        field: 'isDefault',
        title: i18n.t('k8s.text_359'),
        minWidth: 100,
        formatter: ({ row }) => {
          return row.isDefault ? i18n.t('k8s.text_360') : i18n.t('k8s.text_361')
        },
      },
      {
        field: 'provisioner',
        title: i18n.t('k8s.text_362'),
        minWidth: 100,
      },
      getTimeTableColumn({ field: 'creationTimestamp', fromNow: true, sortable: true }),
    ]
  },
}
