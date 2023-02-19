import { createRouter, createWebHistory, createWebHashHistory } from "vue-router"
import Store from "@/stores/Store"

export const router = createRouter({
    history: Store.isInApp ? createWebHashHistory() : createWebHistory(),
    strict: true,
    routes: [

        {
            path: "/",
            redirect: "/projects"
        },

        {
            path: "/projects",
            name: "dashboard",
            meta: { title: "Projects" },
            component: () => import("@/components/Dashboard")
        },

        {
            path: "/projects/:id",
            name: "project-details",
            meta: { title: "Project" },
            component: () => import("@/components/Project"),
            children: [
               {
                    path: "/projects/:id/output/:oid",
                    name: "output-details",
                    component: () => import("@/components/Output")
               }
            ]
        }

    ]
})