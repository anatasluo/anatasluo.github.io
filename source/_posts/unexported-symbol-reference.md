---

title: 使用Linux内核unexported symbol的办法

date: 2024-08-28 10:22:06

tags:

    - Linux

    - Kernel Module

    - Livepatch

    - ELF

---





在编写内核驱动时，如果使用到了未被export的函数，kbuild在modpost这一步会报如下错误：

```

ERROR: modpost: "kernel_clone" [/data/simple.ko] undefined!

```



想要调用一个函数，需要两个东西，一个是函数原型，另一个则是函数地址。原型的获取没有难度，解决问题的关键在于如何获取对应unexported函数的地址。



## 读取符号表

最直接的思路，就是读取/proc/kallsyms，获取对应函数的地址后，把地址作为参数赋给内核驱动。整个过程可以封装成一个脚本。



## 通过kprobe

kprobe在register过程，也可以获取相应符号的地址，通过kprobe获取到地址后，再把相应的kprobe remove掉。



## 通过klp机制



在制作内核热补丁的过程中，大量引用了kernel的symbol，这些symbol既有global，也有local的，自然也包含各种unported的情况。



klp(kernel livepatch)对符号的处理，分成两大部分。



### 引用vmlinux的符号



处理过程的函数调用链为：

```

load_module

    -> apply_relocations

        -> klp_apply_section_relocs

            -> klp_write_section_relocs

                -> klp_resolve_symbols

```



处理过程，存在以下约定：



1. rela section的flag设置了SHF_RELA_LIVEPATCH



对应以下代码:

```

info->sechdrs[i].sh_flags & SHF_RELA_LIVEPATCH

```



2. rela section的命名格式为：.klp.rela.sec_objname.section_name



这其中最关键的时sec_objname，这里仅有检查到时vmlinux才会进一步处理。



3. relocation中对应的undefined symbol的st_shndx为SHN_LIVEPATCH



对应以下代码:

```

sym->st_shndx != SHN_LIVEPATCH

```



4. symbol的name格式为.klp.sym.sym_objname.sym_name,sympos



其中，sym_objname/sym_name/symops都是find_symbol使用的参数，决定了这个symbol会被resolve到什么地址



### 引用非vmlinux的符号



这里分为loaded的模块和unloaded的模块。



对于loaded的模块，符号的解析路径为(由当前的klp ko触发)：

```

klp_enable_patch

    -> klp_init_patch

        -> klp_init_object

```



对于unloade的模块，符号的解析路径为(由该ko被loaded时触发)：

```

klp_module_coming

    -> klp_init_object_loaded

```



需要明确的是，这两者处理过程，都是遍历已经加载的klp ko。



因此这一过程无法被一般的内核驱动利用，去引用unexported的symbol。





### 利用klp机制来引用vmlinux中的unexported symbol



kernel module在生成过程中，相关的多个object文件通过链接器会生成一个大的object文件，记为<ko_name>.o，对应的修改都针对该<ko_name>.o。



分为四个过程：

1. 找到undefined symbol中属于unexported symbol的部分

这部分的寻找过程参考modpost实现即可



2. 修改符号表

将这些symbol作如下处理：

a. sym->st_shndx = SHN_LIVEPATCH

b. name -> klp.sym.sym_objname.sym_name,sympos



3. 修改rela section

将对所有unported symbol存在引用的relocation entry单独聚集成一个section，该section符合以下约定：

a. sh_flags & SHF_RELA_LIVEPATCH

b. section name的命名格式为.klp.rela.sec_objname.section_name



4. 修改kbuild，在modpost运行之前进行以上处理即可



以上都是理论分析过程，待有时间写一个程序，验证以上过程。
