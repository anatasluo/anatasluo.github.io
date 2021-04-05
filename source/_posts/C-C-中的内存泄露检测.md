---
title: C/C++中的内存泄露检测
date: 2020-06-25 04:06:24
tags:
    - C
    - C++
    - Memory
---

## 内存泄露

在理解内存泄露前，先简要讲下C/C++的内存模型。可执行文件使用的内存，粗略的可以分为由开发者主动支配以及由程序被动分配。举个简单的例子，全局变量以及局部变量的存储，就是由编译器编译器时候规划好的，通过malloc/new接口获得的内存则是从堆中获得的，由开发者来通过free接口释放。

内存泄露，即开发者从堆中获得的内存，用完之后没有还给系统，从而引起了有效内存减少。

检测内存的泄露的思路大致有两种，他们之间的区别，在于检查的层面。

## 实现自己的malloc/new/free接口

通过宏定义或者GCC的wrapper参数，可以取代系统的相关实现。在自己的实现中，记录下malloc/new/free接口的调用信息，比如指向内存的指针数量，分配内存的大小，是否被释放，接口的调用位置等等。依据这一原理实现的关键在于，能正确计算出什么时候应该释放内存，比如已经没有有效指针指向内存，比如释放内存的大小与申请内存大小不一等等。

使用这一原理的工具，有[Dmalloc](https://dmalloc.com/)

## 使用虚拟机来检测内存泄露

另一个更加行之有效，也更加耗费大的方法，则是通过虚拟机。即通过专门的虚拟机程序，在程序的实际运行过程中，实时检测内存的使用情况。

使用这一原理的工具，有[valgrind](https://www.valgrind.org/)

无论哪种办法，本质都是通过记录额外信息来实现的，区别在于记录信息的层面，是可执行程序本身，或者由系统来记录。
，
## 常见的内存泄露场景

1. 未释放内存，又申请了新内存
```
char* str = new char[100];

str = new char [150];

delete[] str;
```
2. 局部变量被销毁后，指向的内存未被释放

```
void test()
{
    char* lo = new char[100];
    return;
}
```

## 参考

+ [Memory Leak Detectors Working Principle(StackOverFlow)](https://stackoverflow.com/questions/28446850/memory-leak-detectors-working-principle#:~:text=The%20basic%20implementation%20is%20actually,allocation%20should%20have%20been%20freed.)

+ [How to find memory leak in a C++ code/project?(StackOverFlow)](https://stackoverflow.com/questions/6261201/how-to-find-memory-leak-in-a-c-code-project)