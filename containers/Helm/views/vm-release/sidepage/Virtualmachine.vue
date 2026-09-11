<template>
  <table-lite-grid :data="responseData.data || []" :columns="columns" resizable />
</template>

<script>
import * as R from 'ramda'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'VmReleaseVirtualmachineSidepage',
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
                      name: 'VmInstanceSidePage',
                      id: row.externalInfo.id,
                      vm: this,
                    },
                  }, text),
                ]),
              ]
            },
          },
        },
        {
          field: 'status',
          title: this.$t('k8s.text_35'),
          width: 100,
          slots: {
            default: ({ row }, h) => {
              const warning = row.reason
              let warnTooltip = null
              if (warning && row.status === 'Invalid') {
                warnTooltip = h('a-tooltip', {
                  props: {
                    placement: 'top',
                  },
                  scopedSlots: {
                    title: () => [warning],
                  },
                }, [
                  h('div', { class: 'text-truncate' }, [
                    h('icon', {
                      props: {
                        type: 'bulb',
                        theme: 'twoTone',
                        twoToneColor: '#f5222d',
                      },
                      class: 'mr-2',
                    }),
                    h('span', this.$t('k8s.text_402')),
                  ]),
                ])
              }
              return [
                h('div', { class: 'text-truncate' }, [
                  h('status', {
                    props: {
                      status: row.status,
                      statusModule: 'vmReleaseVirtualmachine',
                    },
                  }, warnTooltip ? [warnTooltip] : []),
                ]),
              ]
            },
          },
        },
        {
          field: 'tryTimes',
          title: this.$t('helm.text_105'),
          formatter: ({ row }) => {
            if (R.is(Number, +row.tryTimes) && !Number.isNaN(+row.tryTimes)) return row.tryTimes
            return '-'
          },
        },
        {
          field: 'ips',
          title: 'IP',
          minWidth: 120,
          slots: {
            default: ({ row }, h) => {
              if (!row.externalInfo || !row.externalInfo.ips) return '-'
              return row.externalInfo.ips.map(val => h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  hideField: true,
                  message: val,
                },
              }, val))
            },
          },
        },
        {
          field: 'eip',
          title: this.$t('dictionary.eip'),
          minWidth: 120,
          slots: {
            default: ({ row }, h) => {
              if (!row.externalInfo || !row.externalInfo.eip) return '-'
              const val = row.externalInfo.eip
              return [h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  hideField: true,
                  message: val,
                },
              }, val)]
            },
          },
        },
        {
          field: 'instanceType',
          title: this.$t('helm.text_99'),
        },
      ],
    }
  },
}
</script>
