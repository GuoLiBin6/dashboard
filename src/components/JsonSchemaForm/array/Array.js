import _ from 'lodash'
import classNames from 'classnames'
import draggable from 'vuedraggable'
import FormMixin from '../mixins'

const List = {
  name: 'JList',
  mixins: [FormMixin],
  data () {
    return {
      id: '',
      size: 0,
      list: [],
    }
  },
  created () {
    this.id = this.getDecoratorId(this.path)
    this.syncListFromModel()

    this.$watch(() => _.get(this.formModel, this.namePath), () => {
      this.syncListFromModel()
    }, {
      deep: true,
    })
  },
  render (h) {
    const { definition, list } = this
    const classes = classNames('j-list', {
      'j-list-inline': definition.columns,
    })

    const header = this.renderHeader(h)
    const body = h(draggable, {
      class: 'j-list-body',
      props: {
        value: list,
        draggable: '.j-list-item',
      },
      on: {
        end: this.onDrop,
      },
    }, this.renderItems(h))
    const footer = this.renderFooter(h)
    return h('div', { class: classes }, [header, body, footer].filter(Boolean))
  },
  methods: {
    syncListFromModel () {
      const value = _.get(this.formModel, this.namePath)
      if (!Array.isArray(value)) return
      const len = value.length
      const list = []
      for (let i = 0; i < len; i++) {
        list.push(i)
      }
      this.size = len
      this.list = list
    },
    ensureArray () {
      let value = _.get(this.formModel, this.namePath)
      if (!Array.isArray(value)) {
        value = []
        this.setModelValue(this.path, value)
      }
      return value
    },
    revalidate () {
      const formModel = this.jsonSchemaForm && this.jsonSchemaForm.$refs && this.jsonSchemaForm.$refs.formModel
      if (!formModel) return
      this.$nextTick(() => {
        if (typeof formModel.validateField === 'function') {
          formModel.validateField(this.namePath)
        } else if (typeof formModel.validate === 'function') {
          formModel.validate().catch(() => {})
        }
      })
    },
    renderHeader (h) {
      const { columns, items } = this.definition

      if (columns && items[0].type === 'j-inline') {
        const cols = columns.map(column => {
          const classes = classNames({
            'ant-form-item-required': column.required,
          })

          return h('a-col', {
            props: {
              span: column.col,
            },
          }, [
            h('label', { class: classes }, [column.label]),
          ])
        })

        return h('a-row', { class: 'j-list-header' }, cols)
      } else {
        return null
      }
    },
    renderItems (h) {
      const { path, size } = this
      const children = []
      let idx = 0

      while (idx < size) {
        ((idx) => {
          const newPath = path.concat([idx])

          children.push(
            h('div', { class: 'j-list-item' }, [
              h('j-control', {
                props: {
                  path: this.getPath(newPath),
                },
              }),
              h('icon', {
                class: 'btn-delete',
                props: {
                  type: 'minus-circle-o',
                },
                on: {
                  click: () => this.remove(idx),
                },
              }),
            ]),
          )
        })(idx)

        idx += 1
      }

      return children
    },
    renderFooter (h) {
      return h('a-row', { class: 'j-list-footer' }, [
        h('a-col', {
          props: {
            span: 4,
            offset: 20,
          },
        }, [
          h('a-button', {
            props: {
              type: 'dashed',
            },
            style: 'width: 100%;',
            on: {
              click: this.add,
            },
          }, [
            h('icon', { props: { type: 'plus' } }),
            this.$t('common_114'),
          ]),
        ]),
      ])
    },
    add () {
      const value = this.ensureArray()
      value.push({})
      this.list.push(this.size)
      this.size += 1
      this.revalidate()
    },
    remove (idx) {
      const value = this.ensureArray()
      value.splice(idx, 1)
      this.size -= 1
      const list = []
      for (let i = 0; i < this.size; i++) {
        list.push(i)
      }
      this.list = list
      this.revalidate()
    },
    onDrop (e) {
      const { newIndex, oldIndex } = e
      const value = this.ensureArray()
      const moveItem = value.splice(oldIndex, 1)
      value.splice(newIndex, 0, moveItem[0])
      this.revalidate()
    },
  },
  components: {
    draggable,
  },
}

export default List
