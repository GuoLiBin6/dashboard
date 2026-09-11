<template>
  <div>
    <a-tabs :activeKey="currentComponent" @change="callback" :animated="false">
      <a-tab-pane v-for="obj of tabs" :key="obj.key" :tab="obj.label" />
    </a-tabs>
    <div class="mt-2">
      <keep-alive>
        <component
          :is="currentComponent"
          :getParams="params"
          :id="id"
          :resId="resId"
          :serverColumns="serverColumns"
          :data="data" />
      </keep-alive>
    </div>
  </div>
</template>

<script>
import NetworkList from '@Compute/views/networks/components/List'
import EipList from './EipList'

export default {
  name: 'NetworkIndex',
  components: {
    NetworkList,
    EipList,
  },
  props: {
    resId: String,
    getParams: {
      type: [Function, Object],
    },
    data: {
      type: Object,
      required: true,
    },
    serverColumns: {
      type: Array,
      default: () => ([]),
    },
  },
  data () {
    return {
      currentComponent: 'NetworkList',
      tabs: [
        {
          key: 'NetworkList',
          label: this.$t('compute.private_network'),
        },
        {
          key: 'EipList',
          label: this.$t('compute.text_107'),
        },
      ],
    }
  },
  computed: {
    id () {
      switch (this.currentComponent) {
        case 'NetworkList':
          return 'NetworkListForVminstanceSidepage'
        default:
          return 'EipListForVminstanceSidepage'
      }
    },
    params () {
      const params = {
        ...this.getParams,
      }
      if (this.currentComponent === 'NetworkList') {
        delete params.associate_id
      }
      return params
    },
  },
  methods: {
    callback (key) {
      this.currentComponent = key
    },
  },
}
</script>
