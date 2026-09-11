<template>
  <div>
    <page-header :title="$t('compute.text_873')" :tabs="cloudEnvOptions" v-model:currentTab="cloudEnv" />
    <page-body>
      <servertemplate-list :id="listId" :cloud-env="cloudEnv" :cloudEnvOptions="cloudEnvOptions" />
    </page-body>
  </div>
</template>

<script>
import { getCloudEnvOptions } from '@/utils/common/hypervisor'
import ServertemplateList from './components/List'
export default {
  name: 'ServertemplateIndex',
  components: {
    ServertemplateList,
  },
  data () {
    return {
      listId: 'ServertemplateList',
      cloudEnvOptions: getCloudEnvOptions('compute_engine_brands'),
      cloudEnv: '',
    }
  },
}
</script>
