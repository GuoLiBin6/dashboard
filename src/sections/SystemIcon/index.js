export default {
  name: 'SystemIcon',
  props: {
    tooltip: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  render (h) {
    return h('span', {
      attrs: { title: this.tooltip },
    }, [
      h('image-icon', {
        props: { image: this.name },
      }),
    ])
  },
}
