/**
 * Decorator 动态 key（`ports[uuid]` / `serviceNames[i][j]`）↔ a-form-model 嵌套 maps。
 */

export function parseBracketName (name) {
  if (!name || typeof name !== 'string') return null
  const m = name.match(/^([^[\]]+)((?:\[[^[\]]+\])+)$/)
  if (!m) return { root: name, path: [] }
  const root = m[1]
  const path = []
  const re = /\[([^[\]]+)\]/g
  let match
  while ((match = re.exec(m[2])) !== null) {
    path.push(match[1])
  }
  return { root, path }
}

export function getBracketValue (model, name) {
  if (!model || !name) return undefined
  const parsed = parseBracketName(name)
  if (!parsed) return undefined
  if (!parsed.path.length) return model[parsed.root]
  let cur = model[parsed.root]
  for (const p of parsed.path) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[p]
  }
  return cur
}

/** Vue2/3：$set / $delete 写嵌套；value === undefined 时删除 */
export function setBracketValue (vm, model, name, value) {
  if (!vm || !model || !name) return
  const parsed = parseBracketName(name)
  if (!parsed) return
  if (!parsed.path.length) {
    if (value === undefined) {
      if (Object.prototype.hasOwnProperty.call(model, parsed.root)) vm.$delete(model, parsed.root)
    } else {
      vm.$set(model, parsed.root, value)
    }
    return
  }
  if (!model[parsed.root] || typeof model[parsed.root] !== 'object') {
    vm.$set(model, parsed.root, {})
  }
  let cur = model[parsed.root]
  for (let i = 0; i < parsed.path.length - 1; i++) {
    const p = parsed.path[i]
    if (!cur[p] || typeof cur[p] !== 'object') vm.$set(cur, p, {})
    cur = cur[p]
  }
  const last = parsed.path[parsed.path.length - 1]
  if (value === undefined) {
    if (Object.prototype.hasOwnProperty.call(cur, last)) vm.$delete(cur, last)
  } else {
    vm.$set(cur, last, value)
  }
}

/** 将 fd 上残留的扁平 bracket key 展开为嵌套（提交兜底） */
export function expandBracketFd (fd = {}) {
  const out = { ...fd }
  Object.keys(fd).forEach((key) => {
    const parsed = parseBracketName(key)
    if (!parsed || !parsed.path.length) return
    // 扁平 key 本身不出现在业务读路径
    delete out[key]
    const { root, path } = parsed
    if (!out[root] || typeof out[root] !== 'object' || Array.isArray(out[root])) {
      out[root] = {}
    }
    let cur = out[root]
    for (let i = 0; i < path.length - 1; i++) {
      if (!cur[path[i]] || typeof cur[path[i]] !== 'object') cur[path[i]] = {}
      cur = cur[path[i]]
    }
    cur[path[path.length - 1]] = fd[key]
  })
  return out
}
