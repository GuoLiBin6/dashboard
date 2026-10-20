<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('common.create') }}{{ $t('dictionary.clouduser') }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('cloudenv.text_375')" :extra="nameExtra" prop="generate_name">
          <a-input v-model:value="form.generate_name" :placeholder="namePlaceholder" @change="e => { formFi.generate_name = e.target.value }" />
          <template v-slot:extra>
            <name-repeated
              res="cloudusers"
              version="v1"
              :name="formFi.generate_name"
              :params="nameRepeatParams" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.cloudprovider')" prop="manager_id">
          <base-select
            v-model:value="form.manager_id"
            resource="cloudproviders"
            filterable
            isDefaultSelect
            :params="cloudproviderParams"
            v-model:item="formFi.cloudprovider" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.clouduser_list_t4')" :extra="$t('common_625')" prop="owner_id">
          <user-select
            v-model="form.owner_id"
            :cloudaccount-id="params.cloudaccount.id"
            v-model:user="formFi.user"
            v-model:project="formFi.project"
            :cloudprovider-id="formFi.cloudprovider.id"
            :defaultDomainId="params.defaultDomainId"
            :defaultProjectId="params.defaultProjectId"
            :defaultUserId="params.userId" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.text_146')" class="mb-0" :extra="isEnableMail ? '' : $t('system.is_config_mail_tips')" prop="email">
          <a-input v-model:value="form.email" :disabled="!isEnableMail" :placeholder="$t('system.email_placeholder')" />
        </a-form-model-item>
        <a-form-model-item :wrapperCol="{ offset: 4 }" prop="notify">
          <a-checkbox v-model:checked="form.notify" :disabled="!isCanSendNotify">{{ $t('system.email_checkbox_text') }}</a-checkbox>
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
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import NameRepeated from '@/sections/NameRepeated'
import UserSelect from '../components/UserSelect'

export default {
  name: 'ClouduserCreateDialog',
  components: {
    NameRepeated,
    UserSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  props: {
    params: {
      type: Object,
      defualt: () => { },
    },
  },
  data () {
    const googleNameRules = this.params.cloudaccount.brand === 'Google' ? [
      { required: true, message: this.$t('common.text00042') },
      { validator: this.$validate('email'), message: this.$t('cloudenv.text_376') },
    ] : []
    return {
      loading: false,
      form: {
        generate_name: '',
        owner_id: undefined,
        manager_id: undefined,
        email: '',
        notify: false,
      },
      formFi: {
        generate_name: '',
        user: {},
        cloudprovider: {},
        project: {},
      },
      rules: {
        generate_name: googleNameRules.length
          ? [{ validateFirst: true }, ...googleNameRules]
          : [],
        owner_id: [
          { required: true, message: this.$t('common.select') },
        ],
        manager_id: [
          { required: true, message: this.$t('common.select') },
        ],
        email: [
          { validator: this.emailValidator },
        ],
      },
      isCanSendNotify: false,
      isEnableMail: false,
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    cloudproviderParams () {
      return {
        scope: this.$store.getters.scope,
        cloudaccount_id: this.params.cloudaccount.id,
      }
    },
    isGoogle () {
      return this.params.cloudaccount.brand === 'Google'
    },
    namePlaceholder () {
      if (this.formFi.user && this.formFi.user.name) {
        if (this.isGoogle) {
          return this.$t('cloudenv.text_377')
        }
        return this.formFi.user.name
      }
      return ''
    },
    nameRepeatParams () {
      if (this.isGoogle) {
        return { manager_id: this.formFi.cloudprovider.id }
      }
      return { cloudaccount_id: this.params.cloudaccount.id }
    },
    nameExtra () {
      if (this.isGoogle) return null
      return this.$t('cloudenv.clouduser_text1')
    },
  },
  watch: {
    'formFi.user': {
      handler (val) {
        if (val.id) {
          this.isEnableMail && this.fetchEmail(val.id)
        }
      },
      deep: true,
    },
    'form.email' () {
      this.updateCanSendNotify()
    },
  },
  created () {
    this.fetchConfigEmail()
  },
  methods: {
    updateCanSendNotify () {
      if (this.form.email && this.isEnableMail) {
        this.$nextTick(() => {
          this.$refs.formRef.validateField('email', (err) => {
            if (!err) {
              this.isCanSendNotify = true
            } else {
              this.isCanSendNotify = false
            }
          })
        })
      } else {
        this.isCanSendNotify = false
      }
    },
    async fetchEmail (userId) {
      const { data } = await new this.$Manager('receivers', 'v1').performClassAction({
        action: 'intellij-get',
        data: {
          scope: this.$store.getters.scope,
          user_id: userId,
        },
      })
      this.form.email = data.email || ''
    },
    emailValidator (rule, value, callback) {
      if (R.isEmpty(value) || R.isNil(value)) {
        return callback()
      }
      return this.$validate('email')(rule, value, callback)
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (!this.isGoogle) {
          values.cloudaccount_id = this.params.cloudaccount.id
        }
        values.project_id = this.formFi.project.id
        await this.params.onManager('create', {
          managerArgs: {
            data: values,
          },
        })
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
    async fetchConfigEmail () {
      this.isEnableMail = false
      try {
        const res = await new this.$Manager('notifyconfigs/capability', 'v1').list({})
        const domainData = res.data.domain || {}
        const systemData = res.data.system || []
        if (domainData[this.userInfo.projectDomainId] && domainData[this.userInfo.projectDomainId].includes('email')) {
          this.isEnableMail = true
          return
        }
        if (systemData.includes('email')) {
          this.isEnableMail = true
        }
      } catch (error) {
        throw error
      } finally {
        this.$emit('update:loading', false)
      }
    },
  },
}
</script>
