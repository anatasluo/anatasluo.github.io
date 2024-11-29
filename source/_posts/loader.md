---
title: 'Dynamic Loader设计中需要关注的部分'
date: 2024-11-29 11:08:54
tags:
    - ELF
    - Compiler
    - Loader
    - Process

---

## load objects to form image

此处的image，指的是ELF文件在被加载到process memory之后，形成的memory layout。在ELF文件中，最基本的unit是section。section按照不同的权限级别，进行划分后，形成segment。

可以说，section是编译的直接产物，而segment用于指导kernel如何通过ELF生成image。

在process加载ELF的过程中，process的一部分信息会放入auxiliary vector。这部分实现可以参考[此处](https://elixir.bootlin.com/linux/v5.10.71/source/fs/binfmt_elf.c#L172)

参考[x86_64-abi-0.99](https://refspecs.linuxbase.org/elf/x86_64-abi-0.99.pdf)，其中比较有意思的几个参数是：

1. AT_EXECFD / AT_PHDR
如果kernel设置了AT_EXECFD，表明进程涉及的object文件需要dynamic loader通过fd去读取。

具体到linux内核中，仅有binfmt-misc支持设置AT_EXECFD。

2. AT_ENTRY

记录了process的程序执行入口地址。


## calcuate load_bias (ASLR)

dynamic loader在开始运行后，需要计算自身的load_bias，即计算segment header中的地址和实际加载地址之间的偏差。

对于一个binary/libary来说，segment之间的偏移是固定的，因此load_bias都是针对一整个binary/library来说的。

load_bias的计算，只需要任意选取内部的一个锚点，计算理论值和实际值的偏差即可。对于dynamic loader来说，直接计算program header table本身的偏差即可。

理论值：program header table本身的地址记录在type为PT_PHDR的segment中。

实际值：记录在auxiliary vector中，对应的type为AT_PHDR。

核心的代码实现参考如下:
```
const Elf64Phdr* phdr = (const Elf64Phdr*)sysv->auxv[AT_PHDR];
for (unsigned phdrnum = sysv->auxv[AT_PHNUM]; --phdrnum; ++phdr) {
    if (phdr->type == PT_PHDR) {
        prog.base = (uint8_t*)(sysv->auxv[AT_PHDR] - phdr->vaddr);
    } else if (phdr->type == PT_DYNAMIC) {
        dynoff = phdr->vaddr;
    }
}
```

## resolve relocations

relocation是为了解决未知引用的问题。所谓未知引用，即引用的地方和被引用的地方，彼此之间的偏移无法确定。无法确定最主要的原因在于，使用了外部符号，细分下来的类型很多。

relocation涉及三部分的信息：
1. 引用的地址
2. 被引用的符号
3. 计算被引用地址的过程

## prelink

prelink是为了解决relocation过多，引起的加载耗时问题。在ELF加载到process memory变成image的过程中。直到运行前，这部分逻辑是可以提前进行的。提前进行的代价就是，不同binary或者library之间的offset必须得确定下来，从而可以提前进行relocation过程。这在一定程度上牺牲了安全性，获取了运行性能。在主流的发行版中，当前已看不到prelink的使用，合理猜测，性能收益已经抵不上安全性的损失。

## Reference

1. [dynld](https://github.com/johannst/dynld)
2. [relocs](https://netwinder.osuosl.org/users/p/patb/public_html/elf_relocs.html)
3. [prelink](https://sourceware.org/gnu-gabi/prelink.txt)