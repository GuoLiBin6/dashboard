import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getProjectDomainTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'
import {
  getK8sClusterProviderColumn,
  getK8sClusterDistribution,
  getK8sClusterModeColumn,
  getK8sClusterResourceType,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
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
      getK8sClusterProviderColumn(),
      getK8sClusterDistribution(),
      getK8sClusterModeColumn(),
      getK8sClusterResourceType(),
      /*
       * {
       *   field: 'version',
       *   title: i18n.t('k8s.text_153'),
       *   minWidth: 100,
       *   slots: {
       *     default: ({ row }, h) => {
       *       return [
       *         <a-tag color="blue">{ row.version }</a-tag>,
       *       ]
       *     },
       *   },
       * },
       */
      {
        field: 'machines',
        title: i18n.t('k8s.text_191'),
        sortable: true,
      },
      getStatusTableColumn({ vm: this, statusModule: 'kubecluster', minWidth: 40 }),
      {
        field: 'sync_status',
        title: i18n.t('common.text00043'),
        minWidth: 40,
        slots: {
          default: ({ row }, h) => {
            let warnTooltip = row.sync_message
            if (warnTooltip) {
              warnTooltip = h('a-tooltip', {
                props: {
                  placement: 'top',
                  title: warnTooltip,
                },
              }, [
                h('div', { class: 'text-truncate' }, [
                  h('icon', {
                    props: {
                      type: 'bulb',
                      theme: 'twoTone',
                      twoToneColor: '#f5222d',
                    },
                    class: 'mr-2',
                  }),
                  h('span', i18n.t('k8s.text_402')),
                ]),
              ])
            }
            return [
              h('div', { class: 'text-truncate' }, [
                h('status', {
                  props: {
                    status: row.sync_status,
                    statusModule: 'kubecluster_sync_status',
                  },
                }, warnTooltip ? [warnTooltip] : []),
              ]),
            ]
          },
        },
      },
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
