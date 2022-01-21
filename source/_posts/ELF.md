---
title: Linux ELF规范整理及其在live-patch中的应用
tags:
  - Linux
  - Live patch
  - ELF
  - Assembly

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

**Global Offset Table**

## program loading and dynamic linkingguonian

## c library

## ELF需要处理的核心问题
1. 内存如何分配
3. 如何保证安全性
	+ 对内存设置最小权限，比如text段通常不具备写权限。
	+ SHT_HASH的存在

## reference

1. [CMU/ELF](https://www.cs.cmu.edu/afs/cs/academic/class/15213-f00/docs/elf.pdf)




