<template>
  <div>
    <a-form-item :label="$t('common.name')">
      <a-input
        :value="fieldVal(containerFieldMap.name)"
        @change="e => fieldSet(containerFieldMap.name, e.target.value)"
        :placeholder="$t('common.tips.input', [$t('common.name')])" />
    </a-form-item>
    <a-form-item :label="$t('compute.repo.image.source')">
      <a-radio-group :value="source" @change="handleSourceChange">
        <a-radio-button value="custom">{{ $t('compute.repo.image.custom') }}</a-radio-button>
        <a-radio-button value="registry">{{ $t('compute.repo.image.registry') }}</a-radio-button>
        <a-radio-button value="container_image">{{ $t('compute.repo.image.container_image') }}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item v-if="source === 'custom'" :label="$t('compute.repo.container_image')">
      <a-input
        :value="fieldVal(containerFieldMap.image)"
        @change="e => fieldSet(containerFieldMap.image, e.target.value)"
        :placeholder="$t('common.tips.input', [$t('compute.repo.container_image')])" />
    </a-form-item>
    <a-form-item v-else-if="source === 'registry'" :label="$t('compute.repo.container_image')">
      <mirror-registry @change="v => fieldSet(containerFieldMap.registryImage, v)" @credential-change="handleCredentialChange" />
      <a-input v-show="false" :value="fieldVal(containerFieldMap.imageCredentialId)" />
    </a-form-item>
    <a-form-item v-else :label="$t('compute.repo.container_image')">
      <a-select
        :value="fieldVal(containerFieldMap.containerImageId)"
        @change="v => { fieldSet(containerFieldMap.containerImageId, v); handleContainerImageChange(v) }"
        showSearch
        :filterOption="filterOption"
        :loading="containerImageLoading"
        :placeholder="$t('common.tips.select', [$t('compute.repo.image.container_image')])"
        allowClear>
        <a-select-option
          v-for="img in containerImages"
          :key="img.value"
          :value="img.value"
          :label="img.label">
          <div>{{ img.label }}</div>
          <div style="font-size: 12px; color: #999;">{{ img.ref }}</div>
        </a-select-option>
      </a-select>
      <div v-if="!containerImageLoading && containerImages.length === 0" class="mt-2">
        <a-alert type="info" show-icon>
          <template slot="message">
            {{ $t('compute.repo.image.container_image.empty_tip') }}
            <router-link to="/container_image">{{ $t('compute.repo.image.container_image.manage') }}</router-link>
          </template>
        </a-alert>
      </div>
    </a-form-item>
    <a-form-item label="CPU" v-show="false">
      <a-input
        :placeholder="$t('common.tips.input', [$t('compute.repo.cpu_cores')])"
        type="number"
        :value="fieldVal(containerFieldMap.cpu)"
        @change="e => fieldSet(containerFieldMap.cpu, e.target.value)"
        :addonAfter="$t('compute.repo.cpu_cores.unit')"
        :min="1"
        @blur="e => formatInput(e, 'cpu')" />
    </a-form-item>
    <a-form-item :label="$t('compute.repo.memory')" v-show="false">
      <a-input
        :value="fieldVal(containerFieldMap.memory)"
        @change="e => fieldSet(containerFieldMap.memory, e.target.value)"
        :placeholder="$t('common.tips.input', [$t('compute.repo.memory')])"
        type="number"
        addonAfter="G"
        :min="1"
        @blur="e => formatInput(e, 'memory')" />
    </a-form-item>
    <a-form-item :label="$t('compute.repo.command')">
      <a-input :value="fieldVal(containerFieldMap.command)" @change="e => fieldSet(containerFieldMap.command, e.target.value)" :disabled="imageHasCommand" :placeholder="$t('compute.repo.command.placeholder')" />
      <div v-if="imageHasCommand" class="ant-form-explain">{{ $t('compute.repo.image.container_image.locked_tip') }}</div>
    </a-form-item>
    <a-form-item :label="$t('compute.repo.command.params')">
      <a-input :value="fieldVal(containerFieldMap.arg)" @change="e => fieldSet(containerFieldMap.arg, e.target.value)" :disabled="imageHasArgs" :placeholder="$t('compute.repo.command.params.placeholder')" />
      <div v-if="imageHasArgs" class="ant-form-explain">{{ $t('compute.repo.image.container_image.locked_tip') }}</div>
    </a-form-item>
    <a-form-item :label="$t('compute.repo.data_volume')">
      <labels
        ref="volumeMountRef"
        :fields="volumeMountFields"
        :title="$t('compute.repo.storage_statement')"
        :keyLabel="$t('compute.repo.storage_statement')"
        :valueLabel="$t('compute.repo.mount_point')"
        :keyPlaceholder="$t('common.tips.select', [$t('compute.repo.storage_volume')])"
        :valuePlaceholder="$t('compute.repo.mount_point.example')"
        :keyBaseSelectProps="keyBaseSelectProps"
        :checkedValues="checkedValues"
        :model="resolvedModel"
        @label-change="labelChangeHandle" />
    </a-form-item>
    <a-form-item :label="$t('compute.repo.env_variables')">
      <labels
        ref="envRef"
        :fields="envFields"
        :key-rules="envKeyRules"
        :value-rules="envValueRules"
        :title="$t('compute.repo.variables')"
        :keyLabel="$t('compute.repo.variables')"
        :readonly-keys="lockedEnvKeys"
        :model="resolvedModel" />
      <div v-if="lockedEnvKeys.length" class="ant-form-explain">{{ $t('compute.repo.image.container_image.env_locked_tip') }}</div>
    </a-form-item>
    <a-form-item label="">
      <a-checkbox :checked="fieldVal(containerFieldMap.enableLxcfs)" @change="e => fieldSet(containerFieldMap.enableLxcfs, e.target.checked)">{{$t('compute.repo.enable_lxcfs')}}</a-checkbox>
    </a-form-item>
    <a-form-item label="">
      <a-checkbox :checked="fieldVal(containerFieldMap.enableSysDiskOverlay)" @change="e => { fieldSet(containerFieldMap.enableSysDiskOverlay, e.target.checked); handleOverlayChange(e) }">{{$t('compute.repo.enable_sys_disk_overlay')}}</a-checkbox>
    </a-form-item>
    <a-form-item v-if="overlayEnabled" :label="$t('compute.repo.overlay_disk')">
      <data-disk
        ref="overlayDiskRef"
        :form="form"
        type="idc"
        :hypervisor="form.fd.hypervisor"
        :capabilityData="form.fi.capability || {}"
        :fields="containerFieldMap.overlayDisk"
        :defaultType="form.fd.systemDiskType"
        :isVminstanceContainer="true"
        :isAddDiskShow="false"
        fieldPrefix="overlayDisk" />
    </a-form-item>
    <a-form-item v-if="overlayEnabled" label="">
      <a-checkbox :checked="fieldVal(containerFieldMap.rootfsPersistent)" @change="e => fieldSet(containerFieldMap.rootfsPersistent, e.target.checked)">
        {{$t('compute.repo.rootfs_persistent')}}
        <a-tooltip :title="$t('compute.repo.rootfs_persistent.tips')">
          <a-icon type="question-circle-o" />
        </a-tooltip>
      </a-checkbox>
    </a-form-item>
    <a-form-item :label="$t('compute.repo.capabilities.add')">
      <a-select
        :value="fieldVal(containerFieldMap.capAdd)"
        @change="v => fieldSet(containerFieldMap.capAdd, v)"
        mode="multiple"
        :placeholder="$t('compute.repo.capabilities.add.placeholder')"
        optionLabelProp="label"
        allowClear>
        <a-select-option v-for="cap in capabilityOptions" :key="cap.value" :value="cap.value" :label="cap.label">
          <span>{{ cap.label }}</span>
          <span style="color: rgba(0,0,0,.45); margin-left: 8px; font-size: 12px;">{{ cap.description }}</span>
        </a-select-option>
      </a-select>
    </a-form-item>
    <a-form-item :label="$t('compute.repo.capabilities.drop')">
      <a-select
        :value="fieldVal(containerFieldMap.capDrop)"
        @change="v => fieldSet(containerFieldMap.capDrop, v)"
        mode="multiple"
        :placeholder="$t('compute.repo.capabilities.drop.placeholder')"
        optionLabelProp="label"
        allowClear>
        <a-select-option v-for="cap in capabilityOptions" :key="cap.value" :value="cap.value" :label="cap.label">
          <span>{{ cap.label }}</span>
          <span style="color: rgba(0,0,0,.45); margin-left: 8px; font-size: 12px;">{{ cap.description }}</span>
        </a-select-option>
      </a-select>
    </a-form-item>
    <a-form-item label="">
      <a-checkbox :checked="fieldVal(containerFieldMap.privileged)" @change="e => fieldSet(containerFieldMap.privileged, e.target.checked)">{{$t('compute.repo.privileged_mode')}}</a-checkbox>
    </a-form-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import Labels from '@Compute/sections/Labels'
import MirrorRegistry from '@Compute/sections/MirrorRegistry'
import DataDisk from '@Compute/sections/DataDisk'
import { CAPABILITY_OPTIONS } from '@Compute/views/vminstance-container/constants'
import { resolveFieldMeta } from '@/utils/common/ant'
import { resolveContainerPaneFieldMap } from './fields'

export default {
  name: 'SpecContainerForm',
  components: {
    Labels,
    MirrorRegistry,
    DataDisk,
  },
  props: {
    cluster: String,
    namespace: String,
    form: {
      type: Object,
    },
    paneKey: String,
    initItem: {
      type: Object,
      default: null,
    },
    /** a-form-model：与字段名对齐（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
    },
  },
  data () {
    return {
      source: 'custom', // custom | registry | container_image
      labelList: [],
      overlayEnabled: false,
      capabilityOptions: CAPABILITY_OPTIONS,
      initApplied: false,
      containerImageLoading: false,
      containerImages: [],
      // 当前选中的容器镜像（含 command/args/envs）
      selectedImage: null,
      // 由容器镜像提供的环境变量 key，这些行不可修改、不可删除
      lockedEnvKeys: [],
    }
  },
  computed: {
    containerFieldMap () {
      return resolveContainerPaneFieldMap(this.paneKey)
    },
    resolvedModel () {
      return this.model || this.form?.fd
    },
    keyBaseSelectProps () {
      const fd = this.resolvedModel || {}
      const props = {
        options: [],
      }
      if (fd.dataDiskSizes) {
        for (const k in fd.dataDiskSizes) {
          const typeObj = fd.dataDiskTypes?.[k] || fd[`dataDiskTypes[${k}]`]
          const label = typeObj?.label
          const idx = typeObj?.index
          props.options.push({
            id: `${idx}`,
            name: `${this.$t('compute.text_376')}${idx + 1}: ${fd.dataDiskSizes[k]}G${label}`,
          })
        }
      }
      return props
    },
    checkedValues () {
      let checkedValues = []
      if (this.labelList) {
        const mountNames = this.resolvedModel?.containerVolumeMountNames
        if (mountNames && mountNames[this.paneKey]) {
          checkedValues = Object.values(mountNames[this.paneKey])
        }
      }
      return checkedValues
    },
    imageHasCommand () {
      return !!(this.selectedImage && (this.selectedImage.command || []).filter(Boolean).length)
    },
    imageHasArgs () {
      return !!(this.selectedImage && (this.selectedImage.args || []).filter(Boolean).length)
    },
    envFields () {
      return this.unwrapLabelFields(this.containerFieldMap?.env, 0)
    },
    volumeMountFields () {
      return this.unwrapLabelFields(this.containerFieldMap?.volumeMount, 0)
    },
    envKeyRules () {
      return [{ required: true, message: this.$t('common.tips.input', [this.$t('compute.repo.variables')]) }]
    },
    envValueRules () {
      return [{ required: true, message: this.$t('common.tips.input', [this.$t('compute.repo.value')]) }]
    },
  },
  watch: {
    initItem: {
      deep: true,
      handler (val) {
        if (val && !this.initApplied) {
          this.$nextTick(() => this.applyInitData(val))
        }
      },
    },
    source (val) {
      if (val === 'container_image' && this.containerImages.length === 0 && !this.containerImageLoading) {
        this.fetchContainerImages()
      }
    },
  },
  created () {
    const m = this.resolvedModel
    if (!m) return
    const keys = [
      'name', 'image', 'registryImage', 'imageCredentialId', 'containerImageId',
      'cpu', 'memory', 'command', 'arg', 'enableLxcfs', 'enableSysDiskOverlay',
      'rootfsPersistent', 'capAdd', 'capDrop', 'privileged',
    ]
    keys.forEach(k => {
      const fieldDef = this.containerFieldMap[k]
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return
      const { name, ...opts } = meta
      if (m[name] === undefined && opts.initialValue !== undefined) {
        this.$set(m, name, opts.initialValue)
      }
    })
  },
  mounted () {
    if (this.initItem) {
      this.$nextTick(() => this.applyInitData(this.initItem))
    }
  },
  methods: {
    fieldVal (fieldTuple) {
      const key = resolveFieldMeta(fieldTuple)?.name
      const { name: _n, ...opts } = resolveFieldMeta(fieldTuple) || {}
      if (!key) return undefined
      const m = this.resolvedModel
      if (!m) return opts.initialValue
      const v = m[key]
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      const key = resolveFieldMeta(fieldTuple)?.name
      const m = this.resolvedModel
      if (!key || !m) return
      this.$set(m, key, value)
    },
    writeFields (values) {
      if (!values || typeof values !== 'object') return
      const m = this.resolvedModel
      if (!m) return
      Object.keys(values).forEach((key) => {
        this.$set(m, key, values[key])
      })
    },
    dualWriteFields (values) {
      this.writeFields(values)
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
      const m = this.resolvedModel
      if (!m) return true
      const keys = [
        'name', 'image', 'registryImage', 'imageCredentialId', 'containerImageId',
        'cpu', 'memory', 'command', 'arg', 'enableLxcfs', 'enableSysDiskOverlay',
        'rootfsPersistent', 'capAdd', 'capDrop', 'privileged',
      ]
      for (const k of keys) {
        const fieldDef = this.containerFieldMap[k]
        if (!resolveFieldMeta(fieldDef)) continue
        const rules = resolveFieldMeta(fieldDef)?.rules || []
        const value = m[fieldDef[0]]
        for (const rule of rules) {
          await this.runFieldRule(rule, value)
        }
      }
      return true
    },
    filterOption (input, option) {
      const label = option.componentOptions?.propsData?.label || ''
      return label.toLowerCase().indexOf((input || '').toLowerCase()) >= 0
    },
    async fetchContainerImages () {
      try {
        this.containerImageLoading = true
        const manager = new this.$Manager('container_images', 'v1')
        const result = await manager.list({
          params: {
            details: true,
            limit: 100,
            scope: this.$store.getters.scope,
          },
        })
        const dataArr = result.data.data || []
        this.containerImages = dataArr.map(item => ({
          label: item.name || `${item.image_name}:${item.image_label}`,
          value: item.id,
          ref: `${item.image_name}:${item.image_label}`,
          command: item.command || [],
          args: item.args || [],
          envs: item.envs || [],
        }))
      } catch (error) {
        throw error
      } finally {
        this.containerImageLoading = false
      }
    },
    findContainerImage (imageId) {
      return this.containerImages.find(img => img.value === imageId) || null
    },
    /** env/volumeMount：从字段工厂解出字段名函数 */
    unwrapLabelFields (factoryOrObj, index = 0) {
      const raw = typeof factoryOrObj === 'function' ? factoryOrObj(index) : factoryOrObj
      if (!raw?.key || !raw?.value) return null
      const nameOf = (fn) => (j) => {
        const t = fn(j)
        return Array.isArray(t) ? t[0] : t
      }
      return { key: nameOf(raw.key), value: nameOf(raw.value) }
    },
    /** 读取当前表单里已填写的环境变量行 */
    readEnvRows () {
      const envRef = this.$refs.envRef
      if (!envRef?.fieldVal || !envRef?.fieldName) return []
      const rows = []
      ;(envRef.labelList || []).forEach((row) => {
        const key = envRef.fieldVal(envRef.fieldName(row.key, 'key'))
        if (key == null || key === '') return
        const value = envRef.fieldVal(envRef.fieldName(row.key, 'value'))
        rows.push({ key, value })
      })
      return rows
    },
    /** 镜像环境变量中可在表单里展示的行（value_from 类型的值无法用表单表达，交由后端合并） */
    imageEnvRows (image) {
      return ((image && image.envs) || [])
        .filter(env => env.key && !env.value_from)
        .map(env => ({ key: env.key, value: env.value }))
    },
    /** 合并环境变量：以已有行为基础，镜像同名 key 覆盖其值，新 key 追加（与后端语义一致） */
    mergeImageEnvs (baseRows, imageEnvs) {
      const out = []
      const indexByKey = {}
      ;(baseRows || []).forEach((row) => {
        const key = (row.key || '').trim()
        if (!key) return
        indexByKey[key] = out.length
        out.push({ key, value: row.value })
      })
      ;(imageEnvs || []).forEach((env) => {
        const key = (env.key || '').trim()
        if (!key) return
        if (indexByKey[key] !== undefined) {
          out[indexByKey[key]] = { key: out[indexByKey[key]].key, value: env.value }
          return
        }
        indexByKey[key] = out.length
        out.push({ key, value: env.value })
      })
      return out
    },
    /**
     * 应用容器镜像的默认启动参数与环境变量
     * @param {Object} image 容器镜像对象
     * @param {Object} options
     *   refillCommand: 回填 command/args（默认 true）
     *   refreshEnvs: 重新渲染 env 行（默认 true）
     *   keepExistingEnvs: 保留并合并表单里已填写的 env 行（默认 false）
     */
    applyImageDefaults (image, options = {}) {
      const { refillCommand = true, refreshEnvs = true, keepExistingEnvs = false } = options
      this.selectedImage = image || null
      const envs = (image && image.envs) || []
      this.lockedEnvKeys = envs.map(env => env.key).filter(Boolean)
      if (image && refillCommand) {
        const values = {}
        const commandField = this.containerFieldMap.command && this.containerFieldMap.command[0]
        const argField = this.containerFieldMap.arg && this.containerFieldMap.arg[0]
        const command = (image.command || []).filter(Boolean)
        const args = (image.args || []).filter(Boolean)
        if (command.length && commandField) values[commandField] = command.join(' ')
        if (args.length && argField) values[argField] = args.join(' ')
        if (Object.keys(values).length) this.dualWriteFields(values)
      }
      if (!refreshEnvs) return
      const envRef = this.$refs.envRef
      if (!envRef) return
      const base = keepExistingEnvs ? this.readEnvRows() : []
      const rows = this.mergeImageEnvs(base, this.imageEnvRows(image))
      envRef.reset()
      if (rows.length) {
        this.$nextTick(() => {
          envRef.initData(rows)
        })
      }
    },
    handleContainerImageChange (value) {
      this.applyImageDefaults(this.findContainerImage(value), { keepExistingEnvs: true })
    },
    formatInput (e, field) {
      const val = Number(e.target.value)
      if (R.is(Number, val) && !Number.isNaN(val) && val >= 0) {
        return
      }
      if (this.containerFieldMap[field]) {
        this.fieldSet(this.containerFieldMap[field], 1)
      }
    },
    handleSourceChange (e) {
      this.source = e.target.value
      // 离开容器镜像来源时，清空锁定状态
      this.selectedImage = null
      this.lockedEnvKeys = []
      const values = {}
      if (this.containerFieldMap.image) values[this.containerFieldMap.image[0]] = undefined
      if (this.containerFieldMap.registryImage) values[this.containerFieldMap.registryImage[0]] = undefined
      if (this.containerFieldMap.imageCredentialId) values[this.containerFieldMap.imageCredentialId[0]] = undefined
      if (this.containerFieldMap.containerImageId) values[this.containerFieldMap.containerImageId[0]] = undefined
      this.dualWriteFields(values)
    },
    handleOverlayChange (e) {
      this.overlayEnabled = e.target.checked
      if (this.overlayEnabled) {
        this.$nextTick(() => {
          if (this.$refs.overlayDiskRef) {
            this.$refs.overlayDiskRef.add()
          }
        })
      }
    },
    handleCredentialChange (credentialId) {
      if (this.containerFieldMap.imageCredentialId) {
        this.fieldSet(this.containerFieldMap.imageCredentialId, credentialId)
      }
    },
    labelChangeHandle (val) {
      this.labelList = val
    },
    applyInitData (item = {}) {
      if (!item || this.initApplied) return
      if (item.container_image_id) {
        this.source = 'container_image'
        // 回显时不重置 envs（容器自身的变量要保留），只同步锁定状态
        this.fetchContainerImages().then(() => {
          this.applyImageDefaults(this.findContainerImage(item.container_image_id), {
            refillCommand: false,
            refreshEnvs: false,
          })
        }).catch(() => {})
      } else if (item.image_credential_id) {
        this.source = 'registry'
      }
      if (item.rootfs) {
        this.overlayEnabled = true
      }
      if (!this.containerFieldMap) return
      const field = (fieldTuple) => resolveFieldMeta(fieldTuple)?.name || ''
      const values = {}
      const nameField = field(this.containerFieldMap.name)
      const imageField = field(this.containerFieldMap.image)
      const registryField = field(this.containerFieldMap.registryImage)
      const credentialField = field(this.containerFieldMap.imageCredentialId)
      const containerImageIdField = field(this.containerFieldMap.containerImageId)
      const commandField = field(this.containerFieldMap.command)
      const argField = field(this.containerFieldMap.arg)
      const privilegedField = field(this.containerFieldMap.privileged)
      const lxcfsField = field(this.containerFieldMap.enableLxcfs)
      const capAddField = field(this.containerFieldMap.capAdd)
      const capDropField = field(this.containerFieldMap.capDrop)
      const overlayField = field(this.containerFieldMap.enableSysDiskOverlay)
      const rootfsPersistentField = field(this.containerFieldMap.rootfsPersistent)
      if (nameField) values[nameField] = item.name || ''
      if (item.container_image_id) {
        if (containerImageIdField) values[containerImageIdField] = item.container_image_id
      } else if (item.image_credential_id) {
        if (registryField) values[registryField] = item.image || ''
        if (credentialField) values[credentialField] = item.image_credential_id
      } else if (imageField) {
        values[imageField] = item.image || ''
      }
      if (commandField) values[commandField] = (item.command || []).filter(Boolean).join(' ')
      if (argField) values[argField] = (item.args || []).filter(Boolean).join(' ')
      if (privilegedField) values[privilegedField] = !!item.privileged
      if (lxcfsField) values[lxcfsField] = item.enable_lxcfs !== false
      if (capAddField) values[capAddField] = item.capabilities?.add || []
      if (capDropField) values[capDropField] = item.capabilities?.drop || []
      if (overlayField) values[overlayField] = !!item.rootfs
      if (rootfsPersistentField) values[rootfsPersistentField] = !!item.rootfs?.persistent
      // 延迟一拍，确保字段已注册；再重试一次防止被 tabs 延迟渲染吞掉
      const doSet = () => {
        this.dualWriteFields(values)
      }
      this.$nextTick(() => {
        doSet()
        this.initApplied = true
        setTimeout(() => {
          doSet()
          if (item.envs?.length && this.$refs.envRef) {
            this.$refs.envRef.initData(item.envs.map(env => ({ key: env.key, value: env.value })))
          }
          if (item.volume_mounts?.length && this.$refs.volumeMountRef) {
            this.$refs.volumeMountRef.initData(item.volume_mounts.map(vm => ({
              key: `${vm.disk?.index ?? ''}`,
              value: vm.mount_path,
            })))
          }
        }, 300)
      })
    },
    initContainerData (item = {}) {
      this.initApplied = false
      this.applyInitData(item)
    },
  },
}
</script>
