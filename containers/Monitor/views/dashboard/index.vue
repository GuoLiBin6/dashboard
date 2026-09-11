<template>
  <div class="monitor-dashboard-page">
    <page-header :title="$t('monitor.dashboard.title')" />
    <page-body>
      <dashboard-index />
    </page-body>
  </div>
</template>

<script>
import DashboardIndex from './components'

export default {
  name: 'MonitorDashboardIndex',
  components: {
    DashboardIndex,
  },
}
</script>

<style scoped>
.monitor-dashboard-page {
  width: 100%;
}
.monitor-dashboard-page :deep(.page-body) {
  width: 100%;
}
</style>
