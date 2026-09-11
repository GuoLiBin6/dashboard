<template>
  <page-list
    :hideRowselect="true"
    :list="list"
    :columns="columns"
    :group-actions="groupActions"
    :single-actions="singleActions" />
</template>

<script>
import * as R from 'ramda'
import WindowsMixin from '@/mixins/windows'
import ListMixin from '@/mixins/list'
import {
  getStatusTableColumn,
  getBrandTableColumn,
  getProjectTableColumn,
  getRegionTableColumn,
} from '@/utils/common/tableColumn'
import {
  getNameFilter,
  getStatusFilter,
  getBrandFilter,
  getTenantFilter,
  getDomainFilter,
  getRegionFilter,
} from '@/utils/common/tableFilter'

export default {
  name: 'NetworkListForRouteTableSidePage',
  mixins: [WindowsMixin, ListMixin],
  props: {
    resId: String,
    data: {
      type: Object,
      required: true,
    },
  },
  data () {
    const brandFilter = getBrandFilter('network_manage_brands')
    if (!R.find(R.propEq('key', 'OneCloud'))(brandFilter.items)) {
      brandFilter.items.push({ key: 'OneCloud', label: 'OneCloud' })
    }

    return {
      list: this.$list.createList(this, {
        id: 'networkListForVpcNetworkSidePage',
        resource: 'networks',
        getParams: { details: true, route_table_id: this.resId },
        filterOptions: {
          name: getNameFilter(),
          status: getStatusFilter('network'),
          ip_match: {
            label: 'IP',
          },
          brand: brandFilter,
          projects: getTenantFilter(),
          project_domains: getDomainFilter(),
          region: getRegionFilter(),
        },
      }),
      columns: [
        {
          field: 'name',
          title: this.$t('table.title.name'),
          sortable: true,
          slots: {
            default: ({ row }, h) => {
              return [
                h('side-page-trigger', {
                  props: {
                    name: 'NetworkSidePage',
                    id: row.id,
                    vm: this,
                  },
                }, [row.name]),
              ]
            },
          },
        },
        getStatusTableColumn({ statusModule: 'network' }),
        {
          field: 'ip',
          title: this.$t('network.text_213'),
          width: 180,
          slots: {
            default: ({ row }, h) => {
              return [
                h('div', this.$t('network.ip.start', [row.guest_ip_start, row.guest_ip_mask])),
                h('div', this.$t('network.ip.end', [row.guest_ip_end, row.guest_ip_mask])),
              ]
            },
          },
        },
        {
          field: 'ip6',
          title: this.$t('network.ipv6.address'),
          width: 180,
          slots: {
            default: ({ row }, h) => {
              if (!row.guest_ip6_start || !row.guest_ip6_end) {
                return '-'
              }
              return [
                h('div', this.$t('network.ip.start', [row.guest_ip6_start, row.guest_ip6_mask])),
                h('div', this.$t('network.ip.end', [row.guest_ip6_end, row.guest_ip6_mask])),
              ]
            },
          },
        },
        {
          field: 'ports',
          title: this.$t('network.text_622'),
          minWidth: 100,
          slots: {
            default: ({ row }) => {
              const h = this.$createElement
              if (this.isPreLoad && !row.ports) return [h('data-loading')]
              return [
                h('div', { class: 'text-truncate' }, this.$t('network.text_727', [row.ports])),
                h('div', { class: 'text-truncate' }, this.$t('network.text_728', [row.ports_used])),
              ]
            },
          },
        },
        getBrandTableColumn(),
        getProjectTableColumn(),
        getRegionTableColumn(),
      ],
      groupActions: [],
      singleActions: [],
    }
  },
  created () {
    this.list.fetchData()
  },
}
</script>
