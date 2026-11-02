<template>
  <div class="d-flex flex-wrap">
    <div
      v-for="item of styleList"
      :key="item.value"
      class="setting-theme-item"
      :title="item.title"
      @click.stop.prevent="changeStyle(item.value)">
      <img :src="item.icon" :alt="item.value" />
      <div class="setting-theme-selectIcon" v-if="currentStyle === item.value">
        <icon type="check" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import lightIcon from './assets/light-theme-icon.svg'
import darkSidebarIcon from './assets/dark-theme-icon.svg'
import darkModeIcon from './assets/dark-mode-theme-icon.svg'

// 三种整体风格：浅色 / 深色侧栏 / 全暗（自动开启深色模式）
const STYLE_LIGHT = 'light'
const STYLE_DARK_SIDEBAR = 'dark-sidebar'
const STYLE_DARK_MODE = 'dark-mode'

export default {
  name: 'ThemeReplacer',
  computed: {
    ...mapGetters(['theme', 'darkMode']),
    styleList () {
      return [
        { value: STYLE_LIGHT, icon: lightIcon, title: this.$t('common_273') },
        { value: STYLE_DARK_SIDEBAR, icon: darkSidebarIcon, title: this.$t('common_272') },
        { value: STYLE_DARK_MODE, icon: darkModeIcon, title: this.$t('common.theme.style.dark_mode') },
      ]
    },
    // 深色模式优先：开启后无论侧栏设置都展示第三种
    currentStyle () {
      if (this.darkMode) return STYLE_DARK_MODE
      return this.theme === 'dark' ? STYLE_DARK_SIDEBAR : STYLE_LIGHT
    },
  },
  methods: {
    async changeStyle (value) {
      if (this.currentStyle === value) return
      const dark = value === STYLE_DARK_MODE
      // 第三种风格必须配深色侧栏，第一/二种则退出深色模式
      const theme = value === STYLE_LIGHT ? 'light' : 'dark'
      if (!!this.darkMode !== dark) {
        this.$store.commit('setting/SET_DARK_MODE', dark)
      }
      if (this.theme !== theme) {
        this.$store.commit('setting/SET_THEME', theme)
        try {
          await this.$store.dispatch('profile/update', { theme })
        } catch (error) {
          console.error(error)
        }
      }
    },
  },
}
</script>

<style lang="less" scoped>
.setting-theme-item {
  margin-right: 12px;
  position: relative;
  border-radius: 4px;
  cursor: pointer;
  &:last-child {
    margin-right: 0;
  }
  img {
    width: 48px;
    display: block;
    pointer-events: none;
  }
  // 勾选标记居中压在缩略图上
  .setting-theme-selectIcon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ant-color-primary, #1890ff);
    font-size: 16px;
    font-weight: 700;
    pointer-events: none;
  }
}
// 全暗缩略图本身很深，勾选标记改用白色更醒目
.setting-theme-item:last-child .setting-theme-selectIcon {
  color: #fff;
}
</style>
