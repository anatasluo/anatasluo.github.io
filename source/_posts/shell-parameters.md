---
title: shell执行命令时参数传递过程
date: 2022-05-25 00:43:44
tags:
    - Bash
    - Linux
    - Execve

---

考虑以下代码 *main.c* ：
```
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[], char *envp[])
{
    int i;
    argc += 0x88;
    printf("I am running here 0x%lx \n", argv);
    for (i = 0; i < argc; i ++) {
        printf("arg [%d]: %s \n", i, argv[i]);
    }
    for (char **env = envp; *env != 0; env++) {
        printf("env: %s \n", *env);
    }
    return 0;    
}
```

编译之后，运行:
```
gcc main.c -o main
VAR=VALUE ./main arg1 arg2
```

结果输出为:
```
/ # VAR=VALUE ./main arg1 arg2
I am running here 0x7ffda5290e68 
arg [0]: ./main 
arg [1]: arg1 
arg [2]: arg2 
env: SHLVL=2 
env: HOME=/ 
env: VAR=VALUE 
env: TERM=linux 
env: HOST=x86_64 
env: PWD=/
```

## 问题：包括环境变量在内的参数是如何最终传递到main函数里的？

大体上，参数传递分为三部分：
1. shell传递给内核的sys_execve系统调用
2. sys_execve系统调用放入新进程的栈中
3. ELF的入口函数逐步传递到main函数中

本文的测试环境为：Linux longcc 5.17.7-200.fc35.x86_64 #1 SMP PREEMPT Thu May 12 14:56:48 UTC 2022 x86_64 x86_64 x86_64 GNU/Linux

### shell传递给内核的sys_execve系统调用

以[bash代码](https://github.com/bminor/bash)为例，这部分的调用过程为
-> main
    -> reader_loop
        -> execute_command
            -> ...
                -> execve

execve的原型为: int execve(const char *pathname, char *const argv[], char *const envp[]);

shell构造参数的过程，这里就不记录了。

### sys_execve系统调用放入新进程的栈中

这部分比较复杂，与Linux的ELF加载过程有关，本文的例子调用过程为：
do_execve -> do_execveat_common -> bprm_execve -> exec_binprm -> search_binary_handler

当进入内核态的系统调用时，调用参数和环境变量的指针存储在内核页中，但对应的内容存储在用户态页中。

接着，通过copy_strings，所有的参数和环境变量被复制到bprm结构中，此时，所有的内容都存储在内核页中。

在后面的调用过程中，begin_new_exec将确保仅有一条线程，同时通过exec_mmap对内存地址空间进行替换，旧有的映射关系将被全部丢弃。

search_binary_handler需要按照文件格式，查找对应的加载函数，接下来的过程为：
load_elf_binary -> start_thread

start_thread会进入ELF设置entry point执行， start_point的函数原型为: start_thread(struct pt_regs *regs, unsigned long new_ip, unsigned long new_sp)

进程的栈构造过程看load_elf_binary实现就比较清晰，大致结构如下:
```
    ------------------------------------------------------------- 0x7fff6c845000
     0x7fff6c844ff8: 0x0000000000000000
            _  4fec: './stackdump\0'                      <------+
      env  /   4fe2: 'ENVVAR2=2\0'                               |    <----+
           \_  4fd8: 'ENVVAR1=1\0'                               |   <---+ |
           /   4fd4: 'two\0'                                     |       | |     <----+
     args |    4fd0: 'one\0'                                     |       | |    <---+ |
           \_  4fcb: 'zero\0'                                    |       | |   <--+ | |
               3020: random gap padded to 16B boundary           |       | |      | | |
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|       | |      | | |
               3019: 'x86_64\0'                        <-+       |       | |      | | |
     auxv      3009: random data: ed99b6...2adcc7        | <-+   |       | |      | | |
     data      3000: zero padding to align stack         |   |   |       | |      | | |
    . . . . . . . . . . . . . . . . . . . . . . . . . . .|. .|. .|       | |      | | |
               2ff0: AT_NULL(0)=0                        |   |   |       | |      | | |
               2fe0: AT_PLATFORM(15)=0x7fff6c843019    --+   |   |       | |      | | |
               2fd0: AT_EXECFN(31)=0x7fff6c844fec      ------|---+       | |      | | |
               2fc0: AT_RANDOM(25)=0x7fff6c843009      ------+           | |      | | |
      ELF      2fb0: AT_SECURE(23)=0                                     | |      | | |
    auxiliary  2fa0: AT_EGID(14)=1000                                    | |      | | |
     vector:   2f90: AT_GID(13)=1000                                     | |      | | |
    (id,val)   2f80: AT_EUID(12)=1000                                    | |      | | |
      pairs    2f70: AT_UID(11)=1000                                     | |      | | |
               2f60: AT_ENTRY(9)=0x4010c0                                | |      | | |
               2f50: AT_FLAGS(8)=0                                       | |      | | |
               2f40: AT_BASE(7)=0x7ff6c1122000                           | |      | | |
               2f30: AT_PHNUM(5)=9                                       | |      | | |
               2f20: AT_PHENT(4)=56                                      | |      | | |
               2f10: AT_PHDR(3)=0x400040                                 | |      | | |
               2f00: AT_CLKTCK(17)=100                                   | |      | | |
               2ef0: AT_PAGESZ(6)=4096                                   | |      | | |
               2ee0: AT_HWCAP(16)=0xbfebfbff                             | |      | | |
               2ed0: AT_SYSINFO_EHDR(33)=0x7fff6c86b000                  | |      | | |
    . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .        | |      | | |
               2ec8: environ[2]=(nil)                                    | |      | | |
               2ec0: environ[1]=0x7fff6c844fe2         ------------------|-+      | | |
               2eb8: environ[0]=0x7fff6c844fd8         ------------------+        | | |
               2eb0: argv[3]=(nil)                                                | | |
               2ea8: argv[2]=0x7fff6c844fd4            ---------------------------|-|-+
               2ea0: argv[1]=0x7fff6c844fd0            ---------------------------|-+
               2e98: argv[0]=0x7fff6c844fcb            ---------------------------+
     0x7fff6c842e90: argc=3
```

事实上，当新进程从entry point开始执行时，此时的栈称为Initial process Stack。Initial process Stack的内存分布在[此处](https://refspecs.linuxbase.org/elf/x86_64-abi-0.99.pdf)进行了规定。

### ELF的入口函数逐步传递到main函数中
这部分转递过程都是通过寄存器完成的，看汇编就很清晰了。
如果ELF是动态链接的，大致过程为entry point of ld-linux -> _start(entry point of libc) -> __libc_start_main -> main
如果是静态链接的，则没有第一步interpreter的处理。

其中_start的参数，参考内核的start_thread

__libc_start_main的函数原型为: LIBC_START_MAIN (int (*main) (int, char **, char ** MAIN_AUXVEC_DECL), int argc, char **argv)

有意思的一个地方，main可以有不同的参数个数，生成的汇编也是不一样的。

## 拓展结论

如果通过某种手段劫持ELF的entry point，修改参数(env + arg)需要以下过程:
1. 重新设置stack结构，保留原内容的同时，塞入新参数
2. 修改进程的寄存器，确保entry point函数读取到的是新的SP
3. 修改mm_struct里的一堆参数，包括arg_start等等

大体上，就是重新实现了一遍create_aout_tables，这个思路与内核的实现高度耦合。

## 参考

1. [linux内核exec过程 ](https://www.cnblogs.com/likaiming/p/11193697.html)

2. [ELF binaries](https://lwn.net/Articles/630727/)

3. [ELF binaries](https://lwn.net/Articles/631631/)

4. [System V ABI](https://refspecs.linuxbase.org/elf/x86_64-abi-0.99.pdf)
