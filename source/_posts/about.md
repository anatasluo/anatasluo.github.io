---
title: About
date: 2021-03-31 03:01:12
type: about
comments: false
---

## About Me

- GitHub: [anatasluo](https://github.com/anatasluo)
- Email: [luolongjuna@gmail.com](mailto:luolongjuna@gmail.com)

### Since 2024 · Tencent

Senior Engineer

### 2019–2023 · Huawei / openEuler

- Maintainer, [openEuler SIG-ops](https://gitcode.com/openeuler/community/blob/master/sig/sig-ops/README.md).
- [SysCare](https://atomgit.com/openeuler/syscare) — kernel and userspace live-patch generation and management.
- 2022 — [Livepatch in Userspace Based on Uprobe](https://www.youtube.com/watch?v=6TH7kh3pS0E), Open Source Summit Europe.
- 2022 — [Seamless Kernel Update](https://archive.fosdem.org/2022/schedule/event/security_seamless_kernel/), FOSDEM.

## Recent Work

### Livepatching with LTO

[Kernel objtool/klp](https://lore.kernel.org/all/20260910085218.66565-1-luolongjuna@gmail.com/T/) — Missed changes to same-named call and data references in klp-build.

[GCC PR126841](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=126841) — Defer GIMPLE wrapper section naming until final assembler names are available. ([Commit](https://gcc.gnu.org/g:543617c93595e0cb45ff7ee52c635ca30a2fe361))

[GCC PR126355](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=126355) — Emit address-bearing DWARF entries for IPA ICF wrappers. ([Commit](https://gcc.gnu.org/g:b6477e6c4efd6df2719190cb048cf300ff31af46))

[LLVM/LLD #211062](https://github.com/llvm/llvm-project/pull/211062) — Save ThinLTO objects on cache hits with `--lto-obj-path`.

### AutoFDO Optimization Potential

[AutoFDO #269](https://github.com/google/autofdo/pull/269) — Fix DWARF 5 string-section handling and line-table metadata.

[AutoFDO #268](https://github.com/google/autofdo/pull/268) — Read inline call-site discriminators encoded as `DW_FORM_implicit_const`.

[AutoFDO #267](https://github.com/google/autofdo/pull/267) — Avoid adding the base address to absolute DWARF 5 ranges.

[GCC PR127125](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=127125) — Distorted entry-flow inference when the function-head sample count is zero.

[AutoFDO #266](https://github.com/google/autofdo/pull/266) — Fix indexed-address decoding and operand-width handling.

### DWARF Correctness and Validation

[GDB PR34741](https://sourceware.org/bugzilla/show_bug.cgi?id=34741) — Expression lookup can call overridden weak functions. ([RFC](https://sourceware.org/pipermail/gdb/2026-October/052357.html))

[GDB patch](https://sourceware.org/pipermail/gdb-patches/2026-October/230961.html) — Filter relocated zero-address markers for discarded variables.

[LLVM #230469](https://github.com/llvm/llvm-project/pull/230469) — Filter discarded low-address ranges during compilation-unit lookup.

[LLVM #225358](https://github.com/llvm/llvm-project/pull/225358) — Avoid attributing merged memory accesses to a partial inline frame.

[DWARF proposal](https://lists.dwarfstd.org/pipermail/dwarf-discuss/2026-September/002859.html) — Separate definition-instance addresses from statically selected addresses.

[GCC PR126348](https://inbox.sourceware.org/gcc-patches/20260826075313.22654-1-luolongjuna@gmail.com/T/) — Preserve input-TU DIE references for consistent LTO abstract origins. ([Report](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=126348))

## Earlier Contributions

### kpatch

[#1303](https://github.com/dynup/kpatch/pull/1303) — Detect relocation changes even when section contents match.

[#1301](https://github.com/dynup/kpatch/pull/1301) — Handle relocation sections that disappear after patching.

[openEuler support](https://github.com/dynup/kpatch/commit/6a0dcb0da8e2960559afc33ecefc22ce39e49e2b) — Add openEuler support to kpatch-build.

### CRIU

[x86 assembly](https://github.com/checkpoint-restore/criu/commit/e0da8b895ede46e197e9813dc87b55f4b1a7e93c) — Fix a register-width mismatch in bit operations.

[AArch64 vDSO](https://github.com/checkpoint-restore/criu/commit/2cb1156e6afba4baeab5b945b0c15036af3b3a8c) — Fix a crash during process restoration.

[`proc_smaps`](https://github.com/checkpoint-restore/criu/commit/d203b57357e68447964cad6b6542ebefda832504) — Remove an obsolete nonlinear-mapping check.

### Kernel

[Uprobe handlers](https://www.spinics.net/lists/kernel/msg4516532.html) — Skip single-stepping when a handler changes the program counter.

[Uprobe inspection](https://lore.kernel.org/lkml/eb310620-3913-b673-d35a-cc7d50a74610@huawei.com/T/) — List active uprobes in the system.

[x86 kexec](https://lkml.org/lkml/2020/12/15/486) — Co-develop a CPU-parking path for kexec boot.

[File locking](https://lore.kernel.org/linux-fsdevel/685386c2840b76c49b060bf7dcea1fefacf18176.1614322182.git.luolongjun@huawei.com/) — Print complete lock information.

### Toolchains

[GCC libcpp](https://gcc.gnu.org/pipermail/gcc-patches/2022-December/607605.html) — Allow suppression of `__LINE__` redefinition warnings.

[Binutils/readelf](https://sourceware.org/pipermail/binutils/2021-April/116183.html) — Print section names for section symbols.

### Other System Software

[NuttX tmpfs](https://github.com/apache/nuttx/commit/ab37b149729639fc96a9987f711d18f5286c5541) — Remove duplicated filesystem code.

[Toybox ping](https://github.com/landley/toybox/commit/896fa846b1ec8cd4895f6320b56942f129e54bc9) — Include packet TTL in ping output.

[OpenSSH](https://github.com/openssh/openssh-portable/commit/1050109b4b2884bf50fd1b3aa084c7fd0a42ae90) — Remove a duplicate declaration in `fatal.c`.

[Elixir](https://github.com/bootlin/elixir/commit/514fa38ed8eced5bea900ef3748cd82d2306043b) — Document SELinux and systemd setup.
