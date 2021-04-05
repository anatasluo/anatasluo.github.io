---
title: Linux Kernel Module加载卸除过程分析
tags:
  - Linux
  - Kernel Module
date: 2021-04-06 02:26:17
---



## Kernel Module的加载过程

### 读取kernel module到内存(kernel/module.c)
    
内核中用于module load的系统调用有两个：finit_module和init_module。区别在于，finit_module接受的是一个fd，init_module直接从内存中复制。这两个调用是内核模块加载的入口，最终都会调用到load_module。加载过程中使用的管理结构为struct load_info，kernel module在内核内存中的地址，是通过__vmalloc申请出来的，被记录在info->hdr。

### 检查签名是否存在

1. module_sig_check

    读取info->hdr末尾的一部分，并进行校验。检验结束后，更新info->len。

2. elf_validity_check

    校验ELF相关的内容

### 处理并加载section(setup_load_info)

1. 读取modinfo和name section。
   
2. 遍历各个section，获取符号表信息，这一过程中，需要根据info->hdr和section中的offset，计算出真正的内存地址。

3. 读取.gnu.linkonce.this_module section。

4. 尝试读取__versions section，并更新info->index.vers。

### 查看是否是被禁止加载的模块

读取kernel中的module blacklist，这一过程中判断的依据是info->name，如果info->name在blacklist中，则不加载该模块。

### 更新各个section的地址

二进制中的section记录的是内存offset，以info->hdr为基准，进行重定位。

清除vers和info相关section中的SHF_ALLOC标记，即这部分信息可以不保持在内存中。

### 检查module中的version信息是否存在

1. find_symbol

    从已经加载的kernel和module符号中，寻找name为module_layout的符号，并获取到相应的信息。

2. 进行crc和version校验


### 根据读取到的section信息，对内存进行分配

1. check_modinfo

    对vermagic进行校验，如果不是由内核本身维护的module，设置污染标记(内核会打印'loading out-of-tree module taints kernel')

    检查module的编译信息

    检查是否有live-patch(check_modinfo_livepatch)

    设置license(set_license)

2. module_frob_arch_sections
   
   这个函数设置了weak属性，允许arch层重定义该函数，X86中未找到相关定义。

3. module_enforce_rwx_sections

    检查各个section的flag

4. 清除per-cpu sections标记中的SHF_ALLOC

5. 将.data..ro_after_init标记为SHF_RO_AFTER_INIT(read only after init)

6. 将__jump_table标记为SHF_RO_AFTER_INIT

7. 设置core section和init section的信息(layout_sections)

8. 设置core和init的符号表(layout_symtab)

9. move_module

    根据7和8获取到的core和init的信息，将需要的信息从二进制中复制到core和init中，此时获得的地址，便是最终的运行地址。

### 初步加载kernel module

内核中管理module的结构为struct module。

1. 初始化一个struct module，并更新状态为MODULE_STATE_UNFORMED

2. 查看kernel中是否已经加载相关module

3. 更新module_addr_min和module_addr_max

4. 将struct module插入到kernel的list中，此时，该module开始被kernel识别并管理

5. 校验签名

### module运行现场的初始化

1. 分配内存给percpu section

2. 引用计数置为1

3. 初始化mod->param_lock

### find_module_sections

1. 获取各个section的addr和size

2. 校验license和version

3. 设置MODINFO_ATTR

### simplify_symbols

对SHN_UNDEF的符号，从内核中寻找相应的符号地址(resolve_symbol_wait)，对于weak属性的symbol，要做进一步的检查和绑定。

### section重定位

1. apply_relocations

2. post_relocation

3. 刷新cache(flush_module_icache)，获取module的运行参数

### 开始运行module

1. 查看是否有重复的符号

2. 设置module权限

3. 设置module状态为MODULE_STATE_COMING

4. 通知内核即将开始运行(blocking_notifier_call_chain_robust)，此后状态为MODULE_STATE_GOING

5. 解析参数

6. 设置sys相关的文件(mod_sysfs_setup)


## Kernel Module的卸载过程

....

## 参考

1. [elf header](https://man7.org/linux/man-pages/man5/elf.5.html)