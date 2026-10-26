<template>
  <!-- oc-layout-form-off：内层 vertical 子表单勿吃外层 label 宽；空 label 勿用 ''（会触发 follow-label 缩进） -->
  <div class="oc-layout-form-off role-rule-form-item">
    <a-form-model ref="formRef" :model="formModel" :rules="rules" layout="vertical">
      <div class="d-flex align-items-start role-rule-row" v-for="(item, i) in resourceList" :key="item.key">
        <a-form-model-item
          class="mr-2 mb-0"
          :label="i === 0 ? $t('k8s.text_64') : undefined"
          :required="i === 0 ? undefined : false"
          :prop="`resource_${item.key}`">
          <base-select
            style="width: 300px"
            v-model:value="formModel[`resource_${item.key}`]"
            :options="resourceOpts"
            filterable
            @update:item="val => syncItem(val, item)"
            :select-props="{ placeholder: $t('k8s.text_380') }" />
        </a-form-model-item>
        <a-form-model-item
          class="verbs-item mb-0"
          style="min-width: 200px;"
          :label="i === 0 ? $t('k8s.text_381') : undefined"
          :required="i === 0 ? undefined : false"
          :prop="`verbs_${item.key}`">
          <div v-if="!item.verbs.length" class="no-verbs-tip">{{$t('k8s.text_382')}}</div>
          <a-checkbox-group v-else v-model:value="formModel[`verbs_${item.key}`]" name="checkboxgroup" :options="item.verbs" />
        </a-form-model-item>
        <a-button
          shape="circle"
          icon="minus"
          size="small"
          class="role-rule-row__remove"
          :class="{ 'role-rule-row__remove--first': i === 0 }"
          @click="decrease(i)" />
      </div>
      <div class="d-flex align-items-center mt-2">
        <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
        <a-button type="link" @click="add">{{$t('k8s.text_383')}}</a-button>
      </div>
    </a-form-model>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'

export default {
  name: 'RoleRuleFormItem',
  props: {
    clusterId: {
      type: String,
    },
    isNamespace: {
      type: Boolean,
      default: false,
    },
    federatedResource: {
      type: String,
    },
  },
  data () {
    return {
      formModel: {},
      rules: {},
      resourceList: [],
      resourceOpts: [],
    }
  },
  watch: {
    clusterId () {
      this.fetchData()
    },
  },
  created () {
    if (this.federatedResource) {
      this.fetchFederatedData()
    } else {
      this.fetchData()
    }
  },
  methods: {
    fieldRules (itemKey) {
      return {
        [`resource_${itemKey}`]: [
          { required: true, message: this.$t('k8s.text_380') },
        ],
        [`verbs_${itemKey}`]: [
          { required: true, message: this.$t('k8s.text_384'), type: 'array' },
        ],
      }
    },
    registerItem (itemKey) {
      this.formModel[`resource_${itemKey}`] = undefined
      this.formModel[`verbs_${itemKey}`] = []
      Object.assign(this.rules, this.fieldRules(itemKey))
    },
    unregisterItem (itemKey) {
      delete this.formModel[`resource_${itemKey}`]
      delete this.formModel[`verbs_${itemKey}`]
      delete this.rules[`resource_${itemKey}`]
      delete this.rules[`verbs_${itemKey}`]
    },
    syncItem (val, item) {
      item.verbs = val.verbs
      this.formModel[`verbs_${item.key}`] = []
    },
    async fetchFederatedData () {
      try {
        const { data = [] } = await new this.$Manager(this.federatedResource, 'v1').get({ id: 'api-resources', params: { scope: this.$store.getters.scope } })
        this.getResourceOpts(data)
      } catch (error) {
        throw error
      }
    },
    async fetchData () {
      try {
        if (!this.clusterId) return
        const { data = [] } = await new this.$Manager('kubeclusters', 'v1').getSpecific({ id: this.clusterId, spec: 'api-resources', params: { scope: this.$store.getters.scope } })
        this.getResourceOpts(data)
      } catch (error) {
        throw error
      }
    },
    getResourceOpts (data) {
      if (this.isNamespace) data = data.filter(val => val.apiResource.namespaced)
      data = data.map(val => {
        let label = val.apiResource.name
        if (val.apiGroup) label = `${val.apiGroup} / ${label}`
        return {
          key: `${val.apiGroup} / ${val.apiResource.name}`,
          label,
          verbs: val.apiResource.verbs,
        }
      })
      this.resourceOpts = data
    },
    async validateForm () {
      try {
        await this.$refs.formRef.validate()
        const data = {
          rules: [],
        }
        this.resourceList.forEach(item => {
          const value = this.formModel[`resource_${item.key}`]
          const [apiGroup, resouce] = value.split(' / ')
          data.rules.push({
            apiGroups: [apiGroup],
            resources: [resouce],
            verbs: this.formModel[`verbs_${item.key}`],
          })
        })
        return data
      } catch (error) {
        throw error
      }
    },
    decrease (i) {
      const item = this.resourceList[i]
      this.unregisterItem(item.key)
      this.resourceList.splice(i, 1)
    },
    add () {
      const key = uuid()
      this.resourceList.push({
        key,
        verbs: [],
      })
      this.registerItem(key)
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../../src/styles/less/theme';

.role-rule-row {
  & + & {
    margin-top: 8px;
  }
  &__remove {
    margin-top: 6px;
    flex-shrink: 0;
    &--first {
      /* 与首行 vertical label 下的控件对齐 */
      margin-top: 36px;
    }
  }
}
.verbs-item {
  :deep(.ant-form-item-control) {
    .no-verbs-tip {
      font-size: 12px;
      color: @text-color-secondary;
      line-height: 32px;
    }
  }
}
</style>
