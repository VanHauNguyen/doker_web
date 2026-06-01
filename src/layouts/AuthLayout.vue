<script setup lang="ts">
import { ShieldCheck, Sparkles, Wrench } from 'lucide-vue-next'
</script>

<template>
  <main class="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(245,158,11,.18),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(56,189,248,.16),transparent_24%),linear-gradient(135deg,#07111f,#101827_48%,#172033)] px-3 py-4 text-white sm:px-4 sm:py-6">
    <div class="app-ambient" aria-hidden="true" />
    <div class="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.06),transparent_26%,rgba(255,255,255,.035)_54%,transparent_78%)] opacity-70" />
    <div class="premium-panel relative mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl rounded-2xl bg-white/[0.045] sm:min-h-[calc(100vh-3rem)] sm:rounded-[2rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
      <section class="hidden flex-col justify-between border-r border-white/10 p-10 lg:flex">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
            <Sparkles class="h-4 w-4" /> DOKER Premium Member
          </div>
          <h1 class="mt-6 max-w-xl text-5xl font-black leading-tight tracking-normal text-white">
            高端機車保固、安裝服務與會員商城。
          </h1>
          <p class="mt-5 max-w-lg text-base leading-7 text-slate-300">
            登入後可管理訂單、保固憑證、愛車資料、優惠券、點數獎勵與客服訊息。
          </p>
        </div>
        <div class="grid gap-4">
          <div class="hover-lift rounded-2xl border border-white/10 bg-slate-950/35 p-5">
            <ShieldCheck class="h-6 w-6 text-emerald-100" />
            <p class="mt-3 font-black">保固憑證與 QR 核驗</p>
            <p class="mt-1 text-sm text-slate-400">訂單完成後自動連動保固、車輛與服務紀錄。</p>
          </div>
          <div class="hover-lift rounded-2xl border border-white/10 bg-slate-950/35 p-5">
            <Wrench class="h-6 w-6 text-sky-100" />
            <p class="mt-3 font-black">安裝服務流程</p>
            <p class="mt-1 text-sm text-slate-400">從購物、付款、配送到門市施工狀態完整追蹤。</p>
          </div>
        </div>
      </section>
      <section class="relative grid min-w-0 place-items-center p-4 sm:p-8">
        <div class="w-full max-w-md">
          <div class="mb-6 lg:hidden">
            <p class="text-xs font-black text-amber-100">DOKER</p>
            <h1 class="mt-2 text-3xl font-black">保固與電商會員平台</h1>
          </div>
          <RouterView v-slot="{ Component }">
            <Transition name="page-fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </section>
    </div>
  </main>
</template>
