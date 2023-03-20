<script setup>
import { ref } from "vue";
import { Cloud } from "laf-client-sdk";
import wx from "../../public/wx.png";
// 将marked 引入
import { marked } from "marked";
import { User } from "@element-plus/icons-vue";

const cloud = new Cloud({
  baseUrl: "https://jyf6wk.laf.dev",
  getAccessToken: () => "",
  timeout: 60000,
});

const list = ref([]);
const question = ref("");
const parentMessageId = ref("");
const loading = ref(false);
const centerDialogVisible = ref(false);
const centerDialogVisible2 = ref(false);
const phone = ref("");
const code = ref("");


async function getCode(){
   const res =  await cloud.invoke('getCode',{phone})
    console.log(res);
}


async function send() {
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
  setScreen();
}

function setScreen() {
  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 0);
}
</script>

<template>
  <div class="page">
    <el-row class="head">
      <div>
        <el-col :span="24">
          <el-popover placement="bottom" :width="300" trigger="click">
            <el-image style="width: 100%; height: 100%" :src="wx" :fit="contain" />
            <template #reference>
              <el-button class="m-2">微信群</el-button>
            </template>
          </el-popover>

          <el-button @click="centerDialogVisible = true">会员</el-button>

          <el-button @click="centerDialogVisible2 = true">
            <el-icon style="vertical-align: middle">
              <User />
            </el-icon>
            <span style="vertical-align: middle">登录</span>
          </el-button>
        </el-col>
      </div>
    </el-row>
    <div style="height: 50px"></div>

    <el-dialog
      modal="true"
      v-model="centerDialogVisible"
      title="Plus会员"
      width="50%"
      height="50%"
      center
    >
      <div class="cardbox">
        <el-card class="box-card"> 20次 </el-card>
        <el-card class="box-card"> 20次 </el-card>
      </div>

      <template #footer> </template>
    </el-dialog>

    <el-dialog
      modal="true"
      v-model="centerDialogVisible2"
      title="登录"
      center
      width="30%"
    >
      <div class="accountbox">
        <div class="inputname">手机号：</div>
        <el-input
          class="elinput"
          type="number"
          v-model="phone"
          placeholder="请输入手机号"
        />
      </div>

      <div class="accountbox">
        <div class="inputname">验证码：</div>

        <el-input class="elinputcode" v-model="code" placeholder="请输入验证码" show-password />
        <el-button @click="getCode" type="primary"  class="codebut">发送验证码</el-button>
      </div>


      <div class="loginbutbox">
        <el-button   class="loginbut">登录</el-button>
      </div>

      <template #footer> </template>
    </el-dialog>

    <div class="begintitle">
      <h1 v-show="!list.length" @click="send">左风的ChatGPT</h1>
      <h2>免费额度用完了，我正在充值，大家可以先加一下群</h2>
      <img src="../../public/wx.png" alt="" />
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
      <input
        v-bind:readonly="loading"
        @keyup.enter="send"
        tabindex="0"
        data-id="root"
        rows="1"
        v-model="question"
        type="text"
        id="message"
        placeholder="输入你的指令"
        maxlength="100"
      />
      <div class="btn-send" id="submit-btn" @click="send">
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
  border: 1px solid rgba(0, 0, 0, 0.3);
  padding-right: 12px;
  background: #fff;
  border-radius: 8px;
}

.inputbox input {
  flex-grow: 1;
  height: 44px;
  max-height: 100px;
  border: 0;
  outline: none;
  padding: 12px 15px;
  background: transparent;
  font-size: 16px;
  width: 100%;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.7);
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
  width: auto;
  margin: 20px;
  width: 160px;
  height: 180px;
}
.accountbox {
  margin: auto;
  margin-top: 10px;
  display: flex;
}
.inputname {
  width: 80px;
}
.elinput{
  width: 400px;
}
.elinputcode{
  width: 300px;
}
.codebut{
  height: 40px;
}
.loginbutbox{
  margin: auto;
  margin-top: 20px;
  width: 120px;
  height: 40px;
}
.loginbut{
  width: 120px;
  height: 40px;
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
}
</style>
