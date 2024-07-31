---
title: '[note]逆向工程权威指南'
date: 2020-10-01 12:51:05
tags:
    - Cyber Security
    - Note
---

*逆向工程权威指南*(Dennis Yurichev)(中国工信出版社)的读书笔记。

## 编程语言 - 汇编语言 - 机器语言 - 硬件指令

CPU可以看做一堆复杂电路的集合，电路接收的是控制信号。CPU为了提高执行效率，使用了流水线的设计。CPU的执行过程，大致可以分为三步: 取指，译码，执行。

在计算机最早出现的时候，程序员是通过打孔纸带来编程的。这些打孔纸会被计算机识别为01组成的序列，进而被解释称机器语言。机器语言被CPU解释，指导CPU的运行。机器语言所属的指令集主要可以分成两类架构：CISC(复杂指令集)和RISC(精简指令集)。当然，还有一些不常见的指令集架构，包括：[VLIW](https://en.wikipedia.org/wiki/Very_long_instruction_word), [EPIC](https://en.wikipedia.org/wiki/Explicitly_parallel_instruction_computing)，[MISC](https://en.wikipedia.org/wiki/Minimal_instruction_set_computer)。CISC代表性的指令集有x86，RISC代表性的有ARM, MIPS, RISC-V。

再后来，出现了汇编语言，汇编语言跟机器语言是等价的。也就说，从汇编语言翻译成机器语言，可以看做是一对一的过程。跟机器语言相比，汇编语言更容易记忆和使用。每条汇编语言，都由opcodes(操作指令)和operands(操作数)组成。

再之后，在汇编语言的基础上，又进一步抽象发展出了编程语言。编程语言的分类方法比较多，此处不一一列举，更多的总结，可以参考[这里](https://anatasluo.github.io/2020/02/14/ckgnz8v1j000qg8zcawil5w1v/)。由于编程语言的抽象程度较高，从编程语言到汇编语言需要经历复杂的过程。不同于汇编语言和机器语言之间的一一对应关系，从编程语言到汇编语言之间存在很大的优化空间，不同的编译器对同一份编程语言，生成的汇编语言也可能是不一样的。

总之，从开发者接触的编程语言，到最终CPU理解的硬件指令的过程中，依次经历了编程语言，汇编语言，机器语言和最终的硬件指令。

## 汇编语言阅读技巧

### X86汇编

X86的汇编语言有两种风格: AT&T风格 和 Intel风格

在使用gcc进行编译时，通过 -S-masm=intel 的方式，指明生成的汇编语言风格

AT&T风格中，大量使用了编译宏，这些编译宏以"."开始，gcc中使用-fno-asynchronous-unwind-tables将这些宏进行预处理，以消除此类宏，增强可读性。

Intel风格:
+ <指令><源><目标>
+ Intel风格使用方括号

AT&T风格:
+ <指令><目标><源>
+ AT&T风格使用圆括号
+ AT&T风格中，寄存器使用百分号(%)标记，立即数使用美元符号($)标记
+ AT&T需要声明操作数据的类型:
  + -l(32位long)
  + -w(16位word)
  + -b(8位byte)

X86汇编指令可以分为三类:
+ data movement
+ arithmetic&logic
+ control-flow

### ARM汇编

ARM64汇编中"!"表明该运算会优先执行，称之为"预索引"(pre-index)指令。与之相对的，有"延时索引"(post-index)指令。

IDA显示ARM平台指令的方式:
+ ARM32及ARM64的指令opcode = 4-3-2-1
+ Thumb模式下的指令opcode = 2-1
+ Thumb2模式下的指令opcode = 2-1-4-3

## 调用规范(calling convention)

### 分类

+ ARM中的AAPCS
+ X86中的cdecl
+ stdcall和fastcall
+ Windows平台下的一些约定
+ Caller Rules和Callee Rules

### 部分比较重要的规范细节

RISC中存在Branch delay slot的现象，即转移指令后的若干指令先于转移指令发生(即转移到新地址之前，转移后的指令已经被执行了)。这一现象是流水线的副作用，主要出现在部分比较老的RISC指令集中，可以通过编译器在生成汇编代码时改变顺序，来修复这一问题。

双字节对齐:
+ X86中的双字节对齐方式一般为 and esp, 0xfffffff0
+ 入栈操作时，寄存器的个数必须为偶数个

ARM架构下，存在thumb指令集，为了在不同模式之间进行切换，ARM中存在形实转换函数(thunk function)

## 内存寻址和栈帧管理

相对寻址: 利用PC进行相对寻址，从而产生PIC(position-independent code)

由于arm32的编码方式，寻址的部分只有26位，因而只能支持32M范围内的寻址

栈帧(函数序言和函数尾声)和叶函数(leaf function)，由于叶函数的特殊性，可以做针对性的优化，减少寄存器和栈的操作

栈内存分配函数: alloca




## 参考

+ [Comparison of instruction set architectures](https://en.wikipedia.org/wiki/Comparison_of_instruction_set_architectures)
+ [X86汇编](http://flint.cs.yale.edu/cs421/papers/x86-asm/asm.html#:~:text=The%20lea%20instruction%20places%20the,and%20placed%20into%20the%20register)