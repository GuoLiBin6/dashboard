<template>
  <a-form-model :model="form.fd" class="mt-3" v-bind="formItemLayout">
    <a-divider orientation="left">{{$t('network.text_397')}}</a-divider>
    <a-form-model-item :label="$t('network.text_21')">
      <a-input :disabled="isUpdate" :value="form.fd.generate_name" @update:value="v => setField('generate_name', v)" :placeholder="$t('validator.resourceName')" />
      <name-repeated v-if="!isUpdate" v-slot:extra res="loadbalancerlisteners" :name="form.fd.generate_name" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_418')">
      <a-input :disabled="isUpdate" type="number" :value="form.fd.listener_port" @update:value="v => setField('listener_port', v)" :placeholder="$t('network.text_419')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_420')" class="mb-0">
      <listener-types :disabled="isUpdate" />
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
    <a-collapse :bordered="false">
      <a-collapse-panel :header="$t('network.text_94')" key="1" forceRender>
        <a-form-model-item :label="$t('network.text_423')" class="mb-0">
          <scheduler-types :form="form" :schedulerTypeOpts="schedulerTypeOpts" />
        </a-form-model-item>
        <sticky-session :form="form" v-if="['http'].includes(form.fd.listener_type)" />
        <acl :form="form" :lbDetail="lbDetail" :listenerData="listenerData" />
        <a-form-model-item :label="$t('network.text_424')" v-if="['http', 'https'].includes(form.fd.listener_type)">
          <a-input :value="form.fd.client_idle_timeout" @update:value="v => setField('client_idle_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_425')" v-if="['http', 'https'].includes(form.fd.listener_type)">
          <a-input :value="form.fd.client_request_timeout" @update:value="v => setField('client_request_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_426')" v-if="['https'].includes(form.fd.listener_type)">
          <a-switch :checked="form.fd.enable_http2" @change="v => setField('enable_http2', v)" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_427')" v-if="['http', 'https'].includes(form.fd.listener_type)">
          <a-switch :checked="form.fd.gzip" @change="v => setField('gzip', v)" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_428')" :extra="$t('network.text_429')" v-if="['http', 'https'].includes(form.fd.listener_type)">
          <a-checkbox :checked="form.fd.xforwarded_for" @change="e => setField('xforwarded_for', e.target.checked)">X-Forwarded-For</a-checkbox>
        </a-form-model-item>
      </a-collapse-panel>
    </a-collapse>
  </a-form-model>
</template>

<script>
import { schedulerProviderMaps } from '@Network/views/loadbalancerlistener/constants'
import mixin from '../mixins/formStepItem'
import controlledFieldMap from '../mixins/controlledFieldMap'
export default {
  name: 'LBListenerCreateProtocol',
  mixins: [mixin, controlledFieldMap],
  computed: {
    schedulerTypeOpts () {
      const type = this.lbDetail.brand.toLowerCase()
      if (type) {
        const opts = schedulerProviderMaps[type.toLowerCase()]
        const { listener_type } = this.form.fd
        if ((listener_type !== 'udp' && type === 'aliyun')) {
          const noUdpScheduler = ['sch', 'tch', 'qch']
          return opts.filter(val => !noUdpScheduler.includes(val.key))
        }
        return opts
      }
      return []
    },
  },
  created () {
    this.registerFields([
      'generate_name',
      'listener_port',
      'certificate',
      'client_idle_timeout',
      'client_request_timeout',
      'enable_http2',
      'gzip',
      'xforwarded_for',
    ])
  },
}
</script>
