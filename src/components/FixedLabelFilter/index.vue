<template>
  <div :class="['profilter-wrapper', 'd-flex', className]">
    <div class="profilter-label">{{ label }}</div>
    <div class="profilter-content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'FixedLabelFilter',
  props: {
    label: String,
    class: String,
  },
  computed: {
    className () {
      return this.class
    },
  },
}
</script>

<style lang="less" scoped>
.profilter-wrapper {
  align-items: stretch;
  min-width: 0;

  .profilter-label {
    flex: 0 0 auto;
    border-left: 1px solid #d9d9d9;
    border-top: 1px solid #d9d9d9;
    border-bottom: 1px solid #d9d9d9;
    border-radius: 6px 0 0 6px;
    line-height: 30px;
    padding: 0 10px;
    background: #f2f1f1;
    min-width: fit-content;
    height: 32px;
    box-sizing: border-box;
  }

  .profilter-content {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
  }

  /* 控件铺满剩余宽度，避免父级列/flex 中间留白 */
  :deep(.ant-select),
  :deep(.ant-input),
  :deep(.ant-input-affix-wrapper),
  :deep(.ant-input-number),
  :deep(.ant-picker),
  :deep(.ant-cascader),
  :deep(.base-select),
  :deep(.base-select-wrap),
  :deep(.oc-select) {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
  }

  /* 与标签衔接处改为直角，右侧保持圆角 */
  :deep(.ant-select .ant-select-selector),
  :deep(.ant-input),
  :deep(.ant-input-affix-wrapper),
  :deep(.ant-input-number),
  :deep(.ant-picker),
  :deep(.ant-cascader .ant-select-selector) {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }
}
</style>
