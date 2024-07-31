---
title: Linux From Scratch实验过程记录
date: 2022-10-05 19:27:26
tags:
    - LFS
    - Linux
    - Qemu
    - Rootfs

---

Linux From Scratch(LFS)的项目主页，点击[此处](https://www.linuxfromscratch.org/)


对于一个成熟的发行版来说，通过包管理器，比如dnf，apt等，是可以生成一个可运行的系统镜像的(ISO)。LFS做的事情，就是把这个过程手动做了一遍，教程十分详细，本文记录一些操作过程中遇到的一些问题，以及LFS后续的一些使用。


## 常见问题和命令

1. 尽量使用web版本的教程，pdf上有些命令的显示存在残缺和格式问题。

2.  编译过程中，提示"/dev/null:1:8: error: unknown type name 'GNU'"

这个问题，是由于chroot过程中，没有挂载虚拟内核文件系统。

进入LFS文件系统的完整过程如下:
```
mkdir -pv $LFS/{dev,proc,sys,run}

mount -v --bind /dev/pts $LFS/dev/pts
mount -vt proc proc $LFS/proc
mount -vt sysfs sysfs $LFS/sys
mount -vt tmpfs tmpfs $LFS/run

if [ -h $LFS/dev/shm ]; then
  mkdir -pv $LFS/$(readlink $LFS/dev/shm)
fi

/usr/sbin/chroot "$LFS" /usr/bin/env -i   \
    HOME=/root                  \
    TERM="$TERM"                \
    PS1='(lfs chroot) \u:\w\$ ' \
    PATH=/usr/bin:/usr/sbin \
    /bin/bash --login

```

离开LFS环境后的清理过程如下:
```
exit

umount $LFS/dev/pts
umount $LFS/{sys,proc,run,dev}

```

3. 备份和还原LFS环境的命令
```
cd $LFS
tar -cJpf $HOME/lfs-temp-tools-11.2.tar.xz .
```

```
cd $LFS
rm -rf ./*
tar -xpf $HOME/lfs-temp-tools-11.2.tar.xz
```

4. 编译Man-DB中遇到"'html_pager' undeclared"

看了下源码，发现编译过程中，需要加入一个宏TROFF_IS_GROFF，推测跟GROFF的编译过程有关，手动设置下，这个问题就解决了。

后续还出现一个变量未定义的问题，也跟这个宏有关，直接删掉这个用于if的变量后。编译和运行就都没问题了，代码的含义没有深究，建议如果是生产用途，仔细研究下代码。

5. LFS环境占用的空间过大

把source目录下编译完成的源码删除。
去除调试信息。

经过以上两步，可以把LFS环境压缩到几百M。

## 将LFS环境用于qemu运行

1. 通过ramfs运行qemu

qemu运行命令如下
```
qemu-system-x86_64  -s -nographic -no-reboot -m 4G -kernel ./kernel/bzImage -initrd ./rootfs/rootfs.cpio.gz -append "nokaslr panic=1 HOST=x86_64 console=ttyS0"
```

将LFS环境生成cpio的命令
```
cd ./fs
find . | cpio -o -H newc | gzip > ../rootfs.cpio.gz
```

将cpio解压成LFS环境的命令
```
cd fs
gzip -dc ../rootfs.cpio.gz > rootfs.cpio
cpio -idmv < ./rootfs.cpio
```

这里需要注意内存的大小设置，如果小于rootfs的话，会提示"qemu: initrd is too large, cannot support"。如果大小超过rootfs，但是小于解压后的rootfs话，会在引导过程中提示"Initramfs unpacking failed: write error"。


2. 通过硬盘运行qemu

qemu运行命令如下
```
qemu-system-x86_64  -s -nographic -no-reboot -m 4G -kernel ./kernel/bzImage -hda ./rootfs/rootfs.img -append "panic=1 HOST=x86_64 console=ttyS0 root=/dev/sda rw"
```

将LFS环境生成img的命令
```
dd if=/dev/zero of=rootfs.img bs=1M count=4096
mkfs.ext4 rootfs.img
mkdir fs
sudo mount -t ext4 -o loop rootfs.img ./fs
```

对应的解除挂载命令
```
sudo umount fs
```

## 值得探索的几个点

1. 编译器如何在Build, Host, Target之间，生成最终的交叉编译器。

2. 如何解决libc和libgcc的相互依赖问题。

3. init程序

4. 包管理器

