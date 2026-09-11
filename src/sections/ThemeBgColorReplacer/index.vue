<template>
  <div class="d-flex flex-wrap">
    <div
      v-for="(item, index) in bgColorList"
      :key="index"
      class="color-item"
      :title="item.key"
      :style="swatchStyle(item.color)"
      @click.stop.prevent="changeColor(item.color)">
      <icon type="check" v-if="isActive(item.color)" />
    </div>
    <div
      class="color-item color-item--none"
      :class="{ active: isNone }"
      :title="$t('common.theme.background_none')"
      @click.stop.prevent="changeColor(THEME_BG_NONE)">
      <svg class="none-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M5.2 14.8 L14.8 5.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <icon type="check" v-if="isNone" class="none-check" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  bgColorList,
  hexToRgbChannels,
  THEME_BG_ALPHA,
  THEME_BG_NONE,
  isThemeBgNone,
} from '@/utils/theme/utils'

export default {
  name: 'ThemeBgColorReplacer',
  data () {
    return {
      bgColorList,
      THEME_BG_NONE,
    }
  },
  computed: {
    ...mapGetters(['themeBgColor']),
    isNone () {
      return isThemeBgNone(this.themeBgColor)
    },
  },
  methods: {
    swatchStyle (color) {
      return {
        backgroundColor: `rgba(${hexToRgbChannels(color)}, ${THEME_BG_ALPHA})`,
      }
    },
    isActive (color) {
      if (this.isNone) return false
      return String(this.themeBgColor || '').toLowerCase() === String(color || '').toLowerCase()
    },
    async changeColor (color) {
      if (color === THEME_BG_NONE) {
        if (this.isNone) return
      } else if (this.isActive(color)) {
        return
      }
      this.$store.commit('setting/SET_THEME_BG_COLOR', color)
      try {
        await this.$store.dispatch('profile/update', { themeBgColor: color })
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style lang="less" scoped>
.color-item {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  position: relative;
  i {
    font-size: 14px;
  }
}
.color-item--none {
  background: #fff;
  color: rgba(0, 0, 0, 0.45);
  .none-icon {
    width: 16px;
    height: 16px;
    display: block;
  }
  .none-check {
    position: absolute;
    right: -2px;
    bottom: -2px;
    font-size: 10px;
    color: var(--ant-color-primary, #1890ff);
    background: #fff;
    border-radius: 50%;
  }
  &.active {
    box-shadow: inset 0 0 0 1px var(--ant-color-primary, #1890ff);
  }
}
</style>
