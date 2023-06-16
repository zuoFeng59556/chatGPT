import cloud from '@lafjs/cloud'
const db = cloud.database()
export async function main(ctx: FunctionContext) {

  if (!ctx.user.uid) return { code: 0, message: "无效的用户名" }

  const userId = ctx.user.uid
  const amount = ctx.body.amount
  const order = generateOrderId()

  await db.collection("pay_order").add({
    order_id: order,
    userId,
    amount,
    created: new Date(),
    state: 0 // 0代表未成功 1代表成功
  })

  const res = await cloud.fetch(
    {
      url: `https://${cloud.env.APP_ID}.laf.dev/wechat-pay`,
      method: "POST",
      data: {
        trade_order_number: order,
        amount,
        api_key: cloud.env.PAY_KEY
      }
    }
  )


  const obj = {
    orderId: order,
    codeUrl: res.data.code_url
  }

  return obj
}

function generateOrderId() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let orderId = "";
  for (let i = 0; i < 10; i++) {
    orderId += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return orderId + Date.now().toString();
}
