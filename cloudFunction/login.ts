import cloud from '@lafjs/cloud'

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  // 参数验证
  let { phone, code } = ctx.body
  if (!phone || !code) {
    return { code: 0, message: '用户名或验证码不可为空' }
  }

  code = parseInt(code)

  // 验证码是否正确
  const { total } = await db.collection('sys_sms_history')
    .where({
      phone,
      code: code,
      delFlag: 0,
      created: db.command.gte(Date.now() - 10 * 60 * 1000)
    })
    .count()


  if (total === 0) {
    return { code: 0, error: '无效的验证码' }
  }

  let { data: user } = await db.collection('user')
    .where({ phone })
    .getOne()

  // 若用户不存在，则注册并完成登录
  if (!user) {
    const { id } = await db.collection('user')
      .add({
        nickname: phone,
        phone,
        created_at: new Date(),
        created: Date.now(),
        pay: 0,
        amount:20
      })

    const r = await db.collection('user').where({ _id: id }).getOne()
    user = r.data
  }

  // 使验证码失效
  await db.collection('sys_sms_history')
    .where({
      phone,
      code,
    })
    .update({
      delFlag: 1
    })

  delete user['password']

  // 默认 token 有效期为 365 天
  const expire = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
  const access_token = cloud.getToken({
    uid: user._id,
    exp: expire,
  })

  return {
    code: 1,
    data: { access_token, user, expire }
  }
}
