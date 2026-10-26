<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ params.title }}</template>
    <template #body>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item name="source" prop="source">
          <template #label>
            {{$t('storage.access.group.rule.source')}}&nbsp;
            <a-tooltip :title="$t('storage.access.group.rule.source.tooltip')">
              <icon type="question-circle" />
            </a-tooltip>
          </template>
          <div class="input-with-checkbox">
            <a-input :disabled="IPCheckboxDisabled" v-model:value="form.source" />
            <a-checkbox class="right-checkbox" :checked="isIPChecked" @change="sourceChanged">{{$t('compute.text_997')}}</a-checkbox>
          </div>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.access.group.rule.rw.access_type')" name="rw_access_type" prop="rw_access_type">
          <a-radio-group v-model:value="form.rw_access_type">
            <a-radio value="RW">{{$t('storage.access.group.rule.rw.access_type.rw')}}</a-radio>
            <a-radio value="R">{{$t('storage.access.group.rule.rw.access_type.r')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.access.group.rule.user.access_type')" name="user_access_type" prop="user_access_type">
          <a-radio-group v-model:value="form.user_access_type">
            <a-radio value="no_root_squash">{{$t('storage.access.group.rule.user.access_type.no_root_squash')}}</a-radio>
            <a-radio value="root_squash">{{$t('storage.access.group.rule.user.access_type.root_squash')}}</a-radio>
            <a-radio value="all_squash">{{$t('storage.access.group.rule.user.access_type.all_squash')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item name="priority" prop="priority">
          <template #label>
            {{$t('compute.text_1001')}}
            <a-tooltip :title="$t('compute.text_1002')">
              <icon type="question-circle" />
            </a-tooltip>
          </template>
          <a-input-number :min="1" :max="100" v-model:value="form.priority" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'AccessGroupRuleEditDialog',
  mixins: [DialogMixin, WindowsMixin],
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data () {
    const selectItem = this.params.data[0] || {}
    const isAnyIp = selectItem.cidr === '0.0.0.0/0' || selectItem.source === '0.0.0.0/0'
    return {
      loading: false,
      form: {
        source: selectItem.source || (isAnyIp ? '0.0.0.0/0' : ''),
        rw_access_type: selectItem.rw_access_type || 'RW',
        user_access_type: selectItem.user_access_type || 'no_root_squash',
        priority: selectItem.priority || 1,
      },
      rules: {
        source: [
          { required: true, message: this.$t('compute.text_996') },
          // 原 $validate('source') 无对应规则，会导致任意值（含 0.0.0.0/0）校验失败
          { validator: this.$validate('cidr') },
        ],
        rw_access_type: [
          { required: true },
        ],
        user_access_type: [
          { required: true },
        ],
      },
      IPCheckboxDisabled: isAnyIp,
      isIPChecked: isAnyIp,
    }
  },
  methods: {
    sourceChanged (e) {
      const checked = !!e?.target?.checked
      this.isIPChecked = checked
      this.IPCheckboxDisabled = checked
      if (checked) {
        this.form.source = '0.0.0.0/0'
      } else {
        this.form.source = ''
      }
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate?.(['source'])
      })
    },
    saveEdit (data) {
      if (this.params.data[0].id) {
        const id = this.params.data[0].id
        return new this.$Manager('access_group_rules').update({
          id,
          data,
        })
      }
      const params = {
        ...data,
        access_group_id: this.params.access_group_id,
      }
      return new this.$Manager('access_group_rules').create({
        data: params,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.saveEdit({ ...this.form })
        this.params.refresh && this.params.refresh()
        this.cancelDialog()
      } catch (e) {
        // validate 失败会 reject { errorFields }，勿再 throw 以免 unhandledrejection
        if (e && e.errorFields) return
        throw e
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
.input-with-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;

  > :first-child {
    flex: 1;
    min-width: 0;
  }
}
.right-checkbox {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 12px !important;
  color: #999;
}
</style>
