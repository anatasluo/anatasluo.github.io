---
title: 深入理解相对重定向
date: 2022-06-22 18:30:00
tags:
    - Linux
    - ELF
    - Relocation

---

考察以下代码*reloc.c*
```
extern int ext_func(void);

extern int ext_var;
int *ext_var_p = &ext_var;
static int *ext_var_sp = &ext_var;

static int sta_var = 0x05;
int *stat_var_p = &sta_var;
static int *stat_var_sp = &sta_var;

static int sta_func(void)
{
    ext_var += 0x08;
    *ext_var_p += 0x10;
    *ext_var_sp += 0x20;
    return 0;
}

int glo_add_func(int* a)
{
    a += 0x50;
    return 0;
}

int glo_func(void)
{
    sta_var += 0x30;
    *stat_var_p += 0x40;
    glo_add_func(stat_var_sp);
    return 0;
}

int main()
{
    ext_func();
    sta_func();
    glo_func();
    return 0;
}
```

通过以下命令进行编译
> gcc -c reloc.c

这个代码涉及到大量的重定向条目，我们一个个的来讨论。

先讨论glo_func是如何调用glo_add_func，通过objdump查看相关汇编，为：
```
000000000000005b <glo_func>:
  5b:   55                      push   %rbp
  5c:   48 89 e5                mov    %rsp,%rbp
  5f:   8b 05 00 00 00 00       mov    0x0(%rip),%eax        # 65 <glo_func+0xa>
  65:   83 c0 30                add    $0x30,%eax
  68:   89 05 00 00 00 00       mov    %eax,0x0(%rip)        # 6e <glo_func+0x13>
  6e:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # 75 <glo_func+0x1a>
  75:   8b 10                   mov    (%rax),%edx
  77:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # 7e <glo_func+0x23>
  7e:   83 c2 40                add    $0x40,%edx
  81:   89 10                   mov    %edx,(%rax)
  83:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # 8a <glo_func+0x2f>
  8a:   48 89 c7                mov    %rax,%rdi
  8d:   e8 00 00 00 00          callq  92 <glo_func+0x37>
  92:   b8 00 00 00 00          mov    $0x0,%eax
  97:   5d                      pop    %rbp
  98:   c3                      retq   
```
通过readelf查看相关的重定向规则，为：
```
00000000008e  000f00000004 R_X86_64_PLT32    0000000000000044 glo_add_func - 4
```

不考虑重定向，仅考虑callq指令本身，根据AMD spec的描述，callq的作用为：
```
Call near, relative, displacement relative to next instruction.
```

callq指令会以重定向位置的下一条指令为基准，进行跳转。

Q: *为什么是下一条指令，而不是当前的指令？*

A: 因为流水线(pipeline)的存在，为了提高指令的执行效率，当前指令在执行时，EIP是指向下一条指令。

现在，引入以下变量值：

addr1: 跳转的目标函数的地址，即上面的glo_add_func

addr2: callq指令所在的地址，即上面的glo_func+0x8d

addr3: callq指令的下一条指令所在的地址，即上面的glo_func+0x92

offset: callq指令之后应该填入的跳转偏移

假设callq能以当前指令的地址为基准，那么应该存在关系offset = addr1 - addr2
但是实际由于流水线的存在，callq以下一条指令为基础，实际关系为offset = addr1 - add3

现在，引入以下变量和概念

instruction_len: 重定向所在指令的长度，上文的例子中为callq本身的1bytes和offset的4bytes，为5bytes

op_len: 重定向区域到指令开始的长度，上文的例子中为callq本身的指令长度，为1bytes

relocation_len: 重定向区域到指令结束的长度，上文的例子为offset的长度，为4bytes

实际上是以重定向区域为界，将所在的指令一分为二，容易得出instruction_len = op_len + relocation_len。

而addr3 = addr2 + instruction_len，所以offset的计算变成offset = addr1 - add3 = addr1 - addr2 - instruction_len

进而推导出offset = addr1 - addr2 - instruction_len = addr1 - addr2 - op_len - relocation_len = addr1 - relocation_len - (addr2 + op_len)

现在，我们再考虑重定向是如何规定的，根据type = R_X86_64_PLT32，重定向规则为L + A - P。

这里讲一个小知识点，编译器在编译阶段，不能确定当前编译结果是否是共享对象，因此对全局的函数引用都处理成R_X86_64_PLT32类型。
在后续的链接阶段，会根据函数符号是否处于共享对象进行不同的处理：

1. 函数符号位于共享对象

按照R_X86_64_PLT32进行处理，需要设置PLT表格等等，具体过程本文不涉及。

2. 函数符号不处于共享对象

按照R_X86_64_PC32进行处理，R_X86_64_PC32的计算规则为S + A - P。即L + A - p -> S + A - P

本文的例子中，符号均不处于共享对象，因此实际的重定向规则为S + A - P，其中对S, A, P的定义为：

> S: Represents the value of the symbol whose index resides in the relocation entry

> P: Represents the place (section offset or address) of the storage unit being relocated (computed using r_offset).

> A: Represents the addend used to compute the value of the relocatable field.

对应到上文的例子，S就是glo_add_func的地址，即addr1。P是重定向指令所在地址，即addr2 + op_len。(实际计算中，是通过section addr + r_offset)。
最终的重定向计算过程为：offset = addr1 + A - (addr2 + op_len)
对比我们前文的公式：offset = addr1 - relocation_len - (addr2 + op_len)

可以得出一个结论： A = -relocation_len

这里的重定向是以glo_add_func的变量地址为基准，进行计算的。还存在一种情况，是以section的地址为基准，进行计算。

继续考察上文的代码，通过readelf查看代码涉及到的重定向条目，发现以下条目：
```
Relocation section '.rela.text' at offset 0x410 contains 14 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000000006  000d00000002 R_X86_64_PC32     0000000000000000 ext_var - 4
00000000000f  000d00000002 R_X86_64_PC32     0000000000000000 ext_var - 4
000000000016  000c00000002 R_X86_64_PC32     0000000000000000 ext_var_p - 4
00000000001f  000c00000002 R_X86_64_PC32     0000000000000000 ext_var_p - 4
00000000002b  000300000002 R_X86_64_PC32     0000000000000000 .data + 4
000000000034  000300000002 R_X86_64_PC32     0000000000000000 .data + 4
000000000061  000300000002 R_X86_64_PC32     0000000000000000 .data + c
00000000006a  000300000002 R_X86_64_PC32     0000000000000000 .data + c
```

在对text段的重定向过程中，存在直接以data段为基址的条目，以重定向偏移为00000000002b的条目进行以下讨论。

通过与汇编源码比较，可以知道，该重定向涉及的汇编为：
```
  1c:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # 23 <sta_func+0x23>
  23:   83 c2 10                add    $0x10,%edx
  26:   89 10                   mov    %edx,(%rax)
  28:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # 2f <sta_func+0x2f>
  2f:   8b 10                   mov    (%rax),%edx
  31:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # 38 <sta_func+0x38>
  38:   83 c2 20                add    $0x20,%edx
```
涉及的源码为:
```
*ext_var_sp += 0x20;
```
从0x28开始汇编，所做的事情为

0x28 -> 获取ext_var_sp的地址

0x2f -> 读取ext_var_sp指向的地址

0x31 -> 此处无关

0x39 -> 将指向地址的值加上0x20


可以看出，此处重定向，要获取的是ext_var_sp的地址，观察汇编
```
28:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # 2f <sta_func+0x2f>
```
这里，是以RIP为基址，根据一个offset，读取ext_var_sp的地址。因此，重定向最终的输出，应该为offset = ext_var_sp - RIP

借用上文的变量和概念：

addr1: 跳转的目标变量的地址，对于static变量，通常表示为section + symbol offset。通过readelf查看符号表，发现为.data + 0x8

addr2: 取址指令所在的地址，即上面的sta_func+0x28

addr3: 取址指令的下一条指令所在的地址，即上面的sta_func+0x31

offset: 取址指令之后应该填入的跳转偏移

instruction_len: 见上文

op_len: 见上文

relocation_len: 见上文

因此，此时的offset = ext_var_sp - RIP = addr1 - addr3 = addr1 - addr2 - instruction_len
充分展开后，结果为
offset = section_addr + symbol_offset - relocation_len - (addr2 + op_len)

此时对应的S为section_addr， P仍然为addr2 + op_len。
由于S的变化，A变成了symbol_offset - relocation_len

S的变化，是因为此处以section为基址，而不是以具体的变量为base，Addend必须加上对应的symbol_offset。

以section为基址的重定向通常为static变量，这种变量外部不可见，编译时的offset是固定的，不会在链接阶段改变。

以section为基址的重定向可以在符号表中去除相关的static变量，减少最终生成的文件大小。

总结：
1. 流水线的设计，使得IP寄存器总是指向下一条指令，计算offset时，需要考虑当前指令的长度
2. 相对偏移如果确定，则以section为基址进行重定向，可以减少符号表大小， Addend = symbol_offset - relocation_len
3. 相对偏移如果不确定，则以symbol为基址进行重定向，Addend = - relocation_len

思考题：
1. X86的指令是不定长的，而ARM指令是定长的，ARM下是如何处理相对重定向的？
2. 其他类型的重定向规则的作用？
3. PLT和GOT表格的具体作用过程，以及其实如何解决共享库面对的问题？

## References
1. [call instruction描述](https://www.felixcloutier.com/x86/call)
2. [知乎专栏 - 静态链接与动态链接的宏观概述及微观详解](https://zhuanlan.zhihu.com/p/105936114)
3. [blog - How to execute an object file](https://blog.cloudflare.com/how-to-execute-an-object-file-part-1/)
4. [AMD SPEC](https://www.amd.com/system/files/TechDocs/24592.pdf)

