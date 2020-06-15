---
title: Empty struct/class in C/C++
date: 2020-06-11 16:34:36
tags:
    - C
    - C++
    - GCC
---

## 问题

1. C语言中，对"struct A {};"进行sizeof运算，结果应该是多少？

2. C++中，对"class A {};"进行sizeof运算，结果应该是多少？

## C语言对empty struct的规定

在标准C中，对empty struct的大小没有做出规定，该行为是未定义的。然而，gcc做了拓展，在gcc中，empty struct的sizeof结果为0，更多的信息见参考1。

事实上，即使是gcc中，empty struct的行为还有再复杂一些，查看如下代码
```
#include <stdio.h>

struct T {};

int main()
{
    struct T a, b;
    struct T *pa = &a;
    struct T *pb = &b;
    if ((struct T *)&a == (struct T *)&b) {
        printf("first is equal \n");
    }
    if (pa == pb) {
        printf("second is equal \n");
    }
    return 0;
}
```
输出结果是
> second is equal

看起来有些无法理解，在x86的机器上，查看对应源码的汇编代码，发现第一个比较直接被视为不成立而优化掉了。也就是说，对于编译器来说，即使是空结构体，两个不同的结构体的地址也不应该相等。gcc虽然拓展了empty struct的大小定义，但是使用上仍然有些模糊，可能会有期望之外的行为发生。

## C++对empty struct/class的规定

在C++11中，empty struct/class的sizeof结果是1，至于原因，stroustrup(C++之父)解释说，是为了保证new出来的不同对象之间，即使是empty class，地址也不应该相等，详细信息见参考2。

对于大部分C++编译器来说，一般还会做一个称之为"empty base class optimization"的优化，查看如下代码

```
#include <iostream>

class T {};
class TT : public T {
    int x;
};

int main() {
    std::cout << sizeof(class TT) << std::endl;
    return 0;
}

```

输出结果是
> 4

也就是说，如果一个class继承自empty class，那么empty class多余的那个1就不会出现，以避免预期之外的行为。

那问题来了，C++中存在sizeof为0的class吗？答案是C++标准中是不允许存在，但是在g++中，可以构造一个出来，查看如下代码
```
#include <iostream>

class T {
    int x[0];
};

int main() {
    std::cout << sizeof(class T) << std::endl;
    return 0;
}

```

*g++*中，输出结果为
>0

这个行为是未定义，属于预期之外的行为。

## 参考

1. [gcc关于empty struct的扩展](https://gcc.gnu.org/onlinedocs/gcc/Empty-Structures.html)
2. [为什么C++的empty class大小不为0](https://www.stroustrup.com/bs_faq2.html#sizeof-empty)
