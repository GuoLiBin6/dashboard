// 此文件用于解析 vue.ant.design 返回的一些数据格式
import * as R from 'ramda'
import _ from 'lodash'

/**
 * @description 将 ant.design form 的 onFieldsChange 方法的回调参数解析成 formData
 * @param {Object} changedFields { zone: { value: { key: <id>, label: ’YunionHQ‘ }, name: 'zone' } } -> { zone: { key: <id>, label: ’YunionHQ‘ } }
 */
export const resolveChangeField = changedFields => {
  let fields = {}
  R.forEachObjIndexed(obj => {
    if (obj.name) {
      fields[obj.name] = obj.value
    } else {
      fields = { ...fields, ...resolveChangeField(obj) }
    }
  }, changedFields)
  return fields
}

/**
 * @description 将 ant.design form 的 onValuesChange 方法的回调参数解析成 formData
 * @param {Object} changedFields { zone: { value: { key: <id>, label: ’YunionHQ‘ }, name: 'zone' } } -> { zone: { key: <id>, label: ’YunionHQ‘ } }
 */
export const resolveValueChangeField = changedFields => {
  const fields = {}
  R.forEachObjIndexed((obj, key) => {
    fields[key] = obj
  }, changedFields)
  return fields
}

/** 字段元数据对象上的常见键（用于区分「叶子字段」与「嵌套分组」） */
const FIELD_META_KEYS = [
  'initialValue',
  'rules',
  'label',
  'placeholder',
  'validateFirst',
  'validateTrigger',
  'valuePropName',
  'render',
  'extra',
  'name',
]

/**
 * 是否为可读字段元数据（非嵌套分组）
 * @param {*} value
 */
export function isFieldMeta (value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value === 'function') {
    return false
  }
  return FIELD_META_KEYS.some(k => Object.prototype.hasOwnProperty.call(value, k))
}

/**
 * 统一字段定义 → { name, initialValue, rules, label, ... }
 * 仅支持 object meta：{ name?, initialValue, rules, ... }（name 默认取 map 的 key）
 */
export function normalizeFieldDef (key, def) {
  if (isFieldMeta(def)) {
    return { name: def.name || key, ...def }
  }
  return { name: key }
}

/** 解析字段定义；非字段则返回 null */
export function resolveFieldMeta (fieldDef, key = '') {
  if (fieldDef == null) return null
  if (isFieldMeta(fieldDef)) {
    return normalizeFieldDef(key, fieldDef)
  }
  return null
}

/**
 * @description 从 fieldMap 抽出 initialValue 为普通对象
 * 支持嵌套分组与可读 field meta
 */
export const getInitialValue = fieldMap => {
  let initData = {}
  R.forEachObjIndexed((value, key) => {
    if (isFieldMeta(value)) {
      const meta = normalizeFieldDef(key, value)
      if (meta.initialValue !== undefined) {
        initData[meta.name] = meta.initialValue
      }
      return
    }
    if (R.is(Object, value) && !R.is(Function, value)) {
      initData = { ...getInitialValue(value), ...initData }
    }
  }, fieldMap)
  return initData
}

/**
 * @description 回填表单字段 initialValue（object meta fieldMap）
 * @param {Object} data 数据
 * @param {Object} fieldMap
 * @param {Object} dataKeyMap fieldMap key → data key，默认同名
 */
export const rollupFormData = (data, fieldMap, dataKeyMap) => {
  R.forEachObjIndexed((value, key) => {
    if (isFieldMeta(value)) {
      const k = _.get(dataKeyMap, key) || key
      if (data[k] !== undefined) {
        value.initialValue = data[k]
      }
      return
    }
    if (R.is(Object, value) && !R.is(Function, value) && !Array.isArray(value)) {
      rollupFormData(data, value, dataKeyMap)
    }
  }, fieldMap)
  return fieldMap
}
