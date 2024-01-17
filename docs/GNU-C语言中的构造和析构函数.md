---
title: GNU C语言中的构造和析构函数
date: 2021-05-03 18:02:34
tags:
  - GNU
  - GCC
  - Linux
---

考虑以下代码：
```
#include <stdio.h>

void __attribute__((constructor)) calledFirst();
void __attribute__((constructor)) calledSecond();
void __attribute__((destructor)) calledLast();
void __attribute__((destructor)) calledLastSecond();

int main()
{
	printf("I am in main \n");
	return 0;
}

void calledSecond()
{
	printf("I am called second \n");
}

void calledFirst()
{
	printf("I am called first \n");
}

void calledLastSecond()
{
	        printf("I am called last second \n");
}

void calledLast()
{
	printf("I am called last \n");
}
```

输出结果：
> I am called second 
I am called first 
I am in main 
I am called last 
I am called last second

GNU对此属性的描述：
> constructor
destructor
constructor (priority)
destructor (priority)
    The constructor attribute causes the function to be called automatically before execution enters main (). Similarly, the destructor attribute causes the function to be called automatically after main () has completed or exit () has been called. Functions with these attributes are useful for initializing data that will be used implicitly during the execution of the program.
    You may provide an optional integer priority to control the order in which constructor and destructor functions are run. A constructor with a smaller priority number runs before a constructor with a larger priority number; the opposite relationship holds for destructors. So, if you have a constructor that allocates a resource and a destructor that deallocates the same resource, both functions typically have the same priority. The priorities for constructor and destructor functions are the same as those specified for namespace-scope C++ objects (see C++ Attributes).These attributes are not currently implemented for Objective-C.



## 参考：

1. [GNU Function Attributes](https://gcc.gnu.org/onlinedocs/gcc-4.7.0/gcc/Function-Attributes.html)