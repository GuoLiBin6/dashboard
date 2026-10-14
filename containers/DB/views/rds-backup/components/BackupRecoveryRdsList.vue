<template>
  <table-lite-grid
    :columns="tableColumn"
    :data="rdsList"
    :loading="loading"
    @radio-change="handleRdsChange"
    max-height="300"
    ref="tableRef">
    <template v-slot:empty>
      <page-list-empty :loading="loading" />
    </template>
  </table-lite-grid>
</template>
<script>
import { sizestr } from '@/utils/utils'
import PageListEmpty from '@/components/PageList/Loader'

export default {
  name: 'BackupRecoveryRdsList',
  components: {
    PageListEmpty,
  },
  props: {
    backupItem: {
      type: Object,
      default: () => ({}),
    },
    model: {
      type: Object,
      default: null,
    },
  },
  inject: {
    form: {
      default: null,
    },
  },
  data () {
    return {
      loading: false,
      rdsList: [],
    }
  },
  computed: {
    tableColumn () {
      const column = [
        { type: 'radio', width: 40 },
        { field: 'name', title: this.$t('db.text_35') },
        {
          title: this.$t('db.text_109'),
          slots: {
            default: ({ row }) => {
              return this.$t('db.text_151', [row.vcpu_count, sizestr(row.vmem_size_mb, 'M', 1024)])
            },
          },
        },
        {
          id: 'engine',
          title: this.$t('db.text_57'),
          slots: {
            default: ({ row }) => {
              return `${row.engine || ''} ${row.engine_version || ''}`
            },
          },
        },
      ]
      return column
    },
  },
  watch: {
    rdsList (newList) {
      if (newList && newList.length > 0) {
        this.$refs.tableRef.setRadioRow(newList[0])
        this.handleRdsChange({ row: newList[0] })
      }
    },
  },
  created () {
    this.fetchQueryRDSList()
  },
  methods: {
    setDbinstanceId (id) {
      if (this.model) {
        this.model.dbinstance_id = id
        return
      }
      if (this.form?.fd) {
        this.form.fd.dbinstance_id = id
      }
    },
    handleRdsChange ({ row = {} }) {
      const { id } = row
      this.setDbinstanceId(id)
    },
    async fetchQueryRDSList () {
      // eslint-disable-next-line camelcase
      const { provider, engine, cloudregion_id, engine_version } = this.backupItem
      const params = {
        scope: this.$store.getters.scope,
        limit: 0,
        status: 'running',
        provider,
        engine,
        cloudregion_id,
        engine_version,
      }
      this.loading = true
      try {
        const { data } = await new this.$Manager('dbinstances', 'v2').list({ params })
        this.rdsList = data.data.filter(item => item.id !== this.backupItem.dbinstance_id)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
