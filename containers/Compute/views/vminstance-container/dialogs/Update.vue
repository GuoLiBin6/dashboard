<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('compute.container', [])" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.repo.edit_mode')">
          <a-radio-group v-model:value="editMode">
            <a-radio-button value="custom">{{ $t('compute.repo.edit_mode.custom') }}</a-radio-button>
            <a-radio-button value="yaml">{{ $t('compute.repo.edit_mode.yaml') }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <template v-if="editMode === 'custom'">
          <a-form-model-item :label="$t('compute.repo.image.source')">
            <a-radio-group :value="source" @change="handleSourceChange">
              <a-radio-button value="custom">{{ $t('compute.repo.image.custom') }}</a-radio-button>
              <a-radio-button value="registry">{{ $t('compute.repo.image.registry') }}</a-radio-button>
              <a-radio-button value="container_image">{{ $t('compute.repo.image.container_image') }}</a-radio-button>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item v-if="source === 'custom'" :label="$t('compute.repo.container_image')" prop="image">
            <a-input
              v-model:value="form.image"
              :placeholder="$t('common.tips.input', [$t('compute.repo.container_image')])" />
          </a-form-model-item>
          <a-form-model-item v-else-if="source === 'registry'" :label="$t('compute.repo.container_image')" prop="registryImage">
            <mirror-registry
              :value="form.registryImage"
              @change="v => form.registryImage = v"
              @credential-change="handleCredentialChange" />
          </a-form-model-item>
          <a-form-model-item v-else :label="$t('compute.repo.container_image')" prop="containerImageId">
            <a-select
              v-model:value="form.containerImageId"
              showSearch
              :filterOption="filterOption"
              :loading="containerImageLoading"
              :placeholder="$t('common.tips.select', [$t('compute.repo.image.container_image')])"
              @change="handleContainerImageChange"
              allowClear>
              <a-select-option
                v-for="img in containerImages"
                :key="img.value"
                :value="img.value"
                :label="img.label">
                <div>{{ img.label }}</div>
                <div style="font-size: 12px; color: #999;">{{ img.ref }}</div>
              </a-select-option>
            </a-select>
            <div v-if="!containerImageLoading && containerImages.length === 0" class="mt-2">
              <a-alert type="info" show-icon>
                <template slot="message">
                  {{ $t('compute.repo.image.container_image.empty_tip') }}
                  <router-link to="/container_image">{{ $t('compute.repo.image.container_image.manage') }}</router-link>
                </template>
              </a-alert>
            </div>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.repo.command')" prop="command">
            <a-input v-model:value="form.command" :disabled="imageHasCommand" :placeholder="$t('compute.repo.command.placeholder')" />
            <div v-if="imageHasCommand" class="ant-form-explain">{{ $t('compute.repo.image.container_image.locked_tip') }}</div>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.repo.command.params')" prop="arg">
            <a-input v-model:value="form.arg" :disabled="imageHasArgs" :placeholder="$t('compute.repo.command.params.placeholder')" />
            <div v-if="imageHasArgs" class="ant-form-explain">{{ $t('compute.repo.image.container_image.locked_tip') }}</div>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.repo.env_variables')">
            <labels
              ref="envRef"
              v-model:value="form.envs"
              :title="$t('compute.repo.variables')"
              :keyLabel="$t('compute.repo.variables')"
              :readonly-keys="lockedEnvKeys" />
            <div v-if="lockedEnvKeys.length" class="ant-form-explain">{{ $t('compute.repo.image.container_image.env_locked_tip') }}</div>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.repo.capabilities.add')" prop="capAdd">
            <a-select
              v-model:value="form.capAdd"
              mode="multiple"
              :placeholder="$t('compute.repo.capabilities.add.placeholder')"
              optionLabelProp="label"
              allowClear>
              <a-select-option v-for="cap in capabilityOptions" :key="cap.value" :value="cap.value" :label="cap.label">
                <span>{{ cap.label }}</span>
                <span style="color: rgba(0,0,0,.45); margin-left: 8px; font-size: 12px;">{{ cap.description }}</span>
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.repo.capabilities.drop')" prop="capDrop">
            <a-select
              v-model:value="form.capDrop"
              mode="multiple"
              :placeholder="$t('compute.repo.capabilities.drop.placeholder')"
              optionLabelProp="label"
              allowClear>
              <a-select-option v-for="cap in capabilityOptions" :key="cap.value" :value="cap.value" :label="cap.label">
                <span>{{ cap.label }}</span>
                <span style="color: rgba(0,0,0,.45); margin-left: 8px; font-size: 12px;">{{ cap.description }}</span>
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="" prop="privileged">
            <a-checkbox v-model:checked="form.privileged">{{$t('compute.repo.privileged_mode')}}</a-checkbox>
          </a-form-model-item>
        </template>
        <template v-else>
          <a-form-model-item :label="$t('compute.yaml_config')" prop="yaml">
            <div class="yaml-config-wrapper">
              <code-mirror :value="form.yaml" @change="v => form.yaml = v" :options="cmOptions" />
            </div>
          </a-form-model-item>
        </template>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import jsYaml from 'js-yaml'
import MirrorRegistry from '@Compute/sections/MirrorRegistry'
import Labels from '@Compute/sections/Labels/model'
import { CAPABILITY_OPTIONS } from '@Compute/views/vminstance-container/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { validateYaml } from '@/utils/validate'
export default {
  name: 'ContainerUpdateDialog',
  components: {
    MirrorRegistry,
    Labels,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const specData = this.params.data[0].spec || {}
    let initialSource = 'custom'
    if (specData.container_image_id) {
      initialSource = 'container_image'
    } else if (specData.image_credential_id) {
      initialSource = 'registry'
    }

    return {
      loading: false,
      action: this.$t('common.edit'),
      source: initialSource,
      editMode: 'custom',
      containerImageLoading: false,
      containerImages: [],
      selectedImage: null,
      lockedEnvKeys: [],
      form: {
        image: specData.image,
        registryImage: undefined,
        imageCredentialId: specData.image_credential_id,
        containerImageId: specData.container_image_id,
        command: specData.command?.join(' '),
        arg: specData.args?.join(' '),
        envs: [],
        capAdd: specData.capabilities?.add || [],
        capDrop: specData.capabilities?.drop || [],
        privileged: !!specData.privileged,
        yaml: jsYaml.safeDump(this.params.data[0]),
      },
      rules: {
        registryImage: [
          { required: true, message: this.$t('common.tips.select', [this.$t('compute.eci.repo.image.registry')]) },
        ],
        containerImageId: [
          { required: true, message: this.$t('common.tips.select', [this.$t('compute.repo.image.container_image')]) },
        ],
        image: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('compute.repo.container_image')}` },
        ],
        yaml: [
          { required: true, message: this.$t('common.tips.input', ['Yaml']) },
          {
            validator: (rule, value, _callback) => {
              validateYaml(value)
                .then(() => {
                  return _callback()
                })
                .catch(() => {
                  return _callback(this.$t('compute.yaml_check_tip'))
                })
            },
          },
        ],
      },
      cmOptions: {
        tabSize: 2,
        styleActiveLine: true,
        lineNumbers: true,
        line: true,
        mode: 'text/x-yaml',
        theme: 'material',
      },
      capabilityOptions: CAPABILITY_OPTIONS,
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    columns () {
      const showFields = ['name', 'status']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    selectItems () {
      return this.params.data
    },
    imageHasCommand () {
      return !!(this.selectedImage && (this.selectedImage.command || []).filter(Boolean).length)
    },
    imageHasArgs () {
      return !!(this.selectedImage && (this.selectedImage.args || []).filter(Boolean).length)
    },
  },
  watch: {
    source (val) {
      if (val === 'container_image' && this.containerImages.length === 0 && !this.containerImageLoading) {
        this.fetchContainerImages()
      }
    },
  },
  mounted () {
    if (this.source === 'container_image') {
      this.fetchContainerImages().then(() => {
        this.syncSelectedImage()
      }).catch(() => {})
    }
    setTimeout(() => {
      const envs = this.selectItems[0].spec?.envs || []
      if (this.$refs.envRef) {
        this.$refs.envRef.initData(envs.map(v => ({ key: v.key, value: v.value })))
      }
    }, 500)
  },
  methods: {
    filterOption (input, option) {
      const label = option.componentOptions?.propsData?.label || option.label || ''
      return label.toLowerCase().indexOf((input || '').toLowerCase()) >= 0
    },
    async fetchContainerImages () {
      try {
        this.containerImageLoading = true
        const manager = new this.$Manager('container_images', 'v1')
        const result = await manager.list({
          params: {
            details: true,
            limit: 100,
            scope: this.$store.getters.scope,
          },
        })
        const dataArr = result.data.data || []
        this.containerImages = dataArr.map(item => ({
          label: item.name || `${item.image_name}:${item.image_label}`,
          value: item.id,
          ref: `${item.image_name}:${item.image_label}`,
          command: item.command || [],
          args: item.args || [],
          envs: item.envs || [],
        }))
      } catch (error) {
        throw error
      } finally {
        this.containerImageLoading = false
      }
    },
    findContainerImage (imageId) {
      return this.containerImages.find(img => img.value === imageId) || null
    },
    syncSelectedImage () {
      const imageId = this.form.containerImageId
      const image = this.findContainerImage(imageId || this.params.data[0].spec?.container_image_id)
      if (!image) return
      this.selectedImage = image
      this.lockedEnvKeys = (image.envs || []).map(env => env.key).filter(Boolean)
    },
    readEnvRows () {
      if (this.$refs.envRef?.getPairs) {
        return this.$refs.envRef.getPairs()
      }
      return this.form.envs || []
    },
    imageEnvRows (image) {
      return ((image && image.envs) || [])
        .filter(env => env.key && !env.value_from)
        .map(env => ({ key: env.key, value: env.value }))
    },
    mergeImageEnvs (baseRows, imageEnvs) {
      const out = []
      const indexByKey = {}
      ;(baseRows || []).forEach((row) => {
        const key = (row.key || '').trim()
        if (!key) return
        indexByKey[key] = out.length
        out.push({ key, value: row.value })
      })
      ;(imageEnvs || []).forEach((env) => {
        const key = (env.key || '').trim()
        if (!key) return
        if (indexByKey[key] !== undefined) {
          out[indexByKey[key]] = { key: out[indexByKey[key]].key, value: env.value }
          return
        }
        indexByKey[key] = out.length
        out.push({ key, value: env.value })
      })
      return out
    },
    applyImageDefaults (image, options = {}) {
      const { refillCommand = true, keepExistingEnvs = true } = options
      this.selectedImage = image || null
      const envs = (image && image.envs) || []
      this.lockedEnvKeys = envs.map(env => env.key).filter(Boolean)
      if (image && refillCommand) {
        const command = (image.command || []).filter(Boolean)
        const args = (image.args || []).filter(Boolean)
        if (command.length) this.form.command = command.join(' ')
        if (args.length) this.form.arg = args.join(' ')
      }
      const envRef = this.$refs.envRef
      if (!envRef) return
      const base = keepExistingEnvs ? this.readEnvRows() : []
      const rows = this.mergeImageEnvs(base, this.imageEnvRows(image))
      envRef.reset()
      if (rows.length) {
        this.$nextTick(() => {
          envRef.initData(rows)
        })
      }
    },
    handleContainerImageChange (value) {
      this.applyImageDefaults(this.findContainerImage(value))
    },
    handleSourceChange (e) {
      this.source = e.target.value
      this.selectedImage = null
      this.lockedEnvKeys = []
      this.form.image = undefined
      this.form.registryImage = undefined
      this.form.imageCredentialId = undefined
      this.form.containerImageId = undefined
    },
    handleCredentialChange (credentialId) {
      this.form.imageCredentialId = credentialId
    },
    async doSubmit (values) {
      const { id, spec } = this.params.data[0]
      let specData = {
        ...spec,
      }
      if (this.editMode === 'custom') {
        const { image, registryImage, imageCredentialId, containerImageId, command, arg, privileged, capAdd, capDrop } = values
        if (this.source === 'container_image' && containerImageId) {
          specData.container_image_id = containerImageId
          delete specData.image
          delete specData.image_credential_id
        } else if (this.source === 'registry' && registryImage) {
          specData.image = registryImage
          delete specData.container_image_id
          if (imageCredentialId) {
            specData.image_credential_id = imageCredentialId
          } else {
            delete specData.image_credential_id
          }
        } else if (image) {
          specData.image = image
          delete specData.container_image_id
          delete specData.image_credential_id
        }
        if (command) {
          specData.command = command.split(' ')
        }
        if (arg) {
          specData.args = arg.split(' ')
        }
        const envRows = this.readEnvRows()
        specData.envs = envRows.map(({ key, value }) => ({ key, value }))
        specData.privileged = privileged
        if (capAdd?.length || capDrop?.length) {
          specData.capabilities = {
            add: capAdd || [],
            drop: capDrop || [],
          }
        } else {
          specData.capabilities = undefined
        }
      } else {
        const data = jsYaml.safeLoad(values.yaml)
        specData = data.spec || {}
      }
      return this.params.onManager('update', {
        id,
        managerArgs: {
          data: {
            spec: specData,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doSubmit({ ...this.form })
        this.$message.success(this.$t('common.success'))
        this.cancelDialog()
      } catch (error) {
        this.$message.error(this.$t('common.failed'))
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="less">
.yaml-config-wrapper {
  .CodeMirror {
    height: calc(100vh - 530px);
    min-height: 500px;
    max-height: 80vh;
  }
}
</style>
