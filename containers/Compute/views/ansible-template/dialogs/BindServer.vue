<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.ansibletemplate')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model class="mt-3" ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.text_90')" prop="server_id">
          <a-select v-model:value="form.server_id" mode="multiple" :loading="queryServerLoading" style="width: 100%" :placeholder="$t('compute.text_256')">
            <a-select-option :key="item.id" v-for="item in serverList" :value="item.id">{{item.name}}</a-select-option>
          </a-select>
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

export default {
  name: 'AnsibleTemplateBindServerDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        server_id: undefined,
      },
      rules: {
        server_id: [
          { required: true, message: this.$t('compute.text_256') },
        ],
      },
      serverList: [],
      queryServerLoading: false,
    }
  },
  created () {
    this.fetchQueryServers()
  },
  methods: {
    async fetchQueryServers () {
      const manager = new this.$Manager('servers')
      const params = {
        limit: 0,
        usable: true,
        details: true,
        scope: this.$store.getters.scope,
      }
      this.queryServerLoading = true
      try {
        const { data } = await manager.list({ params })
        this.serverList = data.data
      } catch (err) {
        throw err
      } finally {
        this.queryServerLoading = false
      }
    },
    async handleConfirm () {
      const manager = new this.$Manager('devtool_templates')
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await manager.performAction({
          id: this.params.data[0].id,
          action: 'bind',
          data: this.form,
        })
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
