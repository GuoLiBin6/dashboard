<template>
  <div
    class="level-2-wrap"
    :class="{ 'w-0': !l2MenuVisibleForStore, 'menu-refined': globalRounded, 'light-theme': light }"
    :style="wrapStyle">
    <scrollbar
      class="level-2-menu">
      <div class="title text-truncate pr-2" :title="getLabel(l2Menu.meta)">{{ getLabel(l2Menu.meta) }}</div>
      <div
        class="level-3-item"
        v-for="(citem, cidx) of menus"
        :key="cidx">
        <div
          class="group-menu"
          v-if="citem.submenus">
          <div class="level-3-group-title text-truncate pr-2" :title="getLabel(citem.meta)">{{ getLabel(citem.meta) }}</div>
          <router-link
            v-for="(sitem, sidx) of citem.submenus"
            v-show="showMenu(sitem)"
            :key="sidx"
            class="menu-item text-truncate pr-2"
            :to="sitem.path"
            :title="getLabel(sitem.meta)"
            tag="a"
            active-class="active">
            {{ getLabel(sitem.meta) }}
          </router-link>
        </div>
        <router-link
          v-else
          class="menu-item text-truncate pr-2"
          :to="citem.path"
          :title="getLabel(citem.meta)"
          tag="a"
          active-class="active">
          {{ getLabel(citem.meta) }}
        </router-link>
      </div>
    </scrollbar>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import * as R from 'ramda'
import { hasPermission } from '@/utils/auth'
import { resolveLabel } from '@/utils/i18nLabel'

export default {
  name: 'Level2Menu',
  props: {
    l2Menu: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapGetters(['userInfo', 'globalRounded', 'theme']),
    ...mapState('common', {
      openCloudShell: state => state.openCloudShell,
      cloudShellHeight: state => state.cloudShellHeight,
    }),
    wrapStyle () {
      const inset = this.globalRounded ? 5 : 0
      // 开启全局圆角且展示 cloudshell 时，预留 cloudshell-box 的 margin-top（--oc-page-inset）
      const shellGap = (this.globalRounded && this.openCloudShell) ? 5 : 0
      return {
        bottom: this.openCloudShell ? `${this.cloudShellHeight + inset + shellGap}px` : `${inset}px`,
      }
    },
    light () {
      return this.theme === 'light'
    },
    menus () {
      const menus = this.l2Menu.menus
      const res = []
      menus.forEach(m2item => {
        const m2 = { ...m2item }
        if (this.showMenu(m2)) {
          if (m2.submenus) {
            let flag = false
            const submenus = []
            m2.submenus.forEach(m3item => {
              if (this.showMenu(m3item)) {
                submenus.push(m3item)
                flag = true
              }
            })
            if (flag) {
              m2.submenus = submenus
              res.push(m2)
            }
          } else {
            res.push(m2)
          }
        }
      })
      return res
    },
    l2MenuVisibleForStore () {
      return this.$store.state.setting.l2MenuVisible
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

<style lang="less" scoped>
@import "../../../src/styles/less/theme";

.level-2-wrap {
  position: fixed;
  left: 0;
  width: 160px;
  top: 60px;
  background-color: @sidebar-dark-bg-color;
  box-shadow: 1px 0 6px 0 rgba(165,192,207,.3);
  z-index: 5;
  transition: width .2s ease;
  ::v-deep {
    .scrollbar-wrap {
      overflow-x: hidden;
    }
  }
  &.w-0 {
    width: 0;
  }

  &.light-theme {
    background-color: @sidebar-light-bg-color;
    .level-2-menu .title {
      color: #000;
    }
    .level-3-item {
      .level-3-group-title {
        color: #000;
        font-weight: 500;
      }
      .menu-item {
        color: @sidebar-light-text-color;
        &:hover {
          color: @sidebar-light-hover-text-color;
        }
        &.active {
          color: var(--ant-color-primary, @primary-color);
        }
      }
    }
    &.menu-refined {
      .level-2-menu .title {
        color: rgba(0, 0, 0, 0.88);
      }
      .level-3-item {
        .group-menu {
          border-bottom-color: rgba(0, 0, 0, 0.08);
        }
        .level-3-group-title {
          color: rgba(0, 0, 0, 0.45);
        }
        .menu-item {
          color: rgba(0, 0, 0, 0.75);
          &:hover,
          &.active {
            color: var(--ant-color-primary, @primary-color);
          }
        }
      }
    }
  }

  // 全局圆角开启：样式对齐弹出二级菜单
  &.menu-refined {
    // 不在 wrap 上 overflow:hidden，否则会裁掉外侧折叠按钮
    box-shadow: none;

    ::v-deep .scrollbar {
      border-radius: 6px;
      overflow: hidden;
    }

    ::v-deep .scrollbar-wrap {
      overflow-x: hidden;
      // 不展示滚动条，仍可滚动
      scrollbar-width: none;
      -ms-overflow-style: none;
      &::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }
    }

    ::v-deep .scrollbar-bar {
      display: none !important;
    }

    .level-2-menu {
      padding: 16px 8px 20px 12px;
      font-size: 14px;

      .title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 10px;
        padding-left: 3px;
        color: #fff;
      }
    }

    .level-3-item {
      .group-menu {
        margin-bottom: 2px;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      &:last-child .group-menu {
        border-bottom: none;
        margin-bottom: 0;
      }

      .level-3-group-title {
        font-size: 14px;
        line-height: 22px;
        color: rgba(255, 255, 255, 0.45);
        margin: 4px 0 2px;
        margin-left: 3px;
        padding: 0;
      }

      .menu-item {
        margin: 1px 0;
        padding: 5px 8px 5px 20px;
        font-size: 14px;
        line-height: 22px;
        color: rgba(255, 255, 255, 0.75);
        background: transparent !important;
        transition: color 0.15s ease;

        &:hover,
        &.active {
          background: transparent !important;
          color: #fff;

          &::after {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            transform: translate(4px, -50%);
            background-color: var(--oc-sidebar-accent-color, @primary-5);
          }
        }
      }

      > .menu-item {
        margin-bottom: 1px;
      }

      & + & {
        > .menu-item {
          margin-top: 1px;
        }
      }
    }

  }
}

.level-2-menu {
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #fff;
  transition: left .2s;
  padding: 24px 0 0 23px;
  .title {
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
  }
}

.level-3-item {
  .group-menu {
    margin-bottom: 10px;
  }
  .level-3-group-title {
    font-size: 14px;
    color: rgba(255, 255, 255, .7);
    line-height: 24px;
    margin-left: 3px;
    margin-bottom: 14px;
    margin-top: 14px;
  }
  .menu-item {
    display: block;
    padding-bottom: 4px;
    padding-top: 6px;
    padding-left: 20px;
    font-size: 14px;
    color: @sidebar-dark-text-color;
    position: relative;
    cursor: pointer;
    text-decoration: none;

    &:hover, &.active {
      &::after {
        position: absolute;
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        position: absolute;
        left: 0;
        top: 50%;
        transform: translate(4px, -50%);
        background-color: var(--oc-sidebar-accent-color, @primary-5);
        overflow: hidden;
      }
    }
    &:hover {
      color: @sidebar-dark-hover-text-color;
    }
    &.active {
      color: @sidebar-dark-active-text-color;
    }
  }
  > .menu-item {
    margin-bottom: 25px;
  }
  & + & {
    > .menu-item {
      margin-top: 25px;
    }
  }
}
</style>
