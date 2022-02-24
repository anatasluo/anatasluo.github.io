---
title: criu代码注入原理解析
date: 2022-02-23 16:13:30
tags:
    - Criu
    - Compel
    - Code injection

---

criu中实现了一个代码注入工具 -> [compel](https://github.com/checkpoint-restore/criu/tree/criu-dev/compel)

这篇blog将对compel工具的实现原理，进行一个梳理。

### 代码注入

wiki对code injection的介绍如下：
```
Code injection is the exploitation of a computer bug that is caused by processing invalid data. The injection is used by an attacker to introduce (or "inject") code into a vulnerable computer program and change the course of execution.
```
简单的来说，代码注入，就是在某个进程上下文中执行一段代码。

### 实现要点

仅讨论广泛的实现，代码注入通常分为以下过程：
1. 编写注入代码，生成relocate file
2. 将该relocate file映射到进程上下文中
3. 对注入的代码进行relocation处理(这一步不是必须的，取决于注入代码的复杂程度)
4. 修改执行上下文的寄存器值，让进程跳转到区域执行

compel实现，在以上步骤的基础上，还加入了一个限制：**注入程序用于获取上下文信息，其执行不能影响原有上下文，注入代码执行结束后，原有上下文可以继续执行。**

下面，我将按个讨论以上步骤的具体实现。

#### 生成用于注入的relocate file

实际上，注入代码并不一定是relocate file。只要求是可执行的汇编代码即可。这里我用relocate file来讨论，是因为注入代码可能很复杂，这种情况下，全部手写汇编是不现实的，因此势必要让编译器来生成最终的注入代码。这种情况下，不可避免的就会出现重定向过程。

由于我们是在运行时，加载该注入代码，因此重定向过程，需要我们自行编写代码完成。

**为了简化实现**，该relocate file生成过程存在以下的限制：
1. 不能链接任何外部库，包括libc
2. 内存模型需要高度定制 --> 需要自己编写链接脚本

##### compel的编译过程和linker script

相关的编译参数包括：
+ ffreestanding -> 告诉编译器，该程序不使用任何标准库
+ fno-stack-protector --> 不需要在栈中插入额外空间，方便我们简化设计
+ nostdlib --> 不链接标准库
+ fpie --> 生成位置无关的二进制代码
+ -r -z noexecstack --> linker参数

链接脚本源码在[这里](https://github.com/checkpoint-restore/criu/blob/criu-dev/compel/arch/x86/scripts/compel-pack.lds.S)

.compel.exit和.compel.init两个section是为了实现插件的初始化，不多赘述。

##### compel的syscall封装过程
源码涉及以下两个文件：
+ [linkage.h](https://github.com/checkpoint-restore/criu/blob/criu-dev/include/common/arch/x86/asm/linkage.h)
+ [syscall-common-x86-64.S](https://github.com/checkpoint-restore/criu/blob/criu-dev/compel/arch/x86/plugins/std/syscalls/syscall-common-x86-64.S)

这里有意思的细节很多：
1. 为了对齐加入0x90，0x90在X86下是NOP指令，见参考1
2. "movq %rcx, %r10"是因为用户态函数调用的ABI和syscall的ABI存在一个细微差异，见参考2

#### 将该relocate file映射到进程上下文中
这一步通过ptrace实现，ptrace可以实现在进程上下文进程syscall，具体原理此处不赘述。

#### 对注入的代码进行relocation处理

源码实现在[这里](https://github.com/checkpoint-restore/criu/blob/criu-dev/compel/src/lib/handle-elf.c)

这一步compel分成两部分进行
1. 将第一步生成的relocate file进行预处理，生成一个头文件
2. 头文件里记录了简化后的relocation information

第一步预处理，生成头文件，我个人猜测是为了执行速度和简化内存处理。这一步会为所有的section都分配内存，包含NOBITS的BSS，塞到一个unsigned char数组中。其他符号和重定向信息会生成特定的数据结构。
第二步，根据描述信息，对blob进行重定向处理。

最终执行时，还需要分配栈空间，信号处理函数的栈空间等等，其内存模型参考[这里](https://criu.org/Parasite_code)

这里内存分配中，在多线程环境下，有两个栈，一个用于主线程，一个是其他线程。其他线程共用一个栈，即其他线程之间不存在并发。

#### 修改执行上下文的寄存器值，让进程跳转到区域执行
通过ptrace实现

### 参考
1. [Why 0x90](https://stackoverflow.com/questions/18413107/align-directive-proper-usage-with-align5-and-0x90)
2. [ABI for syscall](https://stackoverflow.com/questions/2535989/what-are-the-calling-conventions-for-unix-linux-system-calls-and-user-space-f)
