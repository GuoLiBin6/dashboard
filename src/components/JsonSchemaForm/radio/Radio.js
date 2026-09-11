import FormMixin from '../mixins'

const Radio = {
  name: 'JRadio',
  mixins: [FormMixin],
  model: {
    prop: 'value',
    event: 'change.value',
  },
  props: {
    value: [Boolean, String],
  },
  render (h) {
    const { definition, value } = this
    const { options } = definition.input || {}

    if (options && options.length) {
      return h('a-radio-group', {
        props: {
          options,
          value,
        },
        on: {
          change: this.onChange,
        },
      })
    } else {
      return h('a-radio', {
        props: {
          ...this.$props,
          checked: value,
        },
        on: {
          change: this.onChange,
        },
      }, [definition.formItem.label])
    }
  },
  methods: {
    onChange (e) {
      const target = e.target
      const value = target.value || target.checked
      // this.stateValue = value
      this.$emit('change', value)
    },
  },
}

export default Radio
