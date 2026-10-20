<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.create_disk_backup')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.create_disk_backup')" />
      <dialog-table
        :data="params.data"
        :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.backup_type')" prop="type">
          <a-radio-group
            v-model:value="form.type"
            @change="typeChangeHandle">
            <a-radio value="disk" :disabled="isEsxi">{{$t('compute.disk_backup')}}</a-radio>
            <a-radio value="instance">{{$t('compute.instance_backup')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.text_1254')"
          v-if="isDiskBackup"
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
          :label="$t('compute.backup_name')"
          class="mb-0"
          prop="name">
          <a-input
            v-model:value="form.name"
            :placeholder="$t('validator.resourceName')" />
          <div slot="extra">
            <div v-if="showRepeatTips">{{$t('compute.text_1091')}}</div>
          </div>
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.backup_storage')"
          prop="storage">
          <base-select
            style="width: 100%"
            v-model:value="form.storage"
            :params="storageParams"
            :select-props="{ placeholder: $t('compute.text_1022', [$t('compute.backup_storage')]) }"
            resource="backupstorages"
            :filterable="true"
            :isDefaultSelect="true" />
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
import { mapGetters } from 'vuex'
import { DISK_TYPE } from '@Compute/constants'
import { INPUT_DEBOUNCE_TIMER } from '@/constants/config'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { sizestr } from '@/utils/utils'
import { HYPERVISORS_MAP, EXTRA_HYPERVISORS } from '@/constants'

const hypervisorMap = Object.assign({}, HYPERVISORS_MAP, EXTRA_HYPERVISORS)

export default {
  name: 'VmBackupCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const isEsxi = this.params.data[0].hypervisor === hypervisorMap.esxi.key
    return {
      loading: false,
      showRepeatTips: false,
      form: {
        name: '',
        type: isEsxi ? 'instance' : 'disk',
        disk: undefined,
        storage: undefined,
      },
      rules: {
        disk: [
          { required: true, message: this.$t('compute.text_1085'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('compute.text_1256') },
        ],
        storage: [
          { required: true, message: this.$t('compute.text_1022', [this.$t('compute.backup_storage')]), trigger: 'change' },
        ],
      },
      selectDisk: {},
      disabledSubmit: false,
      isEsxi,
    }
  },
  computed: {
    ...mapGetters(['scope']),
    diskParams () {
      return {
        scope: this.$store.getters.scope,
        details: true,
        with_meta: true,
      }
    },
    isDiskBackup () {
      return this.form.type === 'disk'
    },
    manager () {
      return new this.$Manager(this.isDiskBackup ? 'diskbackups' : 'instancebackups', 'v2')
    },
    storageParams () {
      const params = {
        scope: this.scope,
        project_domain: this.params.data[0].project_domain,
      }
      if (this.isDiskBackup) {
        params.disk_id = this.selectDisk.id
      } else {
        params.server_id = this.params.data[0].id
      }
      return params
    },
  },
  watch: {
    'form.name' (val) {
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
      const name = this.form.name
      if (!R.isNil(name) && !R.isEmpty(name)) {
        this.manager.get({ id: name, params: { scope: this.$store.getters.scope } })
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
    async doCreateDiskBackup () {
      await this.$refs.formRef.validate()
      const params = {
        disk_id: this.form.disk,
        generate_name: this.form.name,
        backup_storage_id: this.form.storage,
      }
      return this.manager.create({ data: params })
    },
    async doCreateInstanceBackup () {
      await this.$refs.formRef.validate()
      const params = {
        generate_name: this.form.name,
        backup_storage_id: this.form.storage,
      }
      return this.params.onManager('performAction', {
        id: this.params.data[0].id,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'instance-backup',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.isDiskBackup) {
          await this.doCreateDiskBackup()
        } else {
          await this.doCreateInstanceBackup()
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
    typeChangeHandle () {
      this.$nextTick(() => {
        this.debounceCheckTemplateName()
      })
    },
  },
}
</script>
