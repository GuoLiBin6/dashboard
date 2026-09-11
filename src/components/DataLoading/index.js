export default {
  name: 'DataLoading',
  props: {
    tooltip: {
      type: String,
      default: '',
    },
  },
  render (h) {
    return h('span', { attrs: { title: this.tooltip } }, [
      h('icon', { props: { type: 'loading' }, spin: true }),
    ])
  },
}
