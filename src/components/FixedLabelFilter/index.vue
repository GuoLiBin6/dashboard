<template>
  <div :class="['profix-wrapper', 'd-flex', className]">
    <div class="profix-label">{{ label }}</div>
    <div class="profix-content">
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
.profix-wrapper {
  align-items: stretch;

  .profix-label {
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

  .profix-content {
    flex: 0 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
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
