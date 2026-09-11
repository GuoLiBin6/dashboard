/**
 * ant-design-vue v4 不再挂载 `this.$form`，且已移除 v1 的 `Form.createForm` / `v-decorator`。
 * 旧代码大量依赖 `this.$form.createForm(this)` + `v-decorator` / `getFieldDecorator`。
 * 这里提供 createForm + decorator 指令，并解决 Vue3 下默认值/反填不显示的共性问题：
 *
 * 1) setFieldsValue 触发 onValuesChange（与 antdv1 一致，驱动联动默认值）
 * 2) 组件上的 v-decorator 会 fallthrough 到根 DOM，无法给业务组件注入 props.value；
 *    因此给「带 value/modelValue 的最外层组件」做 props Proxy，空值时回退读 form.fd
 */

/**
 * 将 antdv1 字段名转为路径：'tagValues[uuid]' -> ['tagValues', 'uuid']
 */
function toNamePath (name) {
  if (Array.isArray(name)) return name
  const str = String(name)
  const path = []
  const re = /([^.[\]]+)|\[([^[\]]+)\]/g
  let m
  while ((m = re.exec(str))) {
    path.push(m[1] !== undefined ? m[1] : m[2])
  }
  return path.length ? path : [str]
}

function pathGet (obj, name) {
  if (!obj) return undefined
  if (Object.prototype.hasOwnProperty.call(obj, name)) return obj[name]
  const path = toNamePath(name)
  let cur = obj
  for (let i = 0; i < path.length; i++) {
    if (cur == null) return undefined
    cur = cur[path[i]]
  }
  return cur
}

function pathSet (obj, name, value) {
  const path = toNamePath(name)
  if (path.length === 1) {
    obj[path[0]] = value
    return
  }
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (cur[key] == null || typeof cur[key] !== 'object' || Array.isArray(cur[key])) {
      cur[key] = {}
    }
    cur = cur[key]
  }
  cur[path[path.length - 1]] = value
}

/** 将扁平字段（含 tagValues[id]）转为 antdv1 风格嵌套对象 */
function nestFieldValues (flat) {
  const result = {}
  Object.keys(flat || {}).forEach((key) => {
    const val = flat[key]
    if (key.includes('[') || key.includes('.')) {
      pathSet(result, key, val)
    } else if (
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      result[key] &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = { ...result[key], ...val }
    } else if (result[key] === undefined) {
      result[key] = val
    }
  })
  return result
}

/** 将变更值包装为嵌套结构，供 onValuesChange 使用 */
function nestChangedValue (name, value) {
  const changed = {}
  pathSet(changed, name, value)
  return changed
}

function normalizeEventValue (e) {
  if (e && typeof e === 'object' && 'target' in e && e.target) {
    const t = e.target
    if (t.type === 'checkbox') return t.checked
    return t.value
  }
  return e
}

function isEmptyDecoratorValue (val) {
  // '' 对 Input 视为空，保持未输入时可走非受控，避免无法打字；
  // Radio「默认」空串不走 defineProperty 桥，由 syncRadioGroupInternalValue 单独同步
  if (val === undefined || val === null || val === '') return true
  if (typeof val === 'object' && !Array.isArray(val) && 'key' in val && !val.key) return true
  return false
}

/** antd Select labelInValue / 业务 { key, label }，不能当 tagValues 嵌套字段展开 */
function isLabelInValueObject (value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value)
  if (!keys.length) return false
  if (!('key' in value || 'value' in value)) return false
  return keys.every(k => k === 'key' || k === 'value' || k === 'label')
}

function isSameDecoratorValue (a, b) {
  if (a === b) return true
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch (e) {
      return false
    }
  }
  return false
}

function cloneVNodeWithProps (vnode, extraProps) {
  if (!vnode || typeof vnode !== 'object') return vnode
  // Vue 3 VNode
  if ('type' in vnode || 'props' in vnode) {
    return {
      ...vnode,
      props: {
        ...(vnode.props || {}),
        ...extraProps,
      },
    }
  }
  // Vue 2 风格 data（部分 render 函数尚未完全迁移）
  const data = { ...vnode }
  data.props = { ...(vnode.props || {}), ...extraProps }
  const onChange = extraProps.onChange
  if (onChange) {
    data.on = {
      ...(vnode.on || {}),
      change: onChange,
      input: onChange,
    }
  }
  return data
}

function componentHasValueProp (comp) {
  if (!comp || !comp.type) return false
  const propOptions = comp.type.props
  if (!propOptions) {
    // 函数组件 / 部分 antd 组件可能没有规范化 props，看运行时 props
    return !!(comp.props && ('value' in comp.props || 'modelValue' in comp.props || 'checked' in comp.props))
  }
  if (Array.isArray(propOptions)) {
    return propOptions.includes('value') || propOptions.includes('modelValue') || propOptions.includes('checked')
  }
  return !!(propOptions.value !== undefined || propOptions.modelValue !== undefined || propOptions.checked !== undefined)
}

function getValuePropName (options = {}) {
  return (options && options.valuePropName) || 'value'
}

/** ant-design-vue Switch/Checkbox 用 checked，不能注入 value（会告警） */
function isCheckedControlComponent (comp) {
  if (!comp || !comp.type) return false
  const name = comp.type.name || comp.type.__name || ''
  if (name === 'ASwitch' || name === 'ACheckbox' || name === 'ACheckableTag') return true
  // Checkbox 同时声明了 value（给 Group 用）与 checked，不能只用 props 判断
  if (name === 'Checkbox' || name === 'Switch') return true
  const propOptions = comp.type.props
  if (propOptions && !Array.isArray(propOptions)) {
    return propOptions.checked !== undefined && propOptions.value === undefined
  }
  if (comp.props && 'checked' in comp.props && !('value' in comp.props)) return true
  return false
}

function shouldUseCheckedProp (comp, options = {}) {
  return getValuePropName(options) === 'checked' || isCheckedControlComponent(comp)
}

/**
 * 在组件 onBeforeMount 告警之前，从 vnode 上移除误传的 value，并按 valuePropName 写入字段值。
 * 指令用在组件上时，created/beforeMount 的 vnode 即该组件 VNode。
 * 文本输入须保持 value 不在 props 上（非受控），否则 antdv4 VCInput 无法输入。
 */
function sanitizeDecoratorVNode (binding, vnode) {
  const meta = parseDecoratorBinding(binding && binding.value)
  if (!meta || !vnode) return
  const typeName = (vnode.type && (vnode.type.name || vnode.type.__name)) || ''
  const isTextVNode = [
    'AInput', 'ATextarea', 'AInputPassword', 'AInputSearch',
    'Input', 'TextArea', 'Textarea', 'VCInput', 'HostName',
  ].includes(typeName)
  if (isTextVNode) {
    if (vnode.props && 'value' in vnode.props) {
      const props = { ...vnode.props }
      delete props.value
      vnode.props = props
    }
    return
  }
  // InputNumber：不在此处注入 value，保持非受控；由 applyInputNumberValue 同步展示
  if (isInputNumberTypeName(typeName)) {
    return
  }
  const valuePropName = getValuePropName(meta.options)
  const useChecked = valuePropName === 'checked'
  if (!useChecked && !(vnode.type && (vnode.type.name === 'ASwitch' || vnode.type.name === 'ACheckbox'))) {
    return
  }
  const fc = findLegacyForm(binding.instance)
  const fieldValue = fc ? fc.getFieldValue(meta.name) : undefined
  const props = { ...(vnode.props || {}) }
  let changed = false
  if ('value' in props) {
    if (props.checked === undefined && typeof props.value === 'boolean') {
      props.checked = props.value
    }
    delete props.value
    changed = true
  }
  // Switch：始终用 fd 驱动 checked（antdv4 点选只 emit，须受控回写）
  if (fieldValue !== undefined && props.checked !== fieldValue) {
    props.checked = fieldValue
    changed = true
  }
  if (changed) vnode.props = props
}

/**
 * v-decorator 在组件上会 fallthrough 到根 DOM。
 * 从 DOM 所属组件向上找「声明了 value/modelValue」的最外层业务组件。
 * Switch/Checkbox 优先取最内层，避免外层 value 落到 attrs。
 */
function findDecoratedComponent (el) {
  let comp = el && el.__vueParentComponent
  let found = null
  let checkedFound = null
  while (comp) {
    const name = comp.type && (comp.type.name || comp.type.__name)
    if (name === 'AForm' || name === 'AFormItem' || name === 'AFormItemRest') break
    if (isCheckedControlComponent(comp) && !checkedFound) {
      checkedFound = comp
    }
    if (componentHasValueProp(comp)) {
      found = comp
    }
    comp = comp.parent
  }
  return checkedFound || found || (el && el.__vueParentComponent) || null
}

/**
 * Radio.Group 用内部 stateValue + watch(props.value) 同步选中态。
 * 对 props.value 做 defineProperty 会破坏该 watch，表现为「点选不生效」。
 */
function isRadioGroupComponent (comp) {
  if (!comp || !comp.type) return false
  const name = comp.type.name || comp.type.__name || ''
  return name === 'ARadioGroup' || name === 'RadioGroup'
}

/** 文本输入：defineProperty 桥接会变成受控且打断输入，需跳过 */
function isTextInputComponent (comp) {
  if (!comp || !comp.type) return false
  const name = comp.type.name || comp.type.__name || ''
  return [
    'AInput',
    'ATextarea',
    'AInputPassword',
    'AInputSearch',
    'Input',
    'TextArea',
    'Textarea',
    'VCInput',
    'HostName',
  ].includes(name)
}

/**
 * antdv4 AInputNumber 用内部 mergedValue + watch(props.value) 同步展示。
 * defineProperty 桥接会让 watch 收不到后续 setFieldsValue，表现为「只显示 GB、focus 才出数字」。
 */
function isInputNumberComponent (comp) {
  if (!comp || !comp.type) return false
  const name = comp.type.name || comp.type.__name || ''
  // DiskSizeInput：内部包 InputNumber，需走 __decoratorSyncValue，勿 defineProperty
  return name === 'AInputNumber' || name === 'InputNumber' || name === 'DiskSizeInput'
}

function isSwitchComponent (comp) {
  if (!comp || !comp.type) return false
  const name = comp.type.name || comp.type.__name || ''
  return name === 'ASwitch' || name === 'Switch'
}

function isInputNumberTypeName (typeName) {
  return typeName === 'AInputNumber' || typeName === 'InputNumber'
}

/**
 * 直接写入 AInputNumber 内部 mergedValue（setup 返回 render 函数时通常取不到）。
 */
function syncInputNumberMergedValue (comp, value) {
  if (!comp) return false
  const buckets = [
    comp.setupState,
    comp.devtoolsRawSetupState,
    comp.ctx,
  ]
  for (let i = 0; i < buckets.length; i++) {
    const bag = buckets[i]
    if (!bag || typeof bag !== 'object') continue
    const mv = bag.mergedValue
    if (mv && typeof mv === 'object' && 'value' in mv) {
      mv.value = value
      return true
    }
  }
  return false
}

function inputNumberDisplayMatches (inputText, value) {
  if (inputText == null) return false
  const next = String(value)
  if (inputText === next) return true
  // 兼容 formatter（如 30GB）
  const digits = String(inputText).replace(/[^\d.-]/g, '')
  return digits === next
}

function getInputNumberDecoratorSync (comp) {
  if (!comp) return null
  const sync = comp.exposed?.__decoratorSyncValue ||
    comp.exposeProxy?.__decoratorSyncValue ||
    // Options API（DiskSizeInput 等）方法挂在 proxy/ctx 上
    comp.proxy?.__decoratorSyncValue ||
    comp.ctx?.__decoratorSyncValue
  return typeof sync === 'function' ? sync : null
}

function getTextInputDecoratorSync (comp) {
  if (!comp) return null
  const sync = comp.exposed?.__decoratorSyncValue || comp.exposeProxy?.__decoratorSyncValue
  return typeof sync === 'function' ? sync : null
}

/**
 * 同步 Switch initialValue / setFieldsValue（含 false）。
 * 优先依赖 props.checked 桥接（fd 真源）；此处再写 vnode/props 并 forceUpdate 兜底。
 */
function applySwitchValue (comp, value) {
  if (!comp || value === undefined) return
  try {
    if (comp.props) comp.props.checked = value
  } catch (e) { /* ignore */ }
  if (comp.vnode) {
    const next = { ...(comp.vnode.props || {}), checked: value }
    delete next.value
    comp.vnode.props = next
  }
  scheduleCompUpdate(comp)
}

/**
 * 同步文本框 initialValue / setFieldsValue。
 * 优先走包装组件 __decoratorSyncValue；否则非受控 + 写 DOM。
 */
function applyTextInputValue (comp, el, value) {
  if (value === undefined || value === null) return
  const sync = getTextInputDecoratorSync(comp)
  if (sync) {
    sync(value)
    return
  }
  ensureTextInputUncontrolled(comp)
  applyDomValueOnly(el, value)
}

/**
 * 同步数字框 initialValue / setFieldsValue。
 * 优先走包装组件暴露的 __decoratorSyncValue（不派发 DOM 事件，避免死循环）；
 * 否则再尝试写 mergedValue / DOM。
 */
function applyInputNumberValue (comp, value, el) {
  if (!comp || value === undefined || value === null) return
  if (isSameDecoratorValue(comp.__decoratorInputNumberLastValue, value)) return
  comp.__decoratorInputNumberLastValue = value

  const sync = getInputNumberDecoratorSync(comp)
  if (sync) {
    sync(value)
    return
  }

  syncInputNumberMergedValue(comp, value)

  const root = (el && typeof el.querySelector === 'function')
    ? el
    : (comp.vnode && comp.vnode.el)
  if (!root) return
  const input = root.matches?.('input')
    ? root
    : root.querySelector?.('input')
  if (!input) return
  if (!inputNumberDisplayMatches(input.value, value)) {
    input.value = String(value)
  }
}

/**
 * antdv4 VCInput：props.value !== undefined 即受控；受控时只靠 props 更新展示。
 * 切勿对文本框写 props.value（applyValueToEl 会这样做），否则会卡死无法输入。
 * 外部回填只改原生 DOM，保持非受控。
 */
function ensureTextInputUncontrolled (comp) {
  if (!comp) return
  if (comp.vnode && comp.vnode.props && 'value' in comp.vnode.props) {
    const next = { ...comp.vnode.props }
    delete next.value
    comp.vnode.props = next
  }
  try {
    if (comp.props && 'value' in comp.props) {
      comp.props.value = undefined
    }
  } catch (e) { /* props may be readonly */ }
}

function applyDomValueOnly (el, value) {
  if (value === undefined || value === null) return
  if (
    el.classList?.contains('ant-select') ||
    el.querySelector?.('.ant-select, .base-select')
  ) {
    return
  }
  const input = el.matches?.('input, textarea')
    ? el
    : el.querySelector?.('input:not([type="checkbox"]):not([type="radio"]), textarea')
  if (input && (typeof value === 'string' || typeof value === 'number')) {
    if (String(input.value) !== String(value)) {
      input.value = value
    }
  }
}

/**
 * antdv4 Radio.Group 在声明了 value prop 后始终走受控分支，点选只 emit、不改内部 stateValue。
 * 直接改 comp.props / vnode.props 也往往触发不了 watch，需同步 provides 里的 stateValue ref。
 */
/**
 * antdv4 Radio.Group：value 一经声明即受控，点选只 emit；
 * 须同步 setupState.stateValue（及 provide 上下文），否则表现为「点了不选中」。
 */
function syncRadioGroupInternalValue (comp, value) {
  if (!comp || !isRadioGroupComponent(comp)) return false
  const bags = [
    comp.setupState,
    comp.devtoolsRawSetupState,
    comp.ctx,
  ]
  for (let i = 0; i < bags.length; i++) {
    const bag = bags[i]
    if (!bag || typeof bag !== 'object') continue
    const stateValue = bag.stateValue
    if (stateValue && typeof stateValue === 'object' && 'value' in stateValue) {
      if (stateValue.value === value) return true
      stateValue.value = value
      return true
    }
  }
  const provides = comp.provides
  if (provides) {
    for (const key of Reflect.ownKeys(provides)) {
      const ctx = provides[key]
      // { onChange, value: Ref, disabled, name, optionType }
      if (ctx && typeof ctx.onChange === 'function' && ctx.value && typeof ctx.value === 'object' && 'value' in ctx.value) {
        if (ctx.value.value === value) return true
        ctx.value.value = value
        return true
      }
    }
  }
  return false
}

/**
 * 给组件 props 做同引用拦截：form.fd 为 decorator 字段真源，优先返回；
 * 否则回退父级传入的 value。必须始终读取 form.fd，才能让 Select 等受控组件
 * 在用户改值后依赖收集到 fd 变化（否则会卡在首次 passedVal，表现为「修改不生效」）。
 * 注意：不能替换 comp.props 引用——antd 等 setup(props) 已闭包持有原对象。
 */
function patchComponentValueBridge (comp, fieldName, fc, options = {}) {
  if (!comp || !comp.props || comp.__decoratorValuePatched) return

  const propKey = shouldUseCheckedProp(comp, options) ? 'checked' : getValuePropName(options)
  comp.__decoratorFieldName = fieldName
  comp.__decoratorValuePatched = true
  comp.__decoratorValuePropName = propKey

  // Radio / 文本输入 / InputNumber：不做 props 桥接
  // Switch 必须桥接 checked：antdv4 setup 返回渲染函数，setupState 无 checked ref，
  // 点选只 emit 不改内部状态；无 props 受控时 UI 卡在 off，但 fd 已更新（地图等 v-if 仍显示）
  if (isRadioGroupComponent(comp) || isTextInputComponent(comp) || isInputNumberComponent(comp)) {
    comp.__decoratorSkipValueBridge = true
    if (isTextInputComponent(comp)) ensureTextInputUncontrolled(comp)
    if (isInputNumberComponent(comp)) comp.__decoratorIsInputNumber = true
    return
  }

  const rawProps = comp.props
  let passedVal = rawProps[propKey]

  try {
    Object.defineProperty(rawProps, propKey, {
      configurable: true,
      enumerable: true,
      get () {
        // 始终先读 fd，保证响应式依赖；有有效值则以 fd 为准
        const fromFd = fc.getFieldValue(fieldName)
        // Switch/Checkbox：false 是有效值，不能当空
        if (propKey === 'checked') {
          if (fromFd !== undefined && fromFd !== null) return fromFd
          return passedVal
        }
        if (!isEmptyDecoratorValue(fromFd)) return fromFd
        return passedVal
      },
      set (v) {
        passedVal = v
      },
    })
  } catch (e) {
    // props 不可配置时退回 Proxy（对 Options API 仍可能有效）
    const valueKeys = [propKey]
    comp.props = new Proxy(rawProps, {
      get (target, key, receiver) {
        if (valueKeys.includes(key)) {
          const fromFd = fc.getFieldValue(fieldName)
          if (propKey === 'checked') {
            if (fromFd !== undefined && fromFd !== null) return fromFd
            return Reflect.get(target, key, receiver)
          }
          if (!isEmptyDecoratorValue(fromFd)) return fromFd
          return Reflect.get(target, key, receiver)
        }
        return Reflect.get(target, key, receiver)
      },
    })
  }

  // checked 控件：避免误带 value
  if (propKey === 'checked') {
    try {
      if ('value' in rawProps) delete rawProps.value
    } catch (e) { /* ignore */ }
  }

  comp.__decoratorFieldName = fieldName
  comp.__decoratorValuePatched = true
  comp.__decoratorValuePropName = propKey
}

function scheduleCompUpdate (comp) {
  if (!comp || typeof comp.update !== 'function') return
  if (comp.__decoratorUpdateScheduled) return
  comp.__decoratorUpdateScheduled = true
  queueMicrotask(() => {
    comp.__decoratorUpdateScheduled = false
    try { comp.update() } catch (e) { /* ignore */ }
  })
}

/** 在 Form.Item 上展示/清除 decorator 校验错误（antdv4 无 name 时需手动） */
function setFormItemError (el, message) {
  if (!el || typeof el.closest !== 'function') return
  const item = el.closest('.ant-form-item')
  if (!item) return
  const statusTargets = [
    el,
    el.querySelector?.('input, textarea'),
    item.querySelector?.('.ant-input, .ant-input-affix-wrapper, .ant-input-number, .ant-select'),
  ].filter(Boolean)
  let explain = item.querySelector('[data-legacy-decorator-error]')
  if (message) {
    item.classList.add('ant-form-item-has-error')
    statusTargets.forEach((node) => {
      node.classList.add('ant-input-status-error')
      node.classList.add('ant-select-status-error')
    })
    if (!explain) {
      explain = document.createElement('div')
      explain.setAttribute('data-legacy-decorator-error', '1')
      explain.className = 'ant-form-item-explain ant-form-item-explain-connected'
      const err = document.createElement('div')
      err.className = 'ant-form-item-explain-error'
      err.setAttribute('role', 'alert')
      explain.appendChild(err)
      const control = item.querySelector('.ant-form-item-control') || item
      control.appendChild(explain)
    }
    const errNode = explain.querySelector('.ant-form-item-explain-error') || explain
    errNode.textContent = typeof message === 'string' ? message : (message.message || String(message))
  } else {
    item.classList.remove('ant-form-item-has-error')
    statusTargets.forEach((node) => {
      node.classList.remove('ant-input-status-error')
      node.classList.remove('ant-select-status-error')
    })
    if (explain) explain.remove()
  }
}

/** 执行单条 antdv1 风格 rule，返回错误文案或 null */
function runDecoratorRule (rule, value) {
  return new Promise((resolve) => {
    const empty = value === undefined || value === null || value === ''
    if (rule.required && empty) {
      resolve(rule.message || 'required')
      return
    }
    if (rule.whitespace && typeof value === 'string' && value.trim() === '') {
      resolve(rule.message || 'required')
      return
    }
    // 空值且非必填：跳过 pattern/validator（与 antd 常见行为一致）
    if (empty && !rule.required) {
      resolve(null)
      return
    }
    if (rule.pattern && value != null && value !== '' && !rule.pattern.test(String(value))) {
      resolve(rule.message || 'pattern mismatch')
      return
    }
    if (typeof rule.validator !== 'function') {
      resolve(null)
      return
    }
    let settled = false
    const finish = (msg) => {
      if (settled) return
      settled = true
      if (!msg) {
        resolve(null)
        return
      }
      if (typeof msg === 'string') resolve(msg)
      else if (msg instanceof Error) resolve(msg.message || rule.message || 'validation failed')
      else if (typeof msg === 'function') resolve(rule.message || 'validation failed')
      else resolve(msg.message || String(msg))
    }
    try {
      const ret = rule.validator(rule, value, finish)
      if (ret && typeof ret.then === 'function') {
        ret.then(() => finish(null)).catch((e) => finish(e))
      } else if (rule.validator.length < 3) {
        // 未使用 callback 的同步 validator：返回 falsy 视为通过
        queueMicrotask(() => {
          if (!settled) finish(ret === false ? (rule.message || 'validation failed') : null)
        })
      }
    } catch (e) {
      finish(e)
    }
  })
}

function parseValidateFieldsArgs (args) {
  // antdv1: (cb) | (names, cb) | (names, options, cb) | (options, cb)
  let names
  let callback
  if (typeof args[0] === 'function') {
    callback = args[0]
  } else if (Array.isArray(args[0]) || typeof args[0] === 'string') {
    names = args[0]
    if (typeof args[1] === 'function') callback = args[1]
    else if (typeof args[2] === 'function') callback = args[2]
  } else if (args[0] && typeof args[0] === 'object') {
    if (typeof args[1] === 'function') callback = args[1]
    else if (typeof args[2] === 'function') callback = args[2]
  }
  if (typeof names === 'string') names = [names]
  return { names, callback }
}

export function createLegacyFormInstance (vm, options = {}) {
  const touched = Object.create(null)
  const fieldOptions = Object.create(null)
  const fieldErrors = Object.create(null)
  /** @type {Record<string, Element>} */
  const fieldEls = Object.create(null)
  /** @type {Record<string, Set<(v: any) => void>>} */
  const fieldViews = Object.create(null)
  const onValuesChange = options && typeof options.onValuesChange === 'function'
    ? options.onValuesChange
    : null

  const ensureFd = () => {
    if (!vm.form || typeof vm.form !== 'object') vm.form = {}
    if (!vm.form.fd || typeof vm.form.fd !== 'object') vm.form.fd = {}
    return vm.form.fd
  }

  const notifyViews = (name, value) => {
    const views = fieldViews[name]
    if (!views) return
    views.forEach(fn => {
      try {
        fn(value)
      } catch (e) { /* ignore view sync errors */ }
    })
  }

  const emitValuesChange = (name, value) => {
    if (!onValuesChange) return
    try {
      onValuesChange.call(vm, {}, nestChangedValue(name, value))
    } catch (e) { /* ignore consumer errors */ }
  }

  const applyFieldError = (name, message) => {
    if (message) fieldErrors[name] = [message]
    else delete fieldErrors[name]
    const el = fieldEls[name]
    if (el) setFormItemError(el, message || null)
  }

  const validateFieldByName = async (name) => {
    const opts = fieldOptions[name] || {}
    const rules = opts.rules || []
    const val = pathGet(ensureFd(), name)
    const validateFirst = opts.validateFirst !== false
    for (let i = 0; i < rules.length; i++) {
      const msg = await runDecoratorRule(rules[i], val)
      if (msg) {
        applyFieldError(name, msg)
        return msg
      }
      if (validateFirst && msg) break
    }
    applyFieldError(name, null)
    return null
  }

  const setFieldValue = (name, value, markTouched, triggerChange) => {
    const fd = ensureFd()
    const prev = pathGet(fd, name)
    // 同值不重复触发，避免 BaseSelect 同时 emit change/input 导致多次查询
    const same = isSameDecoratorValue(prev, value)
    // 兼容 antdv1：同时保留扁平 key，便于 decorator 精确绑定；嵌套结构供业务读取
    fd[name] = value
    if (String(name).includes('[') || String(name).includes('.')) {
      pathSet(fd, name, value)
    }
    if (markTouched) touched[name] = true
    notifyViews(name, value)
    if (triggerChange && !same) emitValuesChange(name, value)
  }

  const form = {
    async validateFields (...args) {
      const { names, callback } = parseValidateFieldsArgs(args)
      const values = nestFieldValues(ensureFd())
      const targetNames = names && names.length
        ? names
        : Object.keys(fieldOptions)
      const errors = []
      for (let i = 0; i < targetNames.length; i++) {
        const name = targetNames[i]
        if (!fieldOptions[name]) continue
        const msg = await validateFieldByName(name)
        if (msg) errors.push({ name, message: msg })
      }
      const errObj = errors.length ? { errors, values } : null
      if (typeof callback === 'function') {
        callback(errObj, values)
      }
      if (errObj) return Promise.reject(errObj)
      return Promise.resolve(values)
    },
    validateFieldsAndScroll (...args) {
      // antdv1: (cb) | (options, cb) | (names, options, cb)
      return this.validateFields(...args)
    },
    getFieldsValue (names) {
      const all = nestFieldValues(ensureFd())
      if (!Array.isArray(names) || !names.length) return all
      const picked = {}
      names.forEach((name) => {
        pathSet(picked, name, pathGet(ensureFd(), name))
      })
      return picked
    },
    getFieldValue (name) {
      return pathGet(ensureFd(), name)
    },
    setFieldsValue (vals) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach(key => {
        const value = vals[key]
        // 已是扁平字段名（含 tagValues[id]）/ 标量 / labelInValue 对象
        if (
          key.includes('[') ||
          !value ||
          typeof value !== 'object' ||
          Array.isArray(value) ||
          isLabelInValueObject(value)
        ) {
          // 与 antdv1 一致：触发 onValuesChange，驱动区域→平台→规格等联动默认值
          setFieldValue(key, value, false, true)
          return
        }
        // 仅当存在已注册的 tagValues[id] 子字段时才展开；勿用 n === key
        // （否则 domain/project 的 { key, label } 会被拆成 domain[key]、domain[label]）
        const hasNestedFields = Object.keys(fieldOptions).some(n => n.startsWith(`${key}[`))
        if (hasNestedFields) {
          Object.keys(value).forEach((sub) => {
            setFieldValue(`${key}[${sub}]`, value[sub], false, true)
          })
        } else {
          setFieldValue(key, value, false, true)
        }
      })
    },
    setFields () {},
    resetFields () {
      Object.keys(touched).forEach(k => {
        delete touched[k]
      })
      Object.keys(fieldErrors).forEach(k => {
        applyFieldError(k, null)
      })
    },
    isFieldTouched (name) {
      return !!touched[name]
    },
    getFieldError (name) {
      return fieldErrors[name]
    },
    getFieldsError (names) {
      if (!names || !names.length) return { ...fieldErrors }
      const picked = {}
      names.forEach((n) => {
        if (fieldErrors[n]) picked[n] = fieldErrors[n]
      })
      return picked
    },
    __markTouched (name) {
      touched[name] = true
    },
    /** @private 指令注册 DOM，用于展示校验错误 */
    __registerFieldEl (name, el) {
      if (name && el) fieldEls[name] = el
    },
    /** @private 按 validateTrigger 校验单字段 */
    __validateField (name) {
      return validateFieldByName(name)
    },
    /**
     * 兼容 antdv1：注册字段；可选地包装 VNode（render 函数场景）
     */
    getFieldDecorator (name, options = {}) {
      fieldOptions[name] = options || {}
      if (options && Object.prototype.hasOwnProperty.call(options, 'initialValue')) {
        const fd = ensureFd()
        if (pathGet(fd, name) === undefined) {
          // 初始值写入 fd，并通知已挂载的视图；不触发 onValuesChange 避免初始化风暴
          setFieldValue(name, options.initialValue, false, false)
        }
      }
      return (vnode) => {
        const value = form.getFieldValue(name)
        const valuePropName = getValuePropName(options)
        const prevChange = vnode && vnode.props && (vnode.props.onChange || (vnode.on && vnode.on.change))
        const extra = {
          [valuePropName]: value,
          onChange: (e) => {
            setFieldValue(name, normalizeEventValue(e), true, true)
            if (typeof prevChange === 'function') prevChange(e)
          },
        }
        if (valuePropName === 'checked') {
          extra['onUpdate:checked'] = (val) => {
            setFieldValue(name, val, true, true)
          }
        } else {
          extra['onUpdate:value'] = (val) => {
            setFieldValue(name, val, true, true)
          }
        }
        const next = cloneVNodeWithProps(vnode, extra)
        if (valuePropName === 'checked' && next && next.props && 'value' in next.props) {
          const props = { ...next.props }
          delete props.value
          next.props = props
        }
        return next
      }
    },
    /** @private 供指令注册视图同步 */
    __bindFieldView (name, updateFn) {
      if (!fieldViews[name]) fieldViews[name] = new Set()
      fieldViews[name].add(updateFn)
      return () => {
        fieldViews[name] && fieldViews[name].delete(updateFn)
      }
    },
    __registerField (name, options = {}) {
      this.getFieldDecorator(name, options)
    },
    /** @private 指令侧用户改值时触发 onValuesChange */
    __setFieldValueFromUser (name, value) {
      setFieldValue(name, value, true, true)
    },
  }

  return form
}

/**
 * 模拟 v1：`this.$form.createForm(vm, options?)`
 */
function createForm (vm, options) {
  return createLegacyFormInstance(vm, options || {})
}

function parseDecoratorBinding (value) {
  if (!Array.isArray(value) || !value.length) return null
  const name = value[0]
  const options = value[1] || {}
  if (!name) return null
  return { name, options }
}

function findLegacyForm (instance) {
  let cur = instance
  while (cur) {
    if (cur.form && cur.form.fc && typeof cur.form.fc.setFieldsValue === 'function') {
      return cur.form.fc
    }
    // filterForm 等：form: this.$form.createForm(this)
    if (cur.form && typeof cur.form.setFieldsValue === 'function') {
      return cur.form
    }
    if (cur.fc && typeof cur.fc.setFieldsValue === 'function') {
      return cur.fc
    }
    cur = cur.$parent
  }
  return null
}

function applyValueToEl (el, value, comp, options = {}) {
  // 允许空字符串 / 空 key 对象用于清空展示
  if (value === undefined) return
  const child = comp || findDecoratedComponent(el) || el.__vueParentComponent
  if (child && child.vnode) {
    const propKey = shouldUseCheckedProp(child, options) ? 'checked' : 'value'
    const nextProps = { ...(child.vnode.props || {}), [propKey]: value }
    // Switch/Checkbox 若残留 value 会触发 antd 告警
    if (propKey === 'checked' && 'value' in nextProps) {
      delete nextProps.value
    }
    child.vnode.props = nextProps
    try {
      if (child.props && propKey in child.props) {
        child.props[propKey] = value
      }
      if (propKey === 'checked' && child.props && 'value' in child.props) {
        delete child.props.value
      }
    } catch (e) { /* props may be readonly — bridge Proxy 会兜底 */ }
  }
  // 禁止写入 a-select 内部 search input，否则会出现选中值与 placeholder 叠字
  if (
    el.classList?.contains('ant-select') ||
    el.querySelector?.('.ant-select, .base-select')
  ) {
    return
  }
  const input = el.matches?.('input, textarea, select')
    ? el
    : el.querySelector?.('input:not([type="checkbox"]):not([type="radio"]), textarea, select')
  if (input && (typeof value === 'string' || typeof value === 'number')) {
    input.value = value
  }
}

function patchComponentEmit (comp, onValue) {
  if (!comp || comp.__legacyDecoratorPatched) return
  const rawEmit = comp.emit.bind(comp)
  comp.emit = (event, ...args) => {
    // 只响应 change / update:value，避免与 input 重复写值、重复触发 onValuesChange
    if (event === 'change' || event === 'update:value' || event === 'update:checked') {
      onValue(normalizeEventValue(args[0]))
    }
    return rawEmit(event, ...args)
  }
  comp.__legacyDecoratorPatched = true
}

function bindDecorator (el, binding) {
  const meta = parseDecoratorBinding(binding.value)
  if (!meta) return
  const fc = findLegacyForm(binding.instance)
  if (!fc) return
  if (el.__legacyDecoratorBound) return

  const comp = findDecoratedComponent(el)

  fc.__registerField(meta.name, meta.options)
  if (typeof fc.__registerFieldEl === 'function') {
    fc.__registerFieldEl(meta.name, el)
  }
  patchComponentValueBridge(comp, meta.name, fc, meta.options)
  patchComponentEmit(comp, (val) => {
    if (typeof fc.__setFieldValueFromUser === 'function') {
      fc.__setFieldValueFromUser(meta.name, val)
    } else {
      fc.setFieldsValue({ [meta.name]: val })
      if (fc.__markTouched) fc.__markTouched(meta.name)
    }
    // change 触发校验（若 validateTrigger 含 change）
    const triggers = [].concat((meta.options && meta.options.validateTrigger) || 'change')
    if (triggers.includes('change') && typeof fc.__validateField === 'function') {
      queueMicrotask(() => fc.__validateField(meta.name))
    }
  })

  // 清掉组件 vnode 上可能残留的 value（Switch/Checkbox）
  if (comp && comp.vnode && shouldUseCheckedProp(comp, meta.options)) {
    sanitizeDecoratorVNode(binding, comp.vnode)
  }

  const propKey = (comp && comp.__decoratorValuePropName) || (shouldUseCheckedProp(comp, meta.options) ? 'checked' : 'value')
  const current = fc.getFieldValue(meta.name)
  // 打桥后需要再渲染一次，才能收集 form.fd 依赖并显示 initialValue（Radio/Select）
  if (comp && comp.__decoratorValuePatched) {
    if (comp.__decoratorSkipValueBridge) {
      if (isRadioGroupComponent(comp) && current !== undefined) {
        syncRadioGroupInternalValue(comp, current)
        queueMicrotask(() => syncRadioGroupInternalValue(comp, current))
        scheduleCompUpdate(comp)
      } else if (isTextInputComponent(comp)) {
        if (current !== undefined && current !== null) applyTextInputValue(comp, el, current)
        else ensureTextInputUncontrolled(comp)
      } else if (isInputNumberComponent(comp) && current !== undefined) {
        applyInputNumberValue(comp, current, el)
      } else if (isSwitchComponent(comp) && current !== undefined) {
        applySwitchValue(comp, current)
      }
    } else if (
      current !== undefined &&
      (propKey === 'checked' ? current !== null : !isEmptyDecoratorValue(current))
    ) {
      try {
        if (comp.props) comp.props[propKey] = current
      } catch (e) { /* ignore */ }
      if (comp.vnode) {
        const next = { ...(comp.vnode.props || {}), [propKey]: current }
        if (propKey === 'checked') delete next.value
        comp.vnode.props = next
      }
      scheduleCompUpdate(comp)
    } else {
      scheduleCompUpdate(comp)
    }
  } else if (isTextInputComponent(comp)) {
    if (current !== undefined && current !== null) applyTextInputValue(comp, el, current)
    else ensureTextInputUncontrolled(comp)
  } else if (isInputNumberComponent(comp) && current !== undefined) {
    applyInputNumberValue(comp, current, el)
  } else if (isSwitchComponent(comp) && current !== undefined) {
    applySwitchValue(comp, current)
  } else {
    applyValueToEl(el, current, comp, meta.options)
  }

  // 仅同步原生表单控件，避免 a-select 等组件冒泡 change 时把值写成 undefined
  const onDomInput = (e) => {
    const t = e && e.target
    if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
    // radio/checkbox 由组件 emit 处理，避免把 value 写成 "on"
    if (t.type === 'radio' || t.type === 'checkbox') return
    const val = normalizeEventValue(e)
    // MobileInput 等复合对象字段由组件 emit 写回；勿用内部 input 的字符串覆盖对象
    const current = typeof fc.getFieldValue === 'function' ? fc.getFieldValue(meta.name) : undefined
    if (
      current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      !isLabelInValueObject(current) &&
      (typeof val === 'string' || typeof val === 'number')
    ) {
      return
    }
    if (typeof fc.__setFieldValueFromUser === 'function') {
      fc.__setFieldValueFromUser(meta.name, val)
    } else {
      fc.setFieldsValue({ [meta.name]: val })
      if (fc.__markTouched) fc.__markTouched(meta.name)
    }
  }
  // 文本 / Radio / InputNumber / Switch 靠组件 emit 写 fd；不要再挂 DOM 捕获
  // 复合控件（DiskSizeInput / MobileInput 等内部另有 input）也勿挂，否则会把内部字符串盖掉表单值
  const wrapsNativeInput = !!(
    comp &&
    el &&
    !isTextInputComponent(comp) &&
    !isInputNumberComponent(comp) &&
    el.querySelector?.('input, textarea, select')
  )
  const skipDomListener = isTextInputComponent(comp) || isRadioGroupComponent(comp) || isInputNumberComponent(comp) || isSwitchComponent(comp) || wrapsNativeInput
  if (!skipDomListener) {
    el.addEventListener('input', onDomInput, true)
    el.addEventListener('change', onDomInput, true)
  }

  // blur / change 校验（名称等字段 validateTrigger: 'blur'）
  const triggers = [].concat((meta.options && meta.options.validateTrigger) || 'change')
  const onDomBlur = () => {
    if (typeof fc.__validateField === 'function') fc.__validateField(meta.name)
  }
  if (triggers.includes('blur')) {
    el.addEventListener('blur', onDomBlur, true)
  }

  const unbindView = fc.__bindFieldView
    ? fc.__bindFieldView(meta.name, (v) => {
      if (comp && comp.__decoratorValuePatched) {
        if (comp.__decoratorSkipValueBridge) {
          if (isRadioGroupComponent(comp)) {
            syncRadioGroupInternalValue(comp, v)
            scheduleCompUpdate(comp)
          } else if (isTextInputComponent(comp)) {
            // 优先 __decoratorSyncValue；无包装时再写 DOM
            if (getTextInputDecoratorSync(comp)) {
              applyTextInputValue(comp, el, v ?? '')
            } else {
              const input = el.matches?.('input, textarea')
                ? el
                : el.querySelector?.('input:not([type="checkbox"]):not([type="radio"]), textarea')
              if (input && String(input.value) !== String(v ?? '')) {
                applyTextInputValue(comp, el, v ?? '')
              }
            }
          } else if (isInputNumberComponent(comp)) {
            applyInputNumberValue(comp, v, el)
          } else if (isSwitchComponent(comp)) {
            applySwitchValue(comp, v)
          }
          return
        }
        if (propKey === 'checked' ? (v !== undefined && v !== null) : !isEmptyDecoratorValue(v)) {
          try {
            if (comp.props) comp.props[propKey] = v
          } catch (e) { /* ignore */ }
          if (comp.vnode) {
            const next = { ...(comp.vnode.props || {}), [propKey]: v }
            if (propKey === 'checked') delete next.value
            comp.vnode.props = next
          }
        } else {
          try {
            if (comp.props) comp.props[propKey] = undefined
          } catch (e) { /* ignore */ }
        }
        scheduleCompUpdate(comp)
        return
      }
      if (isTextInputComponent(comp)) {
        applyTextInputValue(comp, el, v ?? '')
        return
      }
      if (isInputNumberComponent(comp)) {
        applyInputNumberValue(comp, v, el)
        return
      }
      if (isSwitchComponent(comp)) {
        applySwitchValue(comp, v)
        return
      }
      applyValueToEl(el, v, comp, meta.options)
    })
    : () => {}

  el.__legacyDecoratorBound = true
  el.__legacyDecoratorCleanup = () => {
    if (!skipDomListener) {
      el.removeEventListener('input', onDomInput, true)
      el.removeEventListener('change', onDomInput, true)
    }
    if (triggers.includes('blur')) {
      el.removeEventListener('blur', onDomBlur, true)
    }
    unbindView()
    el.__legacyDecoratorBound = false
  }
}

export const decoratorDirective = {
  // 早于组件 onBeforeMount，去掉误传的 value，避免 Switch/Checkbox 告警；文本框保持非受控
  created (el, binding, vnode) {
    sanitizeDecoratorVNode(binding, vnode)
  },
  beforeMount (el, binding, vnode) {
    sanitizeDecoratorVNode(binding, vnode)
  },
  beforeUpdate (el, binding, vnode) {
    sanitizeDecoratorVNode(binding, vnode)
  },
  mounted (el, binding) {
    bindDecorator(el, binding)
  },
  updated (el, binding) {
    // fallthrough 后父级重渲染可能换 DOM；未绑定时补绑
    if (!el.__legacyDecoratorBound) {
      bindDecorator(el, binding)
      return
    }
    const meta = parseDecoratorBinding(binding.value)
    const fc = findLegacyForm(binding.instance)
    if (!meta || !fc) return
    const comp = findDecoratedComponent(el)
    if (comp && !comp.__decoratorValuePatched) {
      patchComponentValueBridge(comp, meta.name, fc, meta.options)
    }
    // Proxy 已接管时禁止在 updated 里写 props / forceUpdate，否则会指令钩子死循环
    if (comp && comp.__decoratorValuePatched) {
      // Radio.Group：折叠面板展开等场景补同步选中态
      if (comp.__decoratorSkipValueBridge) {
        const value = fc.getFieldValue(meta.name)
        if (isRadioGroupComponent(comp) && value !== undefined) {
          syncRadioGroupInternalValue(comp, value)
        } else if (isTextInputComponent(comp) && value !== undefined && value !== null) {
          // focus 导致 Form.Item 重渲染时，从 fd 回写，避免名字被清空
          applyTextInputValue(comp, el, value)
        }
        // Switch / InputNumber：勿在 updated 里反复同步，避免 forceUpdate 死循环卡死
      }
      return
    }

    if (isTextInputComponent(comp)) {
      const value = fc.getFieldValue(meta.name)
      if (value !== undefined && value !== null) applyTextInputValue(comp, el, value)
      else ensureTextInputUncontrolled(comp)
      return
    }

    const value = fc.getFieldValue(meta.name)
    const propKey = shouldUseCheckedProp(comp, meta.options) ? 'checked' : 'value'
    const propVal = comp && comp.props && comp.props[propKey]
    if (!isSameDecoratorValue(propVal, value) && !isEmptyDecoratorValue(value)) {
      applyValueToEl(el, value, comp, meta.options)
    }
  },
  unmounted (el) {
    if (el.__legacyDecoratorCleanup) {
      el.__legacyDecoratorCleanup()
      delete el.__legacyDecoratorCleanup
    }
  },
}

export default {
  // 禁止被 src/plugins/index.js 的 Vue.use 自动安装：
  // compat 下 Vue.use 传入的是 Vue 构造器，不是 createApp 实例，易导致指令未挂到真实 app。
  autoRegister: false,
  install (app) {
    if (app.config && app.config.globalProperties) {
      app.config.globalProperties.$form = {
        createForm,
      }
    }
    if (typeof app.directive === 'function') {
      app.directive('decorator', decoratorDirective)
    }
  },
}
