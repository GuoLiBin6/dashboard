import _ from 'lodash'
import FormMixin from '../mixins'

function normalizeControlValue (e) {
  if (e && typeof e === 'object' && 'target' in e && e.target) {
    const t = e.target
    if (t.type === 'checkbox') return t.checked
    return t.value
  }
  return e
}

const Control = {
  name: 'JControl',
  mixins: [FormMixin],
  computed: {
    groupProps () {
      const { definition } = this
      const component = definition.type
      const groupProps = {
        props: { ...definition.formItem },
      }
      if (component === 'j-fieldset') {
        groupProps.props.labelCol = { span: 24 }
        groupProps.props.wrapperCol = { span: 24 }
      }
      return groupProps
    },
    fieldRules () {
      const field = this.definition.field
      if (!field || !field[0] || !field[0].rules) return undefined
      const trigger = field[0].validateTrigger
      if (!trigger) return field[0].rules
      return field[0].rules.map(rule => ({ ...rule, trigger }))
    },
  },
  render (h) {
    const { path, definition } = this
    let component = definition.type
    const componentType = _.get(definition, 'schema.componentType')
    if (componentType) {
      component = `J${componentType}`
    }
    const namePath = this.getNamePath(path)
    const id = this.getDecoratorId(path)
    const value = this.getModelValue(path)
    const fieldOpts = (definition.field && definition.field[0]) || {}
    const valuePropName = fieldOpts.valuePropName || 'value'

    const inputProps = {
      props: {
        ...definition.input,
        path: this.getPath(path),
        id,
        [valuePropName]: value,
      },
      attrs: {
        id,
      },
      on: {},
    }

    if (definition.field) {
      const pathUrl = path.join('.')
      if (pathUrl === 'virtualMachine.ansiblePlaybook.telegraf.influxdbName') {
        if (inputProps.props && inputProps.props.schema && !inputProps.props.schema.default) {
          inputProps.props.schema.default = 'telegraf'
        }
      }
      if (pathUrl === 'virtualMachine.ansiblePlaybook.telegraf.influxdbUrl') {
        if (inputProps.props && inputProps.props.schema && !inputProps.props.schema.default && this.influxdbUrl) {
          inputProps.props.schema.default = this.influxdbUrl
        }
      }

      const onValue = (raw) => {
        let next = normalizeControlValue(raw)
        if (typeof fieldOpts.normalize === 'function') {
          next = fieldOpts.normalize(next, value)
        }
        this.setModelValue(path, next)
      }
      inputProps.on.change = onValue
      inputProps.on[`update:${valuePropName}`] = onValue
      if (valuePropName === 'value') {
        inputProps.on.input = onValue
      }

      return h('a-form-model-item', {
        props: {
          ...this.groupProps.props,
          prop: namePath,
          rules: this.fieldRules,
        },
      }, [
        h(component, inputProps),
      ])
    } else {
      if (definition.formItem && definition.formItem.label) {
        if (component === 'j-fieldset') {
          return h('a-card', { class: 'mb-2' }, [
            h('a-form-model-item', { props: this.groupProps.props }, [
              h(component, inputProps),
            ]),
          ])
        }
        return h('a-form-model-item', { props: this.groupProps.props }, [
          h(component, inputProps),
        ])
      } else {
        return h(component, inputProps)
      }
    }
  },
}

export default Control
