import * as R from 'ramda'
import {
  getNameDescriptionTableColumn,
  getBrandTableColumn,
  getStatusTableColumn,
  getProjectDomainTableColumn,
  getPublicScopeTableColumn,
  getAccountTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        formRules: [
          { required: true, message: i18n.t('common.text00042') },
        ],
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            props: {
              permission: 'cloudgroup_get',
              name: 'CloudgroupSidePage',
              id: row.id,
              list: this.list,
              vm: this,
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'cloudgroup' }),
      {
        field: 'cloudpolicies',
        title: i18n.t('cloudenv.text_329'),
        slots: {
          default: ({ row }) => {
            const handleVisibleChange = async (visible) => {
              if (visible && !row.feCloudpolicies && row.cloudpolicies && row.cloudpolicies.length > 0) {
                await this.loadPolicy({ row })
              }
            }
            if (R.isNil(row.cloudpolicies) || R.isEmpty(row.cloudpolicies)) {
              return i18n.t('cloudenv.text_330')
            }
            const columns = [
              {
                field: 'name',
                title: this.$t('common.name'),
              },
              {
                field: 'description',
                title: this.$t('table.title.desc'),
                formatter: ({ cellValue }) => cellValue || '-',
              },
            ]
            const h = this.$createElement
            const contentVnode = row.feCloudpolicies && row.feCloudpolicies.length > 0
              ? h('table-lite-grid', {
                props: {
                  showOverflow: false,
                  rowConfig: { isHover: true },
                  columnConfig: { resizable: false },
                  data: row.feCloudpolicies,
                  columns,
                },
              })
              : h('data-loading')
            return [h('a-popover', {
              props: { trigger: 'hover' },
              on: { openChange: handleVisibleChange },
              key: `popover-${row.id}-${row.feCloudpolicies ? row.feCloudpolicies.length : 0}`,
              scopedSlots: {
                content: () => h('div', {
                  style: row.feCloudpolicies && row.feCloudpolicies.length > 0 ? { minWidth: '600px' } : {},
                }, [contentVnode]),
              },
            }, [
              h('span', { style: 'color: var(--antd-wave-shadow-color)' }, i18n.t('cloudenv.text_245', [row.cloudpolicies.length])),
            ])]
          },
        },
        formatter: ({ row }) => {
          return [i18n.t('cloudenv.text_245', [(row.cloudpolicies && row.cloudpolicies.length) || 0])]
        },
      },
      getBrandTableColumn({ field: 'provider' }),
      getAccountTableColumn({ field: 'cloudaccount', title: this.$t('common.text00108') }),
      getPublicScopeTableColumn({ vm: this, resource: 'cloudgroups' }),
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
  methods: {
    async loadPolicy ({ row }) {
      let manager = new this.$Manager('cloudpolicies', 'v1')
      try {
        const response = await manager.list({
          params: {
            cloudgroup_id: row.id,
            scope: this.$store.getters.scope,
          },
        })
        this.$set(row, 'feCloudpolicies', response.data.data || [])
        return response
      } catch (error) {
        throw error
      } finally {
        manager = null
      }
    },
  },
}
