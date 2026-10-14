<template>
  <a-form-model :model="form.fd" class="mt-3" v-bind="formItemLayout">
    <a-divider orientation="left">{{$t('network.text_397')}}</a-divider>
    <a-form-item :label="$t('network.text_398')">
      <a-tooltip :title="$t('network.text_430')" placement="top">
        <a-switch :checked="form.fd.health_check" :disabled="true" />
      </a-tooltip>
    </a-form-item>
    <template v-if="form.fd.health_check">
      <a-divider orientation="left">{{$t('network.text_94')}}</a-divider>
      <a-form-item :label="$t('network.text_400')" v-if="['tcp', 'http', 'https'].includes(allFd.listener_type)">
        <a-radio-group :value="form.fd.health_check_type" @change="e => setField('health_check_type', e.target.value)">
          <a-radio-button v-for="item in healthCheckTypeOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item :label="$t('network.text_401')" v-if="['http', 'https'].includes(allFd.listener_type)">
        <a-input :value="form.fd.health_check_uri" @update:value="v => setField('health_check_uri', v)" :placeholder="$t('network.text_402')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_408')">
        <a-input :value="form.fd.health_check_interval" @update:value="v => setField('health_check_interval', v)" :addonAfter="$t('network.text_76')" :placeholder="$t('network.text_409')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_410')">
        <a-input :value="form.fd.health_check_rise" @update:value="v => setField('health_check_rise', v)" :addonAfter="$t('network.text_411')" :placeholder="$t('network.text_412')" />
      </a-form-item>
    </template>
  </a-form-model>
</template>

<script>
import mixin from '../mixins/formStepItem'
import controlledFieldMap from '../mixins/controlledFieldMap'

export default {
  name: 'LBListenerCreateHealcheck',
  mixins: [mixin, controlledFieldMap],
  created () {
    this.registerFields([
      'health_check',
      'health_check_type',
      'health_check_uri',
      'health_check_interval',
      'health_check_rise',
    ])
  },
}
</script>
