---
title: 用户态live patch实现
tags:
  - Libcare
  - Live Patch

---

### Kernel Live Patch

#### Build process
1. Build the unstripped vmlinux
2. Patch the source tree
3. Rebuild vmlinux and find "changed objects"
4. Recompile each changed objects with -ffunction-sections -fdata-sections
5. Unpatch the source tree
6. Recompile each changed objects with -ffunction-sections -fdata-sections, get the original version
7. For every changed object, use create-diff-object
	+ Analyze each/original object pair for patchability
	+ Add .kpatch.funcs/.rela.kpatch.funcs + .kpatch.dynrelas/.rela.kpatch.dynrelas ---> new cumulative output object

#### Patching
-mfentry flag

#### Limitations
+ __init
+ static allocated data 
+ may not safe, users need to understand what they are doing.
+ vdso
+ without a fentry call
+ CAP_SYS_MODULE
+ TAINT flag
+ ftrace
+ act like normal function: oops stack/kdump(crash)/ftrace(tiny window)/kprobes(systemtap)/perf/tracepoints
+ combinediff --> patches are cumulative
+ KPATCH_FORCE_UNSAFE --> run simultaneously


### Userspace Live Patch

#### Prepare Patch

通过patch进行构建，找出发生变化或者被修改的ELF sections。

trace在function的开头放置了nop

#### Apply and then load patch

### Libcare源码分析

### Libcare的问题

1. 过程过于繁琐

问题是Patch生成过程，与构建工程是强相关的。

能否对比生成的二进制文件(debug版)，直接进行patch生成？？？？

2. 应用patch使用uproob

3. 程序被杀死后重新拉起的状态？？？
版本更新不太可能是因为一个patch，因此更有可能的场景是，程序重启后，仍然需要使用之前的patch，需要一个service记录这些信息。

### Reference

1. [Uprobes in 3.5](https://lwn.net/Articles/499190/)

2. [linux-kernel-live-patching](https://www.infosecurity-magazine.com/blogs/linux-kernel-live-patching/)

3. [kpatch](https://github.com/dynup/kpatch)
