
---
title: '[linux-5.10]linux源码组织及编译方式 - 第0篇'
date: 2021-09-23 10:26:28
tags:
    - Read
    - Linux
---

如不特别说明，本文遵从以下约定：

1. 本文中的根目录指代内核源码目录。
2. 本文中的linux均指5.10版本内核。
3. 本文分析使用的内核镜像为risv架构。


## 源码组织

通过**tree -L 1**可以得到如下的目录结构：
```
├── arch
├── block
├── certs
├── COPYING
├── CREDITS
├── crypto
├── Documentation
├── drivers
├── fs
├── include
├── init
├── ipc
├── Kbuild
├── Kconfig
├── kernel
├── lib
├── LICENSES
├── MAINTAINERS
├── Makefile
├── mm
├── net
├── README
├── samples
├── scripts
├── security
├── sound
├── tools
├── usr
└── virt
```

### arch

arch目录下放置了体系结构相关的代码，每个子目录都与一个特定体系结构有关。以**riscv**目录为例，该目录包含了riscv相关的代码，./arch/riscv的目录结构如下：
```
├── boot
├── configs
├── include
├── Kbuild
├── Kconfig
├── Kconfig.debug
├── Kconfig.socs
├── kernel
├── lib
├── Makefile
├── mm
└── net
```
boot目录下放置了bios引导所需要用到的文件。其中，dts子目录下为描述硬件的dts文件。loader.S用于uboot之类的bootloader使用，区别于x86的镜像压缩处理，riscv对镜像不做任何处理。loader.lds.S为链接脚本，用于指明生成的二进制入口及内存布局。在同级目录的Makefile中，描述了Image/loader.bin的生成规则，可以看到loader.bin就是由loader.S和Image通过loader.lds.S链接生成的。

configs目录下放置了默认的config配置。

include目录下放置了体系结构相关的函数接口头文件，可以看到，该目录下有两个子目录，一个为asm，一个为uapi/asm。前者是用于内核空间的头文件，后者是用于用户空间的头文件，对这一改动的说明，见参考[^2]。include目录下的函数接口大都通过内联汇编实现，向上层提供统一的接口。在asm子目录下，还有一个vdso目录，对vdso机制的说明，将单开一篇。

kernel目录下放置了内核实现中与体系结构相关的部分，是arch目录下的主要组成部分。

lib目录下放置了汇编实现的公共工具函数，用汇编实现，是为了提升效率。

mm目录下放置了内存管理相关的实现。

net目录下放置了bpf相关的实现。


### block

块设备相关的通用代码，这部分实现将被块设备的驱动以及文件系统使用。

### certs

该目录下放置了module signing相关的实现。如果使能了该机制，则只有经过签名的module才能被load进内核中。更多信息，参考/Documentation/admin-guide/module-signing.rst。

### crypto

该目录下包含了常用的密码学算法实现。

### Documentation

内核官方的说明文档，可以认为是内核的使用说明书。遇到问题，优先查看该目录下是否有相关说明。

### drivers

驱动目录，这个目录下的代码大部分不由社区维护，代码质量参差不齐，后面会单开一篇讲内核的驱动框架。

### fs

文件系统的实现，每个子目录都是一种类型的文件系统。

### include

内核对外的头文件，其中uapi目录为用户态接口。

### init

该目录下放置了内核初始化相关代码，至内核挂载完根目录，拉起init进程为止。

### ipc

放置了进程间通信机制的实现代码。

### kernel

内核核心机制的代码目录，每个子目录都可以看做是一个机制，或者一个子系统。

### lib

内核实现中用到的公共工具函数。

### mm

内存管理实现的相关代码。

### net

网络协议栈的实现，每个子目录都是一个独立的协议族。

### samples

部分机制的用法示例。

### scripts

使用/编译/开发内核过程中需要用到的一些脚本。

### security

安全机制相关的实现，由于安全特性常常带来一些易用性/效率上的损失，因此大部分安全特性通常是可选的。


### sound

音频驱动相关的实现。

### tools

内核辅助工具的相关实现。

### usr

用于cpio文件的生成和解压，关于cpio机制，后面将单开一篇。

### virt

虚拟化相关实现。

## 构建系统



## 支持的编译命令

## patch提交过程

## 参考

1. [riscv - boot - loader](https://www.shangmayuan.com/a/073c9e1f1cf64ce5b5fe1712.html)
2. [The UAPI header file split](https://lwn.net/Articles/507794/)

