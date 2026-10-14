<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])" class="mt-3">
          <domain-project :form="form" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_317')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item prop="certificate">
          <span slot="label">{{$t('network.text_322')}}<a-tooltip>
              <div slot="title">{{$t('network.text_323')}}<br />{{$t('network.text_324')}}<br />{{$t('network.text_325')}}</div>
              <icon type="info-circle" />
            </a-tooltip>
          </span>
          <a-textarea
            v-model:value="form.certificate"
            :placeholder="$t('network.text_326')"
            rows="4" />
        </a-form-model-item>
        <a-form-model-item prop="private_key">
          <span slot="label">{{$t('network.text_327')}}<a-tooltip>
              <div slot="title">{{$t('network.text_328')}}<br />{{$t('network.text_324')}}<br />{{$t('network.text_325')}}</div>
              <icon type="info-circle" />
            </a-tooltip>
          </span>
          <a-textarea
            v-model:value="form.private_key"
            :placeholder="$t('network.text_329')"
            rows="4" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag
            :value="form.__meta__"
            @change="v => form.__meta__ = v"
            :allowNoValue="false" />
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
import validateForm, { isRequired } from '@/utils/validate'
import DomainProject from '@/sections/DomainProject/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import Tag from '@/sections/Tag'

export default {
  name: 'LbcertsCreateDialog',
  components: {
    DomainProject,
    Tag,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        domain: undefined,
        project: undefined,
        name: undefined,
        description: undefined,
        certificate: undefined,
        private_key: undefined,
        __meta__: {},
      },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('certName') },
        ],
        certificate: [
          { required: true, message: this.$t('network.text_330') },
        ],
        private_key: [
          { required: true, message: this.$t('network.text_331') },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 18,
        },
        labelCol: {
          span: 6,
        },
      },
    }
  },
  methods: {
    doCreate (data) {
      data.project_id = data.project.key
      delete data.domain
      delete data.project
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
        await this.doCreate({ ...this.form })
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
