---
title: GCC编译器通过stack执行代码
date: 2023-08-24 00:52:37
tags:
  - GNU
  - GCC
  - Stack
---


考虑以下代码
```
#include <stdio.h>

void other(void (*funcp)()) {
    funcp();
}

void outer(void) {
    int a = 0x0;
    a += 0x22;

    void inner(void) {
        a += 0x33;
    }

    other(inner);
    printf("a is 0x%x \n", a);
}

int main()
{
    outer();
    return 0;
}
```

这段代码的特别之处在于，inner函数定义在outer函数内部，且inner函数访问了outer函数的局部变量。

局部变量处于outer函数的栈上，而inner函数的调用时机并不确定，因此inner函数自身的栈与该局部变量的距离并不固定，需要通过某种办法将该局部变量的地址传递给inner函数。GCC解决这个问题的办法，就是在栈上生成了代码。

编译该代码，出现了以下warning
> /usr/bin/ld: warning: /tmp/ccRfPclj.o: requires executable stack (because the .note.GNU-stack section is executable)

关于该warning，详情见Referfence-1。

编译之后，通过反汇编查看outer函数和inner函数的实现，可以发现outer函数有很长的一段逻辑，是往栈中写入了特定的内容，相关实现截取如下:
```
  40115d:       48 8d 45 10             lea    0x10(%rbp),%rax
  401161:       48 89 45 f0             mov    %rax,-0x10(%rbp)
  401165:       48 8d 45 d0             lea    -0x30(%rbp),%rax
  401169:       48 83 c0 04             add    $0x4,%rax
  40116d:       48 8d 55 d0             lea    -0x30(%rbp),%rdx
  401171:       b9 40 11 40 00          mov    $0x401140,%ecx
  401176:       66 c7 00 41 bb          movw   $0xbb41,(%rax)
  40117b:       89 48 02                mov    %ecx,0x2(%rax)
  40117e:       66 c7 40 06 49 ba       movw   $0xba49,0x6(%rax)
  401184:       48 89 50 08             mov    %rdx,0x8(%rax)
  401188:       c7 40 10 49 ff e3 90    movl   $0x90e3ff49,0x10(%rax)
  40118f:       b8 00 00 00 00          mov    $0x0,%eax
  401194:       89 45 d0                mov    %eax,-0x30(%rbp)
  401197:       8b 45 d0                mov    -0x30(%rbp),%eax
  40119a:       83 c0 22                add    $0x22,%eax
  40119d:       89 45 d0                mov    %eax,-0x30(%rbp)
  4011a0:       48 8d 45 d0             lea    -0x30(%rbp),%rax
  4011a4:       48 83 c0 04             add    $0x4,%rax
  4011a8:       48 89 c7                mov    %rax,%rdi
  4011ab:       e8 76 ff ff ff          call   401126 <other>
```

这一段的实现比较晦涩，通过GDB追踪outer函数的执行，当执行到other函数时，并没有直接调用inner函数，而是跳入了栈上的某一个地址，对该地址进行反汇编，出现了以下代码:
```
   0x7fffffffe034:	mov    $0x401140,%r11d
   0x7fffffffe03a:	movabs $0x7fffffffe030,%r10
   0x7fffffffe044:	rex.WB jmp *%r11
```
这段栈上的代码做了两件事情，传递了inner函数以及局部变量的真实地址，接着跳入inner函数执行，outer函数那一堆操作栈的代码就是在栈上生成该代码。

而inner函数的实现特别之处如下:
```
  401144:       4c 89 d0                mov    %r10,%rax
  401147:       4c 89 55 f8             mov    %r10,-0x8(%rbp)
  40114b:       8b 10                   mov    (%rax),%edx
  40114d:       83 c2 33                add    $0x33,%edx
  401150:       89 10                   mov    %edx,(%rax)
```
inner函数从r10寄存器读取了局部变量的值，并完成了修改，这种读取行为跟生成的栈上代码是强相关的。

## 总结

GCC为了支持这种在函数中定义函数的用法，在栈上生成了代码，这种行为是极度不安全的。

## Reference
1. [Linker's warnings](https://www.redhat.com/en/blog/linkers-warnings-about-executable-stacks-and-segments)