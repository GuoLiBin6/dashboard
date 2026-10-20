<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('network.ssh-proxy-match.link.create') }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :model="form"
          :names="['provider', 'cloudregion']"
          :cloudregionParams="regionParams"
          :providerParams="providerParams"
          :isRequired="false"
          filterBrandResource="compute_engine"
          @change="handleRegionChange" />
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_44')" @update:value="handleNameChange" />
          <template #extra>
            <name-repeated res="proxy_matches" :name="name" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_277')" prop="match_scope">
          <a-radio-group v-model:value="form.match_scope" @change="handleScopeChange">
            <a-radio-button value="vpc" key="vpc">
              {{ $t('dictionary.vpc') }}
            </a-radio-button>
            <a-radio-button value="network" key="network">
              {{ $t('compute.text_106') }}
            </a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="VPC" prop="vpc">
          <base-select
            v-model="form.vpc"
            resource="vpcs"
            @change="handleVpcChange"
            :params="vpcParams"
            :isDefaultSelect="true"
            :needParams="true"
            :labelFormat="vpcLabelFormat"
            :select-props="{ placeholder: $t('common_226') }" />
        </a-form-model-item>
        <a-form-model-item v-if="showNetworks" :label="$t('compute.text_106')" prop="network">
          <base-select
            v-model="form.network"
            resource="networks"
            need-params
            filterable
            :isDefaultSelect="true"
            :params="networkParams"
            :select-props="{ placeholder: $t('network.text_212') }" />
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
import _ from 'lodash'
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import { h } from 'vue'
import NameRepeated from '@/sections/NameRepeated'
import AreaSelects from '@/sections/AreaSelects/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'SshProxyMatchLinkDialog',
  components: {
    AreaSelects,
    NameRepeated,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    this.handleNameChange = _.debounce(this._handleNameChange, 500)
    return {
      loading: false,
      manager: new this.$Manager('proxy_matches'),
      showNetworks: false,
      form: {
        provider: undefined,
        cloudregion: undefined,
        name: '',
        match_scope: 'vpc',
        vpc: '',
        network: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('resourceCreateName') },
        ],
        match_scope: [
          { required: true, message: this.$t('network.text_343') },
        ],
        vpc: [
          { required: true, message: this.$t('network.text_274') },
        ],
        network: [
          { required: true, message: this.$t('network.text_212') },
        ],
      },
      scope: this.$store.getters.scope,
      name: '',
      regionId: '',
      vpcId: '',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'userInfo']),
    regionParams () {
      return {
        usable: true,
        show_emulated: true,
        scope: this.scope,
      }
    },
    providerParams () {
      return {
        scope: this.scope,
      }
    },
    vpcParams () {
      const params = {
        limit: 0,
        usable_vpc: true,
        scope: this.scope,
      }

      if (this.regionId) params.cloudregion_id = this.regionId
      if (!this.regionId) return {}
      return params
    },
    networkParams () {
      const params = { scope: this.scope, usable: true, limit: 0 }
      if (this.vpcId) {
        params.vpc = this.vpcId
      }
      return params
    },
  },
  methods: {
    _handleNameChange (val) {
      this.name = val
    },
    handleScopeChange (e) {
      this.showNetworks = (e?.target?.value ?? e) === 'network'
    },
    handleVpcChange (e) {
      this.vpcId = e
    },
    handleRegionChange (data) {
      if (!R.isEmpty(data.cloudregion) && !R.isNil(data.cloudregion)) {
        this.regionId = data.cloudregion.id
      }
    },
    vpcLabelFormat (item) {
      if (item.manager) {
        if (item.cidr_block) {
          return h('div', {}, [
            h('span', { class: 'text-color-secondary' }, 'VPC:'),
            ` ${item.name} `,
            h('span', {}, `（${item.cidr_block}）`),
            h('span', { class: 'ml-2 text-color-secondary' }, `${this.$t('common_711')}: ${item.manager}`),
          ])
        }
        return h('div', {}, [
          h('span', { class: 'text-color-secondary' }, 'VPC:'),
          ` ${item.name} `,
          h('span', { class: 'ml-2 text-color-secondary' }, `${this.$t('common_711')}: ${item.manager}`),
        ])
      }
      return h('div', {}, String(item.name || ''))
    },
    doCreate (data) {
      return this.manager.create({
        data: {
          generate_name: data.name,
          proxy_endpoint: this.params.proxy_endpoint_id,
          match_scope: data.match_scope,
          match_value: data.match_scope === 'vpc' ? data.vpc : data.network,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.loading = false
        if (this.params.list && typeof this.params.list.fetchData === 'function') {
          this.params.list.fetchData()
        }
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
