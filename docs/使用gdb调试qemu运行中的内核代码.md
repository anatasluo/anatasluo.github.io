---
title: 使用gdb调试qemu运行中的内核代码
date: 2022-12-22 15:46:24
tags:
    - Linux
    - Qemu
    - GDB
    - Virsh

---


当前文章仅讨论gdb调试qemu中运行的linux内核，需要以下步骤：
1. 确认目标内核开启了相关编译选项
2. qemu加入gdb相关的启动参数
3. 关闭内核的内核地址随机化
4. 获取目标内核的debuginfo

## 确认目标内核开启了相关编译选项

这步没什么好说的，大部分发行版的内核都是支持的。

## qemu加入gdb相关的启动参数

通过virsh命令编辑qemu的xml文件，加入以下启动参数:
```
<domain type='kvm'
       xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0' >
     <qemu:commandline>
          <qemu:arg value='-s'/>
     </qemu:commandline>
```
或者
```
<qemu:commandline>
      <qemu:arg value='-gdb'/>
      <qemu:arg value='tcp::1235'/>
</qemu:commandline>
```

实际操作中发现，virt-manager修改无法生效，需要先dumpxml，再destroy，修改完之后再create.

## 关闭内核的内核地址随机化

通过修改内核的引导参数，加入"nokaslr"，启动后通过
```
cat /proc/cmdline
```
确认下是否顺利加入

## 获取当前内核的debuginfo

如果是自己编译的内核，直接拷贝相关的编译目录，使用其中的vmlinux即可。

如果是发行版的内核，使用以下命令获取debuginfo
```
yumdownloader --debuginfo kernel
```
解开rpm包之后，设置下gdb，开始使用即可。

## 过程中，如果需要切换内核，考虑以下办法

+ 修改grub引导
+ kexec

## Reference

+ [Debugging a kernel in QEMU/libvirt](https://www.redhat.com/en/blog/debugging-kernel-qemulibvirt)
