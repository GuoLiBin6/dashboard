<template>
  <div class="port-mapping">
    <a-form-item class="mb-0" :extra="(resolvedImportCluster && serviceType === 'external') ? $t('k8s.text_91') : ''">
      <a-radio-group v-model:value="serviceType" @change="onServiceTypeChange">
        <a-radio-button v-if="!ignoreNone" value="none">{{$t('k8s.text_75')}}</a-radio-button>
        <a-radio-button value="internal">{{$t('k8s.text_92')}}</a-radio-button>
        <a-radio-button value="external">{{$t('k8s.text_93')}}</a-radio-button>
        <a-radio-button value="nodePort">{{$t('k8s.node_port')}}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <div
      v-if="!resolvedImportCluster && serviceType === 'external' && isAdminMode"
      class="mt-3">
      <lb-cluster
        :form="form"
        :model="model" />
    </div>
    <div
      v-if="!resolvedImportCluster && serviceType === 'external'"
      class="mt-3">
      <lb-network
        :vpc-id="vpcId"
        :form="form"
        :model="model" />
    </div>
    <div class="mt-3" v-if="serviceType !== 'none'">
      <div class="d-flex mb-3" v-for="(item, i) in portList" :key="item.key">
        <port :port-key="item.key" :protocolDisabled="getProtocolDisabled(i)" :serviceType="serviceType" :form="form" :model="model" @protocolChange="protocolChange" />
        <a-button v-if="portList.length > 1" type="danger" shape="circle" icon="delete" @click="del(item)" class="mt-1 ml-2" />
      </div>
      <a-button type="primary" icon="plus" class="mt-1" @click="add">{{$t('k8s.text_94')}}</a-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { uuid } from '@/utils/utils'
import { setBracketValue } from '@/utils/bracketModel'
import Port from './Port'
import LbCluster from './LbCluster'
import LbNetwork from './LbNetwork'
import { SERVICE_TYPE_FIELD } from './fields'
export default {
  name: 'K8SPortMapping',
  components: {
    Port,
    LbCluster,
    LbNetwork,
  },
  props: {
    form: {
      type: Object,
      default: null,
    },
    /** a-form-model：与 field 动态 key 对齐的受控对象（通常为 form.fd） */
    model: {
      type: Object,
      required: true,
    },
    clusterObj: {
      type: Object,
      default: () => ({}),
    },
    /** 父级可直接传入；否则从 clusterObj.mode 推断 */
    isImportCluster: {
      type: Boolean,
      default: undefined,
    },
    ignoreNone: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      serviceTypeField: SERVICE_TYPE_FIELD,
      serviceType: 'internal',
      portList: [
        { key: uuid() },
      ],
      currentProtocol: 'TCP',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode']),
    resolvedImportCluster () {
      if (typeof this.isImportCluster === 'boolean') return this.isImportCluster
      return this.clusterObj?.mode === 'import'
    },
    vpcId () {
      return this.clusterObj?.vpc_id
    },
  },
  mounted () {
    if (this.model[this.serviceTypeField] !== undefined) {
      this.serviceType = this.model[this.serviceTypeField]
    }
    this.syncServiceType()
  },
  methods: {
    writeFields (vals) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach((key) => {
        setBracketValue(this, this.model, key, vals[key])
      })
    },
    syncServiceType () {
      this.writeFields({
        [this.serviceTypeField]: this.serviceType,
      })
    },
    onServiceTypeChange () {
      this.syncServiceType()
    },
    add () {
      const key = uuid()
      this.portList.push({ key })
      this.$nextTick(() => {
        this.writeFields({
          [`protocols[${key}]`]: this.currentProtocol,
        })
      })
    },
    del (item) {
      const index = this.portList.findIndex(val => val.key === item.key)
      this.portList.splice(index, 1)
    },
    getProtocolDisabled (i) {
      if (i > 0 && this.serviceType === 'external') {
        return true
      }
      return false
    },
    protocolChange (val) {
      this.currentProtocol = val
      const value = {}
      this.portList.forEach(v => {
        value[`protocols[${v.key}]`] = val
      })
      this.writeFields(value)
    },
    /** Port Form.Item 已绑 name+rules，由父 formRef.validate 展示红字 */
    async validate () {
      return true
    },
  },
}
</script>

<style lang="less" scoped>
.port-mapping {
  /* 避免 ant-form-item mb-0 把下方区块顶死 */
  :deep(.ant-form-item) {
    margin-bottom: 0;
  }
}
</style>
