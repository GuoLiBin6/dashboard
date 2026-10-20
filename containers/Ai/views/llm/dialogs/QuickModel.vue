<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="instanceLabel" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('aice.model')" prop="model">
          <base-select v-model:value="form.model" :options="modelOptions" :select-props="{ placeholder: $t('common.tips.select', [$t('aice.model')]) }" />
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
import { parseLlmRoute } from '@Ai/utils/llmRouteContext'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'LlmQuickModelDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      ...(() => {
        const ctx = parseLlmRoute(this.$route.path)
        return { isApplyType: ctx.isApplyType, isDesktopType: ctx.isDesktopType }
      })(),
      loading: false,
      action: this.params.actionText,
      form: {
        model: [],
      },
      rules: {
        model: [
          { required: true, message: this.$t('common.tips.select', [this.$t('aice.model')]) },
        ],
      },
      modelOptions: [],
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    instanceLabel () {
      if (this.isDesktopType) return this.$t('aice.desktop_llm')
      if (this.isApplyType) return this.$t('aice.app_llm')
      return this.$t('aice.llm')
    },
    columns () {
      const showFields = ['name', 'phone_ip', 'phone_image', 'phone_model']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  created () {
    this.$hM = new this.$Manager('llms')
    this.queryModels()
  },
  methods: {
    async queryModels () {
      const response = await new this.$Manager(`llms/${this.params.data[0].id}/probed-models`, 'v2').list({
        params: {
          scope: this.$store.getters.scope,
        },
      })
      const { data } = response
      const keys = Object.keys(data)
      this.modelOptions = keys.map(key => {
        return {
          id: data[key].model_id,
          ...data[key],
        }
      })
    },
    async doSubmit () {
      const data = { method: 'install' }
      data.model = this.form.model
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        managerArgs: {
          action: 'quick-models',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doSubmit()
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
