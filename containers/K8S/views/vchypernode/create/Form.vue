<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form.fd" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name" :extra="$t('k8s.vc_hypernode_name_hint')">
        <a-input v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster" :extra="$t('k8s.vc_hypernode_cluster_hint')">
        <cluster-select v-model:value="form.fd.cluster" @input="onClusterInput" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_tier')" prop="tier" :extra="$t('k8s.vc_tier_hint')">
        <a-input-number v-model:value="form.fd.tier" :min="1" style="width: 200px" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_tier_name')" prop="tierName" :extra="$t('k8s.vc_tier_name_hint')">
        <a-input v-model:value="form.fd.tierName" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_member_type')" :extra="$t('k8s.vc_member_kind_hint')">
        <a-select v-model:value="memberKind" @change="setMemberKind">
          <a-select-option value="Node">{{ $t('k8s.vc_member_leaf') }}</a-select-option>
          <a-select-option value="HyperNode">{{ $t('k8s.vc_member_upper') }}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_members')" :extra="$t('k8s.vc_members_hint')">
        <div>
          <a-card v-for="(member, index) in members" :key="index" class="mb-3" size="small">
            <template v-if="members.length > 1" #extra>
              <a-button type="link" @click="removeMember(index)">{{ $t('k8s.vc_remove') }}</a-button>
            </template>
            <template v-if="memberKind === 'Node'">
              <a-form-model-item :label="$t('k8s.vc_selector')" :extra="$t('k8s.vc_selector_hint')" v-bind="nestedLayout">
                <a-select v-model:value="member.selector">
                  <a-select-option value="exact">{{ $t('k8s.vc_selector_exact') }}</a-select-option>
                  <a-select-option value="regex">{{ $t('k8s.vc_selector_regex') }}</a-select-option>
                  <a-select-option value="label">{{ $t('k8s.vc_selector_label') }}</a-select-option>
                </a-select>
              </a-form-model-item>
              <a-form-model-item v-if="member.selector === 'exact'" :label="$t('k8s.vc_exact_match')" :extra="$t('k8s.vc_exact_match_hint')" v-bind="nestedLayout">
                <base-select
                  v-model:value="member.exactMatch"
                  resource="nodes"
                  version="v1"
                  id-key="name"
                  :need-params="true"
                  :params="clusterListParams"
                  :select-props="{ placeholder: $t('k8s.vc_exact_match') }" />
              </a-form-model-item>
              <a-form-model-item v-else-if="member.selector === 'regex'" :label="$t('k8s.vc_pattern')" :extra="$t('k8s.vc_pattern_hint')" v-bind="nestedLayout">
                <a-input v-model:value="member.pattern" placeholder="node-[0-9]+" />
              </a-form-model-item>
              <template v-else>
                <a-form-model-item :label="$t('k8s.vc_label_key')" :extra="$t('k8s.vc_label_key_hint')" v-bind="nestedLayout">
                  <a-input v-model:value="member.labelKey" placeholder="topology-rack" />
                </a-form-model-item>
                <a-form-model-item :label="$t('k8s.vc_label_value')" :extra="$t('k8s.vc_label_value_hint')" v-bind="nestedLayout">
                  <a-input v-model:value="member.labelValue" placeholder="tor-1" />
                </a-form-model-item>
              </template>
            </template>
            <a-form-model-item v-else :label="$t('k8s.vc_exact_match')" :extra="$t('k8s.vc_exact_match_hint')" v-bind="nestedLayout">
              <base-select
                v-model:value="member.exactMatch"
                resource="vchypernodes"
                version="v1"
                id-key="name"
                :need-params="true"
                :params="clusterListParams"
                :select-props="{ placeholder: $t('k8s.vc_exact_match') }" />
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

function newMember (kind) {
  return {
    type: kind || 'Node',
    selector: kind === 'HyperNode' ? 'exact' : 'label',
    labelKey: '',
    labelValue: '',
    exactMatch: '',
    pattern: '',
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
      memberKind: 'Node',
      members: [newMember('Node')],
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
  computed: {
    clusterListParams () {
      if (!this.cluster) return {}
      return {
        cluster: this.cluster,
        limit: 0,
      }
    },
  },
  methods: {
    onClusterInput (v) {
      this.form.fd.cluster = v
      this.setCluster(v)
    },
    setMemberKind (kind) {
      this.memberKind = kind
      this.members = [newMember(kind)]
    },
    addMember () {
      this.members.push(newMember(this.memberKind))
    },
    removeMember (index) {
      this.members.splice(index, 1)
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return this.form.fd
    },
    buildMember (member) {
      if (this.memberKind === 'HyperNode') {
        const exactMatch = (member.exactMatch || '').trim()
        if (!exactMatch) {
          this.$message.error(this.$t('k8s.vc_exact_match_required'))
          throw new Error('exactMatch')
        }
        return { type: 'HyperNode', selector: 'exact', exactMatch }
      }
      const selector = member.selector || 'label'
      if (selector === 'exact') {
        const exactMatch = (member.exactMatch || '').trim()
        if (!exactMatch) {
          this.$message.error(this.$t('k8s.vc_exact_match_required'))
          throw new Error('exactMatch')
        }
        return { type: 'Node', selector: 'exact', exactMatch }
      }
      if (selector === 'regex') {
        const pattern = (member.pattern || '').trim()
        if (!pattern) {
          this.$message.error(this.$t('k8s.vc_pattern_required'))
          throw new Error('pattern')
        }
        try {
          // eslint-disable-next-line no-new
          new RegExp(pattern)
        } catch (e) {
          this.$message.error(this.$t('k8s.vc_pattern_invalid'))
          throw new Error('pattern')
        }
        return { type: 'Node', selector: 'regex', pattern }
      }
      const labelKey = (member.labelKey || '').trim()
      const labelValue = (member.labelValue || '').trim()
      if (!labelKey || !labelValue) {
        this.$message.error(this.$t('k8s.vc_node_label_required'))
        throw new Error('label')
      }
      return { type: 'Node', selector: 'label', labelKey, labelValue }
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
      return {
        name,
        cluster: values.cluster,
        tier,
        tierName,
        members: this.members.map(member => this.buildMember(member)),
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
