import cloud from '@lafjs/cloud'
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import Util, * as $Util from '@alicloud/tea-util';
import * as $tea from '@alicloud/tea-typescript';

const accessKeyId = ""; // 阿里云访问 Key ID
const accessKeySecret = ""; // 阿里云访问 Key Secret
const signName = ""; // 短信签名，修改为你的签名，如: "laf云开发"
const templateCode = ""; // 短信模板ID，修改为你的模板ID，如 'SMS_217850980'

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const data = ctx.body


  if (!data.phone) {
    return {
      code: "0",
      message: "无效的手机号"
    }
  }

  const code = Math.floor(Math.random() * 9000) + 1000;


  await db.collection('sys_sms_history').add({
    phone: data.phone,
    code: code,
    status: "login",
    delFlag: 0,
    created: Date.now()
  })


  const config = new $OpenApi.Config({
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
  });
  // 访问的域名
  config.endpoint = `dysmsapi.aliyuncs.com`;
  const client = new Dysmsapi20170525(config);

  const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
    phoneNumbers: data.phone,
    signName: signName,
    templateCode: templateCode,
    templateParam: JSON.stringify({ code: code })
  });

  const res = await client.sendSmsWithOptions(sendSmsRequest, new $Util.RuntimeOptions({}));
  return res
}


