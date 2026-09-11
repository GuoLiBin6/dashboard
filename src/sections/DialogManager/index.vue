<template>
  <div>
    <component
      v-for="item in dialogList"
      :key="item.id"
      :is="item.name"
      :assigned-id="item.id"
      :params="item.params" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import dialogLoaders from 'virtual:dialog-registry'

const components = {}
Object.keys(dialogLoaders).forEach((name) => {
  components[name] = defineAsyncComponent(dialogLoaders[name])
})

export default {
  name: 'DialogManager',
  components,
  computed: {
    dialogList () {
      const dialogs = this.$store.getters.dialogs || {}
      return Array.isArray(dialogs) ? dialogs : Object.values(dialogs)
    },
  },
}
</script>
