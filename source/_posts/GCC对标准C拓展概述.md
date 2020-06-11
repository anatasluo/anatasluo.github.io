---
title: GCC对标准C拓展概述
date: 2020-06-11 16:33:59
tags:
    - GNU
    - GCC
    - C
    - C++
---

## GCC发展及当前的主流编译器

C语言最初出现，是为了适应内核编写的需要。编译器则是编程语言发展的具现。GCC是GNU运动的产物，说是最重要的产物之一也不为过。后来，由于Apple等公司，对编译器的定制化需求越来越大，且这些需求或者新特性，无法被GCC社区及时接受。因此，Apple公司转而拥抱LLVM。LLVM是一套编译器组件，用C++编写，用于编写其他语言，允许使用者高度定制化编译器。Clang则是在LLVM框架中，发展出的一个C语言编译器。除此之外，还有微软编写的，仅能用于Windows平台的MSVC。

一言以蔽之，当前主流的编译器:

+ GCC(GNU)
+ Clang(LLVM)
+ MSVC(MicroSoft)

MSVC不能用于其他平台，不在讨论之列。Clang相比于GCC，优势在于社区更加活跃，开发节奏快，对很多新技术的支持好，实现上更接近标准实现。GCC的优点在于，在占据主流的传统生产环境上，优化的效果也出色一些，这也得益于GCC本身对标准进行了大量拓展。

## GCC对C语言的拓展

为了适应生产环境的变化，GCC对C语言做了相当多的拓展。以C90为节点，进行划分，这些拓展相当一部分被C99和C++标准接受，剩余一部分则未被接受，因此，在编写C语言程序时，对于依赖编译器的实现，需要作出相应的适应性修改，以保证兼容性。本文主要介绍GCC 8.4.0对C90的拓展，对于比较重要的拓展，会新开博客讲述，对不那么重要的，则一带而过。

### 变长数组

### Empty struct

见[Empty struct/class in C/C++](https://anatasluo.github.io/blog/Empty-struct-class-in-C-C/)

## 参考

1. [LLVM Wiki词条](https://zh.wikipedia.org/wiki/LLVM)
2. [GCC拓展](https://gcc.gnu.org/onlinedocs/gcc-8.4.0/gcc/C-Extensions.html)
3. [变长数组](https://wiki.sei.cmu.edu/confluence/display/c/DCL38-C.+Use+the+correct+syntax+when+declaring+a+flexible+array+member)