<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :model="form"
          :wrapperCol="formItemLayout.wrapperCol"
          :labelCol="formItemLayout.labelCol"
          :names="areaselectsName"
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
import { h } from 'vue'
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import AreaSelects from '@/sections/AreaSelects/model'

export default {
  name: 'AssociateVpcDialog',
  components: {
    AreaSelects,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        cloudregion: undefined,
        vpc: undefined,
      },
      rules: {
        vpc: [
          { required: true, message: this.$t('network.text_274') },
        ],
      },
      areaselectsName: ['cloudregion'],
      regionId: '',
      formItemLayout: {
        wrapperCol: {
          md: { span: 18 },
          xl: { span: 20 },
          xxl: { span: 22 },
        },
        labelCol: {
          md: { span: 6 },
          xl: { span: 4 },
          xxl: { span: 2 },
        },
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope']),
    vpcParams () {
      const params = {
        limit: 0,
        usable_vpc: true,
        scope: this.scope,
        cloudregion_id: this.regionId,
      }
      if (this.params.data[0].manager_id) {
        params.manager_id = this.params.data[0].manager_id
      }
      if (this.isAdminMode) {
        params.project_domain = this.params.data[0].project_domain
        delete params.scope
      }
      if (!this.regionId) return {}
      return params
    },
    cloudregionParams () {
      return {
        scope: this.scope,
        limit: 0,
        usable_vpc: true,
        show_emulated: true,
        provider: this.params.data[0].provider,
      }
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        const ids = this.params.data.map(item => item.id)
        await this.$refs.formRef.validate()
        const vpcManager = new this.$Manager('dns_zones')
        await vpcManager.batchPerformAction({
          ids: ids,
          action: 'add-vpcs',
          data: {
            vpc_ids: [this.form.vpc],
          },
        })
        this.params.refresh && this.params.refresh()
        this.$bus.$emit('DnsZoneListSingleRefresh', [this.params.data[0].id])
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
    handleRegionChange (data) {
      const { cloudregion } = data
      if (cloudregion) {
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
