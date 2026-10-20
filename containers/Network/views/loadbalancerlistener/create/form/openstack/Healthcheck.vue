<template>
  <a-form-model :model="form.fd" class="mt-3">
    <a-divider orientation="left">{{$t('network.text_397')}}</a-divider>
    <a-form-item :label="$t('network.text_398')">
      <a-switch :checked="form.fd.health_check" @change="onHealthCheckChange" />
    </a-form-item>
    <template v-if="form.fd.health_check">
      <a-divider orientation="left">{{$t('network.text_94')}}</a-divider>
      <a-form-item :label="$t('network.text_400')">
        <a-radio-group :value="form.fd.health_check_type" @change="e => setField('health_check_type', e.target.value)">
          <a-radio-button v-for="item in healthCheckTypeOptsC" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item :label="$t('network.text_401')" v-if="['tcp', 'http', 'https'].includes(allFd.listener_type) && ['http'].includes(form.fd.health_check_type)">
        <a-input :value="form.fd.health_check_uri" @update:value="v => setField('health_check_uri', v)" :placeholder="$t('network.text_402')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_403')" v-if="['tcp', 'http', 'https'].includes(allFd.listener_type) && ['http'].includes(form.fd.health_check_type)">
        <a-input :value="form.fd.health_check_domain" @update:value="v => setField('health_check_domain', v)" :placeholder="$t('network.text_404')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_405')" v-if="['tcp', 'http', 'https'].includes(allFd.listener_type) && ['http'].includes(form.fd.health_check_type)">
        <a-checkbox-group name="checkboxgroup" :options="healthCheckHttpCodeOpts" :value="form.fd.health_check_http_code" @change="v => setField('health_check_http_code', v)" />
      </a-form-item>
      <a-form-item :label="$t('network.text_406')" v-if="['tcp', 'udp', 'http'].includes(allFd.listener_type)">
        <a-input :value="form.fd.health_check_timeout" @update:value="v => setField('health_check_timeout', v)" :addonAfter="$t('network.text_76')" :placeholder="$t('network.text_407')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_408')" v-if="['http', 'https'].includes(allFd.listener_type)">
        <a-input :value="form.fd.health_check_interval" @update:value="v => setField('health_check_interval', v)" :addonAfter="$t('network.text_76')" :placeholder="$t('network.text_409')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_410')">
        <a-input :value="form.fd.health_check_rise" @update:value="v => setField('health_check_rise', v)" :addonAfter="$t('network.text_411')" :placeholder="$t('network.text_412')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_413')">
        <a-input :value="form.fd.health_check_fall" @update:value="v => setField('health_check_fall', v)" :addonAfter="$t('network.text_411')" :placeholder="$t('network.text_412')" />
      </a-form-item>
    </template>
  </a-form-model>
</template>

<script>
import { resolveFieldMeta } from '@/utils/common/ant'
import mixin from '../mixins/formStepItem'
import controlledFieldMap from '../mixins/controlledFieldMap'

export default {
  name: 'LBListenerCreateHealcheck',
  mixins: [mixin, controlledFieldMap],
  computed: {
    healthCheckTypeOptsC () { // openstack udp的监听只能配udp的健康检查，和onecloud一样
      if (this.allFd.listener_type === 'udp') {
        return this.healthCheckTypeOpts.filter(v => v.key === 'udp')
      }
      return this.healthCheckTypeOpts.filter(v => v.key !== 'udp')
    },
  },
  watch: {
    healthCheckTypeOptsC (val) {
      this.setDefaultHealthCheckType(val)
    },
  },
  created () {
    this.registerFields([
      'health_check',
      'health_check_type',
      'health_check_uri',
      'health_check_domain',
      'health_check_http_code',
      'health_check_timeout',
      'health_check_interval',
      'health_check_rise',
      'health_check_fall',
    ])
  },
  mounted () {
    const newField = {
      [resolveFieldMeta(this.fieldMap.health_check_type, 'health_check_type')?.name || 'health_check_type']: this.healthCheckTypeOptsC[0].key,
    }
    if (this.allFd.listener_type === 'udp') {
      newField[resolveFieldMeta(this.fieldMap.health_check, 'health_check')?.name || 'health_check'] = false
    }
    this.setFields(newField)
  },
  methods: {
    onHealthCheckChange (val) {
      this.setField('health_check', val)
      if (val) {
        this.setDefaultHealthCheckType(this.healthCheckTypeOptsC)
      }
    },
  },
}
</script>
