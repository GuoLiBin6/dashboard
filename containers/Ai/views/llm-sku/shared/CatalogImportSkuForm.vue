<!--
  推理模板：从模型目录 / Hugging Face 导入 SKU 的共用表单壳（内部仍为 LlmSkuCreateForm）。
-->
<template>
  <llm-sku-create-form
    ref="inner"
    mode="create"
    hide-footer
    :catalog-set="catalogSet"
    :catalog-spec="catalogSpec"
    :catalog-type-selectable="catalogTypeSelectable"
    catalog-submit-type="import"
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
  name: 'CatalogImportSkuForm',
  components: {
    LlmSkuCreateForm,
  },
  inheritAttrs: false,
  props: {
    catalogSet: {
      type: Object,
      default: null,
    },
    catalogSpec: {
      type: Object,
      default: null,
    },
    catalogTypeSelectable: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    forwardListeners () {
      if (this.$listeners && Object.keys(this.$listeners).length) return this.$listeners
      return listenersFromAttrs(this.$attrs)
    },
  },
  methods: {
    async handleCatalogImport () {
      return this.$refs.inner.handleCatalogImport()
    },
    applyCatalogSpec () {
      if (this.$refs.inner && this.$refs.inner.applyCatalogSpec) {
        this.$refs.inner.applyCatalogSpec()
      }
    },
  },
}
</script>
