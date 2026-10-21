<template>
  <page-list
    :list="list"
    :columns="columns"
    :single-actions="singleActions" />
</template>

<script>
import {
  getStatusTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import WindowsMixin from '@/mixins/windows'
import ListMixin from '@/mixins/list'

export default {
  name: 'TaskHistoryForScheduledtaskSidePage',
  mixins: [WindowsMixin, ListMixin],
  // SidePage 透传 columns/resource 时勿覆盖本地 page-list 绑定
  inheritAttrs: false,
  props: {
    resId: String,
    data: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      list: this.$list.createList(this, {
        id: this.id,
        resource: 'scheduledtaskactivities',
        apiVersion: 'v1',
        getParams: { details: true, scheduled_task: this.resId },
        filterOptions: {
          name: {
            label: this.$t('cloudenv.text_95'),
            filter: true,
            formatter: val => {
              return `name.contains("${val}")`
            },
          },
        },
      }),
      columns: [
        {
          field: 'id',
          title: 'ID',
          minWidth: '200',
        },
        getStatusTableColumn({ statusModule: 'scheduledtaskactivity' }),
        getTimeTableColumn({ title: this.$t('cloudenv.text_461') }),
        getTimeTableColumn({ field: 'end_time', title: this.$t('cloudenv.text_462') }),
      ],
      singleActions: [
        {
          label: this.$t('cloudenv.text_463'),
          action: (row) => {
            this.createDialog('EventLogDialog', {
              data: row.reason,
            })
          },
        },
      ],
    }
  },
  created () {
    this.list.fetchData()
  },
}
</script>
