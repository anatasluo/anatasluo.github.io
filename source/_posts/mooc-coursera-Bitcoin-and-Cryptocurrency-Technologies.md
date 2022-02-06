---
title: '[coursera]Bitcoin and Cryptocurrency Technologies'
tags:
  - Mooc
  - Coursera
  - Computer Architecture
date: 2022-01-29 03:20:41

---

## Week 1 (Introduction)

Hash function:
+ takes any string as input
+ fixed-size output
+ efficiently

Security properties:
+ collision-free
+ hiding
+ puzzle-friendly

double-spending attack -> record history -> Blockchain -> Proof-of-Work

不可纂改的关键是对Hash生成了Hash，因此形成了链条。

## Week 2 (Decentralization)

Decentralization is not all-or-nothing
Example: Email is a decentralized protocol, but domainated by centralized webmail services.

Problems in Bitcoin:
1. Who maintains the ledger?
2. Who has authority over which transactions are valid
3. Who creates new bitcoins?
4. Who determines how the rules of the system change?
5. How do bitcoins acquire exchange value?

Distributed Consensus (Consensus protocol)

Why consensus is hard:
1. Nodes may crash
2. Nodes may be malicious
3. Network is imperfect

Interesting things about Consensus:
1. Byzantine generals problem
2. Fischer-Lynch-Paterson (deterministic nodes)
3. Paxos (protocols)

Double-spend probability decreases exponentially with # of confirmations.

Most common heuristic: 6 confirmations.

Recap:
1. Protection against invalid transactions is cryptographic, but enforced by consensus.
2. Protection against double-spending is purely by consensus.
3. You're never 100% sure a transaction is in consensus branch. Guarantee is probablistic.



## Reference

+ [Coursera Main Page](https://www.coursera.org/learn/cryptocurrency)
+ [Byzantine generals problem](https://river.com/learn/what-is-the-byzantine-generals-problem/)
+ [FLP problem](https://yeasy.gitbook.io/blockchain_guide/04_distributed_system/flp)