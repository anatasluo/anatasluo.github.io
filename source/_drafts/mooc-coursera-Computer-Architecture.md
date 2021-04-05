---
title: '[mooc-coursera]Computer Architecture'
date: 2020-12-20 16:51:41
tags:
    - Mooc
    - Coursera
    - Computer Architecture
---

## about mooc

[Computer Architecture](https://www.coursera.org/learn/comparch/home/welcome)

## note from book

+ [Computer Architecture A Quantitative Approach - Patterson and Hennessy(fifth edition)](https://anatasluo.github.io/2020/12/21/ckiymajc40001a4zc3285cvia/)
+ [Modern Processor Design Fundamentals of Super-scalar Processors](https://anatasluo.github.io/2020/12/21/ckiyrkqot0000nrzc0s8qdp74/)

## week-1

Abstractions in Modern Computing Systems:
-> Application
-> Algorithm
-> Programming Language
-> Operating System / Virtual Machines
-> Instruction Set Architecture(ELE 475)
-> Microacrhitecture(ELE 475)
-> Register-Transfer Level(ELE 475)
-> Gates
-> Circuits
-> Devices
-> Physics


Architecture/Instruction Set Architecture:
-> Programmer visible state(Memory & Register)
-> Operations(Instructions and how they work)
-> Exection Semantics(interrupts)
-> Input/Output
-> Data Types/Sizes

Microarchitecture/Organization:
-> Tradeoffs on how to implement ISA for some metric(Speed, Energy, Cost)
-> Examples: Pipeline depth, number of pipelines, cache size, silicon area, peak power, execution ordering, bus widths, ALU widths

IBM 360: explain why bytes are 8-bits long today.

Machine Model Summary:
-> Stack
-> Accumulator
-> Register - Memory
-> Register - Register

Classes of instructions:
-> Data Transfer
-> ALU
-> Control Flow
-> Floating Point
-> Multimedia(SIMD)
-> String

Addressing Modes:
-> Register
-> Immediate
-> Displacement
-> Register Indirect
-> Absolute
-> Memory Indirect
-> PC relative
-> Scaled

Data Types and Sizes:
-> Types
    - Binary Integer
    - Binary Coded Decimal(BCD)
    - Floating Point
    - Packed Vector Data
    - Addresses
-> Width
    - Binary Integer(8/16/32/64 bit)
    - Floating Point(32/40/64/80 bit)
    - Adresses(16/24/32/48/64 bit)

ISA Encoding:
-> Fixed Width(RISC)
    - Easy to decode
-> Variable Length(CISC)
    - Take less space in memory and caches
-> Mostly Fixed or Compressed
    - MIPS16/THUMB
-> (Very) Long Instruction Word(VLIWs)
    - Mutiple instructions in a fixed width bundle
    - Ex: Multiflow, HP/ST Lx, TI C6000


Reference:

+ [https://en.wikipedia.org/wiki/Byte](byte)
