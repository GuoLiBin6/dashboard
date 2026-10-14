<template>
  <div>
    <div class="d-flex" v-for="(item, i) in labelList" :key="item.key">
      <a-form-model-item :wrapperCol="{ span: 24 }">
        <a-input-group compact>
          <div class="d-flex">
            <a-input class="oc-addonBefore ant-input-group-addon" style="width: 80px;" :defaultValue="keyLabel" readonly />
            <suggest-input
              :localData="localData"
              style="width: 300px"
              :autoCompleteProps="keyAutoCompleteProps"
              :value="fieldValue(item.key, 'key')"
              @change="val => onFieldChange(item.key, 'key', val, i)" />
          </div>
        </a-input-group>
      </a-form-model-item>
      <div class="mx-3 mt-1"> = </div>
      <a-form-model-item :wrapperCol="{ span: 24 }">
        <a-input-group compact>
          <div class="d-flex">
            <a-input class="oc-addonBefore ant-input-group-addon" style="width: 80px;" :defaultValue="valueLabel" readonly />
            <suggest-input
              :search="valueSearch"
              :searchMsg="item.path"
              style="width: 300px"
              :autoCompleteProps="valueAutoCompleteProps"
              :value="fieldValue(item.key, 'value')"
              @change="val => onFieldChange(item.key, 'value', val)" />
          </div>
        </a-input-group>
      </a-form-model-item>
      <a-button v-if="firstCanDelete || labelList.length > 1" type="danger" shape="circle" icon="delete" @click="del(item)" class="mt-1 ml-3" />
    </div>
    <a-button type="primary" icon="plus" @click="add">{{$t('k8s.text_81', [ title ])}}</a-button>
  </div>
</template>

<script>
import * as R from 'ramda'
import Schema from 'async-validator'
import { uuid } from '@/utils/utils'
import i18n from '@/locales'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'K8SLabelsComplete',
  props: {
    title: {
      type: String,
      default: i18n.t('k8s.text_82'),
    },
    keyLabel: {
      type: String,
      default: i18n.t('k8s.text_83'),
    },
    valueLabel: {
      type: String,
      default: i18n.t('k8s.text_84'),
    },
    fieldMap: {
      type: Object,
      default: null,
      validator: val => !val || (R.is(Function, val.key) && R.is(Function, val.value)),
    },
    /** end-state：嵌套写 model.keys[uuid] / model.values[uuid]（必传） */
    model: {
      type: Object,
      required: true,
    },
    keyAutoCompleteProps: {
      type: Object,
      default: () => ({}),
    },
    valueAutoCompleteProps: {
      type: Object,
      default: () => ({}),
    },
    firstCanDelete: {
      type: Boolean,
      default: true,
    },
    localData: {
      type: Object,
      default: () => ({}),
    },
    valueSearch: {
      type: Function,
    },
  },
  data () {
    return {
      labelList: [],
    }
  },
  created () {
    if (!this.model.keys) this.$set(this.model, 'keys', {})
    if (!this.model.values) this.$set(this.model, 'values', {})
  },
  methods: {
    fieldDefFor (type, rowKey) {
      if (this.fieldMap?.[type]) return this.fieldMap[type](rowKey)
      return { name: rowKey }
    },
    mapKey (type) {
      return type === 'key' ? 'keys' : 'values'
    },
    fieldValue (rowKey, type) {
      const map = this.model[this.mapKey(type)] || {}
      if (map[rowKey] !== undefined) return map[rowKey]
      const fieldDef = this.fieldDefFor(type, rowKey)
      return resolveFieldMeta(fieldDef)?.initialValue
    },
    registerRow (rowKey) {
      ;['key', 'value'].forEach((type) => {
        const mapName = this.mapKey(type)
        if (!this.model[mapName]) this.$set(this.model, mapName, {})
        if (this.model[mapName][rowKey] === undefined) {
          const fieldDef = this.fieldDefFor(type, rowKey)
          this.$set(this.model[mapName], rowKey, resolveFieldMeta(fieldDef)?.initialValue)
        }
      })
    },
    onFieldChange (rowKey, type, val, index) {
      const mapName = this.mapKey(type)
      if (!this.model[mapName]) this.$set(this.model, mapName, {})
      this.$set(this.model[mapName], rowKey, val)
      if (type === 'key' && index != null && this.labelList[index]) {
        this.labelList[index].path = val
      }
    },
    add () {
      const row = { key: uuid(), path: '' }
      this.labelList.push(row)
      this.$nextTick(() => this.registerRow(row.key))
    },
    del (item) {
      const index = this.labelList.findIndex(val => val.key === item.key)
      this.labelList.splice(index, 1)
      if (this.model.keys) this.$delete(this.model.keys, item.key)
      if (this.model.values) this.$delete(this.model.values, item.key)
    },
    keyChange (value, i) {
      this.labelList[i].path = value
    },
    async validate () {
      const descriptor = {}
      const data = {}
      this.labelList.forEach((item) => {
        ;['key', 'value'].forEach((type) => {
          const fieldDef = this.fieldDefFor(type, item.key)
          const { name, ...opts } = resolveFieldMeta(fieldDef) || {}
          if (name && opts.rules?.length) {
            descriptor[name] = opts.rules
            // async-validator 扁平 path；用 bracket 名对齐 field
            data[name] = this.model[this.mapKey(type)]?.[item.key]
          }
        })
      })
      if (!Object.keys(descriptor).length) {
        for (const item of this.labelList) {
          if (!this.model.keys?.[item.key]) {
            // eslint-disable-next-line no-throw-literal
            throw { errors: [{ message: this.$t('helm.text_41') }] }
          }
          if (!this.model.values?.[item.key]) {
            // eslint-disable-next-line no-throw-literal
            throw { errors: [{ message: this.$t('helm.text_42') }] }
          }
        }
        return true
      }
      const validator = new Schema(descriptor)
      try {
        await validator.validate(data, { suppressWarning: true })
      } catch (err) {
        // eslint-disable-next-line no-throw-literal
        throw { errors: err.errors || err }
      }
      return true
    },
  },
}
</script>
