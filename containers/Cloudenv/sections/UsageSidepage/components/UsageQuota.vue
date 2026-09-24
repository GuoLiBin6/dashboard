<template>
  <div class="usage-quota" :class="{ 'is-template': isTemplate }">
    <div class="usage-quota__title">{{ title }}</div>
    <div class="usage-quota__value">{{ value }}</div>
  </div>
</template>

<script>
export default {
  name: 'UsageQuota',
  props: {
    title: {
      type: String,
    },
    value: {
      type: [Number, String],
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="scss" scoped>
.usage-quota {
  width: 100%;
  min-height: 84px;
  padding: 16px 18px;
  margin-bottom: 16px;
  box-sizing: border-box;
  border-radius: 8px;
  background: var(--oc-color-bg-container, #fff);
  border: 1px solid var(--oc-color-border-secondary, #e8e8e8);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    border-color: var(--oc-color-border, #d9d9d9);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &__title {
    font-size: 13px;
    line-height: 1.4;
    font-weight: 400;
    color: var(--oc-color-text-secondary, rgba(0, 0, 0, 0.55));
    -webkit-font-smoothing: antialiased;
  }

  &__value {
    margin-top: 8px;
    font-size: 22px;
    line-height: 1.3;
    font-weight: 600;
    color: var(--ant-color-primary, #1890ff);
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
  }

  &.is-template {
    box-shadow: none;
    border: 1px solid #e5e6eb;

    &:hover {
      box-shadow: none;
      border-color: #e5e6eb;
    }
  }
}
</style>
