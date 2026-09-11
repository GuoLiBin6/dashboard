<template>
  <div>
    <!-- <div class="side-page-shadow" v-show="hasSidePages" /> -->
    <component
      v-for="item of sidePages"
      :key="item.id"
      :is="item.name"
      :assigned-id="item.id"
      :params="item.params" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import sidepageLoaders from 'virtual:sidepage-registry'

const components = {}
const sidePageNames = Object.keys(sidepageLoaders)
sidePageNames.forEach((name) => {
  components[name] = defineAsyncComponent(sidepageLoaders[name])
})

export default {
  name: 'SidePageManager',
  components,
  computed: {
    sidePages () {
      return this.$store.getters.sidePages
    },
  },
  beforeCreate () {
    this.$store.dispatch('common/updateObject', {
      name: 'globalSidePages',
      data: {
        names: sidePageNames,
      },
    })
  },
}
</script>

<style lang="less">
.side-page-shadow {
  position: fixed;
  left: 500px;
  right: 0;
  bottom: 0;
  top: 60px;
  box-shadow: -5px 0 3px rgba(197, 219, 232, 0.4);
}
</style>
