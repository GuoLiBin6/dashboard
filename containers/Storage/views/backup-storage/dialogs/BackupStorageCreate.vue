<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{this.params.title}}</template>
    <template #body>
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('storage.text_55', [$t('dictionary.domain')])" prop="project_domain">
          <domain-select v-if="isAdminMode && l3PermissionEnable" v-model:value="form.project_domain" />
          <template v-else> {{userInfo.domain.name}} </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input
            v-model:value="form.name"
            :placeholder="$t('common.tips.input', [$t('common.name')])" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-input
            v-model:value="form.description"
            :placeholder="$t('common.tips.optional_input', [$t('common.description')])" />
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_38')" prop="storage_type">
          <a-radio-group v-model:value="form.storage_type">
              <a-radio-button v-for="obj in STORAGE_TYPES" :key="obj.key" :value="obj.key">{{ obj.value }}</a-radio-button>
          </a-radio-group>
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
import DomainSelect from '@/sections/DomainSelect'
import { REGEXP } from '@/utils/validate'

export default {
  name: 'BackupStorageCreateDialog',
  components: {
    DomainSelect,
  },
  mixins: [WindowsMixin, DialogMixin],
  data () {
    const hostCheckValid = (rule, value, _callback) => {
      let isValid = true
      if (!value || value === '') isValid = false
      const parts = value.split(',')
      if (parts.some(part => {
        const trimmedPart = part.trim()
        return !REGEXP.IPv4.regexp.test(trimmedPart) && !REGEXP.IPv6.regexp.test(trimmedPart)
      })) {
        isValid = false
      }
      return isValid ? _callback() : _callback(new Error(this.$t('storage.host.input.place_holder')))
    }
    return {
      loading: false,
      STORAGE_TYPES: [
        {
          key: 'nfs',
          value: 'NFS',
        },
        {
          key: 'object',
          value: this.$t('storage.object_storage'),
        },
      ],
      form: {
        project_domain: this.$store.getters.userInfo.projectDomainId,
        name: undefined,
        description: undefined,
        storage_type: 'nfs',
        nfs_host: undefined,
        nfs_shared_dir: undefined,
        object_bucket_url: undefined,
        object_access_key: undefined,
        object_secret: undefined,
        object_sign_ver: '',
        capacity_mb: 0,
        object_bucket_url_ext: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('storage.text_56') },
          { validator: this.$validate('blockStorageName') },
        ],
        nfs_host: [
          { required: true, validator: hostCheckValid, trigger: 'blur' },
        ],
        nfs_shared_dir: [
          { required: true, message: this.$t('storage.nfs_shared_dir.validate.prompt'), trigger: 'blur' },
        ],
        object_bucket_url: [
          { required: true, message: this.$t('storage.object_bucket_url.validate.prompt'), trigger: 'blur' },
        ],
        object_access_key: [
          { required: true, message: this.$t('storage.object_access_key.validate.prompt'), trigger: 'blur' },
        ],
        object_secret: [
          { required: true, message: this.$t('storage.object_secret.validate.prompt'), trigger: 'blur' },
        ],
        object_bucket_url_ext: [
          { required: false, message: this.$t('storage.object_bucket_url_ext.validate.prompt'), trigger: 'blur' },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo', 'l3PermissionEnable']),
    isNfs () {
      return this.form.storage_type === 'nfs'
    },
    isObjectStorage () {
      return this.form.storage_type === 'object'
    },
  },
  methods: {
    async handleConfirm () {
      const manager = new this.$Manager('backupstorages')
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        await manager.create({ data: { ...values, capacity_mb: values.capacity_mb * 1024 } })
        this.cancelDialog()
        this.params.refresh && this.params.refresh()
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
