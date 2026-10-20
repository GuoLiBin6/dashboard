<template>
  <div>
    <page-header :title="$t('network.text_769')" />
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.domain')])" prop="project_domain" v-if="$store.getters.isAdminMode">
          <domain-select v-model:value="form.project_domain" @change="handleDomainChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_198')" prop="platform">
          <a-radio-group v-model:value="form.platform">
            <a-radio-button value="Google">Google</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_684')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_15')" required prop="cloudprovider">
          <base-select
            class="w-50"
            v-model:value="form.cloudprovider"
            resource="cloudproviders"
            :params="cloudproviderParams"
            :isDefaultSelect="true"
            :needParams="true"
            :showSync="true"
            :select-props="{ placeholder: $t('compute.text_149') }"
            v-model:resList="cloudproviderData" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button class="ml-3 float-right" @click="() => $router.back()">{{$t('common.cancel')}}</a-button>
        <a-button class="float-right" type="primary" @click="handleConfirm" :loading="loading">{{ $t('common_258') }}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import DomainSelect from '@/sections/DomainSelect'

export default {
  name: 'GlobalVPCCreate',
  components: {
    DomainSelect,
  },
  data () {
    return {
      loading: false,
      isGoogle: false,
      isAws: false,
      form: {
        project_domain: this.$store.getters.userInfo.projectDomainId,
        platform: 'Google',
        name: '',
        description: '',
        cloudprovider: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_770') },
          { validator: this.$validate('broadName') },
        ],
        platform: [
          { required: true },
        ],
        cloudprovider: [
          { required: true, message: this.$t('network.text_689') },
        ],
      },
      project_domain: this.$store.getters.userInfo.projectDomainId,
      cloudproviderData: [],
      cloudregion: '',
      regionList: {},
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    cloudproviderParams () {
      const params = {
        limit: 0,
        enabled: 1,
        details: true,
        scope: this.scope,
        read_only: false,
        provider: 'Google',
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
  },
  methods: {
    doCreate (data) {
      return new this.$Manager('globalvpcs').create({ data })
    },
    handleDomainChange (val) {
      this.project_domain = val
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = this.form
        const params = {
          name: values.name,
          description: values.description,
          manager: values.cloudprovider,
          platform: values.platform, // 未起作用
        }
        if (values.project_domain) {
          params.project_domain = values.project_domain
        }
        await this.doCreate(params)
        this.loading = false
        this.$message.success(this.$t('k8s.text_184'))
        this.$router.push('/globalvpc')
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
