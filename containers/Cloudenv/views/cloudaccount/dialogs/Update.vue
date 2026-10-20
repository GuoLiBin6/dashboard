<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_298')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.cloudaccount')" :count="params.data.length" :action="$t('cloudenv.text_298')" />
      <dialog-table class="mb-2" :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <template v-if="isGoogle">
          <upload-json-file :form="form">
            <a-form-model-item :label="field.label.k" :prop="credKey">
              <a-textarea :autosize="{ minRows: 3, maxRows: 7 }" v-model:value="form[credKey]" :placeholder="field.placeholder.k" />
            </a-form-model-item>
            <a-form-model-item :label="field.label.s" :prop="credSecret">
              <a-input-password v-model:value="form[credSecret]" :placeholder="field.placeholder.s" type="password" />
            </a-form-model-item>
          </upload-json-file>
        </template>
        <template v-else>
          <h2 class="mt-3 mb-3" v-if="isHcs">{{ $t('cloudenv.operation_info_input') }}</h2>
          <a-form-model-item :label="field.label.k" :prop="credKey">
            <a-input v-model:value="form[credKey]" :placeholder="field.placeholder.k" />
          </a-form-model-item>
          <a-form-model-item :label="$t('cloudenv.text_300')" v-if="isAzure" prop="directory_id">
            <a-input v-model:value="form.directory_id" :placeholder="$t('cloudenv.text_243')" />
            <div slot="extra" v-if="showDocsLink()">
              <help-link :href="doc">{{$t('cloudenv.text_301')}}</help-link>
            </div>
          </a-form-model-item>
          <a-form-model-item :label="field.label.s" :prop="credSecret">
            <a-input-password v-model:value="form[credSecret]" :placeholder="field.placeholder.s" type="password" />
          </a-form-model-item>
        </template>
        <a-form-model-item label="project_id" v-if="isUcloud" prop="ucloud_project_id">
          <a-input v-model:value="form.ucloud_project_id" :placeholder="$t('cloudenv.text_247')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_254')" v-if="isOpenStack" prop="project_name">
          <a-input v-model:value="form.project_name" :placeholder="$t('cloudenv.text_255')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_304')" v-if="isOpenStack" prop="endpoint_type">
          <a-select v-model:value="form.endpoint_type" :placeholder="$t('cloudenv.text_305')">
            <a-select-option
              v-for="item in endpointTypeOpts"
              :key="item.key"
              :value="item.key">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <template v-if="isHcs">
          <h2 class="mb-3">{{ $t('cloudenv.operation_and_maintenance_info_input') }}</h2>
          <a-form-model-item :label="$t('cloudenv.text_94')" prop="options.account">
            <a-input v-model:value="form.options.account" :placeholder="$t('common.tips.input', [$t('cloudenv.text_94')])" />
          </a-form-model-item>
          <a-form-model-item :label="$t('cloudenv.text_147')" prop="options.password">
            <a-input-password v-model:value="form.options.password" :placeholder="$t('common.tips.input', [$t('cloudenv.text_147')])" />
          </a-form-model-item>
        </template>
        <template v-if="isOraclecloud">
          <upload-pem-file :form="form">
            <a-form-model-item prop="oracle_private_key">
              <a-textarea
                v-model:value="form.oracle_private_key"
                :placeholder="$t('common.tips.input', [$t('cloudenv.private_key')])"
                :auto-size="{ minRows: 6, maxRows: 8 }" />
            </a-form-model-item>
          </upload-pem-file>
        </template>
        <template v-if="isCephFS">
          <a-form-model-item label="Name" prop="option_name">
            <a-input v-model:value="form.option_name" />
          </a-form-model-item>
          <a-form-model-item label="Mon Host" prop="mon_host" :extra="$t('cloudenv.mon_host_extra')">
            <a-input v-model:value="form.mon_host" />
          </a-form-model-item>
          <a-form-model-item label="Secret" prop="secret">
            <a-input-password v-model:value="form.secret" />
          </a-form-model-item>
        </template>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <test-button :post="testPost" />
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import UploadJsonFile from '@Cloudenv/views/cloudaccount/components/UploadJsonFile'
import UploadPemFile from '@Cloudenv/views/cloudaccount/components/UploadPemFile'
import TestButton from '@/sections/TestButton'
import { HYPERVISORS_MAP, EXTRA_HYPERVISORS, isUcloudLikeHypervisor } from '@/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import regexp from '@/utils/regexp'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import { keySecretFields } from '../constants'

export default {
  name: 'CloudaccountUpdateDialog',
  components: { UploadJsonFile, TestButton, UploadPemFile },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const provider = this.params.data[0].brand.toLowerCase()
    const { options = {} } = this.params.data[0]
    const initMonHost = options.mon_host || ''
    const initName = options.name || ''
    const field = keySecretFields[provider] || {}
    const credKey = field.k || 'access_key_id'
    const credSecret = field.s || 'access_key_secret'
    const form = {
      [credKey]: undefined,
      [credSecret]: '',
      directory_id: '',
      ucloud_project_id: '',
      project_name: '',
      endpoint_type: undefined,
      oracle_private_pem: '',
      oracle_private_key: '',
      option_name: initName,
      mon_host: initMonHost,
      secret: '',
      options: {
        account: '',
        password: '',
      },
    }
    const rules = {
      [credKey]: [
        { required: true, message: field.placeholder?.k || this.$t('cloudenv.text_149') },
      ],
      [credSecret]: [
        { required: true, message: field.placeholder?.s || this.$t('cloudenv.text_150') },
      ],
      directory_id: [
        { required: true, message: this.$t('cloudenv.text_243') },
      ],
      project_name: [
        { required: true, message: this.$t('cloudenv.text_308') },
      ],
      oracle_private_key: [
        {
          validator: (rule, value, callback) => {
            if (value || form.oracle_private_pem) {
              callback()
            } else {
              callback(new Error(this.$t('common.tips.input', [this.$t('cloudenv.private_key')])))
            }
          },
        },
      ],
      oracle_private_pem: [
        {
          validator: (rule, value, callback) => {
            if (value || form.oracle_private_key) {
              callback()
            } else {
              callback(new Error(this.$t('cloudenv.private_pem_message')))
            }
          },
        },
      ],
      mon_host: [
        {
          validator: (rule, value, callback) => {
            if (!value) callback()
            const list = value.split(',')
            if (list.every(str => {
              return regexp.isIPv4AndPort(str)
            })) {
              callback()
            }
            callback(new Error(this.$t('cloudenv.check_mon_host')))
          },
        },
      ],
    }
    return {
      showDocsLink,
      loading: false,
      provider,
      credKey,
      credSecret,
      form,
      rules,
      endpointTypeOpts: [
        { key: 'internal', label: 'internal' },
        { key: 'admin', label: 'admin' },
        { key: 'public', label: 'public' },
      ],
    }
  },
  computed: {
    field () {
      return keySecretFields[this.provider]
    },
    doc () {
      return DOCS_MAP.cloudaccount()[this.provider]
    },
    isQcloud () {
      return this.provider === HYPERVISORS_MAP.qcloud.key
    },
    isAzure () {
      return this.provider === HYPERVISORS_MAP.azure.key
    },
    isOpenStack () {
      return this.provider === HYPERVISORS_MAP.openstack.key
    },
    isUcloud () {
      return isUcloudLikeHypervisor(this.provider)
    },
    isGoogle () {
      return this.provider === HYPERVISORS_MAP.google.key
    },
    isVMware () {
      return this.provider === HYPERVISORS_MAP.esxi.provider.toLowerCase()
    },
    isHcs () {
      return this.provider === HYPERVISORS_MAP.hcs.key
    },
    isCephFS () {
      return this.provider === EXTRA_HYPERVISORS.CephFS.key.toLowerCase()
    },
    isOraclecloud () {
      return this.provider === HYPERVISORS_MAP.oracle.provider.toLowerCase()
    },
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      if (this.isVMware) {
        const { hostname, port, protocol } = this.parseUrl(this.params.data[0].access_url)
        this.form.host = hostname
        this.form.port = port || (protocol === 'http' ? 80 : 443)
      }
    },
    normalizeValues (values) {
      const params = {}
      R.forEachObjIndexed((value, key) => {
        if (R.is(String, value)) {
          params[key] = value.trim()
        } else {
          params[key] = value
        }
      }, values)
      if (params.oracle_private_pem) {
        params.oracle_private_key = params.oracle_private_pem
        delete params.oracle_private_pem
      }
      if (this.isCephFS) {
        params.options = params.options || {}
        params.options.mon_host = params.mon_host
        params.options.password = params.secret
        params.options.name = params.option_name
        delete params.mon_host
        delete params.secret
        delete params.option_name
      }
      return params
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return this.normalizeValues({ ...this.form })
    },
    async handleConfirm () {
      this.loading = true
      try {
        const params = await this.validateForm()
        if (params.ucloud_project_id && params.access_key_id) {
          params.access_key_id = params.access_key_id + '::' + params.ucloud_project_id
          delete params.ucloud_project_id
        }
        let options
        if (params.options) {
          options = params.options
          delete params.options
        }
        await this.params.onManager('performAction', {
          id: this.params.data[0].id,
          managerArgs: {
            action: 'update-credential',
            data: params,
          },
        })
        if (options) {
          await this.params.onManager('update', {
            id: this.params.data[0].id,
            managerArgs: {
              data: {
                options,
              },
            },
          })
        }
        this.cancelDialog()
      } catch (error) {
        // validation or API error
      } finally {
        this.loading = false
      }
    },
    async testPost () {
      const values = await this.validateForm()
      await this.params.onManager('performAction', {
        id: this.params.data[0].id,
        managerArgs: {
          action: 'test-connectivity',
          data: values,
        },
      })
    },
    parseUrl (url) {
      return new URL(url)
    },
  },
}
</script>
