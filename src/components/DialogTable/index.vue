<template>
  <div class="mb-2">
    <table-lite-grid
      ref="grid"
      :show-overflow="showOverflow ? false : 'title'"
      :row-config="{ isHover: true, keyField: idKey }"
      :column-config="{ resizable: true }"
      :data="cData"
      :expand-config="expandConfig"
      :columns="tableColumns"
      :max-height="280"
      :loading="cLoading"
      :row-key="idKey"
      v-on="vxeGridEvents || {}"
      v-bind="vxeGridProps || {}" />
  </div>
</template>

<script>
import { Manager } from '@/utils/manager'
import { wrapVxeColumnSlots } from '@/utils/common/tableColumn'
import legacyH from '@/utils/legacyCreateElement'

export default {
  name: 'DialogTable',
  props: {
    idKey: {
      type: String,
      default: 'id',
    },
    data: {
      type: Array,
      required: true,
      default: () => ([]),
    },
    columns: {
      type: Array,
      required: true,
      default: () => ([]),
    },
    expandConfig: {
      type: Object,
      required: false,
    },
    errors: {
      type: Object,
    },
    vxeGridProps: {
      type: Object,
      required: false,
    },
    vxeGridEvents: {
      type: Object,
      required: false,
    },
    resource: {
      type: String,
    },
    apiVersion: {
      type: String,
      default: 'v2',
    },
    params: {
      type: Object,
      default () {
        return {}
      },
    },
    showOverflow: Boolean,
  },
  data () {
    return {
      cData: this.data,
      cLoading: false,
    }
  },
  computed: {
    tableColumns () {
      let cols = (this.columns || []).map(v => ({ ...v, visible: true }))
      if (this.errors) {
        cols = cols.concat([{
          field: '_result',
          title: this.$t('table.title.exec_result'),
          width: 100,
          slots: {
            default: ({ row }, h) => {
              if (this.errors[row[this.idKey]]) {
                return [
                  h('a-tooltip', {
                    attrs: { title: this.errors[row[this.idKey]].detail },
                  }, [
                    h('icon', {
                      class: 'error-color',
                      attrs: { type: 'close-circle' },
                      style: { fontSize: '14px' },
                    }),
                  ]),
                ]
              }
              return [
                h('a-tooltip', {
                  attrs: { title: this.$t('message.exec_success') },
                }, [
                  h('icon', {
                    class: 'success-color',
                    attrs: { type: 'check-circle' },
                    style: { fontSize: '14px' },
                  }),
                ]),
              ]
            },
          },
        }])
      }
      return wrapVxeColumnSlots(cols, legacyH)
    },
  },
  watch: {
    errors (val) {
      this.$nextTick(() => {
        if (val) {
          const firstErrorId = Object.keys(val)[0]
          if (firstErrorId && this.$refs.grid) {
            const row = this.$refs.grid.getRowById(firstErrorId)
            if (row) this.$refs.grid.scrollToRow(row)
          }
        }
      })
    },
    data: {
      handler (v) {
        if (v) {
          this.cData = v
        }
      },
    },
    resource: {
      handler (v) {
        if (v) {
          this.fetchResourceData(v)
        }
      },
      immediate: true,
    },
  },
  methods: {
    fetchResourceData (res, queryParams) {
      const resManager = new Manager(this.resource, this.apiVersion)
      this.cLoading = true
      resManager.list({ params: { ...this.params } }).then((res) => {
        this.cLoading = false
        this.cData = res.data.data || []
      }).catch((err) => {
        this.cLoading = false
        console.log(err)
        throw err
      })
    },
  },
}
</script>
