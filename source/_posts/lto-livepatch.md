---
title: 深入了解GCC的LTO机制
date: 2025-06-24 01:03:29
tags:
    - GCC
    - LTO
    - Livepatch

---

## 经典的编译链接模型

![](./images/compiler-no-lto.png "经典的编译链接过程(见参考2)")

经典的编译模型，有以下的几个特点：
1. 每一个源码文件通过汇编器(cc1)生成一个object文件
2. 所有的object文件经过linker生成binary

这个模型有两个比较明显的缺点：
1. 主要的优化都在生成objects这个阶段完成，无法进行全局的优化
2. 在处理大规模的编译时，linker这一步耗时较长

## LTO是什么

通常来说，优化时掌握的信息越多，最终的效果就越好。由小及大，编译的优化思路大致可以分为语句级优化，函数级优化，程序级优化等等。

在上面讨论经典的编译链接模型时，object内部的优化只需要修改汇编器(cc1)的实现即可。比较有难度的是进行objects之间的优化，比如去inline一个在其他源码文件中定义的全局函数。

在computer programming中讨论这种跨越objects的优化时，常用的概念叫Interprocedural optimization(IPO)。

与IPO相接近的一个概念，叫Whole Program Optimization(WPO)。

从上面的经典模型可以知道，有能力看到全部objects信息的，是linker。因此，具体到GCC的实现时，这种优化思路最主要的体现就是Link Time Optimization(LTO)。

## LTO的发展历史

以下对LTO的发展历史整理，所用的资料都来自Honza Hubička的个人博客(见参考3)。

### open64(2002)和LLVM(2003)

在2003年的GCC Summit上，Chris Lattner提出希望用LLVM取代当时正在开发中的Tree SSA，作为GCC的新middle-end，从而使GCC能够支持LTO。

鲜为人知的一个事情，2002年的时候，open64已经开源，并且作为一个能够支持全部LTO机制的GCC可选后端。

### GCC3.4 引入--combine参数(2004)

2004年的时候，GCC3.4发布了。该版本开始，GCC通过实现LTO，开始支持了inter-module optimization(IMP)。

一般来说，LTO的实现通过把中间语言(intermediate language, IL)加入了objects文件中实现(本质是集中相关的程序逻辑后一起处理)。

当时的自由基金会担心这种IL的加入会让在不违反GPL2协议的情况下实现hook GCC成为可能。

Apple的工程师Geoff Keating是最早在GCC中引入IMP的人，这种机制允许GCC的front-end同时处理多个源码文件，并将处理好的多个源码文件作为一个整体传递给back-end。这种机制算是早期的WPO实现。

### GCC4.0 接受了新的IL - Tree SSA(2005)

### LTO在GCC中的早期实现(2005)

2005年的时候，来自Google、IBM和Codesoucery的工程师们在GCC的email list中发布了一个正式的proposal - "[Link-Time Optimization in GCC: Requirements and High-Level design](http://gcc.gnu.org/projects/lto/lto.pdf)"。这份文件列出了如果要支持LTO实现，现有的GCC需要做的一系列改变。

### WHOPR: Whole program optization(2007)

由于LTO的实现需要庞大的工作量，在此期间，Google的工程师考虑一个另外的问题 - 如何使LTO支持大规模程序的编译。于是，一个新的proposal被提出 - "[WHOPR - Fast and Scalable Whole Program Optimizations in GCC](https://gcc.gnu.org/projects/lto/whopr.pdf)"

按照proposal中的提议，加入WHOPR之后，程序的编译链接模型变成了如下的形式：
![](./images/gcc-whopr.png)

整个优化过程主要分为三个步骤：
1. Local generation(LGEN)
这一步每个源码文件被单独编译成IL、local call-graph以及summary information。

2. Whole program analysis(WPA)
这一阶段会汇总上一步产生的信息，并进行必要的优化决策，产生global call-graph。最终的global call-graph可能会被划分成几块关系密切的部分，分别单独进行处理。

3. Local transformations(LTRANS)
这一步会单独处理上一步产生的几块关系密切的global call-graph子块，应用上一步做出的优化策略，产生最终的object文件。

### LIPO(Profile Feedback Based Lightweight IPO)

相比于编译时做优化的思路，LIPO利用运行时的结果去指导优化策略的选择。

### GCC4.5正式发布了LTO机制(2010)

在GCC4.5支持LTO之后，GCC4.6加入了对WHOPR的支持，同时移除了-fwhopr选项。该选项将作为-flto的默认子选项，用户仍让可以通过设置-flto-partition=none来关闭fwhopr选项。

### GCC4.7+的版本开始支持kernel使用LTO机制(2012)

### GCC4.9(2014)

GCC4.9对LTO机制做出了一系列的改进，用户感知最明显的是，LTO开启后，默认产生的是slim LTO文件，而不是fat LTO文件。所谓的fat LTO文件，是指同时产生原有的object源码以及LTO需要的IL文件。fat LTO文件的优点在于兼容性，对于那些不支持LTO的工具，依然可以继续按照object文件的原有流程去处理。缺点就是，fat LTO文件会带来双倍的编译耗时。随着工具链的发展完善，这种兼容性的设计就可以移除掉了。

### GCC5(2015)

GCC5.0支持了Feedback Directed optimization(FDO)

按照[GCC wiki](https://gcc.gnu.org/wiki/LightweightIpo)的说法，GCC的实现叫做LIPO，LIPO综合了IPO和FDO的优点，换句话说，利用FDO来改进IPO导致的编译时间长和耗费磁盘空间的问题。通过FDO，必要的优化分析可以从link time转移到run time进行。

完整的过程描述如图所示：

![](./images/gcc-lipo.png)

图片里的例子，build由4个source组成，经过run time的build analysis，source1需要cross module inline source2里的某些函数，source1在profile-use build时会把source2作为auxiliary一起编译。

### [GCC8](https://hubicka.blogspot.com/2018/06/gcc-8-link-time-and-interprocedural.html)(2018)

从GCC8.1开始，linux发行版开始在构建中开启LTO机制。

LTO机制长期存在的一个问题，就是编译输出和debug信息(主要是dwarf info)无法准确对应上。这一问题最终通过专门的项目[early-debug](https://gcc.gnu.org/wiki/early-debug)解决。

完整的过程如图所示:
![](./images/gcc-early-debug.png)

在Link阶段，会对early debug阶段产生的debug信息进行选择，只选择必要的部分。

### [GCC9](https://hubicka.blogspot.com/2019/05/gcc-9-link-time-and-inter-procedural.html)(2019)

使用GCC9之后，针对测试使用的发行版版本，安装包的总量大小减少了5%，debug包减少了17%。

GCC9支持设置LTO使用时的并行度(flto=n)，这个并行度会影响WPA阶段之后，划分成的子objects的数量。

可以认为，从GCC9开始，LTO机制逐渐稳定。

## LTO相关的参数及编译产生的sections(GCC12)

### LTO编译相关的参数

1. 开启LTO编译 - -flto

2. 设置partion agrithom - -flto-partition=alg

3. 开启LTO的增量编译 (supported from GCC 15)
+ -flto-incremental=path
+ -flto-incremental-cache-size=n

4. LTO objects生成时的压缩参数 - -flto-compression-level=n

5. 控制是否产生fat objects - -ffat-lto-objects

所谓的fat object，是指产生的object中既包含了正常object code，还有LTO所需的IR。fat object的优点主要是兼容性，对于不支持LTO的工具链依然可以使用，在link阶段依然可以进行normal链接。缺点是编译耗时严重，产生的object过大。

LTO发展早期，GCC使能LTO机制之后，默认产生的为fat object。后期随着GNU工作链发展成熟，默认产生的object为slim object，即object只包含LTO需要的IR。

6. LTO的编译模式

+ LTO mode
整个程序作为一个源码文件进行优化，优点是进行最大程度的优化，缺点是编译并行度差。

+ WHOPR/partition mode (-flto=jobserver)
这种模式下，整个程序会被划分为几个object，这些object分别进行相应的优化。在这个模式下，整个编译分为三个阶段：
a. Local generation(LGEN)
b. Whole Program Analysis(WPA)
c. Local transformations(LTRANS)

7. [lto1的参数](https://gcc.gnu.org/onlinedocs/gccint/Internal-flags.html)
+ -fwpa
+ -fltrans
+ -fltrans-output-list=file
+ -fresolution=file

5. dwarf相关的 - -fdump-earlydebug
LTO objects的dwarf信息不够准确，earlydebug项目致力于解决该问题。这个选项可以dump出中间过程使用的earlydebug信息。

### [LTO开启后，objects包含的相关section](https://gcc.gnu.org/onlinedocs/gccint/LTO-object-file-layout.html)

1. .gnu.lto_.opts(Command line options)

2. .gnu.lto_.symtab(Symbol table)

3. .gnu.lto_.decls(Global declarations and types)

4. .gnu.lto_.cgraph(The callgraph)

5. .gnu.lto_.refs(IPA references)

6. .gnu.lto_.function_body.<name>(Function bodies)

7. .gnu.lto_.vars(Static variable initializers)

8. .gnu.lto_.<jmpfuncs/pureconst/reference>(Summaries and optimization summaries used by IPA passes)

## LTO开启后的编译过程

在不开启的LTO的情况下，C语言编译涉及到的组件有cc1，collect2，其中cc1生成objects文件，再通过collect2的调用，生成最终的binary。

在加入LTO之后，C语言编译的组件有cc1，collect2，lto1和lto-wrapper，其中lto1和lto-wrapper是针对LTO机制所增加的组件，以编译器插件的形式引入。

以[redis](https://github.com/redis/redis)源码为例，开启LTO后，通过execsnoop观察进程的执行过程，可以得到以下的进程树(有省略):

![](./images/gcc-compile-lto.png)


可以看到，在原有的linker基础上，通过插件的方式引入lto-wrapper，对应上面的讨论，lto-wrapper分为两个过程：
1. WPA阶段：这阶段会读取全部的object信息，并且按照LTO的partion设置，重新划分成*一定数量*的新object
2. ltrans阶段：将划分后的新object以一定的*并发设置*重新进行编译

下面，我们以[simple-ftp](https://github.com/sunaku/simple-ftp)的源码为例，来具体分析LTO的编译过程，以及中间文件的生成情况。

通过以下命令，编译server二进制:
```
gcc -v --save-temps -g -flto -ffat-lto-objects  -fdata-sections -ffunction-sections -fdump-earlydebug server.c service.c siftp.c -o server
```

观察日志输出，可以得到以下编译输出(截取链接相关的部分)：
```

```

### WPA的执行过程，以及生成的中间文件

### ltrans的执行过程，以及生成的中间文件

## 以GCC15为例，分析LTO的源码实现

1. collect2如何调用lto-wrapper

2. LTO的partion过程

3. 经过ltrans生成的object如何对应dwarf信息 - early debug

## 发行版使用的LTO参数

fedora使用的编译参数通过rpm包redhat-rpm-config引入，解开这个包，可以发现以下LTO相关的编译参数：
```
%_gcc_lto_cflags        -flto=auto -ffat-lto-objects
%_clang_lto_cflags      -flto=thin -ffat-lto-objects
%_lto_cflags            %{expand:%%{_%{toolchain}_lto_cflags}}
```

其他发行版的使用情况可以参考以下wiki:
+ [gentoo](https://wiki.gentoo.org/wiki/LTO)

## 参考链接

1. [Interprocedural_optimization](https://en.wikipedia.org/wiki/Interprocedural_optimization)
2. [CS232](https://courses.grainger.illinois.edu/cs232/sp2009/lectures/Examples/lecture6/lecture6.html)
3. [Honza Hubička's Blog](https://hubicka.blogspot.com/2014/04/linktime-optimization-in-gcc-1-brief.html)




