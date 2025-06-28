---
title: '[note]Practical Binary Analysis(二进制分析实战)'
date: 2025-06-28 16:55:15
tags:
    - Binary
---

## 文档信息

书名: Practical Binary Analysis(二进制分析实战)
作者: Dennis Andriesse
年份: 2018
索引: TP301.6 3426

## Chapter 1 - 二进制简介

剥离二进制文件命令:

```
strip --strip-all a.out
```

使用objdump反汇编二进制文件命令:

```
objdump -M intel -d a.out
```

## Chapter 2 - ELF格式

### GOT表格存在的必要性

已经存在PLT机制的情况下，还要设计GOT机制的原因：
1. 权限分离，代码段出于安全原因，不允许运行时修改，将修改的内容分离出来，放到GOT表中。
2. 对于现在的操作系统设计，共享库的代码是共享的，因此PLT表格不应该修改，每个进程维护自己的GOT副本即可。

.got和.got.plt节的区别:
> .got用于引用数据表项，而.got.plt用于存储通过PLT访问的(已解析的)库函数地址。

### 特殊section的作用

.dynamic节: 充当操作系统和动态链接器的"路线图"


## Chapter3 - PE格式简介

PE是通用对象文件格式(Common Object File Format, COFF)的修改版本，因此PE有时候也被称为PE/COFF。

PE格式为了保证对MS-DOS格式的兼容，每个PE文件以MS-DOS头开始，当PE格式的文件在MS-DOS操作系统上执行时，这个存根就会被执行，理论上来说，这个存根可以是程序的完整MS-DOS版本。

在反汇编PE二进制文件时，可能会发现很多int3指令，这些指令来自Visual Studio的填充动作。

## Chapter 4 - 使用libbfd创建二进制加载器

[libbfd](https://ftp.gnu.org/pub/old-gnu/Manuals/bfd-2.9.1/html_chapter/bfd_1.html)

## Chapter 5 - Linux二进制分析

使用xdd查看文件内容的命令:

```
xdd a.out | head -n 15
```

使用nm对C++ namespace符号进行demangle:

```
nm -D --demangle xxx.so
```

strace可以追踪二进制执行时的系统调用。
ltrace可以追踪二进制执行时的库文件调用。

## Chapter 6 - 反汇编与二进制分析基础

二进制分析可以分为静态分析、动态分析或者两者的组合。

静态汇编的两种方法：线性汇编和递归反汇编。

.eh_frame section可以用于函数检测。

二进制分析的不同特性:
+ 程序间和程序内分析
这二者的区别在于分析的基本单位不同。
+ flow-sensitive(流敏感性)
是否需要考虑指令的顺序
+ context-sensitivity (上下文敏感性)
是否需要考虑函数调用的顺序

数据流分析:
+ reaching definition analysis(到达定义分析)
+ Use-Def链
+ 程序切片

## Chapter 7 - 简单的ELF代码注入技术

通过elfinject可以对现有的二进制进行节注入，这部分的原理比较简单，在section修改的基础上，同步对header部分的更新。

## Chapter 8 - 自定义反汇编

[Capstone](https://www.capstone-engine.org/)是一个流行的反汇编框架。

glibc-2.22中一种利用重叠指令来实现功能的实例(手写汇编):

```
7b05a: cmp   DWORD PTR fs:0x18,0x0
7b063: je    7b066
7b065: lock cmpxchg QWORD PTR [rip+0x3230fa], rcx
```
通过条件跳转来决定是否跳过lock前缀字节。

自定义反汇编的原因:
1. 解决二进制混淆
2. 扫描ROP指令

objdump可以从指定地址开始进行反汇编:

```
objdump -M intel --start-address=0x400612 -d a.out
```

ROP程序的生成过程:
1. 扫描二进制，寻找可以用的ROP gadget。
2. 在堆栈利用扫描的ROP gadget地址进行构造。

## Chapter 9 - 二进制插桩

二进制插桩可以分为:
1. Static Binary Instrumentation(SBI 静态二进制插桩)
2. Dynamic Binary Instrumentation(DBI 动态二进制插桩)

### 静态二进制插桩方法
+ int3方法
通过int3，通过中断处理函数，触发插桩逻辑的处理。在实践中，int3虽然只有一个字节，但是也会破坏一条指令，因此需要对原有的指令进行记录，在执行插桩逻辑前，需要对该指令进行执行，必要时，需要进行分析和模拟。

+ trampoline(跳板)方法
该方法的执行过程:
1. 复制原有代码的副本
2. 处理副本中的引用部分

### 动态二进制插桩方法

流行的DBI工具:
+ Pin
+ DynamoRIO

可执行文件加壳器：参考vmlinux执行时的压缩和解压动作。
DBI可以被用来脱壳。

## Chapter 10 - 动态污点分析的原理(Dynamic Taint Analysis, DTA)

DTA的分析过程:
1. 定义污染源(taint source)
2. 定义污点槽(taint sink)
3. 追踪污点传播 - 可以借助libdft实现

## Chapter 12 - 符号执行原理

符号执行时一种使用逻辑公式表示程序状态、自动解决有关程序行为等复杂问题的软件分析技术。

流行的二进制符号执行引擎:
+ Triton
+ angr
+ S2E

## 二进制分析工具清单

反汇编工具:
+ IDA pro
+ Hopper
+ ODA
+ Binary Nija
+ Relyze
+ Medusa
+ radare
+ objdump

调试器:
+ GDB
+ OllyDbg
+ Windbg
+ Bochs

反汇编框架:
+ Capstone
+ distorm3
+ udis86

二进制分析框架:
+ angr
+ Pin
+ Dyninst
+ Unicorn
+ libdft
+ Triton
