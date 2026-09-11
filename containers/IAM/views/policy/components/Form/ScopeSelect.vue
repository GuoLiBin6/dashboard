<template>
  <a-radio-group :value="value" @change="handleChange">
    <template v-for="item of scopesMap" :key="item.key">
      <a-radio-button
        v-if="showScope(item)"
        :value="item.key">{{ $t(`policyScopeLabel.${item.key}`) }}</a-radio-button>
    </template>
  </a-radio-group>
</template>

<script>
import { mapGetters } from 'vuex'
import { SCOPES_MAP } from '@/constants'

export default {
  name: 'PolicyScopeSelect',
  props: {
    value: String,
  },
  computed: {
    ...mapGetters(['l3PermissionEnable', 'scope']),
    scopesMap () {
      const ret = { ...SCOPES_MAP }
      if (!this.l3PermissionEnable) {
        delete ret[SCOPES_MAP.domain.key]
      }
      return ret
    },
  },
  methods: {
    handleChange (e) {
      const next = e?.target?.value
      this.$emit('input', next)
      this.$emit('update:value', next)
    },
    showScope (item) {
      if (item.key === this.scopesMap.system.key) {
        if (this.scope !== this.scopesMap.system.key) {
          return false
        }
      }
      return true
    },
  },
}
</script>
