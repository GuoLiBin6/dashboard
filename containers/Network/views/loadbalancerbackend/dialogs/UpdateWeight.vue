<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_352')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.lb_backend')" :count="params.data.length" :action="$t('network.text_352')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item v-if="params.updateFields.weight" :label="$t('network.text_166')" prop="weight">
          <a-input-number :min="0" :max="maxWeight" v-model:value="form.weight" />
        </a-form-model-item>
        <a-form-model-item v-if="params.updateFields.port" :label="$t('network.text_165')" prop="port">
          <a-input-number :min="1" :max="65535" v-model:value="form.port" />
        </a-form-model-item>
        <a-form-model-item v-if="params.updateFields.status" :label="$t('network.text_189')" prop="status">
          <a-switch v-model:checked="form.status" />
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
import expectStatus from '@/constants/expectStatus'

export default {
  name: 'BackendUpdateDialog',
  components: {
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const w100Providers = ['aliyun', 'huawei', 'qcloud', 'aws']
    let maxWeight = 256
    const val = this.params.data[0]
    if (val && val.provider) {
      if (w100Providers.includes(val.provider.toLowerCase())) {
        maxWeight = 100
      }
    }
    return {
      loading: false,
      form: {
        weight: this.params.data[0].weight,
        port: this.params.data[0].port,
        status: this.params.data[0].status === 'enabled',
      },
      rules: {
        weight: [
          { type: 'integer', required: true, message: this.$t('network.text_177'), trigger: 'blur' },
          { type: 'integer', min: 0, max: maxWeight, message: this.$t('network.text_353', [maxWeight]), trigger: 'blur' },
        ],
        port: [
          { type: 'integer', required: true, message: this.$t('network.text_176'), trigger: 'blur' },
        ],
      },
    }
  },
  computed: {
    maxWeight () {
      const w100Providers = ['aliyun', 'huawei', 'qcloud', 'aws']
      let maxWeight = 256
      const val = this.params.data[0]
      if (val && val.provider) {
        if (w100Providers.includes(val.provider.toLowerCase())) {
          maxWeight = 100
        }
      }
      return maxWeight
    },
  },
  methods: {
    doUpdate (id, values) {
      const data = {}
      if (this.params.updateFields.weight) {
        data.weight = values.weight
      }
      if (this.params.updateFields.port) {
        data.port = values.port
      }
      if (this.params.updateFields.status) {
        data.status = values.status ? 'enabled' : 'disabled'
      }
      return this.params.onManager('update', {
        id,
        managerArgs: {
          data,
        },
        steadyStatus: {
          status: Object.values(expectStatus.lb).flat(),
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doUpdate(this.params.data[0].id, { ...this.form })
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
