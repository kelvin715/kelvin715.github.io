---
id: arxiv2026-forestllm
title: "ForestLLM: Large Language Models Make Random Forest Great on Few-shot Tabular Learning"
authors: [Zhihan Yang, Jiaqi Wei, Xiang Cheng, Haoyu Dong, Yiwen Wang, Xiaoke Guo, Pengkun Zhang, Yiwei Xu, Aosong Feng, Chenyu You]
venue: arXiv preprint
venueType: preprint
year: 2026
month: "January"
status: preprint
isFirstAuthor: true
keywords: [Tabular Learning, Large Language Models, Random Forest, Few-shot Learning, Interpretability]
specialBadges: ["Work done at Microsoft"]
links:
  arxiv: "https://arxiv.org/abs/2601.11311"
  paper: "https://arxiv.org/pdf/2601.11311"
emoji: "🌟"
---

ForestLLM unifies the structural inductive biases of decision forests with the semantic reasoning capabilities of large language models. The LLM is used **only during training**, acting as an offline model designer that encodes rich contextual knowledge into a lightweight, interpretable forest — so no LLM inference is needed at test time.

The method has two components: (1) a **semantic splitting criterion**, in which the LLM scores candidate partitions by their coherence over both labeled and unlabeled data, inducing more robust and generalizable tree structures under few-shot supervision; and (2) a **one-time in-context inference mechanism for leaf-node stabilization**, where the LLM distills a decision path and its supporting examples into a concise, deterministic prediction, replacing noisy empirical estimates with semantically informed outputs. Across a diverse suite of few-shot classification and regression benchmarks, ForestLLM achieves state-of-the-art performance.
