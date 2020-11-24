---
title: Linux下如何执行buffer中的一段代码
date: 2020-11-23 17:47:30
tags:
    - Linux
    - Assembly Language
    - Memory
---


linux中，存在一个系统调用mprotect，可以修改一段内存的权限信息，一般情况下，数据段是不可以执行的，通过mprotect，可以赋予数据段以执行权限，再将一段逻辑实现拷贝到该数据段中，通过函数指针跳转，从而执行该数据段中的代码，以下为实现部分:

两个源码文件，分别为main.c和test.S

test.S的内容为：
```
.code64
.align 0x1000
.text
.global test
.type test, @function

test:
    pushq   %rbp
    movq    %rsp, %rbp
    movl    $22, %eax
    popq    %rbp
    ret
```

main.c的内容为
```
#include <stdio.h>
#include <errno.h>
#include <string.h>
#include <sys/mman.h>

int test(void);

int main()
{
    int ret;
    int (*p)(void);
    void *code;

    code = mmap(0, 0x1000, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (code == MAP_FAILED) {
        printf("mmap failed, errno is %d \n", errno);
        return -errno;
    }

    ret = mprotect(code, 0x1000, PROT_EXEC | PROT_WRITE);
    if (ret == -1) {
        printf("mprotect failed, errno is %d \n", errno);
        return -errno;
    }

    ret = test();
    if (ret != 22)
        return -EINVAL;
    puts("execute assembly successfully");

    memcpy(code, test, 0x1000);

    p = code;
    ret = p();
    if (ret != 22)
        return -EINVAL;
    puts("execute buffer successfully, end here");
    return 0;
}
```

编译用的cmake文件为:
```
cmake_minimum_required(VERSION 3.16)
project(ACM C ASM)
set(CMAKE_C_STANDARD 99)
set_source_files_properties(test.S PROPERTIES COMPILE_FLAGS "-x assembler-with-cpp")
add_executable(ACM main.c test.S)
```

运行结果如下:
```
execute assembly successfully
execute buffer successfully, end here
```

gdb调试可以加入以下指令，进行查看:
```
display /20i $pc
```