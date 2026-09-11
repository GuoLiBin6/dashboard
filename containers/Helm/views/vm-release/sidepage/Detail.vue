<template>
  <detail
    :showDesc="false"
    :showName="false"
    :hiddenKeys="['updated_at']"
    :onManager="onManager"
    :data="data"
    :base-info="baseInfo" />
</template>

<script>
import { k8sStatusColumn } from '@K8S/utils/tableColumns'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'K8sReleaseDetail',
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
        k8sStatusColumn({ statusModule: 'release' }),
        {
          field: 'metadata',
          title: this.$t('helm.text_75'),
          formatter: ({ row }) => `${row.chart}/${row.chart_version || ''}`,
        },
      ],
    }
  },
}
</script>
