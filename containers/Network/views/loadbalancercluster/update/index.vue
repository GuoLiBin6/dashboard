<template>
  <a-spin :spinning="loading">
    <page-header :title="$t('network.update_cluster')" />
    <page-body>
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input :disabled="!!lbAgentId" v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_83')" prop="preempt" :extra="$t('network.text_84')">
          <a-switch v-model:checked="form.preempt" :checkedChildren="$t('network.text_85')" :unCheckedChildren="$t('network.text_86')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_87')" prop="virtual_router_id" :extra="$t('network.text_88')">
          <a-input-number v-model:value="form.virtual_router_id" :max="255" :min="1" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_92')" prop="advert_int" :extra="$t('network.text_93')">
          <a-input v-model:value="form.advert_int" type="number" :addonAfter="$t('network.text_76')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_95')" prop="pass" :extra="$t('network.text_96')">
          <a-input v-model:value="form.pass" />
        </a-form-model-item>
        <a-form-model-item v-if="!lbAgentId" :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag :value="form.__meta__" @change="v => form.__meta__ = v" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <template v-slot:right>
        <a-button type="primary" :loading="submiting" @click="handleSubmit">{{ $t('common.ok') }}</a-button>
        <a-button class="ml-2" @click="handleCancel">{{ $t('dialog.cancel') }}</a-button>
      </template>
    </page-footer>
  </a-spin>
</template>
<script>
import workflowMixin from '@/mixins/workflow'
import WindowsMixin from '@/mixins/windows'
import Tag from '@/sections/Tag'
import validateForm from '@/utils/validate'

export default {
  name: 'LBClusterCreate',
  components: {
    Tag,
  },
  mixins: [WindowsMixin, workflowMixin],
  data () {
    return {
      loading: false,
      submiting: false,
      form: {
        name: '',
        description: '',
        preempt: false,
        virtual_router_id: 1,
        advert_int: 1,
        pass: '',
        __meta__: {},
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('resourceName') },
        ],
        virtual_router_id: [
          { required: true, message: this.$t('network.text_118') },
        ],
        preempt: [
          { required: true, message: this.$t('network.text_120') },
        ],
        advert_int: [
          { required: true, message: this.$t('network.text_121') },
          { type: 'integer', min: 1, max: 255, message: this.$t('network.text_122'), trigger: 'blur' },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 14 },
          xl: { span: 16 },
          xxl: { span: 20 },
        },
        labelCol: {
          md: { span: 10 },
          xl: { span: 8 },
          xxl: { span: 4 },
        },
      },
    }
  },
  computed: {
    clusterId () {
      return this.$route.query.id
    },
  },
  created () {
    this.manager = new this.$Manager('loadbalancerclusters')
    this.getFetchLbCluster()
  },
  methods: {
    setValues (data) {
      if (!data || !Object.keys(data).length || !data.params) return false
      const params = {
        ...data.params,
      }
      Object.assign(this.form, {
        name: data.name,
        description: data.description,
        ...params,
      })
    },
    formatValues (values) {
      const { name, description, __meta__, ...params } = values
      return {
        name,
        description,
        ...params,
      }
    },
    doUpdate (values) {
      return this.manager.performAction({
        action: 'params-patch',
        id: this.clusterId,
        data: this.formatValues(values),
      })
    },
    async getFetchLbCluster () {
      const { id } = this.$route.query
      try {
        const { data = {} } = await this.manager.get(({
          id,
        }))
        this.setValues(data)
      } catch (err) {
        throw err
      }
    },
    async handleSubmit () {
      this.submiting = true
      try {
        await this.$refs.formRef.validate()
        await this.doUpdate(this.form)
        this.$store.commit('keepAlive/ADD_DELAY_EVENT', { name: 'ResourceListSingleRefresh', params: this.clusterId })
        this.handleCancel()
      } catch (error) {
        throw error
      } finally {
        this.submiting = false
      }
    },
    handleCancel () {
      this.$router.push('/cluster')
    },
  },
}
</script>
