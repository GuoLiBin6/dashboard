<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{this.params.title}}</template>
    <template #body>
      <dialog-selected-tips :name="$t('compute.backup_storage')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('storage.text_38')">
          {{ this.getStorageType }}
        </a-form-model-item>
        <a-form-model-item label="NFS Host" v-if="isNfs" prop="nfs_host">
          <a-input :placeholder="$t('storage.host.input.place_holder')" v-model:value="form.nfs_host" />
        </a-form-model-item>
        <a-form-model-item label="NFS Shared Dir" v-if="isNfs" prop="nfs_shared_dir">
          <a-input :placeholder="$t('storage.path.input.place_holder')" v-model:value="form.nfs_shared_dir" />
        </a-form-model-item>
        <a-form-model-item label="Bucket URL" v-if="isObjectStorage" prop="object_bucket_url">
          <a-input :placeholder="$t('storage.url.input.place_holder')" v-model:value="form.object_bucket_url" />
        </a-form-model-item>
        <a-form-model-item label="Access Key" v-if="isObjectStorage" prop="object_access_key">
          <a-input :placeholder="$t('storage.access_key.input.place_holder')" v-model:value="form.object_access_key" />
        </a-form-model-item>
        <a-form-model-item label="Secret" v-if="isObjectStorage" prop="object_secret">
          <a-input-password :placeholder="$t('storage.access_secret.input.place_holder')" v-model:value="form.object_secret" />
        </a-form-model-item>
        <a-form-model-item label="Signing Version" v-if="isObjectStorage" prop="object_sign_ver">
          <a-radio-group v-model:value="form.object_sign_ver">
            <a-radio-button value="">{{ $t('common_712') }}</a-radio-button>
            <a-radio-button value="v2">V2</a-radio-button>
            <a-radio-button value="v4">V4</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.capacity')" v-show="false" prop="capacity_mb">
          <a-input-number :min="0" v-model:value="form.capacity_mb" /> GB
        </a-form-model-item>
        <a-form-model-item label="Public Bucket URL" v-if="isObjectStorage" prop="object_bucket_url_ext">
          <a-input :placeholder="$t('storage.url.input.place_holder')" v-model:value="form.object_bucket_url_ext" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'BackupStorageUpdateDialog',
  mixins: [WindowsMixin, DialogMixin],
  data () {
    const row = this.params.data[0]
    const hostCheckValid = (rule, value, _callback) => {
      const pattern = /^(?=(\b|\D))(((\d{1,2})|(1\d{1,2})|(2[0-4]\d)|(25[0-5]))\.){3}((\d{1,2})|(1\d{1,2})|(2[0-4]\d)|(25[0-5]))(?=(\b|\D))$/
      const ips = value.split(',')
      if (!value || value === '') {
        return _callback(new Error(this.$t('storage.nfs_host_check_reqiure')))
      }
      ips.forEach((item) => {
        const [ip, dir] = item.split(':')
        if (!pattern.test(ip)) {
          return _callback(new Error(this.$t('storage.nfs_host_check_valid')))
        } else {
          if (dir) {
            const reg = /^\/.+/
            if (!reg.test(dir)) {
              return _callback(new Error(this.$t('storage.nfs_host_check_valid')))
            }
          }
        }
      })
      _callback()
    }
    return {
      loading: false,
      form: {
        nfs_host: row.nfs_host,
        nfs_shared_dir: row.nfs_shared_dir,
        object_bucket_url: row.object_bucket_url,
        object_access_key: row.object_access_key,
        object_secret: row.object_secret,
        object_sign_ver: row.object_sign_ver ? row.object_sign_ver : '',
        object_bucket_url_ext: row.object_bucket_url_ext,
        capacity_mb: 0,
      },
      rules: {
        nfs_host: [
          { required: true, message: this.$t('storage.nfs_host.validate.prompt'), trigger: 'blur' },
          { validator: hostCheckValid, trigger: 'blur' },
        ],
        nfs_shared_dir: [
          { required: true, message: this.$t('storage.nfs_shared_dir.validate.prompt'), trigger: 'blur' },
        ],
        object_bucket_url: [
          { required: false, message: this.$t('storage.object_bucket_url.validate.prompt'), trigger: 'blur' },
        ],
        object_access_key: [
          { required: false, message: this.$t('storage.object_access_key.validate.prompt'), trigger: 'blur' },
        ],
        object_secret: [
          { required: false, message: this.$t('storage.object_secret.validate.prompt'), trigger: 'blur' },
        ],
        object_bucket_url_ext: [
          { required: false, message: this.$t('storage.object_bucket_url_ext.validate.prompt'), trigger: 'blur' },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo', 'l3PermissionEnable']),
    columns () {
      const showFields = ['name', 'status', 'storage_type']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    isNfs () {
      return this.params.data[0].storage_type === 'nfs'
    },
    isObjectStorage () {
      return this.params.data[0].storage_type === 'object'
    },
    getStorageType () {
      if (this.isNfs) {
        return 'NFS'
      } else {
        return this.$t('storage.object_storage')
      }
    },
  },
  methods: {
    async handleConfirm () {
      const manager = new this.$Manager('backupstorages')
      try {
        await this.$refs.formRef.validate()
        await manager.update({ id: this.params.data[0].id, data: { ...this.form } })
        this.cancelDialog()
        this.params.refresh && this.params.refresh()
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
