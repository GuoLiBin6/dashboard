import * as R from 'ramda'

/** section 组：rules 由 *Ref.validate() 跑 field rules，不进 formRef */
export const HYBRID_FIELD_GROUPS = ['cloudregionZone', 'cloudregionVpcWire', 'ipSubnets']

function isFieldTuple (val) {
  return Array.isArray(val) && val.length >= 1 && typeof val[0] === 'string'
}

function setByPath (obj, path, value) {
  if (!path || !path.includes('.')) {
    obj[path] = value
    return
  }
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] === undefined || cur[parts[i]] === null) {
      cur[parts[i]] = {}
    }
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

function getByPath (obj, path) {
  if (!path || !path.includes('.')) return obj[path]
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj)
}

export function rulesFromFieldMap (fieldMap, skipGroups = HYBRID_FIELD_GROUPS) {
  const rules = {}
  if (!fieldMap || typeof fieldMap !== 'object') return rules
  Object.keys(fieldMap).forEach(key => {
    if (skipGroups.includes(key)) return
    const val = fieldMap[key]
    if (isFieldTuple(val)) {
      const fieldName = val[0]
      const opts = val[1] || {}
      if (opts.rules) rules[fieldName] = opts.rules
    } else if (R.is(Object, val) && !R.is(Array, val)) {
      Object.assign(rules, rulesFromFieldMap(val, skipGroups))
    }
  })
  return rules
}

export function applyFieldMapInitialValues (fd, fieldMap, skipGroups = HYBRID_FIELD_GROUPS) {
  if (!fieldMap || typeof fieldMap !== 'object') return
  Object.keys(fieldMap).forEach(key => {
    if (skipGroups.includes(key)) return
    const val = fieldMap[key]
    if (isFieldTuple(val)) {
      const fieldName = val[0]
      const opts = val[1] || {}
      if (opts.initialValue !== undefined && getByPath(fd, fieldName) === undefined) {
        setByPath(fd, fieldName, opts.initialValue)
      }
    } else if (R.is(Object, val) && !R.is(Array, val)) {
      applyFieldMapInitialValues(fd, val, skipGroups)
    }
  })
}

export function trimFormValues (values) {
  const params = {}
  R.forEachObjIndexed((value, key) => {
    if (R.is(String, value)) {
      params[key] = value.trim()
    } else {
      params[key] = value
    }
  }, values)
  return params
}
