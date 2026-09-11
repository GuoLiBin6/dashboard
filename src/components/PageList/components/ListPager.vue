<template>
  <div class="page-list-pager d-flex align-items-center justify-content-start">
    <div class="page-list-pager__nav d-flex align-items-center">
      <a-button
        type="text"
        size="small"
        class="pager-icon-btn"
        :disabled="isFirst"
        :aria-label="$t('common.page_list_pager_first')"
        @click="goFirst">
        <icon type="double-left" />
      </a-button>
      <a-button
        type="text"
        size="small"
        class="pager-icon-btn"
        :disabled="isFirst"
        :aria-label="$t('common.page_list_pager_prev')"
        @click="goPrev">
        <icon type="left" />
      </a-button>
      <a-input
        v-model:value="jumpInput"
        size="small"
        class="pager-jump-input"
        @pressEnter="commitJump"
        @blur="commitJump" />
      <span class="pager-page-count">/ {{ pageCount }}</span>
      <a-button
        type="text"
        size="small"
        class="pager-icon-btn"
        :disabled="isLast"
        :aria-label="$t('common.page_list_pager_next')"
        @click="goNext">
        <icon type="left" style="transform: rotate(180deg);" />
      </a-button>
      <a-button
        type="text"
        size="small"
        class="pager-icon-btn"
        :disabled="isLast"
        :aria-label="$t('common.page_list_pager_last')"
        @click="goLast">
        <icon type="double-left" style="transform: rotate(180deg);" />
      </a-button>
    </div>
    <a-select
      class="pager-size-select"
      size="small"
      :value="pageSize"
      :options="sizeOptions"
      popup-class-name="page-list-pager-size-dropdown"
      :dropdown-match-select-width="false"
      @update:value="onSizeChange">
      <template #suffixIcon>
        <icon type="pull-down" class="pager-size-select-suffix" width="10" height="10" />
      </template>
    </a-select>
    <span class="pager-stats">{{ $t('common.page_list_count', [selectedCount, total]) }}</span>
    <div v-if="$slots.extra" class="page-list-pager__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageListPager',
  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    pageSize: {
      type: Number,
      default: 10,
    },
    total: {
      type: Number,
      default: 0,
    },
    pageSizes: {
      type: Array,
      default: () => [10, 15, 20, 50, 100],
    },
    selectedCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ['change-page', 'change-size'],
  data () {
    return {
      jumpInput: '1',
    }
  },
  computed: {
    pageCount () {
      const ps = Math.max(1, Number(this.pageSize) || 10)
      const t = Math.max(0, Number(this.total) || 0)
      return Math.max(1, Math.ceil(t / ps) || 1)
    },
    isFirst () {
      return this.currentPage <= 1
    },
    isLast () {
      return this.currentPage >= this.pageCount
    },
    sizeOptions () {
      const sizes = Array.isArray(this.pageSizes) && this.pageSizes.length
        ? [...new Set(this.pageSizes)].sort((a, b) => a - b)
        : [10, 15, 20, 50, 100]
      return sizes.map((s) => ({
        value: s,
        label: this.$t('common.page_list_per_page', [s]),
      }))
    },
  },
  watch: {
    currentPage: {
      immediate: true,
      handler (v) {
        const n = Number(v) || 1
        this.jumpInput = String(n)
      },
    },
  },
  methods: {
    goFirst () {
      if (!this.isFirst) this.$emit('change-page', 1)
    },
    goPrev () {
      if (!this.isFirst) this.$emit('change-page', this.currentPage - 1)
    },
    goNext () {
      if (!this.isLast) this.$emit('change-page', this.currentPage + 1)
    },
    goLast () {
      if (!this.isLast) this.$emit('change-page', this.pageCount)
    },
    commitJump () {
      let n = parseInt(String(this.jumpInput).trim(), 10)
      if (Number.isNaN(n)) {
        this.jumpInput = String(this.currentPage)
        return
      }
      n = Math.min(this.pageCount, Math.max(1, n))
      this.jumpInput = String(n)
      if (n !== this.currentPage) this.$emit('change-page', n)
    },
    onSizeChange (val) {
      this.$emit('change-size', val)
    },
  },
}
</script>

<style lang="less" scoped>
@pager-fg: #606266;
@pager-row-h: 24px;
@pager-inner-h: 22px; // 24px 含 1px 上下边框
@pager-fs: 12px;
@pager-radius: 4px;
@pager-select-suffix: 10px;

.page-list-pager {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: flex-start;
  flex-wrap: nowrap;
  gap: 12px;
  padding: 8px 0 4px;
  font-size: 12px;
  color: @pager-fg;
}

.page-list-pager__nav {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 2px;
}

.pager-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: @pager-row-h;
  padding: 0 4px;
  color: @pager-fg !important;
}

.pager-icon-btn:disabled {
  color: @pager-fg;
  opacity: 0.35;
}

.pager-icon-btn :deep(.oc-icon) {
  color: @pager-fg;
  vertical-align: middle;
}

// a-input 的 class 可能在外层，只统一高度，不改宽度
.pager-jump-input {
  width: 44px;
  margin: 0 4px;
  height: @pager-row-h !important;
  min-height: @pager-row-h !important;
  box-sizing: border-box;
  font-size: @pager-fs;
  color: @pager-fg;
  text-align: center;
}

.pager-jump-input.ant-input,
.pager-jump-input :deep(.ant-input) {
  height: @pager-row-h !important;
  min-height: @pager-row-h !important;
  line-height: @pager-inner-h !important;
  padding: 0 6px !important;
  box-sizing: border-box;
  border-radius: @pager-radius;
  font-size: @pager-fs !important;
  color: @pager-fg;
  text-align: center;
}

.pager-page-count {
  display: inline-flex;
  align-items: center;
  height: @pager-row-h;
  margin-right: 4px;
  color: @pager-fg;
  line-height: 1;
  white-space: nowrap;
}

.pager-size-select {
  // antd Select 默认 width:100%，在分页行里会撑满整行
  width: 110px !important;
  min-width: 110px;
  max-width: 140px;
  flex: 0 0 auto;
  height: @pager-row-h;
  font-size: @pager-fs;
}

.pager-size-select :deep(.ant-select-selector) {
  display: flex !important;
  align-items: center !important;
  min-height: @pager-row-h !important;
  height: @pager-row-h !important;
  // 右侧留给箭头，避免文字挤占
  padding: 0 22px 0 8px !important;
  border-radius: @pager-radius !important;
  font-size: @pager-fs !important;
  box-sizing: border-box !important;
}

.pager-size-select :deep(.ant-select-selection-item),
.pager-size-select :deep(.ant-select-selection-placeholder) {
  display: inline-flex !important;
  align-items: center !important;
  line-height: @pager-inner-h !important;
  height: @pager-inner-h !important;
  max-height: @pager-inner-h !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: @pager-fs !important;
  color: @pager-fg !important;
  font-weight: normal;
}

.pager-size-select :deep(.ant-select-selection-item::after),
.pager-size-select :deep(.ant-select-selection-placeholder::after) {
  line-height: @pager-inner-h !important;
}

.pager-size-select :deep(.ant-select-selection-search-input) {
  font-size: @pager-fs !important;
  line-height: @pager-inner-h !important;
  color: @pager-fg;
}

// 强制垂直居中（覆盖 ant 默认 margin/line-height 导致的偏下）
.pager-size-select :deep(.ant-select-arrow),
.pager-size-select :deep(.ant-select-suffix) {
  position: absolute !important;
  top: 50% !important;
  inset-inline-end: 8px !important;
  right: 8px !important;
  margin: 0 !important;
  padding: 0 !important;
  height: @pager-select-suffix !important;
  width: @pager-select-suffix !important;
  line-height: 1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transform: translateY(-50%) !important;
  color: fade(@pager-fg, 65%);
  font-size: @pager-select-suffix;
  pointer-events: none;
}

.pager-size-select-suffix {
  display: block;
  width: @pager-select-suffix !important;
  height: @pager-select-suffix !important;
  margin: 0;
  color: inherit;
  transform: none;
}

.pager-stats {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: @pager-row-h;
  font-size: @pager-fs;
  line-height: 1;
  color: @pager-fg;
  white-space: nowrap;
}

.page-list-pager__extra {
  display: inline-flex;
  align-items: center;
  min-height: @pager-row-h;
  font-size: @pager-fs;
  color: @pager-fg;
  max-width: 100%;
}

.page-list-pager__extra :deep(.table-overview) {
  z-index: 10;
  font-size: @pager-fs;
  color: @pager-fg;
}
</style>

<!-- 下拉挂载在 body，需非 scoped -->
<style lang="less">
@pager-fg: #606266;
@pager-fs: 12px;

.page-list-pager-size-dropdown.ant-select-dropdown {
  font-size: @pager-fs;

  .ant-select-item-option:not(.ant-select-item-option-disabled) {
    color: @pager-fg;
    font-size: @pager-fs;
    font-weight: normal;
  }

  .ant-select-item-option-content {
    color: inherit;
    font-size: @pager-fs;
  }

  .ant-select-item-option-active:not(.ant-select-item-option-disabled),
  .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    color: @pager-fg;
  }
}
</style>
