import i18n from '@/locales'
import { IMAGES_TYPE_MAP } from '@/constants/compute'
import { isRequired } from '@/utils/validate'

/** VM create imageOS — aligned with createServer.js / form.fd field names */
export const IMAGE_OS_FIELDS = {
  prefer_manager: 'prefer_manager',
  os: 'os',
  image: 'image',
  imageType: 'imageType',
}

const DEFAULT_IMAGE_OS_FIELD_MAP = {
  prefer_manager: {
    name: IMAGE_OS_FIELDS.prefer_manager,
    rules: [
      { required: true, message: i18n.t('compute.text_149') },
    ],
  },
  os: {
    name: IMAGE_OS_FIELDS.os,
    rules: [
      { required: true, message: i18n.t('compute.text_153') },
    ],
  },
  image: {
    name: IMAGE_OS_FIELDS.image,
    rules: [
      { validator: isRequired(), message: i18n.t('compute.text_214') },
    ],
  },
  imageType: { name: IMAGE_OS_FIELDS.imageType },
}

export function resolveImageOsFieldMap () {
  return DEFAULT_IMAGE_OS_FIELD_MAP
}

/** 动态 key：`os[uuid]` / `image[uuid]` / `imageType[uuid]`（K8S serverConfig 等） */
export function resolveImageOsFieldMapForKey (uid) {
  const osRules = DEFAULT_IMAGE_OS_FIELD_MAP.os.rules
  const imageRules = DEFAULT_IMAGE_OS_FIELD_MAP.image.rules
  const imageTypeInitial = DEFAULT_IMAGE_OS_FIELD_MAP.imageType.initialValue ??
    IMAGES_TYPE_MAP.standard.key
  return {
    os: { name: `os[${uid}]`, initialValue: '', rules: osRules },
    image: { name: `image[${uid}]`, initialValue: { key: '', label: '' }, rules: imageRules },
    imageType: { name: `imageType[${uid}]`, initialValue: imageTypeInitial },
  }
}
