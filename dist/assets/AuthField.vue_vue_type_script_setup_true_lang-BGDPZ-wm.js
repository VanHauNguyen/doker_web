import{c as r}from"./createLucideIcon-FHwLswPu.js";import{r as p,m as s,j as n,p as k,U as d,l,k as c,P as x,y as b,V as y,K as v,h as w,D as t}from"./index-CuZCAlGW.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=r("EyeOffIcon",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=r("EyeIcon",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=r("LockKeyholeIcon",[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=r("MailIcon",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]),M={class:"group block"},q={class:"mb-2 flex items-center justify-between text-xs font-black text-slate-300"},I={key:0,class:"text-amber-100"},B={class:"relative block"},C=["type","autocomplete","required","value"],E={key:0,class:"mt-2 block text-xs font-semibold text-rose-200"},z=p({__name:"AuthField",props:{modelValue:{},label:{},type:{default:"text"},autocomplete:{default:void 0},icon:{default:void 0},error:{default:null},required:{type:Boolean,default:!1}},emits:["update:modelValue"],setup(e,{emit:m}){const i=e,f=m,a=v(!1),h=w(()=>i.type==="password"&&a.value?"text":i.type);return(L,o)=>(t(),s("label",M,[n("span",q,[k(d(e.label)+" ",1),e.required?(t(),s("span",I,"必填")):l("",!0)]),n("span",B,[e.icon?(t(),c(x(e.icon),{key:0,class:"pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-accent"})):l("",!0),n("input",{class:b(["field h-12 w-full rounded-2xl border-white/10 bg-slate-950/35 transition focus:border-amber-200/35 focus:ring-2 focus:ring-amber-200/10",[e.icon?"pl-11":"",e.type==="password"?"pr-11":"",e.error?"border-rose-300/40 bg-rose-300/10":""]]),type:h.value,autocomplete:e.autocomplete,required:e.required,value:e.modelValue,onInput:o[0]||(o[0]=u=>f("update:modelValue",u.target.value))},null,42,C),e.type==="password"?(t(),s("button",{key:1,class:"absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-white",type:"button",onClick:o[1]||(o[1]=u=>a.value=!a.value)},[a.value?(t(),c(y(g),{key:0,class:"h-4 w-4"})):(t(),c(y(V),{key:1,class:"h-4 w-4"}))])):l("",!0)]),e.error?(t(),s("span",E,d(e.error),1)):l("",!0)]))}});export{K as L,N as M,z as _};
