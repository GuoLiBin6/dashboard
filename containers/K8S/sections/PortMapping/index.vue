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
    <lb-cluster
      v-if="!resolvedImportCluster && serviceType === 'external' && isAdminMode"
      :form="form"
      :model="model" />
    <lb-network
      v-if="!resolvedImportCluster && serviceType === 'external'"
      :vpc-id="vpcId"
      :form="form"
      :model="model" />
    <div class="mt-3" v-if="serviceType !== 'none'">
      <div class="d-flex" v-for="(item, i) in portList" :key="item.key">
        <port :port-key="item.key" :protocolDisabled="getProtocolDisabled(i)" :serviceType="serviceType" :form="form" :model="model" @protocolChange="protocolChange" />
        <a-button v-if="portList.length > 1" type="danger" shape="circle" icon="delete" @click="del(item)" class="mt-1 ml-2" />
      </div>
      <a-button type="primary" icon="plus" @click="add">{{$t('k8s.text_94')}}</a-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { uuid } from '@/utils/utils'
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import Port from './Port'
import LbCluster from './LbCluster'
import LbNetwork from './LbNetwork'
import {
  SERVICE_TYPE_FIELD,
  PORT_FIELD_FACTORIES,
  PORT_FIELD_INITIAL,
  portFieldRules,
} from './fields'
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
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          rule.validator(rule, value, (err) => {
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          })
          return
        }
        resolve()
      })
    },
    async runRules (rules, value) {
      for (const rule of rules || []) {
        await this.runFieldRule(rule, value)
      }
    },
    async validate () {
      if (this.serviceType === 'none') return true
      for (const item of this.portList) {
        for (const key of Object.keys(PORT_FIELD_FACTORIES)) {
          if (key === 'nodePort' && this.serviceType !== 'nodePort') continue
          const name = PORT_FIELD_FACTORIES[key](item.key)
          const value = getBracketValue(this.model, name)
          await this.runRules(portFieldRules(key), value !== undefined ? value : PORT_FIELD_INITIAL[key])
        }
      }
      return true
    },
  },
}
</script>
