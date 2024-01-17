---
title: HTTP3(QUIC)-HTTP发展历史整理
date: 2022-01-15 16:43:01
tags:
  - HTTP
  - QUIC
  - Network
---

## PPT链接

+ [QUIC protocol.pdf](pdf/quic演示.pdf)

+ [QUIC protocol.pptx](pdf/quic演示.pptx)

## 总结

1. website的特点是资源较多，这些资源包括js脚本，html文件，css文件等等，这些资源大小不一，大部分都是几M左右，且相互之间存在依赖关系。

2. HTTP的发展历史，就是逐步解决HOL(Head of line)问题的过程，HTTP/2支持multiplexing，在应用层解决了这个问题。HTTP/3使用udp取代TCP，在传输层解决了这个问题。

3. HTTP协议最初的设计极不专业，且相比于HTTP1.0出现的年代，网络环境已经发展了极大的变化，尤其是移动网络的崛起。

4. HTTP/3吸收了若干年以来网络协议的改造成果，算是集大成者。包括DTLS，ECN，SCTP等等。

5. QUIC在低延迟，低丢包的环境下，效率低于TCP，且存在包的超发。QUIC协议并不是要取代TCP协议，尽管QUIC协议将来可能有HTTP之外的应用场景。

6. QUIC协议版本众多，当前涉及到的RFC有：RFC 8009/RFC 9000/RFC 9001/RFC 9002。

