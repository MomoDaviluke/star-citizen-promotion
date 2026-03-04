/**
 * @file 站点内容数据
 * @description 集中管理网站的静态内容数据，包括导航、团队统计、成员信息等
 * @module data/siteContent
 */

/**
 * 导航菜单项配置
 * @description 定义网站主导航的菜单项
 * @type {Array<Object>}
 * @property {string} label - 菜单项显示文本
 * @property {string} to - 路由路径
 */
export const navItems = [
  { label: '首页', to: '/' },
  { label: '团队介绍', to: '/about' },
  { label: '核心成员', to: '/members' },
  { label: '活动项目', to: '/projects' },
  { label: '加入我们', to: '/join' },
  { label: '联系我们', to: '/contact' }
]

/**
 * 团队统计数据
 * @description 首页展示的团队关键指标
 * @type {Array<Object>}
 * @property {string} label - 统计项标签
 * @property {string} value - 统计值
 */
export const teamStats = [
  { label: '团队成员', value: '20+' },
  { label: '每周活动', value: '3 场' },
  { label: '合作组织', value: '12+' }
]

/**
 * 王牌飞行员数据
 * @description 首页展示的核心飞行员信息
 * @type {Array<Object>}
 * @property {string} name - 飞行员名称
 * @property {string} callsign - 呼号
 * @property {string} ship - 驾驶飞船
 * @property {string} description - 个人简介
 * @property {string} image - 头像图片路径
 */
export const acePilots = [
  {
    name: '维穆 · 王牌飞行员',
    callsign: 'F8C Vanguard Spearhead',
    ship: 'Anvil F8C Lightning',
    description:
      '专注于制空和快速拦截任务，擅长以 F8C Lightning 进行高强度近距空战与舰队护航。',
    image: '/images/F8C.png'

  },
  {
    name: 'Orion · 战术领航员',
    callsign: 'F8C Night Lance',
    ship: 'Anvil F8C Lightning',
    description: '负责小队切入路线规划与火力牵引，擅长夜战和高风险突防。',
    image: '/images/f8c-lightning.svg'
  },
  {
    name: 'Vega · 拦截专家',
    callsign: 'F8C Blue Comet',
    ship: 'Anvil F8C Lightning',
    description: '以高速截击和近距压制见长，常执行护航核心与快速救援任务。',
    image: '/images/f8c-lightning.svg'
  }
]

/**
 * 核心成员数据
 * @description 成员页面展示的核心团队成员信息
 * @type {Array<Object>}
 * @property {string} name - 成员名称
 * @property {string} role - 担任角色
 * @property {string} intro - 个人简介
 */
export const members = [
  { name: 'Echo', role: '舰队指挥', intro: '负责大型行动协调与战术安排。' },
  { name: 'Nova', role: '后勤总管', intro: '管理补给路线、物资统筹与协作。' },
  { name: 'Raven', role: '训练官', intro: '组织新人训练、飞行演练与战术复盘。' }
]

/**
 * 活动项目数据
 * @description 项目页面展示的常规活动信息
 * @type {Array<Object>}
 * @property {string} name - 项目名称
 * @property {string} period - 活动周期
 * @property {string} description - 项目描述
 */
export const projects = [
  {
    name: '新人成长营',
    period: '每月第 1 周',
    description: '提供从飞船入门到组队协作的完整训练路线。'
  },
  {
    name: '跨组织联合行动',
    period: '每月第 3 周',
    description: '与友方组织共同执行大型护航与区域控制任务。'
  },
  {
    name: '赛事与展示',
    period: '季度活动',
    description: '通过竞速、编队飞行等活动提升团队曝光与凝聚力。'
  }
]
