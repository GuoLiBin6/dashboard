<template>
  <div>
    <div class="trigger d-flex align-items-center justify-content-center h-100" @click="toggle">
      <a-tooltip title="CloudShell" placement="bottom">
        <icon type="cloudshell" class="cloudsheel-icon" />
      </a-tooltip>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'CloudShell',
  data () {
    return {}
  },
  computed: {
    ...mapState('common', {
      openCloudShell: state => state.openCloudShell,
    }),
  },
  methods: {
    toggle () {
      this.$store.commit('common/SET_OPEN_CLOUDSHELL', !this.openCloudShell)
      // 去掉点击后残留的 focus 描边
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.trigger {
  cursor: pointer;
  color: inherit;
  outline: none;
  -webkit-tap-highlight-color: transparent;

  &:focus,
  &:focus-visible,
  &:focus-within {
    outline: none !important;
    box-shadow: none !important;
  }
}
.cloudsheel-icon {
  font-size: 20px;
  color: inherit;
  outline: none;
}
</style>
