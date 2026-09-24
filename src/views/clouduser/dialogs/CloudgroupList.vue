<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{$t('common_322')}}</template>
    <template #body>
      <page-list
        :list="list"
        :columns="columns"
        :enableVirtualScroll="false" />
    </template>
    <template #footer>
      <a-button type="primary" @click="cancelDialog">{{ $t('dialog.ok') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { getNameDescPopoverColumns, LIST_BODY_CELL_POPOVER_STYLE, resolveListBodyCellPopoverLayout, getListBodyCellPopoverContentStyle } from '@/utils/common/listBodyCellPopover'

export default {
  name: 'CloudgroupListForClouduserForUserDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      list: this.$list.createList(this, {
        id: 'CloudgroupListForClouduserForUser',
        resource: 'cloudgroups',
        apiVersion: 'v1',
        getParams: {
          clouduser_id: this.params.data[0].id,
        },
      }),
      columns: [
        {
          field: 'name',
          title: this.$t('dictionary.cloudgroup'),
        },
        {
          field: 'cloudpolicies',
          title: this.$t('common_309'),
          slots: {
            default: ({ row }) => {
              const handleVisibleChange = async (visible) => {
                if (visible && !row.feCloudpolicies && row.cloudpolicies && row.cloudpolicies.length > 0) {
                  await this.loadPolicy({ row })
                }
              }
              if (R.isNil(row.cloudpolicies) || R.isEmpty(row.cloudpolicies)) return this.$t('common_324')
              const hasData = row.feCloudpolicies && row.feCloudpolicies.length > 0
              const columns = getNameDescPopoverColumns({
                nameTitle: this.$t('common.name'),
                descTitle: this.$t('table.title.desc'),
                rows: row.feCloudpolicies || [],
              })
              const h = this.$createElement
              const content = hasData
                ? h('table-lite-grid', {
                  props: {
                    showOverflow: 'title',
                    rowConfig: { isHover: true },
                    columnConfig: { resizable: false },
                    data: row.feCloudpolicies,
                    columns,
                  },
                })
                : h('data-loading')
              return [h('a-popover', {
                props: {
                  trigger: 'hover',
                  placement: row._listPopoverPlacement || 'bottom',
                  autoAdjustOverflow: true,
                },
                on: { openChange: handleVisibleChange },
                key: `popover-${row.id}-${row.feCloudpolicies ? row.feCloudpolicies.length : 0}`,
                scopedSlots: {
                  content: () => h('div', {
                    class: 'list-body-cell-popover-container',
                    style: hasData
                      ? getListBodyCellPopoverContentStyle({
                        maxHeight: row._listPopoverMaxHeight || LIST_BODY_CELL_POPOVER_STYLE.maxHeight,
                      })
                      : {},
                  }, [content]),
                },
              }, [
                h('span', {
                  style: { color: 'var(--antd-wave-shadow-color)' },
                  on: {
                    mouseenter: (e) => {
                      const layout = resolveListBodyCellPopoverLayout(e.currentTarget)
                      this.$set(row, '_listPopoverPlacement', layout.placement)
                      this.$set(row, '_listPopoverMaxHeight', layout.maxHeight)
                    },
                  },
                }, this.$t('common_323', [row.cloudpolicies.length])),
              ])]
            },
          },
        },
      ],
    }
  },
  created () {
    this.list.fetchData()
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
</script>
