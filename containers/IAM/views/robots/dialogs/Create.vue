<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ headerTitle }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout"
        hideRequiredMark>
        <a-form-model-item v-show="!isEdit" :label="$t('compute.text_297', [$t('dictionary.project')])">
          <domain-project
            :model="form"
            :form="form" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.resourceName')" />
          <template v-slot:extra>
            <name-repeated
              res="robots"
              version="v1"
              :name="form.name" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('system.text_48')" prop="type">
          <a-radio-group v-model:value="form.type" :disabled="isEdit">
            <a-radio-button
              v-for="item in typesOpts"
              :value="item.key"
              :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="form.type === 'webhook' ? 'URL' : 'Webhook'" prop="address">
          <a-input v-model:value="form.address" />
          <div slot="extra" v-show="form.type !== 'webhook'">
            {{ $t('iam.get_params_help') }} ，{{ $t('iam.help') }} <help-link :href="DOCS_MAP.webhook(form.type)">{{ $t('common_386') }}</help-link>
          </div>
        </a-form-model-item>
        <template v-if="form.type === 'webhook'">
          <a-form-model-item label="header" prop="header">
            <a-input v-model:value="form.header" />
          </a-form-model-item>
          <a-form-model-item label="body" prop="body">
            <a-input v-model:value="form.body" />
          </a-form-model-item>
          <a-form-model-item label="msg_key" prop="msg_key">
            <a-input v-model:value="form.msg_key" />
          </a-form-model-item>
          <a-form-model-item label="secret_key" prop="secret_key">
            <a-input v-model:value="form.secret_key" />
          </a-form-model-item>
        </template>
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
import DomainProject from '@/sections/DomainProject/model'
import NameRepeated from '@/sections/NameRepeated/index'
import { isRequired } from '@/utils/validate'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import { ROBOT_TYPES } from '../constants'
export default {
  name: 'CreateRobotDialog',
  components: {
    DomainProject,
    NameRepeated,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { name, domain_id, tenant_id, address, type, header, body, msg_key, secret_key } = this.params.data || {}
    const { projectDomainId, projectId } = this.$store.getters.userInfo
    const initType = type || 'dingtalk'

    return {
      DOCS_MAP,
      showDocsLink,
      typesOpts: ROBOT_TYPES,
      loading: false,
      form: {
        domain: domain_id || projectDomainId,
        project: tenant_id || projectId,
        name: name || '',
        type: initType,
        address: address || '',
        header: header ? JSON.stringify(header) : '',
        body: body ? JSON.stringify(body) : '',
        msg_key: msg_key || '',
        secret_key: secret_key || '',
      },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
          { validator: this.$validate('resourceName') },
        ],
        type: [
          { required: true, message: `${this.$t('common.select')}` },
        ],
        address: [
          { required: true, message: `${this.$t('common.placeholder')}Webhook` },
        ],
        header: [
          { validator: this.checkHeader },
        ],
        body: [
          { validator: this.checkBody },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
    }
  },
  computed: {
    isEdit () {
      return this.params.data?.id
    },
    headerTitle () {
      if (this.isEdit) {
        return this.$t('system.text_141', [this.$t('system.robot')])
      }
      return this.$t('system.text_130', [this.$t('system.robot')])
    },
  },
  methods: {
    doCreate (data) {
      return new this.$Manager('robots', 'v1').create({ data: data })
    },
    doUpdate (id, data) {
      return new this.$Manager('robots', 'v1').update({ id, data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { domain, project, name, header, body, msg_key, ...rest } = this.form
        this.loading = true

        if (this.isEdit) {
          const data = { ...rest, name }
          if (header) {
            data.header = JSON.parse(header.trim())
          } else {
            data.header = {}
          }
          if (body) {
            data.body = JSON.parse(body.trim())
          } else {
            data.body = {}
          }
          if (msg_key) data.msg_key = msg_key.trim()
          await this.doUpdate(this.params.data?.id, data)
        } else {
          const data = { ...rest, project: project?.key, domain: domain?.key, generate_name: name }
          if (header) data.header = JSON.parse(header.trim())
          if (body) data.body = JSON.parse(body.trim())
          if (msg_key) data.msg_key = msg_key.trim()
          await this.doCreate(data)
        }

        this.loading = false
        this.cancelDialog()
        this.params.refresh && this.params.refresh()
        this.params.success && this.params.success()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    checkHeader (rule, value, callback) {
      try {
        const v = (value || '').trim()
        if (v) {
          JSON.parse(v)
        }
        callback()
      } catch (error) {
        // eslint-disable-next-line standard/no-callback-literal
        callback(this.$t('iam.robots.json_validate'))
      }
    },
    checkBody (rule, value, callback) {
      try {
        const v = (value || '').trim()
        if (v) {
          JSON.parse(v)
        }
        callback()
      } catch (error) {
        // eslint-disable-next-line standard/no-callback-literal
        callback(this.$t('iam.robots.json_validate'))
      }
    },
  },
}
</script>
