<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('k8s.repo.credential.update') }}</div>
    <div slot="body">
      <a-spin :spinning="loadingDetail">
        <a-form-model
          v-if="!loadingDetail"
          ref="formRef"
          :model="form"
          :rules="rules"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 20 }"
          hideRequiredMark>
          <a-form-model-item :label="$t('k8s.text_54')" prop="username">
            <a-input
              v-model:value="form.username"
              :placeholder="$t('common.tips.input', [$t('k8s.text_54')])" />
          </a-form-model-item>
          <a-form-model-item :label="$t('k8s.text_56')" prop="password">
            <a-input-password
              v-model:value="form.password"
              :placeholder="$t('common.tips.input', [$t('k8s.text_56')])" />
          </a-form-model-item>
        </a-form-model>
      </a-spin>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading" :disabled="loadingDetail">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog" :disabled="loading">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

function pickUsername (config) {
  if (!config) return ''
  return config.common?.username || config.custom?.username || config.harbor?.username || ''
}

export default {
  name: 'ReposUpdateCredentialDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      loadingDetail: true,
      initialUsername: '',
      form: {
        username: '',
        password: '',
      },
      rules: {
        username: [
          { required: true, message: this.$t('common.tips.input', [this.$t('k8s.text_54')]) },
        ],
        password: [
          { required: true, message: this.$t('common.tips.input', [this.$t('k8s.text_56')]) },
        ],
      },
    }
  },
  computed: {
    record () {
      const data = this.params.data
      return Array.isArray(data) ? data[0] : data
    },
  },
  created () {
    this.fetchUsername()
  },
  methods: {
    async fetchUsername () {
      const id = this.record?.id
      if (!id) {
        this.loadingDetail = false
        return
      }
      try {
        const manager = new this.$Manager('container_registries', 'v1')
        const { data } = await manager.getSpecific({ id, spec: 'config' })
        this.initialUsername = pickUsername(data)
      } catch (e) {
        this.initialUsername = ''
      } finally {
        this.form.username = this.initialUsername
        this.loadingDetail = false
      }
    },
    async handleConfirm () {
      const valid = await this.$refs.formRef.validate().catch(() => false)
      if (!valid) return
      this.loading = true
      try {
        const manager = new this.$Manager('container_registries', 'v1')
        await manager.performAction({
          id: this.record.id,
          action: 'update-credential',
          data: {
            username: this.form.username,
            password: this.form.password,
          },
        })
        this.$message.success(this.$t('common.success'))
        this.params.refresh && this.params.refresh()
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
