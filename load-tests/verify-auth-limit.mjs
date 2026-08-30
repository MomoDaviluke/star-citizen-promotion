/**
 * @file 临时验证脚本：auth 限流消息
 * @description 连续 12 次错误登录，验证第 11 次起返回 auth 限流消息
 */
for (let i = 1; i <= 12; i++) {
  const r = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'loadtest-member@test.local', password: 'wrong' })
  })
  const t = await r.text()
  console.log('req ' + i + ': HTTP ' + r.status + ' - ' + t.slice(0, 150))
}
