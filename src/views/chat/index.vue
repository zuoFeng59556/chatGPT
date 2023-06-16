<script setup lang="ts">
import axios, { CancelTokenSource } from "axios";
import type { Ref } from "vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { NAutoComplete, NButton, NInput, useDialog, useMessage } from "naive-ui";
import { Message } from "./components";
import { useScroll } from "./hooks/useScroll";
import { useChat } from "./hooks/useChat";
import { useUsingContext } from "./hooks/useUsingContext";
import { HoverButton, SvgIcon } from "@/components/common";
import { useBasicLayout } from "@/hooks/useBasicLayout";
import { useChatStore, usePromptStore } from "@/store";
import { t } from "@/locales";
import Header from "@/components/Header.vue";
import { cloud } from "@/api/lafAPI";
import { useMyStore } from "@/store";

const myStore = useMyStore(); // 获取到我创建的store

let controller = new AbortController();

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === "true";

const route = useRoute();
const dialog = useDialog();

const chatStore = useChatStore();

const { isMobile } = useBasicLayout();
const { addChat, updateChat, updateChatSome, getChatByUuidAndIndex } = useChat();
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll();
const { usingContext } = useUsingContext();

const { uuid } = route.params as { uuid: string };

const dataSources = computed(() => chatStore.getChatByUuid(+uuid));
const conversationList = computed(() =>
  dataSources.value.filter((item) => !item.inversion && !!item.conversationOptions)
);

const prompt = ref<string>("");
const parentMessageId = ref<string>("");
const loading = ref<boolean>(false);
const inputRef = ref<Ref | null>(null);
let source: CancelTokenSource | null = null;
const message = useMessage();

// 添加PromptStore
const promptStore = usePromptStore();

// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const { promptList: promptTemplate } = storeToRefs<any>(promptStore);

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
  if (item.loading) updateChatSome(+uuid, index, { loading: false });
});

// ================================================需要修改部分================================================

// 监听发送消息
async function handleSubmit() {
  if (!localStorage.getItem("access_token")) return message.error("请先登录哦～");
  onConversation();
}

// 请求接口发送消息
async function onConversation() {
  let message = prompt.value;

  if (loading.value) return;

  if (!message || message.trim() === "") return;

  controller = new AbortController();

  addChat(+uuid, {
    dateTime: new Date().toLocaleString(),
    text: message,
    inversion: true,
    error: false,
    conversationOptions: null,
    requestOptions: { prompt: message, options: null },
  });
  scrollToBottom();

  loading.value = true;
  prompt.value = "";

  let options: Chat.ConversationRequest = {};
  const lastContext =
    conversationList.value[conversationList.value.length - 1]?.conversationOptions;

  if (lastContext && usingContext.value) options = { ...lastContext };

  addChat(+uuid, {
    dateTime: new Date().toLocaleString(),
    text: "",
    loading: true,
    inversion: false,
    error: false,
    conversationOptions: null,
    requestOptions: { prompt: message, options: { ...options } },
  });
  scrollToBottom();

  // 请求接口获取回复信息
  try {
    let lastText = "";
    const token = localStorage.getItem("access_token");
    source = axios.CancelToken.source();

    const fetchChatAPIOnce = async () => {
      await axios({
        url: "https://jyf6wk.laf.dev/send",
        method: "post",
        data: { message, parentMessageId: parentMessageId.value },
        responseType: "text",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cancelToken: source?.token,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target;
          const { responseText } = xhr;
          const parts = responseText.split("--!");
          let chunk = parts[0];
          parentMessageId.value = parts[1];

          try {
            const data = chunk;
            updateChat(+uuid, dataSources.value.length - 1, {
              dateTime: new Date().toLocaleString(),
              text: lastText + (data ?? ""),
              inversion: false,
              error: false,
              loading: false,
              conversationOptions: {
                conversationId: data.conversationId,
                parentMessageId: data.id,
              },
              requestOptions: { prompt: message, options: { ...options } },
            });

            if (openLongReply && data.detail.choices[0].finish_reason === "length") {
              options.parentMessageId = data.id;
              lastText = data;
              message = "";
              return fetchChatAPIOnce();
            }

            scrollToBottomIfAtBottom();
          } catch (error) {
            //
          }
        },
      }).then(() => {
        getAmount();
      });

      updateChatSome(+uuid, dataSources.value.length - 1, { loading: false });
    };

    await fetchChatAPIOnce();
  } catch (error: any) {
    const errorMessage = error?.message ?? t("common.wrong");

    if (error.message === "canceled") {
      updateChatSome(+uuid, dataSources.value.length - 1, {
        loading: false,
      });
      scrollToBottomIfAtBottom();
      return;
    }

    const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1);

    if (currentChat?.text && currentChat.text !== "") {
      updateChatSome(+uuid, dataSources.value.length - 1, {
        text: `${currentChat.text}\n[${errorMessage}]`,
        error: false,
        loading: false,
      });
      return;
    }

    updateChat(+uuid, dataSources.value.length - 1, {
      dateTime: new Date().toLocaleString(),
      text: errorMessage,
      inversion: false,
      error: true,
      loading: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    });
    scrollToBottomIfAtBottom();
  } finally {
    loading.value = false;
  }
}

// 重新回答
async function onRegenerate(index: number) {
  if (loading.value) return;

  controller = new AbortController();

  const { requestOptions } = dataSources.value[index];

  let message = requestOptions?.prompt ?? "";

  let options: Chat.ConversationRequest = {};

  if (requestOptions.options) options = { ...requestOptions.options };

  loading.value = true;

  updateChat(+uuid, index, {
    dateTime: new Date().toLocaleString(),
    text: "",
    inversion: false,
    error: false,
    loading: true,
    conversationOptions: null,
    requestOptions: { prompt: message, options: { ...options } },
  });

  try {
    let lastText = "";
    const token = localStorage.getItem("access_token");

    const fetchChatAPIOnce = async () => {
      await axios({
        url: "https://jyf6wk.laf.dev/send",
        method: "post",
        data: { message, parentMessageId: parentMessageId.value },
        responseType: "text",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cancelToken: source?.token,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target;
          const { responseText } = xhr;
          const parts = responseText.split("--!");
          let chunk = parts[0];
          parentMessageId.value = parts[1];

          try {
            const data = chunk;
            updateChat(+uuid, dataSources.value.length - 1, {
              dateTime: new Date().toLocaleString(),
              text: lastText + (data ?? ""),
              inversion: false,
              error: false,
              loading: false,
              conversationOptions: {
                conversationId: data.conversationId,
                parentMessageId: data.id,
              },
              requestOptions: { prompt: message, options: { ...options } },
            });

            if (openLongReply && data.detail.choices[0].finish_reason === "length") {
              options.parentMessageId = data.id;
              lastText = data;
              message = "";
              return fetchChatAPIOnce();
            }

            scrollToBottomIfAtBottom();
          } catch (error) {
            //
          }
        },
      }).then(() => {
        getAmount();
      });
      updateChatSome(+uuid, dataSources.value.length - 1, { loading: false });
    };
    await fetchChatAPIOnce();
  } catch (error: any) {
    if (error.message === "canceled") {
      updateChatSome(+uuid, index, {
        loading: false,
      });
      return;
    }

    const errorMessage = error?.message ?? t("common.wrong");

    updateChat(+uuid, index, {
      dateTime: new Date().toLocaleString(),
      text: errorMessage,
      inversion: false,
      error: true,
      loading: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    });
  } finally {
    loading.value = false;
  }
}

// 终止流式返回
function handleStop() {
  if (loading.value) {
    loading.value = false;
    source?.cancel("请求被用户中断");
  }
}

// 获取用户剩余次数
async function getAmount() {
  if (!localStorage.getItem("access_token")) return;
  const res = await cloud.invoke("get-amount");
  myStore.changeAmount(res.amount);
}

function handleDelete(index: number) {
  if (loading.value) return;

  dialog.warning({
    title: t("chat.deleteMessage"),
    content: t("chat.deleteMessageConfirm"),
    positiveText: t("common.yes"),
    negativeText: t("common.no"),
    onPositiveClick: () => {
      chatStore.deleteChatByUuid(+uuid, index);
    },
  });
}

function handleClear() {
  if (loading.value) return;

  dialog.warning({
    title: t("chat.clearChat"),
    content: t("chat.clearChatConfirm"),
    positiveText: t("common.yes"),
    negativeText: t("common.no"),
    onPositiveClick: () => {
      chatStore.clearChatByUuid(+uuid);
      parentMessageId.value = "";
    },
  });
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  } else {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      handleSubmit();
    }
  }
}

// 可优化部分
// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
const searchOptions = computed(() => {
  if (prompt.value.startsWith("/")) {
    return promptTemplate.value
      .filter((item: { key: string }) =>
        item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())
      )
      .map((obj: { value: any }) => {
        return {
          label: obj.value,
          value: obj.value,
        };
      });
  } else {
    return [];
  }
});

// value反渲染key
const renderOption = (option: { label: string }) => {
  for (const i of promptTemplate.value) {
    if (i.value === option.label) return [i.key];
  }
  return [];
};

const placeholder = computed(() => {
  if (isMobile.value) return t("chat.placeholderMobile");
  return t("chat.placeholder");
});

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === "";
});

const footerClass = computed(() => {
  let classes = ["p-4"];
  if (isMobile.value)
    classes = [
      "sticky",
      "left-0",
      "bottom-0",
      "right-0",
      "p-2",
      "pr-3",
      "overflow-hidden",
    ];
  return classes;
});

onMounted(() => {
  scrollToBottom();
  if (inputRef.value && !isMobile.value) inputRef.value?.focus();
});

onUnmounted(() => {
  if (loading.value) controller.abort();
});
</script>

<template>
  <div class="flex flex-col h-full">
    <Header amount="2008" />
    <main class="flex-1 mx-auto lg:w-3/5 w-full overflow-hidden">
      <div
        id="scrollRef"
        ref="scrollRef"
        class="h-full w-full overflow-hidden overflow-y-auto"
      >
        <div
          id="image-wrapper"
          class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
          :class="[isMobile ? 'p-2' : 'p-4']"
        >
          <template v-if="!dataSources.length">
            <div
              class="flex items-center justify-center mt-4 text-center text-neutral-300"
            >
              <SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl" />
              <span>Aha~</span>
            </div>
          </template>
          <template v-else>
            <div>
              <Message
                v-for="(item, index) of dataSources"
                :key="index"
                :date-time="item.dateTime"
                :text="item.text"
                :inversion="item.inversion"
                :error="item.error"
                :loading="item.loading"
                @regenerate="onRegenerate(index)"
                @delete="handleDelete(index)"
              />
              <div class="sticky bottom-0 left-0 flex justify-center">
                <NButton v-if="loading" type="warning" @click="handleStop">
                  <template #icon>
                    <SvgIcon icon="ri:stop-circle-line" />
                  </template>
                  Stop Responding
                </NButton>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full= max-w-screen-xl mx-auto lg:w-3/5 m-auto">
        <div class="flex items-center justify-between space-x-3">
          <HoverButton @click="handleClear">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:delete-bin-line" />
            </span>
          </HoverButton>
          <NAutoComplete
            v-model:value="prompt"
            :options="searchOptions"
            :render-label="renderOption"
          >
            <template #default="{ handleInput, handleBlur, handleFocus }">
              <NInput
                ref="inputRef"
                v-model:value="prompt"
                type="textarea"
                :placeholder="placeholder"
                :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
                @input="handleInput"
                @focus="handleFocus"
                @blur="handleBlur"
                @keypress="handleEnter"
              />
            </template>
          </NAutoComplete>
          <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
            <template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill" />
              </span>
            </template>
          </NButton>
        </div>
      </div>
    </footer>
  </div>
</template>
