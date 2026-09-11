<template>
  <page-list
    :list="list"
    :columns="columns"
    :group-actions="groupActions"
    :single-actions="singleActions" />
</template>

<script>
import { uuid } from '@/utils/utils'

export default {
  name: 'ContainerRegistry',
  props: {
    id: String,
    resId: String,
    getParams: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    return {
      list: this.$list.createList(this, {
        id: 'containerRegistryListId',
        resource: () => this.fetchData(),
        getParams: this.getParams,
        filterOptions: {
          repository_name: {
            label: this.$t('k8s.repo.image.name'),
          },
        },
      }),
      columns: [
        {
          field: 'name',
          title: this.$t('k8s.repo.image.name'),
          width: 240,
          slots: {
            default: ({ row }, h) => {
              return row.name
            },
          },
        },
        {
          field: 'version',
          title: this.$t('k8s.repo.image.tag'),
          minWidth: 220,
          slots: {
            default: ({ row }) => {
              if (this.isPreLoad && !row.tags) return [h('data-loading')]
              const len = (row.tags && row.tags.length) || 0
              if (len === 0) return this.$t('k8s.repo.image.tag_empty')
              const list = row.tags.map(v => h('a-tag', { class: 'mr-1' }, v))
              return [h('list-body-cell-popover', {
                props: {
                  text: this.$t('compute.text_619', [len]),
                  maxWidth: '400px',
                },
              }, [
                h('div', {
                  style: {
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    maxWidth: '40vw',
                  },
                }, list),
              ])]
            },
          },
        },
      ],
      groupActions: [],
    }
  },
  created () {
    this.list.fetchData()
  },
  methods: {
    async fetchTagByName (name) {
      try {
        const result = await new this.$Manager('container_registries')
          .getSpecific({
            id: this.resId,
            spec: 'image-tags',
            params: {
              $t: uuid(),
              repository: name,
            },
          })
        return Promise.resolve(result.data)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    async fetchData () {
      const response = { data: {} }
      try {
        const result = await new this.$Manager('container_registries')
          .getSpecific({
            id: this.resId,
            spec: 'images',
            params: {
              ...this.list.params,
            },
          })
        const repositories = result?.data?.repositories || []
        const repos = repositories.map((item, key) => {
          return {
            id: key,
            name: item,
            tags: [],
          }
        })
        const allPromise = repos.map(item => {
          return this.fetchTagByName(item.name)
        })
        const tagMap = await Promise.allSettled(allPromise).then((values) => {
          const tagMap = new Map()
          values.forEach(({ status, value }) => {
            if (status === 'fulfilled') {
              tagMap.set(value.name, value.tags)
            }
          })
          return Promise.resolve(tagMap)
        })
        response.data.data = repos.map(item => {
          return {
            ...item,
            tags: tagMap.get(item.name),
          }
        })
      } catch (error) {
        throw error
      }
      return response
    },
  },
}
</script>
