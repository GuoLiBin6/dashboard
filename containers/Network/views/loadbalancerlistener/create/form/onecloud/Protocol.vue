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
        :label-format="certificateFormatter"
        show-sync
        :select-props="{ placeholder: $t('network.text_421') }" />
      <div slot="extra">{{$t('network.text_422')}}<help-link href="/lbcert">{{$t('network.text_321')}}</help-link></div>
    </a-form-model-item>
    <redirect-form-items v-if="['http', 'https'].includes(form.fd.listener_type)" :form="form" />
    <a-collapse :bordered="false">
      <a-collapse-panel :header="$t('network.text_94')" key="1" forceRender>
        <div v-if="isLbRedirected">
          <acl :form="form" :lbDetail="lbDetail" :listenerData="listenerData" />
          <a-form-model-item :label="$t('network.text_424')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.client_idle_timeout" @update:value="v => setField('client_idle_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_425')" v-if="['http'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.client_request_timeout" @update:value="v => setField('client_request_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_426')" v-if="['https'].includes(form.fd.listener_type)">
            <a-switch :checked="form.fd.enable_http2" @change="v => setField('enable_http2', v)" />
          </a-form-model-item>
        </div>
        <div v-if="!isLbRedirected">
          <a-form-model-item :label="$t('network.text_423')" class="mb-0">
            <scheduler-types :form="form" :schedulerTypeOpts="schedulerTypeOpts" />
          </a-form-model-item>
          <sticky-session :form="form" v-if="['http', 'https'].includes(form.fd.listener_type)" />
          <acl :form="form" :lbDetail="lbDetail" :listenerData="listenerData" />
          <a-form-model-item :label="$t('network.text_435')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.backend_connect_timeout" @update:value="v => setField('backend_connect_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_436')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.backend_idle_timeout" @update:value="v => setField('backend_idle_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_424')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.client_idle_timeout" @update:value="v => setField('client_idle_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_425')" v-if="['http'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.client_request_timeout" @update:value="v => setField('client_request_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_437')" :extra="$t('network.text_438')" v-if="['http', 'https'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.http_request_rate" @update:value="v => setField('http_request_rate', v)" :addonAfter="$t('network.text_439')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_440')" :extra="$t('network.text_441')" v-if="['http', 'https'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.http_request_rate_per_src" @update:value="v => setField('http_request_rate_per_src', v)" :addonAfter="$t('network.text_439')" type="number" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_426')" v-if="['https'].includes(form.fd.listener_type)">
            <a-switch :checked="form.fd.enable_http2" @change="v => setField('enable_http2', v)" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_427')" v-if="['http', 'https'].includes(form.fd.listener_type)">
            <a-switch :checked="form.fd.gzip" @change="v => setField('gzip', v)" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_442')" :extra="$t('network.text_443')" v-if="isDefaultVpc && ['tcp', 'http', 'https'].includes(form.fd.listener_type)">
            <a-select :value="form.fd.send_proxy" @change="v => setField('send_proxy', v)">
              <a-select-option v-for="(v, k) in proxyOpts" :value="k" :key="k">
                {{v}}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_444')" v-if="isDefaultVpc && ['http', 'https'].includes(form.fd.listener_type)">
            <a-checkbox :checked="form.fd.xforwarded_for" @change="e => setField('xforwarded_for', e.target.checked)">{{$t('network.text_445')}}</a-checkbox>
          </a-form-model-item>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </a-form-model>
</template>

<script>
import { mapState } from 'vuex'
import mixin from '../mixins/formStepItem'
import RedirectFormItems from '../../../components/RedirectFormItems'
import controlledFieldMap from '../mixins/controlledFieldMap'

export default {
  name: 'LBListenerCreateProtocol',
  components: {
    RedirectFormItems,
  },
  mixins: [mixin, controlledFieldMap],
  data () {
    return {
      proxyOpts: {
        off: this.$t('network.text_33'),
        v1: 'V1',
        v2: 'V2',
        'v2-ssl': 'V2-SSL',
        'v2-ssl-cn': 'V2-SSL-CN',
      },
    }
  },
  computed: {
    ...mapState('common', {
      isLbRedirected: state => {
        return !!state.lbRedirected.isLbRedirected
      },
    }),
    isDefaultVpc () {
      return this.lbDetail && this.lbDetail.vpc_id === 'default'
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
      'backend_connect_timeout',
      'backend_idle_timeout',
      'http_request_rate',
      'http_request_rate_per_src',
      'gzip',
      'send_proxy',
      'xforwarded_for',
    ])
  },
}
</script>
