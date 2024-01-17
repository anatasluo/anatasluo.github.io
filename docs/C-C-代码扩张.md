---
title: C/C++代码扩张
date: 2020-06-15 17:01:01
tags:
    - C
    - C++
---

编译器的编译过程，可以粗略的分为前端和后端，如[下图](http://icps.u-strasbg.fr/~pop/images/front-end.png)所示:

![编译器编译过程](images/front-end.png)

除了使用反汇编研究编译器的最终结果外，也可以查看编译器生成的AST树表示。AST树是编译器前端所产生的最终代码表现形式。

下面是主流编译器clang和gcc生成AST树的方法:

## AST in GCC

> gcc -fdump-tree-all main.c

> g++ -fdump-tree-all main.cpp

关于GCC中AST树生成的更多选项，参考[这里](https://gcc.gnu.org/onlinedocs/gcc-6.2.0/gcc/Developer-Options.html)

## AST in clang

> clang -Xclang -ast-print -fsyntax-only main.c

关于clang中AST树生成的更多选项，参考[这里](https://clang.llvm.org/docs/ClangCommandLineReference.html)
