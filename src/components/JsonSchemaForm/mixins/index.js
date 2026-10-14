import _ from 'lodash'
import { getDefinition } from '../util/get'

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

export default {
  props: {
    path: {
      type: Array,
      default: () => {
        return []
      },
    },
    influxdbUrl: String,
  },
  computed: {
    definition () {
      const { path, formDefinition } = this
      return getDefinition(path, formDefinition.definition)
    },
    namePath () {
      return this.getNamePath(this.path)
    },
  },
  inject: [
    'formModel',
    'formDefinition',
    'influxdbUrl',
    'jsonSchemaForm',
  ],
  methods: {
    toNamePath,
    getFieldDefaultValue (key) {
      if (!key) {
        return
      }
      return _.get(this.formModel, toNamePath(key))
    },
    getPath (key) {
      if (!key) {
        return
      }

      const { path } = this
      return key.map((item, idx) => {
        return path[idx] || item
      })
    },
    getNamePath (key) {
      if (!key) {
        return []
      }
      return toNamePath(this.getPath(key))
    },
    getDecoratorId (key) {
      if (!key) {
        return
      }

      const id = this.getPath(key).join('.')

      return id.replace(/\.(\d+)(\.)?/g, '[$1]$2')
    },
    getModelValue (key) {
      return _.get(this.formModel, this.getNamePath(key || this.path))
    },
    setModelValue (key, value) {
      if (this.jsonSchemaForm && this.jsonSchemaForm.setModelValue) {
        this.jsonSchemaForm.setModelValue(this.getNamePath(key || this.path), value)
      }
    },
  },
}
