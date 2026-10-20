<template>
  <div>
    <page-header :title="$t('common_628', [$t('dictionary.vpc_peer_connect')])" />
    <page-body>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        hideRequiredMark>
        <a-form-model-item :label="$t('common.attribution_scope')" prop="project_domain">
          <domain-select v-model:value="form.project_domain" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('compute.text_210')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_198')" prop="brand">
          <a-select v-model:value="form.brand" @change="handleBrandChange">
            <a-select-option v-for="item in VPC_PEER_BRANDS" :key="item.key">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.request.vpc')" required>
          <a-row :gutter="6">
            <a-col :span="12">
              <a-form-model-item prop="request_cloudregion" class="mb-0 mr-1">
                <a-select
                  v-model:value="form.request_cloudregion"
                  @change="handleRequestRegionChange"
                  :placeholder="$t('network.text_199')"
                  :loading="regionLoading"
                  :disabled="!regionLoaded">
                  <a-select-option v-for="item in regionArr" :value="item.value" :key="item.value">
                    <span class="text-color-secondary option-prefix">{{ $t('network.text_199') }}:</span>
                    {{item.label}}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
            <a-col :span="12">
              <a-form-model-item prop="request_vpc" class="mb-0 mr-1">
                <a-select
                  v-model:value="form.request_vpc"
                  placeholder="VPC"
                  :loading="requestVpcLoading"
                  :disabled="regionLoading || !requestVpcLoaded">
                  <a-select-option v-for="item in requestVpcArr" :value="item.value" :key="item.value">
                    <span class="text-color-secondary option-prefix">VPC:</span>
                    {{item.label}}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.receive.vpc')" required>
          <a-row :gutter="6">
            <a-col :span="12">
              <a-form-model-item prop="receive_cloudregion" class="mb-0 mr-1">
                <a-select
                  v-model:value="form.receive_cloudregion"
                  @change="handleReceiveRegionChange"
                  :placeholder="$t('network.text_199')"
                  :loading="regionLoading"
                  :disabled="!regionLoaded">
                  <a-select-option v-for="item in regionArr" :value="item.value" :key="item.value">
                    <span class="text-color-secondary option-prefix">{{ $t('network.text_199') }}:</span>
                    {{item.label}}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
            <a-col :span="12">
              <a-form-model-item prop="receive_vpc" class="mb-0 mr-1">
                <a-select
                  v-model:value="form.receive_vpc"
                  placeholder="VPC"
                  :loading="receiveVpcLoading"
                  :disabled="regionLoading || !receiveVpcLoaded">
                  <a-select-option v-for="item in receiveVpcArr" :value="item.value" :key="item.value">
                    <span class="text-color-secondary option-prefix">VPC:</span>
                    {{item.label}}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button class="mr-3" type="primary" @click="handleConfirm" :loading="loading">
          {{$t('compute.text_907')}}
        </a-button>
        <a-button @click="handleCancel">{{$t('compute.text_908')}}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import DomainSelect from '@/sections/DomainSelect'
import { Manager } from '@/utils/manager'
import { VPC_PEER_BRANDS } from '../constants'

export default {
  name: 'NetworkVpcPeerConnectCreate',
  components: {
    DomainSelect,
  },
  data () {
    return {
      loading: false,
      regionLoading: false,
      regionLoaded: false,
      requestVpcLoading: false,
      requestVpcLoaded: false,
      receiveVpcLoading: false,
      receiveVpcLoaded: false,
      regionArr: [],
      requestVpcArr: [],
      receiveVpcArr: [],
      VPC_PEER_BRANDS,
      form: {
        project_domain: this.$store.getters.userInfo.projectDomainId,
        name: '',
        brand: VPC_PEER_BRANDS[0].key,
        request_cloudregion: undefined,
        request_vpc: undefined,
        receive_cloudregion: undefined,
        receive_vpc: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_210') },
        ],
        request_cloudregion: [
          { required: true, message: this.$t('network.text_286') },
        ],
        request_vpc: [
          { required: true, message: this.$t('common_226') },
        ],
        receive_cloudregion: [
          { required: true, message: this.$t('network.text_286') },
        ],
        receive_vpc: [
          { required: true, message: this.$t('common_226') },
        ],
      },
    }
  },
  created () {
    this.fetchRegions()
  },
  methods: {
    async fetchRegions (brand = VPC_PEER_BRANDS[0].key) {
      try {
        this.regionLoading = true
        this.regionLoaded = false
        const manager = new this.$Manager('cloudregions')
        const res = await manager.list({
          params: {
            scope: this.$store.getters.scope,
            brand,
          },
        })
        this.regionArr = res.data.data.map((item) => {
          return {
            label: this._$t(item),
            value: item.id,
          }
        })
        if (this.regionArr.length) {
          const defaultValue = this.regionArr[0].value
          this.form.request_cloudregion = defaultValue
          this.form.receive_cloudregion = defaultValue
          this.fetchRequestVpcs(defaultValue)
          this.fetchReceiveVpcs(defaultValue)
        }
        this.regionLoading = false
        this.regionLoaded = true
      } catch (error) {
        this.regionLoading = false
        throw error
      }
    },
    async fetchRequestVpcs (cloudregion) {
      try {
        this.requestVpcLoading = true
        this.requestVpcLoaded = false
        const manager = new this.$Manager('vpcs')
        const res = await manager.list({
          params: {
            $t: uuid(),
            scope: this.$store.getters.scope,
            cloudregion_id: cloudregion,
          },
        })
        this.requestVpcArr = res.data.data.map((item) => {
          return {
            label: item.name,
            value: item.id,
          }
        })
        if (this.requestVpcArr.length) {
          this.form.request_vpc = this.requestVpcArr[0].value
        }
        this.requestVpcLoading = false
        this.requestVpcLoaded = true
      } catch (error) {
        this.requestVpcLoading = false
      }
    },
    async fetchReceiveVpcs (cloudregion) {
      try {
        this.receiveVpcLoading = true
        this.receiveVpcLoaded = false
        const manager = new this.$Manager('vpcs')
        const res = await manager.list({
          params: {
            $t: uuid(),
            scope: this.$store.getters.scope,
            cloudregion_id: cloudregion,
          },
        })
        this.receiveVpcArr = res.data.data.map((item) => {
          return {
            label: item.name,
            value: item.id,
          }
        })
        if (this.receiveVpcArr.length) {
          this.form.receive_vpc = this.receiveVpcArr[0].value
        }
        this.receiveVpcLoading = false
        this.receiveVpcLoaded = true
      } catch (error) {
        this.receiveVpcLoading = false
      }
    },
    handleRequestRegionChange (v) {
      this.fetchRequestVpcs(v)
    },
    handleReceiveRegionChange (v) {
      this.fetchReceiveVpcs(v)
    },
    handleBrandChange (v) {
      this.resetVpc()
      this.fetchRegions(v)
    },
    resetVpc () {
      this.form.request_cloudregion = undefined
      this.form.receive_cloudregion = undefined
      this.form.request_vpc = undefined
      this.form.receive_vpc = undefined
      this.regionArr = []
      this.requestVpcArr = []
      this.receiveVpcArr = []
    },
    async doSubmit (data) {
      const params = {
        generate_name: data.name,
        vpc_id: data.request_vpc,
        peer_vpc_id: data.receive_vpc,
      }
      const manager = new Manager('vpc_peering_connections')
      return manager.create({
        data: params,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doSubmit(this.form)
        this.loading = false
        this.$message.success(this.$t('common.success'))
        this.goBack()
      } catch (error) {
        this.loading = false
      }
    },
    handleCancel () {
      this.goBack()
    },
    goBack () {
      this.$router.push({
        name: 'VpcPeerConnect',
      })
    },
  },
}
</script>

<style>

</style>
