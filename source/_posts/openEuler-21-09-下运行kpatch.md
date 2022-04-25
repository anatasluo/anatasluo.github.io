---
title: openEuler 21.09 下运行kpatch
date: 2022-04-25 01:43:44
tags:
    - openEuler
    - Linux
    - Kpatch

---


## 测试环境及说明

openEuler 21.09 (x86_64)
kpatch (version v0.9.6)

需要说明的是，社区版本的kpatch对openEuler仅仅做了十分有限的支持，来自这个[提交](https://github.com/dynup/kpatch/commit/eaaced1912c43103749366927daff5794ea4f404)。

openEuler实现了两种打补丁策略，CONFIG_LIVEPATCH_PER_TASK_CONSISTENCY=y时，openEuler支持社区的per-task策略；CONFIG_LIVEPATCH_STOP_MACHINE_CONSISTENCY=y时，openEuler使用stop machine策略。

关于这两种策略的提交记录，参考[这里](https://mailweb.openeuler.org/hyperkitty/list/kernel@openeuler.org/message/MANDE5M5NQ3WRQSSW7WCIECNF67WPP75/)。

这两种策略是互斥的，不同opeEuler kernel版本默认启用的策略不一样。

我在自己的分支上，实现了kpatch对openEuler 21.09的支持，相关PR在[这里](https://github.com/dynup/kpatch/pull/1263)。

测试的补丁文件为0001-kpatch-test.patch
```
From cff0bb0b98b156b2fd27f45af292e3f9649cac23 Mon Sep 17 00:00:00 2001
From: anatasluo <anatasluo@localhost.localdomain>
Date: Sun, 24 Apr 2022 10:30:49 +0800
Subject: [PATCH] kpatch test

---
 fs/proc/version.c | 1 +
 1 file changed, 1 insertion(+)

diff --git a/fs/proc/version.c b/fs/proc/version.c
index b449f18..ad10ef7 100644
--- a/fs/proc/version.c
+++ b/fs/proc/version.c
@@ -8,6 +8,7 @@
 
 static int version_proc_show(struct seq_file *m, void *v)
 {
+	seq_printf(m, "It is version secret %d", 88);
 	seq_printf(m, linux_proc_banner,
 		utsname()->sysname,
 		utsname()->release,
-- 
2.30.0

```

## 测试准备工作

1. 准备openEuler 21.09的运行环境

镜像可以从[此处](https://repo.openeuler.org/openEuler-21.09/ISO/x86_64/)获得

2. 查看/boot目录下的对应config文件是否使能了CONFIG_LIVEPATCH_PER_TASK_CONSISTENCY

如果没有使能，通过以下命令获取源码，重新编译。

```

yumdownloader --source kernel-5.10.0-5.10.0.24.oe1.x86_64

rpm -D '_topdir /home/anatasluo/buildroot' -ivh ./kernel-5.10.0-5.10.0.24.oe1.src.rpm

rpmbuild -D '_topdir /home/anatasluo/buildroot' -bp --nodeps --target=x86_64 /home/anatasluo/buildroot/SPECS/kernel.spec

```

其中，5.10.0-5.10.0.24.oe1.x86_64是kernel的版本号，/home/anatasluo/buildroot是任意工作目录，请替换成自己环境参数。

执行结束后，/home/anatasluo/buildroot/BUILD/kernel-*目录下会出现kernel的源码，如果有多个目录，多个目录内容一样，选择一个使用即可。

将/boot目录下的config拷贝到源码目录里，make menuconfig修改livepatch相关配置，保证CONFIG_LIVEPATCH_PER_TASK_CONSISTENCY=y。

执行内核编译命令

```
make LOCALVERSION=-5.10.0.24.oe1.x86_64 -j28
make modules_install
make install
```
5.10.0.24.oe1.x86_64与当前环境的内核版本有关，请替换成当前环境里的参数。

3. 将以下内容添加到/etc/yum.repos.d/openEuler.repo末尾
```
[source-update]
name=source-update
baseurl=https://repo.openeuler.org/openEuler-21.09/update/source/
enable=1
gpgcheck=0
```


## 测试过程

1. 下载源码
```
git clone https://github.com/anatasluo/kpatch
cd kpatch
```

2. 安装相关依赖
```
source ./test/integration/lib.sh
kpatch_dependencies
```

3. 编译kpatch
```
make
```

4. 生成补丁
```
./kpatch-build/kpatch-build 0001-kpatch-test.patch
```

0001-kpatch-test.patch内容在前文。

执行结束后，当前目录会出现livepatch-0001-kpatch-test.ko。

5. 测试补丁效果

```
sudo insmod livepatch-0001-kpatch-test.ko
cat /proc/version
```
