---
title: Linux ELF规范整理
tags:
  - Linux
  - Live patch
  - ELF
  - Assembly
date: 2022-01-28 18:34:36

---

## Object Files

Three types:
1. relocatable file --> need to link
2. executable file --> exec uses it to create image
3. shared object file

**Linking View**

```
ELF header
-------------------------------
Program header table optional
-------------------------------
Section 1
-------------------------------
...
-------------------------------
Section n
-------------------------------
...
-------------------------------
...
-------------------------------
Section header table
-------------------------------
```

Sections hold the bulk of object file information for linking view: instructions, data, symbol table, relocation information, and so on.

**Execution View**

```
ELF header
-------------------------------
Program header table
-------------------------------
Segment 1
-------------------------------
Segment 2
-------------------------------
...
-------------------------------
Section header table optional
```
Segment是从在ELF执行时看到的内存视图，此时的Segment跟权限有关。ARM下是两个Segment，X86下是四个，mprotect在修改权限的过程中，会导致新Segment的出现(本质是split vma)。

在ELF规范中，仅有ELF header是有固定位置的，其余的信息被ELF header描述。program header的作用是告诉内核如何创建process，section header table的作用是在linking阶段用于描述一个section。

**Data Representation**

|Name|Size|Alignment|Purpose|
|--|--|--|--|
|Elf32_Addr|4|4|Unsigned program address|
|Elf32_Off|4|4|Unsigned file offset|
|Elf32_Sword|4|4|Signed large integer|
|Elf32_Word|4|4|Unsigned large integer|
|Elf32_Half|2|2|Unsigned medium integer|
|unsigned char|1|1|Unsigned small integer|

**Sections**

Special Section Indexes:
1. SHN_UNDEF(0) marks an undefined, missing, irrelevant, or otherwise meaningless section reference.
2. SHN_LORESERVE(0xff00) lower bound of the range of reserved indexes.
3. SHN_LOPROC(0xff00) - SHN_HIPROC(0xff1f) inclusive range are reserved for processor-specific.
4. SHN_ABS(0xfff1) - absolue values for the corresponding reference.
5. SHN_COMMON(0xfff2) - common symbols, such like unallocated C external variables.
6. SHN_HIRESERVE(0xffff) - upper bound of the range of reserved indexes

Special Sections(part):
+ .bss
+ .comment
+ .data/.data1
+ .debug
+ .dynamic (dynamic linking information)
+ .dynstr
+ .dynsym
+ .fini
+ .got (global offset table)
+ .hash (symbol hash table)
+ .init (executable instructions for initialization)
+ .interp
+ .line (symbolic debugging)
+ .note
+ .plt (procedure linkage table)
+ .relname/.relaname (relacation information for one section)
+ .rodata/.rodata1
+ .shstrtab
+ .text

Section name with a dot (.) prefix are reserved for the system.

**Symbol Table**

Relocation，是指对symbol table进行重定向。

Symbol Table Entry:
+ st_name -> an index
+ st_value -> value of the associated symbol
+ st_size
+ st_info -> symbol's type and binding attributes
+ st_other -> no special meanthing
+ st_shndx -> relevant section header table index

Symbol Binding:
+ STB_LOCAL
+ STB_GLOBAL
+ STB_WEAK
+ STB_LOPROC through STB_HIPROC

Symbol Types:
+ STT_NOTYPE -> not specified
+ STT_OBJECT -> data object
+ STT_FUNC -> function/executable code
+ STT_SECTION
+ STT_FILE
+ STT_LOPROC through STT_HIPROC

Special Section index:
+ SHN_ABS -> an absolute value
+ SHN_COMMON -> a common block
+ SHN_UNDEF -> need to be resolved

Procedure linkage table是为了解决objects之间func object引用的问题。

**Relocation**

Elf32_Rel:
+ r_offset
+ r_info

Elf32_Rela:
+ r_offset
+ r_info
+ r_addend

r_offset: the location at which to apply the relocation action
r_info: releated symbol table index and type of relocation to apply (low 8 bits)
r_addend: a constant addend used to compute the value to be stored into the relocatable field

**Relocation Types**
A: r_addend
B: mmap base address
G: the offset into the global offset table
GOT: address of the global offset table
L: the place of the procedure linkage table entry
P: r_offset
S: the value of the symbol

| Name | Value | Field | Calculation |
|--|--|--|--|
| R_386_NONE | 0 | none | none |
| R_386_32 | 1 | word32 | S+A |
| R_386_PC32 | 2 | word32 | S+A-P |
| R_386_GOT32 | 3 | word32 | G+A-P |
| R_386_PLT32 | 4 | word32 | L+A-P |
| R_386_COPY | 5 | none | none |
| R_386_GLOB_DAT | 6 | word32 | S |
| R_386_JMP_SLOT | 7 | word32 | S |
| R_386_RELATIVE | 8 | word32 | B+A |
| R_386_GOTOFF | 9 | word32 | S+A-GOT |
| R_386_GOTOC | 10 | word32 | GOT+A-P |

## program loading and dynamic linking

Type为SHT_NOTE的section用于记录一些auxiliary information，该section有固定的格式。

为了做到延迟加载，对segment的地址进行页对齐是必要的。

Interperter(dynamic linker)接收控制权的两种方法：
1. receive a file descriptor
2. load the executable file into memory

Interperter的作用，实际上是将一部分工作从OS中解耦出来，由OS之外的部分来定义和维护，包括：
1. 将ELF的memory segments添加至进程
2. 将shared object的memory segments添加至进程
3.  进行relocation动作
4. 清理现场，比如关闭打开的ELF fd
5. 将控制权转移给program，看起来就像是从kernel直接接过控制权一样(保持透明)

Special sections from the link editor:
+ .dynamic section / SHT_DYNAMIC -> addresses of other dynamic linking information
+  .hash / SHT_HASH -> symbol hash table
+ .got(.plt) / SHT_PROGBITS

**Dynamic Section**

如果object文件参与dynamic linking过程，其program header table中将有一个类型为PT_DYNAMIC的section。这个section包含了一个数组，以键值对的形式描述了一系列信息。

**Global offset table**

Global offset table redirects position-independent address calculations to absolute locations.

**Procedure linkage table**

Procedure linkage table redirects position-independent function calls to absolute locations.

**Steps of the dynamic linker**
```
.PLT0:pushl 4(%ebx)
	jmp *8(%ebx)
	nop; nop
	nop; nop
.PLT1:jmp *name1@GOT(%ebx)
	pushl $offset
	jmp .PLT0@PC
.PLT2:jmp *name2@GOT(%ebx)
	pushl $offset
	jmp .PLT0@PC
...
```

1. the dynamic linker sets the second and the third entries in the global offset table to special values.
2. 如果procedure linkage table是PIC的，global offset table的地址必须放在ebx寄存器。每个shared object file都有自己的procedure linkage table。
3. 假设program调用了name1，控制权将转移给lable .PLT1.
4. 跳转到GOT中name1对应的地址，第一次运行时，会直接运行到下一条push指令。
5. 这个offset是一个relocation offset(在relocation table中的一个偏移)，该relocation entry的type将是R_386_JMP_SLOT，relocation entry的offset将是*GOT*对应entry的位置，需要解析的位置就是name1的地址。
6. 接着，program跳到.PLT0，此时，将把第二个GOT entry的位置放入栈中(用作dynamic的标识信息)。然后，跳入third GOT entry，将控制权转移给dynamic linker。
7. 当dynmaic linker获得控制权后，dynamic linker将从栈中获取到参数，计算出name1的地址，将地址写入到GOT表中，将控制权转移给目标函数。
8. 后续的name1调用，将直接进入对应函数，无需再次进入dynamic linker，就是说.PLT1中的地址，已经被改成了目标函数地址。(此处的直接，仍然是进入PLT表，再直接进入GOT指明的地址。)


LD_BIND_NOW环境变量的值，将决定是否要将PLT的relocation过程推迟到第一次使用的时候。

**Hash Table**

nbucket/nchain

## c library

C library包含的符号列表(略)。

## ELF需要处理的核心问题
1. 内存如何分配
3. 如何保证安全性
	+ 对内存设置最小权限，比如text段通常不具备写权限。
	+ SHT_HASH的存在

## Q&A
1. API和ABI的区别
API的函数调用的规范，开发者在代码开发时，需要知道这一信息，应该传递哪些参数，以及应当获得什么样的结果，以及对错误结果的说明。

ABI是对编译器而言，一个进程由不同的ELF组成，这些ELF是分别编译的，在进行函数调用时，应该如何去读取参数，是去stack中读取，还是去register中读取，哪些register由调用者保护，哪些又是由被调用者保护。

总结下，区别是，API是代码编写层面的规范，ABI是汇编生成阶段的规范。共同点是，都是为了解决不同object之间的函数调用问题。

2. Global offset table和Procedure linkage table的区别

Global offset table记录的是符号的绝对地址。

Procedure linkage table记录的是函数的绝对地址，用于函数跳转。

共同点：都是为了解决编译时无法确定地址的问题，通过一层跳转，将地址计算推迟到load stage。
不同点：GOT本质上是一个symbol table，PLT也是记录的地址，但是GOT是键值对，即纯粹只记录了地址，而PLT不仅记录了地址，而通过相关指令进行了jmp动作。GOT承担的是索引功能，PLT本身是text段的一部分。

总的来说，最终的地址修改都是在对GOT表生效的，而PLT的作用则是控制权的转移。

## reference

1. [CMU/ELF](https://www.cs.cmu.edu/afs/cs/academic/class/15213-f00/docs/elf.pdf)
2. [What is ABI](https://www.section.io/engineering-education/what-is-an-abi/)


