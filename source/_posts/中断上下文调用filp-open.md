---
title: 中断上下文调用filp_open
date: 2022-12-22 15:47:25
tags:
  - Linux
  - Interrupt

---


问题的背景是在一段驱动代码中，调用了filp_open。
发现在某些场景下返回了-EACCES。

尝试过以下办法，均未奏效：
1. 修改文件的所有者，并且设置mod为777
2. 关闭selinux

通过GDB单点跟踪，最后发现filp_open会调用may_lookup，6.1版本的内核源码如下:
```
static inline int may_lookup(struct user_namespace *mnt_userns,
			     struct nameidata *nd)
{
	if (nd->flags & LOOKUP_RCU) {
		int err = inode_permission(mnt_userns, nd->inode, MAY_EXEC|MAY_NOT_BLOCK);
		if (err != -ECHILD || !try_to_unlazy(nd))
			return err;
	}
	return inode_permission(mnt_userns, nd->inode, MAY_EXEC);
}
```

在这一步里，会去检查filp_open是否会阻塞当前调用(MAY_NOT_BLOCK)，如果是单线程，则返回-ECHILD，可以确认不会阻塞；如果是多线程，则返回-EACCES。

而我使用该接口的场景是soft interrupt，众所周知，interrupt上下文是不能调用block api的。
