<template>
  <labels-model ref="model" v-bind="forwardProps" @change="syncFromModel" />
</template>

<script>
import * as R from 'ramda'
import { setBracketValue } from '@/utils/bracketModel'
import LabelsModel from './model.vue'

export default {
  name: 'K8SLables',
  components: {
    LabelsModel,
  },
  inheritAttrs: false,
  props: {
    title: LabelsModel.props.title,
    keyLabel: LabelsModel.props.keyLabel,
    valueLabel: LabelsModel.props.valueLabel,
    keyPlaceholder: LabelsModel.props.keyPlaceholder,
    valuePlaceholder: LabelsModel.props.valuePlaceholder,
    keyBaseSelectProps: LabelsModel.props.keyBaseSelectProps,
    firstCanDelete: LabelsModel.props.firstCanDelete,
    fields: {
      type: Object,
      validator: val => !val || (R.is(Function, val?.key) && R.is(Function, val?.value)),
    },
    fieldMap: {
      type: Object,
      validator: val => !val || (R.is(Function, val.key) && R.is(Function, val.value)),
    },
    /** a-form-model：与 field 动态 key 对齐（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
    },
  },
  computed: {
    forwardProps () {
      const { fieldMap, fields, model, ...rest } = this.$props
      return rest
    },
  },
  mounted () {
    if (!this.$refs.model.rows.length) {
      this.$refs.model.add()
    }
    this.syncFromModel()
  },
  methods: {
    fieldName (rowId, which) {
      if (this.fields) {
        return this.fields[which](rowId)
      }
      if (!this.fieldMap) return null
      const fieldDef = this.fieldMap[which](rowId)
      return Array.isArray(fieldDef) ? fieldDef[0] : fieldDef
    },
    syncFromModel () {
      if ((!this.fields && !this.fieldMap) || !this.model) return
      const rows = this.$refs.model.rows
      const values = {}
      rows.forEach(row => {
        const keyName = this.fieldName(row._id, 'key')
        const valName = this.fieldName(row._id, 'value')
        if (!keyName || !valName) return
        values[keyName] = row.key
        values[valName] = row.value
      })
      Object.keys(values).forEach((key) => {
        setBracketValue(this, this.model, key, values[key])
      })
    },
    add () {
      this.$refs.model.add()
    },
    del (item) {
      this.$refs.model.del(item)
    },
    getPairs () {
      return this.$refs.model.getPairs()
    },
    getLabelMap () {
      return this.$refs.model.getLabelMap()
    },
    async validate () {
      return true
    },
  },
}
</script>
