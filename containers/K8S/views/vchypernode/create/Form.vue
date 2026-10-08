<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form.fd" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.fd.cluster" @input="onClusterInput" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_tier')" prop="tier">
        <a-input-number v-model:value="form.fd.tier" :min="1" style="width: 200px" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_tier_name')" prop="tierName">
        <a-input v-model:value="form.fd.tierName" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_members')">
        <div>
          <a-card v-for="(member, index) in members" :key="index" class="mb-3" size="small">
            <template v-if="members.length > 1" #extra>
              <a-button type="link" @click="removeMember(index)">{{ $t('k8s.vc_remove') }}</a-button>
            </template>
            <a-form-model-item :label="$t('k8s.vc_member_type')" v-bind="nestedLayout">
              <a-select v-model:value="member.type">
                <a-select-option value="Node">Node</a-select-option>
                <a-select-option value="HyperNode">HyperNode</a-select-option>
              </a-select>
            </a-form-model-item>
            <template v-if="member.type === 'Node'">
              <a-form-model-item :label="$t('k8s.vc_label_key')" v-bind="nestedLayout">
                <a-input v-model:value="member.labelKey" placeholder="tor" />
              </a-form-model-item>
              <a-form-model-item :label="$t('k8s.vc_label_value')" v-bind="nestedLayout">
                <a-input v-model:value="member.labelValue" placeholder="tor1" />
              </a-form-model-item>
            </template>
            <a-form-model-item v-else :label="$t('k8s.vc_exact_match')" v-bind="nestedLayout">
              <a-input v-model:value="member.exactMatch" placeholder="s0" />
            </a-form-model-item>
          </a-card>
          <a-button type="dashed" @click="addMember">{{ $t('k8s.vc_add_member') }}</a-button>
        </div>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import k8sCreateMixin from '@K8S/mixins/create'

function newMember () {
  return {
    type: 'Node',
    labelKey: 'tor',
    labelValue: '',
    exactMatch: '',
  }
}

export default {
  name: 'K8sVchypernodeForm',
  components: {
    ClusterSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        fd: {
          name: '',
          cluster: this.$store.state.common.k8s.cluster,
          tier: 1,
          tierName: '',
        },
      },
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
      },
      nestedLayout: {
        labelCol: { span: 5 },
        wrapperCol: { span: 19 },
      },
      members: [newMember()],
      rules: {
        name: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        tier: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        tierName: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
      },
    }
  },
  methods: {
    onClusterInput (v) {
      this.form.fd.cluster = v
      this.setCluster(v)
    },
    addMember () {
      this.members.push(newMember())
    },
    removeMember (index) {
      this.members.splice(index, 1)
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return this.form.fd
    },
    buildPayload (values) {
      const tier = Number(values.tier)
      const tierName = (values.tierName || '').trim()
      const name = (values.name || '').trim()
      if (!Number.isInteger(tier) || tier < 1) {
        this.$message.error(this.$t('k8s.vc_tier_invalid'))
        throw new Error('tier')
      }
      if (!tierName) {
        this.$message.error(this.$t('k8s.vc_tier_name_required'))
        throw new Error('tierName')
      }
      if (!this.members.length) {
        this.$message.error(this.$t('k8s.vc_members_required'))
        throw new Error('members')
      }
      const members = this.members.map(member => {
        if (member.type === 'HyperNode') {
          const exactMatch = (member.exactMatch || '').trim()
          if (!exactMatch) {
            this.$message.error(this.$t('k8s.vc_exact_match_required'))
            throw new Error('exactMatch')
          }
          return { type: 'HyperNode', exactMatch }
        }
        const labelKey = (member.labelKey || '').trim()
        const labelValue = (member.labelValue || '').trim()
        if (!labelKey || !labelValue) {
          this.$message.error(this.$t('k8s.vc_node_label_required'))
          throw new Error('label')
        }
        return { type: 'Node', labelKey, labelValue }
      })
      return {
        name,
        cluster: values.cluster,
        tier,
        tierName,
        members,
      }
    },
    async doCreate () {
      const values = await this.validateForm()
      const data = this.buildPayload(values)
      await new this.$Manager('vchypernodes', 'v1').create({ data })
      this.$message.success(this.$t('k8s.text_46'))
    },
  },
}
</script>
