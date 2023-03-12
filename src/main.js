import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css' //样式
 


const app = createApp(App)

//创建v-highlight全局指令
app.directive('highlight',function (el) {
    let blocks = el.querySelectorAll('pre code');
    blocks.forEach((block)=>{
      hljs.highlightBlock(block)
    })
  })

app.use(router)

app.mount('#app')