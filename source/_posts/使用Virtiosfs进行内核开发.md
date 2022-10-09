---
title: 使用Virtiofs进行内核开发
date: 2022-10-09 15:13:24
tags:
    - Linux
    - Rootfs
    - Virtiosfs
    - dnf
    - Fedora

---

## 环境准备

通过qemu运行linux时，只有两个东西是必须的，分别是编译出来的kernel和rootfs。

kernel直接从源码中，编译生成，编译命令：
```
make -j 8 && make -j 8 modules && make -j 8 modules_install && make -j 8 install
```

通过包管理器可以直接生成一个可用的rootfs，以fedora/dnf为例，以下命令可以生成一个rootfs
```
dnf --installroot=$PWD/virtio-fs-root --releasever=36 install system-release vim-minimal systemd passwd dnf rootfiles
```
其中，--releasever指明了fedora的版本，--installroot指明了安装目录，可以看需要，添加自己需要的软件到安装列表中。
rootfs生成后之后，通过chroot和passwd修改登录密码。

virtiofs的优点在于，在qemu拉起guest之后，host和guest可以同时修改一个目录，避免了频繁拉起。

virtiofs的运行要求：
1. 编译出来的guest kernel必须支持virtiofs
2. qemu必须支持virtiofs(>=6.2.0)
3. virtiofs守护程序(virtiofsd)

对于第1个要求，kernel编译的时候，打开virtiofs相关的config即可。

对于第2个要求，尝试更新qemu的系统版本，如果无法成功，直接用以下命令编译一个新的qemu
```
git clone https://gitlab.com/virtio-fs/qemu.git
../configure --prefix=$PWD --target-list=x86_64-softmmu
make -j 8
make -j 8 virtiofsd
```

对于第3个要求，当前只能从源码编译生成[virtiofsd](https://gitlab.com/virtio-fs/virtiofsd)。
或者直接下载官网编译好的release版本，见[此处](https://gitlab.com/virtio-fs/virtiofsd/-/releases)

## 运行virtiofs

1. 运行virtiofsd
```
virtiofsd --socket-path=/tmp/anatasluo -o source=fedora-fs -o cache=none
```
其中，fedora-fs是通过virtiofs要挂载给guest的目录

2. 添加kernel启动参数，修改qemu启动参数，完整参数如下:
> qemu-system-x86_64 -s -M pc -cpu host --enable-kvm -smp 2 -kernel ./kernel/bzImage -m 4G -object memory-backend-file,id=mem,size=4G,mem-path=/dev/shm,share=on -numa node,memdev=mem -append "panic=1 HOST=x86_64 console=ttyS0 rootfstype=virtiofs root=myfs rw" -chardev socket,id=char0,path=/tmp/anatasluo -device vhost-user-fs-pci,queue-size=1024,chardev=char0,tag=myfs -chardev stdio,mux=on,id=mon -mon chardev=mon,mode=readline -device virtio-serial-pci -device virtconsole,chardev=mon -vga none -display none


注意，修改相关的目录到自己的路径下。


## 常见问题

1. virtiofsd提示"Error creating sandbox: No such file or directory (os error 2)"

检查下virtiofsd的source文件夹是否存在

2. 进入rootfs后，一直提示"Login incorrect"

检查下rootfs目录的权限，尝试用sudo运行，如何可以。退出后，通过chown修改rootfs目录权限，再次运行时可以不使用sudo。

3. 进入guest后，mount操作时，提示"unknown filesystem type 'virtiofs'"

在guest里，运行以下命令
```
cat /proc/filesystems
```
查看支持的文件系统中是否有"virtiofs"，没有的话需要修改.config，重新编译内核。

## Reference
1. [virtio-fs - Standalone virtiofs usage](https://virtio-fs.gitlab.io/howto-qemu.html)
2. [virtio-fs - How to boot from virtiofs](https://virtio-fs.gitlab.io/howto-boot.html)
