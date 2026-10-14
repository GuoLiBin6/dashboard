<template>
  <div class="d-flex">
    <a-form-item>
      <a-input :value="fieldVal('port')" @update:value="v => fieldSet('port', v)" type="number" style="width: 200px;">
        <template slot="addonBefore">
          <span>{{$t('k8s.service_port')}}</span>
          <a-tooltip :title="$t('k8s.service_port.desc')">
            <icon type="info-circle" />
          </a-tooltip>
        </template>
      </a-input>
    </a-form-item>
    <a-form-item>
      <a-input :value="fieldVal('targetPort')" @update:value="v => fieldSet('targetPort', v)" type="number" style="width: 200px;">
        <template slot="addonBefore">
          <span>{{$t('k8s.target_port')}}</span>
          <a-tooltip :title="$t('k8s.target_port.desc')">
            <icon type="info-circle" />
          </a-tooltip>
        </template>
      </a-input>
    </a-form-item>
    <a-form-item v-if="isNodePort">
      <a-input :min="30000" :max="32767" :value="fieldVal('nodePort')" @update:value="v => fieldSet('nodePort', v)" type="number" style="width: 200px;">
        <template slot="addonBefore">
          <span>{{$t('k8s.node_port')}}</span>
          <a-tooltip :title="$t('k8s.node_port.desc')">
            <icon type="info-circle" />
          </a-tooltip>
        </template>
      </a-input>
    </a-form-item>
    <a-form-item>
      <a-input-group compact>
        <div class="d-flex">
          <a-input class="oc-addonBefore ant-input-group-addon" style="width: 60px;" :defaultValue="$t('k8s.text_90')" readonly />
          <a-select style="width: 100px;" :value="fieldVal('protocol')" @change="onProtocolChange" :disabled="protocolDisabled">
            <a-select-option value="TCP">TCP</a-select-option>
            <a-select-option value="UDP">UDP</a-select-option>
          </a-select>
        </div>
      </a-input-group>
    </a-form-item>
  </div>
</template>

<script>
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import { PORT_FIELD_FACTORIES, PORT_FIELD_INITIAL } from './fields'

export default {
  name: 'K8SPortMappingPort',
  props: {
    portKey: {
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
    protocolDisabled: {
      type: Boolean,
      default: false,
    },
    serviceType: {
      type: String,
      required: true,
    },
  },
  computed: {
    isNodePort () {
      return this.serviceType === 'nodePort'
    },
  },
  created () {
    Object.keys(PORT_FIELD_FACTORIES).forEach((key) => {
      const name = PORT_FIELD_FACTORIES[key](this.portKey)
      if (getBracketValue(this.model, name) === undefined && PORT_FIELD_INITIAL[key] !== undefined) {
        setBracketValue(this, this.model, name, PORT_FIELD_INITIAL[key])
      }
    })
  },
  methods: {
    fieldName (field) {
      return PORT_FIELD_FACTORIES[field](this.portKey)
    },
    fieldVal (field) {
      const name = this.fieldName(field)
      const v = getBracketValue(this.model, name)
      return v !== undefined ? v : PORT_FIELD_INITIAL[field]
    },
    fieldSet (field, value) {
      const name = this.fieldName(field)
      if (name) setBracketValue(this, this.model, name, value)
    },
    onProtocolChange (val) {
      this.fieldSet('protocol', val)
      this.$emit('protocolChange', val)
    },
  },
}
</script>
