<template>
  <a-form-model ref="formRef" :model="form" :rules="rules">
    <a-form-model-item :label="$t('network.ssh-proxy.port')" prop="port">
      <a-input-number v-model:value="form.port" />
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.vminstance.setup_ssh_authentication.method')" prop="method">
      <a-radio-group v-model:value="form.method" @change="onMethodChange">
        <a-radio-button v-for="m in METHODS" :value="m.value" :key="m.key">{{ m.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="form.method !== 'scripts'" prop="user">
      <template #label>
        <span>
          {{ $t('compute.text_163') }}
          <a-tooltip :title="$t('compute.vminstance.setup_ssh_authentication.create.username.tips')">
            <icon type="question-circle" />
          </a-tooltip>
        </span>
      </template>
      <a-input v-model:value="form.user" />
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_108')" v-if="form.method === 'keypair'" prop="private_key">
      <a-textarea :placeholder="$t('compute.text_797')" v-model:value="form.private_key" />
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_340')" v-if="form.method === 'password'" prop="password">
      <a-input-password :placeholder="$t('compute.text_204')" v-model:value="form.password" />
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.vminstance.setup_ssh_authentication.method.script')" v-if="form.method === 'scripts'">
      <a-alert :message="$t('compute.vminstance.setup_ssh_authentication.method.script.tips')" banner />
      <code-mirror :value="scripts" :options="cmOptions" />
      <div class="text-right">
        <a-button
          type="link"
          icon="copy"
          class="pl-0 pr-0"
          @click="handleCopy">{{$t('compute.text_801')}}</a-button>
      </div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import 'codemirror/mode/shell/shell'

export default {
  name: 'SetupSshForm',
  props: {
    servers: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      METHODS: [
        { key: 'keypair', value: 'keypair', label: this.$t('compute.text_108') },
        { key: 'password', value: 'password', label: this.$t('compute.text_340') },
        { key: 'scripts', value: 'scripts', label: this.$t('compute.vminstance.setup_ssh_authentication.method.script') },
      ],
      scripts: '',
      cmOptions: {
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
        line: true,
        readOnly: true,
        theme: 'material',
      },
      form: {
        port: 22,
        method: 'keypair',
        user: '',
        password: undefined,
        private_key: undefined,
      },
    }
  },
  computed: {
    rules () {
      const rules = {
        port: [
          { required: true, message: this.$t('network.text_176') },
          { type: 'number', min: 1, max: 65535, message: this.$t('network.text_347') },
        ],
      }
      if (this.form.method !== 'scripts') {
        rules.user = [
          { required: true, message: this.$t('compute.text_210'), trigger: 'blur' },
        ]
      }
      if (this.form.method === 'keypair') {
        rules.private_key = [
          { required: true, message: this.$t('compute.vminstance.setup_ssh_authentication.keypair.tips') },
        ]
      }
      if (this.form.method === 'password') {
        rules.password = [
          { required: true, message: this.$t('compute.text_204') },
        ]
      }
      return rules
    },
  },
  methods: {
    onMethodChange (e) {
      const val = e?.target?.value ?? e
      this.form.method = val
      if (val === 'scripts') {
        this.fetchScripts()
      }
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
    handleSubmitResult (ret) {
      const tasks = {}
      for (const item of ret) {
        if (item.data && item.data.ansible_playbook_id) {
          tasks[item.id] = item.data.ansible_playbook_id
        } else {
          console.log('make-sshable', item)
        }
      }
      this.$emit('tasks', tasks)
    },
    async submit () {
      try {
        if (!this.servers) {
          console.log('no servers to submit make-sshable')
          return
        }
        const values = await this.validateForm()
        if (this.form.method === 'scripts') {
          await new this.$Manager('servers').batchUpdate({ ids: this.servers, data: { ssh_port: values.port } })
          this.$emit('tasks', {})
          return
        }
        const ret = await new this.$Manager('servers').batchPerformAction({
          action: 'make-sshable',
          ids: this.servers,
          data: values,
        })
        if (!ret.data || !ret.data.data) {
          console.log('make-sshable empty result', ret)
          return
        }
        this.handleSubmitResult(ret.data.data)
      } catch (error) {
        throw error
      }
    },
    async fetchScripts () {
      if (!this.servers) {
        console.log('no servers to fetch make-sshable-cmd')
        return
      }
      try {
        this.scripts = this.$t('scope.text_184')
        const ret = await new this.$Manager('servers').getSpecific({ id: this.servers[0], spec: 'make-sshable-cmd' })
        this.scripts = ret.data.shell_cmd
      } catch (error) {
        if (error.response.status === 404) {
          this.scripts = error.response.data.class
        } else {
          this.scripts = this.$t('common_340')
        }
        throw error
      }
    },
    handleCopy () {
      this.$copyText(this.scripts).then(() => {
        this.$message.success(this.$t('compute.text_802'))
      }).catch(() => {
        this.$message.error(this.$t('compute.text_803'))
      })
    },
  },
}
</script>

<style scoped>
</style>
