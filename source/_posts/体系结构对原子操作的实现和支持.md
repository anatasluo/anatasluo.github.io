---
title: 体系结构对原子操作的实现和支持
date: 2020-06-25 04:09:13
tags:
    - ARM
    - X86
    - Computer Architecture
---

## 原子操作

查看以下C语言代码：
```
#include <stdio.h>

int val = 169;

int main() {
    val = 275;
    printf("val %d \n", val);
    return 0;
}
```
通过GCC生成的arm64汇编如下:
```
	.arch armv8-a
	.file	"main.c"
	.text
	.global	val
	.data
	.align	2
	.type	val, %object
	.size	val, 4
val:
	.word	169
	.section	.rodata
	.align	3
.LC0:
	.string	"val %d \n"
	.text
	.align	2
	.global	main
	.type	main, %function
main:
	stp	x29, x30, [sp, -16]!
	add	x29, sp, 0
	adrp	x0, val
	add	x0, x0, :lo12:val
	mov	w1, 275
	str	w1, [x0]
	adrp	x0, val
	add	x0, x0, :lo12:val
	ldr	w1, [x0]
	adrp	x0, .LC0
	add	x0, x0, :lo12:.LC0
	bl	printf
	mov	w0, 0
	ldp	x29, x30, [sp], 16
	ret
	.size	main, .-main
	.ident	"GCC: (Ubuntu/Linaro 7.5.0-3ubuntu1~18.04) 7.5.0"
	.section	.note.GNU-stack,"",@progbits
```

在现代计算机体系结构中，对变量的赋值过程是分为三步的，以上文的val为例:
```
adrp	x0, val
mov	w1, 275
str	w1, [x0]
```

为了加速访问，程序在运行过程中访问的变量，通常会放置在寄存器中。如果在多线程环境中，某个线程中该三步执行的间隙，该变量被用于其他线程，这就带来了脏值问题。

为了解决这一问题，可以通过加锁解决。加锁是一种比较廉价且低效的方法，在体系结构中，提供了三个操作作为一个整体执行的原子操作。

## ARM

### SWP指令

在比较早的arm指令集中，提供SWP和SWPB指令，用于进行原子操作。用法如下：

> SWP{B}{cond} Rt, Rt2, [Rn]

关于该指令的更多用法，参考[这里](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.dui0489c/Chdbbbai.html)

由于该指令的效率比较低，会降低整体系统的性能，在ARMv6及之后的指令集中已经不再建议使用。

### LDREX/STREX指令

在ARMv6及之后的指令集中，引入了两条指令 -- LDREX/STREX 来提供原子操作。

这两条操作，都会引起exclusive monitor(s)状态的变化，下文将举一个简单的例子。

查看如下用法:

> LDREX R1, [R0]

将R0地址的值加载到R1，并对相应的物理地址设置相应的标志，该标志由exclusive monitors进行管理。

> STREX R2, R1, [R0]

根据物理地址的状态，决定是否要进行值的写会操作。R0是将要写入的物理地址，R1中存储需要写会的值，R2则存储了这一操作的运行结果，成功返回0，失败则返回1。

关于exclusive monitor，在arm的手册中，被描述为一个简单的状态机。LDREX被称之为Load-Exclusive指令，STREX被称之为Store-Exclusive指令。对于一个Store-Exclusive指令来说，访问中涉及到的物理内存都被标记为exclusive才能够写回成功。

更多关于exclusive monitor的描述，可以查看参考一。

在Load/Store-Exclusive的基础上，原子操作可以用如下代码实现(实现来自Linux):

```
#define ATOMIC_OP(op, c_op, asm_op)					\
static inline void atomic_##op(int i, atomic_t *v)			\
{									\
	unsigned long tmp;						\
	int result;							\
									\
	prefetchw(&v->counter);						\
	__asm__ __volatile__("@ atomic_" #op "\n"			\
"1:	ldrex	%0, [%3]\n"						\
"	" #asm_op "	%0, %0, %4\n"					\
"	strex	%1, %0, [%3]\n"						\
"	teq	%1, #0\n"						\
"	bne	1b"							\
	: "=&r" (result), "=&r" (tmp), "+Qo" (v->counter)		\
	: "r" (&v->counter), "Ir" (i)					\
	: "cc");							\
}

ATOMIC_OP(atomic_add)
```

更多关于原子操作，可以查看Linux arch源码里的atomic.h

## X86

X86的指令支持"lock"前缀，对于支持该前缀的cpu指令，使用该前缀后，能够保证是原子执行的。

## 参考

1. [DHT0008A_arm_synchronization_primitives.pdf](http://infocenter.arm.com/help/topic/com.arm.doc.dht0008a/DHT0008A_arm_synchronization_primitives.pdf)
2. [LDREX/STREX(arm)](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.dui0489c/Cihbghef.html)
3. [Atomic operations in ARM(StackOverflow)](https://stackoverflow.com/questions/11894059/atomic-operations-in-arm)




