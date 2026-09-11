import Mock from 'mockjs'

Mock.setup({
  timeout: '500-800',
})

const mockModules = import.meta.glob('./services/**/*.mock.js', { eager: true })

Object.values(mockModules).forEach((mod) => {
  if (!mod) return
  const defs = mod.default || mod
  Object.keys(defs || {}).forEach((paramKey) => {
    Mock.mock(...defs[paramKey])
  })
})
