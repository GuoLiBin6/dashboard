import { CHARGE_TYPE, LB_SPEC } from '@Network/views/lb/constants'
import LbListCell from '@Network/views/lb/components/LbListCell'
import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTimeTableColumn,
  getProjectTableColumn,
  getBrandTableColumn,
  getTagTableColumn,
  getRegionTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  components: {
    LbListCell,
  },
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        addLock: true,
        title: i18n.t('network.text_21'),
        slotCallback: row => {
          const h = this.$createElement
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.name')
        },
      }),
      getStatusTableColumn({
        statusModule: 'lb',
        title: i18n.t('network.text_27'),
        vm: this,
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.status')
        },
      }),
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'lb_loadbalancers',
        columns: () => this.columns,
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.metadata')
        },
      }),
      {
        field: 'address',
        title: i18n.t('network.text_248'),
        minWidth: 150,
        slots: {
          default: ({ row }) => {
            const h = this.$createElement
            let text = row.address || '-'
            let weakTip = ''
            if (row.eip) {
              text = row.eip
              if (row.eip_mode === 'elastic_ip') {
                weakTip = i18n.t('network.text_304')
              } else if (row.eip_mode === 'public_ip') {
                weakTip = i18n.t('network.text_305')
              } else {
                weakTip = ''
              }
            } else {
              weakTip = row.address_type === 'intranet' ? i18n.t('network.text_306') : i18n.t('network.text_307')
            }
            return [h('div', [
              h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: row.eip ? 'eip' : 'address',
                  row,
                },
              }, [h('span', { style: { color: 'var(--oc-color-text-secondary)' } }, text)]),
              h('span', { class: 'text-color-secondary' }, weakTip),
            ])]
          },
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.address')
        },
      },
      {
        field: 'loadbalancer_spec',
        title: i18n.t('network.text_268'),
        minWidth: 100,
        formatter: ({ row }) => {
          let { provider } = row
          if (provider) {
            provider = provider.toLowerCase()
            const platformList = LB_SPEC[provider]
            if (platformList) {
              const specItem = platformList.find(val => val.key === row.loadbalancer_spec)
              if (specItem) return specItem.label
            }
          }
          return row.loadbalancer_spec || '-'
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.loadbalancer_spec')
        },
      },
      {
        field: 'vpc',
        title: 'VPC',
        minWidth: 100,
        formatter: ({ row }) => {
          return row.vpc || '-'
        },
        hidden: () => {
          if (this.$store.getters.isProjectMode) return true
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.loadbalancer_spec')
        },
      },
      {
        field: 'secgroups',
        title: i18n.t('res.secgroup'),
        minWidth: 80,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }) => {
            return row.secgroups?.map(item => item.name).join(',')
          },
        },
        formatter: ({ row }) => {
          return row.secgroups?.map(item => item.name).join(',')
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.secgroups')
        },
      },
      {
        field: 'charge_type',
        title: i18n.t('network.text_192'),
        minWidth: 100,
        formatter: ({ row }) => {
          if (row.charge_type) return CHARGE_TYPE[row.charge_type] || row.charge_type
          return '-'
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.loadbalancer_spec')
        },
      },
      getBrandTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.brand')
        },
      }),
      {
        field: 'cluster',
        title: i18n.t('network.text_19'),
        minWidth: 100,
        formatter: ({ row }) => {
          return row.cluster || '-'
        },
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.cluster')
        },
      },
      // {
      //   field: 'server_type',
      //   title: '端口/健康检查/后端服务器',
      //   minWidth: 300,
      //   slots: {
      //     default: ({ row }, h) => {
      //       const attrs = {
      //         props: {
      //           params: {
      //             loadbalancer: row.id,
      //             scope: this.$store.getters.scope,
      //           },
      //           type: 'lb',
      //           manager: new this.$Manager('loadbalancerlisteners', 'v2'),
      //           format: item => {
      //             const healthText = item.health_check === 'on' ? '启用' : '未启用'
      //             return `${item.listener_type}:${item.listener_port} ${healthText} ${item.backend_group || '-'}`
      //           },
      //           status: row.status,
      //         },
      //       }
      //       return [<LbListCell { ...attrs } />]
      //     },
      //   },
      // },
      getProjectTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.tenant')
        },
      }),
      getRegionTableColumn({
        showOverflow: false,
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.region')
        },
      }),
      {
        field: 'account',
        title: i18n.t('network.text_196'),
        minWidth: 120,
        slots: {
          default: ({ row }) => {
            const h = this.$createElement
            const ret = []
            ret.push(
              h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: 'account',
                  row,
                },
              }, [h('span', { style: { color: 'var(--oc-color-text-heading)' } }, row.account)]),
            )
            if (row.manager) {
              ret.push(
                h('list-body-cell-wrap', {
                  props: {
                    hideField: true,
                    copy: true,
                    field: 'manager',
                    row,
                  },
                }, [h('span', { style: { color: 'var(--oc-color-text-secondary)' } }, row.manager)]),
              )
            }
            return ret
          },
        },
        hidden: () => {
          if (this.$store.getters.isProjectMode) return true
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.cluster')
        },
      },
      getTimeTableColumn({
        hidden: () => {
          return this.$isScopedPolicyMenuHidden('slb_hidden_columns.created_at')
        },
      }),
    ]
  },
}
