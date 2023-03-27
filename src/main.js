import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import './plugins/bootstrap-vue'
import { BootstrapVueIcons } from 'bootstrap-vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false
Vue.use(BootstrapVueIcons)

new Vue({
  router,
  render: function (h) { return h(App) }
}).$mount('#app')
