<template>
  <a-form-model :model="form.fd" class="mt-3" v-bind="formItemLayout">
    <a-divider orientation="left">{{$t('network.text_397')}}</a-divider>
    <a-form-model-item :label="$t('network.text_21')">
      <a-input :disabled="isUpdate" :value="form.fd.generate_name" @update:value="v => setField('generate_name', v)" :placeholder="$t('validator.resourceName')" />
      <template v-slot:extra>
        <name-repeated v-if="!isUpdate" res="loadbalancerlisteners" :name="form.fd.generate_name" />
      </template>
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_418')">
      <a-input :disabled="isUpdate" type="number" :value="form.fd.listener_port" @update:value="v => setField('listener_port', v)" :placeholder="$t('network.text_419')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('network.text_420')" class="mb-0">
      <listener-types :disabled="isUpdate" />
    </a-form-model-item>
    <a-collapse :bordered="false">
      <a-collapse-panel :header="$t('network.text_94')" key="1" forceRender>
        <div v-if="isLbRedirected">
          <acl :form="form" :lbDetail="lbDetail" :aclTypeOpts="aclTypeOpts" :listenerData="listenerData" />
          <a-form-model-item :label="$t('network.text_424')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.client_idle_timeout" @update:value="v => setField('client_idle_timeout', v)" :addonAfter="$t('network.text_76')" type="number" />
          </a-form-model-item>
        </div>
        <div v-if="!isLbRedirected">
          <a-form-model-item :label="$t('network.text_423')" class="mb-0">
            <scheduler-types :form="form" :schedulerTypeOpts="schedulerTypeOpts" />
          </a-form-model-item>
          <sticky-session
            :form="form"
            v-if="['http', 'https'].includes(form.fd.listener_type)"
            :disabled-sticky-session-cookie-timeout="['http', 'https'].includes(form.fd.listener_type)"
            :stickySessionTypeOpts="[{key: 'server',label: $t('network.text_385')}]" />
          <acl :form="form" :lbDetail="lbDetail" :aclTypeOpts="aclTypeOpts" :listenerData="listenerData" />
          <a-form-model-item :label="$t('network.text_435')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.backend_connect_timeout" @update:value="v => setField('backend_connect_timeout', v)" :addonAfter="$t('network.text_76')" type="number" :disabled="isUpdate && ['http', 'tcp', 'udp'].includes(form.fd.listener_type)" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_436')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.backend_idle_timeout" @update:value="v => setField('backend_idle_timeout', v)" :addonAfter="$t('network.text_76')" type="number" :disabled="isUpdate && ['http', 'tcp', 'udp'].includes(form.fd.listener_type)" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_424')" v-if="['http', 'tcp', 'udp'].includes(form.fd.listener_type)">
            <a-input :value="form.fd.client_idle_timeout" @update:value="v => setField('client_idle_timeout', v)" :addonAfter="$t('network.text_76')" type="number" :disabled="isUpdate && ['http', 'tcp', 'udp'].includes(form.fd.listener_type)" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_444')" v-if="['http', 'https'].includes(form.fd.listener_type)">
            <a-checkbox :checked="form.fd.xforwarded_for" :disabled="isUpdate && ['http', 'https'].includes(form.fd.listener_type)" @change="e => setField('xforwarded_for', e.target.checked)">{{$t('network.text_445')}}</a-checkbox>
          </a-form-model-item>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </a-form-model>
</template>

<script>
import { mapState } from 'vuex'
import mixin from '../mixins/formStepItem'
import controlledFieldMap from '../mixins/controlledFieldMap'

export default {
  name: 'LBListenerCreateProtocol',
  mixins: [mixin, controlledFieldMap],
  data () {
    return {
      aclTypeOpts: [
        { key: 'white', label: this.$t('network.text_364') },
      ],
    }
  },
  computed: {
    ...mapState('common', {
      isLbRedirected: state => {
        return !!state.lbRedirected.isLbRedirected
      },
    }),
  },
  created () {
    this.registerFields([
      'generate_name',
      'listener_port',
      'client_idle_timeout',
      'backend_connect_timeout',
      'backend_idle_timeout',
      'xforwarded_for',
    ])
  },
}
</script>
