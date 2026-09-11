import FormMixin from '../mixins'

const Checkbox = {
  name: 'JCheckbox',
  mixins: [FormMixin],
  model: {
    prop: 'value',
    event: 'change.value',
  },
  props: {
    value: Boolean,
  },
  render (h) {
    const { definition, value } = this

    return h('a-checkbox', {
      props: {
        ...this.$props,
        checked: value,
      },
      on: {
        change: this.onChange,
      },
    }, [definition.formItem.label])
  },
  methods: {
    onChange (e) {
      this.$emit('change', e.target.checked)
    },
  },
}

export default Checkbox
