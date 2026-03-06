/**
 * @file 站点配置文件
 * @description 集中管理所有可配置的站点内容，支持通过修改此文件快速定制站点
 * @module config/site.config
 *
 * 使用说明：
 * 1. 修改 siteInfo 中的基本信息
 * 2. 在 navigation 中配置导航菜单
 * 3. 在 pages 中配置各页面内容
 * 4. 在 theme 中自定义主题样式
 */

export const siteConfig = {
  /**
   * 站点基本信息
   */
  siteInfo: {
    name: '星际公民团队站',
    nameEn: 'Star Citizen Team Portal',
    description: '面向星际公民玩家的团队门户，展示组织定位、核心成员、活动任务与招募信息',
    version: '1.0.0',
    author: 'Your Team Name',
    email: 'team@example.com',
    discord: 'your-discord-invite',
    qqGroup: '123456789',
    github: 'https://github.com/your-org',
    year: new Date().getFullYear()
  },

  /**
   * 导航菜单配置
   * @property {string} label - 显示文本
   * @property {string} to - 路由路径
   * @property {boolean} external - 是否外部链接
   * @property {string} icon - 图标名称（可选）
   */
  navigation: [
    { label: '首页', to: '/', icon: 'home' },
    { label: '团队介绍', to: '/about', icon: 'team' },
    { label: '核心成员', to: '/members', icon: 'members' },
    { label: '活动项目', to: '/projects', icon: 'projects' },
    { label: '加入我们', to: '/join', icon: 'join' },
    { label: '联系我们', to: '/contact', icon: 'contact' }
  ],

  /**
   * 首页配置
   */
  home: {
    hero: {
      badge: 'UEE STYLE ORGANIZATION PORTAL',
      title: '星际公民战队',
      subtitle: '官方招募站',
      description: '面向星际公民玩家的团队门户，支持展示组织定位、核心成员、活动任务与招募信息。',
      primaryButton: {
        text: '开始探索',
        to: '/about'
      },
      secondaryButton: {
        text: '官方网站',
        href: 'https://robertsspaceindustries.com/',
        external: true
      }
    },
    opsStrip: {
      stardate: '2956.03',
      sector: 'pyro fringe',
      operationId: 'f8c-alpha'
    },
    stats: [
      { label: '团队成员', value: '20+', icon: 'users' },
      { label: '每周活动', value: '3 场', icon: 'calendar' },
      { label: '合作组织', value: '12+', icon: 'network' }
    ]
  },

  /**
   * 团队介绍页配置
   */
  about: {
    sections: [
      {
        title: '我们是谁',
        content: '替换为团队简介：组织定位、风格、主要玩法方向。'
      },
      {
        title: '我们的目标',
        content: '替换为中长期目标：成员成长、行动规划、对外合作。'
      },
      {
        title: '文化与纪律',
        content: '替换为行为准则：沟通方式、活动出勤、协作流程。'
      }
    ],
    timeline: [
      { date: '2954.Q1', title: '组织成立', desc: '在斯坦顿星系正式组建核心团队' },
      { date: '2954.Q3', title: '首次大型行动', desc: '完成首次跨星系护航任务' },
      { date: '2955.Q2', title: '成员突破', desc: '团队规模扩展至20名活跃成员' },
      { date: '2956.Q1', title: '战略升级', desc: '开启Pyro星系探索计划' }
    ]
  },

  /**
   * 加入我们页配置
   */
  join: {
    requirements: [
      '尊重团队协作与沟通规则',
      '愿意参加基础训练与复盘',
      '每周有稳定在线时间',
      '拥有基础的游戏设备与网络条件'
    ],
    process: [
      '提交申请信息',
      '完成语音面谈',
      '参与试训活动',
      '正式加入团队'
    ],
    availabilityOptions: [
      { value: 'weekdays', label: '工作日晚上' },
      { value: 'weekends', label: '周末全天' },
      { value: 'flexible', label: '时间灵活' },
      { value: 'limited', label: '时间有限' }
    ]
  },

  /**
   * 联系我们页配置
   */
  contact: {
    channels: [
      { label: 'Discord', value: '待填', href: '#' },
      { label: '邮箱', value: 'team@example.com', href: 'mailto:team@example.com' },
      { label: 'QQ群', value: '待填', href: '#' }
    ],
    cooperation: {
      description: '可放置合作方向、商务联系窗口与响应时间说明。我们欢迎与其他组织建立长期合作关系，共同探索星际公民的无限可能。',
      responseTime: '24-48 小时'
    },
    socialLinks: [
      { platform: 'bilibili', url: '#', label: 'Bilibili' },
      { platform: 'weibo', url: '#', label: '微博' },
      { platform: 'twitter', url: '#', label: 'Twitter' }
    ]
  },

  /**
   * 页脚配置
   */
  footer: {
    description: '本页面为团队介绍框架，可按需替换为正式文案与媒体资源。',
    quickLinks: [
      { label: '关于我们', to: '/about' },
      { label: '加入团队', to: '/join' },
      { label: '联系方式', to: '/contact' }
    ],
    copyright: 'UEE Organization Portal'
  },

  /**
   * 主题配置
   */
  theme: {
    colors: {
      primary: '#5fa9ff',
      secondary: '#8fd7ff',
      accent: '#5fa9ff',
      background: '#030810',
      surface: '#0b1523',
      text: '#e7edf7',
      textMuted: '#8a9bb8',
      border: '#1a2d45',
      success: '#4ecdc4',
      danger: '#ff6b6b',
      warning: '#ff9f43'
    },
    fonts: {
      primary: '"Rajdhani", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace'
    },
    animation: {
      enableScanline: true,
      enableGlow: true,
      enableParallax: true
    }
  },

  /**
   * 功能开关
   */
  features: {
    enableAI: true,
    enableAuth: true,
    enableNotifications: true,
    enablePWA: false,
    enableAnalytics: false,
    enableDarkMode: true
  },

  /**
   * API 配置
   */
  api: {
    baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
    timeout: 30000,
    retryCount: 3
  }
}

export default siteConfig
