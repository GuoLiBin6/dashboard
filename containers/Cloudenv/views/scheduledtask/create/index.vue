<template>
  <div class="scheduletask">
    <page-header :title="$t('cloudenv.text_432')" />
    <page-body>
      <a-form-model
        ref="formRef"
        :model="form.fd"
        :rules="rules"
        hideRequiredMark>
        <a-form-model-item :label="$t('cloudenv.text_410', [$t('dictionary.project')])" class="mt-3" prop="project">
          <domain-project :form="form.fd" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_95')" prop="name" :extra="$t('cloudenv.name.extra')">
          <a-input :placeholder="$t('cloudenv.text_190')" v-model:value="form.fd.name" />
          <template v-slot:extra>
            <name-repeated res="scheduledtasks" :name="form.fd.name" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <scheduled-task-time ref="taskTime" :form="form" />
        <a-form-model-item :label="$t('cloudenv.text_384')" prop="resourceType">
          <a-select v-model:value="form.fd.resourceType">
            <a-select-option v-for="(v, k) in resourceTypeOpts" :key="k" :value="k">{{v}}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_425')" prop="action">
          <a-radio-group v-model:value="form.fd.action">
            <a-radio-button v-for="(v, k) in $tm('cloudenvScheduledtaskRuleAction')" :key="k" :value="k">{{v}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_439')" v-show="false">
          <a-radio-group v-model:value="form.fd.labelType">
            <a-radio-button v-for="(v, k) in $tm('cloudenvScheduledtaskLabelType')" :key="k" :value="k">{{v}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_440')" v-if="form.fd.labelType === 'id'" prop="servers">
          <list-select
            v-model:value="form.fd.servers"
            :list-props="resourceProps"
            :multiple="true"
            :formatter="formatter" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_16')" class="mb-0" v-if="form.fd.labelType === 'tag'" prop="tag">
          <tag :value="form.fd.tag" @change="v => form.fd.tag = v" :extra="$t('cloudenv.text_441')" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <template class="content" v-slot:right>
        <a-button class="mr-2" type="primary" @click="handleConfirm" :loading="loading">{{ $t('common.create') }}</a-button>
        <a-button @click="handleCancel">{{ $t('dialog.cancel') }}</a-button>
      </template>
    </page-footer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ScheduledTaskTime from '@Cloudenv/sections/ScheduledTaskTime'
import Tag from '@/sections/Tag'
import DomainProject from '@/sections/DomainProject/model'
import ListSelect from '@/sections/ListSelect'
import validateForm, { isRequired } from '@/utils/validate'
import NameRepeated from '@/sections/NameRepeated'
import ResourcePropsMixin from '../mixins/resourceProps'

export default {
  name: 'ScheduledtaskCreateIndex',
  components: {
    DomainProject,
    Tag,
    ListSelect,
    NameRepeated,
    ScheduledTaskTime,
  },
  mixins: [ResourcePropsMixin],
  data () {
    return {
      loading: false,
      resourceTypeOpts: { ...this.$tm('cloudenvScheduledtaskResourceType') },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
        ],
        resourceType: [
          { required: true, message: this.$t('cloudenv.text_448') },
        ],
        action: [
          { required: true, message: this.$t('cloudenv.text_449') },
        ],
        tag: [
          { required: true, message: this.$t('cloudenv.text_451') },
          { validator: validateForm('tagName') },
        ],
      },
      form: {
        fd: {
          name: '',
          description: '',
          domain: undefined,
          project: undefined,
          resourceType: 'server',
          action: 'start',
          labelType: 'id',
          servers: undefined,
          tag: {},
          cycleTimer: {
            cycle_type: 'day',
            week_days: [1, 2, 3, 4, 5],
            month_days: [1],
            cycle_num: 1,
            cycle_type2: 'month',
          },
          hourMinute: this.$moment().startOf('day').add(2, 'h'),
          startEndTime: undefined,
          timer: {
            execTime: this.$moment().add(1, 'h'),
          },
        },
      },
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
  },
  watch: {
    'form.fd.project' (project) {
      this.resourceProps.list.getParams.tenant = project && project.key
    },
  },
  created () {
    delete this.resourceTypeOpts.cloudaccount
  },
  methods: {
    generateData (values) {
      const { domain, project, name, description, action, labelType, servers, resourceType } = values
      const params = {
        generate_name: name,
        description,
        resource_type: resourceType,
        project_domain: (domain && domain.key) || this.userInfo.projectDomainId,
        project_id: (project && project.key) || this.userInfo.projectId,
        operation: action,
        label_type: labelType,
      }
      this.$refs.taskTime.transformParams(params, values)
      if (labelType === 'id') {
        params.labels = servers
      } else if (labelType === 'tag') {
        const tags = Object.keys(values.tag).map((k) => {
          return `${k}:${values.tag[k]}`
        })
        params.labels = tags
      }
      return params
    },
    async handleConfirm () {
      const manager = new this.$Manager('scheduledtasks', 'v1')
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        this.loading = true
        await manager.create({
          data: this.generateData(values),
        })
        this.goBack()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
    handleCancel () {
      this.goBack()
    },
    goBack () {
      this.$router.push('/scheduledtask')
    },
    formatter (val) {
      return `${val.name}`
    },
  },
}
</script>
