<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.disk_perform_create_snapshot')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('compute.text_1251')}}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.disk_perform_create_snapshot')" />
      <dialog-table
        :data="params.data"
        :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_1071')" v-if="isKvm || isEsxi" prop="snapshotType">
          <a-radio-group
            v-model:value="form.snapshotType"
            @change="snapshotTypeChangeHandle">
            <a-tooltip>
              <template slot="title" v-if="isEsxi">
                <span>{{$t('compute.text_1358')}}</span>
              </template>
              <a-radio value="disk" :disabled="isEsxi">{{$t('compute.text_101')}}</a-radio>
            </a-tooltip>
            <a-radio value="instance">{{$t('compute.text_102')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.text_1254')"
          v-if="isDiskSnapshot"
          prop="disk">
          <base-select
            style="width: 100%"
            v-model:value="form.disk"
            :params="diskParams"
            :select-props="{ placeholder: $t('compute.text_1085') }"
            resource="disks"
            idKey="disk_id"
            nameKey="disk"
            :label-format="getDiskLabel"
            :ctx="[['servers', this.params.data[0].id]]"
            :filterable="true"
            :isDefaultSelect="true"
            v-model:item="selectDisk" />
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.text_415')"
          prop="snapshotName">
          <a-input
            v-model:value="form.snapshotName"
            :placeholder="$t('validator.resourceName')" />
          <div slot="extra">
            <div v-if="showRepeatTips">{{$t('compute.text_1091')}}</div>
            <div v-show="!isDiskSnapshot">{{$t('compute.text_1255', [ diskCount ])}}</div>
          </div>
        </a-form-model-item>
        <a-form-model-item v-if="!isDiskSnapshot" prop="with_memory">
          <a-tooltip>
            <template v-if="!isRunningVm" slot="title">
              {{$t('compute.create_mem_snapshot_limit')}}
            </template>
            <a-checkbox
              v-model:checked="form.with_memory"
              :disabled="!isRunningVm">
              {{$t('compute.create_mem_snapshot_same_time')}}
            </a-checkbox>
          </a-tooltip>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading" :disabled="disabledSubmit">{{
        $t("dialog.ok")
      }}</a-button>
      <a-button @click="cancelDialog">{{ $t("dialog.cancel") }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import debounce from 'lodash/debounce'
import * as R from 'ramda'
import { DISK_TYPE } from '@Compute/constants'
import { INPUT_DEBOUNCE_TIMER } from '@/constants/config'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { sizestr } from '@/utils/utils'
import { HYPERVISORS_MAP, EXTRA_HYPERVISORS } from '@/constants'

const hypervisorMap = Object.assign({}, HYPERVISORS_MAP, EXTRA_HYPERVISORS)

export default {
  name: 'VmSnapshotCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const isEsxi = this.params.data[0].hypervisor === hypervisorMap.esxi.key
    return {
      loading: false,
      showRepeatTips: false,
      form: {
        snapshotName: '',
        snapshotType: isEsxi ? 'instance' : 'disk',
        disk: undefined,
        with_memory: undefined,
      },
      rules: {
        disk: [
          { required: true, message: this.$t('compute.text_1085'), trigger: 'change' },
        ],
        snapshotName: [
          { required: true, message: this.$t('compute.text_1256') },
          { validator: this.$validate('resourceName') },
        ],
      },
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
      },
      selectDisk: {},
      disabledSubmit: false,
    }
  },
  computed: {
    isKvm () {
      return this.params.data[0].hypervisor === hypervisorMap.kvm.key
    },
    isEsxi () {
      return this.params.data[0].hypervisor === hypervisorMap.esxi.key
    },
    diskParams () {
      return {
        scope: this.$store.getters.scope,
        details: true,
        with_meta: true,
      }
    },
    isDiskSnapshot () {
      if (this.params.data[0].hypervisor === hypervisorMap.cnware.key) {
        return false
      }
      return this.form.snapshotType === 'disk'
    },
    manager () {
      return new this.$Manager(this.isDiskSnapshot ? 'snapshots' : 'instance_snapshots', 'v2')
    },
    diskCount () {
      return this.params.data[0].disk_count
    },
    isRunningVm () {
      return this.params.data[0].status === 'running'
    },
  },
  watch: {
    'form.snapshotName' (val) {
      this.debounceCheckTemplateName()
    },
    selectDisk (val) {
      this.disabledSubmit = val.storage_type === 'nova'
    },
  },
  created () {
    this.debounceCheckTemplateName = debounce(() => {
      this.checkTemplateName()
    }, INPUT_DEBOUNCE_TIMER)
  },
  methods: {
    checkTemplateName () {
      const snapshotName = this.form.snapshotName
      if (!R.isNil(snapshotName) && !R.isEmpty(snapshotName)) {
        this.manager.get({ id: snapshotName, params: { scope: this.$store.getters.scope } })
          .then(res => {
            const data = res.data
            if (!R.isNil(data) && !R.isEmpty(data)) {
              this.showRepeatTips = true // 重复名字
            }
          }).catch(() => {
            this.showRepeatTips = false
          })
      } else {
        this.showRepeatTips = false
      }
    },
    async doCreateDiskSnapshot () {
      await this.$refs.formRef.validate()
      const params = {
        disk: this.form.disk,
        generate_name: this.form.snapshotName,
      }
      return this.manager.create({ data: params })
    },
    async doCreateInstanceSnapshot () {
      await this.$refs.formRef.validate()
      const params = {
        generate_name: this.form.snapshotName,
      }
      if (this.form.with_memory) {
        params.with_memory = true
      }
      return this.params.onManager('performAction', {
        id: this.params.data[0].id,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'instance-snapshot',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.isDiskSnapshot) {
          await this.doCreateDiskSnapshot()
        } else {
          await this.doCreateInstanceSnapshot()
        }
        this.params.refresh()
        this.cancelDialog()
        this.$message.success(this.$t('compute.text_322'))
      } catch (error) {
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
    getDiskLabel (item) {
      return `${item.disk}（${
        item.disk_type === DISK_TYPE.sys.value
          ? DISK_TYPE.sys.text
          : DISK_TYPE.data.text
      }, ${sizestr(item.disk_size, 'M', 1024)}）`
    },
    snapshotTypeChangeHandle () {
      this.$nextTick(() => {
        this.debounceCheckTemplateName()
      })
    },
  },
}
</script>
