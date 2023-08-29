---
title: Linux修改进程使用资源限制办法
date: 2023-08-29 17:02:21
tags:
  - Linux
  - ulimit
---

## 问题描述

ebpf运行显示没有权限，查阅log后发现是因为lock memory大小的限制。因此，准备通过ulimit -l的方式来修改大小。使用普通用户时，显示没有权限。加入sudo运行后，则修改没有生效。

## 解决办法

需要明确的是，按照man page的说法:
> Resource  limits are per-process attributes that are shared by all of the threads in a process.

也就是说，这个限制是进程为单位的，我个人理解，这个limit conf是进程拉起时，从session继承过来的。因此sudo无法生效的原因在于sudo会拉起一个新的shell，不会改变当前shell的配置。

遇到这种情况，有两种办法:

第一种办法，就是在程序内部，通过syscall自己修改自己的limit。

代码如下:
```
static int setup_env()
{
    struct rlimit lck_mem = {};
    lck_mem.rlim_cur = RLIM_INFINITY;
    lck_mem.rlim_max = RLIM_INFINITY;
    if (setrlimit(RLIMIT_MEMLOCK, &lck_mem) == -1)
        return -errno;
    return 0; 
}
```

第二种办法，就是直接修改整个系统的limit配置，修改/etc/security/limits.conf即可。