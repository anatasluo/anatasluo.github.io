---
title: DWARF debug format information
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


## Reference
+ [dwarf-debug-format](https://developer.ibm.com/articles/au-dwarf-debug-format/)