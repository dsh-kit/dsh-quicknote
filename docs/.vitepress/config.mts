import { defineConfig } from 'vitepress'

const repository = 'https://github.com/dsh-kit/dsh-quicknote'
const editPattern = `${repository}/edit/main/docs/:path`

const base = process.env.VITEPRESS_BASE ?? '/'

export default defineConfig({
  base,
  title: 'dsh-quicknote',
  description: 'Quick notes inside DeepSeek Harness.',
  cleanUrls: false,
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: `${base}icon.svg`, type: 'image/svg+xml' }]],
  locales: {
    root: { label: 'English', lang: 'en' },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        editLink: { pattern: editPattern, text: '在 GitHub 上编辑此页' },
        outline: { label: '本页目录' },
        nav: [
          { text: '安装', link: '/zh/guide/install' },
          { text: '使用', link: '/zh/guide/usage' },
          { text: '参考', link: '/zh/reference/api' }
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '指南',
              items: [
                { text: '安装', link: '/zh/guide/install' },
                { text: '使用', link: '/zh/guide/usage' },
                { text: '开发', link: '/zh/guide/development' }
              ]
            },
            { text: '参考', items: [{ text: '数据与 API', link: '/zh/reference/api' }] }
          ],
          '/zh/reference/': [{ text: '参考', items: [{ text: '数据与 API', link: '/zh/reference/api' }] }]
        }
      }
    }
  },
  themeConfig: {
    logo: '/logo-a.svg',
    socialLinks: [{ icon: 'github', link: repository }],
    editLink: { pattern: editPattern, text: 'Edit this page on GitHub' },
    search: { provider: 'local' },
    nav: [
      { text: 'Install', link: '/guide/install' },
      { text: 'Usage', link: '/guide/usage' },
      { text: 'Reference', link: '/reference/api' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Install', link: '/guide/install' },
            { text: 'Usage', link: '/guide/usage' },
            { text: 'Development', link: '/guide/development' }
          ]
        },
        { text: 'Reference', items: [{ text: 'Data and API', link: '/reference/api' }] }
      ],
      '/reference/': [{ text: 'Reference', items: [{ text: 'Data and API', link: '/reference/api' }] }]
    },

  }
})
