<template>
  <table-lite-grid
    border
    :resizable="true"
    :columns="tableColumns"
    :data="realTableData"
    :loading="loading"
    v-bind="$attrs" />
</template>

<script>
import { wrapVxeColumnSlots } from '@/utils/common/tableColumn'
import legacyH from '@/utils/legacyCreateElement'

/**
 * 简单表格：对外 API 不变（columns + data），底层改为 TableLiteGrid（原生 table）。
 */
export default {
  name: 'OcSimpleTable',
  inheritAttrs: false,
  props: {
    columns: {
      type: Array,
      require: true,
    },
    data: {
      type: [Array, Object],
      require: true,
    },
  },
  data () {
    return {
      tableData: [],
      loading: false,
    }
  },
  computed: {
    realTableData () {
      return this.tableData
    },
    tableColumns () {
      return wrapVxeColumnSlots(this.columns, legacyH)
    },
  },
  watch: {
    data: {
      handler () {
        this.getTableData()
      },
      deep: true,
    },
  },
  created () {
    this.getTableData()
  },
  methods: {
    async getTableData () {
      if (Array.isArray(this.data)) {
        this.tableData = this.data
        this.loading = false
        return
      }
      if (this.data && typeof this.data.then === 'function') {
        this.loading = true
        try {
          const res = await this.data
          this.tableData = (res && res.data) || res || []
        } catch (err) {
          this.tableData = []
          throw err
        } finally {
          this.loading = false
        }
        return
      }
      this.tableData = []
      this.loading = false
    },
  },
}
</script>
