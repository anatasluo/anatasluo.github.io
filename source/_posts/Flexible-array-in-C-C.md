---
title: Flexible array in C/C++
date: 2020-06-12 13:16:43
tags:
    - C
    - C++
    - Memory
---

数据结构，是数据的抽象和组织方式。对程序语言来说，数据结构是内存的解释方式。可变数组，是指大小不固定的数组。可变数组，通常是某个结构体的最后一个成员。可变数组，在通信等场景中有着大量的应用。

## ISO C99中的可变数组

可变数组(flexible array member)已经成为ISO C99标准的一部分，在C99的规定中，可变数组的使用存在以下限制:

1. 可变数组属于incomplete type，仅能为结构体的最后一个成员
2. 不能有包含可变数组成员的结构体组成的数组
3. 拥有可变数组成员的结构体不能作为其他结构体的成员
4. 拥有可变数组成员的结构体还应该拥有至少一个其他命名成员

查看如下代码，C99标准中可变数组的使用

```
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#define SIZE 100

struct Pack {
    int num;
    char data[];
};

int main()
{
    struct Pack *p = (struct Pack *)malloc(SIZE + sizeof(struct Pack));
    p->num = SIZE;
    memset(p->data, 0, sizeof(char) * p->num);
    free(p);
    return 0;
}
```

可变数组的起始地址，是通过偏移计算出来的。因此可变数组如果长度为0，本身并不占据空间。对于编译器来说，可变数组是无视越界检查的incomplete type，因此，可变数组的使用过程中，需要十分谨慎，不能引起越界访问，否则可能造成各种无法预知的问题。

## 标准之前的可变数组

在可变数组成为ISO C一部分之前，其使用方式通过是如下方式实现的(以下代码来自[Nuttx](https://github.com/apache/incubator-nuttx))

包含可变数组的结构体定义:
```
struct tmpfs_file_s
{
  /* First fields must match common TMPFS object layout */

  FAR struct tmpfs_dirent_s *tfo_dirent;
  struct tmpfs_sem_s tfo_exclsem;

  size_t   tfo_alloc;    /* Allocated size of the file object */
  uint8_t  tfo_type;     /* See enum tmpfs_objtype_e */
  uint8_t  tfo_refs;     /* Reference count */

  /* Remaining fields are unique to a directory object */

  uint8_t  tfo_flags;    /* See TFO_FLAG_* definitions */
  size_t   tfo_size;     /* Valid file size */
  uint8_t  tfo_data[1];  /* File data starts here */
};
```

大小计算方式如下
```
#define SIZEOF_TMPFS_FILE(n) (sizeof(struct tmpfs_file_s) + (n) - 1)
```

相比于ISO C99的用法，这种用法，要求可变数组的长度至少为1。因此，在计算数组长度的时候，需要减去1，以消除该成员带来的影响，使用方式上则与ISO C99上没有差异。倒不如说，正是由于C语言标准的发展滞后，才会出现这种写法，并最终发展为C语言标准的一部分。

## 参考

+ [DCL38-C. Use the correct syntax when declaring a flexible array member](https://wiki.sei.cmu.edu/confluence/display/c/DCL38-C.+Use+the+correct+syntax+when+declaring+a+flexible+array+member)

+ [Arrays of Length Zero](https://gcc.gnu.org/onlinedocs/gcc/Zero-Length.html)