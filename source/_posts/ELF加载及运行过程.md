---
title: ELF加载及运行过程
date: 2022-11-04 12:37:10
tags:
  - Linux
  - ELF
---

ELF文件的类型主要由三种：
1. object file
2. shared library
3. exec file

不管哪一类，在运行前，基本都要经历以下过程


## 参考
1. [Linux Kernel Module加载卸除过程分析](https://anatasluo.github.io/548502e1d0dd/)
2. [making-our-own-executable-packer](https://fasterthanli.me/series/making-our-own-executable-packer/part-1)
3. [ELF format](https://stevens.netmeister.org/631/elf.html)
4. [How to execute an object file](https://blog.cloudflare.com/how-to-execute-an-object-file-part-1/)