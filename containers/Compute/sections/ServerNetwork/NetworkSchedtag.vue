<template>
  <div class="network-schedtag">
    <div class="d-flex align-items-start mb-2" v-for="(item, i) in schedtagList" :key="item.key">
      <a-tag class="network-nic-tag mr-1">{{ isBonding ? 'bond' : $t('compute.text_193')}}{{i}}</a-tag>
      <schedtag-policy
        :model="model"
        :item-key="item.key"
        schedtag-root="networkSchedtags"
        policy-root="networkPolicys"
        :schedtag-params="{ ...schedtagParams, $t: `net-schedtag-${i}` }"
        :policyReactInSchedtag="false" />
      <template v-if="showDeviceConfig">
        <template v-if="item.deviceShow">
          <a-form-item class="mb-0 ml-1">
            <oc-select
              :value="fieldVal(networkFieldMap.devices(item.key))"
              @change="v => fieldSet(networkFieldMap.devices(item.key), v)"
              :data="gpuOptions"
              :placeholder="$t('compute.sriov_device_tips')" />
          </a-form-item>
          <a-button type="link" class="mt-1" @click="triggerShowDevice(item)">{{$t('compute.text_135')}}</a-button>
        </template>
        <a-button v-else type="link" class="mt-1" @click="triggerShowDevice(item)">{{ $t('compute.config_sriov_net') }}</a-button>
      </template>
      <a-button shape="circle" icon="minus" size="small" @click="decrease(item.key, i)" class="mt-2" />
    </div>
    <div class="d-flex align-items-center" v-if="schedtagCountRemaining > 0">
      <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
      <a-button type="link" @click="add">{{$t('compute.text_183')}}</a-button>
      <span class="network-count-tips">{{$t('compute.text_130')}}<span class="remain-num">{{ schedtagCountRemaining }}</span>{{$t('compute.text_200')}}</span>
    </div>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import { SCHEDTAG_POLICY_OPTIONS } from '@/constants'
import SchedtagPolicy from '@/sections/SchedtagPolicy'
import nicModelMixin from './nicModelMixin'
import { resolveNetworkSchedtagFieldMap } from './fields'

const SCHED_MAP_ROOTS = ['networkSchedtags', 'networkPolicys', 'networkDevices']

export default {
  name: 'NetworkSchedtag',
  components: {
    SchedtagPolicy,
  },
  mixins: [nicModelMixin],
  props: {
    schedtagParams: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    form: {
      type: Object,
      required: true,
    },
    /** a-form-model end-state：嵌套 maps 写在 form.fd（model）上 */
    model: {
      type: Object,
      required: true,
    },
    limit: {
      type: Number,
      default: 8, // 默认支持最多 8 个ip子网
    },
    isBonding: {
      type: Boolean,
      default: false,
    },
    showDeviceConfig: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      schedtagList: [],
      policyOpts: SCHEDTAG_POLICY_OPTIONS,
    }
  },
  computed: {
    networkFieldMap () {
      return resolveNetworkSchedtagFieldMap()
    },
    schedtagCountRemaining () {
      return this.limit - this.schedtagList.length
    },
    gpuOptions () {
      const specs = this.form.fi.capability.specs || {}
      const data = specs.isolated_devices || {}
      const ret = [{ key: 'xx', label: 'xx' }]
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const item = data[key]
          if (item.dev_type.startsWith('NIC')) {
            ret.push({
              ...item,
              key: `${item.model}`,
              label: `${item.model}`,
            })
          }
        }
      }
      return ret
    },
  },
  created () {
    SCHED_MAP_ROOTS.forEach(root => this.ensureMap(root))
    this.add()
  },
  methods: {
    fieldVal (fieldTuple) {
      return this.nicFieldVal(fieldTuple)
    },
    fieldSet (fieldTuple, value) {
      this.nicFieldSet(fieldTuple, value)
    },
    writeFields (vals) {
      this.nicWriteFields(vals)
    },
    clearSchedMapsForKey (key) {
      if (!key) return
      SCHED_MAP_ROOTS.forEach((root) => {
        if (this.model[root] && Object.prototype.hasOwnProperty.call(this.model[root], key)) {
          this.$delete(this.model[root], key)
        }
      })
    },
    async validate () {
      for (const item of this.schedtagList) {
        const schedtag = this.nicField('networkSchedtags', item.key)
        if (!schedtag) throw new Error(this.$t('compute.text_123'))
        const policy = this.nicField('networkPolicys', item.key)
        if (!policy) throw new Error(this.$t('common_256'))
        if (item.deviceShow) {
          const device = this.nicField('networkDevices', item.key)
          await this.runFieldRule({ required: true, message: this.$t('compute.sriov_device_tips') }, device)
        }
      }
      return true
    },
    initData (data) {
      this.schedtagList = data.map(schedtag => {
        const item = schedtag.schedtags[0]
        const obj = {
          key: uuid(),
          deviceShow: false,
          schedtag: item.id,
          policy: item.strategy,
          device: item.sriov_device && item.sriov_device.model,
        }
        if (item.sriov_device && item.sriov_device.model) {
          obj.deviceShow = true
        }
        return obj
      })
      this.$nextTick(() => {
        for (const item of this.schedtagList) {
          this.setNicField('networkSchedtags', item.key, item.schedtag)
          this.setNicField('networkPolicys', item.key, item.policy)
          if (item.device) {
            setTimeout(() => {
              this.setNicField('networkDevices', item.key, item.device)
            }, 2000)
          }
        }
      })
    },
    add () {
      const uid = uuid()
      SCHED_MAP_ROOTS.forEach(root => this.ensureMap(root))
      this.schedtagList.push({
        key: uid,
        deviceShow: false,
      })
    },
    decrease (uid, index) {
      this.clearSchedMapsForKey(uid)
      this.schedtagList.splice(index, 1)
    },
    triggerShowDevice (item) {
      item.deviceShow = !item.deviceShow
      this.$emit('optionalChange', { flag: 'device', key: item.key, show: item.deviceShow })
    },
  },
}
</script>

<style lang="less" scoped>
.network-schedtag {
  .network-nic-tag.ant-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 32px;
    margin-top: 0 !important;
    padding: 0 10px;
    line-height: 30px;
    font-size: 14px;
    border-radius: 6px;
    color: var(--ant-color-primary, #1890ff);
    background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, #fff);
    border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 40%, #fff);
  }
  .network-count-tips {
    .remain-num {
      color: var(--ant-color-primary, #1890ff);
    }
  }
}
</style>
