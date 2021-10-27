---
title: Per-CPU及RSEQ机制分析
tags:
  - Per-CPU
  - RSEQ

date: 2021-10-20 13:23:15
---


## Per-CPU

### 设计的出发点和优点

现代的cpu都有cache hierarchy的设计，这一设计会极大的加快cpu访问内存的速度。但是cache的引入会带来内存访问一致性的问题。比如一个变量对多个核是可见的，对值的修改将导致所有其他核中缓存的该值失效，需要重新load最新的值，这将带来极大的效率损失。

考虑一种场景，服务器需要统计对磁盘的访问速度，正常的设计会使用一个全局的统计值，通过原子变量或者其他同步机制去修改该统计值。但是，通过per-cpu机制，每个cpu在调度运行时，只需要修改自己的值就可以了。这样一来，在这个值上面，cpu之间将不存在竞争。如果需要获得全局的统计值，依次相加即可。

当然，per-cpu带来性能提升带前提是，程序修改值的时间要远远大于读取统计值的时间。这一前提大多数情况下是成立的。

### 设计的要点和存在问题

per-cpu会带来内存的浪费，核数越多，这种内存浪费越明显。因此，per-cpu不应该用NR_CPUS作为规格来分配内存，而是系统初始化时，按照实际内核的数量来分配，以减少内存浪费。

同时，由于per-cpu的出发点，是加速cpu的访问，避免cpu-cache的不一致问题，因此设计应该尽量符合cpu cache的特点。采取指针数组的形式，主要有以下几个问题需要考虑[^2]：

1. 指针数组如果包含在一个数据结构里面，可能会导致其前后的数据成员在内存中的位置过于
分散，导致cpu加载该结构时，占据更多的cache lines。
2. 每个cpu只需要一个指针，访问其对应的区域即可。如果采用指针数组，一个cpu可能需要load多个指针的地址，带来不必要的浪费。
3. 获取cpu对应的指针需要两步，获取数组地址，然后获取对应cpu的指针。

因此，Christoph采取了一个简单的办法解决以上问题，把指针数组变成一个大数组。即所有per-cpu区域在内存上是连续的，只需要一个指针，通过计算cpu相应的偏移，就可以访问到对应区域。

### 源码分析(Linux 5.10)

如上文所述，per-cpu设计的要点在于：
1. 如何减少内存的浪费
2. 如何合理设计数据结构，保证亲和性的同时，减少cache lines的占用
3. 如何管理per-cpu的内存区域

#### per-cpu如何分配和管理内存？

per-cpu的内存布局如下：
```
c0                           c1                         c2
-------------------          -------------------        ------------
| u0 | u1 | u2 | u3 |        | u0 | u1 | u2 | u3 |      | u0 | u1 | u
-------------------  ......  -------------------  ....  ------------
```

在同一个NUMA节点中，各个core的per-cpu区域是连续的。但是在NUMA节点之间，内存并不是连续的。也就是说，对于多NUMA节点的机器，需要根据cpu获取到对应的基址和偏移。

根据用途的不同，各个cpu的per-cpu的内存区域分为三部分，如下所示:
```
<Static | [Reserved] | Dynamic>
```
static用于内核编译阶段所能识别出的per-cpu变量。
reserved用于内核模块使用到的static per-cpu变量。
dynamic用于运行过程中的per-cpu变量的申请和释放。

其中，static区域比较特殊，因为内核的运行就需要使用到该区域，必须尽可能早的进行初始化。

在start_kernel阶段，通过调用setup_per_cpu_areas()初始化per-cpu使用到的内存。

arm64下的实现比较简单，setup_per_cpu_areas的实现如下：
```
void __init setup_per_cpu_areas(void)
{
	unsigned long delta;
	unsigned int cpu;
	int rc;

	/*
	 * Always reserve area for module percpu variables.  That's
	 * what the legacy allocator did.
	 */
	rc = pcpu_embed_first_chunk(PERCPU_MODULE_RESERVE,
				    PERCPU_DYNAMIC_RESERVE, PAGE_SIZE,
				    pcpu_cpu_distance,
				    pcpu_fc_alloc, pcpu_fc_free);
	if (rc < 0)
		panic("Failed to initialize percpu areas.");

	delta = (unsigned long)pcpu_base_addr - (unsigned long)__per_cpu_start;
	for_each_possible_cpu(cpu)
		__per_cpu_offset[cpu] = delta + pcpu_unit_offsets[cpu];
}
```

值得注意的是，在pcpu_embed_first_chunk调用完成per-cpu内存初始化之前，任何代码都无法使用per-cpu特性。

这一过程中，最重要的是数据结构是struct  pcpu_alloc_info，相关的内存布局信息都存储在该数据结构中。这里面的内存管理实现细节较多(为了做到严格的内存对齐，而实现加速访问)，这里不做过多赘述，重点关注下几个值的计算过程。

1. pcpu_base_addr
pcpu_base_addr 是多个NUMA节点中最小的那个基址
计算过程为：
```
ptr = alloc_fn(cpu, gi->nr_units * ai->unit_size, atom_size);
...
base = min(ptr, base);
...
pcpu_setup_first_chunk(ai, base);
...
pcpu_base_addr = base_addr;
```

2. __per_cpu_start
__per_cpu_start 是链接脚本中指明的per-cpu section的起始位置，在System.map中值为0。通过__per_cpu_end - __per_cpu_start可以计算static size的大小。

3. __per_cpu_load
__per_cpu_load对PERCPU_INPUT所定义的section进行了进一步封装。在System.map中，其值是per-cpu section的内存起始地址。

4. pcpu_unit_offsets
pcpu_unit_offsets是一个数组，记录了各个CPU static区域对应pcpu_base_addr的偏移。

5. __per_cpu_offset
__per_cpu_offset是一个数组，其计算方式为：__per_cpu_offset[cpu] = (unsigned  long)pcpu_base_addr - (unsigned  long)__per_cpu_start + pcpu_unit_offsets[cpu];
其结果表示，各个CPU static区域对应__per_cpu_start 的偏移。这一结果非常重要，将后续用于per_cpu变量地址的计算。

这一函数调用结束后，vmlinux中per cpu相关的section会被拷贝到每个CPU对应的static区域。对应代码如下：
```
	for (group = 0; group < ai->nr_groups; group++) {
		struct pcpu_group_info *gi = &ai->groups[group];
		void *ptr = areas[group];

		for (i = 0; i < gi->nr_units; i++, ptr += ai->unit_size) {
			if (gi->cpu_map[i] == NR_CPUS) {
				/* unused unit, free whole */
				free_fn(ptr, ai->unit_size);
				continue;
			}
			/* copy and return the unused part */
			memcpy(ptr, __per_cpu_load, ai->static_size);
			free_fn(ptr + size_sum, ai->unit_size - size_sum);
		}
	}
```
#### 如何根据不同的cpu，计算出相应的偏移？(ARM64)

在boot cpu完成per cpu内存的初始化后，在后续初始化过程中，boot cpu将调用smp_prepare_boot_cpu函数，通过set_my_cpu_offset(per_cpu_offset(smp_processor_id()))完成最终设置。

对于noboot cpu，初始化过程中将调用cpu_init函数，通过set_my_cpu_offset(per_cpu_offset(cpu))完成最终设置。

per_cpu_offset(x)获取的就是之前所说的__per_cpu_offset[x]的值，即cpu x static区域相对于__per_cpu_start的偏移。 

set_my_cpu_offset的实现如下：
```
static inline void set_my_cpu_offset(unsigned long off)
{
	asm volatile(ALTERNATIVE("msr tpidr_el1, %0",
				 "msr tpidr_el2, %0",
				 ARM64_HAS_VIRT_HOST_EXTN)
			:: "r" (off) : "memory");
}
```
作用是把之前的偏移值直接写入tpidr_el1或者tpidr_el2寄存器。

> 关于smp_processor_id的处理，smp_processor_id使用到了per cpu特性，其最早是在start_kernel-->boot_cpu_init被调用，要早于setup_per_cpu_areas对per cpu的内存进行初始化。这里的调用不会引起问题吗？答案是不会，在更早的start_kernel-->smp_setup_processor_id中，kernel调用了set_my_cpu_offset(0)。即把当前的per cpu偏移设置为0，后面通过per cpu机制访问到的，直接就是vmlinux中的变量。而此时的cpu_number是0，也就是boot cpu的编号。

> 一个查看kernel macro的办法，修改对应make file，加入ccflags-y := -save-temps=obj

##### 定义一个per-cpu变量

> DEFINE_PER_CPU(int, per_cpu_n)

这个宏完全展开后，便是

> __attribute__((section(".data..percpu"))) int per_cpu_n

在定义上，per cpu变量是section固定的变量。

##### 读取一个per-cpu变量

```
#define SHIFT_PERCPU_PTR(__p, __offset)					\
	RELOC_HIDE((typeof(*(__p)) __kernel __force *)(__p), (__offset))
...
#define this_cpu_ptr(ptr)						\
({									\
	__verify_pcpu_ptr(ptr);						\
	SHIFT_PERCPU_PTR(ptr, my_cpu_offset);				\
})

```
__verify_pcpu_ptr通过检查地址，确保该指针指向per cpu变量。SHIFT_PERCPU_PTR通过读取寄存器的值，对变量做一个偏移，从而获取到对应cpu的local变量。

为了防止调度导致上下文在不同的cpu上运行，get_cpu_var将关闭调度，put_cpu_var则重新开启调度。

#### 动态分配的per cpu变量(chunk区域)

per cpu变量的管理上可以分为三类，分别为static，reserved，dynamic。其中static是编译内核时就可以确认的per cpu变量。其余两类则是运行时，动态进行管理的。其中，reserved区域用于管理模块的static per cpu变量。(模块编译时确定的per cpu变量，但是模块编译和运行，有可能在内核运行过程中，因此这类变量无法用static的方式处理。)

在模块编译时，per cpu变量便被放置在了特定命名的区域(.data..percpu)。

其内存分配过程为：
```
  info->index.pcpu = find_pcpusec(info);
	 --> find_sec(info, ".data..percpu");
  ...

  err = percpu_modalloc(mod, info);
	  --> mod->percpu = __alloc_reserved_percpu(pcpusec->sh_size, align);
		  --> pcpu_alloc(size, align, true, GFP_KERNEL);

  err = post_relocation(mod, info);
	  --> percpu_modcopy(mod, (void *)info->sechdrs[info->index.pcpu].sh_addr,
                       info->sechdrs[info->index.pcpu].sh_size);
		--> for_each_possible_cpu(cpu)
                        memcpy(per_cpu_ptr(mod->percpu, cpu), from, size);
```

chunk内存的管理逻辑本文将不涉及。

对于dynamic区域的per cpu变量，其区别在于如果该区域的内存耗尽了，是可以继续申请的。这也是first_chunk含义的由来，内核在初始化时，设置的dynamic区域被称为first chunk。其余用法与reserved一致。

### RSEQ(restartable-sequences)机制

#### 诞生背景

并发控制策略可以粗略的分为两种：乐观并发控制(Optimistic Concurrency Control)和悲观并发控制(Pessimistic Concurrency Control)。

悲观并发控制，认为该数据的竞争较为激烈，总是先进行获取锁的动作，再去处理数据，典型的设计就是kernel中的mutx。

乐观并发控制，认为该数据的竞争情况较少。乐观并发控制的一般过程如下：
1. 读取数据，记录时间戳。
2. 处理数据，处理结束后。在修改生效前，将相关数据的时间戳与记录数据戳进行比较，如果不一致，则进行回滚操作。
3. 如果一致，则执行修改操作。
这种思路最直观的实现，就是CAS(compare and swap)锁。

CAS锁的问题在于，其实现需要借助原子变量。体系结构的原子变量实现，通常需要锁总线，这一操作会带来较大的开销。

RSEQ机制源于一种观察，以链表插入为例，通常实现为：
```
1. node = head->next;
2. head->next = node;
```
将第一步称为准备区，用于产生最终需要提交的数据。第二步称为提交区，将修改完成的数据提交生效。在第二步执行之前，第一步的重复执行，是不会影响最终的程序结果的。如果线程在准备区开始到提交生效最终之前的执行过程被打断(调度或者信号...)，那么线程只需要从准备区开始位置重新执行即可。rseq机制可以避免原子操作带来的锁总线开销，但是，代价是被打断后重新执行的开销。在临界区(准备区+提交区)比较小或者竞争不激烈的情况下，刚好在这一区域被打断的概率是很低的，已有的数据表明(来自tcmalloc)，rseq的效率是高于CAS的。


#### 参考

1. [Per-CPU variable module writing](https://programmer.ink/think/kernel-kernel-per-cpu-variable-module-writing.html)
2. [Better per-CPU variables](https://lwn.net/Articles/258238/)
3. [PERCPU变量实现](https://zhuanlan.zhihu.com/p/260986194)
4. [smp_processor_id()获取当前执行cpu_id](https://www.cnblogs.com/still-smile/p/11655239.html)
5. [The 5-year journey to bring restartable sequences to Linux](https://www.efficios.com/blog/2019/02/08/linux-restartable-sequences/)
6. [google/tcmalloc](https://github.com/google/tcmalloc/blob/master/docs/design.md)
7. [facebookarchive/Rseq](https://github.com/facebookarchive/Rseq/blob/master/Rseq.md)
