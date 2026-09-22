---
id: arxiv2026-forestllm
title: "ForestLLM: Large Language Models Make Random Forest Great on Few-shot Tabular Learning"
authors: [Zhihan Yang, Jiaqi Wei, Xiang Cheng, Haoyu Dong, Yiwen Wang, Xiaoke Guo, Pengkun Zhang, Yiwei Xu, Aosong Feng, Chenyu You]
venue: arXiv 预印本
venueType: preprint
year: 2026
month: "1 月"
status: preprint
isFirstAuthor: true
keywords: [表格学习, 大语言模型, 随机森林, 小样本学习, 可解释性]
specialBadges: ["完成于微软"]
links:
  arxiv: "https://arxiv.org/abs/2601.11311"
  paper: "https://arxiv.org/pdf/2601.11311"
emoji: "🌟"
---

ForestLLM 将决策森林的结构化归纳偏置与大语言模型的语义推理能力统一起来。大模型**仅在训练阶段**被使用——扮演离线的模型设计者，把丰富的上下文知识编码进一个轻量、可解释的森林模型中，因此测试阶段完全不需要大模型推理。

方法包含两个部分：其一是**语义划分准则**，由大模型根据候选划分在有标注与无标注数据上的一致性进行打分，从而在小样本监督下诱导出更稳健、更具泛化性的树结构；其二是**面向叶节点稳定化的一次性上下文推理机制**，由大模型将决策路径及其支撑样本蒸馏为简洁、确定性的预测，以语义信息替代噪声较大的经验估计。在一系列小样本分类与回归基准上，ForestLLM 取得了当前最优的性能。
