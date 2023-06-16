import cloud from '@lafjs/cloud'

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const uid = ctx.user.uid
  const res = await db.collection('user').where({_id:uid}).getOne()

  return { amount:res.data.amount}

}
