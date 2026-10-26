<template>
  <div>
    <template v-if="isInternal">
      <a-alert type="warning" class="mb-2" :message="$t('storage.internal_bucket_file')" />
      <data-empty />
    </template>
    <page-list
      v-else
      :list="list"
      :columns="columns"
      :group-actions="groupActions"
      :single-actions="singleActions"
      default-search-key="prefix"
      :placeholder="$t('storage.bucket_object_search_placeholder')">
      <template #table-prepend>
        <div class="d-flex align-items-center pt-2 pb-2">
          <span><icon type="folder-open" theme="filled" style="color: rgb(245,200, 61);font-size:15px" />{{$t('storage.text_150')}}</span>
          <a-breadcrumb>
            <a-breadcrumb-item>
              <a-button style="padding:0" type="link" @click="nextPage('')">{{data.name}}</a-button>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-for="(value, key) in breadcrumbs" :key="key">
              <a-button style="padding:0" type="link" @click="nextPage(key)">{{value}}</a-button>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
      </template>
    </page-list>
  </div>
</template>

<script>
import { ACL_TYPE, FINANCE_INTERNAL } from '@Storage/constants/index.js'
import { objectsModel } from '@Storage/views/bucket/utils/controller.js'
import WindowsMixin from '@/mixins/windows'
import ListMixin from '@/mixins/list'
import { sizestrWithUnit } from '@/utils/utils'
import i18n from '@/locales'
import Icon from '@/components/Icon'
import Copy from '@/components/Copy'

const validDirName = (rule, value, callback) => {
  if (!value) {
    callback(new Error(i18n.t('storage.text_151')))
  } else if (value.startsWith('/')) {
    callback(new Error(i18n.t('storage.text_152')))
  } else if (value.includes('//')) {
    callback(new Error(i18n.t('storage.validDirName')))
  } else if (value === '..') {
    callback(new Error(i18n.t('storage.text_153')))
  } else {
    callback()
  }
}
export default {
  name: 'BucketStorageObjectList',
  mixins: [WindowsMixin, ListMixin],
  // SidePage 透传 columns/resource 时勿覆盖本地 page-list 绑定
  inheritAttrs: false,
  props: {
    id: String,
    data: {
      type: Object,
    },
  },
  data () {
    return {
      paths: [],
      prefix: '',
      nextFetchListLoading: false,
      list: this.$list.createList(this, {
        id: 'objectListForBucketStorageSidePage',
        resource: 'objects',
        getParams: this.getParams,
        ctx: [['buckets', this.data.id]],
        idKey: 'key',
        filterOptions: {
          prefix: {
            label: this.$t('storage.text_154'),
            formatter: val => {
              return `${this.prefix}${val}`
            },
          },
        },
      }),
      columns: [
        {
          field: 'name',
          title: this.$t('storage.text_154'),
          minWidth: 120,
          showOverflow: 'ellipsis',
          slots: {
            default: ({ row }) => {
              const h = this.$createElement
              const { key } = row
              if (key == null || key === '') return '-'
              // Vue3：h('icon')/'copy' 不会解析全局组件，须直接传入组件
              if (this.nextFetchListLoading && this.prefix === key) {
                return [h(Icon, { type: 'loading', spin: true })]
              }
              const rkey = key.replace(this.prefix, '')
              if (this.isDir(key)) {
                return [
                  h('div', { class: 'd-flex align-items-center' }, [
                    h(Icon, { type: 'folder-open', style: { color: 'rgb(245,200, 61)', marginRight: '4px', flexShrink: 0 } }),
                    h('a', {
                      class: 'text-truncate link-color',
                      style: { marginRight: '3px' },
                      title: rkey,
                      onClick: () => this.nextPage(key),
                    }, rkey),
                    h(Copy, { message: rkey }),
                  ]),
                ]
              }
              return [
                h('div', { class: 'd-flex align-items-center' }, [
                  h(Icon, { type: 'file', style: { marginRight: '4px', flexShrink: 0 } }),
                  h('span', { class: 'text-truncate', title: rkey }, rkey),
                  h(Copy, { message: rkey }),
                ]),
              ]
            },
          },
        },
        {
          field: 'acl',
          title: this.$t('storage.text_93'),
          width: 120,
          formatter: ({ row }) => {
            return ACL_TYPE[row.acl] || row.acl || '-'
          },
        },
        {
          field: 'size_bytes',
          title: this.$t('storage.text_155'),
          minWidth: 100,
          formatter: ({ row }) => {
            return row.size_bytes ? sizestrWithUnit(row.size_bytes, 'B', 1024) : '-'
          },
        },
        {
          field: 'storage_class',
          title: this.$t('storage.text_38'),
          width: 120,
          formatter: ({ row }) => {
            return row.storage_class || '-'
          },
        },
        {
          field: 'last_modified',
          title: this.$t('storage.text_156'),
          width: 100,
          formatter: ({ row }) => {
            return row.last_modified ? this.$moment(row.last_modified).fromNow() : '-'
          },
        },
      ],
      groupActions: [
        {
          label: this.$t('storage.text_157'),
          action: () => {
            this.createDialog('ObjectsUploadFileDialog', {
              title: this.$t('storage.text_157'),
              list: this.list,
              resId: this.resId,
              resItem: this.data,
              resName: this.resName,
              prefix: this.prefix,
            })
          },
          meta: () => {
            const isValidate = !(this.data.brand === 'Azure' && !this.prefix)
            return {
              buttonType: 'primary',
              validate: isValidate,
              tooltip: !isValidate && this.$t('storage.text_158'),
            }
          },
        },
        {
          label: this.$t('storage.text_159'),
          action: (row) => {
            this.createDialog('SmartFormDialog', {
              title: this.$t('storage.text_159'),
              data: [row],
              list: this.list,
              width: 600,
              callback: async (data) => {
                const manager = new this.$Manager(`buckets/${this.resId}/makedir`, 'v2')
                data.key = `${this.prefix}${data.key}/`
                await manager.create({ data })
                this.list.fetchData()
              },
              fields: {
                key: {
                  name: 'key',
                  rules: [
                    { required: true, message: this.$t('storage.text_151') },
                    { type: 'string', min: 1, max: 254, message: this.$t('storage.text_160'), trigger: 'blur' },
                    { validator: validDirName, trigger: 'blur' },
                  ],
                  label: this.$t('storage.text_161'),
                  placeholder: this.$t('storage.text_162'),
                  extra: (h) => {
                    return h('div', [
                      h('div', this.$t('storage.text_173')),
                      h('div', { class: 'mt-1' }, this.$t('storage.text_174')),
                      h('div', { class: 'mt-1' }, this.$t('storage.text_175')),
                      h('div', { class: 'mt-1' }, this.$t('storage.text_176')),
                    ])
                  },
                },
              },
            })
          },
        },
        {
          label: this.$t('storage.text_33'),
          actions: (row) => {
            return [
              {
                label: this.$t('storage.text_163'),
                action: () => {
                  this.createDialog('ObjectsUpdateHttpDialog', {
                    title: this.$t('storage.text_163'),
                    data: this.list.selectedItems,
                    resId: this.resId,
                    resName: this.resName,
                    columns: this.columns,
                    list: this.list,
                    refresh: () => {
                      this.nextPage(this.prefix)
                    },
                  })
                },
                meta: () => {
                  return {
                    validate: this.list.selectedItems.every(row => !this.isDir(row.key)),
                  }
                },
              },
              {
                label: this.$t('storage.text_138'),
                action: () => {
                  this.createDialog('ObjectsUpdateAclDialog', {
                    title: this.$t('storage.text_138'),
                    bucket: this.data,
                    data: this.list.selectedItems,
                    resName: this.resName,
                    columns: this.columns,
                    list: this.list,
                    refresh: this.refresh,
                  })
                },
                meta: () => {
                  return {
                    validate: this.list.selectedItems.every(row => !this.isDir(row.key)),
                  }
                },
              },
              {
                label: this.$t('storage.text_36'),
                action: () => {
                  this.createDialog('ObjectsDeleteDialog', {
                    alert: this.$t('storage.text_164'),
                    data: this.list.selectedItems,
                    columns: this.columns,
                    title: this.$t('storage.text_36'),
                    resId: this.resId,
                    list: this.list,
                    name: this.$t('storage.text_112'),
                  })
                },
              },
            ]
          },
          meta: () => {
            return {
              validate: !!this.list.selectedItems.length,
            }
          },
        },
      ],
      singleActions: [
        {
          label: this.$t('storage.text_165'),
          action: (row) => {
            objectsModel.getUrl(row, this.data.id, this.accessUrl).then((url) => {
              // url && window.open(url, '__blank')
              const a = document.createElement('a')
              document.body.appendChild(a)
              a.href = url
              a.click()
              document.body.removeChild(a)
            })
          },
          meta: row => {
            return {
              validate: !this.isDir(row.key),
            }
          },
        },
        {
          label: this.$t('storage.text_65'),
          actions: (row) => {
            return [
              {
                label: this.$t('storage.text_166'),
                action: () => {
                  // await curl = controller.getUrl(row, this.data.name)
                  this.createDialog('ObjectsCreateUrlDialog', {
                    title: this.$t('storage.text_167'),
                    data: [row],
                    resId: this.resId,
                    resName: this.resName,
                    accessUrl: this.accessUrl,
                    columns: this.columns,
                    list: this.list,
                  })
                },
                meta: () => {
                  return {
                    validate: !this.isDir(row.key),
                  }
                },
              },
              {
                label: this.$t('storage.text_138'),
                action: () => {
                  this.createDialog('ObjectsUpdateAclDialog', {
                    title: this.$t('storage.text_138'),
                    data: [row],
                    bucket: this.data,
                    resName: this.resName,
                    columns: this.columns,
                    list: this.list,
                    refresh: this.refresh,
                    name: this.isDir(row.key) ? this.$t('storage.text_168') : this.$t('storage.text_112'),
                  })
                },
                meta: () => {
                  return {
                    validate: !this.isDir(row.key),
                  }
                },
              },
              {
                label: this.$t('storage.text_163'),
                action: () => {
                  this.createDialog('ObjectsUpdateHttpDialog', {
                    title: this.$t('storage.text_163'),
                    data: [row],
                    resName: this.resName,
                    resId: this.resId,
                    columns: this.columns,
                    list: this.list,
                    refresh: () => {
                      this.nextPage(this.prefix)
                    },
                  })
                },
                meta: () => {
                  return {
                    validate: !this.isDir(row.key),
                  }
                },
              },
              {
                label: this.$t('storage.text_36'),
                action: () => {
                  this.createDialog('ObjectsDeleteDialog', {
                    alert: this.$t('storage.text_164'),
                    data: [row],
                    columns: this.columns,
                    title: this.$t('storage.text_36'),
                    resName: this.resName,
                    resId: this.resId,
                    list: this.list,
                    name: this.isDir(row.key) ? this.$t('storage.text_168') : this.$t('storage.text_112'),
                  })
                },
              },
            ]
          },
          // meta: row => {
          //   return {
          //     validate: !this.isDir(row.key),
          //   }
          // },
        },
      ],
    }
  },
  computed: {
    resId () {
      return this.data.id
    },
    resName () {
      return this.data.name
    },
    accessUrl () {
      if (this.data.access_urls && this.data.access_urls.length > 0) {
        const accessUrls = this.data.access_urls
        for (let i = 0; i < accessUrls.length; i++) {
          if (accessUrls[i].primary) {
            return accessUrls[i].url
          }
        }
        return accessUrls[0].url
      }
      return ''
    },
    breadcrumbs () {
      const _ = {}
      if (this.prefix) {
        const paths = this.prefix.split('/')
        if (paths && paths.length > 0) {
          paths.forEach((path, index) => {
            if (path === '') return false
            const k = paths.slice(0, index + 1).join('/')
            _[k + '/'] = path
          })
        }
      }
      return _
    },
    isInternal () {
      return FINANCE_INTERNAL.includes(this.data.location)
    },
  },
  created () {
    !this.isInternal && this.list.fetchData()
    this.initSidePageTab('detail')
  },
  methods: {
    isDir (key) {
      return key.endsWith('/')
    },
    async nextPage (key, index) {
      // 表示根目录，根目录不需要prefix
      this.prefix = key
      this.nextFetchListLoading = true
      try {
        // changeFilter 内部已 fetchData；再 await fetchData 会 bump _fetchGen，
        // 导致前一次结果被丢弃、后一次易被同参 cancel，列表清空后不渲染
        await this.list.resetRefresh()
      } finally {
        this.nextFetchListLoading = false
      }
    },
    getParams () {
      const _ = {}
      if (this.prefix) {
        _.prefix = this.prefix
      }
      return _
    },
  },
}
</script>
