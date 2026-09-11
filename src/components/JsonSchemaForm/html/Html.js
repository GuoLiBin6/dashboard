import FormMixin from '../mixins'

export default {
  name: 'JHtml',
  mixins: [FormMixin],
  render (h) {
    const { html } = this.definition.input

    return h('div', {
      domProps: {
        innerHTML: html,
      },
    })
  },
}
