---
title: Linux Kernel Module加载卸除过程分析
tags:
  - Linux
  - Kernel Module
date: 2021-04-06 02:26:17
---

## 文章参考的代码信息

+ 内核: Linux v5.12-rc6
 
+ 架构: X86

## Kernel Module的加载过程

### 读取kernel module到内存(kernel/module.c)
    
内核中用于module load的系统调用有两个：finit_module和init_module。区别在于，finit_module接受的是一个fd，init_module直接从内存中复制。这两个调用是内核模块加载的入口，最终都会调用到load_module。加载过程中使用的管理结构为struct load_info，kernel module在内核内存中的地址，是通过__vmalloc申请出来的，被记录在info->hdr。

### 检查签名是否存在

1. module_sig_check

    读取info->hdr末尾的一部分，并进行校验。检验结束后，更新info->len。

2. elf_validity_check

    校验ELF相关的内容

### 处理并加载section(setup_load_info)

1. 读取modinfo section

    .modinfo这个section中放入module相关的一些描述信息。通过*readelf -p .modinfo xxx.ko*可以读出相应的信息，包括version，description，author等信息。
   
2. 遍历各个section，获取符号表信息(strtb和symtb)，这一过程中，需要根据info->hdr和section中的offset，计算出真正的内存地址

3. 读取.gnu.linkonce.this_module section

4. 尝试读取__versions section，并更新info->index.vers

### 查看是否是被禁止加载的模块(blacklisted)

读取kernel中的module blacklist，这一过程中判断的依据是info->name，如果info->name在blacklist中，则不加载该模块。

### 更新各个section的地址

二进制中的section记录的是内存offset，以info->hdr为基准，进行重定位。

清除vers和info相关section中的SHF_ALLOC标记，后续过程中将不会分配内存。

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

7. 遍历各个section，将section划分成两部分，分别是core part和init part。init part将在初始化完成后丢弃，从而节省内存。对于每个part，又细分为四类，分别是text，ro，ro_after_init，other，细分是为了后面设置内存页的权限。

8. 设置core和init的符号表(layout_symtab)

9. move_module

    根据7和8获取到的core和init的信息，将需要的信息从二进制中复制到core和init中，此时获得的地址，便是最终的运行地址。这一步执行结束后，mod变量被正确赋值。

### 初步加载kernel module

内核中管理module的结构为struct module

1. 初始化一个struct module，并更新状态为MODULE_STATE_UNFORMED

2. 查看kernel中是否已经加载相关module

3. 更新module_addr_min和module_addr_max

4. 将struct module插入到kernel的list中，此时，该module开始被kernel识别并管理

5. 校验签名

### module运行现场的初始化

1. 分配内存给percpu section

2. 初始化mod的依赖管理结构(source_list和target_list)

3. 引用计数置为1

4. 初始化mod->param_lock

### find_module_sections

1. 获取存有元数据的section，包括导出的符号表，crc校验参数等等

2. 校验license和version(check_module_license_and_versions)

3. 设置Module的描述信息(从.modinfo section中读取的内容)

### simplify_symbols

这一步比较重要，进行符号表偏移的计算。对于SHN_UNDEF的符号，将在内核中进行查找，查找成功后，更新相应的依赖关系。对于weak属性的符号，会做进一步的检查和处理。对于除SHN_COMMON，SHN_ABS，SHN_LIVEPATCH，SHN_UNDEF之外的一般符号，依据符号的偏移以及所属section的基址，计算出符号的内存地址。

### section重定位

1. apply_relocations

    进行符号的重定位，有一类特殊的section，记录了对应section的relocation信息。relocation的计算分为三步：
    1. 计算二进制中重定位部分的内存位置(src)
    2. 根据type，计算内存中重定位部分的内存地址(dst)
    3. 校验dst部分是否全为0，如果是，执行write(dst, src, size)

2. post_relocation

    1. 对exception table进行排序
    2. 执行符号表的拷贝工作(此时的符号表位置已经计算出来)
	return module_finalize(info->hdr, info->sechdrs, mod);
    3. arch相关的结束动作()

3. 刷新cache(flush_module_icache)，获取module的运行参数

### 开始运行module前的准备

1. 查看是否有重复的符号

2. 对init和core部分的四个类别section进行内存权限设置

3. 设置module状态为MODULE_STATE_COMING

4. 对内核的通知链发出一个通知，此后状态为MODULE_STATE_GOING

5. 解析参数

6. 设置sys相关的文件(mod_sysfs_setup)

### 开始运行module

1. 如果注册了init，执行init函数
2. 对内核的通知链发出一个通知，此后状态为MODULE_STATE_LIVE
3. mod计数减一
4. 释放init区域

## Kernel Module的卸载过程

1. 检查是否有权限进行卸载

2. 从用户参数中获取所要卸载的模块name

3. 根据name寻找相应的module结构(find_module)

4. 检查是否有其他模块依赖待卸载模块

5. 执行module的exit函数

6. 释放module占据的资源，更新内核的管理数据

## 相关Q&A

1. data段和bss段的区别

    bss段由于不存在初始化值，在二进制中不需要分配位置存储，因此bss变量不会造成二进制变大。但是，在进行二进制加载时，会分配相应的内存。在符号表中，尽管bss段在二进制本身中不占据位置，但是在运行内存中占据了位置，因此偏移计算时，是将bss段作为有size进行处理的(因为符号表是描述运行内存布局的)。

2. 是否可以将某些section单独管理

    原理上是可行的，我尝试过将bss和data单独分离出来。需要考虑的几个点:
    1. 修改符号表的偏移，偏移是重定向的依据。
    2. 如果原有地址存在数据，重定向对0值的校验会失败。

3. kernel module为何要export符号，才能被其他模块使用

    export出来的符号会单独放在一个section中，module本身的符号表对内核其他部分是不可见的。但是，module跟内核其他部分是在一个地址空间里的，缺少的只是内存布局信息(也就是符号表)。

4. 符号表中Global和Local的区别

    广义上的全局变量，是指生存周期为全局的变量，在符号表中出现的变量，代表运行内存中为该变量分配了位置，因此符号表中出现的变量，其生存周期都是全局的，都可以认为是广义上的全局变量。符号表中的Global和Local的区别在于，作用域不一样，Global对整个模块都是可见的，而Local只有一个局部作用域(文件内或者函数内)。这个作用域的检查是在编译时进行的，也就是说，如果能拿到正确的地址，即使不符合作用域，也能正常使用。
    
5. 二进制运行过程中的内存管理

    此处以变量举例，来说明运行模块对内存的使用。第一类是广义上的全局变量，此类变量从二进制加载到二进制结束运行，一直存在内存中。第二类是函数内的局部变量，这部分是放置在栈中的。随着函数的运行，生成和销毁。第三类，就是程序在运行过程中，通过malloc之类的管理接口申请的内存，这类内存需要程序自行释放，否则会造成内存泄露。


## 参考

1. [elf header](https://man7.org/linux/man-pages/man5/elf.5.html)
2. 深入Linux设备驱动内核机制(陈学松著)第一章
