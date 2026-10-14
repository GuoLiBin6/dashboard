<template>
  <div>
    <a-form-model-item :label="$t('cloudenv.text_83')" v-bind="formLayout" prop="enable_auto_sync" v-show="false">
      <a-switch :checkedChildren="$t('cloudenv.text_84')" :unCheckedChildren="$t('cloudenv.text_85')" v-model:checked="form.enable_auto_sync" @change="change" />
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.text_86')" v-bind="formLayout" prop="sync_interval_seconds" v-if="showSecond">
      <a-input-number style="width: 180px" :min="30" v-model:value="form.sync_interval_seconds" /><span class="ml-1">{{ $t('cloudenv.text_87') }}</span>
      <div slot="extra">{{$t('cloudenv.text_88')}}</div>
    </a-form-model-item>
  </div>
</template>

<script>
export default {
  props: {
    form: {
      type: Object,
      required: true,
    },
    formLayout: {
      type: Object,
    },
  },
  data () {
    return {
      showSecond: false,
    }
  },
  mounted () {
    if (this.form.enable_auto_sync === undefined) {
      this.form.enable_auto_sync = false
    }
    if (this.form.sync_interval_seconds === undefined) {
      this.form.sync_interval_seconds = 60
    }
    this.showSecond = !!this.form.enable_auto_sync
  },
  methods: {
    change (val) {
      this.showSecond = val
    },
  },
}
</script>
