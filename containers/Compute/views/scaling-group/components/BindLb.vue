<template>
  <a-input-group compact>
    <a-form-model-item style="width: 28%" :wrapperCol="{ span: 24 }" prop="loadbalancer_id">
      <a-select class="w-100" v-model:value="model.loadbalancer_id" @change="handleLbChange" :placeholder="$t('compute.text_866')">
        <a-select-option v-for="item in loadbalancerList" :key="item.id" :value="item.id">{{item.name}}</a-select-option>
      </a-select>
      <div slot="extra" style="white-space:nowrap;">{{$t('compute.text_867')}}</div>
    </a-form-model-item>
    <a-form-model-item style="width: 28%" :wrapperCol="{ span: 24 }" prop="lb_backend_group">
      <a-select class="w-100" v-model:value="model.lb_backend_group" :placeholder="$t('compute.text_868')">
        <a-select-option v-for="item in groupList" :key="item.id" :value="item.id">{{item.name}}</a-select-option>
      </a-select>
    </a-form-model-item>
    <a-row style="width: 28%">
      <a-col :span="11" style="text-align: right;">
        <span class="ant-form-item-label">{{$t('compute.text_869')}}</span>
      </a-col>
      <a-col :span="12">
        <a-form-model-item :wrapperCol="{ span: 24 }" prop="loadbalancer_backend_port">
          <a-tooltip :title="$t('compute.text_870')" placement="top">
            <a-input-number class="w-100" :min="1" :max="65535" v-model:value="model.loadbalancer_backend_port" />
          </a-tooltip>
        </a-form-model-item>
      </a-col>
    </a-row>
    <a-row style="width: 15%">
      <a-col :span="10" style="text-align: right;">
        <span class="ant-form-item-label">{{$t('compute.text_871')}}</span>
      </a-col>
      <a-col :span="14">
        <a-form-model-item :wrapperCol="{ span: 24 }" prop="loadbalancer_backend_weight">
          <a-tooltip :title="$t('compute.text_872')" placement="top">
            <a-input-number class="w-100" :min="1" :max="256" v-model:value="model.loadbalancer_backend_weight" />
          </a-tooltip>
        </a-form-model-item>
      </a-col>
    </a-row>
  </a-input-group>
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
        this.groupListLoading = false
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
