<script setup>
import { ref } from "vue";
import { Cloud } from "laf-client-sdk";
import wx from "../../public/wx.jpg";
// 将marked 引入
import { marked } from "marked";
import { User } from "@element-plus/icons-vue";
import QrcodeVue from "qrcode.vue";
import { ElMessage } from "element-plus";

const cloud = new Cloud({
  baseUrl: "https://i34hgt.laf.dev",
  getAccessToken: () => localStorage.getItem("access_token"),
  timeout: 60000,
});

//======================================data======================================
//消息列表
const list = ref([]);
//输入框绑定消息
const question = ref("");
//判断消息是否为空
const parentMessageId = ref("");
//获取消息loading
const loading = ref(false);
//充值dialog
const centerDialogVisible = ref(false);
//登录dialog
const centerDialogVisible2 = ref(false);
//手机号
const phone = ref("");
//验证码
const code = ref("");
//判断是否还在倒计时
const codebut = ref(false);
//手机号码错误弹出框
const err = ref(false);
//充值选项
const indexUp = ref(0);
//二维码展示dialog
const upCode = ref(false);
//发送验证码
const content = ref("发送验证码");
//验证码倒计时
const totalTime = ref(60);
//获取验证码按钮日否可以点击
const canClick = ref(true);
//用户剩余次数
const amount = ref(0);
//二维码链接
const codeUrl = ref("");
//订单号
const payOrder = ref("");
//判断设备
const isMobile = ref(false);
//输入框提示
const placeholder = ref("输入你的指令");
//验证手机号
const tel = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;

//======================================created======================================

// 判断是否为移动设备
if (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
) {
  isMobile.value = true;
} else {
  placeholder.value = "输入你的指令（Shift + Enter = 换行,Enter = 发送）";
}

//======================================function======================================



//发送消息
async function send() {
  //判断是否回复
  if (loading.value) return;
  list.value.push({
    text: question.value,
    avatar: "/avatar.jpeg",
  });
  //定位页面位置
  setScreen();
  const message = question.value;
  question.value = "";
  loading.value = true;
  let res;
  if (message == "") {
    loading.value = false;
    list.value.push({
      text: "问题不能为空！",
      avatar: "/logo.jpg",
    });
    setScreen();
    return;
  }
  try {
    if (!parentMessageId.value) {
      res = await cloud.invoke("openai-client", { message });
    } else {
      res = await cloud.invoke("openai-client", {
        message,
        parentMessageId: parentMessageId.value,
      });
    }
  } catch (error) {
    console.log(error);
    loading.value = false;
    list.value.push({
      text: "出错了，请重试！",
      avatar: "/logo.jpg",
    });
    setScreen();
    return;
  }

  parentMessageId.value = res.id;

  res.text = marked.parse(res.text);

  list.value.push({
    text: res.text,
    avatar: "/logo.jpg",
  });

  loading.value = false;
  setScreen();
}

//定位页面位置
function setScreen() {
  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 0);
}

//判断用户选择项
function select(e) {
  indexUp.value = e;
}

//发送消息适配PC或phone
function handleEnter(e) {
  if (e.key === "Enter" && !isMobile.value && !e.shiftKey) {
    send();
  }
}

</script>

<template>
  <div class="page">
    <!-- 头部 -->
    <el-row class="head">
      <div>
        <el-col :span="24">

          <!--  访问总数 -->
          <!-- ------------------------------------------ -->
               <el-text class="mx-1">
                访问人数:<span style="color:green" id="busuanzi_value_site_uv"></span>
               </el-text>
          <!-- ------------------------------------------ -->

          <el-divider direction="vertical" />

          <!--  请求总数 -->
          <!-- ------------------------------------------ -->
               <el-text class="mx-1">
                请求次数:<span style="color:green" id="busuanzi_value_site_pv"></span>
               </el-text>
          <!-- ------------------------------------------ -->

          <el-divider direction="vertical" />

          <!-- ------------------------------------------ -->
          <el-popover placement="bottom" :width="300" trigger="click">
            <el-image style="width: 100%; height: 100%" :src="wx" />
            <template #reference>
              <el-button class="m-2">联系微信</el-button>
            </template>
          </el-popover>
          <!-- ------------------------------------------ -->

          <!-- <el-button @click="judgeUp">充值</el-button> -->
          <!-- ------------------------------------------ -->

          <!-- <el-button @click="judge">
            <el-icon style="vertical-align: middle">
              <User />
            </el-icon>
            <span style="vertical-align: middle">登录</span>
          </el-button> -->
          <!-- ------------------------------------------ -->
        </el-col>
      </div>
    </el-row>

    <!-- 占位 -->
    <div style="height: 52px"></div>

    <!-- ------------------------------------------------------------ -->
    <div v-show="!list.length" class="begintitle">
      <h1 style="font-family: Cursive; font-size: 50px; color:darkcyan;">Melon AI</h1>

      <div style="margin-top: 80px; text-indent: 20px">
        如果想寻求合作或深度交流，可
        <a
          style="color: #ff0405"
          href="mailto:iworkvip@gmail.com"
          target="_blank"
          >点击</a
        >
        留下信息<span v-if="isMobile === true">!</span>
        <span v-if="isMobile === false">，我们顾问会第一时间联系您!</span>
      </div>

      <div style="margin-top: 10px">联系QQ:1440312008</div>

      <div class="lafText" v-if="isMobile === false">
        <div style="text-align: center">
          <a href="javascript:void(0)" style="color: darkcyan">Melon AI</a>
          <span> 基于ChatGPT，</span>
          <a href="https://platform.openai.com/overview" style="color: #ff0405">ChatGPT</a>
          <span> 是OpenAI训练的一种大型语言模型 </span>
        </div>
        <div>它可以用来进行对话生成、文本创作、自然语言理解等任务。ChatGPT使用了深度学习技术，</div>
        <div>可以根据输入的提示或上下文来生成连贯的回答或文章。</div><br/>
        <div style="font-size:0.7em; text-align: right: inherit;">更新关于ChatGPT的信息请访问 
          <a href="https://www.melonkid.cn" target="_blank" style="color: darkcyan">Melonkid</a> </div>
      </div>
    </div>


    <!-- 页面消息列表 -->
    <div id="myList">
      <div :class="item.type === 0 ? 'problemList' : 'answerList'" v-for="item in list">
        <img class="listImg" :src="item.avatar" alt="" />
        <div v-highlight v-html="item.text" class="listText"></div>
      </div>

      <div v-show="loading" class="answerList">
        <img class="listImg" src="/logo.jpg" alt="" />
        <img class="addin" src="/loading.gif" alt="" />
      </div>
    </div>

    <!-- ------------------------------------------------------ -->

    <!-- 输入框 -->
    <div class="inputbox">
      <el-input
        v-model="question"
        v-bind:readonly="loading"
        maxlength="1000"
        tabindex="0"
        :autosize="{ minRows: 1, maxRows: 5 }"
        type="textarea"
        :placeholder="placeholder"
        @keypress="handleEnter"
      />

      <!-- 发送按钮小飞机 -->
      <div class="btn-send" @click="send">
        <div class="send-view" style="display: flex">
          <svg
            stroke="currentColor"
            fill="none"
            stroke-width="2"
            viewBox="0 0 24 24"
            class="h-4 w-4 mr-1"
            height="1.5em"
            width="1.5em"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </div>
      </div>
    </div>

    <!-- ----------------------------------------------- -->
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
  margin-left: 10px;
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
  padding: 0px 0 60px 0;
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
.pre {
  white-space: pre-wrap;
  text-indent: 2em;
  word-wrap: break-word;
  padding: 0 0 10% 0;
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
  margin: 5px;
  width: 100px;
  height: 40px;
  line-height: 44px;
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
  justify-content: center;
  flex-wrap: wrap;
}
.box-card {
  cursor: pointer;
  width: auto;
  margin: 20px;
  width: 160px;
  height: 140px;
  border: 1px solid #e6a23c;
  box-shadow: 0 16rpx 16rpx rgba(10, 16, 20, 0.24), 0 0 16rpx rgba(10, 16, 20, 0.12);
}

.boxCard {
  width: auto;
  margin: 20px;
  width: 160px;
  height: 140px;
  border: 1px solid #fff;
  box-shadow: 0 16rpx 16rpx rgba(10, 16, 20, 0.24), 0 0 16rpx rgba(10, 16, 20, 0.12);
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
.qrcode {
  margin: auto;
  width: 300px;
}
.qrcodeText {
  margin: 20px 0 0 0;
  font-size: 20px;
  width: 100%;
  text-align: center;
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
.contentText {
}
.lafText {
  margin-top: 50px;
  color: #56585d;
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
  .head {
    padding: 0px 5px;
  }
  .amount {
    margin: 5px;
    width: 70px;
    height: 40px;
    line-height: 44px;
    text-align: center;
    font-size: 12px;
    color: #606266;
  }
}
</style>
