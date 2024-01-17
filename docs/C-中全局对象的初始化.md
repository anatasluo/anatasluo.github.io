---
title: C++中全局对象的初始化
date: 2020-06-25 04:10:28
tags:
    - C++
    - Class
---

## 全局对象初始化

查看如下C++代码：
```
#include <cstdio>

class A {
public:
    int val;
    A() {
        printf("construct ok \n");
    }
};

A g_al;

int main()
{
    return 0;
}
```

这段代码的运行结果是对象A的构造函数被调用，串口输出"construct ok"。根据全局对象的初始化规则，这个调用是发生在main函数之前的，而且可以是多个函数依次调用。那么，这种调用时如何实现的？

通过gcc生成arm64汇编，汇编代码如下:
```
	.arch armv8-a
	.file	"main.cpp"
	.text
	.section	.rodata
	.align	3
.LC0:
	.string	"construct ok "
	.section	.text._ZN1AC2Ev,"axG",@progbits,_ZN1AC5Ev,comdat
	.align	2
	.weak	_ZN1AC2Ev
	.type	_ZN1AC2Ev, %function
_ZN1AC2Ev:
.LFB1:
	.cfi_startproc
	stp	x29, x30, [sp, -32]!
	.cfi_def_cfa_offset 32
	.cfi_offset 29, -32
	.cfi_offset 30, -24
	add	x29, sp, 0
	.cfi_def_cfa_register 29
	str	x0, [x29, 24]
	adrp	x0, .LC0
	add	x0, x0, :lo12:.LC0
	bl	puts
	nop
	ldp	x29, x30, [sp], 32
	.cfi_restore 30
	.cfi_restore 29
	.cfi_def_cfa 31, 0
	ret
	.cfi_endproc
.LFE1:
	.size	_ZN1AC2Ev, .-_ZN1AC2Ev
	.weak	_ZN1AC1Ev
	.set	_ZN1AC1Ev,_ZN1AC2Ev
	.global	g_al
	.bss
	.align	3
	.type	g_al, %object
	.size	g_al, 4
g_al:
	.zero	4
	.text
	.align	2
	.global	main
	.type	main, %function
main:
.LFB3:
	.cfi_startproc
	mov	w0, 0
	ret
	.cfi_endproc
.LFE3:
	.size	main, .-main
	.align	2
	.type	_Z41__static_initialization_and_destruction_0ii, %function
_Z41__static_initialization_and_destruction_0ii:
.LFB4:
	.cfi_startproc
	stp	x29, x30, [sp, -32]!
	.cfi_def_cfa_offset 32
	.cfi_offset 29, -32
	.cfi_offset 30, -24
	add	x29, sp, 0
	.cfi_def_cfa_register 29
	str	w0, [x29, 28]
	str	w1, [x29, 24]
	ldr	w0, [x29, 28]
	cmp	w0, 1
	bne	.L6
	ldr	w1, [x29, 24]
	mov	w0, 65535
	cmp	w1, w0
	bne	.L6
	adrp	x0, g_al
	add	x0, x0, :lo12:g_al
	bl	_ZN1AC1Ev
.L6:
	nop
	ldp	x29, x30, [sp], 32
	.cfi_restore 30
	.cfi_restore 29
	.cfi_def_cfa 31, 0
	ret
	.cfi_endproc
.LFE4:
	.size	_Z41__static_initialization_and_destruction_0ii, .-_Z41__static_initialization_and_destruction_0ii
	.align	2
	.type	_GLOBAL__sub_I_g_al, %function
_GLOBAL__sub_I_g_al:
.LFB5:
	.cfi_startproc
	stp	x29, x30, [sp, -16]!
	.cfi_def_cfa_offset 16
	.cfi_offset 29, -16
	.cfi_offset 30, -8
	add	x29, sp, 0
	.cfi_def_cfa_register 29
	mov	w1, 65535
	mov	w0, 1
	bl	_Z41__static_initialization_and_destruction_0ii
	ldp	x29, x30, [sp], 16
	.cfi_restore 30
	.cfi_restore 29
	.cfi_def_cfa 31, 0
	ret
	.cfi_endproc
.LFE5:
	.size	_GLOBAL__sub_I_g_al, .-_GLOBAL__sub_I_g_al
	.section	.init_array,"aw",%init_array
	.align	3
	.xword	_GLOBAL__sub_I_g_al
	.ident	"GCC: (Ubuntu/Linaro 7.5.0-3ubuntu1~18.04) 7.5.0"
	.section	.note.GNU-stack,"",@progbits
```

关键的汇编代码是以下几部分；

构造函数的具体实现如下：
```
.LC0:
	.string	"construct ok "
	.section	.text._ZN1AC2Ev,"axG",@progbits,_ZN1AC5Ev,comdat
	.align	2
	.weak	.
	.type	_ZN1AC2Ev, %function
_ZN1AC2Ev:
.LFB1:
	.cfi_startproc
	stp	x29, x30, [sp, -32]!
	.cfi_def_cfa_offset 32
	.cfi_offset 29, -32
	.cfi_offset 30, -24
	add	x29, sp, 0
	.cfi_def_cfa_register 29
	str	x0, [x29, 24]
	adrp	x0, .LC0
	add	x0, x0, :lo12:.LC0
	bl	puts
	nop
	ldp	x29, x30, [sp], 32
	.cfi_restore 30
	.cfi_restore 29
	.cfi_def_cfa 31, 0
	ret
	.cfi_endproc
```

梳理汇编中的bl指令，可以得出以下的调用过程：


_GLOBAL__sub_I_g_al -> _Z41__static_initialization_and_destruction_0ii -> _ZN1AC1Ev(_ZN1AC2Ev)

其中_ZN1AC1Ev是一个弱符号，最终解析成_ZN1AC2Ev，即class A的构造函数
```
.weak	_ZN1AC1Ev
.set	_ZN1AC1Ev,_ZN1AC2Ev
```

那现在问题就变成_GLOBAL__sub_I_g_al是谁调用的，查看汇编里的相关信息，如下：
```
.LFE5:
	.size	_GLOBAL__sub_I_g_al, .-_GLOBAL__sub_I_g_al
	.section	.init_array,"aw",%init_array
	.align	3
	.xword	_GLOBAL__sub_I_g_al
	.ident	"GCC: (Ubuntu/Linaro 7.5.0-3ubuntu1~18.04) 7.5.0"
	.section	.note.GNU-stack,"",@progbits
```

可以发现，_GLOBAL__sub_I_g_al存在一个单独的，名为"init_array"的section中。

关于这个section，ARM的官方文档中，描述如下:

> The C++ Standard places certain requirements on the construction and destruction of objects with static storage duration.

> The ARM C++ compiler uses the .init_array area to achieve this. This is a const data array of self-relative pointers to functions.

> The linker collects each .init_array from the various translation units together. It is important that the .init_array is accumulated in the same order.

> The library routine __cpp_initialize__aeabi_ is called from the C library startup code, __rt_lib_init, before main. __cpp_initialize__aeabi_ walks through the .init_array calling each function in turn. On exit, __rt_lib_shutdown calls __cxa_finalize.

> Usually, there is at most one function for T::T(), mangled name _ZN1TC1Ev, one function for T::~T(), mangled name _ZN1TD1Ev, one __sti__ function, and four bytes of .init_array for each translation unit. The mangled name for the function f() is _Z1fv. There is no way to determine the initialization order between translation units.

> Function-local static objects with destructors are also handled using __aeabi_atexit.

> .init_array sections must be placed contiguously within the same region for their base and limit symbols to be accessible. If they are not, the linker generates an error.

## 查看init_array里的信息

通过以下命令，可以解析出具体调用的函数信息：

> objdump -D -j .init_array <your-application>

在我的环境中，输出如下:
```
a.out:     file format elf64-littleaarch64


Disassembly of section .init_array:

0000000000010d78 <__frame_dummy_init_array_entry>:
   10d78:	00000770 	.word	0x00000770
   10d7c:	00000000 	.word	0x00000000
   10d80:	000007c0 	.word	0x000007c0
   10d84:	00000000 	.word	0x00000000
```

通过以下命令，将具体的地址，解析成相应的函数符号:

> addr2line 0xc1000a68 -e <your-application>

在我的环境中，输出如下:

```
/tmp/tmp.KS3wdL1X4n/main.cpp:16
```

需要注意的是，这部分信息属于调试信息，编译的时候，加上"-g"，编译器才会生成这些额外信息。

## 参考

1. [What goes to the __init_array?(StackOverflow)](https://stackoverflow.com/questions/21386125/what-goes-to-the-init-array)
2. [C++ initialization, construction and destruction(Arm)](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.dui0475c/Chdfiffc.html)


