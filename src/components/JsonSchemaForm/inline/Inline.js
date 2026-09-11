import FormMixin from '../mixins'

const List = {
  name: 'JInline',
  mixins: [FormMixin],
  render (h) {
    return h('a-row', this.renderItems(h))
  },
  methods: {
    renderItems (h) {
      const { definition } = this

      return definition.items.map(item => {
        return h('a-col', {
          props: {
            span: item.col,
          },
        }, [
          h('j-control', {
            props: {
              path: this.getPath(item.key),
            },
          }),
        ])
      })
    },
  },
}

export default List
