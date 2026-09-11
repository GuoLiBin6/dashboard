import _ from 'lodash'
import { STORAGE_TYPES, MEDIUM_TYPES } from '@Storage/constants'
import {
  getNameDescriptionTableColumn,
  getEnabledTableColumn,
  getStatusTableColumn,
  getBrandTableColumn,
  getPublicScopeTableColumn,
  getProjectDomainTableColumn,
  getRegionTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import {
  getNameFilter,
} from '@/utils/common/tableFilter'
import { sizestr } from '@/utils/utils'
export default {
  computed: {
    resourceProps () {
      return {
        list: this.$list.createList(this, {
          id: 'VmStoragesListForChangeBlockStorageDialog',
          resource: 'storages',
          getParams: {
            host_id: this.selectedItems[0].host_id,
            filter: `id.notin(${this.selectedItemsStorageIds.join(',')})`,
          },
          filterOptions: {
            id: {
              label: this.$t('table.title.id'),
            },
            name: getNameFilter(),
          },
        }),
        columns: [
          getNameDescriptionTableColumn({
            hideField: true,
            addLock: true,
            addBackup: true,
            edit: false,
            editDesc: false,
            minWidth: 120,
            slotCallback: row => {
              return [
                this.$createElement('list-body-cell-wrap', {
                  props: {
                    field: 'name',
                    row,
                  },
                }),
              ]
            },
          }),
          getStatusTableColumn({
            statusModule: 'blockstorage',
            minWidth: 100,
          }),
          getEnabledTableColumn(),
          {
            field: 'capacity',
            title: this.$t('storage.text_177'),
            width: 180,
            slots: {
              default: ({ row }) => {
                const capacity = sizestr(row.capacity, 'M', 1024)
                const allowedBrands = ['VMware', 'OneCloud']
                const actual_capacity_used = allowedBrands.includes(row.brand) ? sizestr(row.actual_capacity_used, 'M', 1024) : '-'
                return [this.$createElement('div', {}, [
                  this.$createElement('div', {}, this.$t('storage.text_178', [actual_capacity_used])),
                  this.$createElement('div', {}, this.$t('storage.text_180', [capacity])),
                ])]
              },
            },
          },
          {
            field: 'virtual_capacity',
            title: this.$t('storage.text_43'),
            width: 180,
            slots: {
              default: ({ row }) => {
                const virtual_capacity = sizestr(row.virtual_capacity, 'M', 1024)
                const used_capacity = sizestr(row.used_capacity, 'M', 1024)
                return [this.$createElement('div', {}, [
                  this.$createElement('div', {}, this.$t('storage.text_181', [used_capacity])),
                  this.$createElement('div', {}, this.$t('storage.text_180', [virtual_capacity])),
                ])]
              },
            },
          },
          {
            field: 'storage_type',
            title: this.$t('storage.text_38'),
            width: 100,
            formatter: ({ row }) => {
              return STORAGE_TYPES[row.storage_type] || row.storage_type
            },
          },
          {
            field: 'medium_type',
            title: this.$t('storage.text_39'),
            width: 120,
            formatter: ({ row }) => {
              return MEDIUM_TYPES[row.medium_type] || row.medium_type
            },
          },
          getBrandTableColumn(),
          {
            field: 'schedtag',
            title: this.$t('storage.text_45'),
            width: 120,
            slots: {
              default: ({ row }) => {
                const tags = _.sortBy(row.schedtags, ['default', 'name'])
                if (!tags.length) {
                  return [
                    this.$createElement('div', { class: 'text-color-help' }, this.$t('storage.text_171')),
                  ]
                }
                const list = tags.map(tag => this.$createElement('a-tag', {
                  class: 'mb-2 mr-1',
                  props: { color: 'blue' },
                }, tag.name))
                return [this.$createElement('list-body-cell-popover', {
                  props: {
                    text: this.$t('compute.text_619', [tags.length]),
                    'max-width': '400px',
                  },
                }, [
                  this.$createElement('div', {
                    style: 'display: inline-flex; flex-wrap: wrap; max-width: 40vw;',
                  }, list),
                ])]
              },
            },
          },
          getPublicScopeTableColumn({ vm: this, resource: 'storages' }),
          getProjectDomainTableColumn(),
          getRegionTableColumn(),
          getTimeTableColumn(),
        ],
      }
    },
  },
  methods: {},
}
