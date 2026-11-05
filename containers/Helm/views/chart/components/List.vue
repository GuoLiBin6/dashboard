<template>
  <page-card-list
    :list="list"
    :single-actions="singleActions"
    :card-fields="cardFields">
    <template #group-actions-append>
      <!-- base-select 默认 width/minWidth 100%/200px，会挤扁或盖住 label；定宽 + minWidth 跟容器 -->
      <div class="d-flex align-items-center ml-3 chart-filters">
        <span class="chart-form-label">{{$t('helm.text_9')}}</span>
        <div class="chart-form-select">
          <base-select
            v-model:value="type"
            :options="typeOpts"
            isDefaultSelect
            min-width="100%"
            :select-props="{ placeholder: $t('helm.text_10') }" />
        </div>
        <span class="chart-form-label ml-3">{{$t('helm.text_11')}}</span>
        <div class="chart-form-select chart-form-select--repo">
          <base-select
            version="v1"
            v-model:value="repo"
            resource="repos"
            idKey="name"
            :params="repoParams"
            isDefaultSelect
            min-width="100%"
            :select-props="{ placeholder: $t('helm.text_10') }" />
        </div>
      </div>
    </template>
    <!-- <template #tool-actions-between>
      <a-button @click="toRepo" type="link" size="small">{{$t('helm.text_12')}}</a-button>
    </template> -->
    <template #tool-actions-append>
      <search-box :options="options" :value="searchValue" @input="search" :placeholder="$t('helm.text_13')" />
    </template>
  </page-card-list>
</template>

<script>
import * as R from 'ramda'
import { Manager } from '@/utils/manager'
import WindowsMixin from '@/mixins/windows'
import { getNameDescriptionTableColumn } from '@/utils/common/tableColumn'
import ListMixin from '@/mixins/list'

export default {
  name: 'K8SChartPageList',
  mixins: [WindowsMixin, ListMixin],
  data () {
    return {
      list: this.$list.createList(this, {
        resource: 'charts',
        apiVersion: 'v1',
        idKey: 'name',
      }),
      cardFields: {
        url: row => {
          const icon = row && row.icon
          if (!icon) return ''
          if (typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://'))) return icon
          return (this.repoUrl ? `${this.repoUrl}/` : '') + icon
        },
        title: 'name',
        desc: 'chart.description',
        description: row => {
          if (row.type === 'internal') return this.$t('helm.text_14')
          if (row.type === 'external') return this.$t('helm.text_15')
          return '-'
        },
      },
      searchValue: {},
      repo: undefined,
      repoUrl: undefined,
      type: this.$route.query.type || 'internal',
      typeOpts: [
        { key: 'internal', label: this.$t('helm.text_14') },
        { key: 'external', label: this.$t('helm.text_15') },
      ],
      options: {
        name: {
          label: this.$t('helm.text_16'),
        },
        // type: {
        //   label: '类型',
        //   multiple: true,
        //   dropdown: true,
        //   filter: true,
        //   item: [
        //     { key: 'internal', label: `${this.$t('dictionary.server')}应用` },
        //     { key: 'external', label: `${this.$t('dictionary.server')}应用` },
        //   ]
        // }
      },
      columns: [
        getNameDescriptionTableColumn({
          vm: this,
        }),
        {
          field: 'created_at',
          title: this.$t('helm.text_17'),
          formatter: ({ cellValue }) => {
            return this.$moment(cellValue).format()
          },
        },
      ],
      singleActions: [
        {
          label: this.$t('helm.text_18'),
          // permission: 'k8s_charts_create',
          action: (obj) => {
            this.$router.push({
              path: '/k8s-chart/create',
              query: {
                repo: obj.repo,
                name: obj.name,
                type: obj.type,
              },
            })
          },
          meta: () => ({
            buttonType: 'primary',
          }),
        },
      ],
    }
  },
  computed: {
    repoParams () {
      return {
        limit: 0,
        scope: this.$store.getters.scope,
        type: this.type,
      }
    },
  },
  watch: {
    type () {
      // 切换类型后仓库列表会变；清掉旧 repo，等仓库 isDefaultSelect 再拉 charts
      this.repo = undefined
      this.list.data = {}
      const params = R.clone(this.list.getParams || {})
      delete params.repo
      this.list.getParams = params
    },
    repo (val) {
      this.repoChange(val)
    },
  },
  methods: {
    repoChange (val) {
      if (!val) {
        const params = R.clone(this.list.getParams || {})
        delete params.repo
        this.list.getParams = params
        this.list.data = {}
        return
      }
      new Manager('repos', 'v1').get({
        id: val,
      }).then(res => {
        this.repoUrl = res.data && res.data.url
      }).catch(() => {
        this.repoUrl = undefined
      })
      this.list.getParams = { ...this.list.getParams, repo: val }
      this.fetchData()
    },
    fetchData () {
      this.list.data = {}
      if (!this.list.getParams || !this.list.getParams.repo) return
      this.list.fetchData()
    },
    search (val) {
      this.searchValue = val
      if (R.isEmpty(val)) {
        const params = R.clone(this.list.getParams)
        delete params.keyword
        this.list.getParams = params
        this.fetchData()
        return
      }
      this.list.getParams = { ...this.list.getParams, keyword: val.name[0] }
      this.fetchData()
    },
    toRepo () {
      this.$router.push('/k8s-repo')
    },
  },
}
</script>

<style lang="less" scoped>
.chart-filters {
  flex-shrink: 0;
  min-width: 0;
}
.chart-form-label {
  color: var(--oc-card-tile-text, rgba(0, 0, 0, 0.85));
  flex-shrink: 0;
  white-space: nowrap;
}
.chart-form-select {
  width: 160px;
  flex-shrink: 0;
  &--repo {
    width: 200px;
  }
}
</style>
