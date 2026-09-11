<template>
  <div
    ref="root"
    class="global-search"
    :class="{ 'is-expanded': isExpanded }"
    :style="rootStyle">
    <button
      type="button"
      class="global-search-trigger"
      :class="{ 'is-active': triggerActive }"
      :tabindex="triggerActive ? 0 : -1"
      :aria-hidden="triggerActive ? 'false' : 'true'"
      :aria-label="$t('common.global_resource_search')"
      @click.stop.prevent="expand">
      <svg
        class="global-search-trigger-icon"
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        aria-hidden="true">
        <path fill="currentColor" d="M977.290042 925.104914L835.005555 782.411093A465.167119 465.167119 0 1 0 29.600044 465.504737 463.038582 463.038582 0 0 0 107.946565 723.712603a34.875254 34.875254 0 1 0 58.043557-38.80486A395.662211 395.662211 0 1 1 275.200424 794.118045a34.957121 34.957121 0 1 0-38.886727 57.961689 463.693516 463.693516 0 0 0 509.211453 4.993875L895.013914 1006.971707a58.20729 58.20729 0 0 0 81.866794-81.866793zM253.915057 396.736631a250.43052 250.43052 0 0 1 212.853663-186.901889 34.875254 34.875254 0 1 0-8.67788-69.259307 319.853561 319.853561 0 0 0-271.797754 238.723569 34.875254 34.875254 0 0 0 25.051239 42.488866 34.056586 34.056586 0 0 0 8.759747 1.146135 34.875254 34.875254 0 0 0 33.729119-26.197374z m0 0" />
      </svg>
      <span class="global-search-trigger-label">{{ $t('common.global_resource_search') }}</span>
    </button>
    <div
      v-if="boxMounted"
      class="global-search-panel"
      :class="{ 'is-active': panelVisible }">
      <search-box
        ref="searchBox"
        :options="options"
        :value="value"
        :hide-key-list-search="true"
        :defaultSearchKey="defaultSearchKey"
        @input="search"
        @focus-change="onFocusChange"
        @click.stop.prevent="handleCloseSidebar" />
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import qs from 'qs'
import regexp from '@/utils/regexp'

const path = '/global-search-result'
const ANIM_MS = 280
const CROSSFADE_DELAY = 90

export default {
  name: 'GlobalSearch',
  data () {
    return {
      value: {},
      expanded: false,
      boxMounted: false,
      panelVisible: false,
      triggerActive: true,
      animating: false,
      widthPx: null,
      cachedTriggerWidth: 160,
      options: {
        name: {
          label: this.$t('common_186'),
        },
        ip: {
          label: 'IP',
        },
        id: {
          label: 'ID',
        },
        external_id: {
          label: this.$t('table.title.external_id'),
        },
      },
    }
  },
  computed: {
    hasValue () {
      return !R.isEmpty(this.value)
    },
    isExpanded () {
      return this.expanded || this.hasValue
    },
    rootStyle () {
      if (this.widthPx != null) {
        return { width: `${this.widthPx}px` }
      }
      if (this.isExpanded) {
        return { width: '100%' }
      }
      return { width: `${this.cachedTriggerWidth}px` }
    },
  },
  watch: {
    '$route.path' (v) {
      if (v !== '/global-search-result') {
        this.value = {}
        this.resetCollapsed()
      }
    },
    isExpanded (val) {
      this.$emit('expand-change', val)
    },
  },
  created () {
    this.initSearchText()
    if (this.hasValue) {
      this.expanded = true
      this.boxMounted = true
      this.panelVisible = true
      this.triggerActive = false
      this.widthPx = null
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.cacheTriggerWidth()
      if (!this.isExpanded) this.widthPx = this.cachedTriggerWidth
      this.$emit('expand-change', this.isExpanded)
    })
  },
  beforeUnmount () {
    clearTimeout(this._animTimer)
    clearTimeout(this._fadeTimer)
  },
  methods: {
    initSearchText () {
      if (window.location.pathname.includes(path)) {
        const querystr = window.location.search.replace('?', '')
        const value = qs.parse(querystr)
        Object.keys(value).map(key => {
          if (key.includes('__condition_')) {
            delete value[key]
          }
        })
        this.value = value
      }
    },
    cacheTriggerWidth () {
      const trigger = this.$refs.root && this.$refs.root.querySelector('.global-search-trigger')
      if (!trigger) return
      const w = Math.ceil(trigger.getBoundingClientRect().width)
      if (w > 0) this.cachedTriggerWidth = w
    },
    getParentWidth () {
      const parent = this.$refs.root && this.$refs.root.parentElement
      return parent ? parent.clientWidth : 450
    },
    expand () {
      if (this.isExpanded || this.animating) return
      this.cacheTriggerWidth()
      const from = this.widthPx || this.cachedTriggerWidth
      const to = this.getParentWidth()
      this.handleCloseSidebar()
      this.animating = true
      this.expanded = true
      this.boxMounted = true
      this.panelVisible = false
      this.triggerActive = true
      this.widthPx = from

      this.$nextTick(() => {
        // 先拉宽（仍显示入口），再交叉淡入搜索框
        requestAnimationFrame(() => {
          this.widthPx = to
          clearTimeout(this._fadeTimer)
          this._fadeTimer = setTimeout(() => {
            this.triggerActive = false
            this.panelVisible = true
          }, CROSSFADE_DELAY)

          clearTimeout(this._animTimer)
          this._animTimer = setTimeout(() => {
            this.animating = false
            this.widthPx = null
            this.$refs.searchBox && this.$refs.searchBox.open()
          }, ANIM_MS)
        })
      })
    },
    resetCollapsed () {
      clearTimeout(this._animTimer)
      clearTimeout(this._fadeTimer)
      this.animating = false
      this.expanded = false
      this.panelVisible = false
      this.triggerActive = true
      this.boxMounted = false
      this.widthPx = this.cachedTriggerWidth
    },
    collapse () {
      if (this.animating || this.hasValue || !this.expanded) return
      const from = this.$refs.root ? this.$refs.root.offsetWidth : this.getParentWidth()
      const to = this.cachedTriggerWidth || 160
      this.animating = true
      this.widthPx = from
      // 与展开对称：先收窄（仍显示搜索框），再交叉淡回入口
      this.panelVisible = true
      this.triggerActive = false

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.widthPx = to
          clearTimeout(this._fadeTimer)
          this._fadeTimer = setTimeout(() => {
            this.triggerActive = true
            this.panelVisible = false
          }, CROSSFADE_DELAY)

          clearTimeout(this._animTimer)
          this._animTimer = setTimeout(() => {
            this.boxMounted = false
            this.expanded = false
            this.widthPx = to
            this.animating = false
          }, ANIM_MS)
        })
      })
    },
    onFocusChange (focus) {
      if (this.animating) return
      if (focus) {
        this.expanded = true
        this.panelVisible = true
        this.triggerActive = false
      } else if (!this.hasValue) {
        this.collapse()
      }
    },
    search (val) {
      const value = { ...val }
      Object.keys(value).map(key => {
        if (key.includes('__condition_')) {
          delete value[key]
        }
      })
      this.value = value
      if (R.isEmpty(value)) {
        this.$router.push(path)
        return
      }
      const searchPath = `${path}?${qs.stringify(value)}`
      this.$router.push(searchPath)
    },
    handleCloseSidebar () {
      this.$store.dispatch('common/updateObject', {
        name: 'sidebar',
        data: {
          drawerVisible: false,
        },
      })
    },
    defaultSearchKey (search) {
      if (regexp.isIPv4(search)) {
        return 'ip'
      } else if (regexp.isUUID(search)) {
        return 'id'
      } else {
        return 'name'
      }
    },
  },
}
</script>

<style lang="less" scoped>
.global-search {
  position: relative;
  height: 40px;
  min-width: 0;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(0.2, 0, 0, 1);
}

.global-search-trigger {
  position: absolute;
  left: 0;
  top: 4px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  margin: 0;
  padding: 0 22px 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #595959;
  cursor: pointer;
  -webkit-font-smoothing: antialiased;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);

  &.is-active {
    opacity: 1;
    pointer-events: auto;
  }

  &:hover {
    background: #f3f4f6;
    color: var(--ant-color-primary, #1890ff);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--ant-color-primary, #1890ff) 35%, transparent);
    outline-offset: 1px;
  }
}

.global-search-trigger-icon {
  display: block;
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: inherit;
  opacity: 1;
  transform: translateY(-1px);
}

.global-search-trigger-label {
  flex: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1;
  text-align: left;
  color: inherit;
}

.global-search-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: 4px;
  z-index: 1;
  height: 32px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);

  &.is-active {
    opacity: 1;
    pointer-events: auto;
  }

  :deep(.search-box-wrap) {
    width: 100%;
    box-sizing: border-box;
    min-height: 32px !important;
    height: 32px !important;
    margin: 0;
  }
}
</style>
