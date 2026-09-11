<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ params.title || $t('common.text00085') }}</template>
    <template #body>
      <div class="d-flex image-cropper-dialog">
        <div class="flex-fill">
          <a-upload-dragger
            v-show="!imageLoaded"
            name="file"
            @change="handleFileChange"
            :showUploadList="false"
            :accept="accept"
            :beforeUpload="handleBeforeUpload">
            <p class="ant-upload-drag-icon">
              <icon type="inbox" style="font-size: 48px; color: var(--ant-color-primary, #1890ff);" />
            </p>
            <p class="ant-upload-text">{{ $t('common.text00099') }}</p>
          </a-upload-dragger>

          <div
            v-show="imageLoaded"
            class="cropper-wrap"
            :style="containerStyle">
            <img ref="img" :src="imgSrc" alt="crop" class="cropper-img" />
          </div>

          <div v-show="showControl">
            <div class="d-flex align-items-center w-100">
              <a-button type="link" class="flex-shrink-0 flex-grow-0 mt-1" @click="handleDecZoom">
                <template #icon><icon type="minus" /></template>
              </a-button>
              <div class="flex-fill w-100">
                <a-slider v-model:value="zoom" v-bind="zoomSlider" @change="handleZoomChange" :tooltip-visible="false" />
              </div>
              <a-button type="link" class="flex-shrink-0 flex-grow-0 mt-1" @click="handleIncZoom">
                <template #icon><icon type="plus" /></template>
              </a-button>
            </div>
          </div>
        </div>

        <div class="flex-grow-0 flex-shrink-0 ml-4" v-show="imageLoaded">
          <div ref="preview" class="cropper-preview overflow-hidden" :style="params.previewStyle" />
          <div class="mt-3 text-center">{{ $t('common.text00100') }}</div>
          <div class="text-center mt-3">
            <a-upload
              name="file"
              @change="handleFileChange"
              :showUploadList="false"
              :accept="accept"
              :beforeUpload="handleBeforeUpload">
              <a-button type="link">{{ $t('common.text00101') }}</a-button>
            </a-upload>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ImageCropperDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      imageLoaded: false,
      showControl: false,
      imgSrc: '',
      cropper: null,
      zoom: 0,
      zoomSlider: {
        min: 0,
        max: 1,
        step: 0.001,
      },
    }
  },
  computed: {
    accept () {
      return this.params.accept || 'image/png'
    },
    containerStyle () {
      return (this.params.cropperProps && this.params.cropperProps.containerStyle) || {
        width: '100%',
        height: '300px',
      }
    },
    cropperOptions () {
      const props = { ...(this.params.cropperProps || {}) }
      delete props.containerStyle
      delete props.ready
      return props
    },
  },
  beforeUnmount () {
    this.destroyCropper()
  },
  methods: {
    handleBeforeUpload () {
      return false
    },
    getRawFile (info) {
      const file = info?.file
      if (!file) return null
      return file.originFileObj || file
    },
    destroyCropper () {
      if (this.cropper) {
        this.cropper.destroy()
        this.cropper = null
      }
    },
    initCropper () {
      this.destroyCropper()
      const img = this.$refs.img
      if (!img || !this.imgSrc) return

      const options = {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        background: true,
        ...this.cropperOptions,
        preview: this.$refs.preview,
        ready: (e) => {
          if (this.params.cropperProps?.ready) {
            this.params.cropperProps.ready(e)
          }
          this.zoom = this.zoomSlider.min
          this.cropper?.zoomTo(this.zoomSlider.min)
        },
        zoom: (e) => {
          const { ratio } = e.detail
          this.zoom = ratio
          if (ratio > 1 || ratio < this.zoomSlider.min) {
            e.preventDefault()
          }
        },
      }

      this.cropper = new Cropper(img, options)
    },
    startCropperWithSrc (result) {
      this.destroyCropper()
      this.imageLoaded = false
      this.showControl = false
      this.imgSrc = ''
      this.$nextTick(() => {
        this.imgSrc = result
        this.imageLoaded = true
        this.showControl = true
        this.$nextTick(() => {
          const img = this.$refs.img
          if (!img) return
          const run = () => {
            requestAnimationFrame(() => this.initCropper())
          }
          if (img.complete && img.naturalWidth) {
            run()
          } else {
            img.onload = () => {
              img.onload = null
              run()
            }
          }
        })
      })
    },
    handleFileChange (info) {
      const file = this.getRawFile(info)
      if (!file || typeof FileReader === 'undefined') return
      if (typeof file.type === 'string' && this.accept && file.type.indexOf(this.accept) === -1 && file.type.indexOf('image/') === -1) {
        this.$message.warning(`${this.$t('common.text00102')}${this.accept}${this.$t('common.text00103')}`)
        return
      }

      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result
        if (!result) return
        this.startCropperWithSrc(result)
      }
      reader.readAsDataURL(file)
    },
    handleConfirm () {
      if (!this.imageLoaded || !this.cropper) return
      if (this.params.ok) {
        const canvas = this.cropper.getCroppedCanvas()
        if (!canvas) return
        const data = {
          fullUrl: canvas.toDataURL(),
        }
        const arr = data.fullUrl.split(',')
        data.url = arr[1]
        data.format = arr[0].split(';')[0].split(':')[1]
        this.params.ok(data)
      }
      this.cancelDialog()
    },
    handleZoomChange (val) {
      this.cropper?.zoomTo(val)
    },
    handleDecZoom () {
      if (this.zoom > this.zoomSlider.min) {
        this.zoom -= 0.001
        this.cropper?.zoomTo(this.zoom)
      }
    },
    handleIncZoom () {
      if (this.zoom < 1) {
        this.zoom += 0.001
        this.cropper?.zoomTo(this.zoom)
      }
    },
  },
}
</script>

<style lang="less" scoped>
.cropper-wrap {
  width: 100%;
  height: 300px;
  overflow: hidden;
  background: #f5f5f5;
}
.cropper-img {
  display: block;
  max-width: 100%;
}
</style>
