import cloud from '@lafjs/cloud'
import crypto from 'crypto'
import axios from 'axios'

const WechatPaySpec = {
  mchid: cloud.env.WX_PAY_MCHID,
  appid: cloud.env.WX_PAY_APPID,
  apiV3Key: cloud.env.WX_PAY_API_V3_KEY,
  certificateSerialNumber: cloud.env.WX_PAY_CERT_SERIAL_NUMBER,
  privateKey: cloud.env.WX_PAY_PRIVATE_KEY,
}

/**
  @query {
     order_number: string;
     api_key: string;
  }
 */
export async function main(ctx: FunctionContext) {
  const db = cloud.database()
  const { order_number } = ctx.query

  const res = await queryOrder(order_number)
  console.log(res)

  await db.collection('pay_orders')
    .where({
      trade_order_number: res?.out_trade_no
    })
    .update({
      state: res?.trade_state,
      updated_at: new Date(),
      result: res
    })

  return res
}


/**
 * query request
 */
async function queryOrder(orderNumber: string) {
  const timestamp = Math.floor(Date.now() / 1000)
  const nonceStr = crypto.randomUUID()
  const apiUrl = `/v3/pay/transactions/out-trade-no/${orderNumber}?mchid=${WechatPaySpec.mchid}`
  const signature = createSign(apiUrl, timestamp, nonceStr)
  const serialNo = WechatPaySpec.certificateSerialNumber

  const token = `WECHATPAY2-SHA256-RSA2048 mchid="${WechatPaySpec.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}",serial_no="${serialNo}"`
  const headers = {
    Authorization: token,
  }

  const fullUrl = `https://api.mch.weixin.qq.com${apiUrl}`
  const res = await axios.get(fullUrl + ``, {
    headers,
  })

  return res.data
}

/**
 * Sign a wechat query request
 */
function createSign(apiUrl: string, timestamp: number, nonceStr: string) {
  const method = 'GET'
  const signStr = `${method}\n${apiUrl}\n${timestamp}\n${nonceStr}\n\n`
  const cert = WechatPaySpec.privateKey
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signStr)
  return sign.sign(cert, 'base64')
}
