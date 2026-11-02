<template>
  <div class="bg-picker" :class="{ 'is-dark-palette': isDark }">
    <!-- 背景色系 -->
    <div v-if="part !== 'depth'" class="bg-picker__swatches">
      <div
        v-for="hue in hueList"
        :key="hue.color"
        class="color-item"
        :class="{ 'is-active': isHueActive(hue.color) }"
        :title="hue.key"
        :style="{ backgroundColor: hueSwatchColor(hue.color) }"
        @click.stop.prevent="selectHue(hue.color)">
        <icon type="check" v-if="isHueActive(hue.color)" />
      </div>
    </div>
    <!-- 背景深度 -->
    <div v-if="part !== 'hue'" class="bg-picker__swatches">
      <div
        v-for="(color, index) in palette"
        :key="index"
        class="color-item"
        :class="{ 'is-active': index === currentLevel }"
        :style="{ backgroundColor: color }"
        @click.stop.prevent="selectLevel(index)">
        <icon type="check" v-if="index === currentLevel" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  bgHueList,
  THEME_BG_GRAY_HUE,
  BG_GRAY_SWATCH_LIGHT,
  BG_GRAY_SWATCH_DARK,
} from '@/utils/theme/utils'

export default {
  name: 'ThemeBgColorReplacer',
  props: {
    // 'hue' 只渲染色系；'depth' 只渲染深度；不传则两块都渲染
    part: {
      type: String,
      default: '',
    },
  },
  data () {
    return {
      hueList: bgHueList,
    }
  },
  computed: {
    ...mapGetters([
      'themeBgHue',
      'themeBgPalette',
      'themeBgLevel',
      'themeDarkBgHue',
      'themeDarkBgPalette',
      'themeDarkBgLevel',
      'darkMode',
    ]),
    isDark () {
      return !!this.darkMode
    },
    palette () {
      return this.isDark ? this.themeDarkBgPalette : this.themeBgPalette
    },
    currentHue () {
      return this.isDark ? this.themeDarkBgHue : this.themeBgHue
    },
    currentLevel () {
      return this.isDark ? this.themeDarkBgLevel : this.themeBgLevel
    },
  },
  methods: {
    // 灰色系在深浅模式下给出各自的中性灰预览块
    hueSwatchColor (color) {
      if (color !== THEME_BG_GRAY_HUE) return color
      return this.isDark ? BG_GRAY_SWATCH_DARK : BG_GRAY_SWATCH_LIGHT
    },
    isHueActive (hue) {
      return String(this.currentHue || '').toLowerCase() === String(hue || '').toLowerCase()
    },
    selectHue (hue) {
      if (this.isHueActive(hue)) return
      if (this.isDark) {
        this.$store.commit('setting/SET_THEME_DARK_BG_HUE', hue)
      } else {
        this.$store.commit('setting/SET_THEME_BG_HUE', hue)
        this.syncProfile()
      }
    },
    selectLevel (index) {
      if (index === this.currentLevel) return
      if (this.isDark) {
        this.$store.commit('setting/SET_THEME_DARK_BG_LEVEL', index)
      } else {
        this.$store.commit('setting/SET_THEME_BG_LEVEL', index)
        this.syncProfile()
      }
    },
    // 把浅色最终色同步到 profile，其它端可直接取到正确底色
    async syncProfile () {
      this.$nextTick(async () => {
        try {
          await this.$store.dispatch('profile/update', { themeBgColor: this.$store.getters.themeBgColor })
        } catch (error) {
          console.error(error)
        }
      })
    },
  },
}
</script>

<style lang="less" scoped>
.bg-picker__swatches {
  display: flex;
  flex-wrap: wrap;
}
// 与主题色选择器保持一致
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
  color: #fff;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  position: relative;
  i {
    font-size: 14px;
  }
  &.is-active {
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
  }
}

// 深色色板：色块本身很深，勾选标记要用白色，并加一圈描边区分边界
.is-dark-palette {
  .color-item {
    color: rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
    &.is-active {
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    }
  }
}
</style>
