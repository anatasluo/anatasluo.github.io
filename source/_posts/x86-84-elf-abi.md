---
title: X86_64 ELF abi阅读笔记
date: 2022-12-22 15:48:14
tags:
  - X86_64
  - ABI
  - ELF

---

参考的文档查看[此处](https://refspecs.linuxbase.org/elf/x86_64-abi-0.99.pdf)

### Code Models

因为不同的寻址模式所要求的限制不一样，而不同的限制所要求的性能损耗不一样。因此，为了最大程度上优化性能，在不同的场景下会使用不同的模式。当前AMD64定义了以下几种code models:
1. Small code model
Virtual address在链接阶段就已经确认下来，并且所有符号的地址从0到（$2^{31}$- $2^{24}$ - 1），即从0x00000000到0x7effffff。具体寻址范围，取决于使用偏移的方式。

这是效率最高的寻址模式，适用于绝大多数情况。

2. Kernel code model
Kernel通常很小，并且一般在地址空间的高半部分运行。因此，我们定义所有的符号地址范围为（$2^{64}$- $2^{31}$）- （$2^{64}$- $2^{24}$），即从0xffffffff80000000到0xffffffffff000000。
该模式拥有与smal model类似的优点，只是具体作用的偏移不一样。

3. Large code model
Large code model对于address和section size都不做限制，这个模式对性能的损耗很大，只有在其他模式无法满足情况下，才会采用。

4. Medium code model
在该模式下，data section会被分为两部分，分别使用small code model和large code model。程序的内存布局必须采用一种方式，使得large data sections（.ldata .lrodata .lbss）在text和data section之后出现。

5. Small position independent code model (PIC)
PIC的特性要求符号的virtual virtual到dynamic link time才能确定，允许的最大寻址offset为（$2^{31}$- $2^{24}$ - 1），即0x7effffff。

6. Large position independent code model (PIC)
参照3和5

8. Medium position independent code model (PIC)
参照3和4

-------

使用large model的ELF file可能会对目标section设置SHF_X86_64_LARGE。

为了解决偏移过大时的数据存取和函数调用问题，出现了GOT和PLT机制。


### 符号表和栈解析
STT_GNU_IFUNC： ifunc相关的符号类型

.eh_frame section记录了用于unwinding stack的信息。
.eh_frame可能由多个section组成，大致可以分为CIE(Common Information Entry)和FDEs(Frame Descriptor Entry)

与栈解析有关的section flag： SHT_X86_64_UNWIND
与栈解析有关的segment flag:  PT_GNU_EH_FRAME / PT_SUNW_EH_FRAME / PT_SUNW_UNWIND

在汇编语言层面，提供一些指令用于支持栈解析和debug information:
.cfi_startproc
.cfi_endproc
.cfi_def_cfa REGISTER, OFFSET
.cfi_def_cfa_register REGISTER
.cfi_def_cfa_offset OFFSET
.cfi_adjust_cfa_offset OFFSET
.cfi_offset REGISTER, OFFSET
.cfi_rel_offset REGISTER, OFFSET
.cfi_escape EXPRESSION[, ...]

### 重定向

_GLOBAL_OFFSET_TABLE_有可能位于.got section的中间部分，从而同时允许对于偏移数组的正向和负向寻址。

一般来说，GOT机制用于处理数据(地址)访问，PLT机制用于处理函数跳转。

动态链接器处理GOT和PLT表格的过程：
1. 当第一次创建程序的内存空间时，动态链接器会将GOT表格的第二项和第三项设置为特别的值。
2. 在内存空间里的每个shared object文件都有自己的PLT表格，控制权只会从同一个object文件中跳转到PLT表格。
3. 为了方便举例，假设程序调用了name1，将控制权转给了label .PLT1。
4. 程序开始从.PLT1开始执行(jmp xxx)，第一次时.PLT1从GOT表格读取的地址是下一条pushq指令，而不是真正的name1地址，因此程序直接跳转到下一条指令。
5. 现在程序把一个relocation index压入栈中，这个relocation index是一个32-bit，非负的index。这个index与relocation table里的一个entry关联，这个关联的entry类型为R_X86_64_JUMP_SLOT，这个entry的offset就是之前jmp xxx里的xxx所在的地址，这个entry关联的符号就是name1。
6. 压入relocation index之后，程序就会跳转到.PLT0，也就是PLT表格的第一项，这里的pushq指令会把GOT+8的value放入栈中，从而给动态链接器一种标记信息。接着，程序会跳转到GOT+16，将控制权交给动态链接器。
7. 当动态链接器获取控制权之后，它会解开栈，根据栈里的信息，将name1的地址放到GOT里正确的位置。
8. 接下来的程序执行到.PLT1时，会直接跳转到目标函数执行。

环境变量LD_BIND_NOW可以立即开始这一绑定过程(处理类型为R_X86_64_JUMP_SLOT的重定向)，带来的代价就是启动时间的增加。



在small和medium model里，当PLT和GOT同时引用同一个function symbol时，一般情况下，linker会在PLT里创建一个GOTPLT slot，在GOT里创建一个GOT slot。一个runtime JUMP_SLOT重定向会被创建，用来更新对应的GOTPLT slot。一个runtime GLOB_DAT重定向会被创建去更新GOT slot。在runtime时，JUMP_SLOT和GLOB_DAT重定向都会使用同样的symbol value去更新GOTPLT和GOT slot。
作为一个优化，linker可能会把GOTPLT slot和GOT slot合并成一个GOT slot，并且移除JUMP_SLOT重定向。这种优化会把以下常规的PLT entry:
```
.PLT: 	jmp [GOTPLT slot]
		pushq relocation index
		jmp .PLT0
```
借助GOT slot通过间接跳转替换成一个GOT PLT enrty：
```
.PLT: 	jmp [GOT slot]
		nop
```
然后，把PLT的引用解析到GOT PLT entry。间接跳转指令是5个字节，剩余的部分用nop指令填充。在这种优化中，指针比较是必须要避免的。否则，有可能会导致binary在运行时进入死循环。
