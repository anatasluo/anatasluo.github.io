---
title: BPF usage in malicious software
date: 2023-03-09 14:54:41
tags:
    - Ebpf
    - Security
    - Note

---

[An analysis of offensive capabilities of eBPF and implementation of a rootkit](https://raw.githubusercontent.com/h3xduck/TripleCross/master/docs/ebpf_offensive_rootkit_tfg.pdf)的阅读笔记。

这篇paper主要讲述了如何利用eBPF模块进行系统入侵，记录了一些阅读过程中，我比较感兴趣的部分。

## eBPF当前具备的能力

通过bpf_probe_read_user/bpf_probe_write_user可以实现对用户态内存的修改，但是这种修改与一般的内存读写相比，限制在于，这种修改过程中，是不能发生page fault的，猜测与eBPF执行的上下文限制有关。

在固定的hook点使用eBPF进行内存读写时，可以根据abi等规范，对栈或者内存进行解析。

在注入代码的末尾，可以再次进行注入，这一设计可以用来清理现场。

用户态调用syscall的过程: source code -> GOT (lazy binding) -> glibc library -> syscall instruction
对于同一个syscall，可能存在多个glibc入口，因此LD_PRELOAD对于syscall的劫持效果要差于ptrace和eBPF

eBPF借助ringbuf可以在内核态和用户态之间进行通信

eBPF可以修改hook点的返回值，对sudo这类程序的行为研究，可以做到提权的效果。

## 主流的编译器安全特性

+ Stack canaries -> 注入代码执行前后，对上下文进行恢复
+ DEP/NX(W/X两种权限不会同时出现) -> 寻找executable memory，通过/proc/xxx/mem跳过write检查，找到可以使用的code caves <- 由于page bound的对齐，代码可执行区域存在很多被zero填充的空洞
+ ASLR/PIE -> 计算出load_bias，将bias load到symbol table上，就可以使用了
+ RELRO

## 一些注入思路

在一个地址空间里，拉起一个新的线程，该线程的执行还必须做到不影响原来线程的执行状态。

不同的shell注入思路:
1. A reverse shell 
 + victim connect to the attacker TCP
 + use TCP fd for stdin/stdout/stderr
2. Plaintext pseudo-shell
 + attacker is the master
 + 在TCP payload的基础上在进行新的协议封装
3. Encrypted pseudo-shell (2 + TLS)
4. Phantom shell (利用了TCP的超时重发)

shell code in APPENDIX C: 保存上下文后执行注入代码
