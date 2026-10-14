<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ params.title || $t('k8s.create') }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('k8s.text_50')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('k8s.text_51')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
          <cluster-select v-model:value="form.cluster" :setDefault="false" :disabled="true" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_23')" prop="namespace">
          <namespace-select v-model:value="form.namespace" :cluster="params.cluster" :setDefault="false" :disabled="true" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_52')" prop="server">
          <a-input v-model:value="form.server" :placeholder="$t('k8s.text_53')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_54')" prop="user">
          <a-input v-model:value="form.user" :placeholder="$t('k8s.text_55')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_56')" prop="password">
          <a-input-password v-model:value="form.password" :placeholder="$t('k8s.text_57')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_58')" prop="email">
          <a-input v-model:value="form.email" :placeholder="$t('k8s.text_59')" />
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
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import { SECRET_DEFAULT_TYPE } from '@K8S/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { REGEXP } from '@/utils/validate'

const validateEmail = (rule, value, cb) => {
  if (!value) {
    cb()
  } else {
    const { regexp, message } = REGEXP.email
    if (regexp.test(value)) {
      cb()
    } else {
      cb(Error(message))
    }
  }
}

export default {
  name: 'K8SImageSecretCreateDialog',
  components: {
    ClusterSelect,
    NamespaceSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        cluster: this.params.cluster,
        namespace: this.params.namespace,
        server: '',
        user: '',
        password: '',
        email: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { validator: this.$validate('k8sName') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.text_30'), trigger: 'blur' },
        ],
        namespace: [
          { required: true, message: this.$t('k8s.text_61'), trigger: 'blur' },
        ],
        server: [
          { required: true, message: this.$t('k8s.text_53'), trigger: 'blur' },
        ],
        user: [
          { required: true, message: this.$t('k8s.text_62'), trigger: 'blur' },
        ],
        password: [
          { required: true, message: this.$t('k8s.text_57'), trigger: 'blur' },
        ],
        email: [
          { validator: validateEmail, trigger: 'blur' },
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
  created () {
    this.secretsM = new this.$Manager('secrets', 'v1')
  },
  methods: {
    async doCreate (values) {
      const data = {
        cluster: values.cluster,
        dockerConfigJson: {
          email: values.email,
          password: values.password,
          user: values.user,
          server: values.server,
        },
        name: values.name,
        namespace: values.namespace,
        type: SECRET_DEFAULT_TYPE,
      }
      try {
        await this.secretsM.create({ data })
      } catch (error) {
        throw error
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.loading = false
        this.cancelDialog()
        this.params.success && this.params.success(this.form.name)
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
