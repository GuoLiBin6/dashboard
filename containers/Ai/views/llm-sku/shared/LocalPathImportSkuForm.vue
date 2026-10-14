<!--
  推理模板：从本地路径导入 SKU 的共用表单壳（内部仍为 LlmSkuCreateForm）。
-->
<template>
  <llm-sku-create-form
    ref="inner"
    mode="create"
    hide-footer
    import-mode="local_path"
    v-bind="$attrs"
    v-on="forwardListeners" />
</template>

<script>
import LlmSkuCreateForm from '@Ai/views/llm-sku/create/Form.vue'

function listenersFromAttrs (attrs = {}) {
  const out = {}
  Object.keys(attrs).forEach((key) => {
    if (!key.startsWith('on') || key.length < 3) return
    const raw = key.slice(2)
    out[raw.charAt(0).toLowerCase() + raw.slice(1)] = attrs[key]
  })
  return out
}

export default {
  name: 'LocalPathImportSkuForm',
  components: {
    LlmSkuCreateForm,
  },
  inheritAttrs: false,
  computed: {
    /** MODE:2 用 $listeners；纯 Vue3 事件在 $attrs.onXxx */
    forwardListeners () {
      if (this.$listeners && Object.keys(this.$listeners).length) return this.$listeners
      return listenersFromAttrs(this.$attrs)
    },
  },
  methods: {
    async handleLocalPathImport () {
      return this.$refs.inner.handleLocalPathImport()
    },
  },
}
</script>
