<template>
  <div>
    <page-header
     :title="$t('compute.text_92')"
     :tabs="cloudEnvOptions"
     v-model:currentTab="cloudEnv"
     isShowResStatusTab
     :status-opts="statusOpts"
     :status-click-handle="statusClickHandle" />
    <page-body>
      <baremetal-list
        :id="listId"
        :cloud-env="cloudEnv"
        :filterParams="filterParams"
        statusResKey="server"
        @resStatisticsChange="resStatisticsChange" />
    </page-body>
  </div>
</template>

<script>
import ResStatisticsV2Mixin from '@/mixins/resStatisticsV2Mixin'
import { getCloudEnvOptions } from '@/utils/common/hypervisor'
import BaremetalList from './components/List'

export default {
  name: 'BaremetalIndex',
  components: {
    BaremetalList,
  },
  mixins: [ResStatisticsV2Mixin],
  data () {
    return {
      listId: 'BaremetalList',
      cloudEnv: '',
    }
  },
  computed: {
    cloudEnvOptions: () => {
      return getCloudEnvOptions('compute_engine_brands').filter(val => ['', 'onpremise', 'private'].includes(val.key))
    },
  },
}
</script>
