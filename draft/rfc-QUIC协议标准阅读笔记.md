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

需要注意的是，QUIC 1.0 协议中的server是不支持网络迁移的。

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

####  Streams

stream 有两种，分别为bidirectional streams，用于双向通信；以及unidirectional streams，用于单向通信。

在同一个connection中，stream ID不允许复用。

stream ID的最低有效位表明了stream的发起人，0表示由client发起，1表示有server发起。
stream ID的第二个最低有效位表明了stream的单双向，0表示双向，1表示单向。

stream ID的两个最低有效位因此存在四种组合，对应四种stream type：
```
                +======+==================================+
                | Bits | Stream Type                      |
                +======+==================================+
                | 0x00 | Client-Initiated, Bidirectional  |
                +------+----------------------------------+
                | 0x01 | Server-Initiated, Bidirectional  |
                +------+----------------------------------+
                | 0x02 | Client-Initiated, Unidirectional |
                +------+----------------------------------+
                | 0x03 | Server-Initiated, Unidirectional |
                +------+----------------------------------+
```

#### 发送和接受数据

节点通过Stream ID和offset来使数据在stream frames中有序排列。

#### Stream优先级

QUIC协议不提供优先级信息交换的机制，其依赖于上层应用来提供优先级信息。

QUIC协议的实现应该提供机制来上层来说明对应stream的优先级，然后这些信息被用于如何分配资源激活stream。

#### Stream上可以进行的操作(API设计)

对于发送方：
1. 写入数据，并且感知到流控制机制允许该写入。
2. 结束流，将相应frame的FIN bit置位。
3. 流重置，如果stream当前不处于terminal状态，则发送RESET_STREAM frame。

对于接收方：
1. 读取数据
2. 结束读取，极有可能导致STOP_SENDING frame的发送

应用层需要感知到stream状态的变化，包括通信节点(peer)打开/重置流；通信节点中断流读取；当前节点可以读取新数据；数据由于流控制而无法被写入。

#### Stream state

对于一个Stream，节点有两种状态，一种是接收方，一种是发送方。

##### 发送方状态

```
          o
          | Create Stream (Sending)
          | Peer Creates Bidirectional Stream
          v
      +-------+
      | Ready | Send RESET_STREAM
      |       |-----------------------.
      +-------+                       |
          |                           |
          | Send STREAM /             |
          |      STREAM_DATA_BLOCKED  |
          v                           |
      +-------+                       |
      | Send  | Send RESET_STREAM     |
      |       |---------------------->|
      +-------+                       |
          |                           |
          | Send STREAM + FIN         |
          v                           v
      +-------+                   +-------+
      | Data  | Send RESET_STREAM | Reset |
      | Sent  |------------------>| Sent  |
      +-------+                   +-------+
          |                           |
          | Recv All ACKs             | Recv ACK
          v                           v
      +-------+                   +-------+
      | Data  |                   | Reset |
      | Recvd |                   | Recvd |
      +-------+                   +-------+
```
##### 接收方状态

```
          o
          | Recv STREAM / STREAM_DATA_BLOCKED / RESET_STREAM
          | Create Bidirectional Stream (Sending)
          | Recv MAX_STREAM_DATA / STOP_SENDING (Bidirectional)
          | Create Higher-Numbered Stream
          v
      +-------+
      | Recv  | Recv RESET_STREAM
      |       |-----------------------.
      +-------+                       |
          |                           |
          | Recv STREAM + FIN         |
          v                           |
      +-------+                       |
      | Size  | Recv RESET_STREAM     |
      | Known |---------------------->|
      +-------+                       |
          |                           |
          | Recv All Data             |
          v                           v
      +-------+ Recv RESET_STREAM +-------+
      | Data  |--- (optional) --->| Reset |
      | Recvd |  Recv All Data    | Recvd |
      +-------+<-- (optional) ----+-------+
          |                           |
          | App Read All Data         | App Read Reset
          v                           v
      +-------+                   +-------+
      | Data  |                   | Reset |
      | Read  |                   | Read  |
      +-------+                   +-------+
```

当一个流被创建的时候，所有同类型的，低序号的Stream ID都必须被创建，以保证两端之间的stream创建顺序是一致的。

MAX_STREAM_DATA帧的作用：当应用层需要更多的数据，节点就发送该类型的帧让通信对端发送更多的数据。

#### 双向流类型

一种简洁的双向流实现，是综合单向流中发送方和接收方的状态，以下是一种建议的状态组合：
```
      +===================+=======================+=================+
      | Sending Part      | Receiving Part        | Composite State |
      +===================+=======================+=================+
      | No Stream / Ready | No Stream / Recv (*1) | idle            |
      +-------------------+-----------------------+-----------------+
      | Ready / Send /    | Recv / Size Known     | open            |
      | Data Sent         |                       |                 |
      +-------------------+-----------------------+-----------------+
      | Ready / Send /    | Data Recvd / Data     | half-closed     |
      | Data Sent         | Read                  | (remote)        |
      +-------------------+-----------------------+-----------------+
      | Ready / Send /    | Reset Recvd / Reset   | half-closed     |
      | Data Sent         | Read                  | (remote)        |
      +-------------------+-----------------------+-----------------+
      | Data Recvd        | Recv / Size Known     | half-closed     |
      |                   |                       | (local)         |
      +-------------------+-----------------------+-----------------+
      | Reset Sent /      | Recv / Size Known     | half-closed     |
      | Reset Recvd       |                       | (local)         |
      +-------------------+-----------------------+-----------------+
      | Reset Sent /      | Data Recvd / Data     | closed          |
      | Reset Recvd       | Read                  |                 |
      +-------------------+-----------------------+-----------------+
      | Reset Sent /      | Reset Recvd / Reset   | closed          |
      | Reset Recvd       | Read                  |                 |
      +-------------------+-----------------------+-----------------+
      | Data Recvd        | Data Recvd / Data     | closed          |
      |                   | Read                  |                 |
      +-------------------+-----------------------+-----------------+
      | Data Recvd        | Reset Recvd / Reset   | closed          |
      |                   | Read                  |                 |
      +-------------------+-----------------------+-----------------+
```
#### 数据流控制

QUIC中存在两种类型的数据流控制：
1. Stream flow control，用于避免单个流过多侵占connection receive buffer的资源。
2. Connection flow control，用于避免发送方发送的数据超过接收方的处理能力。

接收方最开始通过设置握手期间传输层协议的参数来限制所有流的传输(限制2)。接着，接收方通过发送MAX_STREAM_DATA帧或者MAX_DATA帧给发送方来建议更大的限制。对于单个流的限制建议，则在MAX_STREAM_DATA帧上加上Stream ID。

如果发送者违反了流限制，则接收者必须以FLOW_CONTROL_ERROR标记的形式关闭connection。

当发送者因为流控制策略阻塞时，应该发送STREAM_DATA_BLOCKED/DATA_BLOCKED帧来让接收者感知到。如果发送者阻塞的时间超过idle超时周期，即使发送者仍然有数据等待发送，接收者可能会关闭connection。为了避免接收者关闭connection，发送者应该周期性的发送STREAM_DATA_BLOCKED/DATA_BLOCKED帧。

#### 并发控制

节点对通信对端(peer)能打开流的最大数目存在限制。只有Stream ID小于max_streams * 4 + first_stream_id_of_type的流才被允许创建。

Connection ID可以用于负载均衡。

多个connection不允许使用同个IP和PORT。(内核无法区分)

#### 简单负载均衡场景下的考虑

Connection迁移过程中，client的ip地址会发生变化，有可能导致client无法找到正确的server。

存在两种思路解决：
1. server使用带外管理机制(out-of-band mechanism)，根据Connection ID，把包发送到正确的地方。
2. 通过preferred_address之类的传输层参数，告知server已经发生的client的IP地址变化。

如果server没有实现机制去处理connection迁移，应该设置传输层的disable_active_migration参数。

#### 加密及传输层握手过程

```
   Client                                               Server

   Initial (CRYPTO)
   0-RTT (*)              ---------->
                                              Initial (CRYPTO)
                                            Handshake (CRYPTO)
                          <----------                1-RTT (*)
   Handshake (CRYPTO)
   1-RTT (*)              ---------->
                          <----------   1-RTT (HANDSHAKE_DONE)

   1-RTT                  <=========>                    1-RTT
```
  
#### connection迁移

QUIC协议要求在握手期间，节点的网络是稳定的。(即IP地址和端口不会变化)

#### frame 类型
```
    +============+======================+===============+======+======+
    | Type Value | Frame Type Name      | Definition    | Pkts | Spec |
    +============+======================+===============+======+======+
    | 0x00       | PADDING              | [Section 19.1](https://datatracker.ietf.org/doc/html/rfc9000#section-19.1)  | IH01 | NP   |
    +------------+----------------------+---------------+------+------+
    | 0x01       | PING                 | [Section 19.2](https://datatracker.ietf.org/doc/html/rfc9000#section-19.2)  | IH01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x02-0x03  | ACK                  | [Section 19.3](https://datatracker.ietf.org/doc/html/rfc9000#section-19.3)  | IH_1 | NC   |
    +------------+----------------------+---------------+------+------+
    | 0x04       | RESET_STREAM         | [Section 19.4](https://datatracker.ietf.org/doc/html/rfc9000#section-19.4)  | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x05       | STOP_SENDING         | [Section 19.5](https://datatracker.ietf.org/doc/html/rfc9000#section-19.5)  | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x06       | CRYPTO               | [Section 19.6](https://datatracker.ietf.org/doc/html/rfc9000#section-19.6)  | IH_1 |      |
    +------------+----------------------+---------------+------+------+
    | 0x07       | NEW_TOKEN            | [Section 19.7](https://datatracker.ietf.org/doc/html/rfc9000#section-19.7)  | ___1 |      |
    +------------+----------------------+---------------+------+------+
    | 0x08-0x0f  | STREAM               | [Section 19.8](https://datatracker.ietf.org/doc/html/rfc9000#section-19.8)  | __01 | F    |
    +------------+----------------------+---------------+------+------+
    | 0x10       | MAX_DATA             | [Section 19.9](https://datatracker.ietf.org/doc/html/rfc9000#section-19.9)  | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x11       | MAX_STREAM_DATA      | [Section 19.10](https://datatracker.ietf.org/doc/html/rfc9000#section-19.10) | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x12-0x13  | MAX_STREAMS          | [Section 19.11](https://datatracker.ietf.org/doc/html/rfc9000#section-19.11) | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x14       | DATA_BLOCKED         | [Section 19.12](https://datatracker.ietf.org/doc/html/rfc9000#section-19.12) | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x15       | STREAM_DATA_BLOCKED  | [Section 19.13](https://datatracker.ietf.org/doc/html/rfc9000#section-19.13) | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x16-0x17  | STREAMS_BLOCKED      | [Section 19.14](https://datatracker.ietf.org/doc/html/rfc9000#section-19.14) | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x18       | NEW_CONNECTION_ID    | [Section 19.15](https://datatracker.ietf.org/doc/html/rfc9000#section-19.15) | __01 | P    |
    +------------+----------------------+---------------+------+------+
    | 0x19       | RETIRE_CONNECTION_ID | [Section 19.16](https://datatracker.ietf.org/doc/html/rfc9000#section-19.16) | __01 |      |
    +------------+----------------------+---------------+------+------+
    | 0x1a       | PATH_CHALLENGE       | [Section 19.17](https://datatracker.ietf.org/doc/html/rfc9000#section-19.17) | __01 | P    |
    +------------+----------------------+---------------+------+------+
    | 0x1b       | PATH_RESPONSE        | [Section 19.18](https://datatracker.ietf.org/doc/html/rfc9000#section-19.18) | ___1 | P    |
    +------------+----------------------+---------------+------+------+
    | 0x1c-0x1d  | CONNECTION_CLOSE     | [Section 19.19](https://datatracker.ietf.org/doc/html/rfc9000#section-19.19) | ih01 | N    |
    +------------+----------------------+---------------+------+------+
    | 0x1e       | HANDSHAKE_DONE       | [Section 19.20](https://datatracker.ietf.org/doc/html/rfc9000#section-19.20) | ___1 |      |
    +------------+----------------------+---------------+------+------+
```
  
### RFC 9001

### RFC 9002


### 参考

1. [RFC 8999](https://datatracker.ietf.org/doc/html/rfc8999)
2. [RFC 9000](https://datatracker.ietf.org/doc/html/rfc9000)
