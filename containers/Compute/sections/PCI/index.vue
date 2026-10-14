<template>
  <div>
    <a-tooltip v-if="isPciEmpty" :title="$t('compute.text_146')">
      <span><a-switch :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :checked="pciEnable" :disabled="true" /></span>
    </a-tooltip>
    <a-switch
      v-else
      class="mb-2"
      :checkedChildren="$t('compute.text_115')"
      :unCheckedChildren="$t('compute.text_116')"
      :checked="resolvedModel.pciEnable"
      @change="v => { $set(resolvedModel, 'pciEnable', v); change(v) }" />
    <template v-if="pciEnable">
      <div
        v-for="(k, index) in pciKeys"
        :key="k"
        class="pci-group-row">
        <component :is="itemTag" class="pci-group">
          <div class="pci-select-row">
            <component :is="itemTag" class="pci-select-item pci-select-item--fixed mb-0">
              <fixed-label-filter :label="$t('compute.pci.dev_type_sharing_mode')">
                <base-select :value="readPciRowField('pciDevType', k)" @change="(val) => { setPciMapField('pciDevType', k, val); onChangeDevType(val, k) }" :options="getRealPciDevTypeOptions(realPciDevTypeOptions, index)" isDefaultSelect />
              </fixed-label-filter>
            </component>
            <component :is="itemTag" v-if="isCurGpuDevType(k)" class="pci-select-item pci-select-item--fixed mb-0">
              <fixed-label-filter :label="$t('compute.pci.gpu_mode')">
                <base-select :value="readPciRowField('pciGpuType', k)" @change="(val) => { setPciMapField('pciGpuType', k, val); onChangeGpuType(val, k) }" :options="getGpuTypeOptions(k)" />
              </fixed-label-filter>
            </component>
            <component :is="itemTag" class="pci-select-item pci-select-item--model mb-0">
              <fixed-label-filter :label="$t('compute.pci.vendor_model')">
                <base-select :value="readPciRowField('pciModel', k)" @change="(val) => { setPciMapField('pciModel', k, val); onChangeModel(val, k) }" :options="getRealPciOptions(realPciOptions, index)"
                  :selectProps="{ placeholder: $t('compute.text_147') }" />
              </fixed-label-filter>
            </component>
          </div>
          <a-row :gutter="[8,0]">
            <a-col :span="20">
              <div class="pci-count-memory-row">
                <component :is="itemTag" class="mb-0">
                  <fixed-label-filter :label="$t('compute.text_294')">
                    <a-radio-group class="p-0" :value="readPciRowField('pciCount', k)" @change="(e) => { setPciMapField('pciCount', k, e.target.value); onChangeCount(e, k) }">
                      <a-radio-button
                        v-for="item in pciCountOptions"
                        :value="item.key"
                        :disabled="item.disabled"
                        :key="item.key">{{ item.label }}</a-radio-button>
                    </a-radio-group>
                  </fixed-label-filter>
                </component>
                <component :is="itemTag" v-if="isHamiSharingMode(k)" class="mb-0 pci-memory-item">
                  <fixed-label-filter :label="$t('compute.pci.memory_request')">
                    <a-tooltip :title="getMemoryRangeTooltip(k)" class="p-0" placement="top">
                      <disk-size-input
                        :value="readPciRowField('memory_request', k)"
                        @change="(val) => { setPciMapField('memory_request', k, val); onChangeMemoryRequest(val, k) }"
                        :min="1"
                        :max="getMemorySizeMb(k) || Infinity"
                        :step="1"
                        :units="['MB', 'GB']"
                        value-unit="MB"
                        default-unit="GB"
                        @unitChange="(unit) => onMemoryUnitChange(k, unit)" />
                    </a-tooltip>
                  </fixed-label-filter>
                </component>
              </div>
            </a-col>
          </a-row>
        </component>
        <a-button
          v-if="index > 0"
          class="pci-group-row__remove"
          shape="circle"
          icon="minus"
          size="small"
          @click="remove(k)" />
      </div>
      <div class="d-flex align-items-center mb-2">
        <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
        <a-button type="link" @click="add">{{ $t('compute.pci.add_transparent_device') }}</a-button>
      </div>
    </template>
  </div>
</template>

<script>
import {
  GPU_COUNT_OPTIONS,
  GPU_TYPE_OPTION_MAP,
  ISOLATED_DEVICE_DEV_TYPE_OPTION_MAP,
  ISOLATED_DEVICE_SHARING_MODE_OPTION_MAP,
  matchPciDevice,
  getGpuTypeSelectOptions,
  resolveGpuTypeBySharingMode,
} from '@Compute/constants'
import DiskSizeInput from '@/sections/DiskSizeInput'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'
import { pickFields } from '@/utils/createFormDraft'
import pciModelMixin from './pciModelMixin'

let id = 0
export default {
  name: 'Pci',
  components: {
    DiskSizeInput,
  },
  mixins: [createFormFieldDraftMixin, pciModelMixin],
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    form: {
      type: Object,
      require: true,
    },
    /** a-form-model：与动态 field key 对齐的受控对象（通常为 form.fd，必传） */
    model: {
      type: Object,
      required: true,
    },
    pciDevTypeOptions: {
      type: Array,
      default: () => [],
    },
    pciOptions: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      pciEnable: false,
      pciKeys: [0],
      curPciDevType: '',
      curGpuType: GPU_TYPE_OPTION_MAP.HPC.value,
      memoryUnits: {},
      pciDraftRestoring: false,
    }
  },
  computed: {
    itemTag () {
      return 'a-form-model-item'
    },
    isPciEmpty () {
      return (this.pciOptions && this.pciOptions.length === 0) || !this.realPciDevTypeOptions.length
    },
    pciCountOptions () {
      const target = this.realPciOptions
      if (target.length) {
        return GPU_COUNT_OPTIONS.map(item => {
          return {
            ...item,
            disabled: item.key > target[0].count,
          }
        })
      }
      return GPU_COUNT_OPTIONS
    },
    realPciDevTypeOptions () {
      const seen = new Set()
      return this.pciDevTypeOptions.reduce((acc, item) => {
        const { dev_type } = item
        const key = item.sharing_mode ? `${dev_type}/${item.sharing_mode}` : dev_type
        if (seen.has(key)) return acc
        seen.add(key)
        const typeLabel = ISOLATED_DEVICE_DEV_TYPE_OPTION_MAP[dev_type]?.label || dev_type
        const sharingModeLabel = ISOLATED_DEVICE_SHARING_MODE_OPTION_MAP[item.sharing_mode]?.label || item.sharing_mode
        acc.push({
          key,
          dev_type,
          label: sharingModeLabel ? `${typeLabel}/${sharingModeLabel}` : typeLabel,
          sharing_mode: item.sharing_mode,
        })
        return acc
      }, [])
    },
    realPciOptions () {
      const { dev_type, sharing_mode } = this.parsePciDevTypeKey(this.curPciDevType)
      return this.pciOptions.filter(item => {
        if (!matchPciDevice(item, dev_type)) return false
        if (!sharing_mode) return true
        return item.sharing_mode === sharing_mode
      })
    },
  },
  watch: {
    pciEnable (val) {
      if (val) {
        this.init()
      } else {
        this.pciKeys.forEach(key => {
          this.removePciRow(key)
        })
      }
    },
    realPciDevTypeOptions: {
      immediate: true,
      handler () {
        if (this.pciDraftRestoring) return
        if (this.canRestoreFormFieldDraft()) {
          const draft = this.readFormFieldDraft()
          if (draft?.pciEnable) {
            this.tryApplyPciDraft(draft)
            return
          }
        }
        this.changeSelectedValue()
      },
    },
    pciOptions: {
      immediate: true,
      handler () {
        this.$nextTick(() => this.restoreFormFieldDraftFields())
      },
    },
    isPciEmpty (val) {
      if (val) this.pciEnable = false
    },
  },
  mounted () {
    if (this.resolvedModel?.pciEnable === undefined) {
      this.$set(this.resolvedModel, 'pciEnable', false)
    }
    this.pciEnable = !!this.resolvedModel?.pciEnable
  },
  methods: {
    getCreateFormFieldDraftSnapshot () {
      const enable = this.pciEnable
      if (!enable) return { pciEnable: false }
      const keys = [...this.pciKeys]
      const ret = { pciEnable: true, keys }
      ret.keys.forEach((key) => {
        ;['pciDevType', 'pciGpuType', 'pciModel', 'pciCount'].forEach((field) => {
          const val = this.readPciRowField(field, key)
          if (val !== undefined && val !== null && val !== '') {
            ret[`${field}[${key}]`] = val
          }
        })
      })
      return ret
    },
    applyCreateFormFieldDraft (draft) {
      this.tryApplyPciDraft(draft || this.readFormFieldDraft())
    },
    sanitizeDraftForRestore (draft) {
      if (draft == null || typeof draft !== 'object') return draft
      if (Array.isArray(this.formDraftRestoreFields) && this.formDraftRestoreFields.length) {
        return pickFields(draft, this.formDraftRestoreFields)
      }
      const ret = {}
      if (draft.pciEnable !== undefined) ret.pciEnable = draft.pciEnable
      if (Array.isArray(draft.keys)) ret.keys = draft.keys
      const keys = Array.isArray(draft.keys) ? draft.keys : []
      ;['pciDevType', 'pciGpuType', 'pciModel', 'pciCount'].forEach((field) => {
        keys.forEach((key) => {
          const bracketKey = `${field}[${key}]`
          if (draft[bracketKey] !== undefined) ret[bracketKey] = draft[bracketKey]
        })
      })
      return ret
    },
    tryApplyPciDraft (draft) {
      if (!draft?.pciEnable) return
      if (this.pciDraftRestoring) return
      this.pciDraftRestoring = true
      this.pciEnable = true
      const keys = Array.isArray(draft.keys) && draft.keys.length ? draft.keys : [0]
      keys.forEach((k) => {
        const n = Number(k)
        if (!Number.isNaN(n) && n > id) id = n
      })
      this.$nextTick(() => {
        try {
          this.$set(this.resolvedModel, 'pciEnable', true)
          this.syncPciFormKeys(keys)
          this.$nextTick(() => {
            try {
              const fields = {}
              keys.forEach((key) => {
                ;['pciDevType', 'pciGpuType', 'pciModel', 'pciCount'].forEach((field) => {
                  const bracketKey = `${field}[${key}]`
                  if (draft[bracketKey] !== undefined) fields[bracketKey] = draft[bracketKey]
                })
              })
              if (Object.keys(fields).length) {
                this.pciWriteFields(fields)
              }
              const first = keys[0]
              if (draft[`pciDevType[${first}]`]) this.curPciDevType = draft[`pciDevType[${first}]`]
              if (draft[`pciGpuType[${first}]`]) this.curGpuType = draft[`pciGpuType[${first}]`]
            } finally {
              this.$nextTick(() => {
                this.pciDraftRestoring = false
                this.$nextTick(() => this.changeSelectedValue())
              })
            }
          })
        } catch (e) {
          this.pciDraftRestoring = false
        }
      })
    },

    parsePciDevTypeKey (key) {
      if (!key) return { dev_type: '', sharing_mode: '' }
      const idx = key.indexOf('/')
      if (idx === -1) return { dev_type: key, sharing_mode: '' }
      return {
        dev_type: key.slice(0, idx),
        sharing_mode: key.slice(idx + 1),
      }
    },
    getPciOptionByKey (key) {
      const pciKey = key || this.curPciDevType
      return this.realPciDevTypeOptions.find(item => item.key === pciKey)
    },
    fdPciVal (field, key) {
      return this.readPciRowField(field, key)
    },
    isCurGpuDevType (key) {
      const pciKey = this.fdPciVal('pciDevType', key) || this.curPciDevType
      const { dev_type } = this.parsePciDevTypeKey(pciKey)
      return dev_type === 'GPU'
    },
    isHamiSharingMode (key) {
      const pciKey = this.fdPciVal('pciDevType', key) || this.curPciDevType
      const option = this.getPciOptionByKey(pciKey)
      return option?.sharing_mode === 'HAMI'
    },
    getGpuTypeOptions (key) {
      const pciKey = this.fdPciVal('pciDevType', key) || this.curPciDevType
      const option = this.getPciOptionByKey(pciKey)
      return getGpuTypeSelectOptions(option?.sharing_mode)
    },
    getMemorySizeMb (key) {
      const modelKey = this.fdPciVal('pciModel', key)
      const curPci = this.pciOptions.find(o => o.key === modelKey) || this.getRealPciOptions(this.realPciOptions, key)[0]
      return curPci?.memory_size_mb
    },
    getMemoryRangeTooltip (key) {
      const maxMb = this.getMemorySizeMb(key)
      if (!maxMb) return ''
      const unit = this.memoryUnits[key] || 'GB'
      const factor = unit === 'GB' ? 1024 : 1
      const min = 1 / factor
      const max = maxMb / factor
      const fmt = (n) => (Number.isInteger(n) ? n : Number(n.toFixed(3)))
      return this.$t('compute.pci.memory_request.range', [fmt(min), fmt(max), unit])
    },
    onMemoryUnitChange (key, unit) {
      this.memoryUnits[key] = unit
    },
    init () {
      this.initialValue()
    },
    initialValue (rowId = 0) {
      this.$nextTick(() => {
        const pciDevType = this.curPciDevType || (this.getRealPciDevTypeOptions(this.realPciDevTypeOptions).length ? this.getRealPciDevTypeOptions(this.realPciDevTypeOptions)[0].key : '')
        const { sharing_mode } = this.parsePciDevTypeKey(pciDevType)
        this.curGpuType = resolveGpuTypeBySharingMode(this.curGpuType, sharing_mode)
        const firstModel = this.fdPciVal('pciModel', 0) || (this.getRealPciOptions(this.realPciOptions).length ? this.getRealPciOptions(this.realPciOptions)[0].key : '')
        const fields = {
          [`pciDevType[${rowId}]`]: pciDevType,
          [`pciModel[${rowId}]`]: firstModel,
          [`pciCount[${rowId}]`]: 1,
        }
        if (this.parsePciDevTypeKey(pciDevType).dev_type === 'GPU') {
          fields[`pciGpuType[${rowId}]`] = this.curGpuType
        }
        this.pciWriteFields(fields)
      })
    },
    changeSelectedValue () {
      if (this.pciDraftRestoring) return
      const keys = this.pciKeys
      keys.forEach(key => {
        const curType = this.fdPciVal('pciDevType', key)
        if (curType && !this.getRealPciDevTypeOptions(this.realPciDevTypeOptions).some(item => item.key === curType)) {
          if (this.getRealPciDevTypeOptions(this.realPciDevTypeOptions).length) {
            const next = this.getRealPciDevTypeOptions(this.realPciDevTypeOptions)[0].key
            this.pciWriteFields({ [`pciDevType[${key}]`]: next })
            this.curPciDevType = next
          } else {
            this.pciWriteFields({ [`pciDevType[${key}]`]: undefined })
            this.curPciDevType = undefined
          }
        }
        this.$nextTick(() => {
          const curModel = this.fdPciVal('pciModel', key)
          if (curModel && !this.getRealPciOptions(this.realPciOptions, key).some(item => item.key === curModel)) {
            if (this.getRealPciOptions(this.realPciOptions, key).length && this.fdPciVal('pciDevType', key)) {
              const nextModel = this.getRealPciOptions(this.realPciOptions, key)[0].key
              this.pciWriteFields({ [`pciModel[${key}]`]: nextModel })
            } else {
              this.pciWriteFields({ [`pciModel[${key}]`]: undefined })
            }
          }
        })
      })
    },
    change (val) {
      this.pciEnable = val
      this.$emit('change', val)
    },
    onChangeDevType (val, key) {
      this.curPciDevType = val
      const { sharing_mode } = this.parsePciDevTypeKey(val)
      this.curGpuType = resolveGpuTypeBySharingMode(this.curGpuType, sharing_mode)
      const fields = {
        [`pciDevType[${key}]`]: val,
        [`pciModel[${key}]`]: this.realPciOptions[0]?.key,
        [`pciCount[${key}]`]: 1,
      }
      if (this.parsePciDevTypeKey(val).dev_type === 'GPU') {
        fields[`pciGpuType[${key}]`] = this.curGpuType
      }
      this.pciWriteFields(fields)
      if (!this.isHamiSharingMode(key)) {
        this.setPciMapField('memory_request', String(key), undefined)
      }
      this.reset()
    },
    onChangeGpuType (val, key) {
      this.curGpuType = val
      this.pciWriteFields({ [`pciGpuType[${key}]`]: val })
    },
    onChangeModel (val, key) {
      this.pciWriteFields({ [`pciModel[${key}]`]: val })
      const curPci = this.pciOptions.find(o => o.key === val)
      const max = curPci?.memory_size_mb
      const current = this.fdPciVal('memory_request', key)
      if (max && current > max) {
        this.pciWriteFields({ [`memory_request[${key}]`]: max })
      }
    },
    onChangeCount (e, key) {
      this.pciWriteFields({ [`pciCount[${key}]`]: e.target.value })
    },
    onChangeMemoryRequest (val, key) {
      this.pciWriteFields({ [`memory_request[${key}]`]: val })
    },
    syncPciFormKeys (keys) {
      this.pciKeys = [...keys]
    },
    add () {
      const nextKey = ++id
      const nextKeys = this.pciKeys.concat(nextKey)
      this.syncPciFormKeys(nextKeys)
      this.initialValue(nextKey)
    },
    remove (k) {
      if (this.pciKeys.length === 1) return
      this.syncPciFormKeys(this.pciKeys.filter(key => key !== k))
      this.removePciRow(k)
    },
    reset () {
      const toRemove = this.pciKeys.filter(key => key !== 0)
      this.syncPciFormKeys(this.pciKeys.filter(key => key === 0))
      toRemove.forEach(k => this.removePciRow(k))
    },
    getRealPciDevTypeOptions (realPciDevTypeOptions, index = 0) {
      let options = realPciDevTypeOptions
      if (index !== 0) {
        options = realPciDevTypeOptions.filter(o => {
          return this.fdPciVal('pciDevType', 0) === o.key
        })
      }
      if (!this.curPciDevType) {
        this.curPciDevType = options[0]?.key
      }
      return options
    },
    getRealPciOptions (realPciOptions, index = 0) {
      let options = realPciOptions
      if (index !== 0) {
        options = realPciOptions.filter(o => {
          return this.fdPciVal('pciModel', 0) === o.key
        })
      }
      return options
    },
    async validate () {
      if (!this.pciEnable) return true
      for (const k of this.pciKeys) {
        if (!this.readPciRowField('pciDevType', k)) {
          throw new Error(this.$t('compute.text_147'))
        }
        if (!this.readPciRowField('pciModel', k)) {
          throw new Error(this.$t('compute.text_147'))
        }
        if (this.isHamiSharingMode(k) && !this.readPciRowField('memory_request', k)) {
          throw new Error(this.$t('compute.pci.memory_request.required'))
        }
      }
      return true
    },
  },
}
</script>

<style lang="less" scoped>
.pci-group-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  &:last-of-type {
    margin-bottom: 8px;
  }
  &__remove {
    flex-shrink: 0;
  }
}
.pci-group {
  padding: 12px;
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
  border-radius: 4px;
  background: #fafafa;
}
.pci-select-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.pci-count-memory-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}
.pci-memory-item {
  margin-bottom: 0 !important;
}
.pci-select-item {
  margin-bottom: 0 !important;
  &--fixed {
    flex: 0 0 auto;
    /deep/ .ant-select {
      width: auto;
    }
  }
  &--model {
    flex: 1 1 500px;
    min-width: 200px;
    /deep/ .ant-select {
      width: 100%;
    }
  }
}
</style>
