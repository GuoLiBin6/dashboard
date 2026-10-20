<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <a-form-model slot="body" ref="formRef" :model="form" :rules="rules" class="mt-3">
      <a-form-model-item :label="$t('network.text_205', [$t('dictionary.domain')])" v-if="$store.getters.isAdminMode" prop="project_domain">
        <domain-select v-model:value="form.project_domain" />
      </a-form-model-item>
      <a-form-model-item :label="$t('network.text_21')" prop="name">
        <a-input v-model:value="form.name" :placeholder="$t('network.text_116')" />
      </a-form-model-item>
    </a-form-model>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import validateForm from '@/utils/validate'
import DomainSelect from '@/sections/DomainSelect'

export default {
  name: 'GlobalVpcCreateDialog',
  components: {
    DomainSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loading: false,
      form: {
        name: initialValues.name,
        project_domain: this.$store.getters.userInfo.projectDomainId,
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: validateForm('resourceName') },
        ],
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.params.onManager('create', {
          managerArgs: {
            data: { ...this.form },
          },
        })
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
