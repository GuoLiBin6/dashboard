<template>
  <div>
    <a-form-item :label="$t('db.text_61')" v-bind="formItemLayout">
      <a-radio-group :disabled="!!disableds.engine" :value="fieldVal(engineDec)" @change="e => { fieldSet(engineDec, e.target.value); onEngineChange(e) }">
        <a-radio-button :key="item" :value="item" v-for="item in engines">{{item}}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item :label="$t('db.text_236')" v-bind="formItemLayout">
      <a-radio-group :disabled="!!disableds.engine_version" :value="fieldVal(engineVersionDec)" @change="e => { fieldSet(engineVersionDec, e.target.value); onVersionChange(e) }">
        <a-radio-button :key="item" :value="item" v-for="item in engine_versions">{{item}}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item :label="$t('db.text_119')" v-bind="formItemLayout">
      <a-radio-group :disabled="!!disableds.local_category" :value="fieldVal(localCategoryDec)" @change="e => { fieldSet(localCategoryDec, e.target.value); onCategoryChange(e) }">
        <a-radio-button :key="item" :value="item" v-for="item in local_categorys">{{ENGINE_ARCH[item] || item}}</a-radio-button>
      </a-radio-group>
      <div style="color:#888;font-size:12px;line-height:30px">
        {{archPoints(form.fd.local_category)}}
      </div>
    </a-form-item>
     <a-form-item :label="$t('db.text_271')" v-bind="formItemLayout">
      <a-radio-group :value="fieldVal(nodeTypeDec)" @change="e => { fieldSet(nodeTypeDec, e.target.value); onNodeTypeChange(e) }">
         <a-radio-button :key="item" :value="item" v-for="item in node_types">{{NODE_TYPE[item] || item}}</a-radio-button>
      </a-radio-group>
    </a-form-item>
     <a-form-item :label="$t('db.text_272')" v-bind="formItemLayout">
      <a-radio-group :value="fieldVal(performanceTypeDec)" @change="e => fieldSet(performanceTypeDec, e.target.value)">
        <template v-for="item in performance_types">
           <a-radio-button v-if="item" :key="item" :value="item">{{PERFORMANCE_TYPE[item] || item}}</a-radio-button>
        </template>
      </a-radio-group>
    </a-form-item>
    <a-form-item :label="$t('db.text_132')" v-bind="formItemLayout" v-if="memorys && memorys.length > 0">
      <a-radio-group :value="fieldVal(memorySizeDec)" @change="e => fieldSet(memorySizeDec, e.target.value)">
        <a-radio-button v-for="size in memorys" :key="size" :value="size" v-show="(size / 1024) < max || !showMore" :disabled="getIsMemoryDisabled(size)">{{sizestr(size, 'M', 1024)}}</a-radio-button>
        <a-radio-button v-if="showMore" @click="showMore = !showMore">...</a-radio-button>
      </a-radio-group>
    </a-form-item>
  </div>
</template>
<script>
import * as R from 'ramda'
import { ENGINE_ARCH, NODE_TYPE, PERFORMANCE_TYPE } from '@DB/views/redis/constants'
import { sizestr } from '@/utils/utils'
import { resolveFieldMeta } from '@/utils/common/ant'
export default {
  name: 'SkuFilters',
  inject: {
    form: { default: null },
    redisItem: { default: null },
    getCreateFormDraftPreferred: { default: undefined },
  },
  props: {
    fieldMap: {
      type: Object,
      default: () => {
        return {}
      },
    },
    disableds: {
      type: Object,
      default: () => {
        return {
          engine: false,
          engine_version: false,
          local_category: false,
        }
      },
    },
    max: {
      type: Number,
      default: 32,
    },
  },
  data () {
    return {
      NODE_TYPE,
      ENGINE_ARCH,
      PERFORMANCE_TYPE,
      sizestr,
      engines: [],
      engine_versions: [],
      local_categorys: [],
      node_types: [],
      performance_types: [],
      memorys: [],
      formItemLayout: {
        wrapperCol: {
          lg: { span: 18 },
          xl: { span: 20 },
          xxl: { span: 21 },
        },
        labelCol: {
          lg: { span: 6 },
          xl: { span: 4 },
          xxl: { span: 3 },
        },
      },
      filterItems: {},
      showMore: false,
    }
  },
  computed: {
    boundFd () {
      return this.form?.fd || this.form
    },
    engineDec () {
      return this.fieldMap.engine || { name: 'engine', initialValue: 'redis' }
    },
    engineVersionDec () {
      return this.fieldMap.engine_version || ['engine_version']
    },
    localCategoryDec () {
      return this.fieldMap.local_category || ['local_category']
    },
    nodeTypeDec () {
      return this.fieldMap.nodeType || ['node_type']
    },
    performanceTypeDec () {
      return this.fieldMap.performance_type || { name: 'performance_type', initialValue: 'standard' }
    },
    memorySizeDec () {
      return this.fieldMap.memory_size_mb || ['memory_size_mb']
    },
  },
  watch: {
    filterItems () {
      this.getEngines()
    },
    memorys (newValue) {
      const max = Math.max.apply(null, newValue) / 1024
      this.showMore = max > this.max
    },
  },
  created () {
    ;[this.engineDec, this.engineVersionDec, this.localCategoryDec, this.nodeTypeDec, this.performanceTypeDec, this.memorySizeDec].forEach(fieldDef => {
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return
      const { name, ...opts } = meta
      if (this.boundFd && this.boundFd[name] === undefined) {
        this.$set(this.boundFd, name, opts.initialValue)
      }
    })
  },
  methods: {
    fieldName (fieldTuple) {
      return resolveFieldMeta(fieldTuple)?.name
    },
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const m = this.boundFd
      const v = m ? m[name] : undefined
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const { name, ...opts } = meta
      const m = this.boundFd
      if (!m) return
      if (m[name] === undefined && opts.initialValue !== undefined && value === undefined) {
        this.$set(m, name, opts.initialValue)
        return
      }
      this.$set(m, name, value)
    },
    ensureFieldInitials (fieldMap, keys) {
      const list = keys || Object.keys(fieldMap || {})
      list.forEach((key) => {
        const fieldDef = fieldMap[key]
        const meta = resolveFieldMeta(fieldDef)
        if (!meta) return
        const { name, ...opts } = meta
        if (this.boundFd && this.boundFd[name] === undefined && opts.initialValue !== undefined) {
          this.$set(this.boundFd, name, opts.initialValue)
        }
      })
    },

    getIsMemoryDisabled (size) {
      if (this.redisItem && this.redisItem.capacity_mb) {
        const redisMb = this.redisItem.capacity_mb
        return redisMb >= size
      }
      return false
    },
    readDraft (formField) {
      const preferred = typeof this.getCreateFormDraftPreferred === 'function'
        ? this.getCreateFormDraftPreferred()
        : null
      if (!preferred || preferred[formField] == null || preferred[formField] === '') return null
      return preferred[formField]
    },
    /** options 变化后：草稿命中则回填，否则第一项 */
    pickFromOptions (list, draftVal) {
      if (!Array.isArray(list) || !list.length) return undefined
      if (draftVal != null && draftVal !== '') {
        const hit = list.find(item => item === draftVal || String(item) === String(draftVal))
        if (hit != null) return hit
      }
      return list[0]
    },
    onEngineChange (e) {
      this.getVersion(e)
    },
    onVersionChange (e) {
      this.getArcha(e)
    },
    onCategoryChange (e) {
      this.getNodeTypes(e)
    },
    onNodeTypeChange (e) {
      this.getPerformanceTypes(e)
    },
    pickFd (keys) {
      const data = {}
      ;(keys || []).forEach((k) => { data[k] = this.form.fd[k] })
      return data
    },
    setInitValue (key, callback = () => {}) {
      const draft = this.readDraft(key)
      const value = draft != null ? draft : this.form.fd[key]
      const data = this[`${key}s`]
      let isNull = true
      let newVal = ''
      let hit = value
      if (R.type(data) === 'Object') {
        newVal = Object.keys(data)[0]
        isNull = value == null || value === '' || !data[value]
      }
      if (R.type(data) === 'Array') {
        newVal = data[0]
        hit = data.find(item => item === value || String(item) === String(value))
        isNull = value == null || value === '' || hit == null
      }
      if (!value || isNull) {
        this.$set(this.form.fd, key, newVal)
      } else {
        // options 就绪后写一次，保证 radio 回显（含数字/字符串兼容）
        const finalVal = (hit != null && R.type(data) === 'Array') ? hit : value
        this.$set(this.form.fd, key, finalVal)
      }
      this.$nextTick(() => { callback && callback() })
    },
    getEngines () {
      this.engines = R.keys(this.filterItems)
      this.setInitValue('engine', () => {
        this.getVersion()
      })
    },
    getVersion (e) {
      const target = (e && e.target) ? e.target : {}
      const engine = target.value || this.form.fd.engine
      this.engine_versions = R.keys(this.filterItems[engine])
        .sort((a, b) => a - b)
      this.setInitValue('engine_version', () => {
        this.getArcha()
      })
    },
    getArcha (e) {
      const target = (e && e.target) ? e.target : {}
      const keys = ['engine', 'engine_version']
      const data = this.pickFd(keys)
      data.engine_version = target.value || data.engine_version
      this.local_categorys = R.keys(R.pathOr({}, R.values(data), this.filterItems))
      this.setInitValue('local_category', () => {
        this.getNodeTypes()
      })
    },
    getNodeTypes (e) {
      const target = (e && e.target) ? e.target : {}
      const keys = ['engine', 'engine_version', 'local_category']
      const data = this.pickFd(keys)
      data.local_category = target.value || data.local_category
      this.node_types = R.keys(R.pathOr({}, R.values(data), this.filterItems))
      this.setInitValue('node_type', () => {
        this.getPerformanceTypes()
      })
    },
    getPerformanceTypes (e) {
      const target = (e && e.target) ? e.target : {}
      const keys = ['engine', 'engine_version', 'local_category', 'node_type']
      const data = this.pickFd(keys)
      data.node_type = target.value || data.node_type
      this.performance_types = R.pathOr([], R.values(data), this.filterItems)
      this.setInitValue('performance_type', () => {})
    },
    archPoints (type) {
      const points = {
        single: this.$t('db.text_273'),
        ha: this.$t('db.text_274'),
        proxy: this.$t('db.text_275'),
        master: this.$t('db.text_274'),
        cluster: this.$t('db.text_275'),
        rwsplit: this.$t('db.text_276'),
      }
      return points[type] || type
    },
    /** specs 拉取完成 → 内存 options 变化 → 按草稿回填 */
    applyMemoryFromOptions () {
      if (!this.memorys || !this.memorys.length) return
      let next
      if (this.redisItem && this.redisItem.capacity_mb) {
        const redisMb = this.redisItem.capacity_mb
        const index = this.memorys.findIndex((m) => m > redisMb)
        next = index > -1 ? this.memorys[index] : this.memorys[this.memorys.length - 1]
      } else {
        next = this.pickFromOptions(this.memorys, this.readDraft('memory_size_mb'))
      }
      if (next == null) return
      this.$set(this.form.fd, 'memory_size_mb', next)
    },
    async fetchSpecs (params) {
      const instanceSpecsManager = new this.$Manager('elasticcacheskus/instance-specs')
      try {
        const { data } = await instanceSpecsManager.batchGet({ params })
        this.memorys = data.mems_mb || []
        this.$nextTick(() => {
          this.applyMemoryFromOptions()
        })
      } catch (err) {
        throw err
      }
    },
    async fetchCapability (params) {
      const capabilityManager = new this.$Manager('elasticcacheskus/capability')
      params.engine = 'redis'
      try {
        const { data: { redis } } = await capabilityManager.batchGet({ params })
        // 内存等 specs options 就绪后再回填；此处只预置级联字段偏好
        const preferred = typeof this.getCreateFormDraftPreferred === 'function'
          ? this.getCreateFormDraftPreferred()
          : null
        if (preferred) {
          ;['engine', 'engine_version', 'local_category', 'node_type', 'performance_type'].forEach(k => {
            if (preferred[k] != null && preferred[k] !== '') {
              this.$set(this.form.fd, k, preferred[k])
            }
          })
        }
        this.filterItems = { redis }
      } catch (err) {
        throw err
      }
    },
  },
}
</script>
