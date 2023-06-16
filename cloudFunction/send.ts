import cloud from '@lafjs/cloud'
const db = cloud.database()
export async function main(ctx: FunctionContext) {
  const { ChatGPTAPI } = await import('chatgpt')
  const uid = ctx.user.uid
  const data = ctx.body
  if (!uid) return

  await db.collection("message_log").add({
    uid,
    message: data.message
  })

  const r = await db.collection("user").where({ _id: uid }).getOne()
  if (r.data.amount <= 0) return { text: "您的额度已用完，请充值。" }

  let api = cloud.shared.get('api')
  if (!api) {
    api = new ChatGPTAPI({ apiKey: '' })
    cloud.shared.set('api', api)
  }

  ctx.response.setHeader('Content-Type', 'application/octet-stream');

  const obj = {
    onProgress: (partialResponse => {
      if (partialResponse && partialResponse.delta != undefined) {
        ctx.response.write(partialResponse.delta);
      }
    })
  }

  if (data.parentMessageId) {
    obj.parentMessageId = data.parentMessageId
  }

  const res = await api.sendMessage(data.message, obj)
  ctx.response.end("--!" + res.id)

  if (res.text) {
    const user = await db.collection("user").where({ _id: uid }).getOne()
    const amount = user.data.amount - 1
    await db.collection("user").where({ _id: uid }).update({ amount })
  }
  return res
}
