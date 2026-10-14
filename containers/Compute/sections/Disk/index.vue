<template>
  <div class="disk-wrapper d-flex align-items-start w-auto">
    <a-form-item :wrapperCol="{ span: 24 }" :validate-status="storageStatusMap.type">
      <a-tag class="disk-type-tag" v-if="diskTypeLabel && !disabled">{{ diskTypeLabel }}</a-tag>
      <a-select
        v-else
        :value="diskFieldVal(diskFieldMap.type)"
        labelInValue
        :style="{minWidth: '300px'}"
        :options="diskTypeSelectOptions"
        @change="onTypeChange"
        :disabled="disabled || imageType === 'snapshot'" />
    </a-form-item>
    <a-form-item v-show="!hideSize" class="mx-1" :wrapperCol="{ span: 24 }">
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
    <!-- 高级 -->
    <template v-if="showAdvanced">
      <!-- 快照和挂载点不能共存 -->
      <template v-if="!showMountpoint && has('snapshot') && !disabled && imageType !== 'backup' && imageType !== 'snapshot'">
        <a-form-item v-if="showSnapshot" class="mx-1" :wrapperCol="{ span: 24 }">
          <base-select
            :value="diskFieldVal(diskFieldMap.snapshot)"
            @change="v => diskFieldSet(diskFieldMap.snapshot, v)"
            resource="snapshots"
            :params="snapshotsParams"
            v-model:item="snapshotObj"
            :select-props="{ placeholder: $t('compute.text_124') }" />
        </a-form-item>
        <a-button class="mt-1" type="link" v-show="!simplify" @click="toggleSnapshotShow">{{ showSnapshot ? $t('compute.text_135') : $t('compute.text_133') }}</a-button>
      </template>
      <template v-if="!showSnapshot && has('mount-point') && !disabled && imageType !== 'backup' && imageType !== 'snapshot'">
        <disk-mountpoint
          class="mx-1"
          v-if="showMountpoint"
          :model="model"
          :filetype-field="diskFieldMap.filetype[0]"
          :mount-path-field="diskFieldMap.mountPath[0]" />
          <a-button class="mt-1" type="link" @click="toggleMountpointShow">{{ showMountpoint ? $t('compute.text_135') : $t('compute.text_134') }}</a-button>
      </template>
      <template v-if="has('schedtag') && !showStorage && !isStorageShow && imageType !== 'backup' && imageType !== 'snapshot'">
        <schedtag-policy
          v-if="showSchedtag"
          :class="{ 'ml-2': hideSize }"
          :model="model || (form && form.fd)"
          :schedtag-field="diskFieldMap.schedtag[0]"
          :policy-field="diskFieldMap.policy[0]"
          :schedtag-params="schedtagParams"
          :policyReactInSchedtag="false" />
        <a-button v-if="!disabled" v-show="!simplify" class="mt-1" type="link" @click="toggleSchedtagShow">{{ showSchedtag ? $t('compute.text_135') : $t('compute.text_1315') }}</a-button>
      </template>
      <template v-if="has('storage') && !showSchedtag && imageType !== 'snapshot'">
        <storage
          style="min-width: 480px; max-width: 500px;"
          :diskKey="diskKey"
          :storage-field="diskFieldMap.storage[0]"
          :storageParams="storageParams"
          v-if="showStorage"
          :model="model"
          :storageHostParams="storageHostParams"
          @storageHostChange="(val) => $emit('storageHostChange', val)" />
        <a-button v-if="!disabled" type="link" @click="storageShowClick">{{ showStorage ? $t('compute.text_135') : $t('compute.text_1350') }}</a-button>
      </template>
      <!-- 关机重置：checkbox+文案作为整体，空间不足时整块换行，禁止字内折行 -->
      <a-form-item v-if="isAutoResetShow" class="disk-auto-reset-item mx-1">
        <a-checkbox :checked="diskFieldVal(diskFieldMap.auto_reset)" @change="e => diskFieldSet(diskFieldMap.auto_reset, e.target.checked)">{{ $t('compute.shutdown_auto_reset') }}</a-checkbox>
      </a-form-item>
      <template v-if="isVMware && imageType !== 'backup' && imageType !== 'snapshot'">
        <a-form-item class="mx-1" :wrapperCol="{ span: 24 }">
          <base-select
            v-if="showPreallocation"
            :value="diskFieldVal(diskFieldMap.preallocation)"
            @change="v => diskFieldSet(diskFieldMap.preallocation, v)"
            :options="preallocationOptions"
            :select-props="{ allowClear: true, placeholder: $t('common.select') }" />
        </a-form-item>
        <a-button v-if="!disabled" type="link" @click="preallocationShowClick">{{ showPreallocation ? $t('compute.text_135') : $t('compute.assign_preallocation') }}</a-button>
      </template>
      <!-- iops 创建时可设置，修改时禁用 -->
      <template v-if="has('iops') && !disabled && isIopsShow">
        <a-form-item>
          <a-tooltip :title="iopsTooltip" placement="top">
            <a-input-number
              v-if="showIops"
              :value="diskFieldVal(diskFieldMap.iops)"
              @change="v => diskFieldSet(diskFieldMap.iops, v)"
              placeholder="IOPS"
              :min="iopsLimit.min"
              :max="iopsLimit.max"
              :precision="0" />
          </a-tooltip>
        </a-form-item>
        <a-button type="link" @click="() => changeIopsShow(!showIops)">{{ showIops ? $t('compute.text_135') : $t('compute.set_iops') }}</a-button>
      </template>
      <!-- throughput 创建时可设置，修改时禁用 -->
      <template v-if="has('throughput') && !disabled && isThroughputShow">
        <a-form-item>
          <a-tooltip :title="throughputTooltip" placement="top">
            <a-input-number
              v-if="showThroughput"
              :value="diskFieldVal(diskFieldMap.throughput)"
              @change="v => diskFieldSet(diskFieldMap.throughput, v)"
              :placeholder="$t('compute.throughput')"
              :min="throughputLimit.min"
              :max="throughputLimit.max"
              :precision="0" />
          </a-tooltip>
        </a-form-item>
        <a-button type="link" @click="() => changeThroughputShow(!showThroughput)">{{ showThroughput ? $t('compute.text_135') : $t('compute.set_throughput') }}</a-button>
      </template>
    </template>
    <template v-if="has('iops') && disabled && isIopsShow && defaultIops && iamgeType !== 'backup' && imageType !== 'snapshot'">
      <span class="ml-2">{{ $t('compute.iops') }}: {{ defaultIops }}</span>
    </template>
    <template v-if="has('throughput') && disabled && isThroughputShow && defaultThroughput && imageType !== 'backup' && imageType !== 'snapshot'">
      <span class="ml-2">{{ $t('compute.throughput') }}: {{ defaultThroughput }}</span>
    </template>
    <!-- 磁盘容量预警信息提示 -->
    <a-tooltip v-if="storageStatusMap.tooltip">
      <template slot="title">
        <div slot="help">{{ storageStatusMap.tooltip }}</div>
      </template>
      <icon type="exclamation-circle" class="storage-icon" :class="storageClass" />
    </a-tooltip>
    <a-button v-if="!disabled && hasAdvanced" type="link" @click="() => showAdvanced = !showAdvanced">{{ showAdvanced ? $t('compute.hide_advanced') : $t('compute.advanced') }}</a-button>
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
      if (this.showStorage) {
        this.$emit('storageHostChange', { disk: this.diskKey, storageHosts: [] })
        this.clearDiskOptionalFields([this.diskFieldMap?.storage?.[0]])
      }
      this.showStorage = !this.showStorage
      this.emitOptionalChange('showStorage', this.showStorage)
    },
    toggleSchedtagShow () {
      if (this.showSchedtag) {
        this.clearDiskOptionalFields([
          this.diskFieldMap?.schedtag?.[0],
          this.diskFieldMap?.policy?.[0],
        ])
      }
      this.showSchedtag = !this.showSchedtag
      this.emitOptionalChange('showSchedtag', this.showSchedtag)
    },
    toggleSnapshotShow () {
      if (this.showSnapshot) {
        this.clearDiskOptionalFields([this.diskFieldMap?.snapshot?.[0]])
        this.snapshotObj = {}
      }
      this.showSnapshot = !this.showSnapshot
      this.emitOptionalChange('showSnapshot', this.showSnapshot)
    },
    toggleMountpointShow () {
      if (this.showMountpoint) {
        this.clearDiskOptionalFields([
          this.diskFieldMap?.filetype?.[0],
          this.diskFieldMap?.mountPath?.[0],
        ])
      }
      this.showMountpoint = !this.showMountpoint
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
.disk-wrapper {
  // 顶对齐：校验错误撑高某一项时，其它控件 / 操作按钮不跟着垂直居中错位
  align-items: flex-start;
  flex-wrap: wrap;
  // 行内 form-item 去底边距；行间距改由 wrapper / 外层 row 承担
  margin-bottom: 24px;
  :deep(.ant-form-item) {
    margin-bottom: 0;
  }
  // 与输入框同高并垂直居中文字，视觉居中且不受下方错误文案影响
  :deep(.ant-btn-link),
  :deep(.ant-checkbox-wrapper) {
    height: 32px;
    display: inline-flex;
    align-items: center;
  }
  // 关机自动重置：整块不收缩，文案不拆字；不够宽时随 flex-wrap 整组换行
  .disk-auto-reset-item {
    flex: 0 0 auto;
    max-width: none;
    :deep(.ant-form-item-row),
    :deep(.ant-form-item-control),
    :deep(.ant-form-item-control-input),
    :deep(.ant-form-item-control-input-content) {
      flex: 0 0 auto !important;
      width: auto !important;
      max-width: none !important;
      min-width: auto !important;
    }
    :deep(.ant-checkbox-wrapper) {
      white-space: nowrap;
    }
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
    margin-left: 10px;
    margin-top: 8px;
  }
}
</style>
