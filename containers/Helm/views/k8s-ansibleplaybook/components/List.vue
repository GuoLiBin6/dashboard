<template>
  <table-lite-grid :data="responseData.data || []" :columns="columns" resizable />
</template>

<script>
import WindowsMixin from '@/mixins/windows'
import { getStatusTableColumn } from '@/utils/common/tableColumn'

export default {
  name: 'VmReleaseAnsibleplaybookSidepage',
  mixins: [WindowsMixin],
  props: {
    responseData: {
      type: Object,
      default: () => ({ data: [] }),
    },
  },
  data () {
    return {
      columns: [
        {
          field: 'name',
          title: this.$t('helm.text_16'),
          minWidth: 100,
          slots: {
            default: ({ row }, h) => {
              const text = row.name || '-'
              return [
                h('list-body-cell-wrap', {
                  props: {
                    copy: true,
                    hideField: true,
                    field: 'name',
                    row: row,
                    message: text,
                  },
                }, [
                  h('side-page-trigger', {
                    props: {
                      name: 'K8sAnsibleplaybookSidePage',
                      id: 'test',
                      vm: this,
                      options: { output: row.externalInfo.output },
                    },
                  }, text),
                ]),
              ]
            },
          },
        },
        getStatusTableColumn({ statusModule: 'vmReleaseAnsibleplaybook', sortable: false }),
        // {
        //   field: 'vcpuCount',
        //   title: 'CPU',
        //   formatter: ({ row }) => `${row.vcpuCount} 核`,
        // },
        // {
        //   field: 'vmemSizeGB',
        //   title: '内存',
        //   formatter: ({ row }) => `${row.vmemSizeGB} GB`,
        // },
      ],
    }
  },
}
</script>
