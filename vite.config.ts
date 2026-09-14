// HTTPS 代理跳过证书校验：用下方 httpsAgent / proxy.secure=false，勿设 NODE_TLS_REJECT_UNAUTHORIZED
//（会触发 Node 的 TLS 不安全警告）

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'
import fs from 'fs'
import https from 'https'
import { createRequire } from 'module'
import lazyRegistryPlugin from './vite-plugin-lazy-registry'

const require = createRequire(import.meta.url)
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

function resolve(dir: string) {
  return path.join(__dirname, dir)
}

function fsExistsSync(filePath: string) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK)
  } catch (e) {
    return false
  }
  return true
}

function getModuleList() {
  return fs.readdirSync(resolve('./containers'))
}

const devServerCustomConfig = fsExistsSync(resolve('./dev.server.config.js'))
  ? require('./dev.server.config.js')
  : {}

const modules = getModuleList()
const aliasSrcDirConfig: Record<string, string> = {}
modules.forEach((item) => {
  aliasSrcDirConfig[`@${item}`] = resolve(`./containers/${item}`)
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve('.'), '')
  Object.assign(process.env, env)
  const apiTarget = env.VITE_PROXY_TARGET || 'https://127.0.0.1:3000'

  const throttleProxyErrorLog = () => {
    const orig = console.error
    let last = 0
    const interval = 10000
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? '')
      if (msg.includes('(throttled)')) {
        orig.apply(console, args as [string?, ...unknown[]])
        return
      }
      if (msg.includes('http proxy error') || msg.includes('ECONNREFUSED')) {
        if (Date.now() - last < interval) return
        last = Date.now()
        orig('[vite] http proxy error (throttled):', msg.slice(0, 60), '…\n  可配置 .env.development.local 的 VITE_PROXY_TARGET 指向后端')
        return
      }
      orig.apply(console, args as [string?, ...unknown[]])
    }
  }

  const iconsVueContextPatch = resolve('./src/patches/icons-vue-context.js')
  const antdUseMergePropsPatch = resolve('./src/patches/antd-useMergeProps.js')
  const antdCloneElementPatch = resolve('./src/patches/antd-cloneElement.js')
  const antdTimeUnitColumnPatch = resolve('./src/patches/antd-TimeUnitColumn.js')
  const antdTimeBodyPatch = resolve('./src/patches/antd-TimeBody.js')
  const antdPickerButtonPatch = resolve('./src/patches/antd-PickerButton.js')
  const antdGetRangesPatch = resolve('./src/patches/antd-getRanges.js')
  const antdPickerHeaderPatch = resolve('./src/patches/antd-PickerHeader.js')
  const antdDateHeaderPatch = resolve('./src/patches/antd-DateHeader.js')
  const antdDatePanelPatch = resolve('./src/patches/antd-DatePanel.js')
  const antdMonthHeaderPatch = resolve('./src/patches/antd-MonthHeader.js')
  const antdMonthPanelPatch = resolve('./src/patches/antd-MonthPanel.js')
  const antdYearHeaderPatch = resolve('./src/patches/antd-YearHeader.js')
  const antdYearPanelPatch = resolve('./src/patches/antd-YearPanel.js')
  return {
  plugins: [
    lazyRegistryPlugin(resolve('.')),
    {
      // 仅修复 icons-vue Context：在 compat/legacy 路径下 inject 可能拿到 undefined，导致 prefixCls 崩溃/图标不渲染
      name: 'patch-icons-vue-context',
      enforce: 'pre',
      resolveId (id: string, importer?: string) {
        if (!id) return null
        const isContext = id === './Context' || id === 'Context' || (id.includes('icons-vue') && id.includes('Context'))
        const fromIconsVue = importer && (importer.includes('icons-vue') || importer.includes('ant-design-vue'))
        if (isContext && (fromIconsVue || id.includes('icons-vue'))) return iconsVueContextPatch
        return null
      },
    },
    {
      // 修复 vc-picker：compat 下 useAttrs 会盖掉 onSelect；不注入 _ctx（部分渲染路径无第二参）
      name: 'patch-antd-useMergeProps',
      enforce: 'pre',
      resolveId (id: string, importer?: string) {
        if (!id) return null
        const fromPicker = !!importer && importer.includes('vc-picker')
        const isMergeProps =
          (id.includes('vc-picker') && id.includes('useMergeProps')) ||
          (fromPicker && (id === './useMergeProps' || id === './useMergeProps.js' || id.endsWith('/useMergeProps') || id.endsWith('/useMergeProps.js')))
        if (isMergeProps) return antdUseMergePropsPatch

        // cloneElement：仅拦截 _util/vnode
        const isVnode =
          id.includes('ant-design-vue') && id.includes('_util/vnode') ||
          (!!importer && importer.includes('ant-design-vue/es/_util') && (id === './vnode' || id === './vnode.js'))
        if (isVnode) return antdCloneElementPatch

        // TimeUnitColumn / TimeBody：时间列点选补丁
        const isTimeUnitColumn =
          (id.includes('vc-picker') && id.includes('TimeUnitColumn')) ||
          (fromPicker && (id === './TimeUnitColumn' || id === './TimeUnitColumn.js' || id.endsWith('/TimeUnitColumn') || id.endsWith('/TimeUnitColumn.js')))
        if (isTimeUnitColumn) return antdTimeUnitColumnPatch

        const isTimeBody =
          (id.includes('vc-picker') && id.includes('TimeBody') && !id.includes('antd-TimeBody')) ||
          (fromPicker && (id === './TimeBody' || id === './TimeBody.js' || id.endsWith('/TimeBody') || id.endsWith('/TimeBody.js')))
        if (isTimeBody) return antdTimeBodyPatch

        // 时间面板「确定」：getRanges / PickerButton
        const isGetRanges =
          (id.includes('vc-picker') && id.includes('getRanges')) ||
          (fromPicker && (id === './getRanges' || id === './getRanges.js' || id.endsWith('/getRanges') || id.endsWith('/getRanges.js')))
        if (isGetRanges) return antdGetRangesPatch

        const isPickerButton =
          (id.includes('date-picker') && id.includes('PickerButton')) ||
          (id === '../PickerButton' || id === '../PickerButton.js' || id.endsWith('/PickerButton') || id.endsWith('/PickerButton.js'))
        if (isPickerButton) return antdPickerButtonPatch

        // 日期面板 Header 翻页 / 年月按钮：compat 下 onClick 丢失
        const isPickerHeader =
          (id.includes('vc-picker') && /panels\/Header(\.js)?$/.test(id.replace(/\\/g, '/'))) ||
          (fromPicker && (id === '../Header' || id === '../Header.js' || id === './Header' || id === './Header.js'))
        if (isPickerHeader) return antdPickerHeaderPatch

        const isDateHeader =
          (id.includes('vc-picker') && id.includes('DateHeader')) ||
          (fromPicker && (id === './DateHeader' || id === './DateHeader.js' || id.endsWith('/DateHeader') || id.endsWith('/DateHeader.js')))
        if (isDateHeader) return antdDateHeaderPatch

        const isDatePanel =
          (id.includes('vc-picker') && /panels\/DatePanel(\/index)?(\.js)?$/.test(id.replace(/\\/g, '/'))) ||
          (fromPicker && (id === './DatePanel' || id === './DatePanel.js' || id === './panels/DatePanel' || id === './panels/DatePanel.js'))
        if (isDatePanel && !id.includes('DateBody') && !id.includes('DateHeader')) return antdDatePanelPatch

        const isMonthHeader =
          (id.includes('vc-picker') && id.includes('MonthHeader')) ||
          (fromPicker && (id === './MonthHeader' || id === './MonthHeader.js'))
        if (isMonthHeader) return antdMonthHeaderPatch

        const isMonthPanel =
          (id.includes('vc-picker') && /panels\/MonthPanel(\/index)?(\.js)?$/.test(id.replace(/\\/g, '/'))) ||
          (fromPicker && (id === './MonthPanel' || id === './MonthPanel.js' || id === './panels/MonthPanel' || id === './panels/MonthPanel.js'))
        if (isMonthPanel && !id.includes('MonthBody') && !id.includes('MonthHeader')) return antdMonthPanelPatch

        const isYearHeader =
          (id.includes('vc-picker') && id.includes('YearHeader')) ||
          (fromPicker && (id === './YearHeader' || id === './YearHeader.js'))
        if (isYearHeader) return antdYearHeaderPatch

        const isYearPanel =
          (id.includes('vc-picker') && /panels\/YearPanel(\/index)?(\.js)?$/.test(id.replace(/\\/g, '/'))) ||
          (fromPicker && (id === './YearPanel' || id === './YearPanel.js' || id === './panels/YearPanel' || id === './panels/YearPanel.js'))
        if (isYearPanel && !id.includes('YearBody') && !id.includes('YearHeader')) return antdYearPanelPatch

        return null
      },
      transform (code: string, id: string) {
        if (!id || id.includes('\0')) return null
        const cleanId = id.split('?')[0]

        // 1) useMergeProps 本体：忽略 useAttrs，只规范化 props
        if (cleanId.includes('vc-picker') && cleanId.includes('hooks/useMergeProps') && !cleanId.includes('antd-useMergeProps')) {
          return {
            code: `import { getCurrentInstance } from 'vue'
function normalizeListener (val) {
  if (typeof val === 'function') return val
  if (!Array.isArray(val)) return val
  const fns = val.filter((v) => typeof v === 'function')
  if (!fns.length) return undefined
  if (fns.length === 1) return fns[0]
  return (...args) => { for (let i = 0; i < fns.length; i++) fns[i](...args) }
}
export default function useMergeProps (props) {
  const instance = getCurrentInstance()
  const attrs = (instance && instance.attrs) || {}
  // props 优先，保留 Header 的 onMonthClick 等 attrs，同时避免错误 attrs 盖掉 onSelect
  const merged = { ...attrs, ...(props || {}) }
  Object.keys(merged).forEach((key) => {
    if (key.startsWith('on')) merged[key] = normalizeListener(merged[key])
  })
  return merged
}
`,
            map: null,
          }
        }

        // 2) vc-picker 面板：防护 onSelect + MODE:3（不再改函数签名/注入 _ctx）
        if (cleanId.includes('/ant-design-vue/es/vc-picker/') && cleanId.endsWith('.js')) {
          let next = code
          // 若热更新残留了 _ctx 调用，收回
          next = next.replace(/function\s+([A-Za-z0-9_]+)\s*\(\s*_props\s*,\s*_ctx\s*\)\s*\{/g, 'function $1(_props) {')
          next = next.replace(/useMergeProps\(\s*_props\s*,\s*_ctx\s*\)/g, 'useMergeProps(_props)')
          next = next.replace(/useMergeProps\(\s*props\s*,\s*_ctx\s*\)/g, 'useMergeProps(props)')
          next = next.replace(/useMergeProps\(\s*props\s*,\s*_ref\s*\)/g, 'useMergeProps(props)')

          if (next.includes('useMergeProps') || next.includes('onSelect') || next.includes('defineComponent')) {
            next = next.replace(
              /(\w+)\.displayName = '([^']+)';\n\1\.inheritAttrs = false;(?:\n\1\.compatConfig = \{ MODE: 3 \};)?/g,
              "$1.displayName = '$2';\n$1.inheritAttrs = false;\n$1.compatConfig = { MODE: 3 };",
            )
            if (cleanId.includes('PanelBody.js') && next.includes('onSelect(currentDate)') && !next.includes('typeof select ===')) {
              next = next.replace(
                /if\s*\(\s*!disabled\s*\)\s*\{\s*onSelect\(currentDate\);\s*\}/g,
                `if (!disabled) {
            const select = typeof onSelect === 'function' ? onSelect : (Array.isArray(onSelect) ? onSelect.find(fn => typeof fn === 'function') : null);
            if (typeof select === 'function') select(currentDate);
          }`,
              )
            }
            next = next.replace(
              /date\s*=>\s*onSelect\(date,\s*'mouse'\)/g,
              "date => { if (typeof onSelect === 'function') onSelect(date, 'mouse') }",
            )
            if (cleanId.includes('TimeUnitColumn.js')) {
              next = next.replace(
                /onSelect\(unit\.value\);/g,
                `const __select = typeof onSelect === 'function' ? onSelect : (Array.isArray(onSelect) ? onSelect.find(fn => typeof fn === 'function') : null);
            if (typeof __select === 'function') __select(unit.value);`,
              )
            }
            // TimeBody：用 selectHandler 传回调，避免 onSelect 被 Vue 当事件
            if (cleanId.includes('TimeBody.js') && !next.includes('selectHandler: onColumnSelect')) {
              next = next.replace(
                /onSelect:\s*onColumnSelect,/g,
                'selectHandler: onColumnSelect, onSelect: onColumnSelect,',
              )
            }
            if (cleanId.includes('TimeBody.js') && next.includes('onSelect(setTime(') && !next.includes('typeof onSelect === "function" ? onSelect')) {
              next = next.replace(
                /onSelect\(setTime\(/g,
                '(typeof onSelect === "function" ? onSelect : () => {})(setTime(',
              )
            }
            if (next.includes('defineComponent({') && !next.includes('compatConfig: { MODE: 3 }')) {
              next = next.replace(
                /defineComponent\(\{\s*\n(\s*)name:/g,
                'defineComponent({\n$1compatConfig: { MODE: 3 },\n$1name:',
              )
            }
          }
          if (next !== code) return { code: next, map: null }
        }

        // 3) date-picker / time-picker defineComponent MODE:3
        if (
          (cleanId.includes('/ant-design-vue/es/date-picker/') || cleanId.includes('/ant-design-vue/es/time-picker/')) &&
          cleanId.endsWith('.js') &&
          code.includes('defineComponent({') &&
          !code.includes('compatConfig: { MODE: 3 }')
        ) {
          const next = code.replace(
            /defineComponent\(\{\s*\n(\s*)name:/g,
            'defineComponent({\n$1compatConfig: { MODE: 3 },\n$1name:',
          )
          if (next !== code) return { code: next, map: null }
        }

        // 4) TimePicker：列点击立即写入（无需再点确定）
        if (cleanId.includes('/ant-design-vue/es/vc-picker/Picker.js') && !code.includes("picker.value === 'time' && type === 'mouse'")) {
          const next = code.replace(
            /const onContextSelect = \(date, type\) => \{\s*if \(type === 'submit' \|\| type !== 'key' && !needConfirmButton\.value\) \{\s*\/\/ triggerChange will also update selected values\s*triggerChange\(date\);\s*triggerOpen\(false\);\s*\}\s*\};/,
            `const onContextSelect = (date, type) => {
        if (type === 'submit' || type !== 'key' && !needConfirmButton.value) {
          // triggerChange will also update selected values
          triggerChange(date);
          triggerOpen(false);
        } else if (picker.value === 'time' && type === 'mouse') {
          // compat：时间列点选后立即写入，无需再点确定
          triggerChange(date);
        }
      };`,
          )
          if (next !== code) return { code: next, map: null }
        }

        // 5) PickerPanel：确定按钮不因 mergedValue 瞬时空值被禁用；onOk 有值才提交
        if (cleanId.includes('/ant-design-vue/es/vc-picker/PickerPanel.js') && !code.includes('/* patch-ok-disabled */')) {
          let next = code
          next = next.replace(
            /okDisabled:\s*!mergedValue\.value\s*\|\|\s*disabledDate\s*&&\s*disabledDate\(mergedValue\.value\),/,
            'okDisabled: /* patch-ok-disabled */ !!(disabledDate && mergedValue.value && disabledDate(mergedValue.value)),',
          )
          next = next.replace(
            /onOk:\s*\(\)\s*=>\s*\{\s*if\s*\(mergedValue\.value\)\s*\{\s*triggerSelect\(mergedValue\.value,\s*'submit',\s*true\);/,
            `onOk: () => {
              const okVal = mergedValue.value || viewDate.value;
              if (okVal) {
                triggerSelect(okVal, 'submit', true);`,
          )
          if (next !== code) return { code: next, map: null }
        }

        // 6) Button：compat 下显式调用 props.onClick（确定按钮等）
        if (cleanId.includes('/ant-design-vue/es/button/button.js') && !code.includes('compat：onClick 作为 prop')) {
          const next = code.replace(
            /const handleClick = event => \{\s*\/\/ https:\/\/github\.com\/ant-design\/ant-design\/issues\/30207\s*if \(innerLoading\.value \|\| mergedDisabled\.value\) \{\s*event\.preventDefault\(\);\s*return;\s*\}\s*emit\('click', event\);\s*\};/,
            `const handleClick = event => {
      // https://github.com/ant-design/ant-design/issues/30207
      if (innerLoading.value || mergedDisabled.value) {
        event.preventDefault();
        return;
      }
      // compat：onClick 作为 prop 时 emit 可能调不到，这里显式调用
      const propClick = props.onClick;
      if (typeof propClick === 'function') {
        propClick(event);
      } else if (Array.isArray(propClick)) {
        propClick.forEach(fn => {
          if (typeof fn === 'function') fn(event);
        });
      } else {
        emit('click', event);
      }
    };`,
          )
          if (next !== code) return { code: next, map: null }
        }

        return null
      },
    },
    {
      // 兜底防崩：避免 icon 传入异常时整页白屏（便于继续验证 a-input-password 行为）
      name: 'patch-icons-vue-antdicon-guard-icon',
      enforce: 'pre',
      transform (code: string, id: string) {
        if (!id) return null
        if (!id.includes('/@ant-design/icons-vue/es/components/AntdIcon.js')) return null
        if (code.includes('if (!icon) {\n    return null;\n  }')) return null
        const anchor = 'var _useInjectIconContext = useInjectIconContext(),'
        const idx = code.indexOf(anchor)
        if (idx === -1) return null
        const guard = "if (!icon) {\n    return null;\n  }\n\n  "
        return { code: code.slice(0, idx) + guard + code.slice(idx), map: null }
      },
    },
    vue({
      // 允许 <script> 内写 JSX（无需逐个加 lang），配合 optimizeDeps.esbuildOptions 避免依赖扫描时报错
      script: {
        // 一些旧 dialogs 在普通 <script> 中写了 JSX/TSX 片段（例如 vxe slots），需要同时开启 jsx/typescript
        babelParserPlugins: ['jsx', 'typescript'],
      },
      // 使用 @vue/compat 时需要在“模板编译阶段”也开启 compat，否则诸如 `slot="header"` 等 Vue2 语法不会被识别，
      // 结果就是 BaseDialog 只能渲染默认 slot 内容（Dialog default header/body/footer）。
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2,
          },
          // 迁移期大量 Vue2 语法会刷 COMPILER_* deprecation，淹没真实错误；此处只压制 deprecation
          onWarn (warning) {
            const msg = String((warning && (warning.message || warning.msg)) || warning || '')
            if (
              msg.includes('deprecation') ||
              msg.includes('COMPILER_V_BIND') ||
              msg.includes('COMPILER_NATIVE_TEMPLATE') ||
              msg.includes('COMPILER_FILTERS') ||
              msg.includes('compat behavior') ||
              msg.includes('>>> and /deep/') ||
              msg.includes('::v-deep')
            ) {
              return
            }
            // eslint-disable-next-line no-console
            console.warn('[vue/compiler]', msg)
          },
        },
      },
    }),
    vueJsx({
      // 迁移期：大量旧代码在 .vue 的普通 <script>、以及 containers/**/mixins/columns.js 中直接写 JSX
      include: [
        /\.vue\?vue&type=script/,
        /\.jsx$/,
        /\.tsx$/,
        /\/(src|containers|scope)\/.*\.js$/,
      ],
    }),
    {
      // @vue/compat：Trigger.data() 里对 this 动态赋值 fireOnXxx 会触发 Proxy set/get 递归 → Maximum call stack
      // 改为把处理器放进 data() 返回对象（一次性建立），与 DatePicker 无关，仅修复 vc-trigger
      name: 'patch-antd-vc-trigger-dynamic-fire-handlers',
      enforce: 'pre',
      transform (code: string, id: string) {
        if (!id) return null
        if (!id.includes('/ant-design-vue/es/vc-trigger/Trigger.js')) return null
        if (code.includes('const fireHandlers = {};') && code.includes('...fireHandlers')) return null
        const from = `ALL_HANDLERS.forEach(h => {\n      this[\`fire\${h}\`] = e => {\n        this.fireEvents(h, e);\n      };\n    });\n    return {`
        if (!code.includes(from)) return null
        const to = `const fireHandlers = {};\n    ALL_HANDLERS.forEach(h => {\n      fireHandlers[\`fire\${h}\`] = e => {\n        this.fireEvents(h, e);\n      };\n    });\n    return {\n      ...fireHandlers,`
        const next = code.replace(from, to)
        if (next === code) return null
        return { code: next, map: null }
      },
    },
    {
      // Vue2 Form 装饰器习惯传 value；antdv4 Switch 只认 checked。兼容：value→checked，去掉告警
      name: 'patch-antd-switch-value-as-checked',
      enforce: 'pre',
      transform (code: string, id: string) {
        if (!id || !id.includes('/ant-design-vue/es/switch/index.js')) return null
        if (code.includes('__oc_switch_value_as_checked__')) return null
        let next = code
        next = next.replace(
          "warning(!('value' in attrs), 'Switch', '`value` is not validate prop, do you mean `checked`?');",
          "/* __oc_switch_value_as_checked__ */",
        )
        next = next.replace(
          'const checked = ref(props.checked !== undefined ? props.checked : attrs.defaultChecked);',
          `const checked = ref(props.checked !== undefined ? props.checked : (attrs.value !== undefined ? attrs.value : attrs.defaultChecked));`,
        )
        if (next === code) return null
        return { code: next, map: null }
      },
    },
    { name: 'throttle-proxy-errors', configureServer: throttleProxyErrorLog },
    {
      // 压制 @vue/compiler-sfc / vite:vue 直接打到 console 的迁移期 deprecation（onWarn 覆盖不到的那部分）
      name: 'suppress-vue-migration-deprecations',
      configureServer () {
        const origWarn = console.warn
        console.warn = (...args: unknown[]) => {
          const msg = args.map((a) => String(a ?? '')).join(' ')
          if (
            msg.includes('(deprecation') ||
            msg.includes('COMPILER_V_BIND') ||
            msg.includes('COMPILER_NATIVE_TEMPLATE') ||
            msg.includes('COMPILER_FILTERS') ||
            msg.includes('compat behavior is disabled') ||
            msg.includes('>>> and /deep/') ||
            msg.includes('::v-deep usage')
          ) {
            return
          }
          origWarn.apply(console, args as [string?, ...unknown[]])
        }
      },
    },
  ],
  optimizeDeps: {
    entries: [resolve('./index.html')],
    // 懒路由首次 import 会触发 rediscover → full page reload；把高频包预声明，启动时一次打完
    include: [
      'objectpath',
      // dayjs 插件为 UMD，无 ESM default 导出，预打包后由 esbuild 做 CJS 互操作
      'dayjs',
      'dayjs/plugin/advancedFormat',
      'dayjs/plugin/customParseFormat',
      'dayjs/plugin/weekday',
      'dayjs/plugin/localeData',
      'dayjs/plugin/weekOfYear',
      'dayjs/plugin/weekYear',
      'dayjs/plugin/quarterOfYear',
      // 预打包 icons 相关，避免深层 import（无 .js 扩展）在某些 compat/legacy 路径下出现 undefined
      '@ant-design/icons-vue',
      '@ant-design/icons-svg',
      // 开发期曾触发 “optimized dependencies changed. reloading” 的懒依赖
      'xlsx',
      'ipaddr.js',
      'uplot',
      'resize-detector',
      'xterm',
      'dompurify',
      'marked',
      'codemirror',
      'codemirror/addon/edit/matchbrackets',
      'codemirror/mode/yaml/yaml.js',
      'codemirror/mode/javascript/javascript.js',
      'codemirror/mode/htmlmixed/htmlmixed.js',
      'codemirror/mode/xml/xml.js',
      'codemirror/mode/shell/shell',
      'codemirror/addon/scroll/annotatescrollbar.js',
      'codemirror/addon/search/matchesonscrollbar.js',
      'codemirror/addon/search/match-highlighter.js',
      'codemirror/addon/search/jump-to-line.js',
      'codemirror/addon/dialog/dialog.js',
      'codemirror/addon/search/searchcursor.js',
      'codemirror/addon/search/search.js',
      'echarts/lib/echarts',
      'echarts/lib/chart/heatmap',
      'echarts/lib/chart/scatter',
      'echarts/lib/component/grid',
      'echarts/lib/component/title',
      'echarts/lib/component/tooltip',
      'echarts/lib/component/geo',
      'echarts/lib/component/toolbox',
      'echarts/lib/component/legend',
    ],
    exclude: [
      '@interactjs/core',
      '@interactjs/auto-start',
      '@interactjs/inertia',
      '@interactjs/pointer-events',
      'ant-design-vue',
    ],
    // 依赖扫描阶段：esbuild 需按 JSX 解析含 <tag> 的脚本，否则 “JSX syntax extension is not enabled”
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
        '.mjs': 'jsx',
      },
      jsx: 'automatic',
      // Vue JSX（避免自动指向 react/jsx-runtime）
      jsxImportSource: 'vue',
    },
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    // 关键：强制依赖图只使用同一份 Vue（@vue/compat），避免出现 configureCompat 作用于 A 实例、
    // 但运行时 compat 转换使用 B 实例（从而仍然走 convertLegacyAsyncComponent）。
    dedupe: ['vue', 'dayjs'],
    alias: {
      '@ant-design/icons-vue/es/components/Context': iconsVueContextPatch,
      'ant-design-vue/es/vc-picker/hooks/useMergeProps': antdUseMergePropsPatch,
      'ant-design-vue/es/vc-picker/hooks/useMergeProps.js': antdUseMergePropsPatch,
      'ant-design-vue/es/_util/vnode': antdCloneElementPatch,
      'ant-design-vue/es/_util/vnode.js': antdCloneElementPatch,
      'ant-design-vue/es/vc-picker/panels/Header': antdPickerHeaderPatch,
      'ant-design-vue/es/vc-picker/panels/Header.js': antdPickerHeaderPatch,
      'ant-design-vue/es/vc-picker/panels/DatePanel/DateHeader': antdDateHeaderPatch,
      'ant-design-vue/es/vc-picker/panels/DatePanel/DateHeader.js': antdDateHeaderPatch,
      // 必须用 $ 精确匹配，否则会误伤 DatePanel/DateBody.js
      'ant-design-vue/es/vc-picker/panels/DatePanel$': antdDatePanelPatch,
      'ant-design-vue/es/vc-picker/panels/DatePanel/index': antdDatePanelPatch,
      'ant-design-vue/es/vc-picker/panels/DatePanel/index.js': antdDatePanelPatch,
      'ant-design-vue/es/vc-picker/panels/MonthPanel/MonthHeader': antdMonthHeaderPatch,
      'ant-design-vue/es/vc-picker/panels/MonthPanel/MonthHeader.js': antdMonthHeaderPatch,
      'ant-design-vue/es/vc-picker/panels/MonthPanel$': antdMonthPanelPatch,
      'ant-design-vue/es/vc-picker/panels/MonthPanel/index': antdMonthPanelPatch,
      'ant-design-vue/es/vc-picker/panels/MonthPanel/index.js': antdMonthPanelPatch,
      'ant-design-vue/es/vc-picker/panels/YearPanel/YearHeader': antdYearHeaderPatch,
      'ant-design-vue/es/vc-picker/panels/YearPanel/YearHeader.js': antdYearHeaderPatch,
      'ant-design-vue/es/vc-picker/panels/YearPanel$': antdYearPanelPatch,
      'ant-design-vue/es/vc-picker/panels/YearPanel/index': antdYearPanelPatch,
      'ant-design-vue/es/vc-picker/panels/YearPanel/index.js': antdYearPanelPatch,
      'ant-design-vue/es/vc-picker/panels/TimePanel/TimeUnitColumn': antdTimeUnitColumnPatch,
      'ant-design-vue/es/vc-picker/panels/TimePanel/TimeUnitColumn.js': antdTimeUnitColumnPatch,
      'ant-design-vue/es/vc-picker/panels/TimePanel/TimeBody': antdTimeBodyPatch,
      'ant-design-vue/es/vc-picker/panels/TimePanel/TimeBody.js': antdTimeBodyPatch,
      'ant-design-vue/es/vc-picker/utils/getRanges': antdGetRangesPatch,
      'ant-design-vue/es/vc-picker/utils/getRanges.js': antdGetRangesPatch,
      'ant-design-vue/es/date-picker/PickerButton': antdPickerButtonPatch,
      'ant-design-vue/es/date-picker/PickerButton.js': antdPickerButtonPatch,
      // vxe-table v4 + xe-utils v3 不再需要对 xe-utils/methods/xe-utils 做映射
      // 继续使用 @vue/compat；绝对路径避免与 node_modules/vue 并存成双实例
      // （双实例会导致 renderSlot 读 currentRenderingInstance.ce 报 null）
      vue: resolve('./node_modules/@vue/compat'),
      '@interactjs/interactjs': resolve('./node_modules/interactjs'),
      '@': resolve('./src'),
      '~': resolve('./src'),
      '@@': resolve('.'),
      '~~': resolve('.'),
      '@scope': resolve('./scope'),
      '@containers': resolve('./containers'),
      ...aliasSrcDirConfig,
    },
  },
  server: (() => {
    const useDevServerProxy = devServerCustomConfig && typeof devServerCustomConfig.proxy === 'object'
    const baseProxy = useDevServerProxy
      ? { ...devServerCustomConfig.proxy }
      : {
          '/api': {
            target: apiTarget,
            ws: true,
            changeOrigin: true,
            timeout: 1000 * 60 * 2,
          },
        }
    const proxyErrorConfigure = (proxy: any) => {
      let lastLog = 0
      let errorCount = 0
      const interval = 10000
      proxy.removeAllListeners('error')
      proxy.on('error', (err: Error & { code?: string }, req: any, res: any) => {
        errorCount += 1
        const now = Date.now()
        if (errorCount <= 3 || now - lastLog >= interval) {
          lastLog = now
          // 直接写 stderr，避免被 throttle 插件吞掉，便于看到真实原因（如 UNABLE_TO_VERIFY_LEAF_SIGNATURE、ECONNREFUSED）
          const msg = `[vite] http proxy error: ${req?.url || err.message}\n  code: ${(err as any).code}  message: ${err.message}\n  可修改 dev.server.config.js 的 proxy["/api"].target\n`
          process.stderr.write(msg)
        }
        if (res && !res.headersSent) {
          res.writeHead(502, {
            'Content-Type': 'application/json',
            'X-Vite-Proxy-Error': '1', // 便于在 Network 里区分：有此项说明是代理连接失败，无此项说明 502 来自后端
          })
          res.end(JSON.stringify({ error: 'Bad Gateway', message: 'Backend unreachable' }))
        }
      })

      // 有些环境下后端已返回但浏览器仍 Pending，多发生在 HTTPS + 代理连接复用/压缩流边界上。
      // 这里强制关闭复用并禁用压缩，尽量让代理能稳定收到并结束响应。
      proxy.removeAllListeners('proxyReq')
      proxy.on('proxyReq', (proxyReq: any) => {
        try {
          proxyReq.setHeader('Connection', 'close')
          proxyReq.setHeader('Accept-Encoding', 'identity')
        } catch (e) {}
      })
    }
    // 与 ee/dashboard 对齐；HTTPS 目标时用 agent 跳过证书校验，避免 Backend unreachable
    if (baseProxy['/api'] && typeof baseProxy['/api'] === 'object') {
      const apiConf = baseProxy['/api'] as Record<string, unknown>
      const target = String(apiConf.target || '')
      baseProxy['/api'] = {
        ...apiConf,
        secure: false,
        timeout: 1000 * 60 * 2,
        proxyTimeout: 1000 * 60 * 2,
        ...(target.startsWith('https:') ? { agent: httpsAgent } : {}),
        configure: proxyErrorConfigure,
      }
    }
    return {
      port: devServerCustomConfig?.port ?? 8082,
      open: devServerCustomConfig?.open ?? process.platform === 'darwin',
      proxy: baseProxy,
      watch: {
        ignored: [/.git/, /node_modules/],
      },
    }
  })(),
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  // 让 esbuild 在 dev/build 阶段以 JSX 解析 .js 等（与 optimizeDeps.esbuildOptions 一致）
  esbuild: {
    loader: 'jsx',
  },
  build: {
    // locales/index.js 使用顶层 await 预加载文案；需 es2022+（Chrome 89+）
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks (id) {
          if (!id.includes('node_modules')) return
          // vue 与 ant-design-vue 必须同 chunk：拆开会交叉初始化
          // （拆开 → Cannot access 'X' before initialization；vue 打进 antd 副本 → renderSlot null.ce）
          // 勿把 vue-router / vuex / vue-i18n 并进来
          if (
            id.includes('node_modules/@vue/') ||
            id.includes('node_modules\\@vue\\') ||
            id.includes('node_modules/vue/') ||
            id.includes('node_modules\\vue\\') ||
            /node_modules[/\\]vue[/\\]?$/.test(id) ||
            id.includes('ant-design-vue') ||
            id.includes('@ant-design')
          ) {
            return 'vue-antd'
          }
          if (id.includes('vxe-table') || id.includes('vxe-pc-ui') || id.includes('xe-utils')) return 'vxe'
          if (id.includes('echarts') || id.includes('v-charts') || id.includes('zrender')) return 'charts'
          if (id.includes('codemirror') || id.includes('xterm') || id.includes('wangeditor')) return 'editors'
        },
      },
    },
  },
  define: {
    'process.env': process.env,
    // vue-i18n esm-bundler 特性开关：保持 legacy API（$t/$te）可用
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: true,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  }
})
