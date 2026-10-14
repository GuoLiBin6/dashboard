<template>
  <div class="d-flex">
    <a-form-item
      :wrapperCol="{ span: 24 }"
      class="mb-0 mr-1 w-50">
      <template v-if="showDocsLink()" #extra>{{ $t('common.schedtag.extra') }}，<help-link  :href="docUrl">{{ $t('common.view.doc') }}</help-link></template>
      <base-select
        class="w-100"
        :value="fieldVal(fieldMap.schedtag)"
        resource="schedtags"
        :need-params="true"
        v-model:item="schedtagItem"
        :params="schedtagParams"
        @change="schedtagChange"
        :select-props="{ allowClear: true, placeholder: $t('common_255') }" />
    </a-form-item>
    <a-form-item class="mb-0 w-50" :wrapperCol="{ span: 24 }">
      <base-select
        class="w-100"
        :value="fieldVal(fieldMap.policy)"
        :options="policyOpts"
        @change="policyChange"
        :select-props="{ allowClear: true, placeholder: $t('common_256') }" />
    </a-form-item>
  </div>
</template>

<script>
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import { SCHEDTAG_POLICY_OPTIONS } from '@/constants'
import { resolveFieldMeta } from '@/utils/common/ant'

function parseBracketName (name) {
  if (!name || typeof name !== 'string') return null
  const m = name.match(/^([^[\]]+)\[([^[\]]+)\]$/)
  if (m) return { root: m[1], key: m[2] }
  return { root: name, key: null }
}

export default {
  name: 'SchedtagPolicy',
  props: {
    /** 与 model 嵌套 map 联用 */
    itemKey: {
      type: String,
      default: '',
    },
    /** 扁平字段名（系统盘）；优先于 itemKey */
    schedtagField: {
      type: String,
      default: '',
    },
    policyField: {
      type: String,
      default: '',
    },
    schedtagRoot: {
      type: String,
      default: 'policySchedtagSchedtags',
    },
    policyRoot: {
      type: String,
      default: 'policySchedtagPolicys',
    },
    schedtagParams: {
      type: Object,
      default: () => ({}),
    },
    form: {
      type: Object,
    },
    /** a-form-model end-state：bracket 名写入嵌套 map（必传） */
    model: {
      type: Object,
      required: true,
    },
    policyReactInSchedtag: { // 策略是否与调度标签联动
      type: Boolean,
      default: () => true,
    },
  },
  data () {
    return {
      showDocsLink,
      policyOpts: SCHEDTAG_POLICY_OPTIONS,
      schedtagItem: {},
      docUrl: DOCS_MAP.schedtag(),
    }
  },
  computed: {
    fieldMap () {
      if (this.schedtagField && this.policyField) {
        return {
          schedtag: { name: this.schedtagField },
          policy: { name: this.policyField },
        }
      }
      if (this.itemKey) {
        return {
          schedtag: [`${this.schedtagRoot}[${this.itemKey}]`, {}],
          policy: [`${this.policyRoot}[${this.itemKey}]`, {}],
        }
      }
      return { schedtag: ['', {}], policy: ['', {}] }
    },
  },
  created () {
    this.initModelFields()
  },
  methods: {
    ensureMap (root) {
      if (!this.model[root] || typeof this.model[root] !== 'object') {
        this.$set(this.model, root, {})
      }
    },
    modelGet (name) {
      const parsed = parseBracketName(name)
      if (parsed?.key) return this.model[parsed.root]?.[parsed.key]
      return this.model[name]
    },
    modelSet (name, value) {
      const parsed = parseBracketName(name)
      if (parsed?.key) {
        this.ensureMap(parsed.root)
        this.$set(this.model[parsed.root], parsed.key, value)
      } else {
        this.$set(this.model, name, value)
      }
    },
    fieldVal (decoratorTuple) {
      const meta = resolveFieldMeta(decoratorTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const v = this.modelGet(name)
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (decoratorTuple, value) {
      const meta = resolveFieldMeta(decoratorTuple)
      if (!meta) return
      const { name } = meta
      if (name) this.modelSet(name, value)
    },
    initModelFields () {
      ;['schedtag', 'policy'].forEach((key) => {
        const fieldDef = this.fieldMap[key]
        const meta = resolveFieldMeta(fieldDef)
        if (!meta) return
        const { name, ...opts } = meta
        if (this.modelGet(name) === undefined && opts.initialValue !== undefined) {
          this.modelSet(name, opts.initialValue)
        }
      })
    },
    schedtagChange (val) {
      this.fieldSet(this.fieldMap.schedtag, val)
      this.$emit('change', val)
      this.$nextTick(() => {
        let defaultStrategy = this.schedtagItem.default_strategy || 'require'
        if (defaultStrategy) {
          if (!this.policyOpts.find(v => v.key === defaultStrategy)) {
            defaultStrategy = undefined
          }
        }
        if (this.policyReactInSchedtag) {
          this.fieldSet(this.fieldMap.policy, defaultStrategy)
        }
      })
    },
    policyChange (val) {
      this.fieldSet(this.fieldMap.policy, val)
      this.$emit('change', val)
    },
  },
}
</script>
