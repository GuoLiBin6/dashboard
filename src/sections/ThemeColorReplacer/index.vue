<template>
  <div class="d-flex flex-wrap">
    <div
      v-for="(item, index) in colorList"
      :key="index"
      class="color-item"
      :title="item.key"
      :style="{ backgroundColor: item.color }"
      @click.stop.prevent="changeColor(item.color)">
      <icon type="check" v-if="isActive(item.color)" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { colorList } from '@/utils/theme/utils'

export default {
  name: 'ThemeColorReplacer',
  data () {
    return {
      colorList,
    }
  },
  computed: {
    ...mapGetters(['themeColor']),
  },
  methods: {
    isActive (color) {
      return String(this.themeColor || '').toLowerCase() === String(color || '').toLowerCase()
    },
    async changeColor (color) {
      if (this.isActive(color)) return
      this.$store.commit('setting/SET_THEME_COLOR', color)
      try {
        await this.$store.dispatch('profile/update', { themeColor: color })
      } catch (error) {
        // 本地已生效，接口失败不打断 UI
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
  color: #fff;
  font-weight: 700;
  i {
    font-size: 14px;
  }
}
</style>
