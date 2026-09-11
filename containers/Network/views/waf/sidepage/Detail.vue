<template>
  <detail
    :data="data"
    :onManager="onManager"
    :base-info="baseInfo"
    :extra-info="extraInfo"
    status-module="waf" />
</template>

<script>
import _ from 'lodash'
import i18n from '@/locales'
import WindowsMixin from '@/mixins/windows'
import {
  getBrandTableColumn,
  getRegionTableColumn,
} from '@/utils/common/tableColumn'

import {
  getUserTagColumn,
  getExtTagColumn,
} from '@/utils/common/detailColumn'

export default {
  name: 'WafInstanceDetail',
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
        getUserTagColumn({ onManager: this.onManager, resource: 'waf_instance', columns: () => this.columns, tipName: this.$t('network.waf') }),
        getExtTagColumn({ onManager: this.onManager, resource: 'waf_instance', columns: () => this.columns, tipName: this.$t('network.waf') }),
        {
          field: 'type',
          title: i18n.t('network.waf.type'),
          slots: {
            default: ({ row }, h) => {
              const ret = []
              const type = this.$getI18n(`network.waf.type.${row.type}`, row.type)
              ret.push(h('div', type))
              if (row.brand === 'Qcloud') {
                ret.push(h('list-body-cell-wrap', {
                  props: {
                    hideField: true,
                    copy: true,
                    field: 'cname',
                    row: row,
                  },
                }, [h('span', { class: 'text-weak' }, row.cname)]))
              }
              return ret
            },
          },
        },
        {
          field: 'action',
          title: i18n.t('network.waf.action_default'),
          formatter: ({ row }) => {
            const action = _.get(row, ['action', 'action']) || _.get(this.data, 'default_action.action')
            if (action) return i18n.t(`network.waf.rule_action_${action}`)
            return '-'
          },
        },
        getBrandTableColumn(),
        getRegionTableColumn(),
        {
          title: i18n.t('network.text_196'),
          field: 'account',
          slots: {
            default: ({ row }, h) => {
              return h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: 'account',
                  row: row,
                },
              }, [h('side-page-trigger', {
                props: {
                  permission: 'cloudaccounts_get',
                  name: 'CloudaccountSidePage',
                  id: row.account_id,
                  vm: this,
                },
              }, row.account)])
            },
          },
        },
        {
          title: i18n.t('network.waf.manager'),
          field: 'manager',
          slots: {
            default: ({ row }, h) => {
              return h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: 'manager',
                  row: row,
                },
              }, [h('side-page-trigger', {
                props: {
                  permission: 'cloudproviders_get',
                  name: 'CloudproviderSidePage',
                  id: row.manager_id,
                  vm: this,
                },
              }, row.account)])
            },
          },
        },
      ],
      extraInfo: [
        {
          title: this.$t('network.domain_info'),
          items: [
            {
              field: 'port',
              title: this.$t('network.protocol_port'),
              slots: {
                default: ({ row }, h) => {
                  const ret = []
                  if (row.http_ports && row.http_ports.length) {
                    ret.push(h('div', { class: 'mb-2' }, [h('a-tag', { attrs: { color: 'blue' } }, `HTTP: ${row.http_ports.join('、')}`)]))
                  }
                  if (row.https_ports && row.https_ports.length) {
                    ret.push(h('div', [h('a-tag', { attrs: { color: 'blue' } }, `HTTPS: ${row.https_ports.join('、')}`)]))
                  }
                  return ret.length ? ret : '-'
                },
              },
            },
            {
              field: 'source_ips',
              title: this.$t('network.source_ips'),
              slots: {
                default: ({ row }, h) => {
                  if (row.source_ips && row.source_ips.length) {
                    const ret = []
                    row.source_ips.map(item => {
                      ret.push(h('list-body-cell-wrap', {
                        props: {
                          hideField: true,
                          copy: true,
                          field: 'ip',
                          row: { ip: item },
                        },
                      }, [h('span', item)]))
                    })
                    return ret
                  }
                  return '-'
                },
              },
            },
            {
              field: 'upstream_scheme',
              title: this.$t('network.upstream_scheme'),
              formatter: ({ row }) => {
                return row.upstream_scheme || '-'
              },
            },
            {
              field: 'upstream_port',
              title: this.$t('network.upstream_port'),
              formatter: ({ row }) => {
                return row.upstream_port || '-'
              },
            },
            {
              field: 'cc_list',
              title: this.$t('network.waf.source_site_address'),
              slots: {
                default: ({ row }, h) => {
                  if (row.cc_list && row.cc_list.length) {
                    const ret = []
                    row.cc_list.map(item => {
                      ret.push(h('list-body-cell-wrap', {
                        props: {
                          hideField: true,
                          copy: true,
                          field: 'ip',
                          row: { ip: item },
                        },
                      }, [h('span', item)]))
                    })
                    return ret
                  }
                  return '-'
                },
              },
            },
            {
              field: 'cert_name',
              title: this.$t('network.text_317'),
              formatter: ({ row }) => {
                return row.cert_name || '-'
              },
            },
            {
              field: 'cert_id',
              title: this.$t('network.cert_id'),
              formatter: ({ row }) => {
                return row.cert_id || '-'
              },
            },
          ],
        },
      ],
    }
  },
  computed: {
  },
}
</script>
