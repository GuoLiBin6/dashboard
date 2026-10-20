<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ title }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form"
        :rules="formRules"
        hideRequiredMark>
        <scope-radio
          :disabled="isUpdate"
          :model="form"
          :label="$t('system.notify.topic.receiver.resource_scope')"
          @change="scopeChange" />
        <a-form-model-item :label="$t('system.text_48')" prop="type">
          <a-radio-group v-model:value="form.type" @change="handleTypeChange" :disabled="isUpdate">
            <a-radio-button
              v-for="item in sub_types"
              :value="item.key"
              :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item v-if="curType === 'receiver'" :label="$t('system.notify.subscriber.type.receiver')" prop="receivers">
          <base-select
            v-model:value="form.receivers"
            class="w-100"
            :filterable="true"
            needParams
            resource="receivers"
            version="v1"
            option-label-prop="label"
            :isDefaultSelect="true"
            :params="recipientParams"
            :select-props="{ placeholder: $t('system.text_232', [$t('system.notify.subscriber.type.receiver')]), allowClear: false, mode: 'multiple' }">
            <template #optionLabelTemplate="{ item }">
              <a-row>
                <a-col span="9">{{ item.name }}</a-col>
                <a-col><p class="text-right text-color-secondary mr-2">{{ $t('common_624', [$t('dictionary.domain')]) }}: {{ item.project_domain }}</p></a-col>
              </a-row>
            </template>
          </base-select>
        </a-form-model-item>
        <a-form-model-item v-if="curType === 'role'" :label="$t('system.notify.subscriber.type.role')">
          <a-row type="flex">
            <a-col :flex="2" class="mr-2">
              <a-form-model-item prop="role_scope" class="mb-0">
                <base-select
                  v-model:value="form.role_scope"
                  :options="roleScopeOptions"
                  :select-props="{ placeholder: $t('system.text_232', [$t('common_235')]), allowClear: false }" />
              </a-form-model-item>
            </a-col>
            <a-col :flex="3">
              <a-form-model-item prop="role" class="mb-0">
                <base-select
                  v-model:value="form.role"
                  :filterable="true"
                  needParams
                  resource="roles"
                  version="v1"
                  :isDefaultSelect="true"
                  :applyOptionLabel="true"
                  :params="recipientParams"
                  :select-props="{ placeholder: $t('system.text_232', [$t('system.notify.subscriber.type.role')]), allowClear: false }" />
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
        <a-form-model-item v-if="curType === 'robot'" :label="$t('system.notify.subscriber.type.robot')" prop="robot">
          <base-select
            v-model:value="form.robot"
            class="w-100"
            :filterable="true"
            needParams
            resource="robots"
            version="v1"
            option-label-prop="label"
            :isDefaultSelect="true"
            :params="recipientParams"
            :select-props="{ placeholder: $t('system.text_232', [$t('system.notify.subscriber.type.robot')]), allowClear: false }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('iam.notify_silent')" prop="group_times">
          <a-row type="flex">
            <a-col :flex="2" class="mr-2">
              <a-select
                v-model:value="form.group_times"
                allow-clear
                :placeholder="$t('common.tips.select', [$t('iam.notify_silent')])">
                <a-select-option v-for="item in groupKeyOpts" :value="item.id" :key="item.id">{{item.name}}</a-select-option>
              </a-select>
            </a-col>
            <a-col :flex="3"><help-tooltip :text="$t('iam.notify_silent.tip')" /></a-col>
          </a-row>
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
import ScopeRadio from '@/sections/ScopeRadio'
import { NOTIFY_SUBSCRIBER_TYPES, NOTIFY_ROLE_SCOPES } from '../../../constants'

export default {
  name: 'SetupNotifyReceiverDialog',
  components: { ScopeRadio },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const initialValues = {}
    if (this.params.data && this.params.data.id) {
      const s = this.params.data
      initialValues.scope = s.resource_scope
      if (s.resource_scope === 'domain') initialValues.domain = s.resource_attribution_id
      if (s.resource_scope === 'project') initialValues.project = s.resource_attribution_id
      initialValues.type = s.type
      initialValues.role_scope = s.role_scope
      initialValues.role = s.role ? s.role.id : ''
      initialValues.robot = s.robot ? s.robot.id : ''
      initialValues.receivers = s.receivers ? s.receivers.map(r => r.id) : []
      initialValues.group_times = s.group_times || undefined
    } else {
      initialValues.scope = this.$store.getters.scope
      initialValues.domain = undefined
      initialValues.project = undefined
      initialValues.type = NOTIFY_SUBSCRIBER_TYPES[0].key
      initialValues.role_scope = 'system'
      initialValues.group_times = 60
    }

    return {
      loading: false,
      isAdminMode: this.$store.getters.isAdminMode,
      curType: initialValues.type,
      sub_types: NOTIFY_SUBSCRIBER_TYPES,
      roleScopeOptions: NOTIFY_ROLE_SCOPES,
      form: {
        scope: initialValues.scope,
        domain: initialValues.domain,
        project: initialValues.project,
        type: initialValues.type,
        receivers: initialValues.receivers,
        robot: initialValues.robot,
        role: initialValues.role,
        role_scope: initialValues.role_scope,
        group_times: initialValues.group_times,
      },
      rules: {
        type: [
          { required: true, message: `${this.$t('common.select')}` },
        ],
        group_times: [
          { required: false, message: `${this.$t('common.select')}` },
        ],
        domain: [
          { required: !this.params.data, message: `${this.$t('common.select')}` },
        ],
        project: [
          { required: !this.params.data, message: `${this.$t('common.select')}` },
        ],
      },
      groupKeyOpts: [
        { id: 5, name: this.$t('iam.silent.minute', [5]) },
        { id: 10, name: this.$t('iam.silent.minute', [10]) },
        { id: 15, name: this.$t('iam.silent.minute', [15]) },
        { id: 30, name: this.$t('iam.silent.minute', [30]) },
        { id: 1 * 60, name: this.$t('iam.silent.hour', [1]) },
        { id: 2 * 60, name: this.$t('iam.silent.hour', [2]) },
        { id: 3 * 60, name: this.$t('iam.silent.hour', [3]) },
        { id: 6 * 60, name: this.$t('iam.silent.hour', [6]) },
        { id: 12 * 60, name: this.$t('iam.silent.hour', [12]) },
        { id: 24 * 60, name: this.$t('iam.silent.hour', [24]) },
      ],
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    isUpdate () {
      return this.params.data && this.params.data.id
    },
    title () {
      if (this.params.data && this.params.data.id) {
        return this.$t('system.text_141', [this.$t('system.notify.subscriber.type.receiver')])
      }
      return this.$t('system.text_130', [this.$t('system.notify.subscriber.type.receiver')])
    },
    recipientParams () {
      return {
        limit: 0,
        scope: this.$store.getters.scope,
        with_meta: true,
        enabled: true,
      }
    },
    formRules () {
      const rules = { ...this.rules }
      const msg = `${this.$t('common.select')}`
      if (this.curType === 'receiver') {
        rules.receivers = [{ required: true, message: msg }]
      } else if (this.curType === 'robot') {
        rules.robot = [{ required: true, message: msg }]
      } else if (this.curType === 'role') {
        rules.role = [{ required: true, message: msg }]
        rules.role_scope = [{ required: true, message: msg }]
      }
      // domain/project 仅在对应 scope 下必填
      if (this.form.scope !== 'domain') delete rules.domain
      if (this.form.scope !== 'project') delete rules.project
      return rules
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('subscribers', 'v1')
  },
  methods: {
    scopeChange () {},
    handleTypeChange (e) {
      this.curType = e?.target?.value ?? e
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        let resource_attribution_id = ''
        if (values.scope === 'domain') resource_attribution_id = values.domain || this.userInfo.projectDomainId
        if (values.scope === 'project') resource_attribution_id = values.project || this.userInfo.projectId
        const params = {
          receivers: values.receivers,
          role_scope: values.role_scope,
          role: values.role,
          robot: values.robot,
          group_times: values.group_times || 0,
        }
        if (this.isUpdate) {
          await this.manager.performAction({
            id: this.params.data.id,
            action: 'change',
            data: params,
          })
        } else {
          params.scope = this.$store.getters.scope
          params.resource_scope = values.scope
          params.resource_attribution_id = resource_attribution_id
          params.topic_id = this.params.resId
          params.type = values.type
          await this.manager.create({
            data: params,
          })
        }
        this.loading = false
        this.params.success()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
