<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.image_cache.perform_precache')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('compute.text_176')" prop="platform">
          <a-select
            v-model:value="form.platform"
            @change="handlePlatformChange"
            :placeholder="$t('compute.text_219')"
            allowClear>
            <a-select-option
              v-for="(item, index) in platformOptions"
              :key="index"
              :value="item.name">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <template v-if="params.title === 'onpremise'">
          <a-form-model-item :label="$t('compute.text_111')" prop="host">
            <base-select
              :remote="true"
              class="w-100"
              :needParams="true"
              v-model:value="form.host"
              resource="hosts"
              :params="hostParams"
              :remote-fn="q => ({ filter: `name.contains(${q})` })"
              @change="handleHostChange"
              :select-props="{ placeholder: $t('compute.text_314'), allowClear: true }" />
          </a-form-model-item>
        </template>
        <a-form-model-item :label="$t('compute.text_653')" v-if="params.title !== 'onpremise'" prop="manager">
          <base-select
            :remote="true"
            class="w-100"
            :needParams="true"
            v-model:value="form.manager"
            resource="cloudproviders"
            :params="providerParams"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            @change="handleManagerChange"
            :select-props="{ placeholder: $t('compute.text_219') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_177')" v-if="params.title !== 'onpremise'" prop="region">
          <base-select
            :remote="true"
            class="w-100"
            :needParams="true"
            v-model:value="form.region"
            resource="cloudregions"
            :params="regionParams"
            :remote-fn="q => ({ search: q })"
            @change="handleRegionChange"
            :select-props="{ placeholder: $t('compute.text_219') }" />
        </a-form-model-item>
      </a-form-model>
      <div class="d-flex flex-fill mb-2">
        <!-- 刷新 -->
        <a-button
          class="flex-shrink-0"
          :disabled="loading"
          @click="handleRefresh">
          <icon v-if="loading" type="sync" spin />
          <icon v-else type="sync" />
        </a-button>
      </div>
      <page-list
        :list="list"
        :pagerLayout="['PrevPage', 'Jump', 'PageCount', 'NextPage', 'Total']"
        :columns="cacheColumns"
        :show-group-actions="false"
        :group-actions="[{}]"
        :enableVirtualScroll="false" />
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { sizestr } from '@/utils/utils'
import { BRAND_MAP } from '@/constants'

export default {
  name: 'ImageCreateCache',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        platform: undefined,
        manager: undefined,
        region: undefined,
        host: undefined,
      },
      platformOptions: [],
      regionParams: {
        cloud_env: this.params.title,
        scope: this.$store.getters.scope,
      },
      providerParams: {
        cloud_env: this.params.title,
        scope: this.$store.getters.scope,
      },
      hostParams: {
        'filter.0': 'host_type.notequals(baremetal)',
        show_emulated: true,
        usable: true,
        cloud_env: this.params.title,
        show_fail_reason: true,
        scope: this.$store.getters.scope,
      },
      filters: ['host_type.notequals(baremetal)'],
      list: this.$list.createList(this, {
        resource: this.params.title === 'onpremise' ? 'storages' : 'hosts',
        limit: 5,
        getParams: this.params.title === 'onpremise' ? {
          cloud_env: this.params.title,
          usable: true,
        } : {
          show_emulated: true,
          cloud_env: this.params.title,
          usable: true,
        },
      }),
      timeout: null,
    }
  },
  computed: {
    cacheColumns () {
      if (this.params.title === 'onpremise') {
        return [
          {
            field: 'name',
            title: this.$t('compute.text_228'),
          },
          {
            field: 'capacity',
            title: this.$t('storage.text_177'),
            width: 180,
            slots: {
              default: ({ row }, h) => {
                const capacity = sizestr(row.capacity, 'M', 1024)
                const allowedBrands = ['VMware', 'OneCloud']
                const actual_capacity_used = allowedBrands.includes(row.brand) ? sizestr(row.actual_capacity_used, 'M', 1024) : '-'
                return [h('div', {}, [
                  h('div', {}, this.$t('storage.text_178', [actual_capacity_used])),
                  h('div', {}, this.$t('storage.text_180', [capacity])),
                ])]
              },
            },
          },
          {
            field: 'virtual_capacity',
            title: this.$t('storage.text_43'),
            width: 180,
            slots: {
              default: ({ row }, h) => {
                const virtual_capacity = sizestr(row.virtual_capacity, 'M', 1024)
                const used_capacity = sizestr(row.used_capacity, 'M', 1024)
                return [h('div', {}, [
                  h('div', {}, this.$t('storage.text_181', [used_capacity])),
                  h('div', {}, this.$t('storage.text_180', [virtual_capacity])),
                ])]
              },
            },
          },
          {
            field: 'brand',
            title: this.$t('compute.text_176'),
          },
          {
            field: 'region',
            title: this.$t('compute.text_177'),
          },
          {
            field: 'zone',
            title: this.$t('compute.text_270'),
          },
        ]
      } else {
        return [
          {
            field: 'name',
            title: this.$t('compute.text_228'),
          },
          {
            field: 'brand',
            title: this.$t('compute.text_176'),
          },
          {
            field: 'account',
            title: this.$t('compute.text_269'),
          },
          {
            field: 'manager',
            title: this.$t('compute.text_653'),
          },
          {
            field: 'region',
            title: this.$t('compute.text_177'),
          },
          {
            field: 'zone',
            title: this.$t('compute.text_270'),
          },
        ]
      }
    },
    listOptions () {
      return {}
    },
  },
  created () {
    this.fetchPlatform()
    this.list.fetchData()
  },
  methods: {
    handleRefresh () {
      this.list.refresh()
    },
    async fetchPlatform () {
      const res = await new this.$Manager('capabilities').list({
        params: {
          scope: this.$store.getters.scope,
        },
      })
      const supportBrands = Object.values(BRAND_MAP).filter(v => v.cloud_env === this.params.title)
      const brands = res.data.data[0].brands
      this.platformOptions = supportBrands.filter(v => {
        return brands.includes(v.brand)
      }).map(v => {
        return {
          name: v.brand,
        }
      })
    },
    handlePlatformChange (e) {
      if (this.params.title !== 'onpremise') {
        this.regionParams = {
          usable: true,
          cloud_env: this.params.title,
          show_emulated: true,
          brand: e,
          scope: this.$store.getters.scope,
        }
        this.providerParams = {
          usable: true,
          brand: e,
          scope: this.$store.getters.scope,
          cloud_env: this.params.title,
        }
      } else {
        this.hostParams = {
          ...this.hostParams,
          brand: e,
        }
      }
      this.list.getParams = {
        ...this.list.getParams,
        brand: e,
      }
      this.list.fetchData()
    },
    handleRegionChange (e) {
      this.list.getParams = {
        ...this.list.getParams,
        region: e,
      }
      this.list.fetchData()
    },
    handleManagerChange (e) {
      if (this.params.title !== 'onpremise') {
        this.regionParams = {
          usable: true,
          cloud_env: this.params.title,
          show_emulated: true,
          brand: this.form.platform,
          manager: e,
          scope: this.$store.getters.scope,
        }
      }
      this.list.getParams = {
        ...this.list.getParams,
        manager: e,
      }
      this.list.fetchData()
    },
    handleHostChange (v) {
      this.list.getParams = {
        ...this.list.getParams,
        host_id: v,
      }
      this.list.fetchData()
    },
    doSave () {
      return this.list.onManager('batchPerformAction', {
        id: this.list.selectedItems.map(item => { return item.id }),
        managerArgs: {
          action: 'cache-image',
          data: {
            image: this.params.imageId,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.list.selectedItems.length === 0) {
          this.$message.info(this.$t('compute.text_213'))
          this.loading = false
          return
        }
        await this.doSave()
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
