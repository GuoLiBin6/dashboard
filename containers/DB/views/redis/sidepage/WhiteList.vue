<template>
  <page-list
    :columns="columns"
    :group-actions="groupActions"
    :list="list"
    :single-actions="singleActions" />
</template>

<script>
import { getStatusTableColumn, getCopyWithContentTableColumn } from '@/utils/common/tableColumn'
import WindowsMixin from '@/mixins/windows'
import expectStatus from '@/constants/expectStatus'
import { HYPERVISORS_MAP } from '@/constants'
import { getNameFilter, getStatusFilter } from '@/utils/common/tableFilter'

export default {
  name: 'RedisWhiteList',
  mixins: [WindowsMixin],
  props: {
    params: {
      type: Object,
    },
    data: {
      type: Object,
    },
  },
  data () {
    const steadyStatus = Object.values(expectStatus.redisACL).flat()
    return {
      steadyStatus,
      list: this.$list.createList(this, {
        id: 'RedisWhiteListForRedisSidePage',
        resource: 'elasticcacheacls',
        getParams: this.params,
        steadyStatus,
        filterOptions: {
          name: getNameFilter(),
          status: getStatusFilter('redisACL'),
        },
      }),
      columns: [
        getCopyWithContentTableColumn(),
        getStatusTableColumn({ statusModule: 'redisACL' }),
        {
          field: 'ip',
          title: 'IP',
          slots: {
            default: ({ row }, h) => {
              if (row.ip_list) {
                const ips = row.ip_list.split(',')
                return ips.map(ip => {
                  return h('div', [
                    h('a-tag', ip),
                  ])
                })
              }
              return ''
            },
          },
        },
      ],
      groupActions: [
        {
          label: this.$t('db.text_41'),
          permission: 'redis_elasticcacheacls_create',
          action: (obj) => {
            this.createDialog('RedisWhiteListFormDialog', {
              title: this.$t('db.text_41'),
              list: this.list,
              redisItem: this.data,
              allIPList: this.allIPList,
            })
          },
          meta: () => {
            const isHuawei = this.data.brand === 'Huawei'
            let tooltip = ''
            if (isHuawei) {
              tooltip = this.$t('db.text_321')
            } else if (this.list.total >= 4) {
              tooltip = this.$t('db.text_327')
            }
            if (this.data.brand === 'Qcloud') {
              tooltip = this.$t('db.text_355')
            }
            if ((this.data.brand === HYPERVISORS_MAP.aws.brand || this.data.brand === HYPERVISORS_MAP.azure.brand) && !tooltip) {
              tooltip = this.$t('db.text_384', [this.data.brand])
            }
            return {
              buttonType: 'primary',
              validate: !tooltip,
              tooltip: tooltip,
            }
          },
        },
      ],
      singleActions: [
        {
          label: this.$t('db.text_328'),
          permission: 'redis_elasticcacheacls_update',
          action: (obj) => {
            this.createDialog('RedisWhiteListFormDialog', {
              title: this.$t('db.text_328'),
              steadyStatus: this.steadyStatus,
              initialValues: {
                name: obj.name,
                ip_list: obj.ip_list,
              },
              allIPList: this.allIPList,
              data: [obj],
              list: this.list,
              columns: this.columns,
              redisItem: this.data,
            })
          },
          meta: () => {
            const isHuawei = this.data.brand === 'Huawei'
            return {
              validate: !isHuawei,
              tooltip: isHuawei ? this.$t('db.text_202') : null,
            }
          },
        },
        {
          label: this.$t('db.text_42'),
          permission: 'redis_elasticcacheacls_delete',
          action: (obj) => {
            this.createDialog('RedisWhiteListDeleteDialog', {
              data: [obj],
              columns: this.columns,
              title: this.$t('db.text_314'),
              list: this.list,
            })
          },
          meta: (obj) => {
            let tooltip = ''
            if (obj.name === 'default') {
              tooltip = this.$t('db.text_329')
            }
            return {
              validate: !tooltip,
              tooltip,
            }
          },
        },
      ],
    }
  },
  computed: {
    allIPList () {
      const listData = this.list && this.list.data
      if (!listData || Object.keys(listData).length === 0) return []
      const ipList = []
      Object.values(listData).forEach(({ data }) => {
        if (typeof data.ip_list === 'string' && data.ip_list.length > 0) {
          ipList.push(...data.ip_list.split(','))
        }
      })
      return ipList
    },
  },
  created () {
    this.list.fetchData()
  },
}
</script>
