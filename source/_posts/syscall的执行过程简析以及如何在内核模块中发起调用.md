---
title: syscall的执行过程简析以及如何在内核模块中发起调用
date: 2023-05-17 10:23:55
tags:
    - Syscall
    - Linux
    - Kernel Module

---

以下分析过程用的kernel版本为6.2，架构为X86，请注意不同内核版本以及不同架构之间的差异。

## syscall的执行过程

syscall的执行过程大体上可以分为三步：
1. 用户态发起调用
2. glibc设置参数，发起中断进入内核态
3. 内核态设置堆栈，进行处理


前两步无需赘述，直接从内核中断处理开始分析。这一过程中，最重要的过程为堆栈的切换。

如果是X86的架构，堆栈的切换实现在./arch/x86/entry/entry_64.S下，对应函数为entry_SYSCALL_64。

此处实现的要点为，用户态的寄存器上下文被存储到了栈中，而后，栈中的某一处地址被处理成struct pt_regs，作为调用参数，传给了syscall的处理函数，因此，以mprotect为例，可以看到如下实现:
```
SYSCALL_DEFINE3(mprotect, unsigned long, start, size_t, len,
		unsigned long, prot)
{
	return do_mprotect_pkey(start, len, prot, -1);
}
```

展开的结果为:
```
static long __se_sys_mprotect(__typeof(__builtin_choose_expr((__builtin_types_compatible_p(typeof((unsigned long)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((unsigned long)0), typeof(0ULL))), 0LL, 0L)) start, __typeof(__builtin_choose_expr((__builtin_types_compatible_p(typeof((size_t)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((size_t)0), typeof(0ULL))), 0LL, 0L)) len, __typeof(__builtin_choose_expr((__builtin_types_compatible_p(typeof((unsigned long)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((unsigned long)0), typeof(0ULL))), 0LL, 0L)) prot);
static inline __attribute__((__gnu_inline__)) __attribute__((__unused__)) __attribute__((no_instrument_function)) long __do_sys_mprotect(unsigned long start, size_t len, unsigned long prot);
long __x64_sys_mprotect(const struct pt_regs *regs);
;
long __x64_sys_mprotect(const struct pt_regs *regs) { return __se_sys_mprotect(regs->di, regs->si, regs->dx); }
long __ia32_sys_mprotect(const struct pt_regs *regs);
;
long __ia32_sys_mprotect(const struct pt_regs *regs) { return __se_sys_mprotect((unsigned int)regs->bx, (unsigned int)regs->cx, (unsigned int)regs->dx); }
static long __se_sys_mprotect(__typeof(__builtin_choose_expr((__builtin_types_compatible_p(typeof((unsigned long)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((unsigned long)0), typeof(0ULL))), 0LL, 0L)) start, __typeof(__builtin_choose_expr((__builtin_types_compatible_p(typeof((size_t)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((size_t)0), typeof(0ULL))), 0LL, 0L)) len, __typeof(__builtin_choose_expr((__builtin_types_compatible_p(typeof((unsigned long)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((unsigned long)0), typeof(0ULL))), 0LL, 0L)) prot)
{
	long ret = __do_sys_mprotect((unsigned long)start, (size_t)len, (unsigned long)prot);
	(void)((int)(sizeof(struct { int : (-!!(!(__builtin_types_compatible_p(typeof((unsigned long)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((unsigned long)0), typeof(0ULL))) && sizeof(unsigned long) > sizeof(long))); }))), (void)((int)(sizeof(struct { int : (-!!(!(__builtin_types_compatible_p(typeof((size_t)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((size_t)0), typeof(0ULL))) && sizeof(size_t) > sizeof(long))); }))), (void)((int)(sizeof(struct { int : (-!!(!(__builtin_types_compatible_p(typeof((unsigned long)0), typeof(0LL)) || __builtin_types_compatible_p(typeof((unsigned long)0), typeof(0ULL))) && sizeof(unsigned long) > sizeof(long))); })));
	do
	{
	} while (0);
	return ret;
}
static inline __attribute__((__gnu_inline__)) __attribute__((__unused__)) __attribute__((no_instrument_function)) long __do_sys_mprotect(unsigned long start, size_t len, unsigned long prot)
{
	return do_mprotect_pkey(start, len, prot, -1);
}
```

展开后，主要实现为定义了若干函数，并且进行了调用封装。其中，需要注意的是long __x64_sys_mprotect(const struct pt_regs *regs)。
这个符号的地址就是最后填入sys_call_table的地址。

尽管这个符号被asmlinkage修饰了，但是实际传参仍然是通过寄存器进行的，这与大多数资料里对syscall的描述有出入。在x86-64的架构下，asmlinkage的定义是空。

上面的实现调用顺序为:__x64_sys_mprotect -> __se_sys_mprotect -> __do_sys_mprotect -> do_mprotect_pkey

对vmlinux进行汇编，可以得到如下的结果：
```
<__x64_sys_mprotect>:
f3 0f 1e fa             endbr64 
48 8b 57 60             mov    0x60(%rdi),%rdx
48 8b 77 68             mov    0x68(%rdi),%rsi
b9 ff ff ff ff          mov    $0xffffffff,%ecx
48 8b 7f 70             mov    0x70(%rdi),%rdi
e8 a6 fb ff ff          call   ffffffff81218e80 <do_mprotect_pkey>
48 98                   cltq   
e9 a3 a3 c0 00          jmp    ffffffff81e23684 <__x86_return_thunk>
66 66 2e 0f 1f 84 00    data16 cs nopw 0x0(%rax,%rax,1)
00 00 00 00 
0f 1f 40 00             nopl   0x0(%rax)
```

此处rdi寄存器的内容就是唯一的参数struct pt_regs*，而这个参数本身存储了用户态的上下文，按照用户态的abi规则读取参数，再传递给对应的内核态函数。

偏移0x70是rdi寄存器再struct pt_regs中的偏移。


### 如何在linux kernel module中调用syscall

按照上面所说，调用的办法如下:
```
static long (*orig_mprotect) (const struct pt_regs *regs);

static long krun_mprotect(unsigned long start, size_t len, unsigned long prot)
{
    do_mprotect_pkey((unsigned long)layout->base, layout->text_size, PROT_READ | PROT_EXEC, -1);
    struct pt_regs regs;
    setup_parameters(&regs, start, len, prot);
    return orig_mprotect(&regs);
}
```

通过krun_mprotect就能从内核中发起syscall调用，至于如何读到sys_call_table，以及从sys_call_table中读到syscall handler的地址，就不再本文的讨论范畴了。







