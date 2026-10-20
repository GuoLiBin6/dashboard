<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>
          {{ $t('compute.unpack_alert') }}
        </template>
      </a-alert>
      <dialog-selected-tips :name="$t('compute.instance_backup')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('compute.unpack_name')" prop="name">
          <a-input
            v-model:value="form.name"
            :placeholder="$t('common.tips.input', [$t('compute.unpack_name')])" />
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
  name: 'UnpackDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.unpack'),
      form: {
        name: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('common.tips.input', [this.$t('compute.unpack_name')]) },
        ],
      },
    }
  },
  computed: {
    columns () {
      const showFields = ['name', 'brand', 'guest']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  methods: {
    doUnpackSubmit () {
      const params = {
        package_name: this.form.name,
      }
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('performAction', {
        id: ids[0],
        steadyStatus: ['ready'],
        managerArgs: {
          action: 'pack',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doUnpackSubmit()
        this.params.refresh && this.params.refresh()
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
