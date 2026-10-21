<template>
  <page-list
    :list="list"
    :columns="columns" />
</template>

<script>
import {
  getCopyWithContentTableColumn,
} from '@/utils/common/tableColumn'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'PolicyassignmentsList',
  mixins: [WindowsMixin],
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
        resource: 'policy_assignments',
        getParams: {
          policydefinition: this.resId,
          details: true,
        },
        filterOptions: {},
      }),
      columns: [
        getCopyWithContentTableColumn({ field: 'project_domain', title: this.$t('cloudenv.text_95') }),
      ],
    }
  },
  created () {
    this.list.fetchData()
  },
}
</script>
