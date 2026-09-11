<template>
  <detail
    :showDesc="false"
    :showName="false"
    :hiddenKeys="['project_domain', 'tenant', 'status', 'updated_at']"
    :onManager="onManager"
    :data="data"
    :base-info="baseInfo" />
</template>

<script>
import { isPublicTableColumn } from '@/utils/common/tableColumn'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'K8sRepoDetail',
  mixins: [WindowsMixin],
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
        {
          field: 'name',
          title: this.$t('helm.text_16'),
          slots: {
            default: ({ row }, h) => {
              return [
                h('div', { class: 'text-truncate' }, [
                  h('list-body-cell-wrap', {
                    props: {
                      copy: true,
                      row: this.data,
                      onManager: this.onManager,
                      field: 'name',
                      title: row.name,
                    },
                  }),
                ]),
              ]
            },
          },
        },
        {
          field: 'type',
          title: this.$t('helm.text_92'),
          minWidth: 80,
          formatter: ({ row }) => {
            if (row.type === 'internal') return this.$t('helm.text_14')
            if (row.type === 'external') return this.$t('helm.text_15')
            return '-'
          },
        },
        {
          field: 'release_count',
          title: this.$t('helm.text_102'),
          formatter: ({ row }) => row.release_count || '0',
        },
        {
          field: 'url',
          title: this.$t('helm.text_96'),
        },
        isPublicTableColumn(),
      ],
    }
  },
}
</script>
