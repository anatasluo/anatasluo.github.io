---
title: 嵌入式设备中的Linux引导方式
date: 2019-11-03 00:28:28
tags:
    - Linux
    - Uboot
    - Bootloader
    - Bios
    - Arm
---

## 概述

主要是总结Linux的引导过程，包括:

+ 从开机到控制权交接给内核
+ 内核初始化过程
+ 用户空间初始化过程

本文参考的Linux代码版本是2.6.x，是比较老的版本，如果与最新的代码特性有出入，以最新的为主。
<br/>

## 嵌入式设备的关键属性

嵌入式设备和非嵌入式设备并没有明确的界限，嵌入式设备通常具有以下属性：

+ 包含一个处理引擎，比如通用微处理器
+ 一般是针对某种具体的应用或目的设计的
+ 用户界面通常不是考量的关键因素，甚至会为了安全性而牺牲一部分可用性
+ 资源通常受限，比如没有硬盘，供电受限等等
+ 应用程序通常是内置的，出厂时，软硬件均已经集成完善。

<br/>

## 从开机到控制权交接给内核

对于这一过程的概述，嵌入式设备和一般的桌面PC设备稍有差别，也可以说是ARM世界和x86世界的差别。

在一般的桌面PC系统中，通电之后，Bios立刻接管了设备，在完成硬件自检等工作后，跳转，将控制权交给Bootloader，如果硬盘里不只安装了一个系统，在Bootloader这一步可以决定启动哪一个操作系统。在这个语境中，Bios被称为“first-stage boot loader”，bootloader被称为“second-stage boot loader”。主流的Bootloader包括bootmgr, grub等等。

在嵌入式设备中，通常不会有多个系统的情况，因此，不需要将整个引导过程拆成两步进行。所以，嵌入式设备中，很少使用bios的概念，而是直接将两个步骤统称为 bootloader，本文以下内容涉及到的bootloader，除非特别说明，都是指嵌入式开发中的概念。

在嵌入式设备中，bootloader的关键职能，包括：

+ 初始化关键的硬件，比如SDRAM控制器，I/O控制器和图形控制器
+ 为外设控制器分配必要的系统资源，比如内存和中断电路
+ 提供一个定位和加载操作系统镜像的机制
+ 加载操作系统，并将控制权移交给它，同时传递必要的启动信息。内容可能包括内存总容量、时钟频率、串行端口频率（波特率）等等

嵌入式开发过程中，使用最为广泛的bootloader便是U-Boot。本文不会过多的涉及U-Boot的内容，以避免行文过于臃肿，U-Boot的用法可以参考[补充内容](#supplement)。

<br/>

## 内核空间初始化过程

如果bootloader引导顺利的话，控制权接着就转交给了linux内核。

Linux内核的引导过程比较复杂，本文从**源码**角度简单介绍下其中比较重要的几个环节。

<br/>

### 内核入口 head.S

head.S位于../arch/<ARCH>/kernel/head.S，从目录也可以看出，该文件是用来处理架构相关的初始化工作，主要有以下的作用：

1. 检查处理器和架构的有效性
2. 创建初始的页表（page table)表项
3. 启用处理器的内存管理单元（MMU）
4. 进行错误检测并报告
5. 跳转到内核主体的起始位置，即main.c中的函数start_kernel()

<br/>

### 内核开始 main.c

该文件位于../init/main.c中，如前文所述，head.S在执行结束后，将开始执行main.c中的start_kernel()。main.c完成大部分内核启动工作，从初始化第一个内核线程开始，直至挂在根文件系统并执行最初的用户空间Linux应用程序。

主要工作及过程如下：

1. 架构设置

    通过调用setup_arch(),完成对某种架构通用的初始化工作，该参数接受一个指向内核命令行的指针 --> setup_arch(&command_line)

2. 内核命令行的处理

    内核命令行是引导程序启动时，向内核传递的参数，相比与编译时指定的参数，cmdline要灵活得多。一个典型的cmdline通常如下:

    > console=ttys0,115200 root=/dev/nfs

    cmdline拥有的参数可以多达上百个，内核中使用__setup宏将cmdline与相关的模块关联起来。其一般用法如下所示：

    > __setup("console=", console_setup);

    含义为，当cmdline中遇到console=字符串时，就调用__setup宏的第二个参数指定的函数。详细的过程涉及到ELF文件的生成和链接器的使用，不在本文的讨论范围。内核会遍历cmdline中的参数，并调用相应的处理函数。

3. 子系统的初始化

    子系统的初始化有两种方式，一种是显式初始化，比如调用init_timers()函数，console_init()函数，另外一种是借助类似__setup宏这种技巧实现的初始化，承担这种宏有一个系列*__initcall，具体过程本文不涉及。

4. init线程

    执行到这里，内核生成了第一个内核线程 -- init线程。init线程是Linux所有用户空间进程的父进程。需要说明的是，对于linux来说，并没有严格区分线程和进程，他们由同一种结构表示，区别在于资源的调度。

5. 最后的引导步骤

    在完成初始化工作之后，内核开始执行最后的引导步骤，包括：

    + 释放初始化函数和数据占用的内存
    + 打开系统控制台设备
    + 启动第一个用户空间进程
    + ....

    ```
    if (execute_command) {
        run_init_process(execute_command);
        printk(KERN_WARNING "Failed to execute %s. Attempting"
                "defaults...\n", execute_command);
    }

    run_init_process("/sbin/init");
    run_init_process("/etc/init");
    run_init_process("/bin/init");
    run_init_process("/bin/sh");

    panic("No init found, Try passing init= option to kernel");
    ```
    上述代码来自main.c中的init_post函数最后一段，如果该函数执行到最后，将会产生一个"No init found"的错误，这也是嵌入式开始过程中见到比较多的一个错误。run_init_process执行成功后，并不会返回，而是通过execve()系统调用生成一个新进程覆盖旧进程，因此，init过程是第一个执行成功的run_init_process函数。

<br/>

## 用户空间初始化

根文件系统，简单的说，就是内核挂载最早的文件系统。如上文所说，内核引导的最后，会试图通过run_init_process执行类似/sbin/init的二进制程序。根文件系统，在进行到最后的引导步骤前，就已经初始化并挂在完成。

根文件的生成，挂在过程，会在另外一篇blog中详细介绍。在run_init_process执行成功后，第一个用户态程序便开始执行了。
<br/>

## <span id="supplement">补充</span>

<br/>

### 1. dtb,dts,dtc介绍及常用用法


dts,即device tree source。是arm嵌入式中，用于描述硬件的方式。dts通过dtc工具，生成供内核使用的dtb文件。

<br/>

### 2. U-Boot的一般用法

+ 加载内容镜像到固定内存地址
```
tftp 600000 uImage
```

+ 加载dtb到固定内存位置
```
tftp c00000 dtb
```

+ 根据之前的dtb开始引导系统
```
bootm 600000 - c00000
```
-----------------------
+ 从磁盘引导
```
diskboot Ox400000 0:0
```
此处中的0：0指第一个IDE设备的第一个分区

+ 从内存的某个位置开始引导
```
bootm Ox400000
```

---------------------------
<br/>

## 需要区分的概念

+ BIOS-MBR 与 GPT-UEFI
+ GRUB, GRUB2
+ ROM 与 EEPROM
+ U-boot
+ dtb, dtc, dts

<br/>

## 参考

+ 《嵌入式LINUX基础教程（第2版）》 第1章至第7章
+ [The BIOS/MBR Boot Process](https://neosmart.net/wiki/mbr-boot-process/)
+ [booting](https://en.wikipedia.org/wiki/Booting)