<template>
  <div>
    <a-form-item
      :wrapperCol="{ span: 24 }"
      class="mb-0 mr-1">
      <base-select
        class="w-100"
        filterable
        :params="params"
        :value="fieldVal(LB_NETWORK_FIELD)"
        @change="onNetworkSelect"
        v-model:item="selectNet"
        resource="networks"
        :selectProps="{ placeholder: $t('k8s.lb.select_network') }" />
      <a-button type="link" class="mr-1 mt-1" @click="triggerConfigIp">{{$t('compute.text_198')}}</a-button>
    </a-form-item>
    <template v-if="configIp">
      <a-form-item class="mb-0" :wrapperCol="{ span: 24 }">
        <a-input
          style="width: 300px"
          :value="fieldVal('loadBalancerAddress')"
          @update:value="v => fieldSet('loadBalancerAddress', v)"
          @change="ipChange"
          :placeholder="$t('k8s.lb.input_address')" />
      </a-form-item>
    </template>
  </div>
</template>

<script>
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import { LB_NETWORK_FIELD } from './fields'

export default {
  name: 'K8SPortMappingLbNetwork',
  props: {
    vpcId: {
      type: String,
      required: true,
    },
    form: {
      type: Object,
      default: null,
    },
    model: {
      type: Object,
      default: null,
    },
  },
  data () {
    return {
      selectNet: {},
      inputAddr: '',
      configIp: false,
      params: {
        cloudregion: 'default',
        scope: this.$store.getters.scope,
        vpc_id: this.vpcId,
      },
    }
  },
  methods: {
    fieldVal (name) {
      const v = getBracketValue(this.model, name)
      return v !== undefined ? v : undefined
    },
    fieldSet (name, value) {
      if (name) setBracketValue(this, this.model, name, value)
    },
    onNetworkSelect (v) {
      this.fieldSet(LB_NETWORK_FIELD, v)
      this.networkChange()
    },
    networkChange () {},
    ipChange (e) {
      this.inputAddr = e.target.value
      this.networkChange()
    },
    triggerConfigIp () {
      this.configIp = !this.configIp
    },
  },
}
</script>
