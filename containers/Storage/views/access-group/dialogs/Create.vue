<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('storage.access.group.create')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :model="form"
          :names="['provider', 'cloudregion']"
          :cloudregionParams="cloudRegionParams"
          :isRequired="true"
          :providerParams="providerParams"
          filterBrandResource="nas"
          @change="handleRegionChange" />
        <a-form-model-item :label="$t('storage.text_40')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('storage.text_56')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_15')" prop="cloudprovider">
          <base-select
            resource="cloudproviders"
            v-model="form.cloudprovider"
            :params="cloudproviderParams"
            :isDefaultSelect="true"
            :showSync="true"
            :select-props="{ placeholder: $t('compute.text_149') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import AreaSelects from '@/sections/AreaSelects/model'

export default {
  name: 'AccessGroupCreateDialog',
  components: {
    AreaSelects,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        provider: undefined,
        cloudregion: undefined,
        name: undefined,
        cloudprovider: undefined,
        description: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('storage.text_56') },
        ],
        cloudprovider: [
          { required: true, message: this.$t('common.tips.input', [this.$t('storage.text_40')]) },
        ],
      },
      cloudRegionParams: {
        scope: this.$store.getters.scope,
        limit: 20,
        usable: false,
        cloud_env: 'public',
      },
      providerParams: {
        scope: this.$store.getters.scope,
        usable: false,
      },
      regionProvider: '',
      regionId: '',
    }
  },
  computed: {
    cloudproviderParams () {
      return {
        limit: 20,
        cloudregion: this.regionId,
        enabled: true,
        read_only: false,
        scope: this.$store.getters.scope,
      }
    },
  },
  methods: {
    handleRegionChange (data) {
      const { cloudregion } = data
      if (cloudregion) {
        const { provider } = cloudregion.value || {}
        this.regionProvider = provider
        this.regionId = cloudregion.id
      }
    },
    doCreate (data) {
      return new this.$Manager('access_groups').create({ data: data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          name: this.form.name,
          cloudprovider: this.form.cloudprovider,
          description: this.form.description,
          cloudregion: this.regionId || this.form.cloudregion,
        }
        await this.doCreate(values)
        this.loading = false
        this.cancelDialog()
        this.params.refresh && this.params.refresh()
        this.params.success && this.params.success()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
