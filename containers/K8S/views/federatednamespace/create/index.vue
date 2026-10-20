<template>
  <div>
    <page-header :title="$t('k8s.text_367')" />
    <a-form-model
      ref="formRef"
      class="mt-3"
      :model="form"
      :rules="rules">
      <a-form-model-item
        :label="$t('k8s.text_41')"
        prop="name">
        <a-input v-model:value="form.name" :placeholder="$t('k8s.text_60')" />
      </a-form-model-item>
    </a-form-model>
    <page-footer>
      <div slot="right">
        <a-button class="mr-2" type="primary" @click="handleConfirm" :loading="loading">{{$t('common.create')}}</a-button>
        <a-button @click="cancel">{{ $t('dialog.cancel') }}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'FederatednamespaceCreate',
  mixins: [k8sCreateMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { min: 2, max: 24, message: this.$t('k8s.text_132') },
          { validator: this.$validate('k8sName') },
        ],
      },
    }
  },
  created () {
    this.resourceM = new this.$Manager('federatednamespaces', 'v1')
  },
  unmounted () {
    this.resourceM = null
  },
  methods: {
    doCreate (data) {
      return this.resourceM.create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const data = {
          ...this.form,
          spec: {
            template: {
              spec: {},
            },
          },
        }
        await this.doCreate(data)
        this.loading = false
        this.$message.success(this.$t('k8s.text_184'))
        this.cancel()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    cancel () {
      this.$router.push('/k8s-federatednamespace')
    },
  },
}
</script>
