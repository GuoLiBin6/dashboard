module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  // Vue3 render / JSX 兼容：部分文件仍直接使用 h，未从 'vue' 显式导入
  globals: {
    h: 'readonly',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'comma-dangle': ['error', 'always-multiline'],
    camelcase: process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'import/order': ['warn', {
      groups: ['builtin', 'external', 'internal', ['sibling', 'parent'], 'index'],
      pathGroups: [
        {
          pattern: '@/**',
          group: 'internal',
        },
      ],
    }],
    'vue/html-closing-bracket-newline': ['error', {
      multiline: 'never',
    }],
    'vue/html-closing-bracket-spacing': ['error', {
      startTag: 'never',
      endTag: 'never',
      selfClosingTag: 'always',
    }],
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/html-quotes': ['error', 'double'],
    'vue/html-self-closing': ['error', {
      html: {
        void: 'always',
        normal: 'always',
        component: 'always',
      },
      svg: 'always',
      math: 'always',
    }],
    'vue/order-in-components': ['error', {
      order: [
        'el',
        'name',
        'parent',
        'functional',
        ['delimiters', 'comments'],
        ['components', 'directives', 'filters'],
        'extends',
        'mixins',
        'inheritAttrs',
        'model',
        ['props', 'propsData'],
        'data',
        'computed',
        'watch',
        'LIFECYCLE_HOOKS',
        'methods',
        ['template', 'render'],
        'renderError',
      ],
    }],
    'no-useless-catch': 0,
    'no-prototype-builtins': 0,
    // Vue3：允许 v-model:value / v-model:open 等带参数写法（plugin-vue@6 仍按 Vue2 校验）
    'vue/valid-v-model': 'off',
    // Vue3：key 应写在 <template v-for> 上；plugin-vue@6 仍按 Vue2 禁止并要求子节点带 key
    'vue/no-template-key': 'off',
    'vue/require-v-for-key': 'off',
    'vue/valid-v-for': 'off',
    // Vue3：多根节点 / <template> 作为根；plugin-vue@6 仍按 Vue2 单根校验
    'vue/valid-template-root': 'off',
    // Vue3 可选链调用 this.foo?.() 会被误判为 unused expression
    'no-unused-expressions': 'off',
    // 迁移期内部状态字段（_debounced* / _resizeState 等）
    'vue/no-reserved-keys': 'off',
    'no-void': 'off',
    // 同源 svg 多别名导入（如 huawei / hcs）
    'import/no-duplicates': 'off',
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
}
