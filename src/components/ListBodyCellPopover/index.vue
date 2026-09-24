<template>
  <a-popover trigger="hover">
    <template #content>
      <div class="list-body-cell-popover-container" :style="containerStyle">
        <slot />
      </div>
    </template>
    <span class="list-body-cell-popover-text">{{ text }}</span>
  </a-popover>
</template>

<script>
import { LIST_BODY_CELL_POPOVER_STYLE } from '@/utils/common/listBodyCellPopover'

export default {
  name: 'ListBodyCellPopover',
  props: {
    text: {
      type: String,
      required: true,
    },
    /** 可选下限；与 fit-content 配合：内容少不低于此宽，内容多可继续撑开 */
    minWidth: {
      type: String,
    },
    maxWidth: {
      type: String,
      default: '80vw',
    },
    maxHeight: {
      type: String,
      default: '60vh',
    },
  },
  computed: {
    containerStyle () {
      const ret = {
        ...LIST_BODY_CELL_POPOVER_STYLE,
        maxWidth: this.maxWidth || LIST_BODY_CELL_POPOVER_STYLE.maxWidth,
        maxHeight: this.maxHeight || LIST_BODY_CELL_POPOVER_STYLE.maxHeight,
      }
      if (this.minWidth) {
        ret.minWidth = this.minWidth
      }
      return ret
    },
  },
}
</script>

<style lang="scss">
/* 非 scoped：手写 a-popover 也可挂同名 class，统一内容自适应 */
.list-body-cell-popover-container {
  width: fit-content;
  max-width: 80vw;
  max-height: 60vh;
  overflow: auto;
  box-sizing: border-box;

  // 表格铺满容器（吃满 minWidth）；列用 auto 按内容分配
  .table-lite-grid,
  .table-lite-grid__scroll {
    width: 100% !important;
    min-width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .table-lite-grid__table {
    table-layout: auto !important;
    width: 100% !important;
    min-width: 100% !important;
    box-sizing: border-box;
  }
  .table-lite-grid__td,
  .table-lite-grid__th {
    white-space: normal;
    word-break: break-word;
  }
  .table-lite-grid__td.is-ellipsis,
  .table-lite-grid__th.is-ellipsis {
    overflow: visible;
    text-overflow: unset;
    white-space: normal;
  }
  .text-truncate {
    overflow: visible !important;
    text-overflow: unset !important;
    white-space: normal !important;
    max-width: none !important;
  }
}
</style>

<style lang="scss" scoped>
.list-body-cell-popover-text {
  color: var(--antd-wave-shadow-color);
}
</style>
