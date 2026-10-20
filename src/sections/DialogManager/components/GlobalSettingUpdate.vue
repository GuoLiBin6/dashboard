<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{$t('system.text_22')}}</template>
    <template #body>
      <dialog-selected-tips :count="params.data.length" :name="$t('dictionary.globalsetting')" :action="$t('system.text_188', [firstData['dialogLabel'] || firstData['label']])" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('system.text_102')" prop="value" :extra="firstData['dialogDesc'] || firstData['desc']">
          <component :is="element" v-bind="firstData.opt.props" v-model:value="form.value" class="w-100">
            <template v-if="element === 'a-select'">
              <a-select-option
                v-for="item of firstData.opt.options"
                :key="item.key"
                :value="item.key"
                :disabled="item.disabled">{{ item.label }}</a-select-option>
            </template>
          </component>
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'GlobalSettingUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const initialValue = this.params.data[0].value
    let required = true
    if (this.params.data[0] && this.params.data[0].opt?.notRequired) {
      required = false
    }
    return {
      loading: false,
      form: {
        value: initialValue,
      },
      rules: {
        value: [
          {
            required,
            message: this.$t('system.text_192'),
          },
        ],
      },
    }
  },
  computed: {
    firstData () {
      return this.params.data[0]
    },
    element () {
      return this.firstData.opt.component
    },
  },
  methods: {
    doUpdate (data) {
      return this.$http({
        method: 'POST',
        url: `/v1/services/${this.firstData.serviceId}/config`,
        data: {
          action: 'update',
          config: {
            default: {
              [this.firstData.key]: data.value,
            },
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          value: this.firstData.opt.parser ? this.firstData.opt.parser(this.form.value) : this.form.value,
        }
        await this.doUpdate(values)
        const newVal = this.firstData.opt.formatter ? this.firstData.opt.formatter(values.value) : values.value
        this.params.success(this.firstData.key, newVal, this.firstData.serviceId)
        if (this.params.ok) this.params.ok(this.firstData.key, newVal, this.firstData.serviceId)
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
