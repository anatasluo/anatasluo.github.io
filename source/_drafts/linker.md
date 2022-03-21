 Linker histroy

```
a linker converts object files into executables and shared libraries.
```
早期的linker程序用于从多个重定向文件中，生成一个可执行文件。

```
Shared libraries were invented as an optimization for virtual memory systems running many processes simultaneously.
```

最早的shared library要求加载到固定虚拟内存地址(SVR3)

在SVR4中，对shared libary进行了改进，在程序开始时，自动运行一个限制版本的linker，来处理shared library。这个限制版本的linker被称之为dynamic linker(区别于 programmer linker) -> also works in runtime now。

Basic Linker Data Types
+ symbols -> variable
+ relocations -> "set this location in the contents to the value of this symbol plus this addend"
+ contents

relocations are inherently dependent on the architecture of the processors (how its memory model works)

Working process:
1. read the input object files, determine the length and type of the contents
2. read symbols, build a symbol table containing all symbols, linking undefined symbols to their definitions
3. decide where all contents should go in the output executable file
4. apply relocations
5. optionally write out the complete symbol table

--------------------


Address space:

1. every input object file is a small address space: the contents have addresses, and the symbols and relocations refer to the contents by addresses.
2. the output program will be placed at some location in memory --> virtual memory addresses 这种地址是编译时，预安排的地址，此时程序还没有真正执行。
3. the output program will be loaded  at some location in memory --> load memory address 程序真正执行时，使用到的内存地址，大部分情况下，load memory address和virtual memory address是一致的。但存在一些例外情况，比如在嵌入式系统中，initialized data首先被加载进ROM(load memory address)，然后被加载到RAM（virtual memory address）

shared library通常需要工作在不同的虚拟地址，shared library有一个base address的概念，在编译的时候，base address通常为0。运行的时候，获取到地址后，再进行重定向。重定向的数目必须尽可能的少，因为重定向会消耗初始化时间。

--------------------

Object file formats:
assembler的工作就是将人类可读的汇编语言变成object文件(机器语言)
linker的工作就是将object文件变成executable file。
逻辑上，object file跟executable file不需要有什么关联，实际设计中，这两是高度类似的(ELF的不同type)

object file可以分为两类：record oriented + section oriented

Records  oriented是定义了一系列大小各异的records，每一个record都以特殊的code开始，也可能伴随着data。这类文件需要从头开始读，并且处理每一个遇到的record。records用来描述符号和sections。重定向可能与section有关，也可能与其他records有关。IEEE-695和Mach-O是当下使用的这类object file。

Section oriented是一系列的section table + 一定数目的section。当下流行的ELF，COFF，PE，a.out都是此类格式。


调试信息是编译器产生的，用于帮助定位。linker在一些性能要紧的场景下，需要理解，并且移除这些信息。

a.out object file format在符号表中用特殊的字符串存储debug information，称之为stabs(特殊类型的symbol)。这种技术被各种版本的ECOFF，以及老一点版本的Mach-O使用。

(a.out是类unix系统中一种比较古老的object file format)

COFF使用符号表的特殊filed存储debugging information，这类信息是受限的，对于C++是完全不够的。一种常用的解决限制办法是，将这些stabs string包裹在COFF section中。

ELF object file将debug information存储在特殊名字的section中。这些debug information可以是stabs strings或者DWARF debugging format。


--------------------

shared library:

Windows的shared library(DLLs)，灵活性比较低，在源码中也要标明符号的可见性。部分DLL的特点已经被ELF吸收，ELF在link time做的工作要更多，要比DLL更加灵活。

Shared library在编译的时候，无法确定要运行的内存地址，因此其产生的代码是PIC的(position independent code)。同时，PIC的代码需要进行重定向，需要花费一定的启动时间。

另外一个复杂之处在于，ELF shared library设计之处，是被看做一般的archives文件。这就意味着，运行过程中，shared libray中的符号可能会被改写。

PIC代码的问题在于，将PIC代码放入shared library时，program linker会产生很多的relocation information，会导致启动时间增加。

 PIC代码通过-fpic选项产生。PIC代码运行会变慢，当PIC代码调用non-static function或者使用了global/static变量。但是，这一用法需要更少的relocation information，因此dynamic linker可以花费更少的时间。

PIC代码通过PLT(Procedure Linkage Table)调用non-static function，PLT在object file中不占据空间，PLT的信息存储在一类特别的relocation中，当program linker处理PLT信息时，相关的entry会在PLT表中被创建出来。调用通过PC-relative的形式完成，PC-relative代码本来就是PIC的，无需重定向。PC-relative是一种有效减少relocation information的方法。

PLT表格可以延迟绑定，通过LD_BIND_NOW环境变量来控制。延迟绑定，对于使用C库这种存在大量PLT调用的，可以有效降低启动时间。

Global offset table(GOT) is used for global and static variables.

PLT and GOT don't exist in an object file, they are created by the program linker. The program linker will create the dynamic relocations which the dynamic linker will use to initialize the GOT at runtime. Unlike the PLT, the dynamic linker always fully initializes the GOT when the program starts.

GOT usage: --> relocations type is GLOB_DAT
```
call __i686.get_pc_thunk.bx  
add $offset,%ebx
```
The function `__i686.get_pc_thunk.bx` simply looks like this:
```
mov (%esp),%ebx  
ret
```

PLT usage: --> allocate an entry in the GOT for each entry in the PLT (JMP_SLOT)
```
jmp *offset(%ebx)  
pushl #index  
jmp first_plt_entry
```

PLT解析的过程中，需要存储解析出的符号地址在GOT表中。

PIC代码由于不需要relocation，因此启动更快。但是作为代价，PIC需要配合PLT/GOT工作，因此运行更慢。


----------------------------

```
However, note that a PC relative relocation to a global symbol does require a dynamic relocation; otherwise, the main executable would not be able to override the symbol.
```
```
Note that it is possible for a single symbol to have both a PLT entry and a GOT entry; this will happen for position independent code which both calls a function and also takes its address.
```

Function address in shared libraries are actually the address of the PLT entry?


`SHN_COMMON`(0xfff2) -> a common symbol -> handle Fortran common blocks or uninitialized global variables

`ELF symbol visibility`


---------------------------------------------

Specific relocation example

Important reasons that ELF shared libraries use PLT and GOT tables:
`
The idea of a shared library is to permit mapping the same shared library into different processes. This only works at maximum efficiency if the shared library code looks the same in each process. If it does not look the same, then each process will need its own private copy, and the savings in physical memory and sharing will be lost.
`

总结下，之所以使用PLT和GOT，是因为shared library设计之处，是为了节省内存，而relocation会改写shared library的内容，将触发私有拷贝。


------------------------

TLS是尤其有用的，TLS对program来说是global的，对thread来说是local的。TLS实际上是一种特殊的内存抽象，既涉及ELF，也涉及thread。

TLS由compiler和program linker/dynamic linker提供支持。为了做到效率最大，kernel的支持也是必要的。

TLS storage models (check reference 3):
1. global dynamic
2. local dynamic
3. initial executable
4. local executable

存储模式的特点：
1. 灵活性从上到下，不断降低，效率得到提升。
2. gcc通过`-ftls-model`选项来控制


Linker的优化策略：
1. 根据已有信息，自动选择最佳的storage model
2. gather all TLS variables toger into a single TLS segment
3. compiler总是产生同样的代码序列来访问TLS变量(方便识别)，可以根据需要，在运行时候进行改写

------------------------------------------------

From section to segment
1. program linker maps all the loadable sections into segments.
2. the sections are mapped to segments based on the access requirements.
3. the segment physical address is officially undefined, but is often used as the load address when using a system which does not use virtual memory.

Segment type(partly):
+ `PT_GNU_EH_FRAME`
+ `PT_GNU_RELRO`

Section(partly):
+ SHT_HASH -> speed symbol lookup

------------------------------------------
Symbol Versions:
Linked against a specific instance of the shared library.

relaxation:
It consists of optimnizing code sequences which can become smaller or more efficient when final addresses are known. (optimize PIC insturction)

------------------------------------------------------------
Parallel Linking:
1. reading the symbols and relocation entries (need process in order)
2. complete the layout of all the input contents
3. the process of reading the contents, applying relocations, and writing the contents to the output file can be fully parallelized. Each input file can be processed separately.

---------------------------------------------------------------
Archives

Archives are a traditional Unix package format. (created by ar program)

Achivers all have  a symbol table (symbol + object) --> Long before, created by ranlib.


----------------------------------------------------
Symbol Resolution

Consider common symbol. (only exists in relocation file.)

----------------------------------------------------------

link time optimization / whole program optimization : (bring significant performance benefits)
`At link time is that the compiler can then see the entire program.` -> inlining functions 

Two approach:
1. pre-linker  --> looking for stored *intermediate representation*. and then runs the link time optimization passes.
2. the linker proper to call back into the compiler

-----------------------------------------------------------

COMDAT sections: --> section groups
*vague linkage*

C++ Template Instantiation  --> Borland model vs Cfront model

Exception Frames -> unwinding_ the stack


-----------------------------------------------

Warning Symbols
`__start` and `__stop` Symbols

-------------------------------------------

Incremental Linking --> record extra information

--------------------------

Reference:

1. [Linkers part 1](https://www.airs.com/blog/archives/38)
2. [GOT/PLT/REL](https://www.airs.com/blog/archives/42)
3. [TLS storage model](https://docs.oracle.com/cd/E24847_01/html/E22196/chapter8-20.html)
4. [common symbols](https://binarydodo.wordpress.com/2016/05/09/investigating-linking-with-common-symbols-in-elf/)
5. [section groups](https://cache.one/read/14379277)
