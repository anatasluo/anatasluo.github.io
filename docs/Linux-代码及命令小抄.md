---
title: Linux-代码及命令小抄
date: 2022-10-19 18:14:01
tags:
    - Linux
    - Code Snippt
---

#### GCC从标准输入中读取源码并且编译
```
echo "void main(){}" | gcc -v -x c -
```
这种用法可以参考criu中的try-cc，用途是用来检测系统以及GCC的一些参数支持。

通过这种办法生成的object，在其debug信息中，会显示如下内容：
```
<12>   DW_AT_name        : (indirect line string, offset: 0x1b): <stdin>
```
表示gcc编译的源码来自标准输入。

#### [kernel-module]filename --> unlink对应的文件
```
static int unlink_filename(const char *filename)
{
    struct file *filp;
    struct inode *parent_inode;
    struct user_namespace *user_ns;
    int ret;

    filp = filp_open(filename, O_RDONLY, 0);
    if (IS_ERR(filp))
        return PTR_ERR(filp);
    
    user_ns = mnt_user_ns(filp->f_path.mnt);
    
    parent_inode = filp->f_path.dentry->d_parent->d_inode;
    inode_lock(parent_inode);
    ret = vfs_unlink(user_ns, parent_inode, filp->f_path.dentry, NULL);    
    inode_unlock(parent_inode);

    return ret;
}
```

#### [kernel-module]oldname + newname --> 创建soft link

```
/* check init_symlink for more info */
static int create_symlink(const char *oldname, const char *newname)
{
	struct dentry *dentry;
	struct path path;
	int error;

    /* we do not care about its return value */
    unlink_filename(newname);

    dentry = kern_path_create(AT_FDCWD, newname, &path, 0);
	if (IS_ERR(dentry))
		return PTR_ERR(dentry);

	error = vfs_symlink(mnt_user_ns(path.mnt), path.dentry->d_inode,
		dentry, oldname);
	done_path_create(&path, dentry);
	return error;
}
```