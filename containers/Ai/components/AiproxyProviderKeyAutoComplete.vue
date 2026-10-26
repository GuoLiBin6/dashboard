<template>
  <a-auto-complete
    :value="inputValue"
    :options="autoCompleteOptions"
    :placeholder="placeholder"
    :filter-option="false"
    @change="onChange"
    @search="onSearch"
    @select="onSelect"
    @blur="onBlur">
    <template #option="{ value: optValue }">
      <aiproxy-provider-label :provider-key="optValue" :icon-size="16" />
    </template>
  </a-auto-complete>
</template>

<script>
import {
  AIPROXY_PROVIDER_KEYS,
  filterAiproxyProviderKeys,
  getAiproxyProviderKeyDisplayName,
} from '@Ai/constants/aiproxyProviderKeys'
import AiproxyProviderLabel from '@Ai/components/AiproxyProviderLabel'

export default {
  name: 'AiproxyProviderKeyAutoComplete',
  components: { AiproxyProviderLabel },
  props: {
    value: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['input', 'update:value', 'update:modelValue', 'change'],
  data () {
    return {
      providerKeys: filterAiproxyProviderKeys(''),
      searchText: '',
      searchActive: false,
    }
  },
  computed: {
    inputValue () {
      if (this.searchActive) return this.searchText
      return getAiproxyProviderKeyDisplayName(this, this.value)
    },
    autoCompleteOptions () {
      return this.providerKeys.map(key => ({
        value: key,
        label: this.providerKeyLabel(key),
      }))
    },
  },
  watch: {
    value () {
      if (!this.searchActive) {
        this.searchText = ''
      }
    },
  },
  methods: {
    providerKeyLabel (key) {
      return getAiproxyProviderKeyDisplayName(this, key)
    },
    onSearch (value) {
      this.searchActive = true
      this.searchText = value
      this.providerKeys = filterAiproxyProviderKeys(value, this)
    },
    onSelect (value) {
      this.searchActive = false
      this.searchText = ''
      this.emitValue(value)
    },
    onChange (value) {
      this.searchText = value
      this.providerKeys = filterAiproxyProviderKeys(value, this)
      const resolved = this.resolveProviderKey(value)
      if (AIPROXY_PROVIDER_KEYS.includes(resolved)) {
        this.searchActive = false
        this.emitValue(resolved)
      } else {
        this.searchActive = true
      }
    },
    onBlur () {
      const resolved = this.resolveProviderKey(this.searchActive ? this.searchText : this.value)
      this.searchActive = false
      this.searchText = ''
      if (AIPROXY_PROVIDER_KEYS.includes(resolved)) {
        this.emitValue(resolved)
      }
    },
    resolveProviderKey (input) {
      const text = String(input || '').trim()
      if (!text) return ''
      const lower = text.toLowerCase()
      const exact = AIPROXY_PROVIDER_KEYS.find(key => key.toLowerCase() === lower)
      if (exact) return exact
      for (const key of AIPROXY_PROVIDER_KEYS) {
        if (this.providerKeyLabel(key).toLowerCase() === lower) {
          return key
        }
      }
      return text
    },
    emitValue (key) {
      const normalized = String(key || '').trim()
      this.$emit('input', normalized)
      this.$emit('update:value', normalized)
      this.$emit('update:modelValue', normalized)
      this.$emit('change', normalized)
    },
  },
}
</script>

<style lang="less" scoped>
:deep(.aiproxy-provider-label__text) {
  white-space: normal;
}
</style>
