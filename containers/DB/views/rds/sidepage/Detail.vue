<template>
  <detail
    :on-manager="onManager"
    :base-info="baseInfo"
    status-module="rds"
    :data="data"
    resource="dbinstances"
    :extra-info="extraInfo"
    auto-hidden-columns-key="rds_hidden_columns" />
</template>

<script>
// import BrandIcon from '@/sections/BrandIcon'
import {
  getUserTagColumn,
  // getExtTagColumn,
} from '@/utils/common/detailColumn'
import {
  getBrandTableColumn,
  getSwitchTableColumn,
} from '@/utils/common/tableColumn'
import { sizestr } from '@/utils/utils'
import WindowsMixin from '@/mixins/windows'
import { hasPermission } from '@/utils/auth'
import { DBINSTANCE_CATEGORY, DBINSTANCE_STORAGE_TYPE } from '../constants'

export default {
  name: 'RDSDetail',
  mixins: [WindowsMixin],
  props: {
    onManager: {
      type: Function,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    columns: Array,
  },
  data () {
    const formatPostpaid = (row, h) => {
      const ret = []
      if (row.billing_type === 'postpaid') {
        ret.push(h('div', { style: { color: 'var(--oc-color-text-heading)' } }, this.$t('billingType.postpaid')))
      } else if (row.billing_type === 'prepaid') {
        ret.push(h('div', { style: { color: 'var(--oc-color-text-heading)' } }, this.$t('billingType.prepaid')))
      }
      if (row.expired_at) {
        const dateArr = this.$moment(row.expired_at).fromNow().split(' ')
        const date = dateArr.join(' ')
        const seconds = this.$moment(row.expired_at).diff(new Date()) / 1000
        const textColor = seconds / 24 / 60 / 60 < 7 ? '#DD2727' : 'var(--oc-color-text-secondary)'
        const text = seconds < 0 ? this.$t('db.text_162') : this.$t('db.text_163', [date])
        ret.push(h('div', { style: { color: textColor } }, text))
      }
      return ret
    }
    return {
      baseInfo: [
        getUserTagColumn({ onManager: this.onManager, resource: 'dbinstance', columns: () => this.columns, tipName: this.$t('dictionary.dbinstances') }),
        // getExtTagColumn({ onManager: this.onManager, resource: 'dbinstance', columns: () => this.columns, tipName: this.$t('dictionary.dbinstances') }),
        getBrandTableColumn(),
        {
          field: 'charge_type',
          title: this.$t('db.text_54'),
          slots: {
            default: ({ row }, h) => {
              return formatPostpaid(row, h)
            },
          },
        },
        {
          field: 'region',
          title: this.$t('db.text_40'),
          slots: {
            default: ({ row }, h) => {
              if (!row.region_id) return row.region || '-'
              const p = hasPermission({ key: 'cloudregions_get' })
              let node
              if (p) {
                node = h('list-body-cell-wrap', {
                  props: {
                    copy: true,
                    row: row,
                    onManager: this.onManager,
                    field: 'region',
                    title: row.region,
                    hideField: true,
                  },
                }, [
                  h('side-page-trigger', {
                    props: {
                      permission: 'areas_get',
                      name: 'CloudregionSidePage',
                      id: row.region_id,
                      vm: this,
                    },
                  }, row.region),
                ])
              } else {
                node = h('list-body-cell-wrap', {
                  props: {
                    copy: true,
                    row: row,
                    onManager: this.onManager,
                    field: 'region',
                    title: row.region,
                  },
                })
              }
              return [
                h('div', { class: 'text-truncate' }, [node]),
              ]
            },
          },
        },
        {
          field: 'zone',
          hiddenField: 'region',
          title: this.$t('db.text_133'),
          slots: {
            default: ({ row }, h) => {
              const ret = []
              let i = 0
              for (;;) {
                ++i
                const value = row[`zone${i}_name`]
                if (!value) break
                ret.push(
                  h('div', `${value}(${i > 1 ? this.$t('db.text_164') : this.$t('db.text_165')})`),
                )
              }
              return ret
            },
          },
        },
        {
          field: 'ip_addrs',
          title: this.$t('db.intranet_ip'),
          minWidth: 200,
          slots: {
            default: ({ row }, h) => {
              const ip_addrs = (row.ip_addrs || '').split(',')
              return [
                ...ip_addrs.map(ip => {
                  return h('list-body-cell-wrap', {
                    props: {
                      hideField: true,
                      copy: true,
                      message: ip,
                    },
                  }, [
                    h('span', ip),
                  ])
                }),
              ]
            },
          },
          hidden: (row) => {
            return !row.ip_addrs
          },
        },
      ],
      extraInfo: [
        {
          title: this.$t('db.text_166'),
          items: [
            {
              field: 'engine',
              title: this.$t('db.text_57'),
              slots: {
                default: ({ row }) => {
                  return `${row.engine} ${row.engine_version}`
                },
              },
            },
            {
              field: 'maintain_time',
              title: this.$t('db.text_167'),
            },
            {
              field: 'instance_type',
              title: this.$t('db.text_168'),
            },
            {
              field: 'category',
              title: this.$t('db.text_119'),
              slots: {
                default: ({ row }) => {
                  return DBINSTANCE_CATEGORY[row.category] || row.category || '-'
                },
              },
            },
            {
              field: 'storage_type',
              title: this.$t('db.text_120'),
              slots: {
                default: ({ row }) => {
                  return DBINSTANCE_STORAGE_TYPE[row.storage_type] || row.storage_type || '-'
                },
              },
            },
            {
              field: 'vcpu_count',
              title: 'CPU',
              slots: {
                default: ({ row }) => {
                  return this.$t('db.text_170', [row.vcpu_count])
                },
              },
            },
            {
              field: 'vmem_size_mb',
              title: this.$t('db.text_132'),
              slots: {
                default: ({ row }) => {
                  return sizestr(row.vmem_size_mb, 'M', 1024)
                },
              },
            },
            {
              field: 'iops',
              title: 'IOPS',
              slots: {
                default: ({ row }) => {
                  return row.iops || '-'
                },
              },
            },
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('rds_hidden_columns.db_info'),
        },
        {
          title: this.$t('db.text_171'),
          items: [
            {
              field: 'internal_connection_str',
              title: this.$t('db.text_172'),
              slots: {
                default: ({ row }) => {
                  if (row.internal_connection_str) {
                    return row.provider === 'Qcloud' ? row.internal_connection_str : `${row.internal_connection_str}:${row.port}`
                  }
                  return '-'
                },
              },
            },
            {
              field: 'connection_str',
              title: this.$t('db.text_173'),
              slots: {
                default: ({ row }, h) => {
                  const addr = row.connection_str
                  const btnTxt = addr ? this.$t('db.text_174') : this.$t('db.text_175')
                  const isRunning = row.status === 'running'
                  const notRunninTip = !isRunning ? this.$t('db.text_156') : null
                  let RenderSwitchBtn = null
                  // 华为云不支持开启外网地址和关闭外网地址
                  if (row.provider !== 'Huawei') {
                    if (isRunning) {
                      RenderSwitchBtn = h('a-button', {
                        props: { type: 'link' },
                        on: {
                          click: () => this.handleSwitchPublicAddress(!addr),
                        },
                      }, btnTxt)
                    } else {
                      RenderSwitchBtn = h('a-tooltip', {
                        props: {
                          placement: 'top',
                          title: notRunninTip,
                        },
                      }, [
                        h('a-button', {
                          props: { type: 'link', disabled: true },
                        }, btnTxt),
                      ])
                    }
                  }
                  return h('div', [
                    addr ? (row.provider === 'Qcloud' ? addr : `${addr}:${row.port}`) : '-',
                    RenderSwitchBtn,
                  ])
                },
              },
            },
            // {
            //   field: 'port',
            //   title: '数据库端口号',
            // },
            {
              field: 'vpc',
              title: 'VPC',
            },
            {
              field: 'network',
              title: this.$t('db.text_176'),
              slots: {
                default: ({ row }) => {
                  return row.network || '-'
                },
              },
            },
            // {
            //   field: 'secgroup',
            //   title: this.$t('db.text_144'),
            //   slots: {
            //     default: ({ row }) => {
            //       return row.secgroup || '-'
            //     },
            //   },
            // },
            {
              field: 'secgroups',
              title: this.$t('compute.text_105'),
              slots: {
                default: ({ row }) => {
                  if (!row.secgroups) return '-'
                  return row.secgroups.map((item) => {
                    return h('list-body-cell-wrap', {
                      props: {
                        copy: true,
                        hideField: true,
                        field: 'name',
                        row: item,
                        message: item.name,
                      },
                    }, [
                      h('side-page-trigger', {
                        props: {
                          permission: 'secgroups_get',
                          name: 'SecGroupSidePage',
                          id: item.id,
                          vm: this,
                        },
                      }, item.name),
                    ])
                  })
                },
              },
            },
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('rds_hidden_columns.connection_info'),
        },
        {
          title: this.$t('db.text_177'),
          items: [
            {
              field: 'disk_size_gb',
              title: this.$t('db.text_116'),
              slots: {
                default: ({ row }) => {
                  const { disk_size_gb = 0, disk_size_used_mb = 0 } = row
                  const used = sizestr(disk_size_used_mb, 'M', 1024)
                  return `${this.$t('db.text_178', [disk_size_gb])} (${this.$t('db.used', [used])})`
                },
              },
            },
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('rds_hidden_columns.db_size_gb'),
        },
        {
          title: this.$t('db.text_179'),
          items: [
            getSwitchTableColumn({
              field: 'disable_delete',
              title: this.$t('common.text00076'),
              change: val => {
                this.onManager('update', {
                  id: this.data.id,
                  managerArgs: {
                    data: { disable_delete: val },
                  },
                })
              },
            }),
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('rds_hidden_columns.perform_action'),
        },
      ],
    }
  },
  methods: {
    handleSwitchPublicAddress (bool) {
      const txts = {
        true: {
          title: this.$t('db.text_180'),
        },
        false: {
          title: this.$t('db.text_181'),
          content: this.$t('db.text_182'),
        },
      }
      this.createDialog('ConfirmDialog', {
        ...txts[`${bool}`],
        onOk: () => {
          return this.onManager('performAction', {
            id: this.data.id,
            steadyStatus: ['runing'],
            managerArgs: {
              action: 'public-connection',
              data: {
                open: bool,
              },
            },
          })
        },
      })
    },
  },
}
</script>
