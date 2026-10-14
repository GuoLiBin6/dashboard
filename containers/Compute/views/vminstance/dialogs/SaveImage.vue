<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1236')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning" v-if="isPublic">
        <template #message>
          {{ $t('compute.save_image_prompt.public_cloud', [$t('common.public_cloud_customized_image')]) }}
        </template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1236')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_1237')" prop="type" v-if="isKvm">
          <a-radio-group v-model:value="form.type">
            <a-radio-button :value="types.system.key">{{ types.system.label }}</a-radio-button>
            <a-radio-button :value="types.host.key">{{ types.host.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_228')" prop="generate_name">
          <a-input v-model:value="form.generate_name" :placeholder="$t('validator.imageName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_494')" prop="auto_start">
          <a-switch v-model:checked="form.auto_start" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
          <template v-slot:extra>
            <div>{{$t('compute.text_1238')}}</div>
            <div v-if="form.type === types.host.key" class="mt-2">{{$t('compute.text_1239', [ diskCount ])}}</div>
          </template>
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
import * as R from 'ramda'
import { SERVER_TYPE } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { findPlatform } from '@/utils/common/hypervisor'
import { HYPERVISORS_MAP, EXTRA_HYPERVISORS } from '@/constants'
const hypervisorMap = Object.assign({}, HYPERVISORS_MAP, EXTRA_HYPERVISORS)

export default {
  name: 'VmSaveImageDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const types = {
      host: {
        key: 'host',
        label: this.$t('compute.text_1240'),
      },
      system: {
        key: 'system',
        label: this.$t('compute.text_1241'),
      },
    }
    return {
      loading: false,
      types,
      form: {
        type: types.system.key,
        generate_name: '',
        auto_start: true,
      },
      rules: {
        generate_name: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: this.$validate('imageName') },
          { validator: this.checkTemplateName },
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
    isKvm () {
      return this.params.data[0].hypervisor === hypervisorMap.kvm.key
    },
    isPublic () {
      const noSupportBrand = [
        hypervisorMap.ctyun.brand,
      ]
      return (findPlatform(this.params.data[0].hypervisor) === SERVER_TYPE.public && !noSupportBrand.includes(this.params.data[0].brand))
    },
    diskCount () {
      return this.params.data[0].disk_count
    },
  },
  methods: {
    checkTemplateName (rule, value, callback) {
      if (!value) {
        return callback(new Error(this.$t('compute.text_660')))
      }
      return new this.$Manager('images', 'v1').list({
        params: {
          name: value,
          scope: this.$store.getters.scope,
        },
      }).then(res => {
        const data = res.data.data
        if (!R.isNil(data) && !R.isEmpty(data)) {
          callback(new Error(this.$t('compute.text_662')))
        } else {
          callback()
        }
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        const action = this.form.type === this.types.host.key ? 'save-guest-image' : 'save-image'
        const data = {
          id: ids,
          is_public: false,
          name: this.form.generate_name,
          generate_name: this.form.generate_name,
          auto_start: this.form.auto_start,
        }
        await this.params.onManager('batchPerformAction', {
          id: ids,
          steadyStatus: ['running', 'ready'],
          managerArgs: {
            action,
            data,
          },
        })
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
