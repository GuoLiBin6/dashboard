import * as R from 'ramda'
import _ from 'lodash'
import classNames from 'classnames'
import i18n from '@/locales'
import WindowsMixin from '@/mixins/windows'
import { hasPermission } from '@/utils/auth'
import { changeToArr } from '@/utils/utils'
import store from '@/store'
import expectStatus from '@/constants/expectStatus'
import { getTimeTableColumn } from '@/utils/common/tableColumn'
import './style.scss'
import h from '@/utils/legacyCreateElement'

// 需要添加区域（cloudregion/cloudregion_id), 可用区（zone/zone_id)，云账号(account/account_id)，云订阅（manager/manager_id)的资源
const appendOutherResources = ['servers', 'hosts', 'disks', 'storages', 'vpcs', 'wires', 'networks', 'natgateways', 'snapshots', 'eips', 'dbinstances', 'elasticcaches', 'servertemplates', 'buckets', 'networkinterfaces', 'lbs', 'nats', 'nas', 'kafkas', 'elasticsearchs', 'webapps', 'cdn_domains', 'inter_vpc_networks', 'route_tables', 'vpc_peering_connections', 'ipv6_gateways', 'tablestores', 'modelarts_pools', 'meter_instance_caches']

const getDefaultLastBaseInfo = (vm, h, { data, onManager, resource }) => {
  const outher = []
  if (data.region) {
    outher.push(
      {
        field: 'region',
        title: i18n.t('res.region'),
        slots: {
          default: ({ row }, h) => {
            if (!row.region_id) return row.region || '-'
            const p = hasPermission({ key: 'cloudregions_get' })
            let node
            if (p) {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
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
                    vm,
                  },
                }, [row.region]),
              ])
            } else {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
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
    )
  }
  if (data.zone) {
    outher.push(
      {
        field: 'zone',
        hiddenField: 'region',
        title: i18n.t('res.zone'),
        slots: {
          default: ({ row }, h) => {
            if (!row.zone_id) return row.zone || '-'
            const p = hasPermission({ key: 'zones_get' })
            let node
            if (p) {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'zone',
                  title: row.zone,
                  hideField: true,
                },
              }, [
                h('side-page-trigger', {
                  props: {
                    permission: 'zones_get',
                    name: 'ZoneSidePage',
                    id: row.zone_id,
                    vm,
                  },
                }, [row.zone]),
              ])
            } else {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'zone',
                  title: row.zone,
                },
              })
            }
            return [
              h('div', { class: 'text-truncate' }, [node]),
            ]
          },
        },
      },
    )
  }
  if (data.account && !store.getters.isProjectMode) {
    outher.push(
      {
        field: 'account',
        title: i18n.t('res.cloudaccount'),
        slots: {
          default: ({ row }, h) => {
            if (!row.account_id) return row.account || '-'
            const p = hasPermission({ key: 'cloudaccounts_get' })
            let node
            if (p) {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'account',
                  title: row.account,
                  hideField: true,
                },
              }, [
                h('side-page-trigger', {
                  props: {
                    permission: 'cloudaccounts_get',
                    name: 'CloudaccountSidePage',
                    id: row.account_id,
                    vm,
                  },
                }, [row.account]),
              ])
            } else {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'account',
                  title: row.account,
                },
              })
            }
            return [
              h('div', { class: 'text-truncate' }, [node]),
            ]
          },
        },
        hidden: () => store.getters.isProjectMode,
      },
    )
  }
  if (data.manager && !store.getters.isProjectMode) {
    outher.push(
      {
        field: 'manager',
        hiddenField: 'account',
        title: i18n.t('res.cloudprovider'),
        slots: {
          default: ({ row }, h) => {
            if (!row.manager_id) return row.manager || '-'
            const p = hasPermission({ key: 'cloudproviders_get' })
            let node
            if (p) {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'manager',
                  title: row.manager,
                  hideField: true,
                },
              }, [
                h('side-page-trigger', {
                  props: {
                    permission: 'cloudproviders_get',
                    name: 'CloudproviderSidePage',
                    id: row.manager_id,
                    vm,
                  },
                }, [row.manager]),
              ])
            } else {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'manager',
                  title: row.manager,
                },
              })
            }
            return [
              h('div', { class: 'text-truncate' }, [node]),
            ]
          },
        },
        hidden: () => store.getters.isProjectMode,
      },
    )
  }
  let ret = [
    getTimeTableColumn({
      field: 'created_at',
      title: i18n.t('table.title.create_time'),
    }),
    getTimeTableColumn({
      field: 'updated_at',
      hiddenField: 'created_at',
      title: i18n.t('table.title.update_time'),
    }),
  ]
  if (resource && appendOutherResources.includes(resource)) {
    ret = R.insertAll(0, outher, ret)
  }
  return ret
}

const getDefaultTopBaseInfo = (vm, h, { idKey, statusKey, statusModule, data, onManager, resource, columns }) => {
  const ret = []
  if (data.external_id) {
    ret.push(
      {
        field: 'external_id',
        title: i18n.t('table.title.external_id'),
        slots: {
          default: ({ row }, h) => {
            const cell = h('list-body-cell-wrap', {
              props: {
                copy: true,
                row: data,
                field: 'external_id',
                title: row.external_id,
              },
            })
            return [
              h('div', { class: 'text-truncate' }, [cell]),
            ]
          },
        },
      },
    )
  }
  if (data.id) {
    ret.push(
      {
        field: idKey,
        title: 'ID',
        slots: {
          default: ({ row }, h) => {
            const cell = h('list-body-cell-wrap', {
              props: {
                copy: true,
                row: data,
                onManager,
                field: idKey,
                title: row[idKey],
              },
            })
            return [
              h('div', { class: 'text-truncate' }, [cell]),
            ]
          },
        },
      },
    )
  }
  ret.push(
    {
      field: statusKey,
      title: i18n.t('common.status'),
      slots: {
        default: ({ row }, h) => {
          if (vm.specifyStatus) {
            return [h('status', { props: { specifyStatus: vm.specifyStatus } })]
          }
          const cancel = h('a', {
            class: 'ml-1',
            on: {
              click: () => vm.createDialog('VmLiveMigrateCancelDialog', {
                data: [row],
                columns,
                onManager: vm.onManager,
              }),
            },
          }, [vm.$t('common.cancel')])
          const rescue_mode = h('span', { class: 'text-color-help' }, [i18n.t('compute.rescue')])
          if (statusModule && row[statusKey]) {
            const statusNode = h('status', {
              props: {
                status: row[statusKey],
                statusModule,
                process: row.progress,
                showStatusProgress: vm.showStatusProgress,
              },
            })
            const children = [statusNode]
            if (row.status === 'live_migrating') children.push(cancel)
            if (row.rescue_mode === true) children.push(rescue_mode)
            return [h('div', { class: 'd-flex align-items-center text-truncate' }, children)]
          }
          return '-'
        },
      },
    },
  )
  if (data.project_domain && !store.getters.isProjectMode) {
    ret.push(
      {
        field: 'project_domain',
        hiddenField: 'tenant',
        title: i18n.t('res.domain'),
        slots: {
          default: ({ row }, h) => {
            const domain = row.project_domain || row.domain
            if (!row.domain_id) return domain || '-'
            if (!domain) return '-'
            const p = hasPermission({ key: 'domains_get' })
            let node
            if (p) {
              const trigger = h('side-page-trigger', {
                props: {
                  permission: 'domains_get',
                  name: 'DomainSidePage',
                  id: row.project_domain,
                  options: { getParams: { pending_delete: 'any' } },
                  vm,
                },
              }, [domain])
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'project_domain',
                  title: row.project_domain,
                  message: domain,
                  hideField: true,
                },
              }, [trigger])
            } else {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'project_domain',
                  title: row.project_domain,
                  message: domain,
                },
              })
            }
            return [h('div', { class: 'text-truncate' }, [node])]
          },
        },
        hidden: () => store.getters.isProjectMode,
      },
    )
  }
  if (data.tenant) {
    ret.push(
      {
        field: 'tenant',
        title: i18n.t('res.project'),
        slots: {
          default: ({ row }, h) => {
            if (!row.tenant_id) return row.tenant || '-'
            if (!row.tenant) return '-'
            const p = hasPermission({ key: 'projects_get' })
            const customEditCallback = () => {
              vm.createDialog('ChangeOwenrDialog', {
                data: [row],
                onManager,
                name: i18n.t(`dictionary.${resource.substring(0, resource.length - 1)}`),
                resource,
              })
            }
            let node
            if (p) {
              const trigger = h('side-page-trigger', {
                props: {
                  permission: 'projects_get',
                  name: 'ProjectSidePage',
                  id: row.tenant_id,
                  vm,
                  options: { getParams: { pending_delete: 'any' } },
                },
              }, [row.tenant])
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'tenant',
                  title: row.tenant,
                  hideField: true,
                  edit: true,
                  customEdit: true,
                  customEditCallback,
                },
              }, [trigger])
            } else {
              node = h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: data,
                  onManager,
                  field: 'tenant',
                  title: row.tenant,
                },
              })
            }
            return [h('div', { class: 'text-truncate' }, [node])]
          },
        },
      },
    )
  }
  return ret
}

export default {
  name: 'Detail',
  mixins: [WindowsMixin],
  props: {
    data: {
      type: Object,
      required: true,
    },
    baseInfo: {
      type: Array,
      default: () => ([]),
    },
    extraInfo: {
      type: Array,
    },
    onManager: {
      type: Function,
    },
    nameRules: {
      type: Array,
    },
    statusModule: {
      type: String,
    },
    idKey: {
      type: String,
      default: 'id',
    },
    statusKey: {
      type: String,
      default: 'status',
    },
    nameProps: {
      type: Object,
    },
    descProps: {
      type: Object,
    },
    showDesc: {
      type: Boolean,
      default: true,
    },
    showName: {
      type: Boolean,
      default: true,
    },
    hiddenKeys: {
      type: Array,
    },
    autoHiddenColumnsKey: String,
    resource: String,
    isEditDesc: {
      type: Boolean,
      default: true,
    },
    isEditName: {
      type: Boolean,
      default: true,
    },
    hiddenBaseInfo: {
      type: Boolean,
      default: false,
    },
    fullWidth: {
      type: Boolean,
      default: false,
    },
    specifyStatus: {
      type: Object,
    },
    columns: {
      type: Array,
    },
    showStatusProgress: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    commonBaseInfo () {
      const defaultTopBaseInfo = getDefaultTopBaseInfo(this, this.$createElement, {
        idKey: this.idKey,
        statusKey: this.statusKey,
        statusModule: this.statusModule,
        data: this.data,
        onManager: this.onManager,
        resource: this.resource,
        columns: this.columns,
      })
      const defaultLastBaseInfo = getDefaultLastBaseInfo(this, this.$createElement, {
        onManager: this.onManager,
        data: this.data,
        resource: this.resource,
      })
      // 与传递进来的baseInfo比较，去除在baseInfo中已有字段
      /*
      for (let i = 0; i < this.baseInfo.length; i++) {
        for (let j = 0; j < defaultTopBaseInfo.length; j++) {
          if (this.baseInfo[i].field === defaultTopBaseInfo[j].field || this.baseInfo[i].title === defaultTopBaseInfo[j].title) {
            defaultTopBaseInfo.splice(j, 1)
          }
        }
        for (let l = 0; l < defaultLastBaseInfo.length; l++) {
          if (this.baseInfo[i].field === defaultLastBaseInfo[l].field || this.baseInfo[i].title === defaultLastBaseInfo[l].title) {
            defaultLastBaseInfo.splice(l, 1)
          }
        }
      }
      */
      const exists = {}
      let baseInfo = []
      const infoSets = [defaultTopBaseInfo, this.baseInfo, defaultLastBaseInfo]
      for (let k = 0; k < infoSets.length; k++) {
        const infos = infoSets[k]
        for (let i = 0; i < infos.length; i++) {
          if (!(infos[i].field in exists)) {
            baseInfo.push(infos[i])
            exists[infos[i].field] = 1
          }
        }
      }
      // defaultTopBaseInfo.concat(this.baseInfo).concat(defaultLastBaseInfo)
      baseInfo = R.uniqBy(item => item.field && item.title, baseInfo)
        .filter(child => {
          if (this.hiddenKeys && this.hiddenKeys.length && this.hiddenKeys.includes(child.field)) {
            return false
          }
          if (this.autoHiddenColumnsKey && this.$isScopedPolicyMenuHidden(`${this.autoHiddenColumnsKey}.${child.hiddenField || child.field}`)) {
            return false
          }
          if (!R.isNil(child.hidden)) {
            if (R.is(Function, child.hidden)) {
              return !child.hidden(this.data)
            }
          }
          return !child.hidden
        })
      return baseInfo
    },
  },
  methods: {
    renderItem (h, item, renderTitle = true) {
      let val
      // try catch 主要针对后端字段异常且前端没有特别严谨断言的情况下，避免详情白屏
      try {
        if (item.slots && item.slots.default) {
          val = item.slots.default({ row: this.data }, h)
          // 内容为空则直接渲染-
          // Vue3 无 elm；组件型 VNode（如 PasswordFetcher 仅图标）也不应按 innerText 判空
          const first = Array.isArray(val) ? val[0] : null
          if (first && first.elm && typeof first.type !== 'object') {
            if (!R.trim(first.elm.innerText || '')) {
              val = '-'
            }
          }
        } else if (item.formatter) {
          // 与列表列 formatter 一致：第二参数为 h（Detail.vue 中多处 formatter: ({ row }, h) => ...）
          const _val = item.formatter({ row: this.data, cellValue: this.data[item.field] }, h)
          val = _val || (R.type(_val) === 'Number' ? _val : '-')
        } else {
          const _val = _.get(this.data, item.field)
          val = _val || (R.type(_val) === 'Number' ? _val : '-')
        }
      } catch (error) {
        val = '-'
        console.warn(`Get field ${item.field} faied`)
        throw error
      }
      const children = []
      if (renderTitle && item.title) {
        children.push(h('div', { class: 'detail-item-title', attrs: { title: R.is(String, item.title) ? item.title : '' } }, R.is(String, item.title) ? item.title : changeToArr(item.title(h))))
      }
      children.push(h('div', { class: classNames('detail-item-value', { 'ml-0': !renderTitle || !item.title }) }, [val]))
      return h('div', {
        class: 'detail-item mt-2',
      }, children)
    },
    renderItems (h, items, type) {
      let children = items.map(item => {
        return this.renderItem(h, item)
      })
      if (type === 'base-info' && this.showName) {
        children = R.insert(2, this.renderName(h), children)
        if (this.showDesc) {
          children.push(this.renderDesc(h))
        }
      }
      return h('div', {
        class: 'detail-items',
      }, children)
    },
    renderTitle (h, icon, title, items) {
      if (R.type(title) === 'Function') {
        return title({ row: this.data }, h)
      }
      return h('div', {
        class: 'detail-title',
      }, [
        h('icon', {
          props: {
            type: icon,
          },
        }),
        h('span', { class: 'ml-2' }, title),
      ])
    },
    renderContent (h, icon, title, items = [], item, type) {
      let wrapHidden
      if (R.is(Function, item && item.hidden)) {
        wrapHidden = item.hidden(this.data)
      } else {
        wrapHidden = item && item.hidden
      }
      if (wrapHidden) return
      const options = items.filter(item => {
        if (R.is(Function, item.hidden)) {
          return !item.hidden(this.data)
        }
        return !item.hidden
      })
      return h('div', {
        class: 'detail-content',
      }, [
        this.renderTitle(h, icon, title),
        !R.isEmpty(options) ? this.renderItems(h, options, type) : this.renderItem(h, item, false),
      ])
    },
    renderBase (h) {
      if (this.hiddenBaseInfo) {
        return
      }
      return h('div', {
        class: this.fullWidth ? 'detail-full' : 'detail-left',
      }, [
        this.renderContent(h, 'info', i18n.t('common.info'), this.commonBaseInfo, null, 'base-info'),
      ])
    },
    renderExtra (h) {
      return h('div', {
        class: this.fullWidth ? 'detail-full' : (this.hiddenBaseInfo ? 'detail-all' : 'detail-right'),
      }, this.extraInfo.map(item => {
        return this.renderContent(h, 'info2', item.title, item.items, item)
      }))
    },
    renderDesc (h) {
      const children = [
        h('div', { class: 'detail-item-title' }, i18n.t('table.title.desc')),
        h('div', { class: 'detail-item-value' }, [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              edit: this.isEditDesc,
              row: this.data,
              onManager: this.onManager,
              field: 'description',
              ...this.descProps,
            },
            style: { color: 'var(--oc-color-text-secondary)' },
          }),
        ]),
      ]
      return h('div', {
        class: 'detail-item mt-2',
      }, children)
    },
    renderName (h) {
      const children = [
        h('div', { class: 'detail-item-title' }, i18n.t('table.title.name')),
        h('div', { class: 'detail-item-value' }, [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              edit: this.isEditName,
              row: this.data,
              onManager: this.onManager,
              steadyStatus: expectStatus[this.statusModule] && Object.values(expectStatus[this.statusModule]).flat(),
              formRules: this.nameRules,
              ...this.nameProps,
            },
          }),
        ]),
      ]
      return h('div', {
        class: 'detail-item mt-2',
      }, children)
    },
  },
  render () {
    const children = [this.renderBase(h)]
    if (this.extraInfo) children.push(this.renderExtra(h))
    return h('div', {
      class: this.fullWidth ? 'detail-wrap detail-wrap-full' : 'detail-wrap',
    }, children)
  },
}
