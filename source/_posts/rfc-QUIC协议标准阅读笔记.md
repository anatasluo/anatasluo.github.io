---
title: '[rfc]-QUIC协议标准阅读笔记'
date: 2021-09-23 17:28:54
tags:
    - RFC
    - QUIC
---


QUIC涉及到的RFC标准，包括RFC 8999，RFC 9000, RFC 9001, RFC 9002。

### RFC 8999

RFC 8999 标题是Version-Independent Properties of QUIC，规定了QUIC协议演进过程中不变的属性。

#### Package headers type

package headers 可以分为两类，分别为 long 和 short。

两种类型通过包的第一个字节的最高有效位进行区分，置位表示为long，否则为short。

#### Long header

long header 遵循以下布局：
```
   Long Header Packet {
     Header Form (1) = 1,
     Version-Specific Bits (7),
     Version (32),
     Destination Connection ID Length (8),
     Destination Connection ID (0..2040),
     Source Connection ID Length (8),
     Source Connection ID (0..2040),
     Version-Specific Data (..),
   }
```

#### Short header

short header 遵循以下布局：
```
   Short Header Packet {
     Header Form (1) = 0,
     Version-Specific Bits (7),
     Destination Connection ID (..),
     Version-Specific Data (..),
   }
```

#### Connection ID

区别于传统的TCP/UDP通过五元组来区分协议，QUIC协议中通过connection ID字段来区分一个链接。这一机制存在以下好处:
1. client的网络变动不需要重新建立链接，比如手机从蜂窝网络切换到无线网。
2. client和server可以充分利用多个udp链接。

按照我对内核代码的理解，这一模型也需要解释以下两个问题：
1. client发生网络迁移，是否会遇到NAT问题。当然，一般的server都是公网IP，但是如果QUIC协议未来运用到p2p场景下，这一问题就必须被解决。
2. 如果client发生了网络变迁，那IP就变化了。如果server绑定了IP，那有可能出现网络不可达。即使仍然可达，但是内核是根据五元组寻找对应的socket，然后进一步交给上层处理。此时IP变化，不存在对应的socket，最终将由listen态的socket进行处理，这一过程QUIC协议是如何处理的？(这个问题参考RFC 9000规定)

#### Version

QUIC协议的version字段占据四个字节。0x00000000用于表示，将进行版本协商。

#### Version Negotiation (版本协商)

如果一个节点收到一个long类型包，该节点发现它不支持包中描述的version，那么这个节点，就会发送一个Version Negotiation包。Short类型的包不会触发版本协商(short类型通常包含数据)。

Version Negion包一定是long类型，遵从以下格式:
```
   Version Negotiation Packet {
     Header Form (1) = 1,
     Unused (7),
     Version (32) = 0,
     Destination Connection ID Length (8),
     Destination Connection ID (0..2040),
     Source Connection ID Length (8),
     Source Connection ID (0..2040),
     Supported Version (32) ...,
   }
```
包的首字节仅有最高位有效，其余位处理时应该直接忽略。

版本协商过程中，包不会被进行完整性保护或者安全传输保护。特定版本的QUIC协议可能允许节点去检测包内所写的Supported Version列表是否被串改。

节点发送包的Destination Connection ID来自收到包的Source Connection ID，发送包的Source Connection ID由client随机选择，应该使用收到包的Destination Connection ID。(协议这里想表达的意思是，client选择自己的Connection ID，并与server达成一致，而后便使用达成一致的Connection ID通信。)

节点有可能在传输进行过程中，决定去改变版本，从而进行版本协商。传输过程中，何种条件下可以进行版本协商，由特定版本的QUIC协议进行规定。

#### 安全和隐私问题

中间人是有可能对QUIC协议的包进行跟踪。但是，version number不会出现在传输过程所有的包中，这对中间人窃取信息将带来一定阻拦。

版本协商过程中传输的包不会进行完整性保护，节点如果决定改变版本，必须验证包的内容含义。

#### 对QUIC协议的常见误解

**注意，以下表述均是错误的。**（部分我也没看明白，后续会单独列出解释。）

1. QUIC协议使用TLS，一些TLS信息在无线传输中是可见的。
2. QUIC协议的long header类型包仅在链接建立过程中使用。
3. 给定五元组上都会需要一个链接建立阶段。
4. 流上发出的第一个包是long header类型。
5. 长时间的静默之前的最后一个包可能只包含一个ACK。
6. QUIC协议使用安全算法去保护链接建立阶段传输的包。
7. QUIC协议的packet number是加密的，而且是第一个加密字符。
8. 每发一个包，QUIC协议的packet number就会加一。
9. QUIC协议规定了client发送第一个包的最小长度。
10.  QUIC协议规定由client发出第一个包。
11. QUIC包的首字节的第二最高有效位总是置位的。
12. 仅有server可以发起版本协商。
13. QUIC协议中的Connection ID很少变化。
14. 进行版本协商后，版本就会变化。
15. Long header类型的包中的Version字段都是一样的。
16. QUIC协议包中的Version字段表明对应的version正在使用。
17. 节点之间每次只能建立一个链接。

### RFC 9000

RFC 9000 的标题是QUIC: A UDP-Based Multiplexed and Secure Transport。
RFC 9000 是QUIC 1.0的标准说明。

stream 有两种，分别为bidirectional streams，用于双向通信；以及unidirectional streams，用于单向通信。

QUIC 1.0 协议中的server是不支持网络迁移的。

### RFC 9001

### RFC 9002

### QUIC 状态

### QUIC 环境部署及用法示例

### QUIC 抓包分析

### 参考

1. [RFC 8999](https://datatracker.ietf.org/doc/html/rfc8999)
2. [RFC 9000](https://datatracker.ietf.org/doc/html/rfc9000)
