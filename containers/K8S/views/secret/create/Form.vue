<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_34')">
        <a-radio-group v-model:value="form.type">
          <a-radio-button value="keypair">{{$t('k8s.text_332')}}</a-radio-button>
          <a-radio-button value="cephCSI">Ceph CSI</a-radio-button>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.cluster" @input="setCluster" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="namespace">
        <namespace-select v-model:value="form.namespace" @input="setNamespace" :cluster="cluster" v-model:namespaceObj="namespaceObj" />
      </a-form-model-item>
      <template v-if="form.type === 'keypair'">
        <a-form-model-item :label="$t('k8s.text_52')" prop="server">
          <a-input v-model:value="form.server" :placeholder="$t('k8s.text_53')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_54')" prop="user">
          <a-input v-model:value="form.user" :placeholder="$t('k8s.text_55')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_56')" prop="password">
          <a-input v-model:value="form.password" :placeholder="$t('k8s.text_57')" show-password />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.text_58')" prop="email">
          <a-input v-model:value="form.email" :placeholder="$t('k8s.text_59')" />
        </a-form-model-item>
      </template>
      <template v-else>
        <a-form-model-item label="UserId" prop="userId">
          <a-input v-model:value="form.userId" :placeholder="$t('k8s.text_333')" />
        </a-form-model-item>
        <a-form-model-item label="UserKey" prop="userKey">
          <a-input v-model:value="form.userKey" :placeholder="$t('k8s.text_334')" />
        </a-form-model-item>
      </template>
    </a-form-model>
  </div>
</template>

<script>
import _ from 'lodash'
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import { SECRET_DEFAULT_TYPE } from '@K8S/constants'
import k8sCreateMixin from '@K8S/mixins/create'
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
  name: 'K8sConfigmapCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    const type = _.get(this.$route, 'query.storageType') || 'keypair'
    return {
      form: {
        type,
        name: '',
        cluster: this.$store.state.common.k8s.cluster,
        namespace: this.$store.state.common.k8s.namespace,
        server: '',
        user: '',
        password: '',
        email: '',
        userId: '',
        userKey: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { min: 2, max: 24, message: this.$t('k8s.text_132'), trigger: 'blur' },
          { validator: this.$validate('k8sName') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.text_30') },
        ],
        namespace: [
          { required: true, message: this.$t('k8s.text_61') },
        ],
        server: [
          { required: true, message: this.$t('k8s.text_53'), trigger: 'blur' },
        ],
        user: [
          { required: true, message: this.$t('k8s.text_55'), trigger: 'blur' },
        ],
        password: [
          { required: true, message: this.$t('k8s.text_57'), trigger: 'blur' },
        ],
        userId: [
          { required: true, message: this.$t('k8s.text_335'), trigger: 'blur' },
        ],
        userKey: [
          { required: true, message: this.$t('k8s.text_336'), trigger: 'blur' },
        ],
        email: [
          { validator: validateEmail, trigger: 'blur' },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 16 },
          xl: { span: 18 },
          xxl: { span: 20 },
        },
        labelCol: {
          md: { span: 8 },
          xl: { span: 6 },
          xxl: { span: 4 },
        },
      },
      namespaceObj: {},
    }
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      return this.form
    },
    async _doCreate (data, resouce) {
      await new this.$Manager('secrets', 'v1').create({ data })
    },
    async doCreate () {
      try {
        const values = await this.validateForm()
        const params = {
          name: values.name,
          cluster: values.cluster,
          namespace: values.namespace,
          type: SECRET_DEFAULT_TYPE,
        }
        if (values.type === 'keypair') {
          params.dockerConfigJson = {
            email: values.email,
            password: values.password,
            user: values.user,
            server: values.server,
          }
        } else {
          params.type = 'yunion.io/ceph-csi'
          params.cephCSI = {}
          params.cephCSI.userId = values.userId
          params.cephCSI.userKey = values.userKey
        }
        await this._doCreate(params)
        this.$message.success(this.$t('k8s.text_46'))
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
