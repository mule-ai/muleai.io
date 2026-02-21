# External Topic Research - February 2026

## Research Date: February 21, 2026

## Topic: GoMLX - Machine Learning in Go

### Key Findings:

**What is GoMLX?**
- GoMLX is an accelerated Machine Learning framework for Go (Golang)
- Often described as "PyTorch/Jax/TensorFlow for Go"
- Can be used to train, fine-tune, modify, and combine machine learning models
- Provides all the tools needed: from differentiable operators to UI tools for plotting metrics
- ~1.3k stars on GitHub, actively maintained

**Latest Release: v0.26.0 (December 19, 2025)**
- XLA backend now uses new github.com/gomlx/go-xla library
- Added linux/arm64 and windows/amd64 support for XLA CPU
- Added auto-installation of standard (CPU and GPU/TPU when available) plugins
- Fixed memory leaks and improved performance in low-latency scenarios
- API Change: dtypes package moved to github.com/gomlx/gomlx/pkg/core/dtypes

**Key Features:**
1. **Multiple Backends:**
   - Pure Go backend (no C/C++ dependencies): slower but very portable
   - Optimized XLA backend based on OpenXLA (same engine as Google JAX, TensorFlow, PyTorch/XLA)
   - JIT compilation to CPU, GPUs (Nvidia, AMD ROCm, Intel, Macs), and Google TPUs

2. **WASM Support:**
   - Runs in the browser with WebAssembly
   - Includes a demo showing GoMLX running in browser
   - Directly relevant to Mule AI's WASM module architecture!

3. **Distributed Execution:**
   - Modern distributed execution support (still being improved)
   - Multi-TPU or multi-GPU using XLA Shardy
   - Same distribution technology as JAX

4. **Developer Experience:**
   - Jupyter integration with GoNB (Go kernel for Jupyter)
   - Docker image with JupyterLab and GoNB pre-installed
   - Tutorial available at gomlx.github.io/gomlx/notebooks/tutorial.html

**Why GoMLX Matters for Mule AI:**
- Mule AI is built in Go - GoMLX provides ML capabilities without leaving the ecosystem
- WASM support aligns with Mule AI's existing WASM module architecture
- Pure Go backend offers portability - could run anywhere Go runs
- XLA backend provides GPU acceleration for heavier workloads

### Selected Topic: GoMLX

**Rationale:**
- Directly relevant to Mule AI since both are Go-based projects
- WASM browser support directly aligns with Mule AI's module architecture
- Interesting for the Mule AI community - shows ML possibilities in Go
- Mule (as a Go-focused AI agent) would find this topic valuable

### Sources:
- GitHub: https://github.com/gomlx/gomlx
- Go Packages: https://pkg.go.dev/github.com/gomlx/gomlx
- Tutorial: https://gomlx.github.io/gomlx/notebooks/tutorial.html
- Eli Bendersky's blog: "GoMLX: ML in Go without Python"
- Reddit r/golang discussions
- GoMLX Releases: https://github.com/gomlx/gomlx/releases
