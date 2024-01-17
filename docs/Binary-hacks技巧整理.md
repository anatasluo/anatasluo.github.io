---
title: Binary.hacks技巧整理
date: 2023-08-31 09:50:26
tags:
  - Binary
  - ELF
  - Hack
---

[Binary.Hacks 黑客秘笈100选](pdf/Binary-Hacks.pdf) 是一本比较老的书，里面记录了一些有意思的技巧，本篇blog是对该书的一些总结和补充。

## [Hack 14] demangle C++的symbol

> nm --demangle foo.o

> nm foo.o | c++filt

## [Hack 20] PIC共享库的性能意义

这一章的本意是强调通过PLT跳转，可以有效减少Relocation的数量。但是，对于较新的编译器版本来说，书中举的例子已经不正确了。

PIC共享库的优点如下:
+ 对于相同的外部函数调用，通过PLT表格，只需要执行一次Relocate。
+ 由于通过PLT进行跳转，text段本身可以在不同的上下文之间进行共享。

缺点如下:
+ 函数调用需要多跳转一次，有性能损耗。

## [Hack 21] 使用[statifier](https://github.com/greenpau/statifier)对动态链接的可执行文件进行模拟静态链接

这个工具的原理有点像criu的dump过程，把运行过程的memory直接dump下来，再直接恢复运行。statifier的特别之处在于，它把checkpoint的时机选在ELF的entry point前，从而保证每次都是全新的状态运行。

## [Hack 22] GNU/GCC的拓展

书里面介绍了一些abi，还有built-in函数的内容，GNU/GCC的拓展内容要比介绍的多得多。

## [Hack 24] 活用在GCC的built in函数上的最优化

通过最准确的语义，最大化编译器的优化效果。比如，const的使用决定了编译器对strlen的优化。

### 第一种情况，字符串指针被const修饰
```
#include <stdio.h>
#include <string.h>

const char *secret = "secret";

int main()
{
    int a = strlen(secret);
    return a;
}
```

对应的反汇编代码为:
```
0000000000401126 <main>:
  401126:	55                   	push   %rbp
  401127:	48 89 e5             	mov    %rsp,%rbp
  40112a:	48 83 ec 10          	sub    $0x10,%rsp
  40112e:	48 8b 05 db 2e 00 00 	mov    0x2edb(%rip),%rax        # 404010 <secret>
  401135:	48 89 c7             	mov    %rax,%rdi
  401138:	e8 f3 fe ff ff       	call   401030 <strlen@plt>
  40113d:	89 45 fc             	mov    %eax,-0x4(%rbp)
  401140:	8b 45 fc             	mov    -0x4(%rbp),%eax
  401143:	c9                   	leave
  401144:	c3                   	ret
```

可以看到产生了一次strlen函数调用。

### 第二种情况，字符串指针和字符串同时被const修饰
```
#include <stdio.h>
#include <string.h>

const char * const secret = "secret";

int main()
{
    int a = strlen(secret);
    return a;
}
```

对应的反汇编为:
```
0000000000401106 <main>:
  401106:	55                   	push   %rbp
  401107:	48 89 e5             	mov    %rsp,%rbp
  40110a:	c7 45 fc 06 00 00 00 	movl   $0x6,-0x4(%rbp)
  401111:	8b 45 fc             	mov    -0x4(%rbp),%eax
  401114:	5d                   	pop    %rbp
  401115:	c3                   	ret
```

可以看到，此时strlen的结果被直接计算出来了，减少了一次调用。

如果string在使用过程中确实不会变化，应该考虑将其变成literal字符串。

## [Hack 27] 根据系统不同用glibc来更换加载库

通过设定LD_HWCAP_MASK变量，改变加载动态库的查找顺序。

## [Hack 32] GCC在栈中生成运行时代码，进行跳转

参考[GCC编译器通过stack执行代码](https://anatasluo.github.io/66174d84bdc2/)

## [HACK 35] PIE and PIC

[PIE和PIC的使用前提不一样](https://www.mjr19.org.uk/IT/pic_pie.html):
> neither: code cannot be used in a shared library, nor be included in a PIE executable.
> PIE: code cannot be used in a shared library, but can be included in both a PIE and non-PIE executable.
> PIC: code can be used anywhere.

使用前提的不一样，导致优化程度不一样。

## [Hack 49] 注意64位环境0和NULL的不同

在一些特殊构造的例子下，32位的0被cast成了64位的NULL指针。没遇到过这样的情况，对书中的例子没有深究。

## [Hack 64] 检测运行中进程的路径名

1. 从argv[0]获取

这种办法获取的路径不一定是absolute。

2. 从/proc/self/exe

这种办法读出来的路径是absolute path，但是该路径也是realpath。如果想获取soft link本身的路径，这种办法则不可行。

3. 从/proc/self/maps中解析相关路径

限制同2，解析过程则显得繁琐的多。

## [Hack 65] 检测正在加载的共享库

1. 从/proc/self/maps中解析相关路径

2. 在Linux上使用dl_iterate_phdr

## [Hack 67] 使用libbf处理ELF文件

[相关文档](pdf/bfd.pdf)

## [Hack 69] 通过ffcall/libffi动态调用函数

动态检测函数的签名，并且发起调用，本质就是按照abi规范，动态生成调用代码。

## [Hack 70] 通过libdwarf读取调试信息

[相关文档](pdf/DWARF5.pdf)

## [Hack 71] [dumper](https://shinh.skr.jp/binary/dumper.tgz)显示结构体内容

dumper的工作原理是读取进程空间的内存，然后根据debug信息对内存进行解释。

## [Hack 72] 如何加载并运行object文件

参考这篇[blog](https://blog.cloudflare.com/how-to-execute-an-object-file-part-1/)，要比书里讲的清楚的多。

## [Hack 73] 通过libunwind控制call chain

结合解析栈和操作上下文的能力，libunwind可以改变程序的执行流程。

## [Hack 74] 用GNU lightning Portable生成运行编码

[GNU lightning](https://www.gnu.org/software/lightning/)用来生成不依赖处理器抽象特性的汇编程序。

## [Hack 76] 用signal stack处理stack overflow

通过设置SIGSEGV的处理函数，恢复程序的执行。在这其中，涉及到对栈空间的解释和使用，又引出了red zone和yellow zone的概念。

## [Hack 77] Hook面向函数的enter/exit

通过GCC的-finstrument-functions选项，可以在function的enter/exit位置执行hook代码，从而进行一些profile动作。

## [Hack 79] 取得程序计数器的值

通过调用函数时，PC被压栈的特性，获取当前的PC值。

## [Hack 81] 使用SIGSEGV来确认地址的有效性

通过检测数据访问是否会触发SIGSEGV handler来确认当前地址的有效性。

## [Hack 83] 使用ltrace来跟踪共享库函数的调用

原理是改写了PLT表格，但是这种改写不能用于替换运行进程的动态库，因为可能有函数地址或者变量地址被使用在地址空间中。

## [Hack 84] [使用Jockey记录，再生Linux的程序运行](pdf/Jockey.pdf)

原理是记录了外部调用的结果，并对结果进行重放。论文还没有仔细看过，看原理有点打桩的意思。

## [Hack 85] [使用prelink加速程序启动](pdf/prelink.pdf)

程序的重定向在确定地址随机化的load_bias后，是可以提前进行的。

[prelink](https://elinux.org/Pre_Linking)的问题在于，需要在性能和安全之间取得一个平衡。

## [Hack 86] livepatch的原理

livepatch，简单的定义就是，在程序运行时，通过加载新的代码，改变其运行状态。

大体上可以分为三步:
1. 在进程空间里映射内存，存放新的代码。
2. 对新的代码进行符号解析，重定向工作。
3. 确保安全的情况下，对原有的上下文进行修改。

这种修改的原理是通过加入类似jmp instruction的代码，将原有的text引导至新的text。

## [Hack 91] 使用硬件调试的功能

硬件提供的debugging能力，更多的需要去阅读官方的文档。

## [Hack 93] [Boehm GC](https://en.wikipedia.org/wiki/Boehm_garbage_collector)的使用

通过一套特制的接口，为C语言加入GC机制。

## [Hack 94] 存储器的访问顺序

这部分涉及访存的时序，以及编程语言的内存模型。





