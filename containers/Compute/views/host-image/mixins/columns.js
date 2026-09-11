import { sizestr } from '@/utils/utils'
import SystemIcon from '@/sections/SystemIcon'
import { getStatusTableColumn, getNameDescriptionTableColumn, getProjectTableColumn, getPublicScopeTableColumn, getTimeTableColumn, getTagTableColumn, getOsArch } from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        width: 200,
        addLock: true,
        addEncrypt: true,
        onManager: this.onManager,
        hideField: true,
        formRules: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: this.$validate('imageName') },
        ],
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'image', vm: this }),
      getTagTableColumn({ onManager: this.onManager, resource: 'guestimages', columns: () => this.columns }),
      {
        field: 'child_image',
        title: i18n.t('table.title.child_image'),
        width: 150,
        slots: {
          default: ({ row }, h) => {
            if (this.isPreLoad && !row.data_images) return [h('data-loading')]
            const arr = [...(row.data_images || [])]
            if (row.root_image?.name) arr.push(row.root_image.name)
            const len = arr.length
            const list = []
            if (row.data_images && row.data_images.length > 0) {
              row.data_images.forEach(val => {
                if (val?.name) list.push(h('a-tag', { class: 'mb-2 mr-1' }, val.name))
              })
            }
            if (row.root_image?.name) {
              list.push(h('a-tag', { class: 'mb-2 mr-1' }, row.root_image.name))
            }
            return [
              h('list-body-cell-popover', {
                props: {
                  text: i18n.t('compute.text_619', [len]),
                  maxWidth: '400px',
                },
              }, [
                h('div', {
                  style: 'display: inline-flex; flex-wrap: wrap; max-width: 40vw;',
                }, list),
              ]),
            ]
          },
        },
        formatter: ({ row }) => {
          let list = []
          if (row.data_images && row.data_images.length > 0) {
            list = row.data_images.map(val => (
              val.name
            ))
          }
          if (row.root_image?.name) {
            list.push(row.root_image?.name)
          }
          return list.join(',')
        },
      },
      {
        field: 'disk_format',
        title: i18n.t('table.title.disk_format'),
        width: 100,
        slots: {
          default: ({ row }, h) => {
            if (!row.disk_format) return [h('data-loading')]
            return row.disk_format.toUpperCase()
          },
        },
        formatter: ({ row }) => {
          return (row.disk_format || '').toUpperCase()
        },
      },
      getOsArch(),
      {
        field: 'os_type',
        title: i18n.t('table.title.os'),
        width: 60,
        slots: {
          default: ({ row }) => {
            if (this.isPreLoad && !row.properties) return [this.$createElement('data-loading')]
            let name = row.properties?.os_distribution ? decodeURI(row.properties?.os_distribution) : row.properties?.os_type || ''
            if (name.includes('Windows') || name.includes('windows')) {
              name = 'Windows'
            }
            const tooltip = (row.properties?.os_version ? `${name} ${row.properties?.os_version}` : name) || i18n.t('compute.text_339')
            return [
              this.$createElement(SystemIcon, {
                props: {
                  tooltip,
                  name,
                },
              }),
            ]
          },
        },
        formatter: ({ row }) => {
          let name = row.properties?.os_distribution ? decodeURI(row.properties?.os_distribution) : row.properties?.os_type || ''
          if (name.includes('Windows') || name.includes('windows')) {
            name = 'Windows'
          }
          return name
        },
      },
      {
        field: 'size',
        title: i18n.t('table.title.image_size'),
        minWidth: 100,
        slots: {
          default: ({ row }, h) => {
            if (this.isPreLoad && row.size === undefined) return [h('data-loading')]
            return sizestr(row.size, 'B', 1024)
          },
        },
        formatter: ({ row }) => {
          return sizestr(row.size, 'B', 1024)
        },
      },
      {
        field: 'is_standard',
        title: i18n.t('table.title.image_type'),
        width: 100,
        formatter: ({ cellValue }) => {
          if (cellValue) return i18n.t('compute.text_620')
          return i18n.t('compute.text_621')
        },
      },
      getTimeTableColumn(),
      getPublicScopeTableColumn({ vm: this, resource: 'guestimages' }),
      getProjectTableColumn(),
    ]
  },
}
