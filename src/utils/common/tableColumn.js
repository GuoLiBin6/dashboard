import * as R from 'ramda'
import _ from 'lodash'
import { h as vueH, resolveDynamicComponent, getCurrentInstance } from 'vue'
import { Tooltip as ATooltip } from 'ant-design-vue'
import moment from '@/utils/moment'
import BrandIcon from '@/sections/BrandIcon'
import TagTableColumn from '@/sections/TagTableColumn'
import IpSupplement from '@/sections/IpSupplement'
import store from '@/store'
import i18n from '@/locales'
import { hasPermission } from '@/utils/auth'
import { typeClouds } from '@/utils/common/hypervisor'
import { HOST_CPU_ARCHS } from '@/constants/compute'
import expectStatus from '@/constants/expectStatus'
import { status as statusMap } from '@/locales/zh-CN'
import setting from '@/config/setting'
import SystemIcon from '@/sections/SystemIcon'
import RegionalAvailabilityPopover from '@/sections/RegionalAvailabilityPopover'

// 延迟取 brandMap，避免循环依赖下模块初始化阶段访问 typeClouds 触发 TDZ
let brandMap
function getBrandMap () {
  if (!brandMap) brandMap = typeClouds.getBrand()
  return brandMap
}

// Vue2 render data 兼容层：
// 旧代码大量使用 h(tag, { props, attrs, on, scopedSlots }, children) 形态。
// 在 Vue3 中应使用 h(tag, props, slots/children)，这里统一转换，避免重写整份文件。
function camelize (str) {
  return String(str || '').replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

function toHandlerKey (event) {
  const e = String(event || '')
  return e ? 'on' + e.charAt(0).toUpperCase() + e.slice(1) : ''
}

function normalizeLegacyData (data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const out = {}

  // class/style 等直接透传
  if (data.class != null) out.class = data.class
  if (data.style != null) out.style = data.style
  if (data.key != null) out.key = data.key
  if (data.ref != null) out.ref = data.ref

  // Vue2: attrs/props 合并到 Vue3 props
  // 注意：render 函数里传给组件的 props 需要 camelCase，否则会落到 attrs，组件收不到（例如 hide-field -> hideField）
  const assignCamelized = (src) => {
    if (!src || typeof src !== 'object') return
    Object.keys(src).forEach((k) => {
      out[camelize(k)] = src[k]
    })
  }
  assignCamelized(data.attrs)
  assignCamelized(data.props)

  // Vue2: on -> onXxx
  if (data.on && typeof data.on === 'object') {
    Object.keys(data.on).forEach((k) => {
      const handlerKey = toHandlerKey(camelize(k))
      if (handlerKey) out[handlerKey] = data.on[k]
    })
  }

  // 允许直接传 Vue3 onXxx（不覆盖上面映射）
  Object.keys(data).forEach((k) => {
    if (k.startsWith('on') && out[k] == null) out[k] = data[k]
  })

  return out
}

function normalizeLegacySlots (data) {
  if (!data || typeof data !== 'object') return null
  const s = data.scopedSlots
  if (!s || typeof s !== 'object') return null
  const out = {}
  Object.keys(s).forEach((k) => {
    const fn = s[k]
    if (typeof fn === 'function') out[k] = fn
  })
  return out
}

/**
 * vxe-table 在表格内部调用 column slots 时，往往不在当前组件 setup/render 上下文，
 * resolveDynamicComponent('status') 会退回字符串，导致列空白。
 * PageList 在渲染前通过 runWithCreateElement 注入带 app 上下文的 $createElement。
 */
let activeCreateElement = null

export function runWithCreateElement (createElement, fn) {
  const prev = activeCreateElement
  activeCreateElement = typeof createElement === 'function' ? createElement : null
  try {
    return fn()
  } finally {
    activeCreateElement = prev
  }
}

/**
 * vxe-table@4 调用 column slots 时不再注入第二参 h。
 * 包装后统一传入 legacyH（Vue2 props/on 归一化），供 DialogTable / TableLiteGrid / SimpleTable 等场景使用。
 */
export function wrapVxeColumnSlots (columns, createElement) {
  if (!Array.isArray(columns)) return []
  const create = typeof createElement === 'function' ? createElement : null
  const renderSlot = (fn, params) => {
    if (!create) return fn(params)
    return runWithCreateElement(create, () => fn(params, create))
  }
  return columns.map((col) => {
    if (!col || !col.slots) return col
    const next = { ...col }
    const origin = { ...col.slots }
    next.slots = { ...origin }
    if (typeof origin.default === 'function') {
      next.slots.default = (params) => renderSlot(origin.default, params)
    }
    if (typeof origin.header === 'function') {
      next.slots.header = (params) => renderSlot(origin.header, params)
    }
    return next
  })
}

function kebabToPascal (name) {
  return String(name || '').replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
}

function resolveAppComponent (type) {
  if (typeof type !== 'string') return type
  // 列表里 a-tooltip 必须打到 antdv 组件对象；字符串解析在 vxe slot 外不可靠且易触发 setup 异常
  if (type === 'a-tooltip' || type === 'ATooltip') return ATooltip
  const instance = getCurrentInstance()
  if (instance) {
    const resolved = resolveDynamicComponent(type)
    if (resolved && resolved !== type) return resolved
  }
  const comps = (typeof window !== 'undefined' && window.app && window.app._context && window.app._context.components) || {}
  if (comps[type]) return comps[type]
  const pascal = kebabToPascal(type)
  if (comps[pascal]) return comps[pascal]
  // ant-design-vue: a-tooltip -> ATooltip
  if (type.indexOf('-') > -1) {
    const antdName = pascal
    if (comps[antdName]) return comps[antdName]
  }
  return type
}

function wrapTooltipTrigger (children) {
  if (children == null) return () => null
  return () => {
    const raw = typeof children === 'function' ? children() : children
    const arr = (Array.isArray(raw) ? raw : [raw]).filter(v => v !== null && v !== undefined && v !== false)
    if (!arr.length) return null
    // antdv4：自定义组件（icon）作 trigger 时 hover 不稳定，统一包 span
    return vueH('span', {
      class: 'oc-tooltip-trigger',
      style: { display: 'inline-flex', alignItems: 'center', cursor: 'help' },
    }, arr)
  }
}

// 兼容 Vue2 createElement 签名
// 注意：即使注入了 activeCreateElement，也必须先做 Vue2→Vue3 归一化。
// 否则 a-tooltip 的 scopedSlots/attrs.title 会原样进 antdv4 setup 并直接崩（刷屏卡死）。
function h (type, data, children) {
  const resolvedType = resolveAppComponent(type)
  // h(type, children)
  if (arguments.length === 2 && (Array.isArray(data) || typeof data === 'string' || typeof data === 'number' || data == null)) {
    return vueH(resolvedType, null, data)
  }
  const slots = normalizeLegacySlots(data)
  const props = normalizeLegacyData(data)
  const isTooltip = resolvedType === ATooltip || type === 'a-tooltip' || type === 'ATooltip'
  if (isTooltip) {
    const slotObj = { ...(slots || {}) }
    if (slotObj.default == null) {
      slotObj.default = wrapTooltipTrigger(children)
    }
    return vueH(ATooltip, props || null, slotObj)
  }
  if (slots) {
    const slotObj = { ...slots }
    if (children != null && slotObj.default == null) {
      slotObj.default = () => children
    }
    return vueH(resolvedType, props || null, slotObj)
  }
  return vueH(resolvedType, props || null, children)
}

export const getProjectTableColumn = ({ vm = {}, field = 'tenant', title = i18n.t('res.project'), projectsItem = 'tenant', sortable = true, hidden = false, minWidth = 100, domainField } = {}) => {
  return {
    field,
    title,
    sortable,
    showOverflow: 'ellipsis',
    minWidth,
    slots: {
      default: ({ row }, _h) => {
        const ret = []
        const project = row[field]
        if (vm.isPreLoad && !project) {
          return [h('data-loading')]
        }
        if (R.is(Array, project)) {
          for (let i = 0, len = project.length; i < len; i++) {
            const pRow = project[i]
            ret.push(
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: pRow,
                  field: projectsItem,
                },
              }),
            )
          }
        } else {
          ret.push(
            h('list-body-cell-wrap', {
              props: {
                copy: true,
                field,
                row: { [field]: project },
              },
            }),
          )
        }
        const domain = (domainField && row[domainField]) || row.project_domain || row.domain
        if (domain) {
          ret.push(
            h(
              'list-body-cell-wrap',
              {
                props: {
                  'hide-field': true,
                  copy: true,
                  field: 'domain',
                  row: { domain },
                },
              },
              [
                h(
                  'span',
                  {
                    class: 'text-weak',
                  },
                  domain,
                ),
              ],
            ),
          )
        }
        return ret
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getRegionTableColumn = ({ field = 'region', title = i18n.t('res.region'), showOverflow = 'ellipsis', hidden, vm = {} } = {}) => {
  return {
    field,
    title,
    showOverflow,
    minWidth: 120,
    slots: {
      default: ({ row }, _h) => {
        const val = _.get(row, field)
        if (vm.isPreLoad && !val) {
          return [h('data-loading')]
        }
        const ret = []
        ret.push(
          h(
            'list-body-cell-wrap',
            {
              props: {
                'hide-field': true,
                copy: true,
                field,
                row,
              },
            },
            [
              h(
                'span',
                {
                  style: { color: 'var(--oc-color-text-heading)' },
                },
                val,
              ),
            ],
          ),
        )
        if (row.zone) {
          ret.push(
            h(
              'list-body-cell-wrap',
              {
                props: {
                  'hide-field': true,
                  copy: true,
                  field: 'zone',
                  row,
                },
              },
              [
                h(
                  'span',
                  {
                    style: { color: 'var(--oc-color-text-secondary)' },
                  },
                  row.zone,
                ),
              ],
            ),
          )
        }
        if (row.zone_1_name) {
          ret.push(
            h(
              'list-body-cell-wrap',
              {
                props: {
                  'hide-field': true,
                  copy: true,
                  field: 'zone_1_name',
                  row,
                },
              },
              [
                h(
                  'span',
                  {
                    style: { color: 'var(--oc-color-text-secondary)' },
                  },
                  i18n.t('scope.text_958', [row.zone_1_name]),
                ),
              ],
            ),
          )
        }
        return ret
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getMultipleRegionTableColumn = ({ field = 'regional_availability', title = i18n.t('res.region'), regionField = 'region', zoneField = 'zone', chargeTypes = [] } = {}) => {
  return {
    field: regionField,
    title,
    showOverflow: 'ellipsis',
    minWidth: 120,
    slots: {
      default: ({ row }, h) => {
        const region = _.get(row, regionField)
        const zone = _.get(row, zoneField)
        const regionalAvailability = _.get(row, field)
        if (Array.isArray(regionalAvailability) && regionalAvailability.length) {
          return [
            h(RegionalAvailabilityPopover, {
              props: { region, zone, regionalAvailability, chargeTypes, skuData: row },
            }),
          ]
        }
        const ret = []
        if (region) {
          ret.push(
            h('list-body-cell-wrap', {
              props: {
                hideField: true,
                copy: true,
                field: regionField,
                row,
              },
            }, [
              h('a', {
                on: {
                  click: e => e.preventDefault(),
                },
              }, region),
            ]),
          )
        }
        if (zone) {
          ret.push(
            h('list-body-cell-wrap', {
              props: {
                hideField: true,
                copy: true,
                field: zoneField,
                row,
              },
              class: 'link-color-light',
            }, [
              h('a', {
                class: 'link-color-light',
                on: {
                  click: e => e.preventDefault(),
                },
              }, zone),
            ]),
          )
        }
        return ret.length ? ret : ['-']
      },
    },
  }
}

export const getBrandTableColumn = ({ field = 'brand', title = i18n.t('table.title.brand'), hidden = false, minWidth = 70, sortable = true, hideLoading = false } = {}) => {
  return {
    field,
    title,
    minWidth,
    sortable,
    slots: {
      default: ({ row }, _h) => {
        const val = _.get(row, field)
        if (!val) {
          return hideLoading ? '-' : [h('data-loading')]
        }
        let customStyle = {}
        if (row.brand === getBrandMap().Baidu.key) {
          customStyle = { fontSize: '16px', marginLeft: '2px' }
        }
        return [
          h(BrandIcon, {
            props: {
              name: val,
              customStyle,
            },
          }),
        ]
      },
    },
    formatter: ({ row }) => {
      const name = _.get(row, field)
      const ret = getBrandMap()[name] || {}
      if (name === 'Cloudpods') {
        const { inner_copyright, inner_copyright_en } = store.state.app.companyInfo || {}
        if (setting.language === 'en' && inner_copyright_en) {
          ret.label = inner_copyright_en
        }
        if (setting.language === 'zh-CN' && inner_copyright) {
          ret.label = inner_copyright
        }
      }
      return ret.label
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getBillBrandTableColumn = ({ field = 'brand', title = i18n.t('table.title.brand'), hidden = false, minWidth = 70, sortable = true, hideLoading = false, emptyValue } = {}) => {
  return {
    field,
    title,
    slots: {
      default: ({ row }, _h) => {
        const val = _.get(row, field)
        if (!val) return emptyValue
        if (val === 'k8s' || val === 'Kubernetes') {
          return [
            h(
              'span',
              { attrs: { title: 'K8S' } },
              [
                h('icon', {
                  props: {
                    type: 'k8s',
                    preserveColor: true,
                  },
                  style: 'font-size:20px;',
                }),
              ],
            ),
          ]
        }
        if (val === 'openshift') {
          return [
            h(
              'span',
              { attrs: { title: 'OpenShift' } },
              [
                h('icon', {
                  attrs: {
                    type: 'openshift',
                    style: 'font-size:20px;',
                  },
                }),
              ],
            ),
          ]
        }
        return [
          h(BrandIcon, {
            props: {
              name: val,
            },
          }),
        ]
      },
    },
    formatter: ({ row }) => {
      const name = _.get(row, field)
      if (!name) return emptyValue
      if (name === 'k8s' || name === 'Kubernetes') return 'K8S'
      if (name === 'openshift') return 'OpenShift'
      const ret = getBrandMap()[name] || {}
      if (name === 'Cloudpods') {
        const { inner_copyright, inner_copyright_en } = store.state.app.companyInfo || {}
        if (setting.language === 'en' && inner_copyright_en) {
          ret.label = inner_copyright_en
        }
        if (setting.language === 'zh-CN' && inner_copyright) {
          ret.label = inner_copyright
        }
      }
      return ret.label
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getStatusTableColumn = ({ vm = {}, field = 'status', title = i18n.t('common.status'), statusModule, sortable = true, minWidth = 120, slotCallback, hiddenLogView = false, formatter, helpTool = {}, hidden, showStatusProgress = false } = {}) => {
  return {
    field,
    title,
    sortable,
    // showOverflow: 'ellipsis',
    minWidth,
    slots: {
      default: ({ row }, _h) => {
        if (slotCallback && R.type(slotCallback) === 'Function') {
          const slot = slotCallback.length >= 2 ? slotCallback(row, h) : slotCallback(row)
          if (slot || slot === 0) return slot
        }
        if (!statusModule) return 'status module undefined'
        const val = _.get(row, field) || false
        if (R.isNil(val) || _.get(row, field) === undefined) return '-'

        const logNode = h(
          'side-page-trigger',
          {
            class: 'ml-1',
            on: {
              trigger: () => vm.handleOpenSidepage(row, 'event-drawer'),
            },
          },
          [i18n.t('common.view_logs')],
        )
        const isError =
          field === 'status'
            ? !hiddenLogView &&
              vm.handleOpenSidepage &&
              (['invalid', 'unknown'].includes(val) || /failed|fail$/.test(val))
            : false

        const helpNode = h(
          'span',
          {
            class: 'ml-1',
            attrs: {
              title: helpTool.title,
            },
          },
          [
            h('icon', {
              props: { type: 'question' },
            }),
          ],
        )

        return [
          h(
            'div',
            {
              class: 'd-flex align-items-center text-truncate',
            },
            [
              h('status', {
                props: {
                  status: val,
                  statusModule,
                  showStatusProgress,
                },
              }),
              isError ? logNode : null,
              helpTool.isOpen && helpTool.status?.includes(row.status) ? helpNode : null,
            ],
          ),
        ]
      },
    },
    formatter: ({ row }) => {
      if (formatter) {
        return formatter({ row })
      }
      const val = _.get(row, field) || '-'
      const moduleStatusMap = statusMap[statusModule]
      if (moduleStatusMap) {
        if (moduleStatusMap[val]) {
          return i18n.t(`status.${statusModule}.${val}`)
        }
      }
      if (statusMap.common[val]) {
        return i18n.t(`status.common.${val}`)
      }
      return val
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getEnabledTableColumn = ({
  field = 'enabled',
  title = i18n.t('table.title.enable_status'),
  enableText = i18n.t('status.enabled.true'),
  disableText = i18n.t('status.enabled.false'),
  minWidth = 90,
  hidden,
} = {}) => {
  return getStatusTableColumn({
    field,
    title,
    statusModule: 'enabled',
    minWidth,
    hidden,
    formatter: ({ row }) => {
      return row[field] ? enableText : disableText
    },
  })
}

export const getPublicTableColumn = ({ field = 'share_mode', title = i18n.t('common_286'), hidden } = {}) => {
  const shareMode = {
    account_domain: i18n.t('common_287'),
    system: i18n.t('common_288'),
    provider_domain: i18n.t('common_289'),
  }
  return {
    field,
    title,
    width: 100,
    slots: {
      default: ({ row }, _h) => {
        return shareMode[row[field]]
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getNameDescriptionTableColumn = ({
  resource = '', // 资源名称
  title = i18n.t('table.title.name'),
  field = 'name',
  descField = 'description',
  addEncryption,
  slotCallback,
  onManager,
  steadyStatus,
  statusModule,
  addLock,
  hideField,
  showDesc = true,
  sortable = true,
  addBackup,
  formRules,
  descriptionRules = [],
  cellWrapSlots,
  edit = true,
  editDesc = true,
  copyDesc = false,
  minWidth = 100,
  message,
  addEncrypt,
  label,
  formatter,
  hidden,
} = {}) => {
  return {
    field,
    title,
    sortable,
    showOverflow: 'ellipsis',
    minWidth,
    formatter,
    // fixed: 'left',
    slots: {
      default: ({ row }, _h) => {
        const text = (message && R.type(message) === 'Function') ? message(row) : (message || (row[field] && row[field].toString()) || '-')
        const _steadyStatus = steadyStatus || (expectStatus[statusModule] && Object.values(expectStatus[statusModule]).flat())
        let addAutoReset = false
        if (row.disks_info && R.is(Array, row.disks_info)) {
          addAutoReset = row.disks_info.some(disk => disk.auto_reset)
        }
        const ret = [
          h('list-body-cell-wrap', {
            props: {
              message: text,
              resource: resource,
              copy: true,
              edit: (R.type(edit) === 'Function' && edit(row)) || edit === true,
              field,
              row,
              onManager,
              steadyStatus: _steadyStatus,
              hideField,
              addLock,
              addAutoReset,
              addEncrypt,
              addBackup,
              formRules,
              label,
            },
            scopedSlots: {
              default: () => {
                if (!slotCallback) return text
                try {
                  const n = slotCallback.length >= 2 ? slotCallback(row, h) : slotCallback(row)
                  return (n === undefined || n === null || n === false) ? text : n
                } catch (e) {
                  return text
                }
              },
              ...(cellWrapSlots && R.is(Function, cellWrapSlots) ? cellWrapSlots(row) : {}),
            },
          }),
        ]
        if ((R.type(showDesc) === 'Function' && showDesc(row)) || showDesc === true) {
          const realDescRules = [
            ...descriptionRules,
            {
              max: 256,
              message: i18n.t('validator.maxLength', ['256']),
            },
          ]
          let field = descField
          if (_.get(row, '_i18n.description')) field = '_i18n.description' // 如果多语言里面有备注，则取多语言里的字段
          ret.push(h('list-body-cell-wrap', {
            props: {
              resource: resource,
              edit: (R.is(Function, editDesc) && editDesc(row)) || editDesc === true,
              field,
              row,
              onManager,
              steadyStatus: _steadyStatus,
              formRules: realDescRules,
              copy: copyDesc,
            },
          }))
        }
        return ret
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getCopyWithContentTableColumn = ({
  field = 'name',
  title = i18n.t('common_186'),
  hideField,
  message,
  sortable,
  slotCallback,
  hidden,
  minWidth = 100,
  vm = {},
  customEdit = false,
  customEditCallback = () => { },
  formatter,
} = {}) => {
  const ret = {
    field,
    title,
    sortable,
    showOverflow: 'ellipsis',
    minWidth,
    slots: {
      default: ({ row }, _h) => {
        if (vm.isPreLoad && !row[field]) {
          return [h('data-loading')]
        }
        const text =
          (message && R.type(message) === 'Function')
            ? message(row)
            : (message || (row[field] && row[field].toString()) || '-')
        if (text === '-') {
          return '-'
        }
        return [
          h(
            'list-body-cell-wrap',
            {
              props: {
                copy: true,
                field,
                row,
                hideField,
                message: text,
                customEdit,
                customEditCallback: () => customEditCallback(row),
              },
            },
            [slotCallback ? (slotCallback.length >= 2 ? slotCallback(row, h) : slotCallback(row)) : null],
          ),
        ]
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
  if (formatter) ret.formatter = formatter
  return ret
}

export const getIpsTableColumn = ({ field = 'ips', title = 'IP', vm = {}, sortable = false, onlyElastic = false, noElastic = false, hidden } = {}) => {
  return {
    field,
    title,
    minWidth: 180,
    sortBy: onlyElastic ? 'order_by_eip' : 'order_by_ip',
    sortable,
    slots: {
      default: ({ row }, _h) => {
        if (!row.eip && !row.ips && !row.vips && (!row.metadata || !row.metadata.sync_ips)) {
          if (row.hypervisor === typeClouds.hypervisorMap.esxi.key && ['ready', 'running'].includes(row.status)) {
            if (noElastic || (!onlyElastic && !noElastic)) {
              return [
                h(IpSupplement, {
                  props: {
                    row,
                    field,
                    vm,
                  },
                }),
              ]
            } else {
              return '-'
            }
          } else {
            if (vm.isPreLoad) {
              return [h('data-loading')]
            }
            return []
          }
        }
        let ret = []
        if (onlyElastic) { // 只展示弹性ip
          if (row.eip && row.eip_mode === 'elastic_ip') {
            ret.push(
              h(
                'list-body-cell-wrap',
                {
                  props: {
                    row,
                    field: 'eip',
                    copy: true,
                  },
                },
                [
                  h(
                    'span',
                    { class: 'text-color-help' },
                    `(${i18n.t('common_290')})`,
                  ),
                ],
              ),
            )
          }
          return ret.length ? ret : '-'
        }
        if (noElastic) {
          if (row.eip && row.eip_mode !== 'elastic_ip') {
            ret.push(
              h(
                'list-body-cell-wrap',
                {
                  props: {
                    row,
                    field: 'eip',
                    copy: true,
                  },
                },
                [
                  h(
                    'span',
                    { class: 'text-color-help' },
                    `(${i18n.t('common_291')})`,
                  ),
                ],
              ),
            )
          }
        } else if (row.eip) {
          ret.push(
            h(
              'list-body-cell-wrap',
              {
                props: {
                  row,
                  field: 'eip',
                  copy: true,
                },
              },
              [
                h(
                  'span',
                  { class: 'text-color-help' },
                  `(${row.eip_mode === 'elastic_ip' ? i18n.t('common_290') : i18n.t('common_291')})`,
                ),
              ],
            ),
          )
        }
        if (row.ips) {
          const iparr = row.ips.split(',')
          const ips = iparr.map(ip =>
            h(
              'list-body-cell-wrap',
              {
                props: {
                  copy: true,
                  row: { ip },
                  'hide-field': true,
                  field: 'ip',
                },
              },
              [
                ip,
                h(
                  'span',
                  { class: 'text-color-help' },
                  `(${i18n.t('common_287')})`,
                ),
              ],
            ),
          )
          ret = ret.concat(ips)
        }
        if (row.vips) {
          const ips = row.vips.map(ip =>
            h(
              'list-body-cell-wrap',
              {
                props: {
                  copy: true,
                  row: { ip },
                  'hide-field': true,
                  field: 'ip',
                },
              },
              [
                ip,
                h(
                  'span',
                  { class: 'text-color-help' },
                  `(${i18n.t('common_vip')})`,
                ),
              ],
            ),
          )
          ret = ret.concat(ips)
        }
        if (row.vip) {
          const iparr = row.vip.split(',')
          const ips = iparr.map(ip =>
            h(
              'list-body-cell-wrap',
              {
                props: {
                  copy: true,
                  row: { ip },
                  'hide-field': true,
                  field: 'ip',
                },
              },
              [
                ip,
                h(
                  'span',
                  { class: 'text-color-help' },
                  `(${i18n.t('common_vip')})`,
                ),
              ],
            ),
          )
          ret = ret.concat(ips)
        }
        if (row.vip_eip) {
          const iparr = row.vip_eip.split(',')
          const ips = iparr.map(ip =>
            h(
              'list-body-cell-wrap',
              {
                props: {
                  copy: true,
                  row: { ip },
                  'hide-field': true,
                  field: 'ip',
                },
              },
              [
                ip,
                h(
                  'span',
                  { class: 'text-color-help' },
                  `(${i18n.t('common_evip')})`,
                ),
              ],
            ),
          )
          ret = ret.concat(ips)
        }
        if (row.metadata && row.metadata.sync_ips) {
          const iparr = row.metadata.sync_ips.split(',')
          const ips = iparr.map(ip =>
            h(
              'list-body-cell-wrap',
              {
                props: {
                  copy: true,
                  row: { ip },
                  'hide-field': true,
                  field: 'ip',
                },
              },
              [
                ip,
                h(
                  'span',
                  { class: 'text-color-help' },
                  [
                    i18n.t('compute.esxi.sync_ips_outofrange'),
                    h('icon', {
                      class: 'ml-1',
                      style: 'color:red',
                      attrs: {
                        type: 'warning',
                        title: i18n.t('compute.esxi.sync_ips_outofrange_alert'),
                      },
                    }),
                  ],
                ),
              ],
            ),
          )
          ret = ret.concat(ips)
        }
        return ret.length ? ret : '-'
      },
    },
    formatter: ({ row }) => {
      const ret = []
      if (onlyElastic) { // 只展示弹性ip
        if (row.eip && row.eip_mode === 'elastic_ip') {
          ret.push(`${row.eip}(${i18n.t('common_290')})`)
        }
        return ret.length ? ret.join(', ') : '-'
      }
      if (noElastic) {
        if (row.eip && row.eip_mode !== 'elastic_ip') {
          ret.push(ret.push(`${row.eip}(${i18n.t('common_291')})`))
        }
      } else if (row.eip) {
        if (row.eip_mode === 'elastic_ip') {
          ret.push(`${row.eip}(${i18n.t('common_290')})`)
        } else {
          ret.push(`${row.eip}(${i18n.t('common_291')})`)
        }
      }
      if (row.ips) {
        const iparr = row.ips.split(',')
        iparr.map(ip => {
          ret.push(`${ip}(${i18n.t('common_287')})`)
        })
      }
      if (row.vips) {
        row.vips.map(ip => {
          ret.push(`${ip}(${i18n.t('common_vip')})`)
        })
      }
      if (row.vip) {
        const iparr = row.vip.split(',')
        iparr.map(ip => {
          ret.push(`${ip}(${i18n.t('common_vip')})`)
        })
      }
      if (row.vip_eip) {
        const iparr = row.vip_eip.split(',')
        iparr.map(ip => {
          ret.push(`${ip}(${i18n.t('common_evip')})`)
        })
      }
      if (row.metadata && row.metadata.sync_ips) {
        const iparr = row.metadata.sync_ips.split(',')
        iparr.map(ip => {
          ret.push(`${ip}(${i18n.t('compute.esxi.sync_ips_outofrange')})`)
        })
      }
      return ret.join(', ')
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getSwitchTableColumn = ({ field, title, change, disabled, hidden }) => {
  return {
    field,
    title,
    slots: {
      default: ({ row }, _h) => {
        let checked = _.get(row, field)
        if (R.is(String, checked)) {
          if (checked === 'true') checked = true
          if (checked === 'false') checked = false
        }
        return [
          h('a-switch', {
            props: {
              checked,
              disabled,
              checkedChildren: i18n.t('common_292'),
              unCheckedChildren: i18n.t('common_293'),
            },
            on: {
              change,
            },
          }),
        ]
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getTagTableColumn = ({
  field = 'metadata',
  title = i18n.t('table.title.tag'),
  ignoreKeys,
  supportKeyStarts = ['user:'],
  needExt,
  resource,
  onManager,
  columns,
  tipName,
  ignorePrefix,
  width = 50,
  customTitle = '',
  list = {},
  params = {}, // 请求已有标签传入参数
  editCheck = (row) => true,
  hidden,
  manager,
  idKey = 'id',
  vm = {},
} = {}) => {
  return {
    field,
    title,
    width,
    slots: {
      default: ({ row }, _h) => {
        let metadata = _.get(row, field) || {}
        if (field === 'project_tags' || field === 'object_tags' || field === 'domain_tags') {
          metadata = {}
          const fieldValue = row[field] || []
          fieldValue.map(item => {
            if (metadata.hasOwnProperty(item.key)) {
              if (R.is(Array, metadata[item.key])) {
                metadata[item.key].push(item.value)
              } else {
                metadata[item.key] = [metadata[item.key], item.value]
              }
            } else {
              metadata[item.key] = item.value
            }
          })
        }
        const supportStarts = [...supportKeyStarts]
        if (needExt) {
          supportStarts.push('ext:')
        }
        return [
          h(TagTableColumn, {
            props: {
              row,
              onManager,
              metadata,
              ignoreKeys,
              supportKeyStarts: supportStarts,
              needExt,
              resource,
              columns,
              tipName,
              ignorePrefix,
              customTitle,
              list,
              tagParams: params,
              manager: manager,
              refresh: vm.refresh,
              idKey,
              canEdit: editCheck(row),
            },
          }),
        ]
      },
    },
    formatter: ({ row }) => {
      let metadata = _.get(row, field) || {}
      if (field === 'project_tags' || field === 'object_tags' || field === 'domain_tags') {
        metadata = {}
        const fieldValue = row[field] || []
        fieldValue.map(item => {
          if (metadata.hasOwnProperty(item.key)) {
            if (R.is(Array, metadata[item.key])) {
              metadata[item.key].push(item.value)
            } else {
              metadata[item.key] = [metadata[item.key], item.value]
            }
          } else {
            metadata[item.key] = item.value
          }
        })
      }
      const ret = []
      const keys = Object.keys(metadata)
      const supportStarts = [...supportKeyStarts]
      if (needExt) {
        supportStarts.push('ext:')
      }
      keys.map(key => {
        if (supportStarts.some(s => key.startsWith(s))) {
          let tagKey = key
          supportStarts.map(s => {
            tagKey = tagKey.replace(s, '')
          })
          if (R.is(Array, metadata[key])) {
            metadata[key].map(val => {
              ret.push({ key: tagKey, value: val })
            })
          } else {
            ret.push({ key: tagKey, value: metadata[key] })
          }
        }
      })
      return ret.length ? JSON.stringify(ret) : ''
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const isPublicTableColumn = ({ field = 'is_public', title = i18n.t('common_101'), hidden } = {}) => {
  return {
    field,
    title,
    minWidth: 70,
    visible: store.getters.isAdminMode || store.getters.isDomainMode,
    formatter: ({ row }) => {
      let text = ''
      if (row.is_public === false || row.is_public === 'false') {
        text = i18n.t('common_287')
        if (row.shared_projects) {
          text = i18n.t('shareScope.project')
        }
      } else {
        const scopeText = i18n.t(`shareScope.${row.public_scope}`)
        if (row.public_scope) {
          text = scopeText
        } else {
          text = i18n.t('shareScope.system')
        }
      }
      return text
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}
export const getTimeTableColumn = ({
  field = 'created_at',
  title = i18n.t('table.title.create_time'),
  sortable = true,
  fromNow = false,
  minWidth = 180,
  vm = {},
  hidden,
  format,
} = {}) => {
  return {
    field,
    title,
    minWidth: minWidth,
    sortable,
    slots: {
      default: ({ row }, _h) => {
        if (vm.isPreLoad && !row[field]) {
          return [h('data-loading')]
        }
        if (!row[field]) {
          return '-'
        }
        if (fromNow) {
          const title = moment(row[field]).format()
          const content = moment(row[field]).fromNow()
          return [
            h('span', { class: 'ml-1', attrs: { title } }, content),
          ]
        }
        const title = moment(row[field]).fromNow()
        const content = moment(row[field]).format(format)
        return [
          h('span', { class: 'ml-1', attrs: { title } }, content),
        ]
      },
    },
    formatter: ({ row }) => {
      if (!row[field]) {
        return '-'
      }
      const m = moment(row[field])
      if (fromNow) {
        return m.fromNow()
      }
      return m.format(format)
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getTimeRangeColumn = ({
  field = 'time_range',
  start_field = 'start_time',
  end_field = 'end_time',
  title = i18n.t('table.title.create_time'),
  sortable = false,
  format = 'YYYY-MM-DD HH:mm:ss',
  hidden,
} = {}) => {
  return {
    field,
    start_field,
    end_field,
    title,
    width: 320,
    sortable,
    slots: {
      default: ({ row }, _h) => {
        const start = row[start_field] ? moment(row[start_field]).format(format) : ''
        const end = row[end_field] ? moment(row[end_field]).format(format) : ''
        if (start && end) {
          return `${start} ~ ${end}`
        } else if (start) {
          return i18n.t('common.from_moment', [start])
        } else if (end) {
          return i18n.t('common.until_moment', [end])
        }
        return i18n.t('common.permanent_effect')
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

/**
 * 时长展示
 * @param {Object}
 * @returns string eg: 2分12秒 12秒
 */
export const getTimeDurationColumn = ({
  field = 'time_duration',
  start_field = 'start_time',
  end_field = 'end_time',
  title = i18n.t('table.title.time_duration'),
  hidden,
} = {}) => {
  return {
    field,
    title,
    formatter: ({ row }) => {
      const start = row[start_field] ? moment(row[start_field]) : ''
      const end = row[end_field] ? moment(row[end_field]) : ''
      if (start && end) {
        const duration = parseInt(moment.duration(end.diff(start)) / 1000)
        if (!duration) return `< 1${i18n.t('common.second_unit')}`
        const h = parseInt(duration / (60 * 60))
        const m = parseInt((duration % (60 * 60)) / 60)
        const s = duration % 60
        return `${h ? `${h}${i18n.t('common.hour_unit')} ` : ''}${m ? `${m}${i18n.t('common.minute_unit')} ` : ''}${`${s}${i18n.t('common.second_unit')}`}`
      } else {
        return '-'
      }
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getAccountTableColumn = ({
  field = 'account',
  title = i18n.t('res.cloudaccount'),
  hidden,
  managerField = 'manager',
  brandField = 'brand',
  vm = {},
} = {}) => {
  return {
    field,
    title,
    minWidth: 120,
    showOverflow: 'ellipsis',
    hidden: () => {
      if (store.getters.isProjectMode) {
        return true
      }
      if (R.is(Function, hidden)) return hidden()
      return hidden
    },
    slots: {
      default: ({ row }, _h) => {
        let val = _.get(row, field)
        if (vm.isPreLoad && !val) {
          return [h('data-loading')]
        }
        // OneStack => oem name
        if (val === 'OneStack' && row[brandField] && row[brandField] === 'OneCloud') {
          val = setting.brand[setting.language] || setting.brand.en || val
        }
        const ret = []
        ret.push(
          h(
            'list-body-cell-wrap',
            {
              props: {
                'hide-field': true,
                copy: true,
                field,
                row: { [field]: val },
              },
            },
            [
              h(
                'span',
                {
                  style: { color: 'var(--oc-color-text-heading)' },
                },
                val || '-',
              ),
            ],
          ),
        )
        const managerVal = _.get(row, managerField)
        if (managerVal) {
          ret.push(
            h(
              'list-body-cell-wrap',
              {
                props: {
                  'hide-field': true,
                  copy: true,
                  field: managerField,
                  row,
                },
              },
              [
                h(
                  'span',
                  {
                    style: { color: 'var(--oc-color-text-secondary)' },
                  },
                  managerVal,
                ),
              ],
            ),
          )
        }
        return ret
      },
    },
  }
}

export const getBillingTypeTableColumn = ({ field = 'billing_type', title = i18n.t('table.title.bill_type'), width = '120px', hidden } = {}) => {
  return {
    field,
    title,
    showOverflow: 'ellipsis',
    width,
    slots: {
      default: ({ row }, _h) => {
        const ret = []
        const billingText = (row) => {
          if (row.charge_type) {
            if (row[field] === 'postpaid' && row.charge_type === 'traffic') {
              return i18n.t('billingType.postpaid_traffic')
            } else if (row[field] === 'postpaid' && row.charge_type === 'bandwidth') {
              return i18n.t('billingType.postpaid_bandwidth')
            } else if (row[field] === 'prepaid' && row.charge_type === 'traffic') {
              return i18n.t('billingType.prepaid_traffic')
            } else if (row[field] === 'prepaid' && row.charge_type === 'bandwidth') {
              return i18n.t('billingType.prepaid_bandwidth')
            } else {
              if (row[field] && row.charge_type) {
                return `${row[field]}/${row.charge_type}`
              } else if (row[field]) {
                return row[field]
              } else if (row.charge_type) {
                return row.charge_type
              } else {
                return ''
              }
            }
          } else {
            if (row[field] === 'postpaid') {
              return i18n.t('billingType.postpaid')
            } else if (row[field] === 'prepaid') {
              return i18n.t('billingType.prepaid')
            } else {
              return row[field]
            }
          }
        }
        ret.push(
          h(
            'div',
            {
              style: { color: 'var(--oc-color-text-heading)' },
            },
            billingText(row),
          ),
        )
        if (row.expired_at) {
          const dateArr = moment(row.expired_at).fromNow().split(' ')
          const date = dateArr.join(' ')
          const seconds = moment(row.expired_at).diff(new Date()) / 1000
          const textColor = seconds / 24 / 60 / 60 < 7 ? '#DD2727' : 'var(--oc-color-text-secondary)'
          const text = seconds < 0 ? i18n.t('common_296') : i18n.t('common_297', [date])
          ret.push(
            h(
              'div',
              {
                style: { color: textColor },
              },
              text,
            ),
          )
        }
        return ret
      },
    },
    formatter: ({ row }) => {
      if (row[field] === 'postpaid') {
        return i18n.t('billingType.postpaid')
      } else if (row[field] === 'prepaid') {
        return i18n.t('billingType.prepaid')
      }
      return ''
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getPublicScopeTableColumn = ({
  field = 'public_scope',
  title = i18n.t('table.title.share_range'),
  vm,
  resource,
  width = 110,
  hidden,
} = {}) => {
  return {
    title,
    field,
    showOverflow: 'title',
    width,
    hidden: () => {
      if (!store.getters.l3PermissionEnable && (store.getters.scopeResource && store.getters.scopeResource.domain.includes(resource))) {
        return true
      }
      if (R.is(Function, hidden)) return hidden()
      return hidden
    },
    slots: {
      default: ({ row }, _h) => {
        const i18nPrefix = store.getters.l3PermissionEnable ? 'shareDesc' : 'shareDescPrimary'
        if (row.is_public === false || row.is_public === 'false') return i18n.t(`${i18nPrefix}.none`)
        const { public_scope: publicScope, shared_projects: sharedProjects, shared_domains: sharedDomains } = row
        if (publicScope === 'project' && sharedProjects && sharedProjects.length > 0) {
          return [
            h(
              'a',
              {
                on: {
                  click: () => {
                    vm.createDialog('CommonDialog', {
                      hiddenCancel: true,
                      header: i18n.t('common_101'),
                      body: () => {
                        return [
                          h('a-alert', {
                            class: 'mb-2',
                            props: {
                              message: i18n.t('common_298', [sharedProjects.length]),
                            },
                          }),
                          h('dialog-table', {
                            props: {
                              vxeGridProps: { showOverflow: 'title' },
                              data: sharedProjects,
                              columns: [
                                getCopyWithContentTableColumn({
                                  field: 'id',
                                  title: 'ID',
                                  minWidth: 140,
                                }),
                                getCopyWithContentTableColumn({
                                  field: 'name',
                                  title: i18n.t('common_186'),
                                }),
                                getCopyWithContentTableColumn({
                                  field: 'domain',
                                  title: i18n.t('table.title.owner_domain'),
                                }),
                              ],
                            },
                          }),
                        ]
                      },
                    })
                  },
                },
              },
              [i18n.t(`${i18nPrefix}.project`)],
            ),
          ]
        }
        if (publicScope === 'domain') {
          if (sharedDomains && sharedDomains.length > 0) {
            return [
              h(
                'a',
                {
                  on: {
                    click: () => {
                      vm.createDialog('CommonDialog', {
                        hiddenCancel: true,
                        header: i18n.t('common_101'),
                        body: () => {
                          return [
                            h('a-alert', {
                              class: 'mb-2',
                              props: {
                                message: i18n.t('common_300', [sharedDomains.length]),
                              },
                            }),
                            h('dialog-table', {
                              props: {
                                vxeGridProps: { showOverflow: 'title' },
                                data: sharedDomains,
                                columns: [
                                  getCopyWithContentTableColumn({
                                    field: 'id',
                                    title: 'ID',
                                    minWidth: 140,
                                  }),
                                  getCopyWithContentTableColumn({
                                    field: 'name',
                                    title: i18n.t('common_186'),
                                  }),
                                ],
                              },
                            }),
                          ]
                        },
                      })
                    },
                  },
                },
                [i18n.t(`${i18nPrefix}.domain`)],
              ),
            ]
          }
          return i18n.t(`${i18nPrefix}.projectAll`)
        }
        if (publicScope === 'system') {
          return i18n.t(`${i18nPrefix}.domainAll`)
        }
        return '-'
      },
    },
  }
}

export const getProjectDomainTableColumn = ({
  field = 'project_domain',
  title = i18n.t('table.title.owner_domain'),
  sortable = true,
  vm = {},
  hidden,
} = {}) => {
  return getCopyWithContentTableColumn({
    title,
    field,
    sortable,
    vm,
    hidden: () => {
      if (!(store.getters.isAdminMode || store.getters.isDomainMode)) return true
      return R.is(Function, hidden) ? hidden() : hidden
    },
  })
}

export const getApplicationScopeTableColumn = ({
  field = 'public_scope',
  title = i18n.t('common.application_scope'),
  vm,
  resource,
  width = 110,
  hidden,
  scope = 'project',
} = {}) => {
  return {
    title,
    field,
    showOverflow: 'title',
    width,
    hidden: () => {
      if (!store.getters.l3PermissionEnable && (store.getters.scopeResource && store.getters.scopeResource.domain.includes(resource))) {
        return true
      }
      if (R.is(Function, hidden)) return hidden()
      return hidden
    },
    slots: {
      default: ({ row }, _h) => {
        const i18nPrefix = 'common_application_scope_desc'
        if (row.is_public === false || row.is_public === 'false') {
          return scope === 'domain' ? i18n.t('common.apply_to_current_domain') : i18n.t('common.apply_to_current_project')
        }
        const { public_scope: publicScope, shared_projects: sharedProjects, shared_domains: sharedDomains } = row
        if (publicScope === 'project' && sharedProjects && sharedProjects.length > 0) {
          return [
            h(
              'a',
              {
                on: {
                  click: () => {
                    vm.createDialog('CommonDialog', {
                      hiddenCancel: true,
                      header: i18n.t('common.application_scope'),
                      body: () => {
                        return [
                          h('a-alert', {
                            class: 'mb-2',
                            props: {
                              message: i18n.t('common.rule_scope_resource', [sharedProjects.length, i18n.t('dictionary.project')]),
                            },
                          }),
                          h('dialog-table', {
                            props: {
                              vxeGridProps: { showOverflow: 'title' },
                              data: sharedProjects,
                              columns: [
                                getCopyWithContentTableColumn({
                                  field: 'id',
                                  title: 'ID',
                                  minWidth: 140,
                                }),
                                getCopyWithContentTableColumn({
                                  field: 'name',
                                  title: i18n.t('common_186'),
                                }),
                                getCopyWithContentTableColumn({
                                  field: 'domain',
                                  title: i18n.t('table.title.owner_domain'),
                                }),
                              ],
                            },
                          }),
                        ]
                      },
                    })
                  },
                },
              },
              [i18n.t(`${i18nPrefix}.project`)],
            ),
          ]
        }
        if (publicScope === 'domain') {
          if (sharedDomains && sharedDomains.length > 0) {
            return [
              h(
                'a',
                {
                  on: {
                    click: () => {
                      vm.createDialog('CommonDialog', {
                        hiddenCancel: true,
                        header: i18n.t('common.application_scope'),
                        body: () => {
                          return [
                            h('a-alert', {
                              class: 'mb-2',
                              props: {
                                message: i18n.t('common.rule_scope_resource', [sharedDomains.length, i18n.t('dictionary.domain')]),
                              },
                            }),
                            h('dialog-table', {
                              props: {
                                vxeGridProps: { showOverflow: 'title' },
                                data: sharedDomains,
                                columns: [
                                  getCopyWithContentTableColumn({
                                    field: 'id',
                                    title: 'ID',
                                    minWidth: 140,
                                  }),
                                  getCopyWithContentTableColumn({
                                    field: 'name',
                                    title: i18n.t('common_186'),
                                  }),
                                ],
                              },
                            }),
                          ]
                        },
                      })
                    },
                  },
                },
                [i18n.t(`${i18nPrefix}.domain`)],
              ),
            ]
          }
          return i18n.t(`${i18nPrefix}.projectAll`)
        }
        if (publicScope === 'system') {
          return i18n.t(`${i18nPrefix}.domainAll`)
        }
        return '-'
      },
    },
    formatter: ({ row }) => {
      const i18nPrefix = 'common_application_scope_desc'
      if (row.is_public === false || row.is_public === 'false') {
        return scope === 'domain' ? i18n.t('common.apply_to_current_domain') : i18n.t('common.apply_to_current_project')
      }
      const { public_scope: publicScope, shared_projects: sharedProjects, shared_domains: sharedDomains } = row
      if (publicScope === 'project' && sharedProjects && sharedProjects.length > 0) {
        return i18n.t(`${i18nPrefix}.project`)
      }
      if (publicScope === 'domain') {
        if (sharedDomains && sharedDomains.length > 0) {
          return i18n.t(`${i18nPrefix}.domain`)
        }
        return i18n.t(`${i18nPrefix}.projectAll`)
      }
      if (publicScope === 'system') {
        return i18n.t(`${i18nPrefix}.domainAll`)
      }
      return '-'
    },
  }
}

export const getBillingTableColumn = ({
  vm,
  field = 'billing_type',
  title = i18n.t('table.title.bill_type'),
  minWidth = 120,
  showOverflow = 'ellipsis',
  hiddenSetBtn,
  hidden,
  showSetButton = true,
} = {}) => {
  return {
    title,
    field,
    minWidth,
    showOverflow,
    slots: {
      default: ({ row }, _h) => {
        const billingType = row[field]
        const ret = []
        const openVmSetDurationDialog = () => {
          if (!vm) return null
          vm.createDialog('SetDurationDialog', {
            data: [row],
            columns: vm.columns,
            onManager: vm.onManager,
            refresh: vm.refresh,
          })
        }
        if (billingType === 'postpaid') {
          ret.push(
            h(
              'div',
              {
                style: { color: 'var(--oc-color-text-heading)' },
              },
              i18n.t('billingType.postpaid'),
            ),
          )
        } else if (billingType === 'prepaid') {
          ret.push(
            h(
              'div',
              {
                style: { color: 'var(--oc-color-text-heading)' },
              },
              i18n.t('billingType.prepaid'),
            ),
          )
        }
        if (billingType === 'postpaid' && row.release_at) {
          const time = vm.$moment(row.release_at).format()
          const isHiddenSetButton = R.is(Function, hiddenSetBtn) ? hiddenSetBtn() : hiddenSetBtn

          let tipText = i18n.t('common_301', [time])
          const canCancelExpire = hasPermission({ key: 'server_perform_cancel_expire' }) && !isHiddenSetButton && showSetButton
          if (canCancelExpire) {
            tipText += ` ${i18n.t('common_453')}`
          }

          const help = h(
            'span',
            {
              class: 'ml-1',
              style: { cursor: canCancelExpire ? 'pointer' : 'help' },
              attrs: { title: tipText },
              on: canCancelExpire ? { click: openVmSetDurationDialog } : undefined,
            },
            [h('icon', { props: { type: 'help' } })],
          )

          const dateArr = vm.$moment(row.release_at).fromNow().split(' ')
          const date = dateArr.join(' ')
          const seconds = vm.$moment(row.release_at).diff(new Date()) / 1000
          const textColor = seconds / 24 / 60 / 60 < 7 ? '#DD2727' : 'var(--oc-color-text-secondary)'
          const text = seconds < 0 ? i18n.t('common_296') : i18n.t('common_297', [date])
          ret.push(
            h(
              'div',
              {
                class: 'text-truncate',
                attrs: { title: text },
                style: { color: textColor },
              },
              [text, ' ', help],
            ),
          )
        } else if (billingType === 'prepaid' && row.expired_at) {
          const time = vm.$moment(row.expired_at).format()

          const tooltipText = row.auto_renew
            ? i18n.t('common_301', [time]) + i18n.t('common_451')
            : i18n.t('common_301', [time]) + i18n.t('common_452')

          const help = h(
            'span',
            {
              class: 'ml-1',
              style: { cursor: 'help' },
              attrs: { title: tooltipText },
            },
            [h('icon', { props: { type: 'help' } })],
          )

          const dateArr = vm.$moment(row.expired_at).fromNow().split(' ')
          const date = dateArr.join(' ')
          const seconds = vm.$moment(row.expired_at).diff(new Date()) / 1000
          const textColor = seconds / 24 / 60 / 60 < 7 ? '#DD2727' : 'var(--oc-color-text-secondary)'
          const text = seconds < 0 ? i18n.t('common_296') : i18n.t('common_297', [date])
          ret.push(
            h(
              'div',
              {
                class: 'text-truncate',
                attrs: { title: text },
                style: { color: textColor },
              },
              [text, ' ', help],
            ),
          )
        }
        return ret
      },
    },
    formatter: ({ row }) => {
      const billingType = row[field]
      if (billingType === 'postpaid') {
        return i18n.t('billingType.postpaid')
      } else if (billingType === 'prepaid') {
        return i18n.t('billingType.prepaid')
      }
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getZone1TableColumn = ({
  vm,
  field = 'zone_1_name',
  idField = 'zone_1_id',
  title = i18n.t('table.title.zone_1_name'),
  sortable = true,
  hidden,
} = {}) => {
  return {
    field,
    title,
    slots: {
      default: ({ row }, _h) => {
        if (!row[idField]) return row[field] || '-'
        const p = hasPermission({ key: 'zones_get' })
        let node
        if (p) {
          node = h(
            'list-body-cell-wrap',
            {
              props: {
                copy: true,
                row,
                field,
                title: row[field],
                hideField: true,
              },
            },
            [
              h(
                'side-page-trigger',
                {
                  props: {
                    permission: 'zones_get',
                    name: 'ZoneSidePage',
                    id: row[idField],
                    vm,
                  },
                },
                [row[field]],
              ),
            ],
          )
        } else {
          node = h('list-body-cell-wrap', {
            props: {
              copy: true,
              row,
              field,
              title: row[field],
            },
          })
        }
        return [
          h(
            'div',
            {
              class: 'text-truncate',
            },
            [node],
          ),
        ]
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getOsArch = ({
  field = 'os_arch',
  title = i18n.t('table.title.os_arch'),
  hidden,
} = {}) => {
  return {
    field,
    title,
    formatter: ({ row }) => {
      let arch = _.get(row, field)
      if (!arch && field !== 'os_arch') {
        arch = _.get(row, 'os_arch')
      }
      if (arch === HOST_CPU_ARCHS.arm.capabilityKey) arch = HOST_CPU_ARCHS.arm.key
      if (arch === HOST_CPU_ARCHS.x86.capabilityKey) arch = HOST_CPU_ARCHS.x86.key
      if (arch) {
        return _.get(HOST_CPU_ARCHS, `${arch}.label`) || arch
      }
      return HOST_CPU_ARCHS.x86.label
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getOsDist = ({
  field = 'os_dist',
  title = i18n.t('table.title.os'),
  show_label,
  hidden,
} = {}) => {
  return {
    field,
    title,
    width: 100,
    sortable: true,
    slots: {
      default: ({ row }, h) => {
        if (!row.metadata && !row.properties) return
        const dist = row.metadata?.os_distribution || row.metadata?.distro || row.properties?.os_distribution || row.properties?.distro
        const version = row.metadata?.os_version || row.metadata?.version || row.properties?.os_version || row.properties?.version
        const osType = row.metadata?.os_type || row.properties?.os_type || row.os_type

        let name = ''
        let tooltip = ''
        if (dist) {
          tooltip = version ? (version.includes(dist) ? version : `${decodeURI(dist)} ${version}`) : dist
        } else if (osType) {
          tooltip = osType
        } else {
          tooltip = i18n.t('compute.text_339')
        }

        name = dist || osType || ''
        if (name.includes('Windows') || name.includes('windows')) {
          name = 'Windows'
        } else if (name.startsWith('Linux') || name.startsWith('linux')) {
          name = 'Linux'
        } else if (name === 'Others Linux') {
          name = 'Linux'
          tooltip = row.metadata?.os_full_name || tooltip
        }
        const ret = [
          h(SystemIcon, {
            props: {
              tooltip,
              name,
            },
          }),
        ]
        if (show_label) {
          ret.push(h('span', { class: 'text-truncate' }, ` ${tooltip}`))
        }
        return ret
      },
    },
    formatter: ({ row }) => {
      if (!row.metadata) return
      const dist = row.metadata.os_distribution || row.metadata.distro
      const version = row.metadata.os_version || row.metadata.version
      let tooltip = ''

      if (dist) {
        tooltip = version ? (version.includes(dist) ? version : `${decodeURI(dist)} ${version}`) : dist
      } else if (row.metadata.os_type) {
        tooltip = row.metadata.os_type
      } else if (row.os_type) {
        tooltip = row.os_type
      } else {
        tooltip = i18n.t('compute.text_339')
      }

      return tooltip
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getInstanceSnapshotsTableColumn = ({
  field = 'instance_snapshots',
  title = i18n.t('dictionary.instance_snapshot'),
  sortable = true,
  hidden,
} = {}) => {
  return {
    field,
    title,
    sortable,
    formatter: ({ row }) => {
      const extResource = _.get(row, 'ext_resource') || {}
      return _.get(extResource, field) || '-'
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getServerMonitorAgentInstallStatus = ({
  field = 'metadata',
  hiddenField = 'agent_status',
  title = i18n.t('compute.monitor.agent.install_status'),
  hidden,
} = {}) => {
  return {
    field,
    title,
    hiddenField,
    slots: {
      default: function ({ row }, h) {
        const status = _.get(row, ['metadata', 'sys:monitor_agent']) || _.get(row, ['metadata', '__monitor_agent'])
        const deploy = _.get(row, ['metadata', 'telegraf_deployed'])
        if (row.hasOwnProperty('agent_status') || deploy) {
          if (row.agent_status === 'succeed' || deploy) {
            return i18n.t('compute.monitor.agent.install_status.installed')
          } else if (row.agent_status === 'applying') {
            return h(
              'div',
              [
                i18n.t('compute.monitor.agent.install_status.installing'),
                h('icon', {
                  style: 'margin-left:5px',
                  attrs: { type: 'loading' },
                }),
              ],
            )
          } else if (row.agent_status === 'failed') {
            return i18n.t('compute.monitor.agent.install_status.installfailed')
          }
        } else if (status) {
          return i18n.t('compute.monitor.agent.install_status.installed')
        }
        return i18n.t('compute.monitor.agent.install_status.uninstall')
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getCycleTimerColumn = ({ timeFormat = 'YYYY-MM-DD HH:mm:ss', hidden } = {}) => {
  return {
    field: 'cycle_timer',
    title: i18n.t('cloudenv.text_427'),
    minWidth: 200,
    showOverflow: 'title',
    slots: {
      default: ({ row }, _h) => {
        if (!row.cycle_timer) return '-'
        const hour = row.cycle_timer.hour
        const minute = row.cycle_timer.minute
        const timer = i18n.t('cloudenv.text_465', [`${hour > 9 ? hour : `0${hour}`}:${minute > 9 ? minute : `0${minute}`}`])
        if (row.scheduled_type === 'cycle') {
          const cycleType = i18n.t('cloudenvScheduledtaskGroupCycleType')[row.cycle_timer.cycle_type]
          const startEndTime = i18n.t('cloudenv.text_466', [moment(row.cycle_timer.start_time).format(timeFormat), moment(row.cycle_timer.end_time).format(timeFormat)])
          if (row.cycle_timer.cycle_type === 'day') {
            return `${cycleType} ${timer} ${startEndTime}`
          } else if (row.cycle_timer.cycle_type === 'week') {
            const weekDays = row.cycle_timer.week_days.map((v) => {
              return i18n.t('flexGroupSubCycleTypeWeek')[v]
            })
            return `${cycleType} 【${weekDays.join('|')}】 ${timer} ${startEndTime}`
          } if (row.cycle_timer.cycle_type === 'month') {
            const monthDays = row.cycle_timer.month_days.map((v) => {
              return i18n.t('cloudenv.text_436', [v])
            })
            return `${cycleType} 【${monthDays.join('|')}】 ${timer} ${startEndTime}`
          }
        } else {
          return i18n.t('cloudenv.text_467', [moment(row.timer.exec_time).format(timeFormat)])
        }
      },
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

// 所属域
export const getDomainColumn = ({ vm, hidden }) => {
  return {
    field: 'domain',
    title: i18n.t('common.attribution_scope'),
    slots: {
      default: ({ row }, _h) => {
        const domain = row.project_domain || row.domain
        if (!row.domain_id) return domain || '-'
        if (!domain) return '-'
        const p = hasPermission({ key: 'domains_get' })
        let node
        if (p) {
          node = h(
            'list-body-cell-wrap',
            {
              props: {
                copy: true,
                row: vm.data,
                onManager: vm.onManager,
                field: 'project_domain',
                title: row.project_domain,
                message: domain,
                hideField: true,
              },
            },
            [
              h(
                'side-page-trigger',
                {
                  props: {
                    permission: 'domains_get',
                    name: 'DomainSidePage',
                    id: row.project_domain,
                    vm,
                  },
                },
                [domain],
              ),
            ],
          )
        } else {
          node = h('list-body-cell-wrap', {
            props: {
              copy: true,
              row: vm.data,
              onManager: vm.onManager,
              field: 'project_domain',
              title: row.project_domain,
              message: domain,
            },
          })
        }
        return [
          h(
            'div',
            {
              class: 'text-truncate',
            },
            [node],
          ),
        ]
      },
    },
    hidden: () => {
      if (store.getters.isProjectMode) return true
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getCloudEnvTableColumn = ({ field = 'cloud_env', title = i18n.t('common.cloud_env'), hidden } = {}) => {
  return {
    field,
    title,
    formatter: ({ row }) => {
      return i18n.te(`cloud_env.${row[field]}`) ? i18n.t(`cloud_env.${row[field]}`) : i18n.t('cloud_env.onpremise')
    },
    hidden: () => {
      return R.is(Function, hidden) ? hidden() : hidden
    },
  }
}

export const getTaskObjnameTableColumn = () => {
  return {
    title: i18n.t('table.title.res_name'),
    field: 'object',
    showOverflow: 'ellipsis',
    slots: {
      default: ({ row }, _h) => {
        let objName = ''
        if (row.object) {
          objName = row.object
        } else if (row.obj_id) {
          objName = row.obj_id
        }
        if (objName) {
          if (objName === '[--MULTI_OBJECTS--]') {
            return i18n.t('task.stages.title.multi_objects')
          } else {
            return [
              h(
                'list-body-cell-wrap',
                {
                  props: {
                    copy: true,
                    hideField: true,
                    field: 'object',
                    row,
                    message: objName,
                  },
                },
                [objName],
              ),
            ]
          }
        }
        return '-'
      },
    },
  }
}

export const getTaskObjIdTableColumn = () => {
  return {
    title: i18n.t('table.title.res_id'),
    field: 'obj_id',
    showOverflow: 'ellipsis',
    slots: {
      default: ({ row }, _h) => {
        if (row.obj_id) {
          if (row.obj_id === '[--MULTI_OBJECTS--]') {
            return i18n.t('task.stages.title.multi_objects')
          } else {
            return [
              h(
                'list-body-cell-wrap',
                {
                  props: {
                    copy: true,
                    hideField: true,
                    field: 'obj_id',
                    row,
                    message: row.obj_id,
                  },
                },
                [row.obj_id],
              ),
            ]
          }
        }
        return '-'
      },
    },
  }
}

export const getTaskNameTableColumn = () => {
  return {
    title: i18n.t('table.title.task_name'),
    field: 'task_name',
    showOverflow: 'ellipsis',
    slots: {
      default: ({ row }, _h) => {
        return [
          h(
            'list-body-cell-wrap',
            {
              props: {
                copy: true,
                hideField: true,
                field: 'task_name',
                row,
                message: row.task_name,
              },
            },
            [row.task_name],
          ),
        ]
      },
    },
  }
}

export const getSubtaskCountTableColumn = () => {
  return {
    title: i18n.t('table.title.children_task'),
    field: 'sub_task_count',
    formatter ({ row }) {
      if (row.sub_task_count > 0) {
        return row.sub_task_count + '(' + row.succ_sub_task_cnt + '/' + row.fail_sub_task_cnt + ')'
      } else {
        return '-'
      }
    },
  }
}
