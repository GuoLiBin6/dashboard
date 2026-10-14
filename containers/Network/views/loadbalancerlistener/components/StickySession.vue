<template>
  <div>
    <a-form-item :label="$t('network.text_379')">
      <a-switch :disabled="disabled" :checked="form.fd.sticky_session" @change="onStickySessionChange" />
    </a-form-item>
    <template v-if="form.fd.sticky_session">
      <a-form-item :label="$t('network.text_380')">
        <a-select :value="form.fd.sticky_session_type" @change="v => setField('sticky_session_type', v)">
          <a-select-option v-for="item in stickySessionTypeOpts" :key="item.key"  :value="item.key">{{ item.label }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('network.text_381')" v-if="form.fd.sticky_session_type === 'server'">
        <a-input :value="form.fd.sticky_session_cookie" @update:value="v => setField('sticky_session_cookie', v)" :placeholder="$t('network.text_382')" />
      </a-form-item>
      <a-form-item :label="$t('network.text_383')" v-if="form.fd.sticky_session_type === 'insert'">
        <a-input
          :value="form.fd.sticky_session_cookie_timeout"
          @update:value="v => setField('sticky_session_cookie_timeout', v)"
          :addonAfter="$t('network.text_76')"
          type="number"
          :disabled="disabledStickySessionCookieTimeout" />
      </a-form-item>
    </template>
  </div>
</template>

<script>
import i18n from '@/locales'
import controlledFieldMap from '@Network/views/loadbalancerlistener/create/form/mixins/controlledFieldMap'

export default {
  name: 'LbStickySession',
  mixins: [controlledFieldMap],
  props: {
    form: {
      type: Object,
      required: true,
      validator: val => val.fd || val.fc,
    },
    stickySessionTypeOpts: {
      type: Array,
      default: () => [
        {
          key: 'insert',
          label: i18n.t('network.text_384'),
        },
        {
          key: 'server',
          label: i18n.t('network.text_385'),
        },
      ],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    disabledStickySessionCookieTimeout: {
      type: Boolean,
      default: false,
    },
    sticky_session_cookie_timeout_field: { // huawei 会有动态规则（可读 meta 或历史二元组）
      type: [Object, Array],
    },
  },
  watch: {
    sticky_session_cookie_timeout_field () {
      this.registerStickySessionCookieTimeout()
    },
  },
  created () {
    this.registerFields([
      'sticky_session',
      'sticky_session_type',
      'sticky_session_cookie',
    ])
    this.registerStickySessionCookieTimeout()
  },
  methods: {
    registerStickySessionCookieTimeout () {
      const fieldDef = this.sticky_session_cookie_timeout_field || this.lbFieldMap.sticky_session_cookie_timeout
      this.registerFieldPair(fieldDef)
    },
    onStickySessionChange (val) {
      this.setField('sticky_session', val)
      if (val) {
        this.setField('sticky_session_type', this.stickySessionTypeOpts[0].key)
      }
    },
  },
}
</script>
