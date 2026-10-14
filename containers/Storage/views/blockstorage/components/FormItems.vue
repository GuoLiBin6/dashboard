<!-- 创建和修改属性都需要的 -->
<template>
  <div>
    <template>
      <template v-if="storage_type === 'rbd'">
        <a-form-model-item v-if="!edit" label="Ceph Mon Host" prop="rbd_mon_host" :rules="fieldRules.rbd_mon_host">
          <a-input :placeholder="$t('storage.host.input.place_holder')" v-model:value="model.rbd_mon_host" />
        </a-form-model-item>
        <a-form-model-item v-if="!edit" label="Ceph Pool" prop="rbd_pool" :rules="fieldRules.rbd_pool">
          <a-input :placeholder="$t('storage.text_21')" v-model:value="model.rbd_pool" />
        </a-form-model-item>
        <a-form-model-item label="Ceph Key" prop="rbd_key">
          <a-input :placeholder="$t('storage.text_20')" v-model:value="model.rbd_key" />
        </a-form-model-item>
      </template>
      <template v-if="storage_type === 'nfs'">
        <a-form-model-item label="NFS Host" prop="nfs_host" :rules="fieldRules.nfs_host">
          <a-input :placeholder="$t('storage.host.input.place_holder')" v-model:value="model.nfs_host" />
        </a-form-model-item>
        <a-form-model-item label="NFS Shared Dir" prop="nfs_shared_dir" :rules="fieldRules.nfs_shared_dir">
          <a-input :placeholder="$t('storage.path.input.place_holder')" v-model:value="model.nfs_shared_dir" />
        </a-form-model-item>
      </template>
      <template v-if="storage_type === 'slvm'">
        <a-form-model-item label="SlvmVgName" prop="slvm_vg_name" :rules="fieldRules.slvm_vg_name">
          <a-input :placeholder="$t('common.tips.input', ['SlvmVgName'])" v-model:value="model.slvm_vg_name" />
        </a-form-model-item>
      </template>
    </template>
  </div>
</template>

<script>
import { REGEXP } from '@/utils/validate'

export default {
  name: 'BlockStorageFormItems',
  props: {
    storage_type: {
      type: String,
    },
    edit: {
      type: Boolean,
      default: false,
    },
    editData: {
      type: Object,
    },
    /** a-form-model：传入父级 form 对象 */
    model: {
      type: Object,
    },
  },
  inject: {
    form: {
      default: null,
    },
  },
  computed: {
    fieldRules () {
      const hostCheckValid = (rule, value, _callback) => {
        let isValid = true
        if (!value || value === '') isValid = false
        const parts = (value || '').split(',')
        if (parts.some(part => {
          const trimmedPart = part.trim()
          return !REGEXP.IPv4.regexp.test(trimmedPart) && !REGEXP.IPv6.regexp.test(trimmedPart)
        })) {
          isValid = false
        }
        return isValid ? _callback() : _callback(new Error(this.$t('storage.host.input.place_holder')))
      }
      const commonCheckValid = (name) => {
        return (rule, value, _callback) => {
          const pattern = /^[+=./a-zA-Z0-9_-]+$/
          if (!value || value === '') {
            return _callback(new Error(this.$t('storage.text_25', [name])))
          } else if (!pattern.test(value)) {
            return _callback(new Error(this.$t('storage.text_25', [name])))
          } else {
            _callback()
          }
        }
      }
      return {
        rbd_mon_host: [
          { required: true, validator: hostCheckValid, trigger: 'blur' },
        ],
        rbd_pool: [
          { required: true, message: this.$t('storage.text_28'), trigger: 'blur' },
          { validator: commonCheckValid('Ceph Pool') },
        ],
        nfs_host: [
          { required: true, validator: hostCheckValid, trigger: 'blur' },
        ],
        nfs_shared_dir: [
          { required: true, message: this.$t('storage.nfs_shared_dir.validate.prompt'), trigger: 'blur' },
        ],
        slvm_vg_name: [
          { required: true, message: this.$t('common.tips.input', ['SlvmVgName']), trigger: 'blur' },
        ],
      }
    },
  },
  watch: {
    editData: {
      immediate: true,
      handler () {
        this.initModelFromEditData()
      },
    },
  },
  mounted () {
    this.initModelFromEditData()
  },
  methods: {
    initModelFromEditData () {
      if (!this.editData?.storage_conf) return
      const conf = this.editData.storage_conf
      if (this.storage_type === 'rbd') {
        if (this.model.rbd_key === undefined) this.model.rbd_key = conf.key || ''
        if (!this.edit) {
          if (this.model.rbd_mon_host === undefined) this.model.rbd_mon_host = conf.mon_host || ''
          if (this.model.rbd_pool === undefined) this.model.rbd_pool = conf.pool || ''
        }
      } else if (this.storage_type === 'nfs') {
        if (this.model.nfs_host === undefined) this.model.nfs_host = conf.nfs_host || ''
        if (this.model.nfs_shared_dir === undefined) this.model.nfs_shared_dir = conf.nfs_shared_dir || ''
      } else if (this.storage_type === 'slvm') {
        if (this.model.slvm_vg_name === undefined) this.model.slvm_vg_name = conf.slvm_vg_name || ''
      }
    },
  },
}
</script>
