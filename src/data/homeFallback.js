/**
 * @file 首页兜底数据
 * @description 当后端 API 不可用时，首页各区块使用此静态数据降级展示
 * @module data/homeFallback
 */

// 兜底 summary（结构与后端 /api/stats 的 data.summary 对齐）
export const fallbackSummary = {
  activeMembers: 20,
  activeProjects: 5,
  activePilots: 15,
  totalMissions: 120
}

// 兜底 stats 列表（结构与后端 /api/stats 的 data.stats 对齐）
export const fallbackStatsList = [
  { id: 's1', label: '团队成员', value: '20+', sort_order: 1 },
  { id: 's2', label: '每周活动', value: '3 场', sort_order: 2 },
  { id: 's3', label: '合作组织', value: '12+', sort_order: 3 }
]

// 兜底舰队预览（结构与 /api/fleet 返回的飞船对象对齐）
export const fallbackFleetPreview = [
  {
    id: 'arrow',
    slug: 'arrow',
    name: 'Anvil Arrow',
    callsign: 'AR-01',
    ship: 'Arrow',
    category: 'combat',
    status: 'available',
    value: 1200000,
    addedAt: '2024-01-15',
    image: '/images/ships/arrow.jpg',
    description: '轻型战斗机'
  },
  {
    id: 'cutlass',
    slug: 'cutlass',
    name: 'Drake Cutlass Black',
    callsign: 'CT-02',
    ship: 'Cutlass Black',
    category: 'transport',
    status: 'available',
    value: 1500000,
    addedAt: '2024-02-20',
    image: '/images/ships/cutlass.jpg',
    description: '多用途中型舰'
  },
  {
    id: 'carrack',
    slug: 'carrack',
    name: 'Anvil Carrack',
    callsign: 'CR-03',
    ship: 'Carrack',
    category: 'explore',
    status: 'available',
    value: 3500000,
    addedAt: '2024-03-10',
    image: '/images/ships/carrack.jpg',
    description: '大型探索舰'
  }
]

// 兜底行星元信息（Mars 区展示用的静态行星参数）
export const fallbackPlanetMeta = {
  name: 'MARS',
  index: '01',
  description: '纹理来源：NASA 3D Resources - Mars，版权标注 NASA/JPL-Caltech',
  rows: [
    { key: 'GRAVITY', value: '1.12 G' },
    { key: 'ATMOSPHERE', value: 'BREATHABLE' },
    { key: 'RESOURCES', value: 'RICH' },
    { key: 'DISTANCE', value: '1.52 AU' },
    { key: 'SURVEY', value: '34%' }
  ]
}
