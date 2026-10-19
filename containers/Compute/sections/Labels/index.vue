<template>
  <div>
    <div class="d-flex align-items-center labels-row" v-for="(item) in labelList" :key="item.key">
      <a-form-item v-if="showProtocol && resolvedFields.protocol" :wrapperCol="{ span: 24 }" class="labels-protocol mb-0">
        <a-select
          :value="fieldVal(fieldName(item.key, 'protocol'))"
          @change="v => fieldSet(fieldName(item.key, 'protocol'), v)"
          :disabled="isLocked(item)"
          style="width: 88px">
          <a-select-option v-for="opt in protocolOptions" :key="opt.id" :value="opt.id">
            {{ opt.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :wrapperCol="{ span: 24 }">
        <a-input-group compact v-if="keyBaseSelectProps">
          <div class="d-flex">
            <a-input class="oc-addonBefore ant-input-group-addon" style="width: 80px;" :defaultValue="keyLabel" readonly />
            <base-select :value="fieldVal(fieldName(item.key, 'key'))" @change="v => fieldSet(fieldName(item.key, 'key'), v)" v-bind="getBindProps(item.key, item)" />
          </div>
        </a-input-group>
        <a-input v-else :addonBefore="keyLabel" :value="fieldVal(fieldName(item.key, 'key'))" @change="e => fieldSet(fieldName(item.key, 'key'), e.target.value)" :placeholder="keyPlaceholder" :disabled="isLocked(item)" />
      </a-form-item>
      <div class="mx-3"> = </div>
      <a-form-item :wrapperCol="{ span: 24 }">
        <a-tooltip v-if="valueTooltip" :title="valueTooltip" placement="top">
          <a-input :addonBefore="valueLabel" :value="fieldVal(fieldName(item.key, 'value'))" @change="e => fieldSet(fieldName(item.key, 'value'), e.target.value)" :placeholder="valuePlaceholder" :disabled="isLocked(item)" />
        </a-tooltip>
        <a-input v-else :addonBefore="valueLabel" :value="fieldVal(fieldName(item.key, 'value'))" @change="e => fieldSet(fieldName(item.key, 'value'), e.target.value)" :placeholder="valuePlaceholder" :disabled="isLocked(item)" />
      </a-form-item>
      <a-button v-if="(firstCanDelete || labelList.length > 1) && !isLocked(item)" shape="circle" icon="minus" size="small" @click="del(item)" class="labels-row-minus ml-2" />
    </div>
    <div class="d-flex align-items-center">
      <a-tooltip :title="disableConf?.tooltip">
        <a-button type="primary" :disabled="disableConf?.disabled" shape="circle" icon="plus" size="small" @click="add" />
        <a-button type="link" :disabled="disableConf?.disabled" @click="add">{{$t('compute.repo.add', [ title ])}}</a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { uuid } from '@/utils/utils'
import i18n from '@/locales'
import { PORT_MAPPING_FIELD_FACTORIES } from './fields'

const DEFAULT_PROTOCOL_OPTIONS = [
  { id: 'tcp', name: 'TCP' },
  { id: 'udp', name: 'UDP' },
]

/** `containerPorts[uuid]` / `containerEnvNames[0][uuid]` → nested model paths */
export function parseLabelFieldName (name) {
  if (!name || typeof name !== 'string') return null
  const m = name.match(/^([^[\]]+)((?:\[[^[\]]+\])+)$/)
  if (!m) return { root: name, path: [] }
  const root = m[1]
  const path = []
  const re = /\[([^[\]]+)\]/g
  let match
  while ((match = re.exec(m[2])) !== null) {
    path.push(match[1])
  }
  return { root, path }
}

export default {
  name: 'ContainerLables',
  props: {
    title: {
      type: String,
      default: i18n.t('compute.repo.label'),
    },
    keyLabel: {
      type: String,
      default: i18n.t('compute.repo.key'),
    },
    valueLabel: {
      type: String,
      default: i18n.t('compute.repo.value'),
    },
    /** { key: (rowKey) => 'containerPorts[uuid]', value: (rowKey) => 'hostPorts[uuid]' } */
    fields: {
      type: Object,
      default: null,
      validator: val => !val || (R.is(Function, val?.key) && R.is(Function, val?.value)),
    },
    keyRules: {
      type: Array,
      default: () => [
        { required: true, message: i18n.t('common.tips.input', [i18n.t('compute.repo.container_port')]) },
      ],
    },
    valueRules: {
      type: Array,
      default: () => [],
    },
    keyPlaceholder: {
      type: String,
      default: '',
    },
    valuePlaceholder: {
      type: String,
      default: '',
    },
    valueTooltip: {
      type: String,
      default: '',
    },
    keyBaseSelectProps: {
      type: Object,
    },
    firstCanDelete: {
      type: Boolean,
      default: true,
    },
    checkedValues: {
      type: Array,
      default: () => [],
    },
    disableConf: {
      type: Object,
      default: () => { },
    },
    initPairs: {
      type: Array,
      default: () => [],
    },
    readonlyKeys: {
      type: Array,
      default: () => [],
    },
    model: {
      type: Object,
      required: true,
    },
    showProtocol: {
      type: Boolean,
      default: false,
    },
    protocolOptions: {
      type: Array,
      default: () => DEFAULT_PROTOCOL_OPTIONS,
    },
  },
  data () {
    return {
      labelList: [],
      pendingPairs: [],
      rowEnvKey: {},
    }
  },
  inject: {
    form: {
      default: null,
    },
  },
  computed: {
    resolvedFields () {
      return this.fields || PORT_MAPPING_FIELD_FACTORIES
    },
  },
  watch: {
    labelList: {
      handler (val) {
        this.$emit('label-change', val)
      },
      deep: true,
    },
    initPairs: {
      handler (val) {
        if (Array.isArray(val) && val.length) {
          this.initData(val)
        }
      },
      immediate: true,
    },
    'keyBaseSelectProps.options': {
      immediate: true,
      handler () {
        if (!this.pendingPairs.length || !this.keyBaseSelectProps?.options?.length) return
        this.writePendingPairs()
      },
      deep: true,
    },
  },
  methods: {
    fieldName (rowKey, type) {
      return this.resolvedFields[type]?.(rowKey)
    },
    ensureNested (root, path) {
      const m = this.model
      if (!m || !root) return
      if (!m[root] || typeof m[root] !== 'object') {
        this.$set(m, root, {})
      }
      let cur = m[root]
      for (let i = 0; i < path.length - 1; i++) {
        const p = path[i]
        if (!cur[p] || typeof cur[p] !== 'object') {
          this.$set(cur, p, {})
        }
        cur = cur[p]
      }
    },
    getNested (root, path) {
      const m = this.model
      if (!m || !root) return undefined
      let cur = m[root]
      for (const p of path) {
        if (cur == null || typeof cur !== 'object') return undefined
        cur = cur[p]
      }
      return cur
    },
    setNested (root, path, value) {
      const m = this.model
      if (!m || !root) return
      if (!path.length) {
        if (value === undefined) {
          if (Object.prototype.hasOwnProperty.call(m, root)) this.$delete(m, root)
        } else {
          this.$set(m, root, value)
        }
        return
      }
      this.ensureNested(root, path)
      let cur = m[root]
      for (let i = 0; i < path.length - 1; i++) {
        cur = cur[path[i]]
      }
      const last = path[path.length - 1]
      if (value === undefined) {
        if (Object.prototype.hasOwnProperty.call(cur, last)) this.$delete(cur, last)
      } else {
        this.$set(cur, last, value)
      }
    },
    fieldVal (name) {
      if (!name) return undefined
      const parsed = parseLabelFieldName(name)
      if (parsed?.path?.length) {
        return this.getNested(parsed.root, parsed.path)
      }
      return this.model[name]
    },
    fieldSet (name, value) {
      if (!name) return
      const parsed = parseLabelFieldName(name)
      if (parsed?.path?.length) {
        this.setNested(parsed.root, parsed.path, value)
      } else if (value === undefined) {
        if (Object.prototype.hasOwnProperty.call(this.model, name)) this.$delete(this.model, name)
      } else {
        this.$set(this.model, name, value)
      }
    },
    clearRowFields (rowKey) {
      ;['key', 'value', 'protocol'].forEach((type) => {
        const name = this.fieldName(rowKey, type)
        if (name) this.fieldSet(name, undefined)
      })
    },
    add () {
      const rowKey = uuid()
      this.labelList.push({ key: rowKey })
      // 端口协议默认 TCP，避免 Select 空值无展示
      if (this.showProtocol && this.resolvedFields.protocol) {
        this.fieldSet(this.fieldName(rowKey, 'protocol'), 'tcp')
      }
    },
    del (item) {
      const index = this.labelList.findIndex(val => val.key === item.key)
      if (index < 0) return
      this.clearRowFields(item.key)
      this.labelList.splice(index, 1)
      if (this.rowEnvKey[item.key] != null) {
        this.$delete(this.rowEnvKey, item.key)
      }
    },
    reset () {
      this.labelList.forEach((row) => this.clearRowFields(row.key))
      this.labelList = []
      this.pendingPairs = []
      this.rowEnvKey = {}
    },
    normalizePairs (pairs = []) {
      return (pairs || []).map((pair) => {
        if (!pair || typeof pair !== 'object') return null
        const key = pair.key != null ? pair.key : pair.port
        const value = pair.value != null ? pair.value : pair.host_port
        if (key == null || key === '') return null
        const protocol = (pair.protocol || 'tcp').toLowerCase()
        return { key, value, protocol }
      }).filter(Boolean)
    },
    filterPairsByKeyOptions (pairs = []) {
      if (!this.keyBaseSelectProps) return pairs
      const options = this.keyBaseSelectProps.options
      if (!Array.isArray(options) || !options.length) return []
      const ids = new Set(options.map(o => o.id ?? o.key))
      return pairs.filter(p => ids.has(p.key))
    },
    initData (pairs = []) {
      const normalized = this.filterPairsByKeyOptions(this.normalizePairs(pairs))
      if (!normalized.length) return
      this.pendingPairs = normalized
      this.labelList = normalized.map(() => ({ key: uuid() }))
      this.syncRowEnvKey()
      this.$nextTick(() => {
        this.writePendingPairs()
        this.$nextTick(() => {
          this.writePendingPairs()
        })
      })
    },
    syncRowEnvKey (pairs = this.pendingPairs) {
      const mapping = {}
      pairs.forEach((pair, i) => {
        const rowKey = this.labelList[i]?.key
        if (rowKey && pair?.key != null && pair.key !== '') {
          mapping[rowKey] = pair.key
        }
      })
      this.rowEnvKey = mapping
    },
    isLocked (item) {
      const envKey = this.rowEnvKey[item?.key]
      if (envKey == null) return false
      return (this.readonlyKeys || []).includes(envKey)
    },
    rowRules (type, rowKey) {
      const base = type === 'key' ? (this.keyRules || []) : (this.valueRules || [])
      const item = this.labelList.find(row => row.key === rowKey)
      if (!item || !this.isLocked(item)) return base
      return base.filter(rule => !rule.required)
    },
    writePendingPairs () {
      if (!this.labelList.length || !this.pendingPairs.length) return
      const pairs = this.filterPairsByKeyOptions(this.pendingPairs)
      if (pairs.length !== this.pendingPairs.length) {
        this.pendingPairs = pairs
        this.labelList = pairs.map(() => ({ key: uuid() }))
        if (!pairs.length) return
      }
      this.syncRowEnvKey(pairs)
      pairs.forEach((pair, i) => {
        const rowKey = this.labelList[i]?.key
        if (!rowKey) return
        this.fieldSet(this.fieldName(rowKey, 'key'), pair.key)
        if (pair.value != null && pair.value !== '') {
          this.fieldSet(this.fieldName(rowKey, 'value'), pair.value)
        }
        if (this.showProtocol && this.resolvedFields.protocol) {
          this.fieldSet(this.fieldName(rowKey, 'protocol'), pair.protocol || 'tcp')
        }
      })
    },
    getBindProps (key, item) {
      const { options } = this.keyBaseSelectProps
      const bindProps = {
        ...this.keyBaseSelectProps,
        options: options.filter(v => {
          if (this.checkedValues?.length) {
            return !this.checkedValues.includes(v.id)
          }
          return true
        }),
      }
      if (item && this.isLocked(item)) {
        bindProps.disabled = true
      }
      return bindProps
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          let settled = false
          const finish = (err) => {
            if (settled) return
            settled = true
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          }
          let ret
          try {
            ret = rule.validator(rule, value, finish)
          } catch (e) {
            finish(e)
            return
          }
          if (ret && typeof ret.then === 'function') {
            ret.then(() => finish()).catch(finish)
          }
          return
        }
        resolve()
      })
    },
    async validate () {
      const types = ['key', 'value']
      if (this.showProtocol && this.resolvedFields.protocol) types.push('protocol')
      for (const row of this.labelList) {
        for (const type of types) {
          const name = this.fieldName(row.key, type)
          const rules = this.rowRules(type, row.key)
          for (const rule of rules) {
            await this.runFieldRule(rule, this.fieldVal(name))
          }
        }
      }
      return true
    },
  },
}
</script>

<style lang="less" scoped>
.labels-protocol {
  margin-right: 0;
}

.labels-row {
  gap: 8px;

  :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  .mx-3 {
    margin-left: 4px !important;
    margin-right: 4px !important;
  }
}

.labels-row-minus {
  flex-shrink: 0;
  /* 与 32px 输入行垂直居中，勿用 mt-2 */
  align-self: center;
  margin-top: 0 !important;
  margin-left: 0 !important;
}
</style>
