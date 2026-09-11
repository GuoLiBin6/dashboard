<template>
  <detail
    :onManager="onManager"
    :data="data"
    :base-info="baseInfo"
    :extraInfo="extraInfo"
    :show-desc="false"
    :is-edit-name="false"
    resource="robots"
    status-module="robot" />
</template>

<script>
import {
  getStatusTableColumn,
  getEnabledTableColumn,
  getCopyWithContentTableColumn,
  getPublicScopeTableColumn,
} from '@/utils/common/tableColumn'
import {
  getTypeTableColumn,
} from '../utils/columns'

export default {
  name: 'RobotDetail',
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
        getStatusTableColumn({ statusModule: 'robot' }),
        {
          field: 'project_domain',
          title: this.$t('dictionary.domain'),
          formatter: ({ row }, h) => {
            if (!row.project_domain) return '-'
            return h('side-page-trigger', {
              props: {
                permission: 'domains_get',
                name: 'DomainSidePage',
                id: row.domain_id,
                vm: this,
              },
            }, row.project_domain)
          },
        },
        {
          field: 'tenant',
          title: this.$t('dictionary.project'),
          formatter: ({ row }, h) => {
            if (!row.tenant) return '-'
            return h('side-page-trigger', {
              props: {
                permission: 'projects_get',
                name: 'ProjectSidePage',
                id: row.tenant_id,
                vm: this,
              },
            }, row.tenant)
          },
        },
        getPublicScopeTableColumn(),
        getEnabledTableColumn(),
        getTypeTableColumn(),
        getCopyWithContentTableColumn({
          title: 'Webhook/URL',
          field: 'address',
        }),
      ],
    }
  },
  methods: {
  },
}
</script>
