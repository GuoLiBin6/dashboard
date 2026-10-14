<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('system.text_130', [$t('dictionary.group')])}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="formRules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('system.text_101')" prop="name">
          <a-input v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item v-if="isAdminMode" :label="$t('dictionary.domain')" prop="domain_id">
          <base-select
            v-model:value="form.domain_id"
            resource="domains"
            version="v1"
            remote
            :params="{ enabled: true }"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ mode: 'default' }" />
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
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'GroupCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        description: '',
        domain_id: undefined,
      },
      rules: {
        name: [
          {
            required: true,
            message: this.$t('system.text_194'),
            whitespace: true,
          },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode']),
    formRules () {
      const rules = { ...this.rules }
      if (this.isAdminMode) {
        rules.domain_id = [
          {
            required: true,
            message: this.$t('rules.domain'),
          },
        ]
      }
      return rules
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('groups', 'v1')
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.manager.create({
          data: this.form,
        })
        this.loading = false
        this.params.success()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
