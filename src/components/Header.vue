<script setup lang="ts">
import { NButton, NModal, NInput, useMessage, NPopconfirm } from "naive-ui";
import { ref } from "vue";
import { cloud } from "@/api/lafAPI";
import { useMyStore, useChatStore } from "@/store";
import QrcodeVue from "qrcode.vue";

//====================================data====================================
const myStore = useMyStore(); // 获取到我创建的store
const chatStore = useChatStore(); // 获取到聊天记录store

const message = useMessage();
//验证手机号
const tel = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
const showLoginModal = ref(false); //登录弹窗
const showWxModal = ref(false); //微信弹窗
const showRecharge = ref(false); //充值弹窗
const showPayModal = ref(false); //支付弹窗

const phone = ref(""); // 手机号
const code = ref(""); // 验证码
const codebut = ref(false); //判断验证码是否还在倒计时
const content = ref("发送验证码"); //发送验证码
const totalTime = ref(60); //验证码倒计时
const canClick = ref(true); //获取验证码按钮日否可以点击
const userName = ref(""); // 用户名
const indexUp = ref(0); //充值选项
const codeUrl = ref(""); //二维码链接
const payOrder = ref(""); //订单号

//====================================created====================================
getUserInfo();
getAmount();
//====================================methods====================================

function deleteChat() {
  chatStore.deleteAllHistory();
}

function getUserInfo() {
  const userInfo = JSON.parse(localStorage.getItem("user") as string);
  userName.value = userInfo?.phone.slice(-4);
}

//获取验证码
async function getCode() {
  if (!tel.test(phone.value)) {
    message.error("请输入正确的手机号");
    return;
  }

  if (codebut.value) return;
  countDown();

  await cloud.invoke("getCode", { phone: phone.value });
}

//验证码倒计时
function countDown() {
  if (!canClick.value) return;

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

//验证登录
async function login() {
  const res = await cloud.invoke("login", { phone: phone.value, code: code.value });
  console.log(res);
  if (res.code === 1) {
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    message.success("登录成功");
    phone.value = "";
    code.value = "";
    showLoginModal.value = false;
    getAmount();
    getUserInfo();
  } else {
    message.error("无效的验证码");
  }
}

// 获取用户剩余次数
async function getAmount() {
  if (!localStorage.getItem("access_token")) return;
  const res = await cloud.invoke("get-amount");
  myStore.changeAmount(res.amount);
}

//判断用户选择充值项
function select(e: number) {
  indexUp.value = e;
}
//点击充值
async function openCode() {
  let num = 0;
  if (indexUp.value == 0) num = 2000;
  if (indexUp.value == 1) num = 5000;
  if (indexUp.value == 2) num = 100000;

  const res = await cloud.invoke("pay", { amount: num });
  payOrder.value = res.orderId;
  codeUrl.value = res.codeUrl;
  showRecharge.value = false;
  showPayModal.value = true;
  checkPay();
}

//验证用户是否付款
async function checkPay() {
  if (!showPayModal.value) return;
  const res = await cloud.invoke("check-pay-ordet", { order: payOrder.value });
  if (res.code == 1) {
    showPayModal.value = false;
    getAmount();
    message.success("充值成功");
  } else {
    setTimeout(() => {
      checkPay();
    }, 1000);
  }
}

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  localStorage.removeItem("chatStorage");

  userName.value = "";
  deleteChat();

  myStore.changeAmount(0);
  message.success("退出成功");
}
</script>

<template>
  <nav class="bg-gray-500">
    <div class="mx-auto px-2 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- 左侧logo -->
        <div class="flex-shrink-0 flex items-center hover:cursor-pointer">
          <!-- LOGO 图片位置 -->
          <img class="h-8 w-8" src="@/assets/logo.jpg" alt="Logo" />
          <span class="text-white font-bold ml-2">Laf AI</span>
        </div>
        <!-- 右侧菜单 -->
        <div class="block">
          <div class="ml-4 flex items-center md:ml-6">
            <span
              class="text-gray-300 hover:text-white hover:cursor-pointer px-3 py-2 rounded-md text-sm font-medium"
              >剩余{{ myStore.globalAmount }}</span
            >
            <span
              @click="showRecharge = true"
              class="text-gray-300 hover:text-white hover:cursor-pointer px-3 py-2 rounded-md text-sm font-medium"
              >充值</span
            >
            <span
              @click="showWxModal = true"
              class="text-gray-300 hover:text-white hover:cursor-pointer px-3 py-2 rounded-md text-sm font-medium"
              >联系我</span
            >
            <span
              v-show="!userName"
              @click="showLoginModal = true"
              class="text-gray-300 hover:text-white hover:cursor-pointer px-3 py-2 rounded-md text-sm font-medium"
              >登录</span
            >

            <n-popconfirm v-show="userName" @positive-click="logout">
              <template #trigger>
                <span
                  v-show="userName"
                  class="text-gray-300 hover:text-white hover:cursor-pointer px-3 py-2 rounded-md text-sm font-medium"
                  >用户{{ userName }}</span
                >
              </template>
              确定要退出登陆吗？
            </n-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- 登陆弹窗 -->
    <n-modal class="modal" v-model:show="showLoginModal" preset="card" title="Dialog">
      <template #header>
        <div>登录</div>
      </template>
      <div>
        <n-input v-model:value="phone" placeholder="请输入手机号" />
        <n-input class="mt-5" v-model:value="code" placeholder="请输入验证码" />
        <n-button class="btn" @click="getCode"> {{ content }} </n-button>
        <n-button class="btn" @click="login" type="primary"> 登录 </n-button>
      </div>
    </n-modal>

    <!-- 微信弹窗 -->
    <n-modal class="modal" v-model:show="showWxModal" preset="card" title="Dialog">
      <template #header>
        <div>联系我</div>
      </template>
      <div>
        <img class="WxImg" src="../assets/wx.png" alt="" />
      </div>
    </n-modal>

    <!-- 充值弹窗 -->
    <n-modal class="modal" v-model:show="showRecharge" preset="card" title="Dialog">
      <template #header>
        <div>充值</div>
      </template>
      <div class="cardbox">
        <!-- --------------------------------------------------------------- -->
        <div @click="select(0)" :class="indexUp === 0 ? 'box-card' : 'boxCard'">
          <div class="useNumber">400次</div>
          <div class="money">
            <span class="sign">￥</span>
            <span class="number">20</span>
          </div>
        </div>

        <!-- --------------------------------------------------------------- -->

        <div
          @click="select(1)"
          :class="indexUp === 1 ? 'box-card' : 'boxCard'"
          class="box-card"
        >
          <div class="useNumber">1500次</div>
          <div class="money">
            <span class="sign">￥</span>
            <span class="number">50</span>
          </div>
        </div>

        <div
          @click="select(2)"
          :class="indexUp === 2 ? 'box-card' : 'boxCard'"
          class="box-card"
        >
          <div class="useNumber">5万次</div>
          <div class="money">
            <span class="sign">￥</span>
            <span class="number">1000</span>
          </div>
        </div>
      </div>
      <!-- ----------------------------------------------------- -->
      <div class="cheerbox">
        <n-button @click="openCode" class="cheer" type="warning">充值</n-button>
      </div>
    </n-modal>

    <!-- 扫码支付弹窗 -->
    <n-modal class="modal" v-model:show="showPayModal" preset="card" title="Dialog">
      <template #header>
        <div>微信扫码支付</div>
      </template>
      <div class="payCode">
        <qrcode-vue :value="codeUrl" :size="300" level="H" />
      </div>
    </n-modal>
  </nav>
</template>

<style>
.modal {
  width: 600px;
}
.btn {
  margin: 20px 20px 0 0px;
}
.WxImg {
  width: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto;
}
.cardbox {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.box-card {
  cursor: pointer;
  margin: 20px;
  width: 160px;
  height: 140px;
  border: 2px solid #e6a23c;
  border-radius: 5px;
}

.boxCard {
  width: auto;
  margin: 20px;
  width: 160px;
  height: 140px;
  border: 2px solid #f6f6f6;
  border-radius: 5px;
}

.useNumber {
  width: 50%;
  height: 30px;
  margin: 10px auto;
  text-align: center;
  font-size: 18px;
}
.money {
  width: 70%;
  height: 100px;
  text-align: center;
  margin: auto;
  line-height: 80px;
  margin: auto;
}
.sign {
  font-size: 16px;
  color: #e6a23c;
}
.number {
  width: 100%;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #e6a23c;
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
.payCode {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto;
}
</style>
