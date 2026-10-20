<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.image_cache.perform_batch_precache')}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.text_111')" prop="hypervisor">
          <a-select v-model:value="form.hypervisor" @change="handleHypervisorChange" :placeholder="$t('compute.text_219')" :allow-clear="true">
            <a-select-option v-for="item in hostOptions" :key="item.key" :value="item.value">
              {{ item.value }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.host_tag')" class="mb-0" prop="host_tags">
          <tag
            :value="form.host_tags"
            @change="v => form.host_tags = v"
            :params="{ resources: 'host', with_cloud_meta: false }"
            extra=""
            multiple />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_99')" prop="storage">
          <a-select v-model:value="form.storage" :placeholder="$t('compute.text_219')" :allow-clear="true">
            <a-select-option v-for="item in storageOptions" :key="item.key" :value="item.value">
              {{ item.value }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.storage_tag')" class="mb-0" prop="storage_tags">
          <tag
            :value="form.storage_tags"
            @change="v => form.storage_tags = v"
            :params="{ resources: 'storage', with_cloud_meta: false }"
            multiple
            extra="" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import validateForm from '@/utils/validate'
import Tag from '@/sections/Tag'

export default {
  name: 'ImageBatchCreateCache',
  components: {
    Tag,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        hypervisor: undefined,
        storage: undefined,
        host_tags: undefined,
        storage_tags: undefined,
      },
      rules: {
        host_tags: [
          { validator: validateForm('tagName') },
        ],
        storage_tags: [
          { validator: validateForm('tagName') },
        ],
      },
      hypervisors: [],
      hypervisor: null,
      storageTypes: {},
    }
  },
  computed: {
    hostOptions () {
      const ret = []
      for (let i = 0; i < this.hypervisors.length; i++) {
        ret.push({
          key: this.hypervisors[i],
          value: this.hypervisors[i],
        })
      }
      return ret
    },
    storageOptions () {
      const ret = []
      if (!this.hypervisor || !this.storageTypes[this.hypervisor]) {
        return ret
      }
      for (let i = 0; i < this.storageTypes[this.hypervisor].length; i++) {
        ret.push({
          key: this.storageTypes[this.hypervisor][i],
          value: this.storageTypes[this.hypervisor][i],
        })
      }
      return ret
    },
  },
  created () {
    this.fetchPlatform()
  },
  methods: {
    async fetchPlatform () {
      const res = await new this.$Manager('capabilities').list({
        params: {
          scope: this.$store.getters.scope,
        },
      })
      this.hypervisors = res.data.data[0].hypervisors
      if (this.hypervisors.length > 0) {
        this.hypervisor = this.hypervisors[0]
      }
      this.storageTypes = res.data.data[0].storage_types2
    },
    handleHypervisorChange (v) {
      this.hypervisor = v
      this.form.storage = null
    },
    formatTags (tags) {
      const filters = [{}]
      Object.keys(tags).forEach(key => {
        let value = tags[key]
        if (R.is(String, value) && value) {
          value = [value]
        } else if (R.is(String, value) && !value) {
          value = []
        } else {
          value = value.map(item => item)
        }
        filters[0][key] = value
      })
      return { filters }
    },
    async handleConfirm () {
      this.loading = true
      try {
        const data = {
          image_id: this.params.imageId,
          auto_cache: true,
        }
        await this.$refs.formRef.validate()
        const { hypervisor, storage, host_tags, storage_tags } = this.form
        if (hypervisor) {
          const hostType = []
          if (hypervisor === 'kvm') {
            hostType.push('hypervisor')
          } else if (hypervisor === 'pod') {
            hostType.push('container')
          }
          data.host_type = hostType
        }
        if (storage) {
          const storageType = []
          const parts = storage.split('/')
          if (parts && parts.length > 0) {
            storageType.push(parts[0])
          }
          data.storage_type = storageType
        }
        if (host_tags && Object.keys(host_tags).length > 0) {
          data.host_tags = this.formatTags(host_tags)
        }
        if (storage_tags && Object.keys(storage_tags).length > 0) {
          data.storage_tags = this.formatTags(storage_tags)
        }
        const manager = new this.$Manager('cachedimages')
        manager.performClassAction({
          action: 'cache-image',
          data: data,
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
