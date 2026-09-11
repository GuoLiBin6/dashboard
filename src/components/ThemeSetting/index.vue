<template>
  <div class="setting-wrap" @click.stop>
    <div class="setting-item">
      <h3 class="setting-title">{{$t('common_196')}}</h3>
      <theme-replacer />
    </div>
    <div class="setting-item" v-if="showThemeColor">
      <h3 class="setting-title">{{$t('common_197')}}</h3>
      <theme-color-replacer />
    </div>
    <div class="setting-item" v-if="showThemeBg">
      <h3 class="setting-title">{{$t('common.theme.background')}}</h3>
      <theme-bg-color-replacer />
    </div>
  </div>
</template>

<script>
import ThemeColorReplacer from '@/sections/ThemeColorReplacer'
import ThemeBgColorReplacer from '@/sections/ThemeBgColorReplacer'
import ThemeReplacer from '@/sections/ThemeReplacer'
import { isCE } from '@/utils/utils'

export default {
  name: 'SettingPopover',
  components: {
    ThemeColorReplacer,
    ThemeBgColorReplacer,
    ThemeReplacer,
  },
  computed: {
    // 仅商业版支持多主题色 / 全局背景色；开源版固定默认蓝
    isCommercialTheme () {
      return !isCE() && !this.$store.getters.isSysCE
    },
    showThemeColor () {
      return this.isCommercialTheme
    },
    showThemeBg () {
      return this.isCommercialTheme
    },
  },
}
</script>

<style lang="less" scoped>
.setting-item {
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
}
.setting-title {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 22px;
}
</style>
