---
title: 'initrd, initramfs, rootfs'
date: 2021-02-21 06:15:10
tags:
    - Linux
    - Initrd
    - Initramfs
    - rootfs
---


这篇博客主要阐述initrd，initramfs，rootfs之间的关系，内容主要总结自Linux(5.12)源码中的文档/Documentation/filesystems/ramfs-rootfs-initramfs.rst


## ramfs

ramfs，就如名字所表示的那样，这是基于内存的文件系统。

## ramfs and ramdisk

ram disk是早期Linux使用的一种机制，使用内存来模拟一个块设备，并将这个块设备挂载为文件系统。这一机制的优势在于，使用内存完全模拟了一个存储设备的行为。但是缺点也特别明显。首先是，文件系统的大小是固定的。其次是，在此类文件系统的操作过程中，存在不必要的内存拷贝行为。最严重的是，这个文件系统需要相关的驱动进行挂载和解释。


## ramfs and tmpfs


ramfs的一个缺点就是，ramfs会一直写入内存，直到没有内存可以使用。

tmpfs是ramfs中的一种，tmpfs的优势在于：tmpfs增加了大小的限制；允许将数据写入到交换区；普通用户也能写入tmpfs的挂载点。

## rootfs

rootfs是一种特殊的ramfs实例，rootfs自2.6之后便一直存在。rootfs是无法卸载的，就像init进程无法被kill一样。大部分系统会直接通过rootfs挂载其他文件系统。如果CONFIG_TMPFS被开启，那么rootfs将使用tmpfs，而不是ramfs。如果要强制使用ramfs，就在cmdline中加入"rootfstype=ramfs"。


## initramfs

从2.6内核开始，内核都包含一个压缩的cpio文件，在内核启动的时候，这个文件会被解压成rootfs。解压之后，内核会去检查根目录下是否存在init文件，如果存在，就作为1号进程执行。这个进程负责系统剩余的拉起工作，包括寻找并挂载真正根文件设备。如果init不存在，内核会使用以前的方式，首先找到一个root分区，然后寻找类似/sbin/init作为init进程。

initramfs和旧的initrd区别在于：

1. initrd总是一个单独的文件，而initramfs可以被链接到kernel镜像中(initramfs总是存在的，initrd不是必须的)
2. initrd是特定的一个文件系统，比如ext2，因此需要kernel有相应的驱动。initramfs是一个压缩的cpio文件，解压十分容易。这部分解压代码在kernel启动之后，会被丢弃掉
3. initrd做完准备工作后，会返回kernel继续运行。initramfs一般不会返回，但是init可以挂载新的root设备，然后执行另一个init程序
4. 当进行root设备切换时，initrd会进行pivot_root，然后卸载ramdisk。但是initramfs是rootfs，我们可以pivot_root rootfs，也可以进行卸载。相比于删掉rootfs来释放空间，initramfs可以挂载新的root，然后执行其他的init程序

