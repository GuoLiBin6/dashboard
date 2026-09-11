import FormMixin from '../mixins'

const Fieldset = {
  name: 'JFieldset',
  mixins: [FormMixin],
  render (h) {
    return h('div', this.renderItems(h))
  },
  methods: {
    renderItems (h) {
      const { definition } = this

      return (definition.items || definition).map(item => {
        const path = this.getPath(item.key)
        const key = path.join('.')
        return h('j-control', {
          key,
          props: {
            path,
          },
        })
      })
    },
  },
}

export default Fieldset
