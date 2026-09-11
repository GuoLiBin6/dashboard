<template>
  <base-select
    v-model="innerValue"
    remote
    resource="domains"
    :params="domainParams"
    :select-props="{ placeholder: $t('rules.domain') }"
    :disabled="disabled"
    @change="handleChange" />
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'DomainSelect',
  props: {
    value: String,
    label: String,
    params: {
      type: Object,
      default: () => ({}),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      innerValue: this.value,
    }
  },
  computed: {
    ...mapGetters(['scope', 'userInfo']),
    userDomain () {
      return {
        id: this.userInfo.projectDomainId,
        name: this.userInfo.projectDomain,
      }
    },
    domainParams () {
      return {
        scope: this.scope,
        limit: 20,
        ...this.params,
      }
    },
  },
  watch: {
    value (val) {
      this.innerValue = val
    },
  },
  beforeUnmount () {
  },
  created () {
  },
  methods: {
    handleChange (val) {
      this.innerValue = val
      this.$emit('change', val)
      this.$emit('input', val)
      this.$emit('update:value', val)
    },
  },
}
</script>
