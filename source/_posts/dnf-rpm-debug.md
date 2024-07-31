---
title: dnf包管理系统中debug包的使用
date: 2022-11-03 00:01:35
tags:
    - dnf
    - debug
    - yumdownloader
  
---

对于某个包，dnf除了发布用于日常运行的rpm之外，还提供了以下三种用于维测场景的包：
1. source rpm
2. debugsource rpm
3. debuginfo rpm

以redis为例，以下四条命令用于下载不同类型的包：
```
yumdownloader redis
yumdownloader --source redis
yumdownloader --debugsource redis
yumdownloader --debuginfo redis
```

获取到四个rpm包，分别为:
1. redis-6.2.7-1.fc35.x86_64.rpm
2. redis-6.2.7-1.fc35.src.rpm
3. redis-debugsource-6.2.7-1.fc35.x86_64.rpm
4. redis-debuginfo-6.2.7-1.fc35.x86_64.rpm

通过rpm -qlp <xxx.rpm>可以查看对应rpm包里的内容

## redis-6.2.7-1.fc35.x86_64.rpm
主要包括的文件为：
```
/usr/bin/redis-benchmark
/usr/bin/redis-check-aof
/usr/bin/redis-check-rdb
/usr/bin/redis-cli
/usr/bin/redis-sentinel
/usr/bin/redis-server
...
```

## redis-6.2.7-1.fc35.src.rpm
包括的文件为:
```
macros.redis
redis-6.2.7.tar.gz
redis-doc-3fdb6df.tar.gz
redis-limit-systemd
redis-sentinel.service
redis-shutdown
redis.logrotate
redis.service
redis.spec
```

source rpm用于指导生成binary rpm，一个source rpm可以生成多个binary rpm。source rpm的作用，就是将上游发布的源码，通过rpm的方式进行管理和发布。

source rpm通常包括:
1. 上游发布的源码，一般是某种类型的压缩包
2. 补丁文件，适应性的一些修改
3. 配置文件
4. spec文件，用于指导构建过程

## redis-debugsource-6.2.7-1.fc35.x86_64.rpm

debugsource包含了对应binary包的源码

## redis-debuginfo-6.2.7-1.fc35.x86_64.rpm
主要包括的文件为:
```
/usr/lib/debug/.build-id/e1/1ff8dbe598e32dd7fbe1fb6bd57f5ad84bebc5.debug
/usr/lib/debug/.dwz
/usr/lib/debug/.dwz/redis-6.2.7-1.fc35.x86_64
/usr/lib/debug/usr
/usr/lib/debug/usr/bin
/usr/lib/debug/usr/bin/redis-benchmark-6.2.7-1.fc35.x86_64.debug
/usr/lib/debug/usr/bin/redis-cli-6.2.7-1.fc35.x86_64.debug
/usr/lib/debug/usr/bin/redis-server-6.2.7-1.fc35.x86_64.debug
```
debugsource包提供了dwarf格式的debug information。

## Reference
1. [source rpm](https://blog.packagecloud.io/working-with-source-rpms/)
2. [source rpm](https://fedoramagazine.org/how-rpm-packages-are-made-the-source-rpm/)
3. [debug rpm](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/developing_c_and_cpp_applications_in_rhel_8/debugging-applications_developing-applications)