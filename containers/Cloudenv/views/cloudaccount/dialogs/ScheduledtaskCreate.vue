<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('cloudenv.text_432') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('cloudenv.text_12')" class="mt-3" :count="params.data.length" :action="$t('cloudenv.text_432')" />
      <dialog-table v-if="columns && columns.length" :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('cloudenv.text_95')" prop="name">
          <a-input :placeholder="$t('cloudenv.text_190')" v-model:value="form.name" />
          <template v-slot:extra>
            <name-repeated res="scheduledtasks" :name="form.name" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_360')">
          {{ $t('cloudenv.sync_account') }}
        </a-form-model-item>
        <scheduled-task-time ref="taskTime" :model="form" />
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import ScheduledTaskTime from '@Cloudenv/sections/ScheduledTaskTime'
import {
  getStatusTableColumn,
  getEnabledTableColumn,
} from '@/utils/common/tableColumn'
import NameRepeated from '@/sections/NameRepeated'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ScheduledtaskCreateDialog',
  components: {
    NameRepeated,
    ScheduledTaskTime,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      rules: {
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
        ],
      },
      form: {
        name: '',
      },
      columns: [
        {
          field: 'name',
          title: this.$t('table.title.name'),
          minWidth: 100,
          slots: {
            default: ({ row }) => {
              return row.name
            },
          },
        },
        getStatusTableColumn({ statusModule: 'cloudaccount', minWidth: 90 }),
        getEnabledTableColumn({ minWidth: 90 }),
      ],
    }
  },
  methods: {
    generateData (values) {
      const params = {
        resource_type: 'cloudaccount',
        label_type: 'id',
        labels: [this.params.resId],
        operation: 'sync',
        generate_name: values.name,
      }
      this.$refs.taskTime.transformParams(params, values)
      return params
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const params = this.generateData(this.form)
        await new this.$Manager('scheduledtasks', 'v1').create({ data: params })
        this.params.callback && this.params.callback()
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
