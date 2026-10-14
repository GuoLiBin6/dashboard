<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('compute.text_1199')}}<br />{{$t('compute.text_1200')}}<br />{{$t('compute.text_1201')}}<br />
        </template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="action" />
      <dialog-table
        :data="params.data"
        :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout" v-if="!isBatch">
        <a-form-model-item :label="$t('compute.text_1202')" prop="cloneType">
          <a-radio-group
            v-model:value="form.cloneType">
            <a-radio value="newSnapshot">{{$t('compute.text_1203')}}</a-radio>
            <a-radio value="oldSnapshot" :disabled="oldSnapshotDisabled">{{$t('compute.text_1204')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.text_228')"
          prop="name">
          <a-input
            v-model:value="form.name" />
          <template #extra>
            <name-repeated
              res="servers"
              :name="form.name"
              :default-text="$t('compute.text_893')" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_294')" prop="count">
          <a-input-number v-model:value="form.count" :max="5" :min="1" :step="1" step-strictly />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1205')" :extra="$t('compute.text_1206')" v-if="isNewSnapshotClone" prop="auto_delete_instance_snapshot">
          <a-switch :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" v-model:checked="form.auto_delete_instance_snapshot" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_102')" v-else prop="snapshot">
          <base-select
            :options="snapshotOptions"
            v-model:value="form.snapshot"
            :select-props="{ placeholder: $t('compute.text_1207') }" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{
        $t("dialog.ok")
      }}</a-button>
      <a-button @click="cancelDialog">{{ $t("dialog.cancel") }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import NameRepeated from '@/sections/NameRepeated'

export default {
  name: 'VmCloneDeepDialog',
  components: {
    NameRepeated,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.text_1208'),
      form: {
        name: '',
        cloneType: 'newSnapshot',
        count: 1,
        auto_delete_instance_snapshot: true,
        snapshot: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_1043') },
        ],
        count: [
          { required: true, message: this.$t('compute.text_1195') },
        ],
        snapshot: [
          { required: true, message: this.$t('compute.text_1207'), trigger: 'change' },
        ],
      },
      formItemLayout: {
        labelCol: { span: 5 },
        wrapperCol: { span: 19 },
      },
      snapshotParams: {
        scope: this.$store.getters.scope,
        usable: true,
        guest_id: this.params.data[0].id,
      },
      snapshotOptions: [],
    }
  },
  computed: {
    isNewSnapshotClone () {
      return this.form.cloneType === 'newSnapshot'
    },
    manager () {
      return new this.$Manager('servers', 'v2')
    },
    diskCount () {
      return this.params.data[0].disk_count
    },
    oldSnapshotDisabled () {
      return this.snapshotOptions.length === 0
    },
    isBatch () {
      return this.params.data.length > 1
    },
  },
  created () {
    this.fetchSnapshotList()
  },
  methods: {
    async doCreateByNewSnapshot () {
      await this.$refs.formRef.validate()
      const values = this.form
      const params = {
        generate_name: values.name,
        name: values.name,
        count: values.count,
        auto_start: true,
        auto_delete_instance_snapshot: values.auto_delete_instance_snapshot,
      }
      return this.params.onManager('performAction', {
        id: this.params.data[0].id,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'snapshot-and-clone',
          data: params,
        },
      })
    },
    async doBatchCreateByNewSnapshot () {
      return this.params.data.map((obj) => {
        const name = `${obj.name}-copy`
        const params = {
          generate_name: name,
          name: name,
          count: 1,
          auto_start: true,
          auto_delete_instance_snapshot: true,
        }
        return this.params.onManager('performAction', {
          id: obj.id,
          steadyStatus: ['running', 'ready'],
          managerArgs: {
            action: 'snapshot-and-clone',
            data: params,
          },
        })
      })
    },
    async doCreateByOldSnapshot () {
      await this.$refs.formRef.validate()
      const values = this.form
      const params = {
        instance_snapshot_id: values.snapshot,
        generate_name: values.name,
        name: values.name,
        count: values.count,
        auto_start: true,
        auto_delete_instance_snapshot: false,
      }
      return this.manager.create({ data: params })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.isNewSnapshotClone) {
          if (this.isBatch) {
            await this.doBatchCreateByNewSnapshot()
          } else {
            await this.doCreateByNewSnapshot()
          }
        } else {
          await this.doCreateByOldSnapshot()
        }
        setTimeout(() => { // 后端异步任务，需要延迟2s调用 @万垚奇
          this.params.refresh()
        }, 2000)
        this.cancelDialog()
        this.$message.success(this.$t('compute.text_423'))
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchSnapshotList () {
      const params = {
        scope: this.$store.getters.scope,
        guest_id: this.params.data[0].id,
        usable: true,
      }
      const { data } = await new this.$Manager('instance_snapshots', 'v2').list({ params })
      this.snapshotOptions = data.data.map((item) => {
        return {
          key: item.id,
          label: item.name,
        }
      })
    },
  },
}
</script>
