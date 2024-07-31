---
title: 深入了解GCC的LTO机制
date: 2024-08-01 10:55:45
tags:
    - GCC
    - LTO
    - Livepatch

---

## 经典的编译，链接模型

![没有LTO时，C语言的编译过程](./images/compiler-no-lto.png)

## LTO是什么

通常来说，优化时掌握的信息越多，最终的效果就越好。编译器的优化思路就是如此逐层深入的，从最开始的语句优化，到函数优化，再到当前讨论的程序层次的优化。

在computer programming中讨论这种全局优化时，常用的概念叫Interprocedural optimization(IPO)。

与IPO相等价的一个概念，叫Whole Program Optimization(WPO)。



## 使用WPA后，C语言的编译过程

![加入LTO时，C语言的编译过程](./images/with-lto.png)

## Bottom-Up vs Top-Down inlining

## 参考链接

1. [Interprocedural_optimization](https://en.wikipedia.org/wiki/Interprocedural_optimization)
2. [Link Time Optimization](https://gcc.gnu.org/onlinedocs/gccint/LTO.html)
3. [linktime-optimization-in-gcc-1-brief](https://hubicka.blogspot.com/2014/04/linktime-optimization-in-gcc-1-brief.html)
4. [LTO-Overview](https://gcc.gnu.org/onlinedocs/gccint/LTO.html)
5. [WHOPR](https://gcc.gnu.org/wiki/whopr?action=AttachFile&do=view&target=whopr.pdf)
6. [early-debug](https://gcc.gnu.org/wiki/early-debug)
7. [Link-time optimisation (LTO)](https://convolv.es/guides/lto/)
8. [gcc-flag](https://gcc.gnu.org/onlinedocs/gcc-4.9.4/gccint/Internal-flags.html)
9. [lto-ppt](https://www.slideshare.net/slideshow/gcc-lto/79530242)
10. [lto-faq](https://gcc.gnu.org/wiki/LinkTimeOptimizationFAQ)
11. [lto-gentoo](https://wiki.gentoo.org/wiki/LTO)
