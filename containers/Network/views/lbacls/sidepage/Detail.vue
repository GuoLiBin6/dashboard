<template>
  <detail
    :on-manager="onManager"
    :data="data"
    :base-info="baseInfo"
    :extra-info="extraInfo" />
</template>

<script>
import {
  isPublicTableColumn,
} from '@/utils/common/tableColumn'

export default {
  name: 'LbaclDetail',
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
        isPublicTableColumn(),
        {
          field: 'acl_entries',
          title: this.$t('network.text_312'),
          formatter: ({ cellValue }, h) => {
            return cellValue ? cellValue.map(item => h('div', item.cidr)) : '-'
          },
        },
      ],
      extraInfo: [],
    }
  },
}
</script>
