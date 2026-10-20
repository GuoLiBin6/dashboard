<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form"
        :rules="rules">
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :model="form"
          :names="areaselectsName"
          :providerParams="providerParams"
          :cloudregionParams="cloudregionParams"
          :isRequired="true"
          filterBrandResource="network_manage"
          @change="handleRegionChange" />
        <a-form-model-item label="VPC" prop="vpc">
          <base-select
            v-model="form.vpc"
            resource="vpcs"
            :params="vpcParams"
            :isDefaultSelect="true"
            :needParams="true"
            :labelFormat="vpcLabelFormat"
            :select-props="{ placeholder: $t('common_226') }" />
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
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import AreaSelects from '@/sections/AreaSelects/model'

export default {
  name: 'AssociateVpcForVpcNetworkDialog',
  components: {
    AreaSelects,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        provider: undefined,
        cloudregion: undefined,
        vpc: undefined,
      },
      rules: {
        vpc: [
          { required: true, message: this.$t('network.text_274') },
        ],
      },
      areaselectsName: ['provider', 'cloudregion'],
      regionProvider: '',
      regionId: '',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope']),
    curItem () {
      return this.params.data[0]
    },
    vpcParams () {
      const brand = this.curItem.brand
      const params = {
        limit: 0,
        usable_vpc: true,
        scope: this.scope,
        cloudregion_id: this.regionId,
        filter: `provider.in(${brand})`,
        usable_for_inter_vpc_network_id: this.curItem.id,
      }
      if (this.isAdminMode) {
        params.project_domain = this.curItem.project_domain
        delete params.scope
      }
      if (!this.regionId) return {}
      return params
    },
    providerParams () {
      const brand = this.curItem.brand
      return {
        filter: `provider.in(${brand})`,
        scope: this.scope,
        cloud_env: 'public',
      }
    },
    cloudregionParams () {
      return {
        scope: this.scope,
        limit: 0,
        usable_vpc: true,
        show_emulated: true,
      }
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        const ids = this.params.data.map(item => item.id)
        await this.$refs.formRef.validate()
        const vpcManager = new this.$Manager('inter_vpc_networks')
        await vpcManager.batchPerformAction({
          ids: ids,
          action: 'addvpc',
          data: {
            vpc_id: this.form.vpc,
          },
        })
        this.params.refresh && this.params.refresh(2)
        this.$bus.$emit('VpcNetworkListSingleRefresh', [this.params.resData.id])
        this.cancelDialog()
        this.$message.success(this.$t('common.success'))
      } finally {
        this.loading = false
      }
    },
    handleRegionChange (data) {
      const { cloudregion } = data
      if (cloudregion) {
        const { provider } = cloudregion.value || {}
        this.regionProvider = provider
        this.regionId = cloudregion.id
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
  },
}
</script>
