<template>
  <div
    class="vue-codemirror"
    :class="{ merge, 'vue-codemirror--scroll': isScroll }"
    :style="hostStyle">
    <div ref="host" class="vue-codemirror__host" />
  </div>
</template>

<script>
import _CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/mode/shell/shell.js'
import 'codemirror/mode/htmlmixed/htmlmixed.js'
import 'codemirror/addon/selection/active-line.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/search.js'

const CodeMirror = window.CodeMirror || _CodeMirror

export default {
  name: 'CodeMirror',
  compatConfig: { MODE: 3 },
  inheritAttrs: false,
  props: {
    code: String,
    value: String,
    modelValue: String,
    marker: Function,
    unseenLines: Array,
    name: {
      type: String,
      default: 'codemirror',
    },
    placeholder: {
      type: String,
      default: '',
    },
    merge: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    events: {
      type: Array,
      default: () => ([]),
    },
    globalOptions: {
      type: Object,
      default: () => ({}),
    },
    globalEvents: {
      type: Array,
      default: () => ([]),
    },
    /** 编辑器高度，如 300px / 1000px */
    viewHeight: {
      type: String,
      default: '',
    },
    /** 超出高度时可滚动（配合 viewHeight） */
    isScroll: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['input', 'change', 'update:modelValue', 'update:value', 'ready'],
  computed: {
    resolvedValue () {
      if (this.code != null && this.code !== '') return this.normalizeText(this.code)
      if (this.modelValue !== undefined) return this.normalizeText(this.modelValue)
      return this.normalizeText(this.value)
    },
    hostStyle () {
      const h = this.viewHeight || ''
      if (!h) return undefined
      return {
        '--oc-cm-height': h,
      }
    },
    /** 兼容旧代码通过 ref 访问实例 */
    cminstance () {
      return this._cm
    },
    codemirror () {
      return this._cm
    },
  },
  watch: {
    code (newVal) {
      this.syncFromProp(newVal)
    },
    value (newVal) {
      // v-model / v-model:value 并存时以 modelValue 为准
      if (this.modelValue !== undefined) return
      this.syncFromProp(newVal)
    },
    modelValue (newVal) {
      this.syncFromProp(newVal)
    },
    viewHeight () {
      this.$nextTick(() => this.refresh())
    },
  },
  mounted () {
    this._cm = null
    this._syncing = false
    this.$nextTick(() => this.initialize())
  },
  beforeUnmount () {
    this.destroy()
  },
  methods: {
    normalizeText (val) {
      if (val == null) return ''
      if (typeof val === 'string') return val
      try {
        return JSON.stringify(val, null, 2)
      } catch (e) {
        return String(val)
      }
    },
    emitContent (content) {
      this.$emit('input', content)
      this.$emit('update:modelValue', content)
      this.$emit('update:value', content)
      this.$emit('change', content)
    },
    initialize () {
      const host = this.$refs.host
      if (!host || this._cm) return

      const cmOptions = {
        ...this.globalOptions,
        ...this.options,
        value: this.resolvedValue || '',
      }

      if (this.merge && CodeMirror.MergeView) {
        this._cm = CodeMirror.MergeView(host, cmOptions).edit
      } else {
        this._cm = CodeMirror(host, cmOptions)
      }

      this._syncing = false
      this._cm.on('change', (cm) => {
        if (this._syncing) return
        this.emitContent(cm.getValue())
      })

      const forward = [].concat(this.events || [], this.globalEvents || [])
      forward.forEach((event) => {
        if (!event) return
        this._cm.on(event, (...args) => {
          this.$emit(event, ...args)
        })
      })

      this.$emit('ready', this._cm)
      this.$nextTick(() => this.refresh())
    },
    refresh () {
      if (!this._cm || !this._cm.display) return
      try { this._cm.refresh() } catch (e) { /* ignore */ }
    },
    destroy () {
      if (!this._cm) return
      try {
        const wrapper = this._cm.getWrapperElement && this._cm.getWrapperElement()
        if (wrapper && wrapper.remove) wrapper.remove()
      } catch (e) { /* ignore */ }
      this._cm = null
    },
    syncFromProp (newVal) {
      const cm = this._cm
      if (!cm || this._syncing) return
      // 编辑中以编辑器为准，避免 setValue 打断输入
      if (cm.hasFocus && cm.hasFocus()) return
      const text = this.normalizeText(newVal)
      let cur = ''
      try {
        cur = cm.getValue()
      } catch (e) {
        return
      }
      if (text === cur) return
      this._syncing = true
      try {
        cm.setValue(text)
      } catch (e) { /* ignore */ }
      this._syncing = false
    },
  },
}
</script>

<style>
.vue-codemirror {
  --oc-cm-height: 320px;
}
/* host 高度跟内部编辑器走，避免业务侧 :deep 加大 .CodeMirror 后溢出盖住下方按钮 */
.vue-codemirror__host {
  min-height: var(--oc-cm-height);
}
.vue-codemirror .CodeMirror {
  height: var(--oc-cm-height);
  border: 1px solid #d9d9d9;
  font-size: 13px;
}
.vue-codemirror--scroll .CodeMirror {
  height: auto;
  min-height: 120px;
}
.vue-codemirror--scroll .CodeMirror-scroll {
  max-height: var(--oc-cm-height);
  overflow-y: auto !important;
  overflow-x: auto !important;
}
</style>
