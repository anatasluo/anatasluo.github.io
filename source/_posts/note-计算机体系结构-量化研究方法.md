---
title: '[note]计算机体系结构:量化研究方法'
date: 2020-12-21 13:49:11
tags:
    - Computer Architecture
    - Note
---

## chapter 1: 量化设计与分析基础

计算机分类:
+ 个人移动设备(PMD)
+ 桌面计算机(PC)
+ 服务器
+ 集群/仓库级计算机
+ 嵌入式计算机

> PMD经常被看做嵌入式计算机，但我们仍然把它们看作不同的类别。这是因为PMD是一些可以运行外部开发软件的平台，与桌面计算机存在诸多共同特征。其他嵌入式设备在硬件和软件复杂性上存在很大的限制。我们以是否能运行第三方软件作为区分嵌入式和非嵌入式的分界线。

应用程序的并行度分类:
+ 数据级并行(DLP)
+ 任务级并行(TLP)

计算机硬件实现并行的方式:
+ 指令级并行(借助流水线之类的实现)
+ 向量体系结构和图形处理器(GPU)
+ 线程级并行
+ 请求级并行

Michael Flynn在1966年提出的并行分类分类方式:
+ 单指令流、单数据流(SISD)
+ 单指令流、多数据流(SIMD)
+ 多指令流、单数据流(MISD)
+ 多指令流、多数据流(MIMD)

计算机体系结构的定义: 指令集体系结构 + 组成(微体系结构) + 硬件

技术趋势:
+ 集成电路逻辑技术
+ 半导体DRAM
+ 半导体闪存
+ 磁盘技术
+ 网络技术

整体上，带宽的改进要比延迟的改进更为重要(带宽的改进速度至少是延时的改进速度的平方)

能耗趋势:
+ 峰值功率
+ 持续功率(TDP)
    冷却效率需要不低于此功率，现在处理有两种办法去散热 - 降频和散热装置
+ 以能耗度量
    动态能耗计算公式 - 1/2 x 容性负载 x 电压<sup>2</sup>
    动态功率计算公式 - 1/2 x 容性负载 x 电压<sup>2</sup> x 开关频率

## appendix A: 指令集基本原理

指令集体系结构的分类:
+ 寄存器-存储器体系结构
+ 载入-存储体系结构
+ 存储器-存储器体系结构(不存在对应工业成品)

+ 变长编码
+ 定长编码
+ 混合编码(ARM Thumb)

## appendix C: 流水线基础与中级概念

RISC指令的五级流水线：
+ Instruction fetch cycle(IF)
+ Instruction decode/register fetch cycle(ID)
+ Execution/effective address cycle(EX) -- ALU
+ Memory access(EM)
+ Write-back cycle(WB)

流水线之间的平衡，流水线化带来的开销以及流水线的延迟会限制流水线的深度(Amdahl's law)

Pipeline Hazards:
+ Structural hazards
  + Schedule
  + Stall - Stop until resource is available
  + Duplicate - Add more hardware resources
+ Data hazards
  + Schedule
  + Stall
  + Bypass - allow values to be sent to an earlier stage
  + Speculate
+ Control hazards
  + 冻结/冲刷流水线
  + 分支预测，将未选中分支变为空操作(出现延迟分支 - branch delay slot) -> 编译器进行优化利用

分支预测：
+ 静态分支预测(利用先前运行过程中收集的一览数据)
+ 动态分支预测(对分支地址的低位部分进行索引并记录)

## reference

+ [磁盘、内存、闪存、缓存等物理存储介质的区别](https://blog.csdn.net/qq_34567703/article/details/76736564)

## problem

1. 每条指令执行的时间是否对等?
   时钟周期和流水线的时间是相等的，不同指令需要的时钟周期不一样;对于未采用流水线的体系结构来说，每条指令执行的时间是一样的，且CPI时间很长

2. 流水线过程中如何避免相互干扰？
  + 寄存器通过边沿触发
  + 存在连接流水线的额外寄存器
  + 见Pipeline Hazards的解决办法