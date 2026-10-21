<template>
  <!-- antdv4 下 a-input-group compact + 嵌套 Form.Item 会错位，改为 flex 排布 -->
  <div class="bind-lb">
    <div class="bind-lb__row">
      <a-form-model-item class="bind-lb__item" prop="loadbalancer_id">
        <a-select
          class="w-100"
          v-model:value="model.loadbalancer_id"
          :loading="loadbalancerListLoading"
          :placeholder="$t('compute.text_866')"
          @change="handleLbChange">
          <a-select-option v-for="item in loadbalancerList" :key="item.id" :value="item.id" :label="item.name">
            {{ item.name }}
          </a-select-option>
        </a-select>
        <template #extra>
          <span class="bind-lb__extra">{{ $t('compute.text_867') }}</span>
        </template>
      </a-form-model-item>
      <a-form-model-item class="bind-lb__item" prop="lb_backend_group">
        <a-select
          class="w-100"
          v-model:value="model.lb_backend_group"
          :loading="groupListLoading"
          :placeholder="$t('compute.text_868')">
          <a-select-option v-for="item in groupList" :key="item.id" :value="item.id" :label="item.name">
            {{ item.name }}
          </a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item class="bind-lb__item bind-lb__item--num" prop="loadbalancer_backend_port">
        <div class="bind-lb__num">
          <span class="bind-lb__num-label">{{ $t('compute.text_869') }}</span>
          <a-tooltip :title="$t('compute.text_870')" placement="top">
            <a-input-number
              class="bind-lb__num-input"
              :min="1"
              :max="65535"
              v-model:value="model.loadbalancer_backend_port" />
          </a-tooltip>
        </div>
      </a-form-model-item>
      <a-form-model-item class="bind-lb__item bind-lb__item--num" prop="loadbalancer_backend_weight">
        <div class="bind-lb__num">
          <span class="bind-lb__num-label">{{ $t('compute.text_871') }}</span>
          <a-tooltip :title="$t('compute.text_872')" placement="top">
            <a-input-number
              class="bind-lb__num-input"
              :min="1"
              :max="256"
              v-model:value="model.loadbalancer_backend_weight" />
          </a-tooltip>
        </div>
      </a-form-model-item>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BindLb',
  props: {
    /** end-state：写 form.fd LB 字段 */
    model: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      loadbalancerListLoading: false,
      loadbalancerList: [],
      groupListLoading: false,
      groupList: [],
    }
  },
  created () {
    if (this.model.loadbalancer_backend_weight === undefined) {
      this.$set(this.model, 'loadbalancer_backend_weight', 50)
    }
  },
  methods: {
    handleLbChange (id) {
      this.fetchQueyrGroups(id)
    },
    async fetchQueryLbs (vpc) {
      if (!vpc) {
        this.loadbalancerList = []
        this.groupList = []
        this.$set(this.model, 'loadbalancer_id', undefined)
        this.$set(this.model, 'lb_backend_group', undefined)
        return false
      }
      const manager = new this.$Manager('loadbalancers')
      this.loadbalancerListLoading = true
      try {
        const { data } = await manager.list({
          params: {
            limit: 0,
            vpc,
            status: 'enabled',
            scope: this.$store.getters.scope,
          },
        })
        this.loadbalancerList = data.data || []
      } catch (err) {
        throw err
      } finally {
        this.loadbalancerListLoading = false
        const list = this.loadbalancerList
        const id = (list && list.length > 0) ? list[0].id : undefined
        this.$set(this.model, 'loadbalancer_id', id)
        this.$nextTick(() => {
          if (id) {
            this.fetchQueyrGroups(id)
          }
        })
      }
    },
    async fetchQueyrGroups (loadbalancer) {
      const manager = new this.$Manager('loadbalancerbackendgroups')
      try {
        this.groupListLoading = true
        const { data } = await manager.list({
          params: {
            limit: 0,
            loadbalancer,
          },
        })
        this.groupList = data.data || []
      } catch (err) {
        throw err
      } finally {
        this.groupListLoading = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
.bind-lb {
  width: 100%;
  max-width: 960px;
}
.bind-lb__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 16px;
}
.bind-lb__item {
  flex: 1 1 200px;
  min-width: 180px;
  margin-bottom: 0 !important;
}
.bind-lb__item--num {
  flex: 0 0 auto;
  min-width: 0;
}
.bind-lb__num {
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.bind-lb__num-label {
  flex: 0 0 auto;
  color: rgba(0, 0, 0, 0.85);
  margin-right: 8px;
}
.bind-lb__num-input {
  width: 110px !important;
}
.bind-lb__extra {
  white-space: nowrap;
}
</style>
