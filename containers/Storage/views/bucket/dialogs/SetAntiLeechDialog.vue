<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('storage.text_205')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="params.name" :count="params.data.length" :action="$t('storage.text_205')" />
      <dialog-table class="mb-2" :data="params.data" :columns="[params.columns[0], params.columns[7], params.columns[9]]" />
      <a-form-model
        v-bind="formItemLayout"
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('storage.text_214')" prop="enabled">
          <a-tooltip>
            <template v-if="refererDisabled" slot="title">
              {{$t('storage.text_68')}}
            </template>
            <a-switch v-model:checked="form.enabled" :disabled="refererDisabled" :checked-children="$t('storage.text_215')" :un-checked-children="$t('storage.text_216')" @change="handleEnabledChange" />
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_208')" :extra="$t('storage.text_209')" v-if="form.enabled" prop="allow_empty_refer">
          <a-switch v-model:checked="form.allow_empty_refer" :checked-children="$t('storage.text_184')" :un-checked-children="$t('storage.text_185')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_86')" v-if="form.enabled" prop="referer_type">
          <a-tooltip>
            <template v-if="refererDisabled" slot="title">
              {{$t('storage.text_68')}}
            </template>
            <a-radio-group v-model:value="form.referer_type" :disabled="refererDisabled">
              <a-radio value="White-List">{{$t('storage.text_206')}}</a-radio>
              <a-radio value="Black-List">{{$t('storage.black_list')}}</a-radio>
            </a-radio-group>
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_219')" v-if="form.enabled" prop="domain_list">
          <a-textarea
            v-model:value="form.domain_list"
            :placeholder="$t('storage.text_207')"
            :auto-size="{ minRows: 3, maxRows: 5 }" />
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
import { HYPERVISORS_MAP } from '@/constants'

export default {
  name: 'SetAntiLeechDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const referer_enabled = this.params.data[0].referer?.enabled || false
    const isDomainListRequired = (this.params.data[0].provider === 'Qcloud')
    return {
      loading: false,
      form: {
        enabled: referer_enabled,
        allow_empty_refer: this.params.data[0].referer?.allow_empty_refer || false,
        referer_type: this.params.data[0].referer?.referer_type || 'White-List',
        domain_list: this.params.data[0].referer?.domain_list ? this.params.data[0].referer.domain_list.join('\n') : '',
      },
      init_referer_enabled: referer_enabled,
      rules: {
        domain_list: [
          { required: isDomainListRequired, message: this.$t('storage.bucket.referer.domain_list.tooltip') },
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
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    refererDisabled () {
      const { brand } = this.params.data[0]
      if (brand === HYPERVISORS_MAP.aliyun.provider && this.init_referer_enabled) {
        return true
      }
      return false
    },
  },
  methods: {
    handleEnabledChange (val) {
      this.form.enabled = val
    },
    doSet (data) {
      return this.params.onManager('performAction', {
        id: this.params.data[0].id,
        managerArgs: {
          action: 'set-referer',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (values.domain_list && values.domain_list.length > 0) {
          const domains = []
          values.domain_list.split('\n').forEach((domain) => {
            domains.push(domain.trim())
          })
          values.domain_list = domains
        }
        await this.doSet(values)
        this.loading = false
        this.cancelDialog()
        this.params.success()
        this.params.refresh()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
