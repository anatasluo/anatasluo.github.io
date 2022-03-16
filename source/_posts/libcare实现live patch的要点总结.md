
---
title: libcare实现live patch的要点总结
date: 2022-02-23 16:13:30
tags:
    - Libcare
    - Live patch

---

libcare是一个用户态的live patch解决方案，项目地址在[这里](https://github.com/cloudlinux/libcare)

### live patch的一般原理

不考虑libcare的实现，live patch实现包含以下过程：
1. 生成live patch --> diff-binary
2. 解析live patch --> 符号引用/重定向
3. 打入live patch --> 栈检测/插入jmp指令

关键要点在于解决以下问题：
1. 如何解决live patch对原有地址空间的符号引用
2. 如何解析原有地址空间的符号信息
3. 如何将live patch注入到原有地址空间，并执行
4. 如何识别新拉起的进程是否需要打入补丁
5. 如何管理进程上的多个补丁以及补丁间的依赖关系

下面将以libcare为例，对以上过程进行具体分析。

### 制作live patch

libcare的实现主要是针对C语言，live patch的生成过程，本质是对打补丁前后生成的binary进行对比，找到差异部分，找到变化的变量和函数，以section为单位

这里又有几个关键问题需要解决：
1. 如何对两个binary进行对比(diff-binary)
2. 如何解决补丁对原有ELF的符号引用

具体的过程可以参考libcare自己的[文档](https://github.com/cloudlinux/libcare/blob/master/docs/internals.rst)

### 解析live patch

Live patch制作完成后，是一个特殊的重定向文件。

解析过程需要解决的问题：
1. 为live patch分配内存--> 内存地址尽可能靠近被修改的函数
2. 解析原有地址空间里的符号地址

#### 为live patch分配内存

libcare读取目标进程proc目录下的smaps文件，获取目标进程的内存分布。根据内存分配，生成一个hole list，从hole list中选取一块足够大且最靠近修改函数的地址。

#### 解析原有地址空间的符号地址

1. 获取目标进程的内存分布
2. 通过proc目录下的mem直接读取目标进程的内存内容
3. 尝试对各段内存的头部进行解析，如果是ELF文件，获取对应的符号信息

### 打入patch

这一步要解决的问题：
1. 栈检测 --> 确保打入时，没有进程正在运行修改函数(实际上大部分情况下新旧函数一起运行也是可以的)。
2. 修改函数入口，加入jmp指令。


### 总结

Libcare的live patch主要借助ptrace和proc文件实现
1. 通过ptrace停止进程，进行代码注入
2. 通过/proc/[pid]/smaps读取内存分配
3. 通过/proc/[pid]/mem读取和修改进程内存

Libcare的补丁管理比较简单
1. 补丁的文件名有一个生成规则(buildID有关)
2. 打补丁之前，看下有无旧补丁
3. 新进程拉起的识别问题，暂时没看到libcare有解决
