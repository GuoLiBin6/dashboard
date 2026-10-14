<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('network.set_static_routes') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.network')" :count="params.data.length" :action="$t('network.set_static_routes')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" class="mt-3" v-bind="formItemLayout" hideRequiredMark>
        <a-form-model-item
          v-for="(row, index) in form.rows"
          :key="row.key"
          v-bind="index === 0 ? formItemLayout : formItemLayoutWithOutLabel"
          :label="index === 0 ? $t('network.static_routes') : ''"
          :required="false">
          <a-row :gutter="6">
            <a-col :span="11">
              <a-form-model-item
                :wrapperCol="{ span: 24 }"
                class="mb-0 mr-1"
                :prop="`rows.${index}.net`"
                :rules="netRules(row.key)">
                <a-input v-model:value="row.net" :placeholder="$t('network.static_routes.net_placeholder')" />
              </a-form-model-item>
            </a-col>
            <a-col :span="11">
              <a-form-model-item
                :wrapperCol="{ span: 24 }"
                class="mb-0 mr-1"
                :prop="`rows.${index}.gw`"
                :rules="rules.gw">
                <a-input v-model:value="row.gw" :placeholder="$t('network.static_routes.gw_placeholder')" />
              </a-form-model-item>
            </a-col>
            <a-col :span="2">
              <a-button shape="circle" icon="minus" size="small" @click="remove(row.key)" />
            </a-col>
          </a-row>
        </a-form-model-item>
        <a-form-model-item
          v-bind="form.rows.length ? formItemLayoutWithOutLabel : formItemLayout"
          :label="form.rows.length ? '' : $t('network.static_routes')">
          <a-button type="link" class="px-0" @click="add">
            <a-icon type="plus-circle" theme="filled" class="mr-2" style="font-size: 16px" />
            {{ $t('network.static_routes.add') }}
          </a-button>
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

let id = 0

const getInitialRoutes = (params = {}) => {
  const listData = params.listData
  if (Array.isArray(listData) && listData.length) {
    const routes = listData.map(item => ({
      net: item.cidr || item.net,
      gw: item.gateway || item.gw,
    })).filter(item => item.net && item.gw)
    if (routes.length) return routes
  }
  const meta = params.data?.[0]?.metadata?.static_routes
  if (!meta) return []
  try {
    const routes = typeof meta === 'string' ? JSON.parse(meta) : meta
    if (Array.isArray(routes)) {
      return routes.map(item => {
        if (Array.isArray(item)) {
          return { gw: item[0], net: item[1] }
        }
        return { gw: item.gw, net: item.net || item.cidr }
      }).filter(item => item.net && item.gw)
    }
    const keys = Object.keys(routes || {})
    if (!keys.length) return []
    return keys.map(net => ({ net, gw: routes[net] }))
  } catch (e) {
    return []
  }
}

export default {
  name: 'SetStaticRoutesDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const initialRoutes = getInitialRoutes(this.params)
    id = initialRoutes.length ? initialRoutes.length - 1 : -1
    const rows = initialRoutes.map((route, idx) => ({
      key: idx,
      net: route.net || undefined,
      gw: route.gw || undefined,
    }))
    return {
      loading: false,
      form: {
        rows,
      },
      rules: {
        gw: [
          { required: true, message: this.$t('network.static_routes.gw_placeholder') },
          { validator: this.$validate('IPv4') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 16 },
          xl: { span: 18 },
          xxl: { span: 20 },
        },
        labelCol: {
          md: { span: 8 },
          xl: { span: 6 },
          xxl: { span: 4 },
        },
      },
      formItemLayoutWithOutLabel: {
        wrapperCol: {
          md: { span: 16, offset: 8 },
          xl: { span: 18, offset: 6 },
          xxl: { span: 20, offset: 4 },
        },
      },
    }
  },
  computed: {
    columns () {
      const fields = ['name', 'ip', 'server_type']
      return fields.map(field => (this.params.columns || []).find(item => item.field === field)).filter(Boolean)
    },
  },
  methods: {
    netRules (currentKey) {
      return [
        { required: true, message: this.$t('network.static_routes.net_placeholder') },
        { validator: this.$validate('cidr') },
        { validator: this.checkNetDuplicate(currentKey) },
      ]
    },
    checkNetDuplicate (currentKey) {
      return (rule, value, callback) => {
        if (!value) return callback()
        const duplicated = this.form.rows.some(row => row.key !== currentKey && row.net === value)
        if (duplicated) {
          return callback(new Error(this.$t('network.static_routes.net_duplicate')))
        }
        return callback()
      }
    },
    generateValues () {
      const staticRoutes = {}
      this.form.rows.forEach(row => {
        if (row.net && row.gw) {
          staticRoutes[row.net] = row.gw
        }
      })
      return {
        static_routes: Object.keys(staticRoutes).length ? staticRoutes : {},
      }
    },
    doSubmit () {
      return new this.$Manager('networks').performAction({
        id: this.params.data[0].id,
        action: 'metadata',
        data: this.generateValues(),
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (!this.form.rows.length) {
          this.loading = false
          this.$confirm({
            title: this.$t('network.set_static_routes'),
            content: this.$t('network.static_routes.clear_confirm'),
            okText: this.$t('dialog.ok'),
            cancelText: this.$t('dialog.cancel'),
            onOk: () => this.doClearStaticRoutes(),
          })
          return
        }
        await this.$refs.formRef.validate()
        await this.doSubmit()
        this.$message.success(this.$t('common.success'))
        this.params.ok && this.params.ok()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async doClearStaticRoutes () {
      this.loading = true
      try {
        await this.doSubmit()
        this.$message.success(this.$t('common.success'))
        this.params.ok && this.params.ok()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    add () {
      const nextKey = ++id
      this.form.rows.push({ key: nextKey, net: undefined, gw: undefined })
    },
    remove (k) {
      this.form.rows = this.form.rows.filter(row => row.key !== k)
    },
  },
}
</script>
