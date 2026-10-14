<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_421')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('cloudenv.text_95')" prop="generate_name">
          <a-input v-model:value="form.generate_name" :placeholder="$t('validator.resourceName')" @change="e => { formFi.name = e.target.value }" />
          <name-repeated
            ref="nameRepeated"
            #extra
            res="schedtags"
            :name="formFi.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_413')" prop="default_strategy" required>
          <a-radio-group v-model:value="form.default_strategy">
            <a-radio-button
              v-for="item in strategyOpts"
              :value="item.key"
              :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_384')" prop="resource_type">
          <a-radio-group v-model:value="form.resource_type">
            <a-radio-button
              v-for="item in resourceTypeOpts"
              :value="item.key"
              :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
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
import { STRATEGY_OPT } from '@Cloudenv/constants/sched'
import NameRepeated from '@/sections/NameRepeated'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CreateSchedtagDialog',
  components: {
    NameRepeated,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        generate_name: '',
        description: '',
        default_strategy: '',
        resource_type: 'hosts',
      },
      formFi: {
        name: '',
      },
      rules: {
        generate_name: [
          { required: true, message: this.$t('cloudenv.text_190') },
        ],
      },
      strategyOpts: STRATEGY_OPT,
      resourceTypeOpts: [
        { key: 'hosts', label: this.$t('cloudenv.text_5') },
        { key: 'storages', label: this.$t('cloudenv.text_6') },
        { key: 'networks', label: this.$t('cloudenv.text_7') },
      ],
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
  methods: {
    doCreate (data) {
      return this.params.onManager('create', {
        managerArgs: {
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.cancelDialog()
      } catch (error) {
        // validation or API error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
