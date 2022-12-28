---
title: openEuler 22.03-LTS下使用nvwa说明
date: 2022-12-28 09:58:22
tags:
  - Linux
  - OpenEuler

---

本文详细说明了openEuler 22.03 LTS环境下通过nvwa备份和恢复nginx的过程

## 准备工作

1. 确认安装的系统版本并且关闭selinux

运行以下命令
```
cat /etc/os-release
```

输出应该为
```
NAME="openEuler"
VERSION="22.03 LTS"
ID="openEuler"
VERSION_ID="22.03"
PRETTY_NAME="openEuler 22.03 LTS"
ANSI_COLOR="0;31
```

关闭selinux
```
sudo setenforce Permissive 
```
更新selinux配置
```
vim /etc/selinux/config
```
修改以下配置项
```
SELINUX=permissive
```


2. 安装nvwa并确认版本

注意，当前22.03-LTS的update源还没有更新最新的nvwa版本，本周会进行更新(2022-12-31)。

一般情况下的nvwa安装命令
```
sudo dnf install nvwa -y
```

2022-12-31号之前，可以通过以下命令安装最新的版本
```
sudo dnf install criu kexec-tools -y
wget http://121.36.84.172/dailybuild/EBS-openEuler-22.03-LTS-SP1/release_openeuler-2022-12-28-01-06-03/everything/aarch64/Packages/nvwa-0.2-3.oe2203sp1.aarch64.rpm
sudo rpm -ivh nvwa-0.2-3.oe2203sp1.aarch64.rpm
```

确认nvwa的版本
```
rpm -qi nvwa
```

确认nvwa的version和Release不低于0.2-2，输出如下
```
[root@openEuler ~]# rpm -qi nvwa
Name        : nvwa
Version     : 0.2
Release     : 3.oe2203sp1
Architecture: aarch64
```

运行nvwa
```
sudo systemctl enable nvwa
sudo systemctl start nvwa
```

3. 安装并运行nginx
```
sudo dnf install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

4. 修改nginx的临时目录配置
```
vim /usr/lib/systemd/system/nginx.service
```
将
```
PrivateTmp=true
```
修改为
```
PrivateTmp=false
```

更新systemd配置并且重新运行nginx:
```
sudo systemctl daemon-reload
sudo service nginx restart
```

5. 设置nvwa的配置，要求nvwa去保存和恢复nginx

```
vim /etc/nvwa/nvwa-restore.yaml
```
修改为
```
pids:
services:
  - nginx
restore_net: false
enable_quick_kexec: false
enable_pin_memory: false
enbale_debug_mode: true
```

6. 确认nvwa/nginx的运行状态，并开始运行nvwa

确认服务状态
```
service nvwa status
service nginx status
```

开始运行nvwa
```
nvwa update $(uname -r)
```

7. 确认nginx的恢复状态
```
service nginx status
```

8. 确认nvwa的恢复状态
```
service redis status
```
确保有如下输出:
```
Dec 28 12:29:51 openEuler systemd[1]: Starting NVWA server...
Dec 28 12:29:52 openEuler nvwa[9465]: time="2022-12-28T12:29:52+08:00" level=debug msg="Wait criu runs finished \n"
Dec 28 12:29:52 openEuler nvwa[9465]: time="2022-12-28T12:29:52+08:00" level=debug msg="0:0 process(es) restore suceessfu>
Dec 28 12:29:52 openEuler systemd[1]: Started NVWA server.
Dec 28 12:29:54 openEuler nvwa[9465]: time="2022-12-28T12:29:54+08:00" level=debug msg="nvwa restore nginx 6449 \n"
Dec 28 12:29:54 openEuler nvwa[9465]: time="2022-12-28T12:29:54+08:00" level=debug msg="Get pid file for nginx - /run/ngi>
Dec 28 12:29:56 openEuler nvwa[9465]: time="2022-12-28T12:29:56+08:00" level=debug msg="Restore service nginx successfull
```
