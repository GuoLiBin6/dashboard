import _ from 'lodash'
import { STORAGE_TYPES, MEDIUM_TYPES } from '@Storage/constants/index.js'
import { sizestr } from '@/utils/utils'
import { getNameDescriptionTableColumn, getEnabledTableColumn, getStatusTableColumn, getBrandTableColumn, getPublicScopeTableColumn, getProjectDomainTableColumn, getTagTableColumn, getRegionTableColumn, getTimeTableColumn } from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        formRules: [
          { required: true, message: this.$t('storage.text_56') },
          { validator: this.$validate('blockStorageName') },
        ],
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, [row.name_cn ? `${row.name}(${row.name_cn})` : row.name])
        },
      }),
      getStatusTableColumn({ statusModule: 'blockstorage', vm: this }),
      getEnabledTableColumn(),
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'storages',
        columns: () => this.columns,
        tipName: this.$t('dictionary.blockstorage'),
        editCheck: (row) => (row.provider || '').toLowerCase() !== 'bingocloud',
      }),
      {
        field: 'capacity',
        title: this.$t('storage.text_177'),
        width: 180,
        slots: {
          default: ({ row }, h) => {
            const title = `${this.$t('common_407')}: ${sizestr(row.actual_capacity_used, 'M', 1024)}\n${this.$t('common_234')}: ${sizestr(row.capacity, 'M', 1024)}`
            return [h('UsedPercent', { props: { title, used: row.actual_capacity_used, total: row.capacity, usedFormatter: (val) => sizestr(val, 'M', 1024), totalFormatter: (val) => sizestr(val, 'M', 1024) } })]
          },
        },
        formatter: ({ row }) => {
          const title = `${this.$t('common_407')}: ${sizestr(row.actual_capacity_used, 'M', 1024)}\n${this.$t('common_234')}: ${sizestr(row.capacity, 'M', 1024)}`
          return title
        },
      },
      {
        field: 'virtual_capacity',
        title: i18n.t('storage.text_43'),
        width: 180,
        slots: {
          default: ({ row }, h) => {
            const title = `${this.$t('common_233')}: ${sizestr(row.used_capacity, 'M', 1024)}\n${this.$t('common_234')}: ${sizestr(row.virtual_capacity, 'M', 1024)}`
            return [h('UsedPercent', { props: { title, used: row.used_capacity, total: row.virtual_capacity, usedFormatter: (val) => sizestr(val, 'M', 1024), totalFormatter: (val) => sizestr(val, 'M', 1024) } })]
          },
        },
        formatter: ({ row }) => {
          const title = `${this.$t('common_233')}: ${sizestr(row.used_capacity, 'M', 1024)}\n${this.$t('common_234')}: ${sizestr(row.virtual_capacity, 'M', 1024)}`
          return title
        },
      },
      {
        field: 'storage_type',
        title: i18n.t('storage.text_38'),
        width: 100,
        formatter: ({ row }) => {
          return STORAGE_TYPES[row.storage_type] || row.storage_type
        },
      },
      {
        field: 'medium_type',
        title: i18n.t('storage.text_39'),
        width: 120,
        formatter: ({ row }) => {
          return MEDIUM_TYPES[row.medium_type] || row.medium_type
        },
      },
      getBrandTableColumn(),
      {
        field: 'schedtag',
        title: i18n.t('storage.text_45'),
        width: 120,
        slots: {
          default: ({ row }) => {
            const tags = _.sortBy(row.schedtags, ['default', 'name'])
            if (!tags.length) {
              return [
                h('div', { class: 'text-color-help' }, this.$t('storage.text_171')),
              ]
            }
            const list = tags.map(tag => h('a-tag', { class: 'mb-2 mr-1', props: { color: 'blue' } }, tag.name))
            return [h('list-body-cell-popover', {
              props: {
                text: this.$t('compute.text_619', [tags.length]),
                maxWidth: '400px',
              },
            }, [
              h('div', { style: 'display: inline-flex; flex-wrap: wrap; max-width: 40vw;' }, list),
            ])]
          },
        },
      },
      getPublicScopeTableColumn({ vm: this, resource: 'storages' }),
      getProjectDomainTableColumn(),
      getRegionTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
