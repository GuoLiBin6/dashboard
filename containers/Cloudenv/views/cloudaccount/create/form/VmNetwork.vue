<template>
  <div>
    <a-alert :showIcon="false" banner>
      <template #message>
        {{$t('cloudenv.text_225')}}
        <div style="margin-left: 68px">{{$t('cloudenv.text_226')}}</div>
      </template>
   </a-alert>
    <a-form-model ref="formRef" class="mt-3" :model="form.fd" :rules="formRules">
      <a-divider orientation="left">{{$t('cloudenv.text_227')}}</a-divider>
      <a-form-model-item :label="$t('cloudenv.text_228')">
        <a-switch :checkedChildren="$t('cloudenv.text_84')" :unCheckedChildren="$t('cloudenv.text_85')" v-model:checked="configNetwork" />
      </a-form-model-item>
      <template v-if="configNetwork">
        <a-form-model-item :label="$t('cloudenv.text_184')" prop="name">
          <a-input v-model:value="form.fd.name" :placeholder="$t('validator.resourceName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_229')" class="mb-0">
          <cloudregion-vpc-wire
            ref="cloudregionVpcWireRef"
            :model="form.fd"
            :vpc-params="params.vpc"
            :cloudregion-params="params.cloudregion"
            :wire-params="params.wire"
            :vpcMapper="vpcMapper" />
        </a-form-model-item>
        <a-form-model-item>
          <template #label>{{$t('cloudenv.text_181')}}<help-tooltip class="ml-1" name="networkIpSubnets" /></template>
          <ip-subnets ref="ipSubnetsRef" :model="form.fd" />
        </a-form-model-item>
      </template>
    </a-form-model>
  </div>
</template>

<script>
import CloudregionVpcWire from '@/sections/CloudregionVpcWire'
import { isRequired } from '@/utils/validate'
import createMixin from './components/createMixin'
import IpSubnets from './components/IpSubnets'

function validateGateway (rule, value, callback) {
  const ipItems = value.split('.')
  const msg = this.$t('cloudenv.text_230')
  if (ipItems[ipItems.length - 1] === '0') {
    callback(msg)
  } else {
    callback()
  }
}

export default {
  name: 'VmNetworkCreate',
  components: {
    CloudregionVpcWire,
    IpSubnets,
  },
  mixins: [createMixin],
  provide () {
    return {
      form: this.form,
    }
  },
  data () {
    return {
      configNetwork: true,
      fieldMap: {
        name: {
          name: 'name',
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: this.$t('cloudenv.text_190') },
            { validator: this.$validate('resourceName') },
          ],
        },
        cloudregionVpcWire: {
          cloudregion: {
            name: 'cloudregion',
            rules: [
              { validator: isRequired(), message: this.$t('cloudenv.text_231') },
            ],
          },
          vpc: {
            name: 'vpc',
            rules: [
              { validator: isRequired(), message: this.$t('cloudenv.text_232') },
            ],
          },
          wire: {
            name: 'wire',
            rules: [
              { validator: isRequired(), message: this.$t('cloudenv.text_233') },
            ],
          },
        },
        ipSubnets: {
          startip: i => ({
            name: `startip[${i}]`,
            validateTrigger: ['change', 'blur'],
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('cloudenv.text_191') },
              { validator: this.$validate('IPv4') },
            ],
          }),
          endip: i => ({
            name: `endip[${i}]`,
            validateTrigger: ['change', 'blur'],
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('cloudenv.text_192') },
              { validator: this.$validate('IPv4') },
            ],
          }),
          netmask: i => ({
            name: `netmask[${i}]`,
            initialValue: '24',
            validateTrigger: ['change', 'blur'],
            rules: [
              { required: true, message: this.$t('cloudenv.text_234') },
            ],
          }),
          gateway: i => ({
            name: `gateway[${i}]`,
            validateTrigger: ['change', 'blur'],
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('cloudenv.text_235') },
              { validator: this.$validate('IPv4') },
              { validator: validateGateway },
            ],
          }),
          vlan: i => [
            `vlan[${i}]`,
          ],
        },
      },
      params: {
        cloudregion: {
          scope: this.$store.getters.scope,
          limit: 0,
          is_on_premise: true,
        },
        vpc: {
          scope: this.$store.getters.scope,
          limit: 0,
        },
        wire: {
          scope: this.$store.getters.scope,
        },
      },
      keepAliveFields: true,
    }
  },
  methods: {
    vpcMapper (list) {
      return list.filter(val => val.id === 'default')
    },
  },
}
</script>
