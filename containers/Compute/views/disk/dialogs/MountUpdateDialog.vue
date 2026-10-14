<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.disk_perform_attach')}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :action="$t('compute.disk_perform_attach')" :name="$t('dictionary.disk')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('dictionary.server')" v-bind="formItemLayout" prop="server">
          <base-select
            class="w-100"
            remote
            filterable
            v-model:value="form.server"
            resource="servers"
            search-key="search"
            :remote-fn="q => ({ search: q })"
            :params="serverParams" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'DiskMountUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        server: undefined,
      },
      rules: {
        server: [
          { required: true, message: this.$t('compute.text_425') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'scope']),
    serverParams () {
      const itemData = this.params.data[0]
      const params = {
        details: true,
        attachable_servers_for_disk: itemData.id,
        scope: this.scope,
        brand: itemData.brand,
        filter: 'status.in(ready, running)',
        limit: 20,
      }
      if (itemData.cloud_env === 'public' || itemData.cloud_env === 'private') {
        params.manager = itemData.manager_id
        params.zone = itemData.zone_id
      }
      if (this.isAdminMode || this.isDomainMode) params.project_id = itemData.project_id
      return params
    },
  },
  methods: {
    doUpdate () {
      return new this.$Manager('servers').batchPerformAction({
        action: 'attachdisk',
        ids: this.form.server,
        data: {
          disk_id: this.params.data[0].id,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doUpdate()
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
