import cloud from '@lafjs/cloud'

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const order = ctx.body.order
  const userId = ctx.user.uid

  if (!userId) return

  const { data } = await db.collection("pay_order")
  .where({ order_id: order })
  .getOne()

  if (data.state === 1) return { code: 0, message: "收手吧彦祖，回头是岸" }


  const { total } = await db.collection("pay_order").where({ order_id: order }).count()
  if (total === 0) {
    return {
      code: 0,
      message: "无效的订单号"
    }
  }


  const res = await cloud.fetch({
    url: `https://${cloud.env.APP_ID}.laf.dev/wechat-order-query?order_number=${order}&api_key=${cloud.env.PAY_KEY}`,
  })

  if (res.data.trade_state === 'SUCCESS') {

    // 订单设置为已支付
    await db.collection("pay_order").where({ order_id: order }).update({
      state: 1
    })


    const r = await db.collection("pay_order").where({ order_id: order }).getOne()

    const money = r.data.amount / 100
    let num = money * 20

    if (money >= 50 && money <= 1000) num = 1500
    if ( money >= 1000) num = 50000


    const user = await db.collection('user').where({ _id: userId }).getOne()
    // 为用户增加次数 顺便统计一下用户总共的付费
    await db.collection('user').where({ _id: userId }).update({
      amount: user.data.amount + num,
      pay: user.data.pay + money
    })

    return { code: 1, message: "充值成功" }
  } else {
    return { code: 0, message: "充值还未成功" }
  }
}
