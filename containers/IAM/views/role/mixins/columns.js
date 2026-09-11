import {
  getNameDescriptionTableColumn,
  getProjectDomainTableColumn,
  getPublicScopeTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import h from '@/utils/legacyCreateElement'

const POLICY_POPOVER_STYLE = {
  width: '464px',
  maxWidth: '100%',
  padding: '8px',
  overflow: 'hidden',
  boxSizing: 'border-box',
}

// 去掉 antd 默认 content padding，避免列宽 + 双边距把表格撑出白底
const POLICY_POPOVER_OVERLAY_STYLE = {
  padding: 0,
  overflow: 'hidden',
}

const POLICY_COLUMNS = (vm) => ([
  { field: 'name', title: vm.$t('table.title.name'), width: '36%' },
  { field: 'description', title: vm.$t('table.title.desc'), width: '64%' },
])

// 用原生 table，避免 vxe 初始化时表体先于表头绘制造成闪动
const renderPolicyTable = (vm, policies) => {
  const columns = POLICY_COLUMNS(vm)
  return h('table', {
    class: 'role-policy-popover-table',
  }, [
    h('colgroup', columns.map(col => h('col', { style: { width: col.width } }))),
    h('thead', [
      h('tr', columns.map(col => h('th', col.title))),
    ]),
    h('tbody', policies.map(item => h('tr', columns.map(col => h('td', {
      title: item[col.field] || '',
    }, item[col.field] || '-'))))),
  ])
}

export default {
  unmounted () {
    this.pm = null
  },
  created () {
    this.pm = new this.$Manager('policies', 'v1')
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        edit: false,
        slotCallback: row => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      {
        field: 'match_policies',
        title: this.$t('dictionary.policy'),
        width: 100,
        slots: {
          default: ({ row }) => {
            if (!row.match_policies || row.match_policies.length === 0) return this.$t('common.notData')
            const policies = row._policies
            const hasData = Array.isArray(policies) && policies.length > 0
            const handleOpenChange = async (visible) => {
              if (!visible) {
                row._policiesHovering = false
                this.$set(row, '_policiesPopoverOpen', false)
                return
              }
              row._policiesHovering = true
              // 先拉完数据再打开，避免 loading→表格 过程中宽高变化触发左右翻转
              if (!hasData) {
                await this.fetchPolicies({ row })
              }
              if (row._policiesHovering) {
                this.$set(row, '_policiesPopoverOpen', true)
              }
            }
            const content = hasData
              ? renderPolicyTable(this, policies)
              : h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '72px',
                  color: 'rgba(0,0,0,.45)',
                },
              }, row._policiesLoading ? [h('data-loading')] : this.$t('common.notData'))
            return [h('a-popover', {
              key: `role-policies-${row.id}`,
              props: {
                trigger: 'hover',
                placement: 'bottom',
                autoAdjustOverflow: false,
                mouseEnterDelay: 0.1,
                destroyTooltipOnHide: false,
                open: !!row._policiesPopoverOpen,
                overlayClassName: 'role-policy-popover',
                overlayInnerStyle: POLICY_POPOVER_OVERLAY_STYLE,
              },
              on: {
                openChange: handleOpenChange,
              },
              scopedSlots: {
                content: () => h('div', {
                  style: POLICY_POPOVER_STYLE,
                }, [content]),
              },
            }, [
              h('span', {
                style: {
                  color: 'var(--antd-wave-shadow-color)',
                  cursor: 'pointer',
                },
              }, this.$t('common_701', [row.match_policies.length])),
            ])]
          },
        },
      },
      getPublicScopeTableColumn({ vm: this, resource: 'roles' }),
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
  methods: {
    async fetchPolicies ({ row }) {
      const policies = row.match_policies || []
      if (policies.length <= 0) {
        this.$set(row, '_policies', [])
        this.$set(row, '_policiesLoading', false)
        return true
      }
      if (row._policiesLoading) return
      try {
        this.$set(row, '_policiesLoading', true)
        const response = await this.pm.list({
          params: {
            name: policies,
          },
        })
        this.$set(row, '_policies', response.data.data || [])
        return response
      } catch (error) {
        throw error
      } finally {
        this.$set(row, '_policiesLoading', false)
      }
    },
  },
}
