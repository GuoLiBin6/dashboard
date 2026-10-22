<template>
  <notification-base-list
    :id="id"
    :extra-list-params="extraListParams"
    :extra-columns="extraColumns"
    :extra-export-data-options="extraExportDataOptions" />
</template>

<script>
import NotificationBaseList from '@IAM/sections/NotificationBaseList'
import { getTimeTableColumn } from '@/utils/common/tableColumn'

export default {
  name: 'SecurityAlertList',
  components: {
    NotificationBaseList,
  },
  props: {
    id: String,
  },
  data () {
    return {
      extraListParams: {
        contact_type: 'webconsole',
        topic_type: 'security',
      },
      extraColumns: [
        getTimeTableColumn({
          field: 'received_at',
          title: this.$t('system.text_590'),
        }),
        {
          title: this.$t('system.text_308'),
          field: 'content',
        },
      ],
      extraExportDataOptions: [
        { label: this.$t('system.text_308'), key: 'content' },
      ],
    }
  },
}
</script>
