<template>
  <div class="network-config">
    <div class="d-flex align-items-start mb-2" v-for="(item, i) in networkList" :key="item.key">
      <a-form-model-item
        class="w-100 mb-0 mr-2"
        :prop="`networkIps.${item.key}`"
        :rules="ipRules(item.key)">
        <a-input
          :placeholder="$t('network.text_217')"
          v-model:value="networkIps[item.key]"
          @update:value="val => onIpInput(val, i)" />
      </a-form-model-item>
      <a-button v-if="networkList.length > 1" shape="circle" icon="minus" size="small" @click="decrease(item.key, i)" class="mt-2 ml-1" />
    </div>
    <div class="d-flex align-items-center">
      <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
      <a-button type="link" @click="add">{{$t('network.text_670')}}</a-button>
    </div>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import { validate } from '@/utils/validate'

export default {
  name: 'ReservedIPAddress',
  props: {
    model: {
      type: Object,
      required: true,
    },
    networkIpsProp: {
      type: String,
      default: 'networkIps',
    },
    /** 异步校验：检查 IP 是否已被预留 / 表单内重复 */
    checkIp: {
      type: Function,
    },
  },
  data () {
    return {
      networkList: [],
    }
  },
  computed: {
    networkIps () {
      return this.model[this.networkIpsProp] || {}
    },
  },
  created () {
    if (!this.model[this.networkIpsProp]) {
      this.model[this.networkIpsProp] = {}
    }
    this.add()
  },
  methods: {
    ipRules (key) {
      return [
        { required: true, message: this.$t('network.text_217') },
        { validator: this.IPValidator },
        ...(this.checkIp ? [{ validator: this.checkIp(key) }] : []),
      ]
    },
    IPValidator (rule, value, callback) {
      if ((validate(value, 'IPv4') === false || validate(value, 'IPv4').result === false) && (validate(value, 'IPv6') === false || validate(value, 'IPv6').result === false)) {
        callback(new Error(this.$t('network.text_301')))
      } else {
        callback()
      }
    },
    onIpInput (val, i) {
      const key = this.networkList[i].key
      this.networkList[i].ip = val
      this.networkIps[key] = val
    },
    ipToInt (ip) {
      const REG = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
      const result = REG.exec(ip)
      if (!result) return -1
      const ret = (parseInt(result[1]) << 24 |
        parseInt(result[2]) << 16 |
        parseInt(result[3]) << 8 |
        parseInt(result[4])) >>> 0
      return ret
    },
    intToIp (ipInt) {
      return [
        (ipInt >>> 24) & 0xFF,
        (ipInt >>> 16) & 0xFF,
        (ipInt >>> 8) & 0xFF,
        ipInt & 0xFF,
      ].join('.')
    },
    getNextIp (ip) {
      if (!ip) return ''
      const ipResult = validate(ip, 'IPv4')
      if (ipResult === false || ipResult.result === false) {
        return ''
      }
      const ipInt = this.ipToInt(ip)
      if (ipInt === -1) return ''
      const nextInt = ipInt + 1
      if (nextInt > 0xFFFFFFFF) return ''
      return this.intToIp(nextInt)
    },
    add () {
      const uid = uuid()
      let nextIp = ''
      if (this.networkList.length > 0) {
        const lastIndex = this.networkList.length - 1
        const lastItem = this.networkList[lastIndex]
        const lastFieldValue = this.networkIps[lastItem.key] || lastItem.ip
        if (lastFieldValue) {
          nextIp = this.getNextIp(lastFieldValue)
        }
      }
      const item = {
        key: uid,
        ip: nextIp,
      }
      this.networkList.push(item)
      this.networkIps[uid] = nextIp
    },
    decrease (uid, index) {
      this.networkList.splice(index, 1)
      delete this.networkIps[uid]
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../../../src/styles/less/theme';

.network-config {
  .network-count-tips {
    .remain-num {
      color: @primary-color;
    }
  }
}
</style>
