<template>
  <page-list
    :list="list"
    :columns="columns"
    :export-data-options="exportDataOptions"
    :extraExportParams="extraListParams"
    default-search-key="topic" />
</template>

<script lang="jsx">
import {
  getCopyWithContentTableColumn,
  getTimeTableColumn,
  getStatusTableColumn,
} from '@/utils/common/tableColumn'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'NotificationBaseList',
  mixins: [WindowsMixin],
  props: {
    id: String,
    extraListParams: {
      type: Object,
    },
    extraColumns: {
      type: Array,
      required: false,
      default: () => ([]),
    },
    extraFilterOptions: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    extraExportDataOptions: {
      type: Array,
      required: false,
      default: () => ([]),
    },
  },
  data () {
    return {
      list: this.$list.createList(this, {
        id: this.id,
        resource: 'notifications',
        apiVersion: 'v1',
        getParams: this.getParam,
        filterOptions: {
          // start_time.between('2020-11-04T16:00:00Z', '2020-11-06T15:59:59Z')
          topic: {
            label: this.$t('system.text_307'),
            filter: true,
            formatter: val => {
              return `topic.contains("${val}")`
            },
          },
          priority: {
            label: this.$t('system.text_315'),
            dropdown: true,
            filter: true,
            items: Object.keys(this.$tm('notificationPriority') || {}).map(key => {
              return {
                label: this.$t(`notificationPriority.${key}`),
                key,
              }
            }),
            formatter: val => {
              return `priority.contains("${val}")`
            },
          },
          ...this.extraFilterOptions,
        },
      }),
      exportDataOptions: {
        items: [
          { label: this.$t('system.text_307'), key: 'title' },
          { label: this.$t('system.text_315'), key: 'priority' },
          { label: this.$t('system.text_316'), key: 'received_at' },
          ...this.extraExportDataOptions,
        ],
      },
      columns: [
        getCopyWithContentTableColumn({
          title: this.$t('system.text_307'),
          field: 'title',
        }),
        {
          title: this.$t('system.text_315'),
          field: 'priority',
          width: 80,
          formatter: ({ cellValue }) => {
            return this.$t(`notificationPriority.${cellValue}`)
          },
        },
        {
          title: this.$t('system.text_317'),
          field: 'receive_details',
          width: 80,
          slots: {
            default: ({ row }, h) => {
              const details = row.receive_details || []
              const n = details.length
              if (!n) return this.$t('common_701', [0])
              return [
                h('list-body-cell-popover', {
                  props: {
                    text: this.$t('common_701', [n]),
                  },
                }, [
                  h('table-lite-grid', {
                    props: {
                      size: 'mini',
                      data: details,
                      columns: [
                        getCopyWithContentTableColumn({ title: this.$t('system.text_6'), field: 'receiver_name' }),
                        getTimeTableColumn({ title: this.$t('system.text_316'), field: 'sendAt' }),
                        getStatusTableColumn({ statusModule: 'notification', sortable: false }),
                      ],
                    },
                  }),
                ]),
              ]
            },
          },
          formatter: ({ row }) => {
            const n = (row.receive_details && row.receive_details.length) || 0
            return this.$t('common_701', [n])
          },
        },
        ...this.extraColumns,
      ],
    }
  },
  created () {
    this.list.fetchData()
  },
  methods: {
    getParam () {
      const ret = {
        ...this.extraListParams,
        details: true,
      }
      return ret
    },
  },
}
</script>
