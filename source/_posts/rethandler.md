---
title: return handler的断点原理
tags:
  - Linux
  - Live patch
  - ELF
  - Assembly
date: 2022-01-27 15:34:36

---


## return handler

所谓return handler，是指在目标函数执行结束离开该函数时触发的handler。一般的断点是对指令进行替换，触发系统的异常处理。return handler的问题在于，函数有多个return出口，不可能全部一一识别并替换。

但是函数总是要返回的，返回的地址必然被记录在某处地方。在ARM体系结构下，有专门的LR寄存器。在X86下，return address则是被压入栈中。

注意，我们拿到的是记录返回地址的地址。这句话有点绕，寄存器或者栈本身不是返回的执行地址，而是记录了返回地址的地方。有两种办法，去修改返回地址：

1. 修改寄存器或者栈，直接指向某一处handler地址，函数返回后，就会跳转到该handler执行。需要注意的是，这种方案下，这个handler必须跟函数在同一地址空间里。也就是，这个handler是在用户态执行的。(这里只讨论用户态程序）

2. 修改寄存器或者栈指向的地址，修改成break指令。这样函数在执行完毕，跳转回去后，执行该指令后，将会触发系统的异常处理，从而进入了系统的handler处理。需要注意的是，系统的handler处理是在内核态触发的。

然而，仍然有两个问题需要解决：
1. 上面两种方案的前提，都是要识别已经进入函数中，再对return address进行修改。因此return handler断点处理首先需要在函数的入口处打上一般断点，在入口的断点处理流程中，修改返回值。

2. 修改之后如何还原，第一种方案需要记录原来的地址，在handler里面通过jmp还原正常的处理流程。第二种方案使用一般断点的处理思路即可。

## X64 return handler的原理示例程序

```
#include <stdio.h>
#include <string.h>
#include <unistd.h>

unsigned long original_ret;

static void ret_handler(void)
{
    // doing something necessary
    printf("return handler executed here 0x%lx \n", original_ret);
    asm volatile("jmp *%0" : : "r" (original_ret));
}

unsigned long hijack_handler = 0x40116a;

#define hijack_return_address() { \
    asm volatile( \
        "mov %%rbp, %%rdi \n\t" \
        "addq $0x8, %%rdi \n\t" \
        "mov (%%rdi), %0 \n\t" \
        "movq %1, (%%rdi) \n\t" \
        : "=&r" (original_ret) \
        : "r" (hijack_handler) \
        : "%rdi" \
    ); \
}

static unsigned long test_print(void)
{
    int i;
    char name[] = "test for hijack handler \n";
    unsigned long ret = 0;
    for (i = 0; i < strlen(name); i++) {
        printf("%c", name[i]);
        ret += name[i];
    }
    // we can execute it in any place within this func.
    hijack_return_address();
    return ret;
}

int main(void) {
    while (1) {
        test_print();
        sleep(10);
    }
    return 0;
}

```

一些说明：
1. 内联汇编中，由于输入和输出会操作同一个寄存器，一个是写，一个是读。因此，需要限制输入和输出动作不会使用同一个额外的寄存器进行跳转，因此要加上"&"。GNU的说明，参考[此处](https://gcc.gnu.org/onlinedocs/gcc/Modifiers.html)。

2. 此处汇编写成宏，是因为call指令会影响rbp/rsp寄存器，从而影响return address的寻找，实际应用过程中，这里对return address的修改一般是通过代码注入完成的。
