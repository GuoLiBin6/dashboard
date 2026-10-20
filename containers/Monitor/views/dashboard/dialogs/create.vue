<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('monitor.dashboard.dialog.create')}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('IAM.text_1')" prop="scope">
          <scope-select :value="form.scope" @change="val => { form.scope = val }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('common.placeholder')"  />
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
import ScopeSelect from '@Monitor/components/MonitorCard/sections/select/scope'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
export default {
  name: 'CreateMonitorDashboard',
  components: {
    ScopeSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const scope = this.$store.getters.scope
    return {
      loading: false,
      scope,
      form: {
        scope: { id: '', scope },
        name: '',
      },
      rules: {
        scope: [
          { validator: this.validateScope },
        ],
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
        ],
      },
    }
  },
  methods: {
    validateScope (rule, value, callback) {
      if (this.scope === value.scope) {
        callback()
      } else {
        if (value.id) {
          callback()
        } else {
          const msg = this.$t('common.placeholder')
          callback(msg)
        }
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = this.form
        const data = {
          scope: values.scope.scope,
          name: values.name,
        }
        if (this.scope !== values.scope.scope && values.scope.id && values.scope.id.length > 0) {
          data[`${values.scope.scope}_id`] = values.scope.id
        }
        await new this.$Manager('alertdashboards', 'v1').create({ data })
        this.loading = false
        if (this.params.refresh && typeof this.params.refresh === 'function') {
          this.params.refresh()
        }
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>

<style scoped>

</style>
