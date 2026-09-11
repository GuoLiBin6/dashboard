<template>
  <div class="d-flex flex-wrap">
    <div
      class="setting-theme-item"
      :title="$t('common_272')"
      @click.stop.prevent="changeTheme('dark')">
      <img src="./assets/dark-theme-icon.svg" alt="dark" />
      <div class="setting-theme-selectIcon" v-if="theme === 'dark'">
        <icon type="check" />
      </div>
    </div>
    <div
      class="setting-theme-item"
      :title="$t('common_273')"
      @click.stop.prevent="changeTheme('light')">
      <img src="./assets/light-theme-icon.svg" alt="light" />
      <div class="setting-theme-selectIcon" v-if="theme === 'light'">
        <icon type="check" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ThemeReplacer',
  computed: {
    ...mapGetters(['theme']),
  },
  methods: {
    async changeTheme (theme) {
      if (this.theme === theme) return
      this.$store.commit('setting/SET_THEME', theme)
      try {
        await this.$store.dispatch('profile/update', { theme })
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style lang="less" scoped>
.setting-theme-item {
  margin-right: 16px;
  position: relative;
  border-radius: 4px;
  cursor: pointer;
  img {
    width: 48px;
    pointer-events: none;
  }
  .setting-theme-selectIcon {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    padding-top: 15px;
    padding-left: 24px;
    height: 100%;
    color: var(--ant-color-primary, #1890ff);
    font-size: 14px;
    font-weight: 700;
    pointer-events: none;
  }
}
</style>
