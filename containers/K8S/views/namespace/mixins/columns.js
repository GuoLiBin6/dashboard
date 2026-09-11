import { k8sStatusColumn } from '@K8S/utils/tableColumns'
import { getTimeTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'
export default {
  created () {
    this.columns = [
      {
        field: 'name',
        title: i18n.t('k8s.text_41'),
        width: 300,
        slots: {
          default: ({ row }, h) => {
            const ret = [h('side-page-trigger', {
              on: {
                trigger: () => this.handleOpenSidepage(row),
              },
            }, row.name)]
            return ret
          },
        },
      },
      k8sStatusColumn(),
      getTimeTableColumn({ field: 'creationTimestamp', fromNow: true, sortable: true }),
    ]
  },
}
