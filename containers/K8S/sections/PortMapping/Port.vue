<template>
  <div class="d-flex align-items-start port-mapping-port">
    <a-form-item class="mb-0 mr-2" :name="fieldName('port')" :rules="portFieldRules('port')">
      <a-input :value="fieldVal('port')" @update:value="v => fieldSet('port', v)" type="number" style="width: 200px;">
        <template #addonBefore>
          <span>{{$t('k8s.service_port')}}</span>
          <a-tooltip :title="$t('k8s.service_port.desc')">
            <icon type="info-circle" class="ml-1" />
          </a-tooltip>
        </template>
      </a-input>
    </a-form-item>
    <a-form-item class="mb-0 mr-2" :name="fieldName('targetPort')" :rules="portFieldRules('targetPort')">
      <a-input :value="fieldVal('targetPort')" @update:value="v => fieldSet('targetPort', v)" type="number" style="width: 200px;">
        <template #addonBefore>
          <span>{{$t('k8s.target_port')}}</span>
          <a-tooltip :title="$t('k8s.target_port.desc')">
            <icon type="info-circle" class="ml-1" />
          </a-tooltip>
        </template>
      </a-input>
    </a-form-item>
    <a-form-item v-if="isNodePort" class="mb-0 mr-2" :name="fieldName('nodePort')" :rules="portFieldRules('nodePort')">
      <a-input :min="30000" :max="32767" :value="fieldVal('nodePort')" @update:value="v => fieldSet('nodePort', v)" type="number" style="width: 200px;">
        <template #addonBefore>
          <span>{{$t('k8s.node_port')}}</span>
          <a-tooltip :title="$t('k8s.node_port.desc')">
            <icon type="info-circle" class="ml-1" />
          </a-tooltip>
        </template>
      </a-input>
    </a-form-item>
    <a-form-item class="mb-0" :name="fieldName('protocol')" :rules="portFieldRules('protocol')">
      <!-- antdv4：勿用 a-input 冒充 addon，高度会与 select 错位 -->
      <div class="protocol-compact">
        <span class="protocol-compact__label">{{ $t('k8s.text_90') }}</span>
        <a-select
          class="protocol-compact__select"
          :value="fieldVal('protocol')"
          @change="onProtocolChange"
          :disabled="protocolDisabled">
          <a-select-option value="TCP">TCP</a-select-option>
          <a-select-option value="UDP">UDP</a-select-option>
        </a-select>
      </div>
    </a-form-item>
  </div>
</template>

<script>
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import { PORT_FIELD_FACTORIES, PORT_FIELD_INITIAL, portFieldRules } from './fields'

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
    portFieldRules,
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

<style lang="less" scoped>
.protocol-compact {
  display: inline-flex;
  align-items: stretch;
  height: 32px;
  vertical-align: top;
  &__label {
    display: inline-flex;
    align-items: center;
    padding: 0 11px;
    color: rgba(0, 0, 0, 0.65);
    background: #fafafa;
    border: 1px solid #d9d9d9;
    border-right: 0;
    border-radius: 6px 0 0 6px;
    white-space: nowrap;
    line-height: 1;
  }
  &__select {
    width: 100px;
    :deep(.ant-select-selector) {
      height: 32px !important;
      border-radius: 0 6px 6px 0 !important;
    }
    :deep(.ant-select-selection-item),
    :deep(.ant-select-selection-placeholder) {
      line-height: 30px !important;
    }
  }
}
</style>
