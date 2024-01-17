---
title: Linux下符号表生成过程分析
tags:
  - Linux
  - Symbol Table
---

## Linux Kernel Module 下如何使用符号表

看一段简单的kernel module代码
```
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("luolongjun");
MODULE_DESCRIPTION("A simple example Linux module.");
MODULE_VERSION("0.01");

int g_ko_ref;

static int __init ko_init(void) {
    g_ko_ref ++;
    return 0;
}

static void __exit ko_exit(void) {
    g_ko_ref --;
}

module_init(ko_init);
module_exit(ko_exit);

```

生成的ko文件汇编为:

```

main.ko:     file format elf64-x86-64


Disassembly of section .init.text:

0000000000000000 <init_module>:
MODULE_VERSION("0.01");

int g_ko_ref = 0x22;

static int __init ko_init(void) {
    g_ko_ref ++;
   0:	8b 05 00 00 00 00    	mov    0x0(%rip),%eax        # 6 <init_module+0x6>
   6:	83 c0 01             	add    $0x1,%eax
   9:	89 05 00 00 00 00    	mov    %eax,0x0(%rip)        # f <init_module+0xf>
    return 0;
   f:	b8 00 00 00 00       	mov    $0x0,%eax
}
  14:	c3                   	retq   

Disassembly of section .exit.text:

0000000000000000 <cleanup_module>:

static void __exit ko_exit(void) {
    g_ko_ref --;
   0:	8b 05 00 00 00 00    	mov    0x0(%rip),%eax        # 6 <cleanup_module+0x6>
   6:	83 e8 01             	sub    $0x1,%eax
   9:	89 05 00 00 00 00    	mov    %eax,0x0(%rip)        # f <cleanup_module+0xf>
}
   f:	90                   	nop
  10:	c3                   	retq      
```

其中，涉及到全局变量g_ko_ref的引用，都通过0x0(%rip)。这是因为obj文件没有经过链接，此时不能通过rip确定变量的地址，此处的0x0(%rip)相当于是重定位，在后续的链接过程会进行替换。

通过以下命令查看obj文件的重定向段信息:
```
readelf -r main.ko
```

获得以下的重定向信息:

```
Relocation section '.rela.init.text' at offset 0x177f8 contains 2 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000000002  002600000002 R_X86_64_PC32     0000000000000000 g_ko_ref - 4
00000000000b  002600000002 R_X86_64_PC32     0000000000000000 g_ko_ref - 4

Relocation section '.rela.exit.text' at offset 0x17828 contains 2 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000000002  002600000002 R_X86_64_PC32     0000000000000000 g_ko_ref - 4
00000000000b  002600000002 R_X86_64_PC32     0000000000000000 g_ko_ref - 4

```
以ko_init中的0x0(%rip)为例，ko_init中有两处引用了g_ko_ref，分别位于地址0x2和0xb。以地址为0x2的符号为例，符号的类型为R_X86_64_PC32，则新的offset计算方法为g_ko_ref - 4 - 重定位位置的offset值(记为A + 2)，即g_ko_ref - (A + 6)，而(A + 6)就是rip的地址。因此通过rip，经过重定向，就可以找到g_ko_ref的地址。

kernel module 的重定向，要等到kernel module加载的过程才会完成。

## 一般的二进制如何使用符号

看一段简单的C代码:
```
#include <stdio.h>
#include <stdlib.h>

int g_ref = 1;

int main()
{
    g_ref ++;
    return 0;
}
```

对经过链接的二进制进行反汇编，获得以下汇编:

```
0000000000201010 <g_ref>:
int g_ref = 1;
  201010:	01 00                	add    %eax,(%rax)
```
```
 5fa:	55                   	push   %rbp
 5fb:	48 89 e5             	mov    %rsp,%rbp
    g_ref ++;
 5fe:	8b 05 0c 0a 20 00    	mov    0x200a0c(%rip),%eax        # 201010 <g_ref>
 604:	83 c0 01             	add    $0x1,%eax
 607:	89 05 03 0a 20 00    	mov    %eax,0x200a03(%rip)        # 201010 <g_ref>
    return 0;
```
g_ref的地址为0x201010，而第一处rip的地址为0x604，根据上文所说的办法，此处的偏移应该为0x201010 - 0x604，计算出来的offset便是0x200a0c


## Linux Kernel如何生存符号表

## 参考

1. [深入理解x64的代码模型](https://zhuanlan.zhihu.com/p/58774036)
