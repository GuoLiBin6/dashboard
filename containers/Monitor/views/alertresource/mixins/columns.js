import _ from 'lodash'
import { strategyColumn, levelColumn } from '@Monitor/views/commonalert/utils'
import { getNameDescriptionTableColumn, getTimeTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'
export default {
  data () {
    return {
      extandData: {},
      expandConfig: {
        loadMethod: this.loadMethod,
        lazy: true,
      },
    }
  },
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        edit: false,
        onManager: this.onManager,
      }),
      {
        field: 'none',
        title: this.$t('common.status'),
        slots: {
          default: () => {
            const h = this.$createElement
            return [
              h('div', { class: 'text-truncate' }, [
                h('status', {
                  props: {
                    status: 'alerted',
                    statusModule: 'alertresource',
                  },
                }),
              ]),
            ]
          },
        },
      },
      {
        field: 'alert_table',
        title: i18n.t('monitor.text_98'),
        slots: {
          default: ({ row }) => {
            const columns = [
              getNameDescriptionTableColumn({
                onManager: this.onManager,
                hideField: true,
                title: i18n.t('monitor.text_99'),
                edit: false,
                showDesc: false,
                slotCallback: row => {
                  const h = this.$createElement
                  return h('side-page-trigger', {
                    props: {
                      onTrigger: () => this.handleOpenAlertSidepage(row),
                    },
                  }, row.alert)
                },
              }),
              getTimeTableColumn({ field: 'trigger_time', title: this.$t('monitor.text_14') }),
              strategyColumn(),
              levelColumn(),
              {
                field: 'value_str',
                title: this.$t('monitor.text_105'),
                align: 'right',
                formatter: ({ row }) => {
                  const val = _.get(row, 'data.value_str') || '-'
                  if (val === 'nodata') return this.$t('monitor.text_116')
                  return val
                },
              },
              {
                field: 'action',
                title: this.$t('compute.text_863'),
                slots: {
                  default: ({ row }) => {
                    const h = this.$createElement
                    const ret = []
                    ret.push(
                      h('a-button', {
                        props: { type: 'link' },
                        on: { click: () => viewTag(row) },
                      }, this.$t('common.view')),
                    )
                    return ret
                  },
                },
              },
            ]
            const viewTag = obj => {
              this.createDialog('ViewItemTagsDialog', {
                vm: this,
                data: [obj],
                columns: columns.slice(0, 3),
                title: this.$t('monitor.text_104'),
                field: 'data.tags',
              })
            }
            const data = row.childData || []
            return [this.$createElement('list-body-cell-popover', {
              props: {
                text: this.$t('common_701', [row.count || 0]),
                minWidth: '700px',
              },
            }, [
              this.$createElement('table-lite-grid', {
                props: {
                  size: 'mini',
                  resizable: true,
                  border: true,
                  showOverflow: false,
                  rowConfig: { isHover: true },
                  columnConfig: { resizable: false },
                  columns: columns,
                  data: data,
                },
              }),
            ])]
          },
        },
      },
      {
        field: 'type',
        title: i18n.t('monitor.text_97'),
        formatter: ({ row }) => {
          if (row.type) {
            if (this.$te(`dictionary.${row.type}`)) {
              return this.$t(`dictionary.${row.type}`)
            }

            return row.type
          }
          return '-'
        },
      },
    ]
    this.extandData = {}
  },
  methods: {
    async toggleRowExpand ({ row, expanded }) {
      if (expanded) {
        try {
          if (!this.extandData[row.id]) {
            this.extandData[row.id] = await this.getAlertdata(row.id)
            this.$refs.pagelist.$refs.table.$refs.grid.reloadExpandContent(row)
          }
        } catch (error) {
          throw error
        }
      }
    },
    loadMethod ({ row }) {
      return new Promise(resolve => {
        this.getAlertdata(row.id).then(data => {
          row.childData = data
          resolve()
        })
      })
    },
    async getAlertdata (id) {
      try {
        const { data: { data } } = await new this.$Manager('alertresources', 'v1').getSpecific({ id, spec: 'alerts' })
        return data
      } catch (error) {
        throw error
      }
    },
    handleOpenAlertSidepage (row) {
      this.sidePageTriggerHandle(this, 'CommonalertsSidePage', {
        id: row.alert_id,
        resource: 'commonalerts',
        apiVersion: 'v1',
        sourceList: this.list,
      })
    },
  },
}
