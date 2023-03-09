---
title: Weak Symbol in C/C++
date: 2020-06-22 14:46:53
tags:
    - C
    - C++
    - GCC
---

## weak symbol

*weak symbol*是二进制文件里的一种符号类型，与之相对的，是*strong symbol*。符号的类型跟代码中的声明和实现有关，查看以下代码：

```
#include <cstdio>

# define weak_alias(name, aliasname) _weak_alias (name, aliasname)
# define _weak_alias(name, aliasname) \
  extern __typeof (name) aliasname __attribute__ ((weak, alias (#name)));

extern "C" {
    extern void UndefinedSymbol();

    void StrongSymbol()
    {
        printf("Strong Symbol \n");
        return;
    }

    weak_alias(StrongSymbol, WeakAliasSymbol);

    int g_1;
    int g_2 = 1;
}

int main() {
    StrongSymbol();
    WeakAliasSymbol();
    UndefinedSymbol();
    return 0;
}
```
通过以下命令得到对应的符号类型
> g++ -c main.cpp
> nm main.o

得到的输出为
> B g_1
> D g_2
> T StrongSymbol
> U UndefinedSymbol
> W WeakAliasSymbol

基本涵盖了常见的符号类型:
1. g_1 -> B 表示未初始化或初始化为0的符号，存储在BSS段
2. g_2 -> D 表示初始化的符号，存储在DATA段
3. StrongSymbol -> T 表示既有声明，也有定义的函数，存储在TEXT段
4. UndefinedSymbol -> U 该函数仅有声明，没有定义，具体的定义推迟到链接阶段出现
5. WeakAliasSymbol -> W 该函数有声明，也可能存在定义，但是属于弱符号

## 一般用法

如果在一个二进制文件中，出现两个类型均为T的同名符号，就会出现"Mutiple definition"的错误。但是如果如果一个类型为W的弱符号跟一个类型为T的强符号同时出现，那么定义便由类型为T的强符号决定，这也是弱符号(weak symbol)的一般用途，即允许使用该库的开发者自定义相关实现，但同时也提供了一个默认实现。关于这一用法，可以参考[这里](http://www.vishalchovatiya.com/default-handlers-in-c-weak_alias/)


更多的符号类型，参考[GNU文档](https://sourceware.org/binutils/docs/binutils/nm.html)

## 更本质的原则

考虑以下情形：
1. 二进制文件中调用了某个外部接口UndefinedSymbol
2. 动态链接库libt1中声明了UndefinedSymbol为一个类型为T的StrongAlias符号的weak alias
3. 动态链接库libt2中声明了UndefinedSymbol为一个类型为T的符号，即给出了具体的定义
4. 二进制同时链接了libt1和libt2

问题是，二进制会链接哪一个库中的UndefinedSymbol？
答案是，取决于链接的顺序。

关于这一符号解析原则的阐述，在以下的两份文档中给出了说明(见参考2和3)：

关于符号解析的规则

> Another form of simple symbol resolution, interposition, occurs between relocatable objects and shared objects, or between multiple shared objects. In these cases, when a symbol is multiply-defined, the relocatable object, or the first definition between multiple shared objects, is silently taken by the link-editor. The relocatable object's definition, or the first shared object's definition, is said to interpose on all other definitions. This interposition can be used to override the functionality provided by another shared object. Multiply-defined symbols that occur between relocatable objects and shared objects, or between multiple shared objects, are treated identically. A symbols weak binding or global binding is irrelevant. By resolving to the first definition, regardless of the symbols binding, both the link-editor and runtime linker behave consistently.

关于链接顺序的说明

> Search the library named library when linking. (The second alternative with the library as a separate argument is only for POSIX compliance and is not recommended.) It makes a difference where in the command you write this option; the linker searches and processes libraries and object files in the order they are specified. Thus, `foo.o -lz bar.o' searches library `z' after file foo.o but before bar.o. If bar.o refers to functions in `z', those functions may not be loaded. The linker searches a standard list of directories for the library, which is actually a file named liblibrary.a. The linker then uses this file as if it had been specified precisely by name.

简单的来说，就是以最先链接到的为准。

## 参考

1. [strong weak symbol](https://leondong1993.github.io/2017/04/strong-weak-symbol/)
2. [Oracle Symbol Resolution](https://docs.oracle.com/cd/E19120-01/open.solaris/819-0690/chapter2-93321/index.html)
3. [GNU Link Options](https://gcc.gnu.org/onlinedocs/gcc-4.1.2/gcc/Link-Options.html)
