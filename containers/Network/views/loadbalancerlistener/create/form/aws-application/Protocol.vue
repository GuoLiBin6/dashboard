<template>
  <a-form-model :model="form.fd" class="mt-3">
    <a-divider orientation="left">{{$t('network.text_397')}}</a-divider>
    <a-form-model-item :label="$t('network.text_21')">
      <a-input :disabled="isUpdate" :value="form.fd.generate_name" @update:value="v => setField('generate_name', v)" :placeholder="$t('validator.resourceName')" />
      <name-repeated v-if="!isUpdate" v-slot:extra res="loadbalancerlisteners" :name="form.fd.generate_name" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_418')">
      <a-input :disabled="isUpdate" type="number" :value="form.fd.listener_port" @update:value="v => setField('listener_port', v)" :placeholder="$t('network.text_419')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_420')" class="mb-0">
      <listener-types :disabled="isUpdate" :listenerTypeOpts="listenerTypeOpts" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_143')" v-if="form.fd.listener_type === 'https'">
      <base-select
        :value="form.fd.certificate"
        @change="v => setField('certificate', v)"
        resource="loadbalancercertificates"
        :params="certificateParams"
        show-sync
        :select-props="{ placeholder: $t('network.text_421') }" />
      <div slot="extra">{{$t('network.text_422')}}<help-link href="/lbcert">{{$t('network.text_321')}}</help-link></div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import mixin from '../mixins/formStepItem'
import controlledFieldMap from '../mixins/controlledFieldMap'

export default {
  name: 'LBListenerCreateProtocol',
  mixins: [mixin, controlledFieldMap],
  data () {
    return {
      listenerTypeOpts: [
        { label: 'HTTP', key: 'http' },
        { label: 'HTTPS', key: 'https' },
      ],
    }
  },
  created () {
    this.registerFields(['generate_name', 'listener_port', 'certificate'])
  },
}
</script>
