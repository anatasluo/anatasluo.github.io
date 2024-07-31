---
title: 如何对inode结构执行mmap操作
tags:
  - Linux
  - VFS
date: 2022-01-20 15:34:36

---


## struct inode, struct dentry, struct file

![inode, dentry, file之间的关系](https://miro.medium.com/max/502/1*Hg1I1fJVItCe_WvIiJEriA.png)

1. struct file是对打开文件的抽象，每个进程都有一个fd table，一个fd对应一个struct file
2. struct dentry是对文件系统里一个路径的抽象，即一个逻辑文件。(目录是一种特殊的文件)
3. struct inode是对磁盘里一个文件的抽象，即一个物理文件。
4. 多个struct file可以指向同一个struct dentry，即一个文件被多次打开。
5. 多个struct dentry可以指向同一个struct inode，即文件系统中有不同路径链接到同一个物理文件。

## 如何对一个struct inode执行mmap操作

1. kernel里执行mmap操作的API是vm_mmap，vm_mmap操作的对象是struct file。
2. 获得一个struct file的API是filp_open，filp_open接受的是一个path。
3. 每一个path都对应一个struct dentry，一个struct inode对应多个struct dentry。

以下代码，仅考虑映射struct inode对应的文件(如果需要指定路径，则需要多一个遍历过程):
```
struct file *d_open_inode(struct inode *inode)
{
    struct  dentry *alias;
    char *name = __getname(), *p;
    struct  file *d_file = NULL;

    if (hlist_empty(&inode->i_dentry))
	    return NULL;
	
    spin_lock(&inode->i_lock);
    alias = hlist_entry(inode->i_dentry.first, struct dentry, d_u.d_alias);
    p = dentry_path_raw(alias, name, PATH_MAX);
    if (IS_ERR(p)) {
        goto  out_unlock;
    }

    d_file = filp_open(p, O_RDWR, 0);
out_unlock:
    __putname(name);
    spin_unlock(&inode->i_lock);
    return d_file;
}
```
