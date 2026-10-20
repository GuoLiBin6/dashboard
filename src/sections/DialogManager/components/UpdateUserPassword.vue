<template>
  <base-dialog @cancel="cancelDialog" :width="620" :modalProps="{ ...params.modalProps }">
    <template #header>{{$t('common_135')}}</template>
    <template #body>
      <a-alert class="mb-2" type="warning" v-if="params.tip">
        <template #message>{{params.tip}}</template>
      </a-alert>
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('common_136')" prop="password_old">
          <a-input-password v-model:value="form.password_old" :placeholder="$t('common_137')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common_138')" prop="password_new">
          <a-input-password v-model:value="form.password_new" :placeholder="$t('common_139')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common_140')" prop="com_password">
          <a-input-password v-model:value="form.com_password" :placeholder="$t('common_141')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common_142')" prop="passcode" v-if="userInfo.enable_mfa && userInfo.system_totp_on">
          <a-input v-model:value="form.passcode" :placeholder="$t('common_142')" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" :loading="loading" @click="handleConfirm">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="handleLogout">{{ $t('common_348') }}</a-button>
      <a-button v-if="!isForcedReset" @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import { mapGetters, mapState } from 'vuex'
import { Base64 } from 'js-base64'
import { aesEncrypt } from '@/utils/crypto'
import { passwordLevel, genReferRouteQuery } from '@/utils/utils'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'UpdateUserPasswordDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const validatePassword = async (rule, value, callback) => {
      if (R.isNil(this.minPasswordLen) || R.isNil(this.complexity)) {
        try {
          const response = await new this.$Manager('service_settings', 'v1').list()
          const identity = (response.data && response.data.identity) || {}
          const len = identity.password_minimal_length
          const complexity = identity.password_char_complexity
          if (!R.isNil(len)) {
            this.minPasswordLen = len
          }
          if (!R.isNil(complexity)) {
            this.complexity = complexity
          }
        } catch (error) {
          callback()
          throw error
        }
      }
      const passLevel = passwordLevel(value)
      const passMaxLen = Math.max(this.minPasswordLen, this.complexity)
      if (passLevel < this.complexity || value.length < passMaxLen) {
        return callback(new Error(this.$t('validator.passwordLevel', [this.complexity === 0 ? 1 : this.complexity, passMaxLen])))
      }
      const passwordOld = this.form.password_old
      const passwordNew = this.form.password_new
      if (passwordOld && passwordOld === passwordNew) {
        return callback(new Error(this.$t('common.password_no_equal')))
      }
      return callback()
    }
    return {
      loading: false,
      minPasswordLen: null,
      complexity: null,
      form: {
        password_old: '',
        password_new: '',
        com_password: '',
        passcode: '',
      },
      rules: {
        password_old: [
          { required: true, message: this.$t('common_144'), trigger: 'blur' },
        ],
        password_new: [
          { required: true, message: this.$t('common_145'), trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' },
        ],
        com_password: [
          { required: true, message: this.$t('common_146'), trigger: 'blur' },
          { validator: this.checkComPassword, trigger: 'blur' },
        ],
        passcode: [
          { required: true, message: this.$t('common_147') },
        ],
      },
    }
  },
  computed: {
    ...mapState('auth', {
      regions: state => state.regions,
    }),
    ...mapGetters(['userInfo']),
    isForcedReset () {
      const modalProps = (this.params && this.params.modalProps) || {}
      return !!(this.userInfo.need_reset_password || (this.params && this.params.tip) || modalProps.closable === false)
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('auth', 'v1')
  },
  methods: {
    async handleLogout () {
      try {
        await this.$store.dispatch('auth/logout')
        this.$router.push({
          path: '/auth/login',
          query: genReferRouteQuery(this.$route),
        })
        this.cancelDialog()
      } catch (error) {
        throw error
      }
    },
    checkComPassword (rule, value, callback) {
      const password = this.form.password_new
      if (password !== value) {
        callback(new Error(this.$t('common_148')))
      }
      callback()
    },
    doUpdatePassword (values) {
      return this.manager.performClassAction({
        action: 'password',
        data: values,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = this.form
        let data = {
          password_confirm: Base64.encode(values.com_password),
          password_old: Base64.encode(values.password_old),
          password_new: Base64.encode(values.password_new),
        }
        if (this.regions.encrypt_passwd) {
          data = {
            password_confirm: aesEncrypt(values.com_password),
            password_old: aesEncrypt(values.password_old),
            password_new: aesEncrypt(values.password_new),
          }
        }
        if (this.userInfo.enable_mfa && this.userInfo.system_totp_on) {
          data.passcode = values.passcode
        }
        this.loading = true
        await this.doUpdatePassword(data)
        this.$message.success(this.$t('common.success'))
        this.cancelDialog()
        await this.$store.dispatch('auth/logout')
        this.$router.push('/auth')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
