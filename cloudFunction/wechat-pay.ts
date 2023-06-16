import cloud from '@lafjs/cloud'
import crypto from 'crypto'
import axios from 'axios'


// 这里写入自己的微信支付信息
const WechatPaySpec = {
  mchid: cloud.env.WX_PAY_MCHID,
  appid: cloud.env.WX_PAY_APPID,
  apiV3Key: cloud.env.WX_PAY_API_V3_KEY,
  certificateSerialNumber: cloud.env.WX_PAY_CERT_SERIAL_NUMBER,
  privateKey: cloud.env.WX_PAY_PRIVATE_KEY,
}

/** Body example

{
  "trade_order_number": "test-order-123",
  "amount": 1,
}

 */
export async function main(ctx: FunctionContext) {
  const db = cloud.database()

  const { trade_order_number, amount } = ctx.body

  if (!trade_order_number || !amount) {
    return 'invalid params'
  }


  // build order params
  const order = {
    mchid: WechatPaySpec.mchid,
    appid: WechatPaySpec.appid,
    description: 'payment for ' + trade_order_number,
    out_trade_no: trade_order_number,
    notify_url: `https://${cloud.env.APP_ID}.laf.dev/wechat-notify`,
    amount: {
      total: amount,
      currency: 'CNY'
    }
  }

  // request payment
  const res = await pay(order)
  console.log(res)

  // save order
  await db.collection('pay_orders').add({
    trade_order_number,
    amount: order.amount,
    state: 'PENDING',
    created_at: new Date()
  })

  return res
}


/**
 * payment request
 */
async function pay(order: any) {
  const timestamp = Math.floor(Date.now() / 1000)
  const nonceStr = crypto.randomUUID()
  const apiUrl = '/v3/pay/transactions/native'
  const signature = createSign(apiUrl, timestamp, nonceStr, order)
  const serialNo = WechatPaySpec.certificateSerialNumber

  const token = `WECHATPAY2-SHA256-RSA2048 mchid="${WechatPaySpec.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}",serial_no="${serialNo}"`
  const headers = { Authorization: token }

  const fullUrl = `https://api.mch.weixin.qq.com${apiUrl}`
  const res = await axios.post(fullUrl, order, {
    headers,
  })

  return res.data
}

/**
 * Sign a wechat payment request
 */
function createSign(apiUrl: string, timestamp: number, nonceStr: string, order: any) {
  const method = 'POST'
  const orderStr = JSON.stringify(order)
  const signStr = `${method}\n${apiUrl}\n${timestamp}\n${nonceStr}\n${orderStr}\n`
  const cert = WechatPaySpec.privateKey
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signStr)
  return sign.sign(cert, 'base64')
}
