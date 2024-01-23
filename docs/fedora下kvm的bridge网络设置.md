---
title: fedora下kvm的bridge网络设置
tags:
  - Fedora
  - KVM
  - Network
date: 2024-01-24 18:34:36
---

## 概要

本文总结了，在fedora中使用kvm+libvirt的情况下，如何给host添加bridge设备，并且给guest配置网络。

本文使用的实验环境为fedora 38，该方法要求系统中安装了NetWorkManager。

## host配置

### 添加bridge设备

运行以下代码：
```
yum -y install bridge-utils
yum -y groupinstall "Virtualization Tools"
export MAIN_CONN=enp8s0
bash -x <<EOS
systemctl stop libvirtd
nmcli c delete "$MAIN_CONN"
nmcli c delete "Wired connection 1"
nmcli c add type bridge ifname br0 autoconnect yes con-name br0 stp off
#nmcli c modify br0 ipv4.addresses 192.168.1.99/24 ipv4.method manual
#nmcli c modify br0 ipv4.gateway 192.168.1.1
#nmcli c modify br0 ipv4.dns 192.168.1.1
nmcli c add type bridge-slave autoconnect yes con-name "$MAIN_CONN" ifname "$MAIN_CONN" master br0
systemctl restart NetworkManager
systemctl start libvirtd
systemctl enable libvirtd
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-ipforward.conf
sysctl -p /etc/sysctl.d/99-ipforward.conf
EOS
```

其中，enp8s0替换成自己环境中的网卡名称。如果是通过网络连接，写成脚本，一次性执行完，否则过程会提示断开链接。

必要的情况下，按照注释代码的写法，给br0配置ip和路由。


### 设置防火墙规则

```
iptables -I FORWARD -i br0 -j ACCEPT
iptables -I FORWARD -o br0 -j ACCEPT
```
其中，br0为bridge设备名称。

## Guest配置

网卡类型配置为bridge，如果开机后，dhcp没有运行，通过ip命令静态配置ip地址:
```
ip link set <device name> up
ip addr add <ip addr>/<length> dev <device name>
ip route add default via <ip addr>
```






