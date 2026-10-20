<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_411')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('cloudenv.text_410', [$t('dictionary.domain')])" prop="project_domain">
          <domain-select v-if="isAdminMode && l3PermissionEnable" v-model:value="form.project_domain" :params="domainParams" />
          <template v-else> {{userInfo.domain.name}} </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_95')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.resourceName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <common-form-items :form="form" />
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <test-button
        :disabled="!form.http_proxy && !form.https_proxy"
        :post="testPost"
        :isSuccessAlert="false" />
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import DomainSelect from '@/sections/DomainSelect'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import TestButton from '@/sections/TestButton'
import CommonFormItems from '../components/CommonFormItems'

export default {
  name: 'ProxysettingCreateDialog',
  components: {
    CommonFormItems,
    DomainSelect,
    TestButton,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const projectDomainInitialValue = (this.params.domain && this.params.domain.key) || this.$store.getters.userInfo.projectDomainId
    return {
      loading: false,
      form: {
        name: '',
        description: '',
        project_domain: projectDomainInitialValue,
        https_proxy: '',
        http_proxy: '',
        no_proxy: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('cloudenv.text_190') },
          { validator: this.$validate('resourceName') },
        ],
        project_domain: [
          { required: true, message: this.$t('cloudenv.text_284', [this.$t('dictionary.domain')]) },
        ],
      },
      domainParams: {
        limit: 20,
        filter: 'enabled.equals(1)',
      },
    }
  },
  computed: mapGetters(['isAdminMode', 'isDomainMode', 'userInfo', 'l3PermissionEnable']),
  methods: {
    doCreate (data) {
      return new this.$Manager('proxysettings').create({ data: data })
    },
    async testPost () {
      const manager = new this.$Manager('proxysettings')
      try {
        const keys = ['http_proxy', 'https_proxy']
        const { data } = await manager.performClassAction({
          action: 'test',
          data: {
            http_proxy: this.form.http_proxy,
            https_proxy: this.form.https_proxy,
          },
        })
        keys.forEach(k => {
          if (!data[k] || !this.form[k] || R.type(data[k]) !== 'Object') return false
          const { ok, reason } = data[k]
          if (ok) {
            this.$notification.success({
              message: this.$t('cloudenv.text_407', [this.$t('proxysettings')[k]]),
              description: this.$t('cloudenv.text_408'),
            })
          } else {
            this.$notification.error({
              message: this.$t('cloudenv.text_409', [this.$t('proxysettings')[k]]),
              description: reason,
            })
          }
        })
      } catch (err) {
        throw err
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.cancelDialog()
        this.params.refresh && this.params.refresh()
        this.params.success && this.params.success()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
