---
title: "ARC: Ask · Rank · Commit"
summary: "一个以商品目录为依据的购物智能体，知道该问什么、如何排序、以及何时给出结论。TikTok TechJam 2026（Track 4 购物助手）全球总决赛入围，600+ 支队伍中位列前 12。"
link: "https://github.com/kelvin715/techjam-2026-shopping-copilot"
extraLinks:
  - label: "在线回放"
    url: "https://kelvin715.github.io/techjam-2026-shopping-copilot"
tags: [大模型智能体, 对话式搜索, 商品排序, 检索, Python]
date: "2026-09"
category: nlp
role: lead
isOpenSource: true
featured: true
badge: "全球总决赛入围"
featuredImage: /images/projects/arc-poster.jpeg
highlights:
  - "检索能把正确的商品排在前面，却依然可能让用户失望——ARC 把每一轮对话建模为一个状态下的三种决策：RANK（哪些商品最匹配）、ASK（问哪个问题收益最大）、COMMIT（此刻给出多少个商品）。"
  - "优先匹配商品目录中的证据，只在措辞确实需要时才调用大模型，使系统保持低成本且可审计。"
  - "在基准测试中以平均 1.98 轮完成全部 200/200 个会话，远低于主办方设定的 10 轮、每轮最多 5 个商品的限制。"
  - "在主办方基准上以零模型 token、纯标准库 Python 运行，4 GB 内存、无 GPU 的机器上每个会话约 15 毫秒。"
  - "当用户用自己的措辞改写需求（而非使用基准模板）时，大模型级联把效果从 0.15 提升到 0.78。"
---

**ARC** 是为 TikTok TechJam 2026 Track 4 打造的购物助手，从 600+ 支队伍中脱颖而出，作为前 12 名入围全球总决赛。

核心想法是：仅有检索是不够的。系统完全可能把正确的商品排在前列，却因为问错了问题、或过早给出结论而失去用户。ARC 把每一轮都建模为单一状态下三种相互竞争的决策——**问（ask）**、**排序（rank）**、**给出结论（commit）**，三者相互打分，只有当提问的预期排序收益足以抵消这一轮的成本时，智能体才会开口发问。

在调用任何语言模型之前，系统会先匹配商品目录中的证据，大模型级联只保留给用户措辞与目录差异较大的情形。这样既让基准测试路径保持完全确定、零 token 消耗，又能应对真实场景中千变万化的改写表达。
