import _ from 'lodash'
import * as R from 'ramda'
import localize from '../validate/localize'
import { parseErrors, removeEmptyValue } from '../util/util'

function toNamePath (name) {
  if (Array.isArray(name)) {
    return name.map(seg => (/^\d+$/.test(seg) ? Number(seg) : seg))
  }
  const str = String(name)
  const path = []
  const re = /([^.[\]]+)|\[([^[\]]+)\]/g
  let m
  while ((m = re.exec(str))) {
    const seg = m[1] !== undefined ? m[1] : m[2]
    path.push(/^\d+$/.test(seg) ? Number(seg) : seg)
  }
  return path.length ? path : [str]
}

function toDotPath (name) {
  return toNamePath(name).join('.')
}

function toBracketPath (name) {
  return toDotPath(name).replace(/\.(\d+)(\.|$)/g, '[$1]$2')
}

function pathSet (obj, namePath, value) {
  const path = toNamePath(namePath)
  if (!path.length) return
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    const nextKey = path[i + 1]
    const needArray = typeof nextKey === 'number'
    if (cur[key] == null || typeof cur[key] !== 'object') {
      cur[key] = needArray ? [] : {}
    }
    cur = cur[key]
  }
  cur[path[path.length - 1]] = value
}

function collectSchemaDefaults (schema, path = [], acc = {}) {
  if (!schema || typeof schema !== 'object') return acc
  if (schema.default !== undefined && path.length) {
    pathSet(acc, path, _.cloneDeep(schema.default))
  }
  if (schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      collectSchemaDefaults(schema.properties[key], path.concat(key), acc)
    })
  }
  if (schema.type === 'array' && schema.items && !Array.isArray(schema.items) && schema.default === undefined) {
    // items defaults applied when array rows exist
  } else if (schema.items && schema.properties) {
    collectSchemaDefaults(schema.items, path, acc)
  }
  return acc
}

function applyDefinitionInitialValues (definition, model) {
  ;(definition || []).forEach(def => {
    if (def.field && def.key) {
      const initial = def.field[0] && def.field[0].initialValue
      if (initial !== undefined && _.get(model, def.key) === undefined) {
        pathSet(model, def.key, _.cloneDeep(initial))
      }
    }
    if (def.items) {
      applyDefinitionInitialValues(def.items, model)
    }
  })
}

export default {
  name: 'JsonSchemaForm',
  props: {
    layout: {
      type: String,
      validator: function (value) {
        return ['horizontal', 'inline', 'vertical'].indexOf(value) !== -1
      },
    },
    prefixCls: String,
    hideRequiredMark: Boolean,
    hideAction: {
      type: Boolean,
      default: false,
    },
    hideReset: {
      type: Boolean,
      default: true,
    },
    labelCol: {
      type: Object,
      default () {
        return {
          span: 4,
          offset: 0,
        }
      },
    },
    labelAlign: {
      type: String,
      default: 'right',
    },
    wrapperCol: {
      type: Object,
      default () {
        return {
          span: 20,
          offset: 0,
        }
      },
    },
    colon: {
      type: Boolean,
      default: true,
    },
    schema: Object,
    definition: Array,
    defaultValue: [Object, Array],
    extendFd: Object,
    influxdbUrl: String,
  },
  data () {
    const model = {}
    return {
      model,
      rules: {},
      form: {
        fd: model,
        fe: {},
      },
      formDefinition: {
        definition: [],
      },
      formScopeparams: {
        scopeParams: {
          scope: this.$store.getters.scope,
        },
      },
    }
  },
  watch: {
    extendFd: {
      handler (fd) {
        if (fd && fd.domain) {
          let domain = fd.domain
          if (R.is(Object, domain) && domain.key) {
            domain = domain.key
          }
          if (this.$store.getters.isAdminMode) {
            delete this.formScopeparams.scopeParams.scope
            this.formScopeparams.scopeParams.project_domain = domain
          } else {
            this.formScopeparams.scopeParams.scope = this.$store.getters.scope
          }
        }
      },
      deep: true,
    },
  },
  provide () {
    return {
      formModel: this.model,
      formFd: this.form,
      extendFd: this.extendFd,
      formDefinition: this.formDefinition,
      defaultValue: this.defaultValue,
      scopeParams: this.formScopeparams,
      influxdbUrl: this.influxdbUrl,
      jsonSchemaForm: this,
    }
  },
  created () {
    const { schema, definition, layout, labelCol, wrapperCol, colon, labelAlign } = this
    let formItemProps = {
      colon,
    }

    if (layout !== 'vertical') {
      this.formItemProps = formItemProps = {
        ...formItemProps,
        labelCol,
        wrapperCol,
        labelAlign,
      }
    }

    this.validate = this.$validator.compile(schema)
    this.formDefinition.definition = this.$generator.parse(schema, definition, formItemProps, this.handleFieldValidate.bind(this))
    this.resetModel(this.defaultValue)

    this.$watch('schema', (schema) => {
      this.validate = this.$validator.compile(schema)
      this.formDefinition.definition = this.$generator.parse(schema, this.definition, this.formItemProps, this.handleFieldValidate.bind(this))
      this.resetModel(this.defaultValue)
    }, {
      deep: true,
    })

    this.$watch('definition', (definition) => {
      // definition 热更新（如 Helm capability 改 hypervisor options）时保留已填 model
      this.formDefinition.definition = this.$generator.parse(this.schema, definition, this.formItemProps, this.handleFieldValidate.bind(this))
    }, {
      deep: true,
    })

    this.$watch('defaultValue', (newValue) => {
      this.setValues(newValue)
    }, {
      deep: true,
    })
  },
  methods: {
    buildInitialModel (extra) {
      const next = {}
      collectSchemaDefaults(this.schema, [], next)
      applyDefinitionInitialValues(this.formDefinition.definition, next)

      // telegraf defaults (formerly field initialValue in Control)
      const telegrafName = ['virtualMachine', 'ansiblePlaybook', 'telegraf', 'influxdbName']
      const telegrafUrl = ['virtualMachine', 'ansiblePlaybook', 'telegraf', 'influxdbUrl']
      if (_.get(this.schema, 'properties.virtualMachine') && _.get(next, telegrafName) === undefined) {
        pathSet(next, telegrafName, 'telegraf')
      }
      if (_.get(this.schema, 'properties.virtualMachine') && _.get(next, telegrafUrl) === undefined && this.influxdbUrl) {
        pathSet(next, telegrafUrl, this.influxdbUrl)
      }

      if (!_.isEmpty(extra)) {
        _.merge(next, _.cloneDeep(extra))
      }
      return next
    },
    resetModel (extra) {
      const next = this.buildInitialModel(extra)
      Object.keys(this.model).forEach(key => {
        delete this.model[key]
      })
      Object.assign(this.model, next)
      this.$nextTick(() => {
        this.$refs.formModel && this.$refs.formModel.clearValidate && this.$refs.formModel.clearValidate()
      })
    },
    setValues (values) {
      if (_.isEmpty(values)) return
      _.forEach(values, (value, key) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value) &&
          this.model[key] && typeof this.model[key] === 'object' && !Array.isArray(this.model[key])) {
          this.model[key] = { ...this.model[key], ...value }
        } else {
          this.model[key] = value
        }
      })
    },
    setModelValue (namePath, value) {
      pathSet(this.model, namePath, value)
    },
    getModelValue (namePath) {
      return _.get(this.model, toNamePath(namePath))
    },
    async handleSubmit () {
      await this.$refs.formModel.validate()
      const values = _.cloneDeep(this.model)
      removeEmptyValue(values)
      return values
    },
    handleFieldValidate (rule, value, callback) {
      const { validate, schema } = this
      const model = _.cloneDeep(this.model)
      removeEmptyValue(model)

      const valid = validate(model)
      let error

      if (!valid) {
        localize(validate.errors, schema)
        const allErrors = parseErrors(validate.errors)
        const fullField = rule.fullField
        const candidates = [
          fullField,
          toDotPath(fullField),
          toBracketPath(fullField),
        ]
        error = candidates.map(c => allErrors[c]).find(Boolean)
        callback(error)
      } else {
        callback()
      }
    },
    handleClear () {
      this.resetModel(this.defaultValue)
    },
    toNamePath,
  },
  render (h) {
    const { model, rules, layout, prefixCls, hideRequiredMark, labelCol, wrapperCol, labelAlign, colon } = this
    const formProps = {
      model,
      rules,
      layout,
      prefixCls,
      hideRequiredMark,
      colon,
    }
    if (layout !== 'vertical') {
      formProps.labelCol = labelCol
      formProps.wrapperCol = wrapperCol
      formProps.labelAlign = labelAlign
    }

    return h('a-form-model', {
      ref: 'formModel',
      props: formProps,
    }, [
      h('j-fieldset'),
    ])
  },
}
