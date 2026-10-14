<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('common.create') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout" hideRequiredMark>
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input
            v-model:value="form.name"
            :placeholder="$t('validator.resourceName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_34')" prop="type">
          <a-radio-group v-model:value="form.type" buttonStyle="solid">
            <a-radio-button value="common">{{ $t('k8s.repo.type.common') }}</a-radio-button>
            <a-radio-button value="custom">{{ $t('k8s.repo.type.custom') }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.repo.url')" :extra="isCustomType ? $t('k8s.repo.url.extra.custom') : $t('k8s.repo.url.extra')" prop="url">
          <a-input
            v-model:value="form.url"
            :placeholder="$t('common.tips.input', [$t('k8s.repo.url')])" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_54')">
          <a-input
            v-model:value="form.username"
            :placeholder="$t('common.tips.input', [$t('k8s.text_54')])" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_56')">
          <a-input-password
            v-model:value="form.password"
            :placeholder="$t('common.tips.input', [$t('k8s.text_56')])" />
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

export default {
  name: 'ReposCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        type: 'common',
        url: '',
        username: '',
        password: '',
      },
      rules: {
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
          { validator: this.$validate('resourceName') },
        ],
        type: [
          { required: true, message: this.$t('common.tips.select', [this.$t('k8s.text_34')]) },
        ],
        url: [
          { required: true, message: this.$t('common.tips.input', [this.$t('k8s.repo.url')]) },
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
    isCustomType () {
      return this.form.type === 'custom'
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { username, password, type, ...rest } = this.form
        const manager = new this.$Manager('container_registries', 'v1')
        const data = {
          ...rest,
          type,
        }
        if (username && password) {
          const configKey = type || 'common'
          data.config = {
            [configKey]: {
              username,
              password,
            },
          }
        }
        await manager.create({ data })
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
