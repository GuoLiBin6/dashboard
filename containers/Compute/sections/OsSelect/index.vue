<template>
  <div class="image-select">
    <a-form-model-item class="mb-2" :prop="fieldProp('imageType')">
      <a-radio-group
        :value="fieldVal(imageOsFieldMap.imageType)"
        @change="change">
        <a-tooltip v-for="item in mirrorTypeOptions" :key="item.key" :title="item.tooltip" :mouseEnterDelay="0.5">
          <a-radio-button :value="item.key" :disabled="item.disabled">{{ item.label }}</a-radio-button>
        </a-tooltip>
      </a-radio-group>
    </a-form-model-item>
    <image-select
      ref="imageSelectRef"
      :cloud-type="type"
      :uefi="uefi"
      :vgaPci="vgaPci"
      :image-type="imageType"
      :model="model"
      :field="field"
      @input="imageInput"
      @updateImageMsg="updateImageMsg"
      :imageParams="imageParams"
      :cacheImageParams="cacheImageParams"
      :osType="osType"
      :osArch="osArch"
      :cloudproviderParamsExtra="cloudproviderParamsExtra"
      :cloudaccountId="cloudaccountId"
      :imageCloudproviderDisabled="imageCloudproviderDisabled"
      :sys-disk-size="sysDiskSize"
      :form="form"
      :edit="edit"
      :ignore-storage="effectiveIgnoreStorage"
      :prefer-draft="osSelectDraftPrefer"
      :hypervisor="hypervisor" />
  </div>
</template>

<script>
import * as R from 'ramda'
import { IMAGES_TYPE_MAP } from '@/constants/compute'
import { HYPERVISORS_MAP } from '@/constants'
import storage from '@/utils/storage'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import { resolveFieldMeta } from '@/utils/common/ant'
import ImageSelect from './ImageSelect'
import { IMAGE_OS_FIELDS, resolveImageOsFieldMap, resolveImageOsFieldMapForKey } from './fields'

export default {
  name: 'OsSelect',
  components: {
    ImageSelect,
  },
  mixins: [createFormFieldDraftMixin],
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    /** selection：radio/单选 select/switch 类，local + session 双写、可跨 tab 回填 */
    formDraftKind: {
      type: String,
      default: 'selection',
    },
    types: {
      type: Array,
    },
    /** 动态 bracket 字段后缀（如 K8S serverConfig 的 uuid） */
    field: {
      type: String,
      default: '',
    },
    /** a-form-model：与字段名对齐的受控对象 */
    model: {
      type: Object,
      required: true,
    },
    imageParams: {
      type: Object,
    },
    cacheImageParams: {
      type: Object,
    },
    type: {
      type: String,
      validator: val => ['public', 'private', 'idc', 'baremetal'].includes(val),
      required: true,
    },
    hypervisor: {
      type: String,
    },
    ignoreOptions: {
      type: Array,
      default: () => [],
    },
    osType: {
      type: String,
    },
    osArch: {
      type: String,
    },
    uefi: {
      type: Boolean,
      required: false,
    },
    vgaPci: {
      type: Boolean,
      required: false,
    },
    cloudproviderParamsExtra: {
      type: Object,
      default: () => ({}),
    },
    imageCloudproviderDisabled: {
      type: Boolean,
      default: false,
    },
    cloudaccountId: {
      type: String,
    },
    form: {
      type: Object,
      required: true,
      // end-state：有 model 时仅写 model；无 model 时读写 form.fd
      validator: val => !!val && typeof val === 'object',
    },
    sysDiskSize: {
      type: Number,
    },
    imageTypeMap: {
      type: Object,
      default: () => ({}),
    },
    edit: {
      type: Boolean,
      default: false,
    },
    ignoreStorage: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      imageType: this.model?.imageType,
      isFirstLoad: true,
    }
  },
  computed: {
    imageOsFieldMap () {
      if (this.field) return resolveImageOsFieldMapForKey(this.field)
      return resolveImageOsFieldMap()
    },
    isPublic () {
      return this.type === 'public'
    },
    isPrivate () {
      return this.type === 'private'
    },
    isIDC () {
      return this.type === 'idc'
    },
    isBaremetal () {
      return this.type === 'baremetal'
    },
    /**
     * 回填优先级（互斥）：
     * 1) query / 工单修改 → 只跟 query、工单
     * 2) 否则有草稿 → 只跟草稿
     * 3) 否则 → 只跟 storage
     */
    hasOsQueryPrefer () {
      const q = this.$route?.query || {}
      return !!(q.imageType || q.imageOs || q.imageId)
    },
    hasOsWorkflowPrefer () {
      if (this.ignoreStorage || this.edit) return true
      const osInit = this.model?.os ?? resolveFieldMeta(this.imageOsFieldMap?.os, 'os')?.initialValue
      const imageInit = this.model?.image ?? resolveFieldMeta(this.imageOsFieldMap?.image, 'image')?.initialValue
      return !!(osInit && imageInit)
    },
    hasOsDraftPrefer () {
      if (this.hasOsQueryPrefer || this.hasOsWorkflowPrefer) return false
      if (!this.canRestoreFormFieldDraft()) return false
      const draft = this.readFormFieldDraft()
      if (!draft || typeof draft !== 'object') return false
      return !!(draft.imageType || draft.os || draft.image)
    },
    shouldRestoreOsFromStorage () {
      if (this.ignoreStorage) return false
      if (this.hasOsQueryPrefer || this.hasOsWorkflowPrefer || this.hasOsDraftPrefer) return false
      return true
    },
    /** query / 工单 / 草稿控制时不读 storage，避免双源抢填 */
    effectiveIgnoreStorage () {
      return this.ignoreStorage || this.hasOsQueryPrefer || this.hasOsWorkflowPrefer || this.hasOsDraftPrefer
    },
    /** 传给 ImageSelect：仅草稿独占时回填 os/image */
    osSelectDraftPrefer () {
      if (!this.hasOsDraftPrefer) return null
      const draft = this.readFormFieldDraft()
      return draft && typeof draft === 'object' ? draft : null
    },
    mirrorTypeOptions () {
      let ret = [IMAGES_TYPE_MAP.standard, IMAGES_TYPE_MAP.customize]
      if (this.isIDC && this.hypervisor === HYPERVISORS_MAP.kvm.key) {
        ret.push(IMAGES_TYPE_MAP.iso, IMAGES_TYPE_MAP.host, { ...IMAGES_TYPE_MAP.snapshot, label: this.$t(IMAGES_TYPE_MAP.snapshot.t) }, IMAGES_TYPE_MAP.backup)
      } else if (this.hypervisor === HYPERVISORS_MAP.esxi.key) {
        ret.unshift(IMAGES_TYPE_MAP.vmware)
        ret.push(IMAGES_TYPE_MAP.iso)
        ret.push({ ...IMAGES_TYPE_MAP.snapshot, label: this.$t(IMAGES_TYPE_MAP.snapshot.t) })
      } else if (this.hypervisor === HYPERVISORS_MAP.proxmox.key) {
        ret.push(IMAGES_TYPE_MAP.private, IMAGES_TYPE_MAP.iso)
      } else if (this.hypervisor === HYPERVISORS_MAP.uis.key) {
        ret = [IMAGES_TYPE_MAP.private_iso]
      } else if (this.hypervisor === HYPERVISORS_MAP.cas.key) {
        ret = [IMAGES_TYPE_MAP.private_iso]
      } else if (this.hypervisor === HYPERVISORS_MAP.sangfor.key) {
        ret = [IMAGES_TYPE_MAP.private_iso]
      } else if (this.isPublic) {
        ret.unshift(IMAGES_TYPE_MAP.public_customize)
        ret.unshift(IMAGES_TYPE_MAP.public)
      } else if (this.isPrivate) {
        ret.unshift(IMAGES_TYPE_MAP.private)
      } else if (this.isBaremetal) {
        ret.push(IMAGES_TYPE_MAP.iso)
      }
      ret = ret.filter((item) => {
        return !this.ignoreOptions.includes(item.key)
      })
      if (this.types && !R.isEmpty(this.types)) {
        ret = ret.filter(({ key }) => {
          return this.types.indexOf(key) > -1
        })
      }
      if (!R.isEmpty(this.imageTypeMap)) {
        ret = ret.map(val => {
          const imageTypeMapItem = this.imageTypeMap[val.key] // 如果传了外部的 imageTypeMap，采用外部
          if (R.is(Object, imageTypeMapItem)) {
            return { ...val, ...imageTypeMapItem }
          }
          return val
        })
      }
      return ret
    },
  },
  watch: {
    mirrorTypeOptions: {
      immediate: true,
      handler () {
        // query / 工单独占时不回填草稿
        if (this.hasOsQueryPrefer || this.hasOsWorkflowPrefer) return
        this.$nextTick(() => this.restoreFormFieldDraftFields())
      },
    },
    hypervisor () {
      this.lockDraftImageTypeFromStorage()
      const prefer = this.resolveImageTypePrefer()
      const availableKeys = this.mirrorTypeOptions.map(item => item.key)
      // 草稿 imageType 尚未出现在 opts（如 kvm 未就绪）时，不要回落 standard 污染展示/后续逻辑
      if (this.hasOsDraftPrefer && this._lockedDraftImageType && !availableKeys.includes(this._lockedDraftImageType)) return
      // CAS/UIS/SangFor 等仅支持 private_iso，不能继续沿用私有云默认的 private
      const imageType = availableKeys.includes(prefer) ? prefer : (availableKeys[0] || prefer)
      this.applyImageTypeValue(imageType)
    },
    'form.fd.image.key': {
      handler () {
        // query 独占：首屏按 query.imageType 回填，不看草稿 / storage
        const queryImageType = this.$route?.query?.imageType
        if (this.isFirstLoad && queryImageType) {
          setTimeout(() => {
            this.applyImageTypeValue(queryImageType)
          }, 0)
        }
      },
      immediate: true,
    },
  },
  created () {
    this.initModelFields()
    this.lockDraftImageTypeFromStorage()
  },
  methods: {
    fieldProp (key) {
      return IMAGE_OS_FIELDS[key] || this.imageOsFieldMap[key]?.[0]
    },
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const v = getBracketValue(this.model, name)
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      if (!resolveFieldMeta(fieldTuple)) return
      setBracketValue(this, this.model, resolveFieldMeta(fieldTuple)?.name, value)
    },
    initModelFields () {
      const fieldDef = this.imageOsFieldMap.imageType
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return
      const { name, ...opts } = meta
      if (getBracketValue(this.model, name) === undefined && opts.initialValue !== undefined) {
        setBracketValue(this, this.model, name, opts.initialValue)
      }
    },
    async validate () {
      const ref = this.$refs.imageSelectRef
      if (ref?.validate) await ref.validate()
      return true
    },
    /**
     * 解析 imageType 偏好（与 os/image 同源互斥）
     */
    resolveImageTypePrefer () {
      const q = this.$route?.query || {}
      if (q.imageType) return q.imageType
      if (this.hasOsWorkflowPrefer) {
        return this.fieldVal(this.imageOsFieldMap.imageType) || this.form.fd?.imageType || this.imageOsFieldMap.imageType.initialValue
      }
      if (this.hasOsDraftPrefer) {
        const draft = this.readFormFieldDraft()
        return this._lockedDraftImageType || draft?.imageType || this.imageOsFieldMap.imageType.initialValue
      }
      if (this.shouldRestoreOsFromStorage) {
        const last = storage.get('oc_selected_image') || {}
        return last.imageType || this.fieldVal(this.imageOsFieldMap.imageType) || this.form.fd?.imageType || this.imageOsFieldMap.imageType.initialValue
      }
      return this.fieldVal(this.imageOsFieldMap.imageType) || this.form.fd?.imageType || this.imageOsFieldMap.imageType.initialValue
    },
    /**
     * 首屏 ImageSelect 默认 standard 拉镜像后会 persist；
     * 仅草稿独占时锁定草稿 imageType，避免被写成 standard。
     */
    lockDraftImageTypeFromStorage () {
      if (!this.formDraftKey || this._lockedDraftImageType) return
      if (!this.hasOsDraftPrefer) return
      const draft = this.readFormFieldDraft()
      if (draft?.imageType) {
        this._lockedDraftImageType = draft.imageType
      }
    },
    /** 合并写入 oc_selected_image（修改即记录） */
    persistSelectedImage (patch) {
      if (this.ignoreStorage || !patch || typeof patch !== 'object') return
      const last = storage.get('oc_selected_image') || {}
      storage.set('oc_selected_image', { ...last, ...patch })
    },
    /** 写 model，并同步 fi（SKU/disk 仍读 fi） */
    applyImageTypeValue (imageType) {
      if (!imageType) return
      this.imageType = imageType
      this.fieldSet(this.imageOsFieldMap.imageType, imageType)
      // fieldSet 已写 model；model 常即 form.fd。model !== fd 时补写
      if (this.form.fd && this.model !== this.form.fd) {
        this.form.fd.imageType = imageType
      }
      // SKU/disk 仍读 form.fi.imageType
      if (this.form.fi) {
        this.form.fi.imageType = imageType
      }
    },
    getCreateFormFieldDraftSnapshot () {
      this.lockDraftImageTypeFromStorage()
      let imageType = this.fieldVal(this.imageOsFieldMap.imageType)
      const os = this.model[IMAGE_OS_FIELDS.os]
      const image = this.model[IMAGE_OS_FIELDS.image]
      // 用户未改镜像类型前：禁止用当前 UI（常为 standard）覆盖草稿
      if (this.isFirstLoad && this.hasOsDraftPrefer && this._lockedDraftImageType) {
        imageType = this._lockedDraftImageType
      }
      return {
        imageType,
        os,
        image: image && typeof image === 'object' ? { key: image.key, label: image.label } : image,
      }
    },
    applyCreateFormFieldDraft (draft) {
      // query / 工单独占时不应用草稿
      if (this.hasOsQueryPrefer || this.hasOsWorkflowPrefer) return
      if (!draft) return
      if (draft.imageType && !this._lockedDraftImageType) {
        this._lockedDraftImageType = draft.imageType
      }
      // 仅先恢复镜像类型；os/image 等 ImageSelect 列表就绪后按 preferDraft 回填
      if (draft.imageType) {
        const available = this.mirrorTypeOptions.map(item => item.key)
        if (!available.length || available.includes(draft.imageType)) {
          this.applyImageTypeValue(draft.imageType)
        }
      }
    },

    imageInput (image) {
      this.$emit('change', image)
    },
    change (e) {
      this.isFirstLoad = false
      const imageType = e && e.target ? e.target.value : e
      this._lockedDraftImageType = imageType
      this.applyImageTypeValue(imageType)
      this.$emit('update:imageType', imageType)
      // 切类型即写 imageType；自动选中的镜像由 updateImageMsg 补写 os/id
      this.persistSelectedImage({ imageType })
    },
    updateImageMsg (...ret) {
      const { imageMsg: image, isAuto } = ret[0] || {}
      // 首屏自动选中不写，避免默认 standard 覆盖历史；用户切类型后 isFirstLoad=false 可写
      const skipStorageWrite = isAuto && this.isFirstLoad
      if (!skipStorageWrite && !this.ignoreStorage && image?.properties) {
        const os_distribution = image.properties.os_distribution
        const os_type = image.properties.os_type
        const patch = { imageType: this.imageType, imageId: image.id }
        if (os_distribution) {
          patch.imageOs = os_distribution.includes('Windows') ? 'Windows' : os_distribution
        } else if (os_type) {
          patch.imageOs = os_type
        }
        if (patch.imageOs) {
          this.persistSelectedImage(patch)
        }
      }
      this.$emit('updateImageMsg', ...ret)
    },
  },
}
</script>
