---
title: 用户态live patch实现
tags:
  - Libcare
  - Live Patch

---

### Kernel Live Patch

#### Build process
1. Build the unstripped vmlinux
2. Patch the source tree
3. Rebuild vmlinux and find "changed objects"
4. Recompile each changed objects with -ffunction-sections -fdata-sections
5. Unpatch the source tree
6. Recompile each changed objects with -ffunction-sections -fdata-sections, get the original version
7. For every changed object, use create-diff-object
	+ Analyze each/original object pair for patchability
	+ Add .kpatch.funcs/.rela.kpatch.funcs + .kpatch.dynrelas/.rela.kpatch.dynrelas ---> new cumulative output object

#### Patching
-mfentry flag

#### Limitations
+ __init
+ static allocated data 
+ may not safe, users need to understand what they are doing.
+ vdso
+ without a fentry call
+ CAP_SYS_MODULE
+ TAINT flag
+ ftrace
+ act like normal function: oops stack/kdump(crash)/ftrace(tiny window)/kprobes(systemtap)/perf/tracepoints
+ combinediff --> patches are cumulative
+ KPATCH_FORCE_UNSAFE --> run simultaneously


### Userspace Live Patch

#### Prepare Patch

src/libcare-patch-make some_serious_bug.patch:
1. original and patched versions are generated into assembler.
2. compare --> patches are stored into special ELF sections --> binary patch files

docs/libcare-patch-make.rst

 $ cd project_dir
 $ KPATCH_STAGE=configure CC=libcare-cc ./configure
 $ libcare-patch-make first.patch second.patch
 BUILDING ORIGINAL CODE
 ...
 INSTALLING ORIGINAL OBJECTS INTO libcare-patch-make
 ...
 applying patch ~/first.patch
 ...
 applying patch ~/second.patch
 ...
 BUILDING PATCHED CODE
 ...
 INSTALLING PATCHED CODE
 ...
 MAKING PATCHES
 patch for foobar is in patchroot/${buildid}.patch
 ...


KPATCH_STAGE will control libcare-cc

use kpatch_gensrc to compare and generate a patch-containing assembly

+ libcare-patch-make
+ scripts/pkgbuild

$KPATCH_PATH/kpatch_gensrc --os=rhel6 -i foo.s -i bar.s -o foobar.s

使用patch -b -z保留未打patch的原始版本

get GNU_BUILD_ID by eu-readelf -n

Q: 获取打了patch和未打patch的源码/编译结果，将二进制进行比对 ---> 与构建系统如何交互？？
A：分层解决，对于该工具来说，接受两个版本的二进制/patch，生成loadable binary

Q: 是否需要自定义版本号，patch level?

strip --> patchedexec patchedexec.stripped
rel-fixup --> origexec patchedexec.stripped
strip unneeded patchedexec.stripped
--undo-link origexec patchedexec.stripped


#### Apply and then load patch

libcare-ctl --> pstrace

1. allocate memory
2. resolve references

 $ libcare-ctl patch -p <PID_or_all> some_patch_file.kpatch

The patches are basically ELF files of relocatable type ``REL`` with binary
meta-information such as BuildID and name of the patch target prepended.

unpatch --> remove "BuildID"

rtld --> _dl_open

kpatch_process_patches --> kpatch_load_libraries --> kpatch_create_object_files --> kpatch_apply_patches --> kpatch_find_patch_region --> kpatch_mmap_remote --> kpatch_apply_relocate_add

kpatch_elf.c
kpatch_resolve --> kpatch_relocate --> kpatch_ensure_safety --> libunwind --> kpatch_apply_hunk


#### About ELF

+ DYN --> resolve data
+ EXEC --> no relocation information
+ REL

### Libcare源码分析

### Libcare的问题

1. 过程过于繁琐

问题是Patch生成过程，与构建工程是强相关的。

能否对比生成的二进制文件(debug版)，直接进行patch生成？？？？

2. 应用patch使用uproob

3. 程序被杀死后重新拉起的状态？？？
版本更新不太可能是因为一个patch，因此更有可能的场景是，程序重启后，仍然需要使用之前的patch，需要一个service记录这些信息。

4. libcare-patch-make要求build system达成一定限制(all/install/clean)

5. after the restart, not re-apply

6. 需要编译选项支持？？？

7. 是否只支持C语言

### Reference

1. [Uprobes in 3.5](https://lwn.net/Articles/499190/)

2. [linux-kernel-live-patching](https://www.infosecurity-magazine.com/blogs/linux-kernel-live-patching/)

3. [kpatch](https://github.com/dynup/kpatch)
