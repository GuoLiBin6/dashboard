<template>
  <scrollbar
    class="products-list-wrap"
    :class="{ 'menu-refined': globalRounded, 'light-theme': light }"
    id="products-list-wrap">
    <ul class="list-unstyled p-0 mb-0">
      <template v-for="(item, idx) of menus" :key="idx">
        <products-list-sub
          :item="item"
          :active-menu="activeMenu"
          :popover-align="popoverAlign"
          :get-label="getLabel"
          :show-menu="showMenu"
          @hover="$emit('hover', $event)"
          @leave="$emit('leave', $event)"
          @route-change="$emit('route-change')" />
      </template>
    </ul>
  </scrollbar>
</template>

<script>
import { mapGetters } from 'vuex'
import * as R from 'ramda'
import { menusConfig } from '@/router/routes'
import { hasPermission } from '@/utils/auth'
import { resolveLabel } from '@/utils/i18nLabel'
import ProductsListSub from './Sub'

export default {
  name: 'ProductsList',
  components: {
    ProductsListSub,
  },
  props: {
    activeMenu: Object,
    popoverAlign: Object,
  },
  data () {
    return {
      menuitems: menusConfig,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'globalRounded', 'theme']),
    light () {
      return this.theme === 'light'
    },
    menus () {
      const ret = this.menuitems.filter(m1item => {
        let flag = false
        if (this.showMenu(m1item)) {
          if (m1item.menus) {
            m1item.menus.forEach(m2item => {
              if (this.showMenu(m2item)) {
                if (m2item.submenus) {
                  m2item.submenus.forEach(m3item => {
                    if (this.showMenu(m3item)) {
                      flag = true
                    }
                  })
                } else {
                  flag = true
                }
              }
            })
          } else {
            flag = true
          }
        }
        return flag
      })
      return ret
    },
  },
  methods: {
    getLabel (meta) {
      const m = meta || {}
      if (m.t) {
        return this.$t(m.t)
      }
      return resolveLabel(m.label)
    },
    getMenuHidden (menu) {
      if (!R.isNil(menu.meta.hidden)) {
        if (R.is(Function, menu.meta.hidden)) {
          return menu.meta.hidden(this.userInfo, menu)
        }
        return menu.meta.hidden
      }
      if (!R.isNil(menu.meta.invisible)) {
        if (R.is(Function, menu.meta.invisible)) {
          return menu.meta.invisible(this.userInfo, menu)
        }
        return menu.meta.invisible
      }
      return false
    },
    showMenu (item) {
      const hidden = this.getMenuHidden(item)
      if (R.isNil(item.meta.permission) || R.isEmpty(item.meta.permission)) {
        return !hidden && true
      }
      return !hidden && hasPermission({ key: item.meta.permission })
    },
  },
}
</script>

<style lang="less">
@import "../../styles/less/theme";

.products-list-wrap {
  height: 100%;
  background-color: @sidebar-dark-bg-color;
  .scrollbar-wrap {
    overflow-x: hidden;
  }

  &.light-theme {
    background-color: @sidebar-light-bg-color;
    .l1-menu-item {
      > a {
        color: @sidebar-light-text-color;
      }
      &:hover,
      &.ant-popover-open {
        background-color: @primary-1;
        > a {
          color: var(--ant-color-primary, @primary-color) !important;
        }
      }
      &.active > a {
        color: var(--ant-color-primary, @primary-color);
      }
      .l1-menu-item-right-icon {
        color: @sidebar-light-text-color !important;
      }
    }
  }

  // 全局圆角开启：一级菜单视觉收紧
  &.menu-refined {
    padding: 4px 0;
    .l1-menu-item {
      margin: 1px 6px;
      border-radius: 6px;
      transition: background-color 0.15s ease;

      > a {
        height: 44px;
        color: rgba(255, 255, 255, 0.75);
        border-radius: 6px;
        transition: color 0.15s ease;
        // 保证图标与文字垂直居中
        display: flex;
        align-items: center;
      }

      .l1-menu-item-icon {
        width: 48px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        line-height: 1;
        > i,
        > .oc-icon,
        .oc-icon {
          font-size: 20px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          // 图标更清晰
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        img {
          width: 20px;
          height: 20px;
          display: block;
        }
      }

      .l1-menu-item-label {
        font-size: 14px;
        letter-spacing: 0.01em;
        line-height: 1.2;
      }

      .l1-menu-item-right-icon {
        width: 22px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.35) !important;
        > i,
        .oc-icon {
          font-size: 12px;
          line-height: 1;
        }
      }

      &:hover,
      &.ant-popover-open {
        background-color: rgba(255, 255, 255, 0.08);
        > a {
          color: #fff !important;
        }
        .l1-menu-item-right-icon {
          color: rgba(255, 255, 255, 0.65) !important;
        }
      }

      &.active {
        background-color: rgba(24, 144, 255, 0.18);
        > a {
          color: #fff;
        }
      }
    }
  }

  &.light-theme.menu-refined {
    .l1-menu-item {
      > a {
        color: @sidebar-light-text-color;
      }
      .l1-menu-item-right-icon {
        color: @sidebar-light-arrow-color !important;
      }
      &:hover,
      &.ant-popover-open {
        background-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 8%, #fff);
        > a {
          color: var(--ant-color-primary, @primary-color) !important;
        }
        .l1-menu-item-right-icon {
          color: var(--ant-color-primary, @primary-color) !important;
        }
      }
      &.active {
        background-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 12%, #fff);
        > a {
          color: var(--ant-color-primary, @primary-color);
        }
      }
    }
  }
}
.l1-menu-item {
  > a {
    height: 44px;
    color: @sidebar-dark-text-color;
  }
  .l1-menu-item-icon {
    width: 64px;
    height: 18px;
    text-align: center;
    > i {
      font-size: 18px;
    }
  }
  .l1-menu-item-right-icon {
    width: 26px;
    text-align: left;
    > i {
      font-size: 12px;
    }
  }
  &.active {
    > a {
      color: var(--oc-sidebar-accent-color, @primary-5);
    }
  }
  &:hover {
    background-color: @primary-color;
    > a {
      color: @sidebar-dark-hover-text-color!important;
    }
  }
  &.ant-popover-open {
    background-color: @primary-color;
    > a {
      color: @sidebar-dark-hover-text-color!important;
    }
  }
  .l1-menu-item-right-icon {
    color: @sidebar-light-text-color!important;
  }
}
</style>
