<template>
  <div>
    <a-card v-for="(task, taskIndex) in tasks" :key="taskIndex" class="mb-3" size="small" :title="taskTitle(taskIndex)">
      <template v-if="tasks.length > 1" #extra>
        <a-button type="link" @click="removeTask(taskIndex)">{{ $t('k8s.vc_remove') }}</a-button>
      </template>
      <a-form-model-item :label="$t('k8s.text_41')" :extra="$t('k8s.vc_task_name_hint')" v-bind="nestedLayout">
        <a-input v-model:value="task.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_replicas')" :extra="$t('k8s.vc_replicas_hint')" v-bind="nestedLayout">
        <a-input-number v-model:value="task.replicas" :min="1" style="width: 200px" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_restart_policy')" :extra="$t('k8s.vc_restart_policy_hint')" v-bind="nestedLayout">
        <a-select v-model:value="task.restartPolicy">
          <a-select-option value="OnFailure">OnFailure</a-select-option>
          <a-select-option value="Never">Never</a-select-option>
          <a-select-option value="Always">Always</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_container')" v-bind="nestedLayout">
        <div>
          <a-card v-for="(container, containerIndex) in task.containers" :key="containerIndex" class="mb-2" size="small">
            <template v-if="task.containers.length > 1" #extra>
              <a-button type="link" @click="removeContainer(taskIndex, containerIndex)">{{ $t('k8s.vc_remove') }}</a-button>
            </template>
            <a-form-model-item :label="$t('k8s.text_41')" :extra="$t('k8s.vc_container_name_hint')" v-bind="nestedLayout">
              <a-input v-model:value="container.name" />
            </a-form-model-item>
            <a-form-model-item :label="$t('k8s.vc_image')" :extra="$t('k8s.vc_image_hint')" v-bind="nestedLayout">
              <a-input v-model:value="container.image" placeholder="nginx" />
            </a-form-model-item>
            <a-form-model-item :label="$t('k8s.vc_image_pull_policy')" :extra="$t('k8s.vc_image_pull_policy_hint')" v-bind="nestedLayout">
              <a-select v-model:value="container.imagePullPolicy">
                <a-select-option value="IfNotPresent">IfNotPresent</a-select-option>
                <a-select-option value="Always">Always</a-select-option>
                <a-select-option value="Never">Never</a-select-option>
              </a-select>
            </a-form-model-item>
            <a-form-model-item :label="$t('k8s.vc_command')" :extra="$t('k8s.vc_command_hint')" v-bind="nestedLayout">
              <a-input v-model:value="container.command" placeholder="sleep 3600" />
            </a-form-model-item>
            <a-form-model-item :label="$t('k8s.vc_cpu_request')" :extra="$t('k8s.vc_cpu_request_hint')" v-bind="nestedLayout">
              <a-input v-model:value="container.cpu" placeholder="1" />
            </a-form-model-item>
            <a-form-model-item :label="$t('k8s.vc_cpu_limit')" :extra="$t('k8s.vc_cpu_limit_hint')" v-bind="nestedLayout">
              <a-input v-model:value="container.cpuLimit" :placeholder="$t('k8s.vc_limit_same_as_request')" />
            </a-form-model-item>
            <a-form-model-item :label="$t('k8s.vc_memory_request')" :extra="$t('k8s.vc_memory_request_hint')" v-bind="nestedLayout">
              <a-input v-model:value="container.memory" type="number" addonAfter="G" placeholder="1" :min="0" />
            </a-form-model-item>
            <a-form-model-item :label="$t('k8s.vc_memory_limit')" :extra="$t('k8s.vc_memory_limit_hint')" v-bind="nestedLayout">
              <a-input v-model:value="container.memoryLimit" type="number" addonAfter="G" :placeholder="$t('k8s.vc_limit_same_as_request')" :min="0" />
            </a-form-model-item>
          </a-card>
          <a-button type="dashed" @click="addContainer(taskIndex)">{{ $t('k8s.vc_add_container') }}</a-button>
        </div>
      </a-form-model-item>
    </a-card>
    <a-button type="dashed" @click="addTask">{{ $t('k8s.vc_add_task') }}</a-button>
  </div>
</template>

<script>
function newContainer () {
  return {
    name: '',
    image: '',
    imagePullPolicy: 'IfNotPresent',
    command: 'sleep 3600',
    cpu: '',
    cpuLimit: '',
    memory: '',
    memoryLimit: '',
  }
}

function newTask () {
  return {
    name: '',
    replicas: 1,
    restartPolicy: 'OnFailure',
    containers: [newContainer()],
  }
}

export default {
  name: 'K8sVcjobTaskEditor',
  props: {
    tasks: {
      type: Array,
      required: true,
    },
    nestedLayout: {
      type: Object,
      required: true,
    },
  },
  methods: {
    taskTitle (index) {
      return `${this.$t('k8s.vc_task')} ${index + 1}`
    },
    addTask () {
      this.tasks.push(newTask())
    },
    removeTask (index) {
      if (this.tasks.length <= 1) return
      this.tasks.splice(index, 1)
    },
    addContainer (taskIndex) {
      this.tasks[taskIndex].containers.push(newContainer())
    },
    removeContainer (taskIndex, containerIndex) {
      const containers = this.tasks[taskIndex].containers
      if (containers.length <= 1) return
      containers.splice(containerIndex, 1)
    },
  },
}
</script>
