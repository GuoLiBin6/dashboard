<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <a-alert type="warning" class="mb-4">
        <template #message v-if="showDocsLink()">{{ $t('storage.local_storage.help_alert_message') }}<help-link :href="localStorageUrl">{{ $t('storage.local_storage.help_link') }}</help-link></template>
        <template #message v-else>{{ $t('storage.local_storage.help_alert_message_1') }}</template>
      </a-alert>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('storage.text_55', [$t('dictionary.domain')])" prop="project_domain">
          <domain-select v-if="isAdminMode && l3PermissionEnable" v-model:value="form.project_domain" />
          <template v-else> {{userInfo.domain.name}} </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_40')" prop="name">
          <a-input :placeholder="$t('storage.text_56')" v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_39')" prop="medium_type">
          <a-radio-group v-model:value="form.medium_type" buttonStyle="solid">
            <a-radio-button v-for="(v, k) in MEDIUM_TYPES" :key="v" :value="k">{{v}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_38')" prop="storage_type">
          <a-radio-group v-model:value="form.storage_type" buttonStyle="solid">
            <template v-for="(v, k) in STORAGE_TYPES" :key="k">
              <a-radio-button v-if="storageTypes.indexOf(k) > -1" :value="k">{{v}}</a-radio-button>
            </template>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_47')" class="mb-0" prop="cloudregion">
          <cloudregion-zone
            :model="form"
            :cloudregionParams="{cloud_env: 'onpremise'}"
            filterBrandResource="loadbalancer_engine" />
        </a-form-model-item>
        <form-items :storage_type="form.storage_type" :model="form" />
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag
            :value="form.__meta__"
            @change="v => form.__meta__ = v"
            :allowNoValue="false" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { MEDIUM_TYPES, STORAGE_TYPES, formItemLayout } from '@Storage/constants/index.js'
import FormItems from '@Storage/views/blockstorage/components/FormItems'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import CloudregionZone from '@/sections/CloudregionZone/model'
import DomainSelect from '@/sections/DomainSelect'
import Tag from '@/sections/Tag'
import validateForm, { isRequired } from '@/utils/validate'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'

export default {
  name: 'BlockStorageCreateDialog',
  components: {
    CloudregionZone,
    FormItems,
    DomainSelect,
    Tag,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      showDocsLink,
      MEDIUM_TYPES,
      STORAGE_TYPES,
      loading: false,
      form: {
        storage_type: 'rbd',
        project_domain: this.$store.getters.userInfo.projectDomainId,
        name: undefined,
        description: undefined,
        medium_type: 'rotate',
        cloudregion: undefined,
        zone: undefined,
        __meta__: {},
      },
      formItemLayout,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo', 'l3PermissionEnable']),
    storageTypes () {
      return this.params.storageTypes || ['rbd', 'slvm', 'nfs', 'gpfs', 'local']
    },
    rules () {
      return {
        name: [
          { required: true, message: this.$t('storage.text_56') },
          { validator: this.$validate('blockStorageName') },
        ],
        cloudregion: [
          { validator: isRequired(), message: this.$t('storage.text_57'), trigger: 'change' },
        ],
        zone: [
          { validator: isRequired(), message: this.$t('storage.text_58'), trigger: 'change' },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      }
    },
    localStorageUrl () {
      return DOCS_MAP.blockStorage()
    },
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      const merged = { ...this.form }
      // eslint-disable-next-line camelcase
      const { storage_type, zone, cloudregion, slvm_vg_name } = merged
      const deleteRbdKeys = ['nfs_host', 'nfs_shared_dir']
      const deleteNfsKeys = ['rbd_mon_host', 'rbd_key', 'rbd_pool']
      const deleteSlvmKeys = [...deleteRbdKeys, ...deleteNfsKeys]
      const deleteKeys = {
        rbd: [...deleteRbdKeys, 'slvm_vg_name'],
        slvm: deleteSlvmKeys,
        nfs: [...deleteNfsKeys, 'slvm_vg_name'],
        gpfs: [...deleteRbdKeys, ...deleteNfsKeys, 'slvm_vg_name'],
        local: [...deleteRbdKeys, ...deleteNfsKeys, 'slvm_vg_name'],
      }
      if (zone) {
        merged.zone = zone.key
      }
      if (cloudregion) {
        merged.area = cloudregion.key
        delete merged.cloudregion
      }
      if (slvm_vg_name) {
        merged.lvmlockd = true
      }
      ;(deleteKeys[storage_type] || []).forEach(key => {
        delete merged[key]
      })
      return Object.assign({}, { capacity: 0 }, merged)
    },
    async handleConfirm () {
      this.loading = true
      try {
        const values = await this.validateForm()
        const manager = new this.$Manager('storages', 'v2')
        await manager.create({ data: values })
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
