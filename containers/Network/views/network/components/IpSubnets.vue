<template>
  <div>
    <div class="ip-subnets-item" v-for="(item, i) in ipSubnets" :key="item.key">
      <ip-subnet
        class="ip-subnets-item__block"
        showIpv6
        isButtonHide
        :fields="genFields(item.key)"
        :model="model" />
      <a-button
        shape="circle"
        icon="minus"
        size="small"
        class="ip-subnets-item__remove"
        v-if="!hiddenDeleteAction && ipSubnets.length > 1"
        @click="decrease(i)" />
    </div>
    <div class="d-flex align-items-center" v-if="!hiddenAddAction && remain > 0">
      <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
      <a-button type="link" @click="add">{{$t('network.text_612')}}</a-button>
      <span class="count-tips">{{$t('network.text_169')}}<span class="remain-num">{{ remain }}</span>{{$t('network.text_170')}}</span>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import IpSubnet from '@/sections/IpSubnet'
import { uuid } from '@/utils/utils'
import { buildIpSubnetsFactories } from '@/sections/IpSubnet/ipSubnetsFields'

export default {
  name: 'IpSubnets',
  components: {
    IpSubnet,
  },
  props: {
    fieldFactories: {
      type: Object,
      default: null,
      validator: val => {
        if (!val) return true
        const fields = ['startip', 'endip', 'netmask', 'gateway', 'vlan']
        return fields.every(f => R.is(Function, val[f]))
      },
    },
    factoryPreset: {
      type: String,
      default: 'network',
    },
    hiddenAddAction: {
      type: Boolean,
      default: false,
    },
    hiddenDeleteAction: {
      type: Boolean,
      default: false,
    },
    /** a-form-model：透传 form.fd 给 IpSubnet 双写 */
    model: {
      type: Object,
      default: null,
    },
  },
  data () {
    return {
      ipSubnets: [{ key: uuid() }],
    }
  },
  computed: {
    remain () {
      const remain = 6 - this.ipSubnets.length
      return Math.max(remain, 0)
    },
    rowFactories () {
      return this.fieldFactories || buildIpSubnetsFactories(this.factoryPreset, {
        validateIpv4: this.$validate('IPv4'),
        validateIpv6: this.$validate('IPv6'),
        validateResourceName: this.$validate('resourceName'),
      })
    },
  },
  methods: {
    genFields (uid) {
      const ret = {}
      R.forEachObjIndexed((value, key) => {
        ret[key] = value(uid)
      }, this.rowFactories)
      return ret
    },
    add () {
      this.$emit('clear-error')
      const key = uuid()
      this.ipSubnets.push({
        key,
      })
    },
    decrease (index) {
      this.ipSubnets.splice(index, 1)
    },
    async validate () {
      const children = this.$children || []
      for (const child of children) {
        if (typeof child.validate === 'function') {
          await child.validate()
        }
      }
      return true
    },
  },
}
</script>

<style lang="less" scoped>
.ip-subnets-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.ip-subnets-item__block {
  flex: 1;
  min-width: 0;
}

.ip-subnets-item__remove {
  flex-shrink: 0;
  margin-top: 20px;
}
</style>
