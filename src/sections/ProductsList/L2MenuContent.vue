<template>
  <template v-for="(l2, l2idx) of menus" :key="l2idx">
    <div class="l2-menu-list">
      <div
        class="l2-menu-group"
        v-if="l2.submenus">
        <div class="l2-menu-group-title" :title="getLabel(l2.meta)">{{ getLabel(l2.meta) }}</div>
        <router-link
          v-for="(sitem, sidx) of l2.submenus"
          v-show="showMenu(sitem)"
          :key="sidx"
          class="l2-menu-item text-truncate"
          :to="sitem.path"
          :title="getLabel(sitem.meta)"
          tag="a"
          active-class="active"
          @click="$emit('route-change')">
          {{ getLabel(sitem.meta) }}
        </router-link>
      </div>
      <router-link
        v-else
        class="l2-menu-item text-truncate"
        :to="l2.path"
        :title="getLabel(l2.meta)"
        tag="a"
        active-class="active"
        @click="$emit('route-change')">
        {{ getLabel(l2.meta) }}
      </router-link>
    </div>
  </template>
</template>

<script>
export default {
  name: 'L2MenuContent',
  props: {
    menus: {
      type: Array,
      default: () => [],
    },
    getLabel: Function,
    showMenu: Function,
  },
  emits: ['route-change'],
}
</script>
