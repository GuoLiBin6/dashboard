<template>
  <div>
    <a-form-item class="mb-0">
      <a-radio-group v-model:value="secretType" @change="secretTypeChange">
        <a-radio-button value="none">{{$t('k8s.text_75')}}</a-radio-button>
        <a-radio-button value="select">{{$t('k8s.text_76')}}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item v-if="secretType === 'select'">
      <base-select
        v-model:value="imagePullSecrets"
        resource="secrets"
        version="v1"
        :params="params"
        :need-params="true"
        :select-props="{ mode: 'multiple', placeholder: $t('k8s.text_77') }" />
      <div slot="extra">{{$t('k8s.text_78')}}<a-button type="link" @click="createImageSecret">{{$t('k8s.text_79')}}</a-button>
      </div>
    </a-form-item>
  </div>
</template>

<script>
import { SECRET_DEFAULT_TYPE } from '@K8S/constants'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'K8SImageSecrets',
  mixins: [WindowsMixin],
  props: {
    cluster: {},
    namespace: {},
    form: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    return {
      secretTypeField: 'secretType',
      imageField: 'imagePullSecrets',
      secretType: 'none',
      imagePullSecrets: undefined,
    }
  },
  computed: {
    params () {
      if (this.cluster && this.namespace) {
        return {
          type: SECRET_DEFAULT_TYPE,
          cluster: this.cluster,
          namespace: this.namespace,
        }
      }
      return {}
    },
  },
  watch: {
    imagePullSecrets () {
      this.syncToParentForm()
    },
  },
  mounted () {
    this.syncToParentForm()
  },
  methods: {
    syncToParentForm () {
      const fd = this.form?.fd
      if (!fd) return
      this.$set(fd, this.secretTypeField, this.secretType)
      this.$set(fd, this.imageField, this.imagePullSecrets)
    },
    secretTypeChange () {
      if (this.secretType !== 'select') {
        this.imagePullSecrets = undefined
      }
      this.syncToParentForm()
    },
    createImageSecret () {
      this.createDialog('K8SImageSecretCreateDialog', {
        title: this.$t('k8s.text_80'),
        cluster: this.cluster,
        namespace: this.namespace,
        success: name => {
          this.imagePullSecrets = [name]
          this.syncToParentForm()
        },
      })
    },
  },
}
</script>
