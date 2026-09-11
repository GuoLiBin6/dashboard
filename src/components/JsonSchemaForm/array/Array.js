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
    const id = this.id = this.getDecoratorId(this.path)
    const value = this.getFieldDefaultValue(id)

    if (value && value.length) {
      const len = value.length
      const list = []

      for (let i = 0; i < len; i++) {
        list.push(i)
      }

      this.size = len
      this.list = list
    }

    this.$watch('model', (newValue) => {
      const value = this.getFieldDefaultValue(id)

      if (value && value.length) {
        const len = value.length
        const list = []

        for (let i = 0; i < len; i++) {
          list.push(i)
        }

        this.size = len
        this.list = list
      }
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
      this.list.push(this.size)
      this.size += 1
    },
    remove (idx) {
      const { id } = this
      const value = this.form.getFieldValue(id)
      value.splice(idx, 1)

      this.form.setFieldsValue({
        [id]: value,
      })
      this.size -= 1
    },
    onDrop (e) {
      const { newIndex, oldIndex } = e
      const { id } = this
      const value = this.form.getFieldValue(id)
      const moveItem = value.splice(oldIndex, 1)
      value.splice(newIndex, 0, moveItem[0])

      this.$nextTick(() => {
        this.form.setFieldsValue({
          [id]: value,
        })
      })
    },
  },
  components: {
    draggable,
  },
}

export default List
