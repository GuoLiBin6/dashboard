<template>
  <div class="w-75">
    <a-tabs
      class="vc-scenario-tabs"
      :activeKey="scenario"
      :animated="false"
      @change="setScenario">
      <a-tab-pane key="topology" :tab="$t('k8s.vc_scenario_topology')" />
      <a-tab-pane key="gang" :tab="$t('k8s.vc_scenario_gang')" />
      <a-tab-pane key="priority" :tab="$t('k8s.vc_scenario_priority')" />
      <a-tab-pane key="tidal" :tab="$t('k8s.vc_scenario_tidal')" />
      <a-tab-pane key="custom" :tab="$t('k8s.vc_scenario_custom')" />
    </a-tabs>
    <div class="vc-scenario-hint">{{ scenarioHint }}</div>
    <a-form-model ref="formRef" :model="form.fd" :rules="rules">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name" :extra="$t('k8s.vc_job_name_hint')">
        <a-input v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster" :extra="$t('k8s.vc_job_cluster_hint')">
        <cluster-select v-model:value="form.fd.cluster" @input="onClusterInput" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="namespace" :extra="$t('k8s.vc_job_namespace_hint')">
        <namespace-select v-model:value="form.fd.namespace" @input="onNamespaceInput" :cluster="cluster" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_queue_field')" prop="queue" :extra="queueExtra">
        <base-select
          v-model:value="form.fd.queue"
          resource="vcqueues"
          version="v1"
          id-key="name"
          :need-params="true"
          :params="clusterListParams"
          :select-props="{ placeholder: $t('k8s.vc_queue_field') }" />
      </a-form-model-item>
      <template v-if="scenario === 'topology'">
        <a-form-model-item :label="$t('k8s.vc_network_topology')" prop="networkTopologyMode" :extra="$t('k8s.vc_network_topology_hint')">
          <a-select v-model:value="form.fd.networkTopologyMode" @change="setTopologyMode">
            <a-select-option value="hard">{{ $t('k8s.vc_topology_hard') }}</a-select-option>
            <a-select-option value="soft">{{ $t('k8s.vc_topology_soft') }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.vc_highest_tier')" prop="highestTierAllowed" :extra="$t('k8s.vc_highest_tier_hint')">
          <a-input-number v-model:value="form.fd.highestTierAllowed" :min="1" style="width: 200px" />
        </a-form-model-item>
      </template>
      <a-form-model-item v-if="scenario === 'gang'" :label="$t('k8s.vc_gang_mode')" :extra="$t('k8s.vc_gang_mode_hint')">
        <a-radio-group v-model:value="gangMode">
          <a-radio value="all">{{ $t('k8s.vc_gang_all') }}</a-radio>
          <a-radio value="partial">{{ $t('k8s.vc_gang_partial') }}</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item v-if="scenario === 'priority'" :label="$t('k8s.vc_priority_class')" prop="priorityClassName" :extra="$t('k8s.vc_priority_class_hint')">
        <base-select
          v-model:value="form.fd.priorityClassName"
          resource="priorityclasses"
          version="v1"
          id-key="name"
          option-label-prop="label"
          :label-format="priorityLabel"
          :need-params="true"
          :params="clusterListParams"
          :select-props="{ placeholder: $t('k8s.vc_priority_class') }" />
      </a-form-model-item>
      <template v-if="scenario === 'custom'">
        <a-form-model-item :label="$t('k8s.vc_min_available')" prop="minAvailable" :extra="$t('k8s.vc_min_available_hint')">
          <a-input-number v-model:value="form.fd.minAvailable" :min="1" style="width: 200px" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.vc_priority_class')" prop="priorityClassName" :extra="priorityClassExtra">
          <base-select
            v-model:value="form.fd.priorityClassName"
            resource="priorityclasses"
            version="v1"
            id-key="name"
            option-label-prop="label"
            :label-format="priorityLabel"
            :need-params="true"
            :params="clusterListParams"
            :select-props="{ allowClear: true, placeholder: $t('k8s.vc_priority_class') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.vc_restart_on_evict')" prop="restartOnEvict" :extra="$t('k8s.vc_restart_on_evict_hint')">
          <a-switch v-model:checked="form.fd.restartOnEvict" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.vc_network_topology')" prop="networkTopologyMode" :extra="$t('k8s.vc_network_topology_hint')">
          <a-select v-model:value="form.fd.networkTopologyMode" @change="setTopologyMode">
            <a-select-option value="none">{{ $t('k8s.vc_topology_none') }}</a-select-option>
            <a-select-option value="hard">{{ $t('k8s.vc_topology_hard') }}</a-select-option>
            <a-select-option value="soft">{{ $t('k8s.vc_topology_soft') }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item v-if="topologyMode" :label="$t('k8s.vc_highest_tier')" prop="highestTierAllowed" :extra="$t('k8s.vc_highest_tier_hint')">
          <a-input-number v-model:value="form.fd.highestTierAllowed" :min="1" style="width: 200px" />
        </a-form-model-item>
        <a-form-model-item :label="$t('k8s.vc_task')">
          <task-editor :tasks="tasks" :nested-layout="nestedLayout" />
        </a-form-model-item>
      </template>
      <a-form-model-item v-if="showScenarioMinAvailable" :label="$t('k8s.vc_min_available')" prop="minAvailable" :extra="minAvailableExtra">
        <a-input-number v-model:value="form.fd.minAvailable" :min="1" :max="minAvailableMax" style="width: 200px" />
      </a-form-model-item>
      <a-form-model-item v-if="scenario !== 'custom'" :label="$t('k8s.vc_task')">
        <task-editor :tasks="tasks" :nested-layout="nestedLayout" />
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import k8sCreateMixin from '@K8S/mixins/create'
import TaskEditor from './TaskEditor'

function memoryQuantity (value) {
  const v = String(value == null ? '' : value).trim()
  if (!v) return ''
  if (/^\d+(\.\d+)?$/.test(v)) return `${v}G`
  return v
}

export default {
  name: 'K8sVcjobCreateForm',
  components: {
    ClusterSelect,
    NamespaceSelect,
    TaskEditor,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        fd: {
          name: '',
          cluster: this.$store.state.common.k8s.cluster,
          namespace: this.$store.state.common.k8s.namespace,
          queue: 'default',
          minAvailable: 1,
          priorityClassName: '',
          restartOnEvict: false,
          networkTopologyMode: 'hard',
          highestTierAllowed: 1,
        },
      },
      nestedLayout: {
        labelCol: { span: 5 },
        wrapperCol: { span: 19 },
      },
      scenario: 'topology',
      gangMode: 'all',
      topologyMode: 'hard',
      tasks: [{
        name: 'worker',
        replicas: 1,
        restartPolicy: 'OnFailure',
        containers: [{
          name: 'c',
          image: 'registry.cn-beijing.aliyuncs.com/yunionio/busybox:1.35.0',
          imagePullPolicy: 'IfNotPresent',
          command: 'sleep 3600',
          cpu: '',
          cpuLimit: '',
          memory: '',
          memoryLimit: '',
        }],
      }],
      rules: {
        name: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        namespace: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        queue: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        minAvailable: [
          { required: true, message: this.$t('k8s.vc_min_available_invalid') },
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
    scenarioHint () {
      const key = {
        topology: 'k8s.vc_scenario_topology_hint',
        gang: 'k8s.vc_scenario_gang_hint',
        priority: 'k8s.vc_scenario_priority_hint',
        tidal: 'k8s.vc_scenario_tidal_hint',
        custom: 'k8s.vc_scenario_custom_hint',
      }[this.scenario]
      return this.$t(key || 'k8s.vc_scenario_custom_hint')
    },
    replicaSum () {
      return this.tasks.reduce((sum, task) => sum + Number(task.replicas || 0), 0)
    },
    elasticMinAvailable () {
      return this.scenario === 'priority' || this.scenario === 'tidal' || (this.scenario === 'gang' && this.gangMode === 'partial')
    },
    showScenarioMinAvailable () {
      return this.scenario === 'topology' || this.elasticMinAvailable
    },
    minAvailableMax () {
      if (!this.elasticMinAvailable) return Math.max(this.replicaSum, 1)
      const cap = this.replicaSum - 1
      return cap >= 1 ? cap : undefined
    },
    minAvailableExtra () {
      const key = {
        topology: 'k8s.vc_min_available_topology_hint',
        gang: 'k8s.vc_min_available_gang_hint',
        priority: 'k8s.vc_min_available_priority_hint',
        tidal: 'k8s.vc_min_available_tidal_hint',
      }[this.scenario]
      return this.$t(key || 'k8s.vc_min_available_hint')
    },
    queueExtra () {
      if (this.scenario === 'tidal') return this.$t('k8s.vc_scenario_tidal_queue_hint')
      return this.$t('k8s.vc_job_queue_hint')
    },
    priorityClassExtra () {
      const hint = this.$t('k8s.vc_priority_class_hint')
      if (!this.topologyMode) return hint
      return `${hint} ${this.$t('k8s.vc_priority_no_preempt_hint')}`
    },
  },
  watch: {
    gangMode (mode) {
      if (this.scenario !== 'gang' || mode !== 'partial') return
      this.form.fd.minAvailable = 1
    },
  },
  methods: {
    onClusterInput (v) {
      this.form.fd.cluster = v
      this.setCluster(v)
    },
    onNamespaceInput (v) {
      this.form.fd.namespace = v
      this.setNamespace(v)
    },
    priorityLabel (item) {
      if (!item) return ''
      const name = item.name || ''
      if (item.value === undefined || item.value === null || item.value === '') return name
      return `${name} (${item.value})`
    },
    setScenario (value) {
      this.scenario = value
      if (value === 'topology') {
        this.topologyMode = 'hard'
        this.form.fd.networkTopologyMode = 'hard'
        this.form.fd.highestTierAllowed = 1
        this.form.fd.minAvailable = this.replicaSum || 1
        return
      }
      this.topologyMode = ''
      if (value === 'custom') {
        this.form.fd.networkTopologyMode = 'none'
        this.form.fd.minAvailable = 1
        this.form.fd.restartOnEvict = false
        this.form.fd.priorityClassName = ''
        return
      }
      if (value === 'priority' || value === 'tidal' || (value === 'gang' && this.gangMode === 'partial')) {
        this.form.fd.minAvailable = 1
      }
    },
    setTopologyMode (value) {
      this.topologyMode = value && value !== 'none' ? value : ''
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return this.form.fd
    },
    fail (key) {
      const error = new Error(key)
      this.$message.error(this.$t(key))
      return error
    },
    validateTasks (minAvailable) {
      if (!this.tasks.length) {
        throw this.fail('k8s.vc_task_required')
      }
      let replicas = 0
      this.tasks.forEach(task => {
        const replicasNum = Number(task.replicas)
        if (!Number.isInteger(replicasNum) || replicasNum < 1) {
          throw this.fail('k8s.vc_replicas_invalid')
        }
        if (!(task.name || '').trim()) {
          throw this.fail('k8s.vc_task_name_required')
        }
        if (!task.containers.length) {
          throw this.fail('k8s.vc_container_required')
        }
        task.containers.forEach(container => {
          if (!(container.name || '').trim()) {
            throw this.fail('k8s.vc_container_name_required')
          }
          if (!(container.image || '').trim()) {
            throw this.fail('k8s.vc_image_required')
          }
        })
        replicas += replicasNum
      })
      if (minAvailable > replicas) {
        throw this.fail('k8s.vc_min_available_gt_replicas')
      }
    },
    readMinAvailable (values, replicas, belowReplicas) {
      const minAvailable = Number(values.minAvailable)
      if (!Number.isInteger(minAvailable) || minAvailable < 1) {
        throw this.fail('k8s.vc_min_available_invalid')
      }
      if (belowReplicas) {
        if (replicas < 2 || minAvailable >= replicas) {
          throw this.fail('k8s.vc_min_available_elastic_cap')
        }
      } else if (minAvailable > replicas) {
        throw this.fail('k8s.vc_min_available_gt_replicas')
      }
      return minAvailable
    },
    scenarioPayload (values, replicas) {
      if (this.scenario === 'topology') {
        return {
          minAvailable: this.readMinAvailable(values, replicas, false),
          restartOnEvict: false,
          priorityClassName: '',
          topologyMode: values.networkTopologyMode === 'soft' ? 'soft' : 'hard',
        }
      }
      if (this.scenario === 'gang') {
        const partial = this.gangMode === 'partial'
        return {
          minAvailable: partial ? this.readMinAvailable(values, replicas, true) : replicas,
          restartOnEvict: false,
          priorityClassName: '',
          topologyMode: '',
        }
      }
      if (this.scenario === 'priority') {
        const priorityClassName = (values.priorityClassName || '').trim()
        if (!priorityClassName) throw this.fail('k8s.vc_priority_class_required')
        return {
          minAvailable: this.readMinAvailable(values, replicas, true),
          restartOnEvict: true,
          priorityClassName,
          topologyMode: '',
        }
      }
      return {
        minAvailable: this.readMinAvailable(values, replicas, true),
        restartOnEvict: true,
        priorityClassName: '',
        topologyMode: '',
      }
    },
    buildPayload (values) {
      let minAvailable = Number(values.minAvailable)
      let restartOnEvict = values.restartOnEvict === true
      let priorityClassName = (values.priorityClassName || '').trim()
      let topologyMode = (values.networkTopologyMode && values.networkTopologyMode !== 'none')
        ? values.networkTopologyMode
        : ''
      if (this.scenario !== 'custom') {
        const preset = this.scenarioPayload(values, this.replicaSum)
        minAvailable = preset.minAvailable
        restartOnEvict = preset.restartOnEvict
        priorityClassName = preset.priorityClassName
        topologyMode = preset.topologyMode
      }
      if (!Number.isInteger(minAvailable) || minAvailable < 1) {
        throw this.fail('k8s.vc_min_available_invalid')
      }
      this.validateTasks(minAvailable)
      const payload = {
        name: values.name.trim(),
        cluster: values.cluster,
        namespace: values.namespace,
        queue: values.queue.trim(),
        minAvailable,
        schedulerName: 'volcano',
        priorityClassName,
        restartOnEvict,
        tasks: this.tasks.map(task => ({
          name: task.name.trim(),
          replicas: Number(task.replicas),
          restartPolicy: task.restartPolicy || 'OnFailure',
          containers: task.containers.map(container => ({
            name: container.name.trim(),
            image: container.image.trim(),
            imagePullPolicy: container.imagePullPolicy || 'IfNotPresent',
            command: (container.command || '').trim(),
            cpu: (container.cpu || '').trim(),
            cpuLimit: (container.cpuLimit || '').trim(),
            memory: memoryQuantity(container.memory),
            memoryLimit: memoryQuantity(container.memoryLimit),
          })),
        })),
      }
      if (topologyMode === 'hard' || topologyMode === 'soft') {
        const tier = Number(values.highestTierAllowed)
        if (!Number.isInteger(tier) || tier < 1) {
          throw this.fail('k8s.vc_tier_invalid')
        }
        payload.networkTopologyMode = topologyMode
        payload.highestTierAllowed = tier
      }
      return payload
    },
    async doCreate () {
      const values = await this.validateForm()
      const data = this.buildPayload(values)
      await new this.$Manager('vcjobs', 'v1').create({ data })
      this.$message.success(this.$t('k8s.text_46'))
    },
  },
}
</script>

<style scoped>
.vc-scenario-tabs ::v-deep .ant-tabs-content {
  display: none;
}
.vc-scenario-tabs ::v-deep .ant-tabs-bar {
  margin-bottom: 8px;
}
.vc-scenario-hint {
  margin-bottom: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
}
</style>
