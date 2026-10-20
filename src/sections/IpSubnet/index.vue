<template>
  <div class="ip-subnet">
    <div v-if="resolvedFields.name" class="ip-subnet__row ip-subnet__row--name">
      <a-form-item class="mb-0" :validate-status="fieldErrors.name ? 'error' : ''" :help="fieldErrors.name || ''">
        <a-input
          :addon-before="$t('network.text_21')"
          :value="fieldVal(resolvedFields.name)"
          @update:value="v => fieldSet(resolvedFields.name, v, 'name')"
          :placeholder="$t('network.text_21')" />
      </a-form-item>
    </div>
    <div class="ip-subnet__row ip-subnet__row--v4">
      <a-form-item class="mb-0" :validate-status="fieldErrors.startip ? 'error' : ''" :help="fieldErrors.startip || ''">
        <a-input
          :addon-before="$t('network.text_607')"
          :value="fieldVal(resolvedFields.startip)"
          @update:value="v => fieldSet(resolvedFields.startip, v, 'startip')"
          :placeholder="$t('common_161')" />
      </a-form-item>
      <a-form-item class="mb-0" :validate-status="fieldErrors.endip ? 'error' : ''" :help="fieldErrors.endip || ''">
        <a-input
          :addon-before="$t('network.text_608')"
          :value="fieldVal(resolvedFields.endip)"
          @update:value="v => fieldSet(resolvedFields.endip, v, 'endip')"
          :placeholder="$t('common_162')" />
      </a-form-item>
      <a-form-item class="mb-0 ip-subnet__mask" :validate-status="fieldErrors.netmask ? 'error' : ''" :help="fieldErrors.netmask || ''">
        <a-select
          :value="fieldVal(resolvedFields.netmask)"
          @change="v => fieldSet(resolvedFields.netmask, v, 'netmask')"
          :placeholder="$t('network.text_595')"
          dropdownClassName="oc-select-dropdown">
          <a-select-option
            v-for="item of netMaskOptions"
            :key="item.key"
            :value="item.key">
            <span class="text-color-secondary option-prefix">{{$t('common_600')}}: </span>{{item.label}}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item class="mb-0" :validate-status="fieldErrors.gateway ? 'error' : ''" :help="fieldErrors.gateway || ''">
        <a-input
          :addon-before="$t('network.text_610')"
          :value="fieldVal(resolvedFields.gateway)"
          @update:value="v => fieldSet(resolvedFields.gateway, v, 'gateway')"
          :placeholder="$t('common_163')" />
      </a-form-item>
      <a-form-item class="mb-0 ip-subnet__vlan" :validate-status="fieldErrors.vlan ? 'error' : ''" :help="fieldErrors.vlan || ''">
        <a-input
          addon-before="VLAN ID"
          :value="fieldVal(resolvedFields.vlan)"
          @update:value="v => fieldSet(resolvedFields.vlan, v, 'vlan')"
          placeholder="VLAN ID" />
      </a-form-item>
    </div>
    <div class="ip-subnet__row ip-subnet__row--v6" v-if="showV6 || !isButtonHide">
      <template v-if="showV6">
        <a-form-item class="mb-0" :validate-status="fieldErrors.startip6 ? 'error' : ''" :help="fieldErrors.startip6 || ''">
          <a-input
            :addon-before="$t('network.ipv6.ip_start.label')"
            :value="fieldVal(resolvedFields.startip6)"
            @update:value="v => fieldSet(resolvedFields.startip6, v, 'startip6')"
            :placeholder="$t('network.ipv6.ip_start.label')" />
        </a-form-item>
        <a-form-item class="mb-0" :validate-status="fieldErrors.endip6 ? 'error' : ''" :help="fieldErrors.endip6 || ''">
          <a-input
            :addon-before="$t('network.ipv6.ip_end.label')"
            :value="fieldVal(resolvedFields.endip6)"
            @update:value="v => fieldSet(resolvedFields.endip6, v, 'endip6')"
            :placeholder="$t('network.ipv6.ip_end.label')" />
        </a-form-item>
        <a-form-item class="mb-0 ip-subnet__mask" :validate-status="fieldErrors.netmask6 ? 'error' : ''" :help="fieldErrors.netmask6 || ''">
          <a-select
            :value="fieldVal(resolvedFields.netmask6)"
            @change="v => fieldSet(resolvedFields.netmask6, v, 'netmask6')"
            :placeholder="$t('network.ipv6.ip_mask.label')"
            dropdownClassName="oc-select-dropdown">
            <a-select-option
              v-for="item of net6MaskOptions"
              :key="item.key"
              :value="item.key">
              <span class="text-color-secondary option-prefix">{{$t('common_600')}}: </span>{{item.label}}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item class="mb-0" :validate-status="fieldErrors.gateway6 ? 'error' : ''" :help="fieldErrors.gateway6 || ''">
          <a-input
            :addon-before="$t('network.ipv6.gateway.label')"
            :value="fieldVal(resolvedFields.gateway6)"
            @update:value="v => fieldSet(resolvedFields.gateway6, v, 'gateway6')"
            :placeholder="$t('network.ipv6.gateway.label')" />
        </a-form-item>
        <div class="ip-subnet__vlan ip-subnet__spacer" />
      </template>
      <a-button
        v-if="!isButtonHide"
        type="link"
        class="ip-subnet__v6-toggle"
        @click="showV6 = !showV6">
        {{ showV6 ? $t('common.hide_ipv6') : $t('common.config_ipv6') }}
      </a-button>
    </div>
  </div>
</template>

<script>
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'IpSubnet',
  inject: {
    form: { default: undefined },
  },
  props: {
    fields: {
      type: Object,
      default: null,
      validator: val => {
        if (!val) return true
        const keys = ['startip', 'endip', 'netmask', 'gateway', 'vlan']
        return keys.every(item => Object.prototype.hasOwnProperty.call(val, item))
      },
    },
    /** a-form-model：与 fields 字段名对齐的受控对象（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
    },
    showIpv6: {
      type: Boolean,
      default: false,
    },
    isButtonHide: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      fieldErrors: {},
      netMaskOptions: [
        { label: '16', key: '16' },
        { label: '17', key: '17' },
        { label: '18', key: '18' },
        { label: '19', key: '19' },
        { label: '20', key: '20' },
        { label: '21', key: '21' },
        { label: '22', key: '22' },
        { label: '23', key: '23' },
        { label: '24', key: '24' },
        { label: '25', key: '25' },
        { label: '26', key: '26' },
        { label: '27', key: '27' },
        { label: '28', key: '28' },
        { label: '29', key: '29' },
        { label: '30', key: '30' },
      ],
      net6MaskOptions: [
        { label: '64', key: '64' },
        { label: '72', key: '72' },
        { label: '80', key: '80' },
        { label: '88', key: '88' },
        { label: '96', key: '96' },
        { label: '104', key: '104' },
        { label: '112', key: '112' },
        { label: '120', key: '120' },
        { label: '124', key: '124' },
      ],
      showV6: this.showIpv6,
    }
  },
  computed: {
    resolvedFields () {
      return this.fields || {}
    },
  },
  created () {
    // 兼容 decorator 二元组与 object meta：把 initialValue 写入 model，避免提交时 vlan/netmask 等根对象缺失
    Object.keys(this.resolvedFields).forEach(key => {
      const meta = resolveFieldMeta(this.resolvedFields[key], key)
      if (!meta) return
      const { name, ...opts } = meta
      if (name && this.modelGet(name) === undefined && opts.initialValue !== undefined) {
        this.modelSet(name, opts.initialValue)
      }
    })
  },
  methods: {
    parseBracketName (name) {
      const m = typeof name === 'string' && name.match(/^(\w+)\[([^\]]+)\]$/)
      if (!m) return null
      return { root: m[1], key: m[2] }
    },
    modelGet (name) {
      if (!this.model || !name) return undefined
      const nested = this.parseBracketName(name)
      if (nested && this.model[nested.root] != null && typeof this.model[nested.root] === 'object') {
        return this.model[nested.root][nested.key]
      }
      if (Object.prototype.hasOwnProperty.call(this.model, name)) {
        return this.model[name]
      }
      return undefined
    },
    modelSet (name, value) {
      if (!this.model || !name) return
      const nested = this.parseBracketName(name)
      if (nested) {
        if (!this.model[nested.root] || typeof this.model[nested.root] !== 'object') {
          this.$set(this.model, nested.root, {})
        }
        this.$set(this.model[nested.root], nested.key, value)
      } else {
        this.$set(this.model, name, value)
      }
    },
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      if (!name) return undefined
      const v = this.modelGet(name)
      if (v !== undefined) return v
      return opts.initialValue
    },
    fieldSet (fieldTuple, value, errorKey) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const { name } = meta
      if (name) this.modelSet(name, value)
      if (errorKey) this.clearFieldError(errorKey)
    },
    clearFieldError (key) {
      if (!this.fieldErrors[key]) return
      const next = { ...this.fieldErrors }
      delete next[key]
      this.fieldErrors = next
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          let settled = false
          const finish = (err) => {
            if (settled) return
            settled = true
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          }
          let ret
          try {
            ret = rule.validator(rule, value, finish)
          } catch (e) {
            finish(e)
            return
          }
          if (ret && typeof ret.then === 'function') {
            ret.then(() => finish()).catch(finish)
          }
          return
        }
        resolve()
      })
    },
    async validate () {
      const errorFields = []
      this.fieldErrors = {}
      for (const key of Object.keys(this.resolvedFields)) {
        const fieldDef = this.resolvedFields[key]
        if (!resolveFieldMeta(fieldDef)) continue
        const rules = resolveFieldMeta(fieldDef)?.rules || []
        for (const rule of rules) {
          try {
            await this.runFieldRule(rule, this.fieldVal(fieldDef))
          } catch (err) {
            const message = err?.message || String(err)
            this.fieldErrors = { ...this.fieldErrors, [key]: message }
            const meta = resolveFieldMeta(fieldDef) || {}
            errorFields.push({ name: meta.name || key, errors: [message] })
            break
          }
        }
      }
      if (errorFields.length) {
        const err = new Error('validate failed')
        err.errorFields = errorFields
        return Promise.reject(err)
      }
      return true
    },
  },
}
</script>

<style lang="less" scoped>
.ip-subnet {
  width: 100%;
  min-width: 0;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  box-sizing: border-box;
}

.ip-subnet__row {
  display: grid;
  gap: 8px;
  align-items: start;
  min-width: 0;

  & + & {
    margin-top: 8px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 0;
    min-width: 0;
  }

  :deep(.ant-input-group-wrapper),
  :deep(.ant-input-affix-wrapper),
  :deep(.ant-select),
  :deep(.ant-input) {
    width: 100%;
  }
}

/* 起/止/掩码/网关/VLAN — 掩码与 VLAN 定宽，其余均分，IPv4/IPv6 列对齐 */
.ip-subnet__row--v4,
.ip-subnet__row--v6 {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.2fr) 108px minmax(0, 1fr) 128px;
}

.ip-subnet__row--name {
  grid-template-columns: minmax(0, 1fr);
}

.ip-subnet__mask,
.ip-subnet__vlan {
  width: 100%;
}

.ip-subnet__spacer {
  min-height: 1px;
}

.ip-subnet__v6-toggle {
  grid-column: 1 / -1;
  justify-self: start;
  padding-left: 0;
  height: auto;
}

@media (max-width: 1200px) {
  .ip-subnet__row--v4,
  .ip-subnet__row--v6 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .ip-subnet__mask,
  .ip-subnet__vlan {
    max-width: none;
  }
}
</style>
