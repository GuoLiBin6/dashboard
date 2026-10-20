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
        <sticky-session :form="form" :stickySessionTypeOpts="stickySessionTypeOpts" :sticky_session_cookie_timeout_field="sticky_session_cookie_timeout_field" />
        <acl :form="form" :lbDetail="lbDetail" :aclTypeOpts="aclTypeOpts" :listenerData="listenerData" />
        <a-form-model-item :label="$t('network.text_426')" v-if="['https'].includes(form.fd.listener_type)">
          <a-switch :checked="form.fd.enable_http2" @change="v => setField('enable_http2', v)" />
        </a-form-model-item>
      </a-collapse-panel>
    </a-collapse>
    <!-- <a-divider orientation="left">{{$t('network.text_94')}}</a-divider> -->
  </a-form-model>
</template>

<script>
import { resolveFieldMeta } from '@/utils/common/ant'
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
      stickySessionTypeOpts: [
        {
          key: 'insert',
          label: this.$t('network.text_384'),
        },
        {
          key: 'server',
          label: this.$t('network.text_385'),
        },
      ],
    }
  },
  computed: {
    sticky_session_cookie_timeout_field () {
      const httpArr = ['http', 'https']
      let max = 60
      const validator = (rule, value, cb) => {
        if (+value % 60 === 0) {
          cb()
        } else {
          cb(Error(this.$t('network.text_431')))
        }
      }
      if (httpArr.includes(this.form.fd.listener_type)) max = 1440
      return {
        name: resolveFieldMeta(this.fieldMap.sticky_session_cookie_timeout, 'sticky_session_cookie_timeout')?.name || 'sticky_session_cookie_timeout',
        initialValue: 60,
        normalize: v => Number(v),
        rules: [
          { validator, trigger: 'blur' },
          { type: 'integer', min: 60, max, message: this.$t('network.text_432', [max]), trigger: 'blur' },
        ],
      }
    },
  },
  watch: {
    'form.fd.listener_type' (val) {
      this.setStickySessionTypeOpts(val)
    },
  },
  created () {
    this.registerFields(['generate_name', 'listener_port', 'certificate', 'enable_http2'])
  },
  methods: {
    setStickySessionTypeOpts (listenerType) {
      if (listenerType === 'http') {
        this.stickySessionTypeOpts = [
          { key: 'insert', label: this.$t('network.text_384') },
          { key: 'server', label: this.$t('network.text_385') },
        ]
      } else {
        this.stickySessionTypeOpts = [
          { key: 'insert', label: this.$t('network.text_384') },
        ]
        if (this.form.fd.sticky_session_type === 'server') {
          this.setField('sticky_session_type', 'insert')
        }
      }
    },
  },
}
</script>
