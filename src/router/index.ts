import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import MainLayout from "../layout/MainLayout.vue";
import BundleGenerator from "../views/BundleGenerator.vue";
import BundleManager from "../views/BundleManager.vue";
import BundleProducts from "../views/BundleProducts.vue";
import DataMaintenance from "../views/DataMaintenance.vue";
import DeveloperSettings from "../views/DeveloperSettings.vue";
import Login from "../views/Login.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { title: "登录", requiresAuth: false },
  },
  {
    path: "/",
    component: MainLayout,
    redirect: "/generator",
    meta: { requiresAuth: true },
    children: [
      {
        path: "generator",
        name: "BundleGenerator",
        component: BundleGenerator,
        meta: { title: "货组生成" },
      },
      {
        path: "manager",
        name: "BundleManager",
        component: BundleManager,
        meta: { title: "货组管理" },
      },
      {
        path: "bundle-products",
        name: "BundleProducts",
        component: BundleProducts,
        meta: { title: "商品编辑" },
      },
      {
        path: "data",
        name: "DataMaintenance",
        component: DataMaintenance,
        meta: { title: "数据管理" },
      },
      {
        path: "developer",
        name: "DeveloperSettings",
        component: DeveloperSettings,
        meta: {
          title: "开发者设置",
          requiresDeveloper: true, // 标记需要开发者权限
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫 - 检查认证状态
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth !== false,
  );

  if (requiresAuth && !token) {
    // 需要认证但没有 token，跳转到登录页
    next({ path: "/login", query: { redirect: to.fullPath } });
  } else if (to.path === "/login" && token) {
    // 已登录但访问登录页，跳转到首页
    next({ path: "/" });
  } else {
    next();
  }
});

export default router;
