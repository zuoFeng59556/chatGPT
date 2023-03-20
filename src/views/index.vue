<script setup>
import { ref } from "vue";
import { Cloud } from "laf-client-sdk";
import wx from "../../public/wx.png";
// 将marked 引入
import { marked } from "marked";
import { User } from "@element-plus/icons-vue";
import QrcodeVue from "qrcode.vue";
import { ElMessage } from "element-plus";

const cloud = new Cloud({
  baseUrl: "https://jyf6wk.laf.dev",
  getAccessToken: () => localStorage.getItem("access_token"),
  timeout: 60000,
});

//======================================data======================================
const list = ref([]);
const question = ref("");
const parentMessageId = ref("");
const loading = ref(false);
const centerDialogVisible = ref(false);
const centerDialogVisible2 = ref(false);
const phone = ref("");
const code = ref("");
const codebut = ref(false);
const err = ref(false);
const indexUp = ref(0);
const upCode = ref(false);
const content = ref("发送验证码");
const totalTime = ref(60);
const canClick = ref(true);
const amount = ref(0);
const codeUrl = ref("");
const payOrder = ref("");
const tel = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;

//======================================created======================================
getAmount();

//======================================function======================================

// 获取用户剩余次数
async function getAmount() {
  if (!localStorage.getItem("access_token")) return;
  const res = await cloud.invoke("get-amount");
  amount.value = res.amount;
}

async function getCode() {
  if (!tel.test(phone.value)) return (err.value = true);
  if (codebut.value) return;
  const res = await cloud.invoke("getCode", { phone: phone.value });
  countDown();
}

function countDown() {
  if (!canClick.value) return; //改动的是这两行代码
  codebut.value = true;
  canClick.value = false;
  content.value = totalTime.value + "s后重新发送";
  let clock = window.setInterval(() => {
    totalTime.value--;
    content.value = totalTime.value + "s后重新发送";
    if (totalTime.value < 0) {
      window.clearInterval(clock);
      content.value = "重新发送验证码";
      totalTime.value = 60;
      canClick.value = true; //这里重新开启
      codebut.value = false;
    }
  }, 1000);
}

async function login() {
  const res = await cloud.invoke("login", { phone: phone.value, code: code.value });
  console.log(res);
  if (res.code === 1) {
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    success();
    centerDialogVisible2.value = false;
    getAmount();
  } else {
    ElMessage({
      message: "无效的验证码",
      type: "error",
    });
  }
}

async function send() {
  if (localStorage.getItem("access_token") == null)
    return ElMessage({
      message: "请先登录！",
      type: "error",
    });

  if (amount.value <= 0)
    return ElMessage({
      message: "您的剩余次数不足，请充值！",
      type: "error",
    });

  if (loading.value) return;
  list.value.push({
    text: question.value,
    avatar: "/avatar.png",
  });

  setScreen();
  const message = question.value;
  question.value = "";
  loading.value = true;
  let res;
  if (message == "") {
    loading.value = false;
    list.value.push({
      text: "问题不能为空！",
      avatar: "/log.png",
    });
    setScreen();
    return;
  }
  try {
    if (!parentMessageId.value) {
      res = await cloud.invoke("send", { message });
    } else {
      res = await cloud.invoke("send", {
        message,
        parentMessageId: parentMessageId.value,
      });
    }
  } catch (error) {
    console.log(error);
    loading.value = false;
    list.value.push({
      text: "出错了，请重试！",
      avatar: "/log.png",
    });
    setScreen();
    return;
  }

  parentMessageId.value = res.id;

  // res.text = res.text.replace(/\n/g, "<br>");
  res.text = marked.parse(res.text);

  list.value.push({
    text: res.text,
    avatar: "/log.png",
  });

  loading.value = false;
  getAmount();
  setScreen();
}

//定位页面位置
function setScreen() {
  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 0);
}

function close() {
  err.value = false;
}

function select(e) {
  indexUp.value = e;
}

async function openCode() {
  let num = 0;
  if (indexUp.value == 0) num = 1000;
  if (indexUp.value == 1) num = 2000;
  const res = await cloud.invoke("pay", { amount: num });
  payOrder.value = res.orderId;
  codeUrl.value = res.codeUrl;
  centerDialogVisible.value = false;
  upCode.value = true;
  checkPay();
}

async function checkPay() {
  const res = await cloud.invoke("check-pay-ordet", { order: payOrder.value });
  if (res.code == 1) {
    upCode.value = false;
    getAmount();
    ElMessage({
      message: "充值成功",
      type: "success",
    });
  } else {
    setTimeout(() => {
      checkPay();
    }, 1000);
  }
}

const success = () => {
  ElMessage({
    message: "登录成功",
    type: "success",
  });
};

//判断是否登录
function judge() {
  const access_token = localStorage.getItem("access_token");
  if (access_token)
    return ElMessage({
      message: "您已经登录过了",
      type: "success",
    });
  centerDialogVisible2.value = true;
}

function judgeUp() {
  if (!localStorage.getItem("access_token"))
    return ElMessage({
      message: "请登录",
      type: "error",
    });
  centerDialogVisible.value = true;
}
</script>

<template>
  <div class="page">
    <el-row class="head">
      <div class="amount">剩余{{ amount }}</div>
      <div>
        <el-col :span="24">
          <el-popover placement="bottom" :width="300" trigger="click">
            <el-image style="width: 100%; height: 100%" :src="wx" :fit="contain" />
            <template #reference>
              <el-button class="m-2">微信群</el-button>
            </template>
          </el-popover>

          <el-button @click="judgeUp">充值</el-button>

          <el-button @click="judge">
            <el-icon style="vertical-align: middle">
              <User />
            </el-icon>
            <span style="vertical-align: middle">登录</span>
          </el-button>
        </el-col>
      </div>
    </el-row>
    <div style="height: 52px"></div>

    <el-dialog
      modal="true"
      v-model="centerDialogVisible"
      title="充值"
      width="50%"
      height="50%"
      center
    >
      <div class="cardbox">
        <el-card @click="select(0)" :class="indexUp === 0 ? 'box-card' : 'boxCard'">
          <div class="useNumber">200次</div>
          <div class="money">
            <span class="sign">￥</span>
            <span class="number">10</span>
          </div>
        </el-card>
        <el-card
          @click="select(1)"
          :class="indexUp === 1 ? 'box-card' : 'boxCard'"
          class="box-card"
        >
          <div class="useNumber">400次</div>
          <div class="money">
            <span class="sign">￥</span>
            <span class="number">20</span>
          </div>
        </el-card>
      </div>
      <div class="cheerbox">
        <el-button @click="openCode" class="cheer" type="warning">充值</el-button>
      </div>

      <template #footer> </template>
    </el-dialog>

    <el-dialog modal="true" v-model="upCode" width="50%" height="50%" center>
      <div class="qrcode">
        <qrcode-vue :value="codeUrl" :size="300" level="H" />
      </div>
      <template #footer> </template>
    </el-dialog>

    <el-dialog modal="true" v-model="centerDialogVisible2" title="登录" center>
      <el-alert
        @close="close"
        v-show="err"
        title="请输入正确的手机号码"
        type="error"
        center
        show-icon
      />
      <div style="height: 200px">
        <div class="accountbox">
          <div class="inputname">手机号：</div>
          <el-input
            class="elinput"
            size="small"
            type="number"
            v-model="phone"
            placeholder="请输入手机号"
          />
        </div>

        <div class="accountbox">
          <div class="inputname">验证码：</div>

          <el-input
            class="elinputcode"
            size="small"
            v-model="code"
            placeholder="请输入验证码"
          />
        </div>

        <div class="loginbutbox">
          <el-button
            @click="getCode"
            type="primary"
            style="margin-top: 10px"
            class="loginbut"
            >{{ content }}</el-button
          >
        </div>

        <div class="loginbutbox">
          <el-button @click="login" class="loginbut">登录</el-button>
        </div>
      </div>

      <template #footer> </template>
    </el-dialog>

    <div class="begintitle">
      <h1 v-show="!list.length">左风的ChatGPT</h1>
    </div>

    <div id="myList">
      <div :class="item.type === 0 ? 'problemList' : 'answerList'" v-for="item in list">
        <img class="listImg" :src="item.avatar" alt="" />
        <div v-highlight v-html="item.text" class="listText"></div>
      </div>

      <div v-show="loading" class="answerList">
        <img class="listImg" src="/log.png" alt="" />
        <img class="addin" src="/loading.gif" alt="" />
      </div>
    </div>

    <div v-show="!list.length" class="exhibition">
      <div class="witem">
        <svg
          class="w-6 h-6 m-auto"
          fill="none"
          height="1em"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" x2="12" y1="1" y2="3"></line>
          <line x1="12" x2="12" y1="21" y2="23"></line>
          <line x1="4.22" x2="5.64" y1="4.22" y2="5.64"></line>
          <line x1="18.36" x2="19.78" y1="18.36" y2="19.78"></line>
          <line x1="1" x2="3" y1="12" y2="12"></line>
          <line x1="21" x2="23" y1="12" y2="12"></line>
          <line x1="4.22" x2="5.64" y1="19.78" y2="18.36"></line>
          <line x1="18.36" x2="19.78" y1="5.64" y2="4.22"></line>
        </svg>
        <h3 class="title">实例</h3>
        <p>"用简单的术语解释量子计算"</p>
        <p>"10岁的生日有什么创意吗？"</p>
        <p>"如何在Javascript中提出HTTP请求？"</p>
      </div>

      <div class="witem">
        <svg
          aria-hidden="true"
          class="w-6 h-6 m-auto"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
        <h3 class="title">功能</h3>
        <p>还记得用户在对话中早些时候说的话</p>
        <p>允许用户提供后续更正</p>
        <p>接受过拒绝不当请求的培训</p>
      </div>

      <div class="witem">
        <svg
          class="w-6 h-6 m-auto"
          fill="none"
          height="1em"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          ></path>
          <line x1="12" x2="12" y1="9" y2="13"></line>
          <line x1="12" x2="12.01" y1="17" y2="17"></line>
        </svg>
        <h3 class="title">限制</h3>
        <p>偶尔可能会生成错误的信息</p>
        <p>偶尔可能会产生有害的指令或有偏见的内容</p>
        <p>对2021年后的世界和事件的了解有限</p>
      </div>
    </div>
    <div class="steppingstone"></div>

    <div class="inputbox">
      <el-input
        v-model="question"
        v-bind:readonly="loading"
        maxlength="500"
        tabindex="0"
        :autosize="{ minRows: 1, maxRows: 5 }"
        type="textarea"
        placeholder="输入你的指令"
      />

        <div class="btn-send" @click="send">
          <div class="send-view" style="display: flex">
            <svg
              stroke="currentColor"
              fill="none"
              stroke-width="2"
              viewBox="0 0 24 24"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 mr-1"
              height="1.5em"
              width="1.5em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </div>
          <div class="send-loading" style="display: none">
            <div></div>
            <div></div>
            <div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  height: 100vh;
}

.defbut {
  position: fixed;
  right: 2px;
  bottom: 152px;
}
.btn-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 32px;
  border-radius: 6px;
  color: rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.1);
}
.btn-send:hover {
  cursor: pointer;
  opacity: 0.85;
}
.text {
  position: absolute;
  top: 50px;
  border: 1px solid #e5e5e5;
  height: 60px;
  padding: 10px;
  width: 90%;
}

#myList {
  max-width: 1000px;
  margin: 0 auto;
  overflow-x: hidden;
  overflow-y: auto;
}

.problemList {
  display: flex;
  padding: 0px 200px;
}

.answerList {
  position: relative;
  padding: 20px 18px;
  font-size: 15px;
  display: flex;
  overflow-x: auto;
  white-space: pre-wrap;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
}

.listImg {
  margin-top: 5px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.listText {
  margin-left: 20px;
  padding-top: 10px;
  width: 100%;
  white-space: pre-wrap;
}

.inputbox {
  position: fixed;
  bottom: 30px;
  left: 0;
  right: 0;
  margin: auto;
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
}

.inputbox button {
  margin-left: 15px;
  width: 56px;
  height: 82%;
  border-radius: 6px;
  border: 0;
  background: silver;
  color: #333;
  font-size: 14px;
  outline: none;
}

.inputbox button:hover {
  cursor: pointer;
  opacity: 0.8;
}

.addin {
  margin: 10px 20px;
  width: 30px;
  height: 30px;
}

.steppingstone {
  width: 100%;
  height: 160px;
}

.amount {
  width: 60px;
  height: 40px;
  line-height: 54px;
  text-align: center;
  font-size: 16px;
  color: #606266;
}

.begintitle {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* padding: 50px 50px 30px 50px; */
}

.begintitle img {
  width: 200px;
}

.begintitle h1 {
  padding: 50px;
  font-size: 28px;
  font-weight: bold;
  text-align: center;
}

.exhibition {
  width: 80%;
  margin: auto;
  display: flex;
  justify-content: space-around;
}

.witem p {
  margin: auto;
  padding: 10px;
  margin-top: 15px;
  font-size: 16px;
  border-radius: 5px;
  text-align: center;
}

.witem h3 {
  padding: 15px;
  font-size: 20px;
  color: #606266;
  text-align: center;
}

textarea {
  border: none;
  resize: none;
  cursor: pointer;
  outline: none;
  overflow-y: hidden;
}
.head {
  position: fixed;
  width: 100%;
  padding: 0px 30px;
  line-height: 50px;
  justify-content: end;
  border-bottom: 1px solid #e5e5e5;
  background-color: #fff;
  z-index: 10;
}

.cardbox {
  display: flex;
}
.box-card {
  cursor: pointer;
  width: auto;
  margin: 20px;
  width: 160px;
  height: 140px;
  border: 1px solid;
  border-image: linear-gradient(orange, rgb(224, 72, 72)) 30 30;
}

.boxCard {
  width: auto;
  margin: 20px;
  width: 160px;
  height: 140px;
  border: 1px solid;
  border-image: linear-gradient(#fff, #fff) 30 30;
}

.useNumber {
  width: 50%;
  height: 30px;
  margin: auto;
  text-align: center;
  font-size: 18px;
}
.money {
  width: 50%;
  height: 80px;
  line-height: 80px;
  margin: auto;
  text-align: center;
}
.sign {
  font-size: 16px;
  background-image: linear-gradient(to right, orange, rgb(255, 255, 255));
  color: transparent;
  background-clip: text;
}
.number {
  font-size: 28px;
  font-weight: 700;
  background-image: linear-gradient(to right, orange, rgb(199, 61, 6));
  color: transparent;
  background-clip: text;
}
.accountbox {
  margin: auto;
  margin-top: 10px;
  display: flex;
}
.cheerbox {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: right;
}
.qrcode {
  margin: auto;
  width: 300px;
}
.cheer {
  width: 100px;
  height: 50px;
}

.loginbutbox {
  margin: auto;
  margin-top: 20px;
  width: 120px;
  height: 40px;
  line-height: 40px;
}
.loginbut {
  width: 120px;
  height: 40px;
}

.inputname {
  width: 80px;
  line-height: 40px;
}

:deep(.el-dialog__body) {
  padding: 0;
}

@media screen and (max-width: 600px) {
  .text {
    position: absolute;
    top: 30px;
    border: 1px solid #e5e5e5;
    height: 45px;
    padding: 10px;
    width: 80%;
  }
  .dialog {
    width: 100%;
  }
  :deep(.el-dialog) {
    width: 100%;
  }

  .useNumber {
    width: 100%;
  }
  .money {
    width: 100%;
    text-align: center;
  }
}
</style>
