---
title: '[note]理解编程语言'
date: 2020-02-14 00:06:01
tags:
    - Program Language
    - Note
---


*Understanding Programming Languages* (M.Ben-Ari) 的读书笔记。

--------------------
<br/>

## 编程语言定义，组成及编程环境
<br/>

### 编程语言定义

对程序员来说，编程语言只是编程的工具，很多程序员沉迷于比较不同的编程语言，但是缺乏分析不同语言特点的能力。

编程语言知识的匮乏，导致以下问题：

1. 尽管计算机硬件和现代软件系统的爆炸发展，大多数人仍然使用1970年甚至更早之前发展出的语言。编程语言的发展落后，使得程序员不得不采用更多的工具和方法进行弥补。
2. 在选择开发语言时，没有充分考虑安全性和效率，导致开发出的项目难以维护，开发者常常通过汇编而不是算法和编程本身来解决效率问题。

编程语言的存在，是为了弥补硬件和真实世界之间的不同抽象差距。高抽象的语言易于理解和使用，低抽象的语言则更为灵活和高效。设计和选择一门语言，就是选择一种合适的抽象。

从数学上来说，一个程序是详细说明一个运算过程的一段符号序列。一门编程语言是描述这个序列如何构成以及运算过程含义的规则集合。
<br/>

### 编程语言分类

在wiki百科中，对编程语言分类方式的描述是：

> 编程范式、编程范式或程序设计法(Programming paradigm)，是一类典型的编程风格，是指从事软件工程的一类典型的风格。如函数式编程、过程式编程、面向对象编程、指令式编程等等为不同的编程范型。
> 
> 编程范型提供了（同时决定了）程序员对程序执行的看法。例如，在面向对象编程中，程序员认为程序是一系列相互作用的对象，而在函数式编程中一个程序会被看作是一个无状态的函数计算的序列。
> 
> 正如软件工程中不同的群体会提倡不同的“方法学”一样，不同的编程语言也会提倡不同的“编程范型”。一些语言是专门为某个特定的范型设计的（如Smalltalk和Java支持面向对象编程，而Haskell和Scheme则支持函数式编程），同时还有另一些语言支持多种范型（如Ruby、Common Lisp、Python和Oz）。
> 
> 很多编程范型已经被熟知他们禁止使用哪些技术，同时允许使用哪些。例如，纯粹的函数式编程不允许有副作用；结构化编程不允许使用goto。可能是因为这个原因，新的范型常常被那些习惯于较早的风格的人认为是教条主义或过分严格。然而，这样避免某些技术反而更加证明了关于程序正确性——或仅仅是理解它的行为——的法则，而不用限制程序语言的一般性。
> 
> 编程范型和编程语言之间的关系可能十分复杂，由于一个编程语言可以支持多种范型。例如，C++设计时，支持过程化编程、面向对象编程以及泛型编程。然而，设计师和程序员们要考虑如何使用这些范型元素来构建一个程序。一个人可以用C++写出一个完全过程化的程序，另一个人也可以用C++写出一个纯粹的面向对象程序，甚至还有人可以写出杂揉了两种范型的程序。

以下是常见的分类：
<br/>

#### 指令式语言和声明式语言

指令式语言(Imperative programming)，即详细的描述整个过程，一步步的告诉计算机如何完成计算过程。
考虑一个简单的数学问题 —— 从一组数中寻找最大数，对于指令式语言来说，过程通常如下：

1. 创建一个用于保存结果的变量
2. 遍历数组，一一比较
3. 将最终的结果返回


声明式语言(Declarative programming)，即告诉计算机结果应该满足的条件，由编译器来决定如何获得结果。

相同的问题，对声明式语言来说，最大的数就是结果限制，编译器会自动推导出过程。

声明式语言,主要用于处理大量数据或者那些解决过程无法被详细描述的问题，包括：
+ language processing(语言处理)
+ pattern matching(模式匹配)
+ process optimization(模型优化)

指令式语言和声明式语言是一个相对的概念，如上文所说，编程语言是为了弥补硬件和真实世界之间的抽象差距。对于最底层的CPU指令来说，其核心就是用“变量定义 + 顺序执行 + 分支判断 + 循环”来表达逻辑过程。上层的应用，则是通过层层封装，来表现现实世界中的过程。越接近底层的表达，就越“指令式";越接近现实世界的表达，就越“声明式”。

一般来说，C/C++，Java，JavaScript，Python等等被认为是指令式语言。SQL，HTML/CSS等等被认为是声明式语言。指令式语言通常需要更多的表达，声明式语言通常在效率上有所损失。
<br/>

#### 编译型语言和解释型语言

编译型和解释型语言的差别在于，生成目标CPU指令的时机不同。编译型是语言是源代码通过编译器，直接生成特定CPU体系的可执行文件。解释型语言通过源代码生成一种**平台无关**的中间代码，在运行过程中再将中间代码解释成目标平台的CPU指令。

一般认为C/C++等等是编译型语言，JavaScript、Python等等是解释型语言。相对来说，编译型语言效率更高，解释型语言更为灵活。但是，当前编程语言的发展，编译型语言和解释型语言的界限并不是特别清晰，考虑以下几个情况：

+ Java代码首先会被编译成虚拟机指令，然后，由虚拟机执行的时候，翻译成目标架构CPU指令。在一些教科书上，Java被成为半编译型或者混合型语言。

+ Python既可以直接解释源代码执行，也可以编译成虚拟机指令后，运行。

+ C#的源代码会首先被编译成一种中间文件，然后，借助.Net Framework虚拟机，通过中间代码，直接生成目标CPU架构的可执行文件。接着，直接执行该可执行文件。

+ 通过V8引擎，JavaScript源码可以直接生成目标CPU架构指令。这种应用在解释器上的技术，被称为JIT(即时编译, Just-In-Time)。对于解释型语言来说，通过JIT，再将生成的目标文件缓存起来，与编译型语言直接生成可执行文件，其实是没有太大区别的。

如上文所说，编程语言本质是为了弥补硬件和真实世界之间的抽象差距。所谓编译型/解释型，只是最终生成目标CPU指令的时机不同。两者之间的界限是非常模糊的，在一些情况下，甚至是可以相互转化的。
<br/>

#### 面向数据编程

面向数据编程，即围绕着一种数据结构以及与数据结构相关的操作进行编程。这种编程范式在编程语言发展早期非常流行，这种编程语言主要用于科学计算和研究中，从数学的角度，而不是从工程的角度来实现语言。

支持该种设计的语言包括：

+ Lisp: Lisp的基本数据结构是linked list，当前，Lisp主要活跃在人工智能领域。
+ APL : APL的基本数据结构是vectors和matrics, APL是从数学形式体系中发展出来的。
+ Snobol/Icon :Snobol和Icon的基本数据结构是string，主要用于文本处理。
+ SETL: SETL的基本数据结构是set，用于数学计算。

这种类型的语言，当前已经不再那么流行，主要由于以下两个原因：

1. 面向对象语言，拥有类似的能力。
2. 函数式编程和逻辑式编程概念的出现。

<br/>

#### 面向对象编程(OOP)

面向对象编程(Object-oriented programming, OOP)，即将对象作为基本单元的编程方式。对象，是对真实世界中物体概念的抽象，对象包括数据以及对相应数据的操作。

最早出现的OOP语言是Simula，于20世纪60年代由K.Nygaard和O.-J.Dahl开发，用于系统仿真。

早期OOP中发展出的最重要的概念为 -- 动态(dynamic, run-time)内存分配，动态运行调度，动态类型检查。区别于静态(static, compiler-time)，动态会带来额外的时间和内存花销。

C++既支持静态内存分配和静态类型检查的，也支持OOP的动态内存分配和动态类型检查。这表明，动态和静态的设计并不冲突，动态可以在需要的时候使用。就OOP来说，Java要比C++的设计更为“纯粹”。
<br/>

### 编程语言标准化

编程语言的标准化，对编程语言的发展至关重要。但是，标准化常常是滞后于编程语言发展的。以C语言为例，gcc实现的很多特性，并不是标准C语言支持的，这些特性有些被广泛接受，成为后续标准的一部分，有些没有被接受。如果这些非标准的特性被使用，一定要特别谨慎，因为这会导致程序的兼容性变差。
<br/>

### 编程语言存在的理论基础(可计算性)

在20世界30年代，早于电子计算机发明之前，逻辑学家已经开始研究计算的抽象概念。Alan Turing和Alonzo Church分别提出一种经典，简单的计算模型，分别叫做图灵机和λ演算。随后，Church-Turing 猜想被提出：

> 任何在算法上可计算的问题同样可由图灵机计算。

尽管该猜想未能被证明，但是，到目前为止，几乎是被全面接受的。

图灵机的基本思想使用机器来模拟人们用纸笔来进行数学运算的过程，图灵机将这种过程分成四步：
1. 一条无限长的纸带TAPE。纸带被划分为一个接一个的小格子，每个格子上包含一个来自有限字母表的符号，字母表中有一个特殊的符号□表示空白。纸带上的格子从左到右依次被编号为0, 1, 2, ...，纸带的右端可以无限伸展。
2. 一个读写头HEAD。该读写头可以在纸带上左右移动，它能读出当前所指的格子上的符号，并能改变当前格子上的符号。
3. 一套控制规则TABLE。它根据当前机器所处的状态以及当前读写头所指的格子上的符号来确定读写头下一步的动作，并改变状态寄存器的值，令机器进入一个新的状态，按照以下顺序告知图灵机命令：
    1. 写入（替换）或擦除当前符号；
    2. 移动 HEAD， 'L'向左， 'R'向右或者'N'不移动；
    3. 保持当前状态或者转到另一状态
4. 一个状态寄存器。它用来保存图灵机当前所处的状态。图灵机的所有可能状态的数目是有限的，并且有一个特殊的状态，称为停机状态。参见停机问题。

图灵机的模型是如此简单，任何编程语言都可以实现对图形机的模拟。因此，如果图灵机可以解决一个问题，那么编程语言同样可以。
<br/>

### 编程语言的构成元素
<br/>

#### 句法(Syntax)

句法，是定义编程语言中有效符号序列的规则集合。

句法，通过形式记号(formal notation)来描述。句法中最广泛使用的形式记号是扩充巴科斯范式(Extended Backus-Naur Form，EBNF)。

句法相关的常见错误包括：

+ 标识符的长度限制
+ 大小写是否敏感
+ 注释的不同写法
+ 写法接近但含义完全不同的符号(= vs ==)
+ 分割符

<br/>

#### 语义(Semantics)

语义，是编程语言中表达式的含义，即描述程序如何在不同状态之间进行转换。

形式化编程语言语义(a formalization of the semantics of programming languages)的好处在于，程序的正确性很容易得到证明。如果程序的输入数据满足要求，那么相应的输出也将符合预期。
<br/>

#### 数据(Data)

编程语言中，都会有对数据的抽象。即使是最底层的汇编语言，也是基于对寄存器、内存单元之类的物理实体的操作。因此，编程语言可以有如下定义：

type(类型): 值，以及对这些值的操作的集合
value(值): 一个未定义的基本概念
Literal: 程序中文字声明的特定值
Representation: 值在计算机中的二进制表示
Variable: 存储值的内存单元名称
Constant: 不变的值
Object: variable or Constant

对于一个Variable来说，一定是某个特定的类型。因为，只有知道了类型，编译器才能分配相应的内存。
<br/>

#### 赋值语句

编程语言的赋值过程分为3步：

1. 计算右值
2. 计算左值地址
3. 将右值存储于左值地址

<br/>

#### 类型检查

类型检查用于检查赋值过程中右值结果与左值类型是否兼容。

赋值包括函数调用过程中，将实参赋给形参，可能的结果有3种：
1. 类型一致
2. 隐式转换
3. 无法转换，报错

类型转换是可靠性和便捷性之间的一种权衡。
<br/>

#### 控制语句

控制结构有2种：
1. 选择语句
2. 循环语句

<br/>

#### 子程序和模块

对于大型的工程来说，不同的程序语言，提供了不同的组织方式。比如，C语言的.c，.h文件，Java的包管理器等等。
<br/>

### 编程环境

使用编程语言的过程中，需要一系列的工具，包括：

+ 编辑器
+ 编译器/解释器
+ 链接器
+ 装载器
+ 库管理工具
+ 调试器
+ 分析器
+ 测试工具
+ 配置工具

<br/>

## 编程语言的基本概念

<br/>

### 基本数据类型

+ Integer types
+ Enumeration types
+ Character type(可以借助Enumeration types实现)
+ Boolean type
+ Subtypes(已有类型+使用限制)
+ Derived types
+ Expressions(一般借助逆波兰表达式[RPN]实现)
+ Assignment statements

<br/>

### 复杂数据类型

+ Records

    <div style="text-indent:0em;padding:2em">Records是由一系列其他类型组成的统合，比如C语言中的struct，Ada中的components。Records的定义表明了其内存布局，组成Records的每一个部分，都对应的名称和类型，编译器可以很容易的计算出每一部分的offset，从而找到其在内存中的位置。</div>

+ Arrays
    
    <div style="text-indent:0em;padding:2em">Arrays与Records的不同在于，Arrays是由同一类型组成的。</div>

+ Reference semantics(引用)

    <div style="text-indent:0em;padding:2em">C/C++的设计中，pointer的使用常常导致严重的bug。Ada通过类型检查和访问级别(access levels)来规范pointer的使用，Java/Eiffel/Smalltalk则使用引用来解决这一问题。对于Java来说，非基本类型的声明，不会导致相应类型内存被分配，只是获得了一个隐式的指针，内存的分配需要通过new来获得。引用可以看做更加安全的指针用法，内存分配，寻址，越界检查等等的操作都是由编译器自动完成的，也就减少了出问题的概率。</div>

+ String type

    <div style="text-indent:0em;padding:2em">字符串，本质上就是char类型的数组。但是，通常，编译器会提供一些语法糖，来增强字符串的用法。</div>

+ Multi-dimensional arrays

    <div style="text-indent:0em;padding:2em">多维数组有两种声明方式：一种是直接声明，比如C语言中的a[2][2];一种是声明类型是数组的数组。</div>

### 控制结构

+ switch-/case-statements

+ if-statements

    <div style="text-indent:0em;padding:2em">if有两种实现：(1) short-circuit evaluation: C语言采用的就是这种实现，即逻辑计算过程中，一步步进行，如果结果确定，就不进行后续计算。(2) full-evaluation: 将逻辑表达式作为一个整体，计算出结果后跳转。 短路的实现，可以执行更少的指令，但是需要更多的jump，也就需要更多的内存去存储多余的指令。两者之间的效率对比取决于逻辑表达式的复杂程度。</div>

+ loop statements

+ for-statements

+ sentinels(一种循环优化写法)

    <div style="text-indent:0em;padding:2em">一个改善循环写法的技巧，比如在长度为N的数组A中寻找dst，将数组A扩展至N+1, 最后一个元素存储为dst，从头遍历数组，判断返回的下表即可知道数组是否包含dst。这种写法被称为“哨兵”，好处在于，只需要判断值是否相等，不需要担心下标越界，因为总会有满足的下标，从而减少了所需要的判断，提升了效率。</div>

+ go-to statements

    <div style="text-indent:0em;padding:2em">关于goto，是否应该被使用在编程语言中，仍然存在严重争论。反对者中包括Dijkstra，1968年Dijkstra写了一篇著名的文章 - “goto Considered Harmful"，阐明他反对goto的原因。</div>

### 子程序结构

+ 子程序定义

    <div style="text-indent:0em;padding:2em">子程序是程序中独立的编译/执行单位，使用子程序的好处是显而易见的： (1)代码复用，节省空间，提高开发效率。(2)代码的可读性和维护性都会得到提升。子程序通常包括：(1)接口，表明子程序的调用方式。(2)子程序使用到的本地参数。(3)子程序实现。C语言中最典型的子程序结构是function。</div>

+ 传参

    <div style="text-indent:0em;padding:2em">传参过程中有两种定义需要区分：(1) 形参(formal parameter)：形参是函数声明中的参数值。(2)实参(actual parameter):函数调用发生时，实际传给子程序的参数值。传参的方式有两种，一种是值传递，一种是地址传递。地址传递可以看做特殊的值传递，传递的值是地址，地址传递过程中经常会有踩内存的问题，需要对程序的内存管理有一定了解，才能最大程度上缓解该问题。一些编程语言的实现中，将参数和具体的名称关联，允许默认参数，简化了传参过程。</div>

+ Block structure

    <div style="text-indent:0em;padding:2em">这个概念，我没找到很好的翻译。所谓Block structure，就是子程序的主体部分，即除了声明之外的部分。编程语言对Block structure的支持，主要有两个区别：(1) 是否被命名。(2)是否支持嵌套使用。C语言对应的支持为：(1)未命名(2)不嵌套。未命名的Block structure是为了约束变量的使用范围;嵌套则是为了在子程序内部进一步复用重复的逻辑。这也引出一个很重要的问题，即参数是否能被访问。有3个概念对此进行描述：(1)访问范围 - scope (2) 可见性 - visibility (3) lifetime - 生命周期。一般来说，在访问范围内，变量都是可见的。但是存在一种变量被隐藏的情况，以C语言为例，如果函数体内部有跟全局变量同名的本地变量，那么对于该全局变量来说，就是可以访问，但是不可见。相比与写成子程序，Block structure的优势在于可以访问内部的变量。问题在于，过多的嵌套，会造成代码难以维护。Javascript对于嵌套函数的使用，就是一个很好的例子。在嵌套的调用过程中，对于如何获取外部的参数，存在两种方式：(1)Dynamic chain：每部分都保存指向上级内存的指针，层层回溯，直到找到需要的参数值。(2)Static chain: 嵌套调用过程中，给每个调用部分设定一个level，仅寻找level低于当前调用部分的上级，这是编译器的一种优化策略，缩短寻找的过程，具体内容可以查询参考9。</div>

## 编程语言的高级概念

<br/>

### 指针

<div style="text-indent:0em;padding:2em">指针，即存储的内容是一个内存地址。无论指针指向的类型是什么，指针占用的内存大小都是一样的，都为一个字长。指针的类型，决定了编译器对地址开始的内存空间的解释，以及偏移的计算。</div>

<div style="text-indent:0em;padding:2em">指针的操作包括：取地址，解引用，赋值，地址自增、自减。根据这些概念，又出现了二维指针，数组等概念。大体上，指针和类型，结合内存管理，实现了对内存的解释。</div>

<div style="text-indent:0em;padding:2em">在内存的管理上，内存类型可以分为Code/Constants/Stack/Static Data/Heap 。其中Heap的使用比较灵活，类似C这种偏底层的语言，完全由开发者管理，类似于Java这种上层语言，则发展出了垃圾回收机制。</div>

<br/>

### 数的表示(Real Numbers)

+ 数的表示方法

    <div style="text-indent:0em;padding:2em">对于小数0.2，有两种表达方式，一种是直接表示对应的十进制数，即对于小数的每一位，直接分配4个bit表示，这种方法被称为 binary-coded decimal(BCD)。一种是分权二进制表示，即第一位表示1/2，第二位1/4，以此类推，这种方法是存在精度损失的。</div>

    <div style="text-indent:0em;padding:2em">由于BCD使用四位bit去表示十种情况，对内存的浪费事比较多的。同时BCD的表示方法，也不利于运算。因此，实际使用中，二进制表示法更为广泛，只有少数语言支持了BCD，比如Cobol。</div>

+ 定点数(fixed-point numbers)

    <div style="text-indent:0em;padding:2em">定点数表示，即使用固定的位数表示小数点前面的部分，使用固定的位数表示小数点后面的部分。</div>

    <div style="text-indent:0em;padding:2em">定点数表示法的优势在于，足够准确，即绝对错误比较小。劣势在于，不够精确，相对错误较大。</div>

+ 浮点数(float-point numbers)

    <div style="text-indent:0em;padding:2em">浮点数表示法，发展自科学计数法。将数通过科学技术法表示成固定形式，再分别存储数的符号，底数和指数部分即可。</div>

    <div style="text-indent:0em;padding:2em">浮点数表示法的优势在于相对错误较小，因为指数部分是单独存储的。缺点在于绝对错误较大，相对错误会被指数部分进行放大。</div>

+ 硬件和软件浮点

    <div style="text-indent:0em;padding:2em">一般来说，浮点计算是有专门的硬件支持的。对于没有硬件支持的计算机来说，可以通过触发异常，使用软件模拟浮点运算。</div>

+ 浮点运算的三类错误

    <div style="text-indent:0em;padding:2em">浮点数运算中，存在三类比较常见的错误：(1)微增(Negligible addition):一个很大的数加上一个很小的数，由于浮点数的表示，很小的数会被忽略不计。(2)错误方法(Error magnification):由于浮点数的表示方式，很小的相对错误被指数方法后，绝对错误很大。(3)失去含义(Loss of significance):计算机中的比较，是通过相减，然后将结果与0相比较。由于浮点数的表示方式，或者是编译器的优化，都会导致一定的误差。从而导致最终的结果不符合预期。一般来说，会将结果在一个小范围内进行比较。</div>

### 多态(Polymorphism)

+ 类型转换

    <div style="text-indent:0em;padding:2em">类型转换，即从一个类型，转换到另外一个类型。有两种情况：(1)将一种类型的值，有效的转换为另外一种。(2)将值转换为未被解释的比特字符串。(即存储内容不变，解释方式变化。)</div>

+ 重载(Overloading)

    <div style="text-indent:0em;padding:2em">重载，即在同一个作用范围里，使用同一个名字来表示不同的实体。</div>

+ Generics(泛型)

    <div style="text-indent:0em;padding:2em">泛型，是一种在编译时，由编译器来决定类型的类型。泛型的出现，是为了复用那些类型无关的代码，比如最常见的排序算法。</div>

+ Variant records(可变类型)

    <div style="text-indent:0em;padding:2em">可变类型，是指同一种可以被解释成不同的内存布局。C语言中比较常见的用法是，一个结构体中，存在一个字段表明类型，以及一些共同的字段，以及一个联合体。依据类型的不同，联合体的解释也不同。</div>

+ Dynamic dispatching(动态分发)

    <div style="text-indent:0em;padding:2em">在运行时，根据类型，运行对应的路径。动态分发，一般用在面向对象的设计中。</div>

<br/>

### 异常(Exception)

+ 异常的定义

    <div style="text-indent:0em;padding:2em">异常，即程序遇到错误时，需要做的处理。简单的可以是打印一些现场信息，复杂的则需要做一些处理，帮助恢复程序的运行，如果是不可恢复的问题，则直接退出。</div>

+ 异常的代价

    <div style="text-indent:0em;padding:2em">引入异常机制的代价主要来自于两个方面：(1)异常检测和处理本身需要额外的实现和运算。(2)异常处理代码本身也可能有bug，从而继续引发问题。</div>

+ 好的异常处理机制

    <div style="text-indent:0em;padding:2em">从异常的代价很容易就看到，一个好的异常处理机制应该满足:(1)在没有异常发生时，异常机制引入的代价几乎可以忽略不计。(2)异常机制应该是安全且易于使用的。</div>

+ 异常机制与if的区别

    <div style="text-indent:0em;padding:2em">if表明的是一种可能性的判断，是预期内的事情。异常是预期之外发生的事情，一般表明程序运行出了问题。</div>

+ 异常机制的实现

    <div style="text-indent:0em;padding:2em">异常机制，一般通过一张异常向量表实现。由于异常极少数情况下才会发生，异常向量表的代价几乎可以忽略不计。</div>

<br/>

### 并发(Concurrency)

+ 并发需要处理的问题

    + 同步(Synchronization)
    + 通信(Communication)

+ CSP(Communicating Sequential Processes)(单独开坑写写这个)

## 编写大型系统

### 程序分解

+ 分开编译
+ 模块化编程
+ 依赖管理

### 面向对象编程

+ 面向对象编程的三个特征

    + 封装和抽象(Encapsulation and data abstraction)
    + 继承(Inheritance)
    + 多态(Dynamic polymorphism)

+ 关于面向对象的更多内容

    + 虚拟类(Abstract classes)
    + 泛型(Generics)
    + 多继承(Multiple inheritance)

<br/>

## 非指令性编程语言(Non-imperative Programming Languages)

+ 面向函数编程(Functional Programming)

    <div style="text-indent:0em;padding:2em">面向函数编程，更符合数学思维的表达习惯。对函数式编程来说，不需要直接管理内存，也不存在一般语言中组件间相互作用带来的副作用。代表性的语言包括：ML(Meta Language)</div>

+ 面向逻辑编程(Logic Programming)

    <div style="text-indent:0em;padding:2em">面向逻辑编程，即把计算过程，分解成一个个逻辑表达式。整个编程风格是高度抽象，声明式的。代表性的编程语言包括：Prolog</div>

<br/>

## 参考

1. [声明式编程和命令式编程有什么区别？](https://www.zhihu.com/question/22285830)
2. [解释型语言和编译型语言的区别](https://blog.csdn.net/zhu_xun/article/details/16921413)
3. [程序的编译与解释有什么区别？](https://www.zhihu.com/question/21486706)
4. [JavaScript、Node.js与V8的关系](https://segmentfault.com/a/1190000014722508)
5. [编程范型](https://zh.wikipedia.org/wiki/%E7%BC%96%E7%A8%8B%E8%8C%83%E5%9E%8B)
6. [邱奇－图灵论题](https://zh.wikipedia.org/wiki/%E9%82%B1%E5%A5%87%EF%BC%8D%E5%9B%BE%E7%81%B5%E8%AE%BA%E9%A2%98)
7. [图灵机](https://zh.wikipedia.org/wiki/%E5%9B%BE%E7%81%B5%E6%9C%BA)
8. [扩充巴科斯范式](https://zh.wikipedia.org/wiki/%E6%89%A9%E5%85%85%E5%B7%B4%E7%A7%91%E6%96%AF%E8%8C%83%E5%BC%8F)
9. [Implementing Subprograms](http://courses.cs.vt.edu/~cs3304/Spring00/notes/Chapter-9/index.htm)