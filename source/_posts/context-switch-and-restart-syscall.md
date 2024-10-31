---
title: context_switch and restart_syscall
date: 2024-10-31 23:25:07
tags:
    - Linux
    - Syscall
    - Schedule
    - Signal

---

## 问题背景

考虑以下程序
```
#include <stdio.h>
#include <unistd.h>

int main()
{
    int ret;
    printf("%d starts to work \n", getpid());
    ret = sleep(200);
    printf("sleep return with %d \n", ret);
    return 0;
}
```

尝试使用gdb单步该程序，在该程序进入sleep syscall之后，通过以下命令唤醒该程序：
```
kill -SIGCONT <pid>
```
发现程序在响应signal之后，接着继续执行之前的sleep syscall。更令人费解的地方在于，在响应signal的时候，通过检查寄存器，发现当前程序的pc寄存器是指向sleep syscall指令之后的。

因此，可以确定的是，kernel里存在某种机制，可以重启被signal中断的syscall，且这个机制会修改context的pc寄存器。通过检索源码，发现这种机制叫做restart block。

在理解这个机制的过程中，顺着一起整理了sleep过程中会遇到的所有情况。

## sleep的核心实现

sleep在内核中，最核心的实现是以下代码：
```
static int __sched do_nanosleep(struct hrtimer_sleeper *t, enum hrtimer_mode mode)
{
	struct restart_block *restart;

	do {
		set_current_state(TASK_INTERRUPTIBLE|TASK_FREEZABLE);
		hrtimer_sleeper_start_expires(t, mode);

		if (likely(t->task))
			schedule();

		hrtimer_cancel(&t->timer);
		mode = HRTIMER_MODE_ABS;

	} while (t->task && !signal_pending(current));

	__set_current_state(TASK_RUNNING);

	if (!t->task)
		return 0;

	restart = &current->restart_block;
	if (restart->nanosleep.type != TT_NONE) {
		ktime_t rem = hrtimer_expires_remaining(&t->timer);
		struct timespec64 rmt;

		if (rem <= 0)
			return 0;
		rmt = ktime_to_timespec64(rem);

		return nanosleep_copyout(restart, &rmt);
	}
	return -ERESTART_RESTARTBLOCK;
}
```

有两个细节值得关注：
1. 计时器的外面套了一个do-while循环，用于持续检查是否有signal到来
2. 假设在计时器结束之前，有signal被触发了，后续的逻辑会计算剩余时间，更新restart block结构体。

这两个细节都触及到了我的知识盲区，一个个来讨论。

## schedule和context switch

一开始我以为schedule在选中用户态的线程之后，会直接切入用户态继续执行。现在看来，这个想法是片面的。对于因为sleep未结束而block在kernel的用户态线程，在schedule之后，应该是继续在内核中。sleep此处的do-while就是用来做这种处理。

为了更好的解答以上的困惑，我重新整理了对相关知识的理解。

### syscall instruction的本质是什么

interrupt是cpu在正常执行过程中，需要相应的一些事件。interrupt可以分为同步和异步。也可以分为软件和硬件。

*可以认为*(取决于具体的实现方式)，syscall的本质是一种同步的software interrput。

### schedule和context switch的过程

这里不会讨论太详细的细节，在context switch的过程中，内核会对比current和next线程的状态，来决定是否要更新mm table。存在四种可能的切换：

>
> /*
>     * kernel -> kernel   lazy + transfer active
>     *   user -> kernel   lazy + mmgrab() active
>     *
>     * kernel ->   user   switch + mmdrop() active
>     *   user ->   user   switch
> */
>

这里就是造成我误解的地方，此处的user并不是指直接切入用户态执行，而是指该线程是用户态的。在context swicth结束之后，假设切入到了user线程的上下文，此时仍然是内核态的，因为从内核态切换到用户态，并不是简单的jmp指令就可以完成的。

## restart block的实现

上面提到，所有restart相关的信息，会被记录到restart block中。在sleep被interrupt之后，剩余的时间会被更新到这部分结构体之中。

剩下的一个问题在于，虽然记录了剩余的时间，是如何重新触发了syscall本身。阅读代码发现，在kernel的handle_signal实现中，存在以下逻辑：
```
if (syscall_get_nr(current, regs) != -1) {
	/* If so, check system call restarting.. */
	switch (syscall_get_error(current, regs)) {
	case -ERESTART_RESTARTBLOCK:
	case -ERESTARTNOHAND:
		regs->ax = -EINTR;
		break;

	case -ERESTARTSYS:
		if (!(ksig->ka.sa.sa_flags & SA_RESTART)) {
			regs->ax = -EINTR;
			break;
		}
		fallthrough;
	case -ERESTARTNOINTR:
		regs->ax = regs->orig_ax;
		regs->ip -= 2;
		break;
	}
}
```

这也就解答了上面遇到的问题，是signal本身，检查到需要restart syscall之后，会去修改pc寄存器，这样在返回用户态之后，会重新执行syscall。


## Reference
1. [linux schedule and context switch](https://prathamsahu52.github.io/post/linux_scheduler/)