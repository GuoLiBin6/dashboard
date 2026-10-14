<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('storage.text_238')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('storage.text_239')" prop="Effect">
          <a-radio-group v-model:value="form.Effect">
            <a-radio-button value="Allow">{{$t('storage.text_217')}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_240')" required>
          <a-row>
            <a-col :span="11" class="mr-1">
              <a-form-model-item class="mb-0" prop="PrincipalType">
                <a-select v-model:value="form.PrincipalType" @change="handleTypeChange">
                  <a-select-option value="root">{{$t('storage.text_241')}}</a-select-option>
                  <a-select-option value="child">{{$t('storage.text_242')}}</a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
            <a-col :span="12">
              <a-form-model-item class="mb-0" prop="PrincipalId">
                <a-input v-if="isRoot" v-model:value="form.PrincipalId" :placeholder="$t('storage.text_243_1')" />
                <base-select
                  v-else
                  v-model:value="form.PrincipalId"
                  class="w-100"
                  :remote="true"
                  needParams
                  resource="cloudusers"
                  version="v1"
                  idKey="external_id"
                  :params="principalParams"
                  :select-props="{ placeholder: $t('storage.text_243'), allowClear: true,  mode: 'multiple' }" />
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_244')" prop="resource">
          <a-radio-group v-model:value="form.resource" @change="handleResourceTypeChange">
            <a-radio value="entirebucket">{{$t('storage.text_245')}}</a-radio>
            <a-radio value="designatedResource">{{$t('storage.text_246')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_247')" prop="ResourcePath">
          <div class="d-flex">
            <div>
              {{ params.bucketData.name }}/
            </div>
            <div class="flex-grow-1">
              <a-textarea :disabled="isEntirebucket" v-model:value="form.ResourcePath" :placeholder="$t('storage.text_250')" :auto-size="{ minRows: 3, maxRows: 5 }" />
            </div>
          </div>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_251')" prop="CannedAction">
          <a-radio-group v-model:value="form.CannedAction">
            <a-radio-button value="Read">{{$t('storage.text_252')}}</a-radio-button>
            <a-radio-button value="ReadWrite">{{$t('storage.text_253')}}</a-radio-button>
            <a-radio-button value="FullControl">{{$t('storage.text_254')}}</a-radio-button>
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
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CreatePolicyDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        Effect: 'Allow',
        PrincipalType: 'child',
        PrincipalId: undefined,
        resource: 'entirebucket',
        ResourcePath: '*',
        CannedAction: 'Read',
      },
      rules: {
        PrincipalId: [
          { validator: this.validatePrincipalId },
        ],
        ResourcePath: [
          { required: true, message: this.$t('storage.text_256') },
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
      principalParams: {
        scope: this.$store.getters.scope,
        show_fail_reason: true,
        details: true,
        cloudaccount: this.params.bucketData.account_id,
        limit: 20,
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    isRoot () {
      return this.form.PrincipalType === 'root'
    },
    isEntirebucket () {
      return this.form.resource === 'entirebucket'
    },
  },
  methods: {
    handleTypeChange (value) {
      this.form.PrincipalId = undefined
      this.$refs.formRef.clearValidate(['PrincipalId'])
    },
    handleResourceTypeChange (e) {
      if (e.target.value === 'entirebucket') {
        this.form.ResourcePath = '*'
      } else {
        this.form.ResourcePath = ''
      }
    },
    genData (data) {
      const { Effect, CannedAction } = data
      const ret = {
        Effect,
        CannedAction,
      }
      if (data.PrincipalType === 'child') {
        ret.PrincipalId = data.PrincipalId.map(item => {
          return ':' + item
        })
      } else {
        ret.PrincipalId = data.PrincipalId + ':'
      }
      ret.ResourcePath = data.ResourcePath.trim().split('\n')
      ret.ResourcePath = ret.ResourcePath.map(item => '/' + item)
      return ret
    },
    doCreate (data) {
      return new this.$Manager('buckets').performAction({
        id: this.params.bucketID,
        action: 'set-policy',
        data: data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const data = this.genData(this.form)
        await this.doCreate(data)
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
    validatePrincipalId (rule, value, callback) {
      if (this.form.PrincipalType === 'child') {
        if (!value || (Array.isArray(value) && !value.length)) {
          callback(new Error(this.$t('storage.text_255')))
        } else {
          callback()
        }
        return
      }
      if (!value) {
        callback(new Error(this.$t('storage.text_255')))
        return
      }
      if (/^[0-9]*$/.test(value)) {
        callback()
      } else {
        callback(new Error(this.$t('storage.number_validate')))
      }
    },
  },
}
</script>
