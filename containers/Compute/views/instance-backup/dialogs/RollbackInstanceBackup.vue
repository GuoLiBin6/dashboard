<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('compute.instance_backup')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" hideRequiredMark>
        <a-form-model-item :label="$t('compute.rollback_type')" prop="type">
          <a-radio-group v-model:value="form.type">
            <a-radio-button value="new">
              {{ $t('compute.create_new_instance') }}
            </a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.instance_name')" prop="name">
          <a-input
            v-model:value="form.name"
            :placeholder="$t('compute.instance_name_placeholder')" />
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
  name: 'InstanceBackupRollbackDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.text_478'),
      form: {
        type: 'new',
        name: undefined,
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
    async doRollbackSubmit () {
      const params = {
        name: this.form.name,
      }
      const ids = this.params.data.map(item => item.id)
      await this.params.onManager('performAction', {
        id: ids[0],
        steadyStatus: ['ready'],
        managerArgs: {
          action: 'recovery',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doRollbackSubmit()
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        console.log(error)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
