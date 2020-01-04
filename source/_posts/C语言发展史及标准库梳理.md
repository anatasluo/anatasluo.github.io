---
title: C语言发展史及标准库梳理
date: 2019-12-02 22:48:00
tags: Linux, C
---

## 前言

本文主要内容来自网络上公开的资源，来源我贴在了最后。

## C语言发展历史

简单的说，C语言是为了开发Unix系统而出现的，C语言最初的开发者是Dennis MacAlistair Ritchie和Kenneth Lane Thompson。

1973年，Unix系统的核心正式采用C语言改写。

C语言发展至今，按时间先后，使用的标准以及主要特性如下。

### K&R C

1975年，Brian Wilson Kernighan和Dennis MacAlistair Ritchie合作编写了一本书 《The C Programming Language》。书里介绍的C语言标准，被称为 K&R C。

书中介绍的C语言特性主要包括：

+ 标准I/O库
+ struct 类型
+ long int 类型
+ unsigned int 类型
+ 把运算符 =+和=-改为+=和-=，以避免编译器在处理时产生混淆

### C89(ANSI C)

1989年，C语言被ANSI(美国国家标准协会)标准化，编号为ANSI X3.159-1989，因此这个版本的C语言既被成为C89，也被成为ANSI C。

C89引入的C语言特性主要包括：

+ void函数
+ 函数返回struct或者union类型
+ void *数据类型

### C90(ISO C)

1990年，ISO(国际标准组织)开始成立工作组，来制定国际标准的C语言规范，ANSI随之接受ISO的标准，并宣布不再发展新的C语言标准。ISO发布标准，在ANSI C的基础上进行了改进，被称之为C90，或者ISO C。

C90对C语言的改进包括：

+ 增加了标准库
+ 新的预处理命令和特性
+ 函数原型允许在函数申明中指明参数类型
+ 一些关键字，包括const、volatile与signed
+ 宽字符、宽字符串与多字节字符
+ 对约定规则、声明和类型检查的许多小改动与澄清

1994年， ISO的WG14工作组，又对1985年颁布的标准(应该是C++标准)做了两处技术修订和一个补充，主要包括：

+ 3个标准库头文件iso646.h、wctype.h和wchar.h
+ 几个新记号与预定义宏，用于对国际化提供更好的支持
+ printf/sprintf函数一系列新的格式代码
+ 大量的函数和一些类型与常量，用于多字节字符和宽字节字符

### C99


1994年，ISO对C语言的修订和补充，引出了ISO 9899:1999的发表，这一标准又被成为C99。

C99引入的特性包括：

+ 增加了对编译器的限制，比如源代码每行要求至少支持到4095字节，变量名函数名的要求至少到63字节（extern要求支持到31字节）
+ 增强了预处理功能，包括

    1. 宏支持可变参数，即#define Macro(...) __VA_ARGS__
    2. 使用宏的时候，允许省略参数，被省略的参数将被扩展成空串
    3. 支持//开头的单行注释
+ 增加了新关键字restrict, inline, _Complex, _Imaginary, _Bool。支持long long, long double _Complex, float _Complex等类型

+ 支持不定长的数组，即数组长度可以在运行时决定。但是，考虑到效率和实现，不定长数组不能在全局，或者struct,union中使用

+ 变量声明不必放在语句块的开头，for语句提倡写成for(int i = 0; i < 100; ++i)的形式，即i只在for语句块内部有效

+ 允许采用(type_name){xx,xx,xx}类似于C++的构造函数的形式构造匿名的结构体

+ 初始化结构时，允许对特定的元素赋值，形式为

```
struct test {
    int a[3], b;
} foo[] = {
    [0].a = {1},
    [1].a = {2}
};
```
```
struct test {
    int a, b, c, d;
}foo = {
    .a = 1,
    .c = 3, 4,
    .b = 5
};
```

+ 格式化字符串中，利用\u支持unicode的字符

+ 支持16进制的浮点数的描述

+ printf/scanf的格式化增加了对long long int类型的支持

+ 浮点数的内部数据描述支持了新标准，可以使用 #pragma编译器指令指定

+ 除了已有的__line__ __file__以外，增加了 __func__ 获取当前函数名

+ 允许编译器化简非常数的表达式

+ 修改了 /% 处理负数时的定义，这样可以给出明确的结果。在C89中 -22 / 7 = -3, -22 % 7 = -1, 或者 -22 / 7 = -4, -22 % 7 = 6。C99中明确为-22 / 7 = -3, -22 % 7 = -1，结果是确定的。

+ 取消了函数返回值默认为int的规定

+ 允许在struct的最后定义的数组不指定其长度（变长数组）

+ const const int i 将被当作 const int i 处理

+ 增加和修改了一些标准头文件，详情见下文对标准头文件的汇总

+ 输入输出对宽字符以及长整数等做了相应的支持

### C11

2011年12月8日，ISO正式发布了新的C语言标准C11，该标准早期被称为C1X，官方名为ISO/IEC 9899:2011。

C11提高了对C++的兼容性，部分增加的特性包括：

+ 泛型宏

+ 多线程

+ 带边界检查的函数

+ 匿名结构

### C18

2018年6月，ISO发布了C18，官方名称为ISO/IEC 9899:2018。

相比于C11，C18未引入新的语言特性，仅对C11进行了补充和修正。

-----------------------------------

## C语言标准库

|   名称   |   用途   |   最早引入标准   |
|  :----  | :----:  | :----:  |
| <assert.h> | 条件编译宏 | C89 |
| <complex.h> | 复数运算 | C99 |
| <ctype.h> | 字符类型判断 | C89 |
| <errno.h> | 涉及错误报告的宏 | C89 |
| <fenv.h> | 浮点数运算环境相关 | C99 |
| <float.h> | float类型的限制 | C89 |
| <inttypes.h> | int类型的格式转换 | C99 |
| <iso646.h> | 可选的运算符拼写方式 | C95 |
| <limits.h> | 基础类型大小 | C89 |
| <locale.h> | 本地化工具 | C89 |
| <math.h> | 通用的数学函数 | C89 |
| <setjmp.h> | 非本地跳转 | C89 |
| <signal.h> | 信号处理相关 | C89 |
| <stdalign.h> | alignas和alignof 转换宏 | C11 |
| <stdarg.h> | 可变变量声明相关 | C89 |
| <stdatomic.h> | 原子操作相关 | C11 |
| <stdbool.h> | boolean类型相关 | C99 |
| <stddef.h> | 通用的宏定义 | C89 |
| <stdint.h> | 固定长度的int类型 | C99 |
| <stdio.h> | 输入输出 | C89 |
| <stdlib.h> | 通用的工具：内存操作，程序工具，字符串转换，随机数 | C89 |
| <stdnoreturn.h> | noreturn 宏相关 | C11 |
| <string.h> | 字符串处理 | C89 |
| <tgmath.h> | 泛类型的数学宏相关 | C99 |
| <threads.h> | 线程库 | C11 |
| <time.h> | 时间/日期 工具 | C89 |
| <uchar.h> | UTF-16 和 UTF-32 字符工具 | C11 |
| <wchar.h> | 拓展的多字节和宽字符工具 | C95 |
| <wctype.h> | 区分宽字符类型的函数 | C95 |
  
## 参考资源

+ [Wiki/C语言](https://zh.wikipedia.org/wiki/C%E8%AF%AD%E8%A8%80)
+ [C语言标准库列表](https://en.cppreference.com/w/c/header)
