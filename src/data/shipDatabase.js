/**
 * @file 舰船统一数据库
 * @description 集中管理第四舰队全部 12 艘舰船静态数据，供 Fleet / ShipDetail / Home 等页面复用。
 * @module data/shipDatabase
 * @author 星际公民团队
 * @version 1.0.0
 */

const shipDatabase = {

  arrow: {

    name: 'Anvil Arrow',

    manufacturer: 'Anvil Aerospace · 铁砧宇航',

    category: '战斗',

    categoryEn: 'COMBAT',

    role: '轻型战斗机 · 高机动空优战机，擅长快速拦截与近距格斗',

    image: '/images/ships/arrow.svg',

    specs: [

      { label: '火力 · FIREPOWER', value: 55 },

      { label: '机动 · AGILITY', value: 95 },

      { label: '防御 · ARMOR', value: 30 },

      { label: '速度 · SPEED', value: 88 },

      { label: '续航 · RANGE', value: 45 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '0 SCU' },

      { label: '长度 · LENGTH', value: '18.5 m' },

      { label: '宽度 · BEAM', value: '14.0 m' },

      { label: '高度 · HEIGHT', value: '4.5 m' },

      { label: '质量 · MASS', value: '31,255 kg' },

      { label: '战斗评级 · RATING', value: 'S-2' },

    ],

    description: [

      'Arrow 是 Anvil Aerospace 设计的轻型战斗机，以极致机动性著称。作为空优战机，它在近距离格斗中展现出令人惊叹的灵活性，能够轻松规避敌方火力并迅速占据有利位置。',

      '虽然装甲较薄，但 Arrow 凭借其出色的速度和机动性弥补了防御上的不足。它配备了两门 S2 级武器和两枚 S1 导弹，火力足以对同级别目标造成致命打击。',

      '在第四舰队中，Arrow 主要执行快速拦截和侦察护航任务，是舰队中机动性最强的战斗单位之一。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '武器 · WEAPONS', value: '在线 · ONLINE', level: 'green' },

      { label: '航电 · AVIONICS', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  '325a': {

    name: 'Origin 325a',

    manufacturer: 'Origin Jumpworks · 起源跳跃工坊',

    category: '战斗',

    categoryEn: 'COMBAT',

    role: '战斗截击机 · 精准火力与优雅设计的完美结合',

    image: '/images/ships/325a.svg',

    specs: [

      { label: '火力 · FIREPOWER', value: 65 },

      { label: '机动 · AGILITY', value: 78 },

      { label: '防御 · ARMOR', value: 45 },

      { label: '速度 · SPEED', value: 75 },

      { label: '续航 · RANGE', value: 60 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '4 SCU' },

      { label: '长度 · LENGTH', value: '24.5 m' },

      { label: '宽度 · BEAM', value: '16.0 m' },

      { label: '高度 · HEIGHT', value: '5.5 m' },

      { label: '质量 · MASS', value: '38,500 kg' },

      { label: '战斗评级 · RATING', value: 'S-3' },

    ],

    description: [

      'Origin 325a 是 300 系列的战斗变体，将优雅的设计语言与致命的战斗能力完美融合。它搭载了专属的 W&S 9-Longbow 精准步枪和定制导弹系统，在保留Origin 品牌优雅外观的同时，提供了出色的战斗性能。',

      '325a 的目标锁定系统经过特别优化，能够在高速飞行中精确追踪目标，使其成为截击任务的理想选择。同时，它保留了 300 系列的舒适座舱和精致内饰。',

      '在第四舰队中，325a 主要执行精准打击和目标截获任务，是舰队中火力与机动性平衡最好的战斗单位。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '武器 · WEAPONS', value: '在线 · ONLINE', level: 'green' },

      { label: '航电 · AVIONICS', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  'avenger-stalker': {

    name: 'Aegis Avenger Stalker',

    manufacturer: 'Aegis Dynamics · 神盾动力',

    category: '截击',

    categoryEn: 'INTERDICTION',

    role: '截击巡逻舰 · 执法级追捕与区域控制平台',

    image: '/images/ships/avenger-stalker.svg',

    specs: [

      { label: '火力 · FIREPOWER', value: 62 },

      { label: '机动 · AGILITY', value: 70 },

      { label: '防御 · ARMOR', value: 55 },

      { label: '速度 · SPEED', value: 65 },

      { label: '续航 · RANGE', value: 72 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '0 SCU（牢房 × 6间）' },

      { label: '长度 · LENGTH', value: '19.0 m' },

      { label: '宽度 · BEAM', value: '14.5 m' },

      { label: '高度 · HEIGHT', value: '5.0 m' },

      { label: '质量 · MASS', value: '35,200 kg' },

      { label: '战斗评级 · RATING', value: 'S-3' },

    ],

    description: [

      'Avenger Stalker 是 Aegis Dynamics 基于 Avenger 平台开发的执法截击变体，后舱配有 6 个独立牢房，专为追捕和押送任务设计。它曾是 UEE 海军的标准巡逻舰，退役后在民间执法和安保领域广受欢迎。',

      'Stalker 搭载了强化型量子拦截器，能够在量子航行中强制目标脱离，是区域控制和执法追捕的核心装备。其坚固的装甲和可靠的武器系统使其在面对反抗时有足够的压制力。',

      '在第四舰队中，Stalker 主要执行区域巡逻、目标截获和囚犯押送任务，是舰队执法力量的中坚。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '武器 · WEAPONS', value: '在线 · ONLINE', level: 'green' },

      { label: '拦截器 · INTERDICTOR', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  'avenger-titan': {

    name: 'Aegis Avenger Titan',

    manufacturer: 'Aegis Dynamics · 神盾动力',

    category: '运输',

    categoryEn: 'TRANSPORT',

    role: '轻型运输机 · 灵活货运与快速部署两用平台。',

    image: '/images/ships/avenger-titan.svg',

    specs: [

      { label: '火力 · FIREPOWER', value: 45 },

      { label: '货仓 · CARGO', value: 60 },

      { label: '机动 · AGILITY', value: 72 },

      { label: '速度 · SPEED', value: 68 },

      { label: '防御 · ARMOR', value: 50 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '8 SCU' },

      { label: '长度 · LENGTH', value: '19.0 m' },

      { label: '宽度 · BEAM', value: '14.5 m' },

      { label: '高度 · HEIGHT', value: '5.0 m' },

      { label: '质量 · MASS', value: '33,800 kg' },

      { label: '战斗评级 · RATING', value: 'S-2' },

    ],

    description: [

      'Avenger Titan 是 Avenger 系列的货运变体，将原本的牢房/EMP舱替换为 8 SCU 的货仓空间。它保留了 Avenger 平台出色的飞行性能和可靠的武器系统，同时提供了实用的货运能力。',

      'Titan 是新手飞行员和独立商人的理想选择，既能完成日常运输任务，又具备足够的自卫能力应对轻度威胁。其紧凑的尺寸也使其能够在空间站和停机坪之间灵活穿梭。',

      '在第四舰队中，Titan 主要执行轻型物资运输和快速部署任务，是舰队后勤保障的灵活补充。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '武器 · WEAPONS', value: '在线 · ONLINE', level: 'green' },

      { label: '货仓 · CARGO BAY', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  '400i': {

    name: 'Origin 400i',

    manufacturer: 'Origin Jumpworks · 起源跳跃工坊',

    category: '探索',

    categoryEn: 'EXPLORATION',

    role: '豪华探索舰 · 远距离深空探索与高端旅行',

    image: '/images/ships/400i.svg',

    specs: [

      { label: '探索 · EXPLORATION', value: 88 },

      { label: '防御 · ARMOR', value: 60 },

      { label: '续航 · RANGE', value: 92 },

      { label: '舒适 · COMFORT', value: 95 },

      { label: '火力 · FIREPOWER', value: 42 },

    ],

    details: [

      { label: '船员 · CREW', value: '1-3 人' },

      { label: '货仓 · CARGO', value: '20 SCU' },

      { label: '长度 · LENGTH', value: '36.0 m' },

      { label: '宽度 · BEAM', value: '22.0 m' },

      { label: '高度 · HEIGHT', value: '8.5 m' },

      { label: '质量 · MASS', value: '185,000 kg' },

      { label: '战斗评级 · RATING', value: 'S-3' },

    ],

    description: [

      'Origin 400i 是 Origin Jumpworks 旗舰级探索舰，将奢华旅行与深空探索完美融合。它配备了顶级的扫描阵列和长距离跃迁引擎，能够到达已知星域的边缘并安全返回。',

      '400i 的内部空间经过精心设计，配备了完整的居住设施、医疗舱和储物空间。无论是单人远征还是小队协作，400i 都能提供舒适且高效的探索体验。',

      '在第四舰队中，400i 是旗舰级探索平台，负责执行远距离深空侦察和未知星域探索任务，为舰队提供关键的战略情报。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '扫描 · SCANNERS', value: '在线 · ONLINE', level: 'green' },

      { label: '生命维持 · LIFE SUP', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  '315p': {

    name: 'Origin 315p',

    manufacturer: 'Origin Jumpworks · 起源跳跃工坊',

    category: '探索',

    categoryEn: 'EXPLORATION',

    role: '路径探索船 · 小型深空探索与资源扫描。',

    image: '/images/ships/315p.svg',

    specs: [

      { label: '探索 · EXPLORATION', value: 80 },

      { label: '机动 · AGILITY', value: 75 },

      { label: '续航 · RANGE', value: 70 },

      { label: '速度 · SPEED', value: 72 },

      { label: '防御 · ARMOR', value: 35 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '6 SCU' },

      { label: '长度 · LENGTH', value: '24.5 m' },

      { label: '宽度 · BEAM', value: '16.0 m' },

      { label: '高度 · HEIGHT', value: '5.5 m' },

      { label: '质量 · MASS', value: '36,200 kg' },

      { label: '战斗评级 · RATING', value: 'S-2' },

    ],

    description: [

      'Origin 315p 是 300 系列的探索变体，搭载了强化型量子驱动器和专属扫描套件。它保留了 300 系列的优雅外观和出色飞行性能，同时增加了深空探索所需的全部装备。',

      '315p 配备的牵引光束和扩展扫描系统使其能够定位和回收有价值的太空资源，是独立探索者的理想座驾。其紧凑的尺寸也意味着较低的运营成本和维护费用。',

      '在第四舰队中，315p 主要执行路径侦察和资源扫描任务，为大型探索行动提供前期情报。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '扫描 · SCANNERS', value: '在线 · ONLINE', level: 'green' },

      { label: '量子驱动 · Q-DRIVE', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  '300i': {

    name: 'Origin 300i',

    manufacturer: 'Origin Jumpworks · 起源跳跃工坊',

    category: '运输',

    categoryEn: 'TOURING',

    role: '豪华巡游舰 · 多用途旅行与商务出行平台',

    image: '/images/ships/300i.svg',

    specs: [

      { label: '舒适 · COMFORT', value: 90 },

      { label: '机动 · AGILITY', value: 72 },

      { label: '防御 · ARMOR', value: 40 },

      { label: '速度 · SPEED', value: 70 },

      { label: '续航 · RANGE', value: 55 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '8 SCU' },

      { label: '长度 · LENGTH', value: '24.5 m' },

      { label: '宽度 · BEAM', value: '16.0 m' },

      { label: '高度 · HEIGHT', value: '5.5 m' },

      { label: '质量 · MASS', value: '35,000 kg' },

      { label: '战斗评级 · RATING', value: 'S-2' },

    ],

    description: [

      'Origin 300i 是 300 系列的基础型号，代表了 Origin Jumpworks 对星际旅行品质的极致追求。它将优雅的设计、舒适的座舱和可靠的性能融为一体，是星际旅行和商务出行的理想选择。',

      '300i 的模块化设计允许飞行员根据需求进行定制，从日常通勤到轻型运输都能胜任。其标志性的流线型外观和精致内饰使其成为宇宙中最具辨识度的飞船之一。',

      '在第四舰队中，300i 主要执行联络和日常通勤任务，是舰队成员星际出行的首选座驾。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '航电 · AVIONICS', value: '在线 · ONLINE', level: 'green' },

      { label: '生命维持 · LIFE SUP', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  'aurora-es': {

    name: 'RSI Aurora Mk I ES',

    manufacturer: 'Roberts Space Industries · RSI',

    category: '运输',

    categoryEn: 'MULTI-ROLE',

    role: '入门级多用途飞船 · 星际旅行与轻型运输的起点',

    image: '/images/ships/aurora-es.svg',

    specs: [

      { label: '火力 · FIREPOWER', value: 25 },

      { label: '货仓 · CARGO', value: 40 },

      { label: '机动 · AGILITY', value: 55 },

      { label: '速度 · SPEED', value: 50 },

      { label: '防御 · ARMOR', value: 30 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '3 SCU' },

      { label: '长度 · LENGTH', value: '18.0 m' },

      { label: '宽度 · BEAM', value: '8.5 m' },

      { label: '高度 · HEIGHT', value: '4.0 m' },

      { label: '质量 · MASS', value: '22,500 kg' },

      { label: '战斗评级 · RATING', value: 'S-1' },

    ],

    description: [

      'Aurora ES 是 Roberts Space Industries 生产的入门级多用途飞船，是无数飞行员星际生涯的起点。它以极低的购置成本和运营费用，提供了基本的星际旅行和轻型运输能力。',

      '虽然 Aurora ES 的各项性能并不突出，但它的模块化设计允许后续升级扩展。从基础运输到轻型战斗，Aurora 平台都能通过模块更换来适应不同需求。',

      '在第四舰队中，Aurora ES 主要用于新成员训练和轻型物资运输，是舰队入门级装备。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'yellow' },

      { label: '武器 · WEAPONS', value: '在线 · ONLINE', level: 'green' },

      { label: '航电 · AVIONICS', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  'aurora-mk2': {

    name: 'RSI Aurora Mk II',

    manufacturer: 'Roberts Space Industries · RSI',

    category: '运输',

    categoryEn: 'TRANSPORT',

    role: '升级运输机 · 轻型战斗与货运双用途平台。',

    image: '/images/ships/aurora-mk2.svg',

    specs: [

      { label: '火力 · FIREPOWER', value: 35 },

      { label: '货仓 · CARGO', value: 50 },

      { label: '防御 · ARMOR', value: 30 },

      { label: '速度 · SPEED', value: 52 },

      { label: '机动 · AGILITY', value: 58 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '5 SCU' },

      { label: '长度 · LENGTH', value: '18.5 m' },

      { label: '宽度 · BEAM', value: '8.5 m' },

      { label: '高度 · HEIGHT', value: '4.0 m' },

      { label: '质量 · MASS', value: '24,000 kg' },

      { label: '战斗评级 · RATING', value: 'S-1' },

    ],

    description: [

      'Aurora Mk II 是 Aurora 系列的升级版本，在保留原始设计理念的基础上进行了全面改进。更大的货仓空间和改进的飞行系统使其在运输效率上有了显著提升。',

      'Mk II 的武器系统也经过了升级，配备了更强的 S1 级武器挂载点，使其在面对轻度威胁时有更好的自卫能力。同时，改进的护盾发生器提供了更可靠的防护。',

      '在第四舰队中，Aurora Mk II 主要执行升级版运输任务和轻型巡逻，是 Aurora ES 的直接替代方案。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '武器 · WEAPONS', value: '在线 · ONLINE', level: 'green' },

      { label: '货仓 · CARGO BAY', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  '350r': {

    name: 'Origin 350r',

    manufacturer: 'Origin Jumpworks · 起源跳跃工坊',

    category: '竞。',

    categoryEn: 'RACING',

    role: '竞速飞船 · 极速竞赛与高性能飞行体验',

    image: '/images/ships/350r.svg',

    specs: [

      { label: '速度 · SPEED', value: 98 },

      { label: '机动 · AGILITY', value: 90 },

      { label: '防御 · ARMOR', value: 15 },

      { label: '火力 · FIREPOWER', value: 20 },

      { label: '续航 · RANGE', value: 35 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '0 SCU' },

      { label: '长度 · LENGTH', value: '24.5 m' },

      { label: '宽度 · BEAM', value: '16.0 m' },

      { label: '高度 · HEIGHT', value: '5.5 m' },

      { label: '质量 · MASS', value: '33,000 kg' },

      { label: '战斗评级 · RATING', value: 'S-1' },

    ],

    description: [

      'Origin 350r 是 300 系列的竞速变体，是 Origin Jumpworks 对速度极限的极致追求。它搭载了双引擎推进系统，是 300 系列中速度最快的型号，也是 Murray Cup 赛事中的常胜将军。',

      '为了追求极致速度，350r 牺牲了几乎所有的防御和载货能力。极薄的装甲和最小的护盾发生器意味着它在战斗中几乎不堪一击，但其惊人的速度使其几乎不可能被击中。',

      '在第四舰队中，350r 主要用于紧急通讯传递和高速侦察任务，是舰队中速度最快的飞行单位。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '低功耗 · LOW', level: 'yellow' },

      { label: '武器 · WEAPONS', value: '最低配置 · MIN', level: 'yellow' },

      { label: '推进器 · THRUSTERS', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  '100i': {

    name: 'Origin 100i',

    manufacturer: 'Origin Jumpworks · 起源跳跃工坊',

    category: '运输',

    categoryEn: 'STARTER',

    role: '入门级巡游舰 · 星际旅行与日常通勤的理想选择',

    image: '/images/ships/100i.svg',

    specs: [

      { label: '舒适 · COMFORT', value: 75 },

      { label: '机动 · AGILITY', value: 65 },

      { label: '续航 · RANGE', value: 55 },

      { label: '速度 · SPEED', value: 60 },

      { label: '防御 · ARMOR', value: 25 },

    ],

    details: [

      { label: '船员 · CREW', value: '1 人' },

      { label: '货仓 · CARGO', value: '2 SCU' },

      { label: '长度 · LENGTH', value: '14.5 m' },

      { label: '宽度 · BEAM', value: '10.0 m' },

      { label: '高度 · HEIGHT', value: '3.5 m' },

      { label: '质量 · MASS', value: '15,800 kg' },

      { label: '战斗评级 · RATING', value: 'S-1' },

    ],

    description: [

      'Origin 100i 是 Origin Jumpworks 推出的入门级巡游舰，以更亲民的价格提供了 Origin 标志性的设计品质和飞行体验。它是星际旅行新手的理想起点，也是日常通勤的可靠伙伴。',

      '100i 采用了 Origin 一贯的流线型设计语言，紧凑的机身中包含了舒适的座舱和基本的旅行设施。虽然载货空间有限，但对于个人旅行和轻型运输来说已经足够。',

      '在第四舰队中，100i 主要用于新成员训练和短途通勤，是入门级飞行员的训练平台。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '航电 · AVIONICS', value: '在线 · ONLINE', level: 'green' },

      { label: '生命维持 · LIFE SUP', value: '在线 · ONLINE', level: 'green' },

    ]

  },

  ballista: {

    name: 'Anvil Ballista',

    manufacturer: 'Anvil Aerospace · 铁砧宇航',

    category: '战斗',

    categoryEn: 'MILITARY',

    role: '军用战斗车 · 地面防空与区域压制火力平台。',

    image: '/images/ships/ballista.svg',

    specs: [

      { label: '火力 · FIREPOWER', value: 88 },

      { label: '防御 · ARMOR', value: 85 },

      { label: '机动 · AGILITY', value: 20 },

      { label: '速度 · SPEED', value: 15 },

      { label: '续航 · RANGE', value: 40 },

    ],

    details: [

      { label: '船员 · CREW', value: '1-3 人' },

      { label: '货仓 · CARGO', value: '0 SCU' },

      { label: '长度 · LENGTH', value: '12.0 m' },

      { label: '宽度 · BEAM', value: '6.5 m' },

      { label: '高度 · HEIGHT', value: '4.0 m' },

      { label: '质量 · MASS', value: '45,000 kg' },

      { label: '战斗评级 · RATING', value: 'S-3' },

    ],

    description: [

      'Anvil Ballista 是一款军用级地面战斗车辆，专为地面防空和区域压制任务设计。它搭载了强大的地对空导弹系统和重型防空炮，能够有效威胁低空飞行的敌对飞船。',

      'Ballista 的重装甲提供了出色的地面防护，使其能够在敌方火力下持续作战。其配备的扫描系统可以追踪空中目标，为防空火力提供精确的目标数据。',

      '在第四舰队中，Ballista 主要部署在行星基地和空间站周边，执行地面防空和区域安全任务，是舰队地面防御力量的核心。',

    ],

    systemStatus: [

      { label: '引擎 · ENGINE', value: '在线 · ONLINE', level: 'green' },

      { label: '护盾 · SHIELD', value: '在线 · ONLINE', level: 'green' },

      { label: '武器 · WEAPONS', value: '在线 · ONLINE', level: 'green' },

      { label: '扫描 · SCANNERS', value: '在线 · ONLINE', level: 'green' },

    ]

  },
}

/**
 * 全部舰船 slug 数组（保持固定展示顺序）
 * @returns {string[]}
 */
export const shipList = Object.keys(shipDatabase)

/**
 * 首页舰队预览推荐舰船 slug 列表
 * @returns {string[]}
 */
export const recommendedShips = ['arrow', '400i', 'avenger-stalker', '350r', 'avenger-titan', 'ballista']

/**
 * 获取舰船分类列表（去重）
 * @returns {string[]}
 */
export function getCategories() {
  const categories = new Set()
  Object.values(shipDatabase).forEach((ship) => categories.add(ship.category))
  return Array.from(categories)
}

/**
 * 根据 slug 获取单艘舰船数据
 * @param {string} slug - 舰船唯一标识
 * @returns {object | undefined}
 */
export function getShipBySlug(slug) {
  return shipDatabase[slug]
}

export default shipDatabase
