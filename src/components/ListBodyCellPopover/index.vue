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
    /** 可选下限；勿用大 minWidth 强撑，内容少时会显得过宽 */
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

<style lang="scss" scoped>
.list-body-cell-popover-container {
  width: fit-content;
  max-width: 80vw;
  max-height: 60vh;
  overflow: auto;
}
.list-body-cell-popover-text {
  color: var(--antd-wave-shadow-color);
}
</style>
