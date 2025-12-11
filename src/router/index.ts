import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import MainLayout from "../layout/MainLayout.vue";
import BundleGenerator from "../views/BundleGenerator.vue";
import BundleManager from "../views/BundleManager.vue";
import DataMaintenance from "../views/DataMaintenance.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: MainLayout,
    redirect: "/generator",
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
        path: "data",
        name: "DataMaintenance",
        component: DataMaintenance,
        meta: { title: "数据管理" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
