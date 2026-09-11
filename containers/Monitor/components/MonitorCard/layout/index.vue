<template>
  <a-row class="monitor-card-layout" :class="card_style">
    <a-col :class="card_style" :span="24">
      <div :class="['monitor-overview-card', card_style]">
        <div>
          <slot name="header" />
        </div>
        <div :class="card_style">
          <slot>{{ '' }}</slot>
        </div>
        <div>
          <slot name="footer" />
        </div>
      </div>
    </a-col>
  </a-row>
</template>

<script>
export default {
  name: 'MonitorCardLayout',
  props: {
    card_style: {
      type: String,
    },
  },
}
</script>

<style lang="less" scoped>
.monitor-card-layout {
  width: 100%;
  display: block;
}
.monitor-overview-card {
  box-sizing: border-box;
  border: 1px solid #F1F1F1;
  border-radius: 6px;
  padding: 12px 16px;
  margin-left: 6px;
  margin-right: 6px;
  .header {
    font-weight: 500;
    .title-wrapper {
      .subtitle {
        font-size: 12px;
        color: #ccc;
      }
    }
  }
}
.no-border {
  border: none;
  margin-left: 0;
  margin-right: 0;
}
</style>
