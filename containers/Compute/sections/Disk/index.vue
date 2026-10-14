<template>
  <div class="disk-wrapper">
    <div class="disk-wrapper__top">
      <div class="disk-wrapper__selects">
        <a-form-item :wrapperCol="{ span: 24 }" :validate-status="storageStatusMap.type" class="mb-0 disk-wrapper__type">
          <a-tag class="disk-type-tag" v-if="diskTypeLabel && !disabled">{{ diskTypeLabel }}</a-tag>
          <a-select
            v-else
            :value="diskFieldVal(diskFieldMap.type)"
            labelInValue
            :options="diskTypeSelectOptions"
            :style="{minWidth: '300px'}"
            @change="onTypeChange"
            :disabled="disabled || imageType === 'snapshot'" />
        </a-form-item>
        <a-form-item v-show="!hideSize" class="mb-0 disk-wrapper__size" :wrapperCol="{ span: 24 }">
          <a-tooltip :title="tooltip" placement="top">
            <disk-size-input
              :value="sizeFieldValue"
              @change="v => diskFieldSet(diskFieldMap.size, v)"
              :step="10"
              :min="minSize"
              :max="max"
              :normalizeGb="normalizeDiskSizeGb"
              :disabled="sizeDisabled || (imageType === 'backup' || imageType === 'snapshot')" />
          </a-tooltip>
        </a-form-item>
        <template v-if="has('iops') && disabled && isIopsShow && defaultIops && imageType !== 'backup' && imageType !== 'snapshot'">
          <span class="disk-wrapper__meta">{{ $t('compute.iops') }}: {{ defaultIops }}</span>
        </template>
        <template v-if="has('throughput') && disabled && isThroughputShow && defaultThroughput && imageType !== 'backup' && imageType !== 'snapshot'">
          <span class="disk-wrapper__meta">{{ $t('compute.throughput') }}: {{ defaultThroughput }}</span>
        </template>
        <a-tooltip v-if="storageStatusMap.tooltip">
          <template slot="title">
            <div slot="help">{{ storageStatusMap.tooltip }}</div>
          </template>
          <icon type="exclamation-circle" class="storage-icon" :class="storageClass" />
        </a-tooltip>
      </div>
      <div class="disk-wrapper__aside">
        <a-button
          v-if="!disabled && hasAdvanced"
          type="link"
          size="small"
          @click="toggleAdvanced">
          {{ showAdvanced ? $t('compute.hide_advanced') : $t('compute.advanced') }}
        </a-button>
        <slot name="aside" />
      </div>
    </div>

    <div v-if="showAdvanced && hasAdvanced" class="disk-wrapper__advanced">
      <div class="disk-wrapper__toggles">
        <template v-if="has('snapshot') && !disabled && imageType !== 'backup' && imageType !== 'snapshot'">
          <a-tooltip :title="snapshotDisabledTip || undefined">
            <span v-show="!simplify" class="disk-wrapper__toggle">
              <a-checkbox
                :checked="showSnapshot"
                :disabled="!!snapshotDisabledTip"
                @change="toggleSnapshotShow">
                {{ $t('compute.text_133') }}
              </a-checkbox>
            </span>
          </a-tooltip>
        </template>
        <template v-if="has('mount-point') && !disabled && imageType !== 'backup' && imageType !== 'snapshot'">
          <a-tooltip :title="mountpointDisabledTip || undefined">
            <span class="disk-wrapper__toggle">
              <a-checkbox
                :checked="showMountpoint"
                :disabled="!!mountpointDisabledTip"
                @change="toggleMountpointShow">
                {{ $t('compute.text_134') }}
              </a-checkbox>
            </span>
          </a-tooltip>
        </template>
        <template v-if="has('schedtag') && !disabled && imageType !== 'backup' && imageType !== 'snapshot'">
          <a-tooltip :title="schedtagDisabledTip || undefined">
            <span v-show="!simplify" class="disk-wrapper__toggle">
              <a-checkbox
                :checked="showSchedtag"
                :disabled="!!schedtagDisabledTip"
                @change="toggleSchedtagShow">
                {{ $t('compute.text_1315') }}
              </a-checkbox>
            </span>
          </a-tooltip>
        </template>
        <template v-if="has('storage') && !disabled && imageType !== 'snapshot'">
          <a-tooltip :title="storageDisabledTip || undefined">
            <span class="disk-wrapper__toggle">
              <a-checkbox
                :checked="showStorage"
                :disabled="!!storageDisabledTip"
                @change="storageShowClick">
                {{ $t('compute.text_1350') }}
              </a-checkbox>
            </span>
          </a-tooltip>
        </template>
        <span v-if="isAutoResetShow" class="disk-wrapper__toggle">
          <a-checkbox :checked="diskFieldVal(diskFieldMap.auto_reset)" @change="e => diskFieldSet(diskFieldMap.auto_reset, e.target.checked)">
            {{ $t('compute.shutdown_auto_reset') }}
          </a-checkbox>
        </span>
        <template v-if="isVMware && !disabled && imageType !== 'backup' && imageType !== 'snapshot'">
          <span class="disk-wrapper__toggle">
            <a-checkbox
              :checked="showPreallocation"
              @change="preallocationShowClick">
              {{ $t('compute.assign_preallocation') }}
            </a-checkbox>
          </span>
        </template>
        <template v-if="has('iops') && !disabled && isIopsShow">
          <span class="disk-wrapper__toggle">
            <a-checkbox
              :checked="showIops"
              @change="() => changeIopsShow(!showIops)">
              {{ $t('compute.set_iops') }}
            </a-checkbox>
          </span>
        </template>
        <template v-if="has('throughput') && !disabled && isThroughputShow">
          <span class="disk-wrapper__toggle">
            <a-checkbox
              :checked="showThroughput"
              @change="() => changeThroughputShow(!showThroughput)">
              {{ $t('compute.set_throughput') }}
            </a-checkbox>
          </span>
        </template>
      </div>

      <div v-if="hasExpandedAdvancedFields" class="disk-wrapper__fields">
        <div
          v-if="showSnapshot && !showMountpoint && has('snapshot') && !disabled && imageType !== 'backup' && imageType !== 'snapshot'"
          class="disk-wrapper__field">
          <div class="disk-wrapper__field-label">{{ $t('compute.text_133') }}</div>
          <a-form-item class="mb-0" :wrapperCol="{ span: 24 }">
            <base-select
              :value="diskFieldVal(diskFieldMap.snapshot)"
              @change="v => diskFieldSet(diskFieldMap.snapshot, v)"
              v-model:item="snapshotObj"
              resource="snapshots"
              :params="snapshotsParams"
              :item.sync="snapshotObj"
              :select-props="{ placeholder: $t('compute.text_124') }" />
          </a-form-item>
        </div>
        <div
          v-if="showMountpoint && !showSnapshot && has('mount-point') && !disabled && imageType !== 'backup' && imageType !== 'snapshot'"
          class="disk-wrapper__field disk-wrapper__field--mount">
          <div class="disk-wrapper__field-label">{{ $t('compute.text_134') }}</div>
          <disk-mountpoint
            :model="model"
            :filetype-field="diskFieldMap.filetype[0]"
            :mount-path-field="diskFieldMap.mountPath[0]" />
        </div>
        <div
          v-if="showSchedtag && has('schedtag') && !showStorage && !isStorageShow && imageType !== 'backup' && imageType !== 'snapshot'"
          class="disk-wrapper__field disk-wrapper__field--pair">
          <div class="disk-wrapper__field-label">{{ $t('compute.text_1315') }}</div>
          <schedtag-policy
            :model="model || (form && form.fd)"
            :schedtag-field="diskFieldMap.schedtag[0]"
            :policy-field="diskFieldMap.policy[0]"
            :schedtag-params="schedtagParams"
            :policyReactInSchedtag="false" />
        </div>
        <div
          v-if="showStorage && has('storage') && !showSchedtag && imageType !== 'snapshot'"
          class="disk-wrapper__field disk-wrapper__field--storage">
          <div class="disk-wrapper__field-label">{{ $t('compute.text_1350') }}</div>
          <storage
            :diskKey="diskKey"
            :storage-field="diskFieldMap.storage[0]"
            :storageParams="storageParams"
            :model="model"
            :storageHostParams="storageHostParams"
            @storageHostChange="(val) => $emit('storageHostChange', val)" />
        </div>
        <div
          v-if="showPreallocation && isVMware && imageType !== 'backup' && imageType !== 'snapshot'"
          class="disk-wrapper__field">
          <div class="disk-wrapper__field-label">{{ $t('compute.assign_preallocation') }}</div>
          <a-form-item class="mb-0" :wrapperCol="{ span: 24 }">
            <base-select
              :value="diskFieldVal(diskFieldMap.preallocation)"
              @change="v => diskFieldSet(diskFieldMap.preallocation, v)"
              :options="preallocationOptions"
              :select-props="{ allowClear: true, placeholder: $t('common.select') }" />
          </a-form-item>
        </div>
        <div
          v-if="showIops && has('iops') && !disabled && isIopsShow"
          class="disk-wrapper__field">
          <div class="disk-wrapper__field-label">{{ $t('compute.set_iops') }}</div>
          <a-form-item class="mb-0" :wrapperCol="{ span: 24 }">
            <a-tooltip :title="iopsTooltip" placement="top">
              <a-input-number
                :value="diskFieldVal(diskFieldMap.iops)"
                @change="v => diskFieldSet(diskFieldMap.iops, v)"
                placeholder="IOPS"
                :min="iopsLimit.min"
                :max="iopsLimit.max"
                :precision="0" />
            </a-tooltip>
          </a-form-item>
        </div>
        <div
          v-if="showThroughput && has('throughput') && !disabled && isThroughputShow"
          class="disk-wrapper__field">
          <div class="disk-wrapper__field-label">{{ $t('compute.set_throughput') }}</div>
          <a-form-item class="mb-0" :wrapperCol="{ span: 24 }">
            <a-tooltip :title="throughputTooltip" placement="top">
              <a-input-number
                :value="diskFieldVal(diskFieldMap.throughput)"
                @change="v => diskFieldSet(diskFieldMap.throughput, v)"
                :placeholder="$t('compute.throughput')"
                :min="throughputLimit.min"
                :max="throughputLimit.max"
                :precision="0" />
            </a-tooltip>
          </a-form-item>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { PREALLOCATION_OPTIONS } from '@Compute/constants'
import { HYPERVISORS_MAP } from '@/constants'
import SchedtagPolicy from '@/sections/SchedtagPolicy'
import DiskMountpoint from '@/sections/DiskMountpoint'
import DiskSizeInput from '@/sections/DiskSizeInput'
import { diskSupportTypeMedium } from '@/utils/common/hypervisor'
import Storage from './components/Storage'
import diskModelMixin from './diskModelMixin'
import { buildDataDiskFieldMap, resolveSystemDiskFieldMap } from './fields'

export default {
  name: 'Disk',
  components: {
    SchedtagPolicy,
    DiskMountpoint,
    Storage,
    DiskSizeInput,
  },
  mixins: [diskModelMixin],
  props: {
    diskKey: String,
    /** a-form-model end-state：与字段名对齐；有则只写 nested model，不双写 fc */
    model: {
      type: Object,
      default: null,
    },
    /** 自定义字段 map（overlay 等）；默认按 diskKey 自建 */
    fieldMap: {
      type: Object,
      default: null,
      validator: val => !val || (val.type && val.size),
    },
    typesMap: {
      type: Object,
      default: () => ({}),
    },
    hypervisor: {
      type: String,
    },
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      default: 0,
    },
    elements: {
      type: Array,
      required: true,
    },
    diskTypeLabel: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    simplify: {
      type: Boolean,
      default: false,
    },
    sizeDisabled: { // 磁盘大小的限制
      type: Boolean,
      default: false,
    },
    hideSize: {
      type: Boolean,
      default: false,
    },
    snapshotsParams: {
      type: Object,
      default: () => ({
        with_meta: true,
        cloud_env: 'onpremise',
        limit: 0,
      }),
    },
    schedtagParams: {
      type: Object,
      default: () => ({
        with_meta: true,
        cloud_env: 'onpremise',
        resource_type: 'storages',
        limit: 0,
      }),
    },
    storageStatusMap: {
      type: Object,
      default: () => ({}),
    },
    form: {
      type: Object,
      // end-state：有 model 时写 model；无 model 时读写 form.fd
      validator: val => !val || typeof val === 'object',
    },
    storageParams: {
      type: Object,
    },
    storageHostParams: Object,
    isStorageShow: {
      type: Boolean,
      default: false,
    },
    isIopsShow: {
      type: Boolean,
      default: false,
    },
    isThroughputShow: {
      type: Boolean,
      default: false,
    },
    iopsLimit: {
      type: Object,
      default: () => ({ min: 0 }),
    },
    throughputLimit: {
      type: Object,
      default: () => ({ min: 125, max: 1000 }),
    },
    isAutoResetShow: {
      type: Boolean,
      default: false,
    },
    defaultIops: {
      type: Number,
      default: 0,
    },
    defaultThroughput: {
      type: Number,
      default: 0,
    },
    imageType: {
      type: String,
    },
  },
  data () {
    return {
      showSchedtag: false,
      showMountpoint: false,
      showSnapshot: false,
      showStorage: false,
      showIops: false,
      showThroughput: false,
      showPreallocation: false,
      snapshotObj: {},
      preallocationOptions: PREALLOCATION_OPTIONS.filter(item => item.value !== 'off').map(item => {
        return {
          id: item.value,
          name: item.label,
        }
      }),
      showAdvanced: false,
    }
  },
  computed: {
    diskFieldMap () {
      if (this.fieldMap) return this.fieldMap
      if (this.diskKey === 'system' || !this.diskKey) return resolveSystemDiskFieldMap()
      return buildDataDiskFieldMap(this.diskKey)
    },
    tooltip () {
      return this.$t('compute.text_137', [this.minSize, this.max])
    },
    // 显式绑定：model / fd
    sizeFieldValue () {
      const v = this.diskFieldVal(this.diskFieldMap?.size)
      if (v !== undefined && v !== null && v !== '') return v
      return undefined
    },
    iopsTooltip () {
      if (this.iopsLimit.min != null && this.iopsLimit.max != null) {
        return `${this.iopsLimit.min} ~ ${this.iopsLimit.max}`
      }
      return ''
    },
    throughputTooltip () {
      if (this.throughputLimit.min != null && this.throughputLimit.max != null) {
        return `${this.throughputLimit.min} ~ ${this.throughputLimit.max} MiB/s`
      }
      return ''
    },
    minSize () {
      let snapshotSize = this.snapshotObj.size || 0
      if (R.is(Number, snapshotSize)) {
        snapshotSize = snapshotSize / 1024
      }
      return Math.max(this.min, snapshotSize)
    },
    storageClass () {
      return `${this.storageStatusMap.type}-color`
    },
    isVMware () {
      return this.hypervisor === HYPERVISORS_MAP.esxi.key
    },
    hasAdvanced () {
      return this.has('snapshot') || this.has('mount-point') || this.has('schedtag') || this.has('storage') || this.has('iops') || this.has('throughput') || this.isAutoResetShow || this.isVMware
    },
    hasExpandedAdvancedFields () {
      return !!(this.showSnapshot || this.showMountpoint || this.showSchedtag || this.showStorage || this.showPreallocation || this.showIops || this.showThroughput)
    },
    snapshotDisabledTip () {
      return this.showMountpoint ? this.$t('compute.select_mountpoint_no_snapshot') : ''
    },
    mountpointDisabledTip () {
      return this.showSnapshot ? this.$t('compute.select_snapshot_no_mountpoint') : ''
    },
    schedtagDisabledTip () {
      return (this.showStorage || this.isStorageShow) ? this.$t('compute.select_storage_no_schetag') : ''
    },
    storageDisabledTip () {
      return this.showSchedtag ? this.$t('compute.select_schetag_no_storage') : ''
    },
    // antdv4 labelInValue + a-select-option 插槽会得到 VNode label（循环引用），改用 options 保证为字符串
    diskTypeSelectOptions () {
      return Object.keys(this.typesMap || {}).map(key => ({
        value: key,
        label: this.typesMap[key].label,
      }))
    },
  },
  watch: {
    'snapshotObj.size' (val) {
      if (val) {
        const size = val / 1024
        this.$emit('snapshotChange', size)
      }
    },
    showStorage (v) {
      this.$emit('showStorageChange', v)
    },
    elements (val, oldV) {
      if (!R.equals(val, oldV)) this.init()
    },
    // iops 上下限随盘大小变化时，主动夹取已填值，避免仅展示受 min 限制
    iopsLimit: {
      handler (limit) {
        if (!this.showIops || !this.diskFieldMap?.iops || (!this.model && !this.form?.fd)) return
        const key = this.diskFieldMap.iops[0]
        const cur = Number(this.diskFieldVal(this.diskFieldMap.iops))
        if (!Number.isFinite(cur)) return
        const min = Number(limit?.min)
        const max = Number(limit?.max)
        let next = cur
        if (Number.isFinite(min) && next < min) next = min
        if (Number.isFinite(max) && next > max) next = max
        if (next !== cur) this.setDiskFormFields({ [key]: next })
      },
      deep: true,
    },
    throughputLimit: {
      handler (limit) {
        if (!this.showThroughput || !this.diskFieldMap?.throughput || (!this.model && !this.form?.fd)) return
        const key = this.diskFieldMap.throughput[0]
        const cur = Number(this.diskFieldVal(this.diskFieldMap.throughput))
        if (!Number.isFinite(cur)) return
        const min = Number(limit?.min)
        const max = Number(limit?.max)
        let next = cur
        if (Number.isFinite(min) && next < min) next = min
        if (Number.isFinite(max) && next > max) next = max
        if (next !== cur) this.setDiskFormFields({ [key]: next })
      },
      deep: true,
    },
  },
  methods: {

    onTypeChange (v) {
      this.diskFieldSet(this.diskFieldMap.type, v)
      this.typeChange(v)
    },
    setDiskFormFields (values) {
      this.diskWriteFields(values)
    },
    async validate () {
      await this.runFieldMapRules(this.diskFieldMap.type, this.diskFieldVal(this.diskFieldMap.type))
      await this.runFieldMapRules(this.diskFieldMap.size, this.diskFieldVal(this.diskFieldMap.size))
      if (this.showSchedtag) {
        await this.runFieldMapRules(this.diskFieldMap.schedtag, this.diskFieldVal(this.diskFieldMap.schedtag))
        await this.runFieldMapRules(this.diskFieldMap.policy, this.diskFieldVal(this.diskFieldMap.policy))
      }
      if (this.showStorage) {
        await this.runFieldMapRules(this.diskFieldMap.storage, this.diskFieldVal(this.diskFieldMap.storage))
      }
      if (this.showSnapshot) {
        await this.runFieldMapRules(this.diskFieldMap.snapshot, this.diskFieldVal(this.diskFieldMap.snapshot))
      }
      if (this.showMountpoint) {
        await this.runFieldMapRules(this.diskFieldMap.filetype, this.diskFieldVal(this.diskFieldMap.filetype))
        if (this.diskFieldVal(this.diskFieldMap.filetype) !== 'swap') {
          await this.runFieldMapRules(this.diskFieldMap.mountPath, this.diskFieldVal(this.diskFieldMap.mountPath))
        }
      }
      if (this.showIops) {
        await this.runFieldMapRules(this.diskFieldMap.iops, this.diskFieldVal(this.diskFieldMap.iops))
      }
      if (this.showThroughput) {
        await this.runFieldMapRules(this.diskFieldMap.throughput, this.diskFieldVal(this.diskFieldMap.throughput))
      }
      return true
    },
    normalizeDiskSizeGb (gb) {
      let num = gb
      if (this.hypervisor === HYPERVISORS_MAP.qcloud.key) {
        num = Math.floor(num / 10) * 10
      }
      return num
    },
    initData (data, hyper) {
      const apply = () => {
        const typeKey = this.diskFieldMap.type[0]
        const sizeKey = this.diskFieldMap.size[0]
        const typeVal = {
          key: diskSupportTypeMedium(hyper) ? `${data.backend}/${data.medium}` : data.backend,
          label: '',
        }
        const sizeVal = data.size / 1024
        this.setDiskFormFields({
          [typeKey]: typeVal,
          [sizeKey]: sizeVal,
        })
        if (data.schedtags || data.storage_id || data.auto_reset || data.iops || data.throughput || data.preallocation) {
          this.showAdvanced = true
          if (data.schedtags && data.schedtags.length) {
            this.showSchedtag = true
            this.$nextTick(() => {
              this.setDiskFormFields({
                [this.diskFieldMap.schedtag[0]]: data.schedtags[0].id,
                [this.diskFieldMap.policy[0]]: data.schedtags[0].strategy,
              })
            })
          }
          if (data.storage_id) {
            this.showStorage = true
            this.$nextTick(() => {
              this.setDiskFormFields({
                [this.diskFieldMap.storage[0]]: data.storage_id,
              })
            })
          }
          if (data.auto_reset) {
            this.$nextTick(() => {
              this.setDiskFormFields({
                [this.diskFieldMap.auto_reset[0]]: data.auto_reset,
              })
            })
          }
          if (data.iops) {
            this.showIops = true
            this.$nextTick(() => {
              this.setDiskFormFields({
                [this.diskFieldMap.iops[0]]: data.iops,
              })
            })
          }
          if (data.throughput) {
            this.showThroughput = true
            this.$nextTick(() => {
              this.setDiskFormFields({
                [this.diskFieldMap.throughput[0]]: data.throughput,
              })
            })
          }
          if (data.preallocation) {
            this.showPreallocation = true
            this.$nextTick(() => {
              this.setDiskFormFields({
                [this.diskFieldMap.preallocation[0]]: data.preallocation,
              })
            })
          }
        }
      }
      // 立即写一次，再延迟一次盖住 SystemDisk.setDefaultType(debounce 1s) 的默认值
      apply()
      setTimeout(apply, 1200)
    },
    setValues (values) {
      for (const key in values) {
        this[key] = values[key]
      }
    },
    has (element) {
      return this.elements.includes(element)
    },
    parser (value) {
      value = String(value)
      return value.replace(/[GB]*/g, '')
    },
    formatter (num) {
      const n = this.parser(num)
      if (this.hypervisor === HYPERVISORS_MAP.qcloud.key) {
        num = Math.floor(num / 10) * 10
      }
      return `${n}GB`
    },
    typeChange (val) {
      const key = val?.key ?? val?.value
      const label = this.typesMap?.[key]?.label || (typeof val?.label === 'string' ? val.label : key)
      // 统一为业务侧 { key, label }，避免 VNode label 传入 a-tag / 下游表单
      this.$emit('diskTypeChange', { key, value: key, label })
      if (this.showStorage) {
        this.$emit('storageHostChange', { disk: this.diskKey, storageHosts: [] })
      }
      this.snapshotObj = {}
    },
    init () {
      this.showSchedtag = false
      this.showMountpoint = false
      this.showSnapshot = false
      this.showStorage = false
      this.snapshotObj = {}
    },
    toggleAdvanced () {
      this.showAdvanced = !this.showAdvanced
      this.$emit('advancedChange', this.showAdvanced)
    },
    formatterLabel (row) {
      return row.description ? `${row.name} / ${row.description}` : row.name
    },
    /** 取消可选高级项时清掉对应表单字段，避免展示关闭但提交/草稿仍带值 */
    clearDiskOptionalFields (fieldKeys = []) {
      const clear = {}
      fieldKeys.filter(Boolean).forEach((key) => { clear[key] = undefined })
      if (!Object.keys(clear).length) return
      // diskWriteFields 已嵌套删除
      this.setDiskFormFields(clear)
    },
    emitOptionalChange (flag, show) {
      this.$emit('optionalChange', { flag, show })
    },
    storageShowClick () {
      const next = !this.showStorage
      if (next && this.showSchedtag) {
        this.clearDiskOptionalFields([
          this.diskFieldMap?.schedtag?.[0],
          this.diskFieldMap?.policy?.[0],
        ])
        this.showSchedtag = false
        this.emitOptionalChange('showSchedtag', false)
      }
      if (!next) {
        this.$emit('storageHostChange', { disk: this.diskKey, storageHosts: [] })
        this.clearDiskOptionalFields([this.diskFieldMap?.storage?.[0]])
      }
      this.showStorage = next
      this.emitOptionalChange('showStorage', this.showStorage)
    },
    toggleSchedtagShow () {
      const next = !this.showSchedtag
      if (next && this.showStorage) {
        this.$emit('storageHostChange', { disk: this.diskKey, storageHosts: [] })
        this.clearDiskOptionalFields([this.diskFieldMap?.storage?.[0]])
        this.showStorage = false
        this.emitOptionalChange('showStorage', false)
      }
      if (!next) {
        this.clearDiskOptionalFields([
          this.diskFieldMap?.schedtag?.[0],
          this.diskFieldMap?.policy?.[0],
        ])
      }
      this.showSchedtag = next
      this.emitOptionalChange('showSchedtag', this.showSchedtag)
    },
    toggleSnapshotShow () {
      const next = !this.showSnapshot
      if (next && this.showMountpoint) {
        this.clearDiskOptionalFields([
          this.diskFieldMap?.filetype?.[0],
          this.diskFieldMap?.mountPath?.[0],
        ])
        this.showMountpoint = false
        this.emitOptionalChange('showMountpoint', false)
      }
      if (!next) {
        this.clearDiskOptionalFields([this.diskFieldMap?.snapshot?.[0]])
        this.snapshotObj = {}
      }
      this.showSnapshot = next
      this.emitOptionalChange('showSnapshot', this.showSnapshot)
    },
    toggleMountpointShow () {
      const next = !this.showMountpoint
      if (next && this.showSnapshot) {
        this.clearDiskOptionalFields([this.diskFieldMap?.snapshot?.[0]])
        this.snapshotObj = {}
        this.showSnapshot = false
        this.emitOptionalChange('showSnapshot', false)
      }
      if (!next) {
        this.clearDiskOptionalFields([
          this.diskFieldMap?.filetype?.[0],
          this.diskFieldMap?.mountPath?.[0],
        ])
      }
      this.showMountpoint = next
      this.emitOptionalChange('showMountpoint', this.showMountpoint)
    },
    preallocationShowClick () {
      if (this.showPreallocation) {
        this.clearDiskOptionalFields([this.diskFieldMap?.preallocation?.[0]])
      }
      this.showPreallocation = !this.showPreallocation
      this.emitOptionalChange('showPreallocation', this.showPreallocation)
      if (this.showPreallocation && this.isVMware) {
        const fd = this.model || this.form?.fd || {}
        const systemDiskPreallocation = fd.systemDiskPreallocation
        this.$nextTick(() => {
          if (this.diskKey !== 'system') {
            this.setDiskFormFields({
              [`dataDiskPreallocation[${this.diskKey}]`]: systemDiskPreallocation,
            })
          }
        })
      }
    },
    changeIopsShow (show) {
      if (this.showIops && !show) {
        this.clearDiskOptionalFields([this.diskFieldMap?.iops?.[0]])
      }
      this.showIops = show
      this.emitOptionalChange('showIops', show)
    },
    changeThroughputShow (show) {
      if (this.showThroughput && !show) {
        this.clearDiskOptionalFields([this.diskFieldMap?.throughput?.[0]])
      }
      this.showThroughput = show
      this.emitOptionalChange('showThroughput', show)
    },
  },
}
</script>

<style lang="less" scoped>
@import '~@/styles/less/theme';

.disk-wrapper {
  width: 100%;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  -webkit-font-smoothing: antialiased;

  &__top {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__selects {
    display: flex;
    flex: 0 1 auto;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
  }

  &__type,
  &__size {
    flex: 0 0 auto;

    ::v-deep .ant-form-item-control {
      line-height: 32px;
    }
  }

  &__meta {
    display: inline-flex;
    align-items: center;
    height: 32px;
    color: rgba(0, 0, 0, 0.65);
    white-space: nowrap;
  }

  &__aside {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 4px;
    height: 32px;
  }

  &__advanced {
    margin-top: 10px;
    padding: 8px 0 4px;
    border-top: 1px solid #f0f0f0;
  }

  &__toggles {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 32px;
    column-gap: 16px;
    row-gap: 4px;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    height: 32px;
    margin: 0;
    vertical-align: top;
    color: rgba(0, 0, 0, 0.45);

    ::v-deep .ant-checkbox + span {
      color: rgba(0, 0, 0, 0.45);
      padding-right: 0;
    }

    ::v-deep .ant-checkbox-wrapper {
      margin: 0;
      color: rgba(0, 0, 0, 0.45);
    }

    ::v-deep .ant-checkbox-wrapper-disabled {
      cursor: not-allowed;
    }
  }

  &__fields {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px;
    margin-top: 10px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 0 0 auto;
    width: 240px;

    &--mount {
      width: auto;

      ::v-deep > .d-flex {
        display: inline-flex;
        flex-wrap: nowrap;
        align-items: flex-start;
        width: auto;
        gap: 8px;
      }

      ::v-deep .ant-form-item {
        flex: 0 0 auto;
        width: auto;
        margin-right: 0 !important;
      }

      ::v-deep .ant-select {
        width: 100px;
        min-width: 100px;
      }

      ::v-deep .ant-input {
        width: 180px;
        min-width: 180px;
      }
    }

    &--storage {
      width: 500px;

      ::v-deep .network-item {
        width: 100%;
        margin-right: 0 !important;
      }

      ::v-deep .base-select-wrap,
      ::v-deep .base-select,
      ::v-deep .ant-select {
        width: 100% !important;
      }
    }

    &--pair {
      width: 560px;

      ::v-deep > .d-flex {
        display: flex !important;
        width: 100%;
        align-items: flex-start;
        gap: 8px;
      }

      // 覆盖 SchedtagPolicy 的 w-50 + mr-1，避免两框重叠
      ::v-deep > .d-flex > .ant-form-item {
        flex: 1 1 0;
        width: auto !important;
        margin-right: 0 !important;
        min-width: 0;
      }

      ::v-deep .ant-form-extra {
        white-space: nowrap;
      }
    }

    ::v-deep .ant-form-item {
      margin-bottom: 0;
    }

    ::v-deep .ant-form-item-control {
      line-height: 32px;
    }

    ::v-deep .ant-input {
      height: 32px;
    }

    ::v-deep .ant-select-selection--single {
      height: 32px;
    }

    ::v-deep .ant-select-selection__rendered {
      line-height: 30px;
    }
  }

  &__field-label {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
    line-height: 20px;
  }

  .disk-type-tag.ant-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 32px;
    margin: 0;
    padding: 0 10px;
    line-height: 30px;
    border-radius: 6px;
    font-size: 14px;
    color: var(--ant-color-primary, #1890ff);
    background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, #fff);
    border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 40%, #fff);
  }

  .storage-icon {
    position: relative;
    top: 8px;
    margin-left: 2px;
  }
}
</style>
