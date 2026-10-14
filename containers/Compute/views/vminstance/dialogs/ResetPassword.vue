<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_276')}}</div>
    <div slot="body">
      <a-alert v-if="enableQgaAlert" class="mb-2" type="warning">
        <template #message>
          {{ $t('compute.qga.alert01') }}<template v-if="showDocsLink()">（<help-link :href="qgaDoc">{{ $t('compute.qga.alert02') }}</help-link>）</template>，{{ $t('compute.qga.alert03') }}
        </template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_276')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item v-if="isSingle" :label="$t('common_312')" prop="username">
          <a-input v-model:value="form.username" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.qga.password')">
          <server-password
            ref="serverPassword"
            :form="form"
            :login-types="loginTypes"
            :disabledLoginTypes="disabledLoginTypes" />
        </a-form-model-item>
        <a-form-model-item v-if="enableAutoStart" :label="$t('compute.text_494')" :extra="$t('compute.text_1229')" prop="auto_start">
          <a-switch :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" v-model:checked="form.auto_start" :disabled="disableAutoStart" />
        </a-form-model-item>
        <p v-if="!checkQgaOK" class="error-color">{{ $t('compute.reset_password.qga_tooltip') }}</p>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-tooltip :title="checkQgaOK ? undefined : $t('compute.reset_password.qga_tooltip')">
        <a-button :class="{ 'mr-1': !checkQgaOK }" type="primary" @click="handleConfirm" :loading="loading" :disabled="!checkQgaOK">{{ $t('dialog.ok') }}</a-button>
      </a-tooltip>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import ServerPassword, { PASSWORD_RULES } from '@Compute/sections/ServerPassword/model'
import { LOGIN_TYPES_MAP } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { HYPERVISORS_MAP, EXTRA_HYPERVISORS } from '@/constants'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
const hypervisorMap = Object.assign({}, HYPERVISORS_MAP, EXTRA_HYPERVISORS)
export default {
  name: 'VmResetPasswordDialog',
  components: {
    ServerPassword,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    let autoStartInitialValue = true
    let disableAutoStart = false
    const noAutoStartHyper = [hypervisorMap.azure.key, hypervisorMap.openstack.key]
    const firstData = this.params.data && this.params.data[0]
    if (firstData && firstData.status === 'running') {
      autoStartInitialValue = false
      disableAutoStart = true
    }
    if (firstData && firstData.hypervisor) {
      const hyper = firstData.hypervisor.toLowerCase()
      if (noAutoStartHyper.includes(hyper)) {
        autoStartInitialValue = false
        disableAutoStart = true
      }
    }
    const login_account = firstData.metadata?.login_account
    const userName = {
      Linux: 'root',
      Windows: 'Administrator',
    }
    return {
      showDocsLink,
      loading: false,
      loginTypes: [LOGIN_TYPES_MAP.random.key, LOGIN_TYPES_MAP.password.key],
      disableAutoStart,
      form: {
        username: login_account || userName[firstData.os_type],
        loginType: LOGIN_TYPES_MAP.random.key,
        password: undefined,
        keypair: undefined,
        auto_start: autoStartInitialValue,
      },
      rules: {
        password: PASSWORD_RULES,
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      qgaDoc: DOCS_MAP.qga(),
      checkQgaOK: true,
      loginAccount: login_account,
    }
  },
  computed: {
    enableMFA () {
      return this.$store.getters.userInfo.enable_mfa && this.$store.state.auth.auth.system_totp_on
    },
    selectedItems () {
      return this.params.data
    },
    selectedItem () {
      return this.selectedItems[0]
    },
    enableAutoStart () {
      return this.selectedItems.some(item => item.status === 'ready')
    },
    isAllKvm () {
      return this.selectedItems.every(item => item.hypervisor === hypervisorMap.kvm.key)
    },
    enableQgaAlert () {
      return this.isAllKvm && this.selectedItems.some(item => item.status === 'running')
    },
    isSingle () {
      return this.selectedItems?.length === 1
    },
    isAllRunning () {
      return this.selectedItems.every(item => item.status === 'running')
    },
    isSupportQgaPing () {
      return this.isAllKvm && this.isAllRunning && this.isSingle
    },
    disabledLoginTypes () {
      if (this.form.username && this.form.username !== this.loginAccount) {
        return [LOGIN_TYPES_MAP.random.key]
      }
      return []
    },
  },
  watch: {
    disabledLoginTypes (val, oldVal) {
      if (!oldVal.length && val.length) {
        this.form.loginType = LOGIN_TYPES_MAP.password.key
        this.$refs.serverPassword && this.$refs.serverPassword.loginTypeChange(LOGIN_TYPES_MAP.password.key)
      }
    },
  },
  created () {
    this.isSupportQgaPing && this.fetchQgaPing()
  },
  methods: {
    async fetchQgaPing () {
      try {
        const res = await new this.$Manager('servers', 'v2').performAction({
          id: this.selectedItem.id,
          action: 'qga-ping',
          data: {
            timeout: 100,
          },
        })

        if (res.data?.ping_error) {
          this.checkQgaOK = false
        } else {
          this.checkQgaOK = true
        }
      } catch (error) {
        this.checkQgaOK = false
      }
    },
    async doSetPassword (values) {
      const ids = this.selectedItems.map(item => item.id)
      const data = { reset_password: true, auto_start: values.auto_start }

      if (values.loginType === LOGIN_TYPES_MAP.password.key) {
        data.password = values.password
      }
      if (this.isSingle && values.username) {
        data.username = values.username
      }

      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'set-password',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const callback = async () => {
          this.loading = true
          await this.doSetPassword(values)
          this.$message.success(this.$t('message.exec_success'))
          this.cancelDialog()
        }
        if (this.enableMFA) {
          this.createDialog('SecretVertifyDialog', {
            action: this.$t('table.title.mfa_validate'),
            success: callback,
          })
        } else {
          await callback()
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
