<template>
  <detail
    :data="data"
    :on-manager="onManager"
    :base-info="baseInfo" />
</template>

<script>
import { STRATEGY_CN } from '@Cloudenv/constants/sched'
import { getEnabledTableColumn, getCopyWithContentTableColumn } from '@/utils/common/tableColumn'

export default {
  name: 'SchedpolicyDetail',
  props: {
    data: {
      type: Object,
      required: true,
    },
    onManager: {
      type: Function,
      required: true,
    },
  },
  data () {
    return {
      baseInfo: [
        getEnabledTableColumn(),
        {
          field: 'resource_type',
          title: this.$t('cloudenv.text_384'),
        },
        getCopyWithContentTableColumn({
          field: 'schedtag',
          title: this.$t('cloudenv.text_385'),
          hideField: true,
          slotCallback: (row, h) => {
            if (!row.schedtag) return '-'
            return [h('side-page-trigger', {
              on: { trigger: () => this.handleOpenSchedtagDetail(row.schedtag_id) },
            }, row.schedtag)]
          },
        }),
        {
          field: 'strategy',
          title: this.$t('cloudenv.text_413'),
          formatter: ({ row }) => STRATEGY_CN[row.strategy] || this.$t('cloudenv.text_4'),
        },
        {
          field: 'condition',
          title: this.$t('cloudenv.text_22'),
          minWidth: 70,
          showOverflow: 'title',
          slots: {
            default: ({ row }, h) => {
              return [
                h('div', { class: 'text-truncate', attrs: { title: row.condition } }, row.condition),
              ]
            },
          },
        },
      ],
    }
  },
  methods: {
    handleOpenSchedtagDetail (id) {
      this.$emit('init-side-page-tab', 'schedtag-detail')
      this.$emit('side-page-trigger-handle', this, 'SchedtagSidePage', {
        id,
        resource: 'schedtags',
        apiVersion: 'v2',
      }, {
        cancel: () => {
          this.$emit('single-refresh', this.data.id)
        },
      })
    },
  },
}
</script>
