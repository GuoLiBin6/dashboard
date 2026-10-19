<template>
  <router-view v-slot="{ Component }">
    <!-- 始终包 keep-alive：避免 cachedComponentNames 从空→非空时 v-if 切换 remount 当前页（列表闪刷新） -->
    <keep-alive :include="cachedComponentNames">
      <component :is="Component" :key="$route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script>
// cachedComponentNames 为需要缓存的页面里的组件名称，当前默认路由中name和组件名称一致且只有一个
import store from '@/store'

export default {
  computed: {
    cachedComponentNames () {
      return this.$store.state.keepAlive.cachedComponentNames
    },
  },
  beforeRouteLeave (to, from, next) {
    // 关闭页面开启的详情
    this.$bus.$emit('destroyKeepAliveSidePage')
    this.updateCachedCoponents(to, from)
    setTimeout(() => next())
  },
  beforeRouteUpdate (to, from, next) {
    // 关闭页面开启的详情
    this.$bus.$emit('destroyKeepAliveSidePage')
    this.updateCachedCoponents(to, from)
    setTimeout(() => next())
  },
  methods: {
    updateCachedCoponents (to, from) {
      const { keepAlive = false, keepAliveViews: fromKeepAliveViews = [] } = (from.meta || {})
      const { keepAliveViews: toKeepAliveViews = [] } = (to.meta || {})
      // 仅前往 from.meta.keepAliveViews 中的页面时缓存当前页
      // （如列表→调整配置）；去「新建」等页不缓存，避免误加缓存导致列表 remount 闪一下
      if (keepAlive && fromKeepAliveViews.includes(to.name)) {
        store.commit('keepAlive/ADD_CACHED_COMPONENT', from.name)
      }
      // 回到列表时：仅从 keepAliveViews 返回才保留缓存，否则清掉
      if (!toKeepAliveViews.includes(from.name) && this.cachedComponentNames.includes(to.name)) {
        store.commit('keepAlive/DELETE_CACHED_COMPONENT', to.name)
      }
    },
  },
}
</script>
