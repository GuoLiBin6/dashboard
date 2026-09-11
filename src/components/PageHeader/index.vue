<template>
  <div class="page-header" :class="hasTitle ? ['d-flex', 'align-items-center'] : []">
    <slot name="title" />
    <h3 v-if="hasTitle" class="page-header__title">{{ title }}</h3>
    <div class="mini-title mb-2" v-if="miniTitle">
      {{ miniTitle }}
    </div>
    <template v-if="tabs">
      <div class="ml-4 position-relative h-100 page-header__tabs-wrap" style="flex: 1 1 auto">
        <a-tabs
          :activeKey="currentTab"
          class="page-header-tabs"
          :animated="false"
          :tab-bar-style="{ padding: '0 30px', marginBottom: 0, width: '100%' }"
          size="large"
          @change="handleTabChange">
          <a-tab-pane v-for="item of tabs" :key="item.key" :tab="item.label" />
        </a-tabs>
      </div>
    </template>
    <slot name="res-status-tab" />
    <div v-if="isShowResStatusTab" style="position: absolute; right: 0; top: 10px;">
      <res-status-tab
        :status-opts="statusOpts"
        @click="statusClickHandle" />
    </div>
  </div>
</template>

<script>
import ResStatusTab from '@/sections/ResStatusTab'

export default {
  name: 'PageHeader',
  components: {
    ResStatusTab,
  },
  props: {
    title: {
      type: [String, Number],
    },
    miniTitle: {
      type: String,
    },
    tabs: Array,
    currentTab: String,
    isShowResStatusTab: {
      type: Boolean,
      default: false,
    },
    statusOpts: Array,
    statusClickHandle: Function,
  },
  computed: {
    // 避免仅依赖 v-if="title"：空串、仅空白、或 flex 叠盖导致「看不见标题」
    hasTitle () {
      const t = this.title
      if (t == null || t === '') return false
      return String(t).trim() !== ''
    },
  },
  methods: {
    handleTabChange (val) {
      this.$emit('update:currentTab', val)
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../src/styles/less/theme';

.page-header {
  height: 60px;
  position: relative;
  .page-header__title {
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    max-width: 100%;
    font-size: 24px;
    line-height: 1.3;
    color: @heading-color;
    margin: 0;
    padding: 0;
    font-weight: @font-weight-strong;
  }
  .page-header__tabs-wrap {
    min-width: 0;
  }
  &::before {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    content: "";
    box-shadow: inset 0 -1px 0 0 @border-color-base;
    opacity: .3;
  }
  .mini-title {
    font-size: 12px;
    color: @text-color-secondary;
  }
}
.page-header-tabs {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  :deep(.ant-tabs-bar) {
    border-bottom: 0;
  }
  :deep(.ant-tabs-nav .ant-tabs-tab) {
    padding: 16px 16px 20px 16px;
    font-weight: @font-weight-strong;
    color: @text-color;
  }
  :deep(.ant-tabs-nav .ant-tabs-tab-active) {
    color: @heading-color;
  }
  :deep(.ant-tabs-nav-wrap) {
    margin-bottom: 0;
  }
}
</style>
