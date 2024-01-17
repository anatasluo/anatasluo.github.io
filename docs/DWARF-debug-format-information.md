---
title: DWARF and exception handling
date: 2022-10-25 00:34:51
tags:
  - DWARF
  - Debug
  - ELF

---

## Introduction

DWARF(debugging with attributed record formats)是一种常用的source-level调试信息。

DWARF通过树形结构来组织调试信息，树形结构的每个节点可以表示types, variables, functions.

DWARF使用一系列的DIEs(debugging information entries)来定义source program的底层表示。每一个DIE由一个标识(tag)和一系列的属性(attributes)组成。一个DIE或者一群DIE共同描述了source program中对应实体(entity)。标识(tag)指明了每个entry所属的class，以及对应entry所具有的特定属性。

## DWARF sections

常见的DWARF section以及对应的含义：
.debug_abbrev	->	Abbreviations used in the .debug_info section
.debug_aranges	->	Lookup table for mapping addresses to compilation units
.debug_frame	->	Call frame information
.debug_info	->	Core DWARF information section
.debug_line	->	Line number information
.debug_loc	->	Location lists used in the DW_AT_location attributes
.debug_macinfo	->	Macro information
.debug_pubnames	->	Lookup table for global objects and functions
.debug_pubtypes	->	Lookup table for global types
.debug_ranges	->	Address ranges used in the DW_AT_ranges attributes
.debug_str	->	String table used in .debug_info
.debug_types	->	Type descriptions

.debug_abbrev section包含多个描述所有遵循DWARF格式的compilation unit的abbreviation tables。

每一个描述compilation unit的abbreviation table包含一系列的abbreviation declarations。每一个declaration指明了一个DIE的tag和attributes。这些信息用于指导.debug_info section的解释。每一个compilation unit都与一个特定的abbreviation table关联，多个compilation units可以共享一个abbreviation table。

## DWARF tools

+ readelf
+ dwarfdump
+ libdwarf

## C/C++相关的tag和attributes

DW_TAG_class_type	->	Represents the class name and type information
DW_TAG_structure_type	->	Represents the structure name and type information
DW_TAG_union_type	->	Represents the union name and type information
DW_TAG_enumeration_type	->	Represents the enum name and type information
DW_TAG_typedef	->	Represents the typedef name and type information
DW_TAG_array_type	->	Represents the array name and type information
DW_TAG_subrange_type	->	Represents the array size information
DW_TAG_inheritance	->	Represents the inherited class name and type information
DW_TAG_member	->	Represents the members of class
DW_TAG_subprogram	->	Represents the function name information
DW_TAG_formal_parameter	->	Represents the function arguments' information
DW_AT_name	->	Represents the name string
DW_AT_type	->	Represents the type information
DW_AT_artificial	->	Is set when it is created by compiler
DW_AT_sibling	->	Represents the sibling location information
DW_AT_data_member_location	->	Represents the location information
DW_AT_virtuality	->	Is set when it is virtual

## .eh_frame section

.eh_frame section的格式基本与.debug_frame一样，存在一些细微的差别。

.eh_frame section包含至少一条CFI(Call Frame Information)记录，而CFI = 1 CIE(Common Information Entry) + at least 1 FDE(Frame Description Entry)。

就观察来说，对于一个源码文件编译出来的object文件，有一个CIE，记录了一些全局的信息，包括version，augmentation string等等。FDE则对应每一个函数。

在做热补丁的时候，linker报了一个如下的错误:
```
no .eh_frame_hdr table will be created
```

尽管报了这个错误，linker还是正常链接生成了目标文件。

.eh_frame_hdr简单的说，就是用于.eh_frame检索的概括信息，这些信息最终的用途是实现ELF的Exception Handling机制。(待填坑)

通过阅读binutils-gdb的源码，发现报错来自以下代码：
```
      ENSURE_NO_RELOCS(buf);
      if ((sec->flags & SEC_LINKER_CREATED) == 0 || cookie->rels != NULL)
      {
        asection *rsec;

        REQUIRE(GET_RELOC(buf));
        ...
      }
```

这段源码出错的逻辑，是没找到FDE对应的重定向条目。也就是说，每个FDE必须有对应的重定向条目。

通过阅读源码，发现每个FDE对应的重定向地址都是offset + 0x8. 这个地址对应的DWARF属性是 - PC Begin。

出错的原因到这里就很清楚了，做补丁的时候，我去除了没用到的symbol和relocation entry, 导致linker在处理.eh_frame时，校验失败。

解决的办法也很简单，去除relocation entry之后，把对应的FDE也去除掉。

代码实现看[这里](https://gitee.com/openeuler/syscare/pulls/138)。

在生成新的.eh_frame时候，注意要同时更新PC Begin和eh_hdr_id，对应的relocation entry的offset也要更新。

FDE的eh_hdr_id对应的值就是其本身的偏移，CIE的eh_hdr_id是0.


## Reference
+ [dwarf-debug-format](https://developer.ibm.com/articles/au-dwarf-debug-format/)
+ [LSB - Exception Frames](https://refspecs.linuxbase.org/LSB_4.0.0/LSB-Core-generic/LSB-Core-generic/ehframechpt.html)
+ [LSB - ehframe_hdr](https://refspecs.linuxfoundation.org/LSB_1.3.0/gLSB/gLSB/ehframehdr.html)
+ [github - mclinker](https://github.com/mclinker/mclinker/blob/master/include/mcld/LD/EhFrameHdr.h)
+ [GOT](https://maskray.me/blog/2021-08-29-all-about-global-offset-table)

+ [.gcc_except_table](https://martin.uy/blog/understanding-the-gcc_except_table-section-in-elf-binaries-gcc/) 
+ [airs - .gcc_execept_table](https://www.airs.com/blog/archives/166)
+ [airs - .gcc_execept_table](https://www.airs.com/blog/archives/460)
+ [airs - .gcc_execept_table](https://www.airs.com/blog/archives/462)
+ [airs - .gcc_execept_table](https://www.airs.com/blog/archives/464)
+ [C++异常的幕后6](https://blog.csdn.net/wuhui_gdnt/article/details/88737310)
