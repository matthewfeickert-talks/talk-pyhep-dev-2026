class: middle, center, title-slide
count: false

# HEP Packaging Coordination:<br>Distributing the HEP software ecosystem<br>on conda-forge

.huge.blue[Matthew Feickert], .huge[Chris Burr]<br>
.huge[(University of Wisconsin&ndash;Madison, CERN)]

.large[
[DUNE Software Architecture Meeting](https://indico.fnal.gov/event/75177/)<br>
July 10th, 2026
]

.middle-logo[]

<!--
# Abstract

The packaging of high energy physics software with robust, yet flexible, distribution methods is a complicated problem that has been met with multiple approaches by the community. The [HEP Packaging Coordination](https://github.com/hep-packaging-coordination) community project expands packaging of the HEP software ecosystem through building and distributing language-agnostic conda packages on the conda-forge package index. Through use of the conda-forge community build cyberinfrastructure, computing platform specific optimized builds of packages can be created for selections of Linux, macOS, and Windows across x86-64, AArch64/ARM64, and ppc64le architectures. In addition to supporting [builds of ROOT](https://github.com/conda-forge/root-feedstock), this work provides multi-platform packaging of a wide array of [low-level-language phenomenology tools](https://github.com/conda-forge/collier-feedstock), the [broader simulation stack](https://github.com/conda-forge/pythia8-feedstock), [end-user-analysis tools](https://github.com/conda-forge/awkward-feedstock) and [statistical frameworks](https://github.com/conda-forge/cms-combine-feedstock), and the [reinterpretation ecosystem](https://github.com/conda-forge/rivet-feedstock). Ongoing work is also supporting builds of LHCb experiment software and distributions of community software with experiment-specific patches applied for use in LHC physics analyses.

This process significantly lowers technical barriers across tool development by providing automatic packaging systems with source code, distribution through secure and transparent build cyberinfrastructure, and enables use through multi-platform optimized binary builds. When combined with next generation scientific package management and manifest tools, the creation of fully specified, portable, and trivially reproducible multi-language software environments becomes easy and fast, even with the use of development platforms for hardware accelerators (e.g. CUDA on NVIDIA GPUs). This talk provides an overview of the work, gives practical recommendations for adoption and best practices for both software maintainers and end-user analysts, and demonstrates examples of new distribution methods that are complementary to existing community technologies, such as [CernVM-FS](https://cernvm.cern.ch/fs/).
-->

<!--
# Notes

* https://indico.fnal.gov/event/75177/
* 40 minutes
   - 25 talk
   - 15 questions
-->

---
# HEP Packaging Coordination collaborators

<br><br>

<div class="figure-row align-top circle">
   <figure>
      <a href="https://www.matthewfeickert.com/">
         <img src="https://avatars.githubusercontent.com/u/5142394">
      </a>
   .center[[Matthew Feickert](https://www.matthewfeickert.com/)
   UW&ndash;Madison<br>
   (ATLAS, IRIS-HEP,<br>Scikit-HEP)]
   </figure>
   <figure>
      <a href="https://github.com/chrisburr">
         <img src="figures/chris-burr.jpg">
      </a>
   .center[[Chris Burr](https://github.com/chrisburr)
   CERN<br>
   (LHCb, DIRAC,<br>conda-forge core,<br>Scikit-HEP)]
   </figure>
   <figure>
      <a href="https://cms.fnal.gov/lindsey-gray/">
         <img src="https://developer-blogs.nvidia.com/wp-content/uploads/2021/04/Lindsey_Gray-270x270.jpg">
      </a>
   .center[[Lindsey Gray](https://cms.fnal.gov/lindsey-gray/)
   Fermilab<br>
   (CMS, Scikit-HEP)]
   </figure>
   <figure>
      <a href="https://giordonstark.com/">
         <img src="figures/stark.jpg">
      </a>
   .center[[Giordon Stark](https://giordonstark.com/)
   UC Santa Cruz<br>
   (ATLAS, IRIS-HEP,<br>Scikit-HEP)]
   </figure>
</div>

.bold.center[(everyone is welcome to join!)]

---
# Quick setup for examples

.center.huge[This talk has runnable examples<br>

To follow along, install [Pixi](https://pixi.prefix.dev/) and then restart your shell
]

.smaller[
* Linux / macOS

.center[
<pre class="file-tree">
curl -fsSL https://pixi.sh/install.sh | bash
</pre>
]

* CVMFS (thanks to [Clemens Lange](https://clemenslange.de/))

.center[
<pre class="file-tree">
. /cvmfs/cms-griddata.cern.ch/cat/sw/pixi/latest/setup.sh
</pre>
]

* Linux container

.center[
<pre class="file-tree">
docker run --rm -ti ghcr.io/prefix-dev/pixi:latest
</pre>
]
]

.center[
Pixi is a .bold[fast, modern, and reproducible] software environment management tool for conda and Python packages
<!-- Pixi is a single securely signed Rust binary, it won’t hurt you, and you can trivially remove it from your computer later if you want. -->
]

---
# You may have heard this years ago

<p style="text-align:center;">
   <a href="https://indico.cern.ch/event/773049/contributions/3473243/">
      <img src="figures/chep-2019-title-slide.png"; width=80%>
   </a>
</p>

.center.large[[Chris Burr, CHEP 2019](https://indico.cern.ch/event/773049/contributions/3473243/)]

---
# Heterogeneous approach to software distribution

.huge.center[
In HEP currently have multiple forms of software distribution<br>
(different solutions for different kinds of software)
]

.large[
* Source distribution (Git repository, [Spack](https://spack.io/))
* Operating system specific distributions (`.rpm`, `.deb`)
* Nix packages
* Python packages (sdists and wheels on PyPI, private indexes)
* Conda packages
* Linux container images (Docker, Apptainer)
* [CernVM-FS](https://cernvm.cern.ch/fs/) (globally distributed, immutable, not extensible to end-user)
]

.center[
.huge[Approach "works" but introduces .bold[conflicts] and .bold[friction]]
<br>
.large[(What package type should be used? Will these be compatible? Do the same versions exist?)]
]

---
# End-user wants

.large[
* To be able to create .bold[bespoke software environments] to address their problems without effort or time
   - Minimize the time from idea to implementation
   - Declarative specification of software requirements
* .bold[One tool/system] across all computing systems
   - Software environment workflow on local machine and cluster are same/similar
   - One tool, not $n$ tools
* Multi-platform
   - Solutions exist for Linux `x86_64` and `aarch64`
   - Developing on macOS `arm64` .bold[shouldn't be a barrier to using physics tools]
* Scientific software environment reproducibility
   - .bold[Reproducible by default], not pain and expertise
]

---
# What is a [<img src="figures/conda-logo.svg"; width=2%>onda package](https://prefix.dev/blog/what-is-a-conda-package)?

.kol-3-5[
.large[
* Fundamentally, `zip` compressed archive (`.conda`) containing `.tar.zst` with:
   - JSON metadata (`conda-meta/`) describing package, provenance, requirements, and dependencies
   - .bold[relocatable] files, platform-specific .bold[binaries], symlinks
* Simple yet .bold[general and powerful]
   - Effectively .bold[any] software can be packaged as a conda package
      - Including microarchitecture optimisied software, CUDA libraries
]
<!--  -->
<p style="text-align:center;">
   <a href="https://pixi.prefix.dev/">
      <img src="figures/paxton-mascot-flying.svg"; width=38%>
   </a>
.center["Paxton" the conda package (prefix.dev GmbH)]
</p>
<!--  -->
]
.kol-2-5[
<pre class="file-tree">
<span class="root">.pixi/</span>
└── <span class="dir">envs</span>
    └── <span class="dir">default</span>
        ├── <span class="dir">bin</span>
        ├── <span class="dir">conda-meta</span>
        ├── <span class="dir">include</span>
        ├── <span class="dir">lib</span>
        ├── <span class="dir">man</span>
        ├── <span class="dir">share</span>
        ├── <span class="dir">ssl</span>
        └── <span class="dir">x86_64-conda-linux-gnu</span>
</pre>
.left[Directory tree of an unpacked conda package]
<br>
.center[
<pre class="file-tree">
pixi global install pixi-browse
pixi browse -m root_base
</pre>
]
]

---
# What makes conda packages powerful?

<!-- TODO: Figure out the lead with awesome part -->
.large[
* .bold[Robust standards]: define all requirements down to the `glibc` level
   - Ensures/requires that all dependencies also exist as conda packages
   - No reliance on assumptions that things exist at the OS-level
* .bold[Language agnostic]: The .bold[recipe format] for building a C++, Python, Fortran, Rust, Go package is all the same
* .bold[Multi-platform binary builds] for the same release of a package
   - The conda recipe will be built for all computing platforms it is told to<br>(e.g. `linux-64`, `linux-aarch64`, `osx-arm64`)
* "build variants" that allow for further .bold[refinement and optimization]
   - MPI build variants for MPICH and Open MPI
   - [microarch level](https://prefix.dev/blog/building_cpu_optimized_packages) for enabling Single Instruction, Multiple Data (SIMD)
* .bold[Rebuilds] of packages for the same version
   - Allow for continual updates against ABI changes of dependencies, builds against security patches
]

---
# conda-forge: community cyberinfrastructure

.kol-1-2[
.code-large[
* A "forge" for conda packages [orchestrated through GitHub](https://github.com/conda-forge/)
   - Provides .bold[global build infrastructure] and farm across cloud providers
      <!-- - You provide package recipe, conda-forge builds and distributes it -->
   - Driven through continuous integration actions on independent project "feedstock" GitHub repositories
      <!-- - Automatically updated through bots and feedstock automation tools -->
* Fiscally sponsored NumFOCUS project, financially supported by NVIDIA, in-kind .bold[support across industry]
* HEP connections and leadership
   - [Created](https://www.youtube.com/watch?v=U2oa_RLbTVA) at [SciPy 2015 conference](https://youtu.be/Hacl_YFzZOw?si=5i3LOR7ItZp7ZwIe) by .bold[Phil Elson] (UK Met Office, now at CERN accelerator division) and Filipe Fernandes (US NOAA)
   - .bold[Chris Burr] (CERN, LHCb) serves on conda-forge core / leadership team
]
]
.kol-1-2[
<p style="text-align:center;">
   <a href="https://conda-forge.org/">
      <img src="figures/conda-forge-logo.svg"; width=100%>
   </a>
</p>

<div class="figure-row">
   <figure>
      <img src="figures/conda-forge-infrastructure-sponsors.png">
   </figure>
   <figure>
      <img src="figures/conda-forge-developer-sponsors.png">
   </figure>
</div>
]

---
# conda-forge: community powered

.huge[
<!-- * Impressive global cyberinfrastructure and automation -->
* Community approach of .bold[building coherently together]
   - Over 32,000 packages with over 42 billion downloads and growing
   - Supports building and .bold[using] all packages built on conda-forge together without conflicts (boon over private channel)
   - Provides "[global pinning](https://github.com/conda-forge/conda-forge-pinning-feedstock)" infrastructure to .bold[automatically migrate ABI changes] across entire ecosystem
* Automate the boring stuff, focus on getting useful software
   - New releases of upstream source distribution of software (e.g. GitHub/GitLab, PyPI, HEPForge) automatically picked up by [`regro-cf-autotick-bot`](https://github.com/regro-cf-autotick-bot) to [generate update PR with rebuild](https://github.com/conda-forge/fastjet-cxx-feedstock/pull/21)
   - Immutable package artifacts published to https://anaconda.org/channels/conda-forge/
      - Old releases stay useable "forever", new releases automatically up to date
]

---
# HEP Packaging Coordination

<!-- * What / who is it?
* What does it provide?
* What benefits are there for contributing.
* What can it do today in terms of support. -->

.kol-1-2[
.code-large[
* [Community project on GitHub](https://hep-packaging-coordination.github.io/.github/) to get as much HEP software as possible on conda-forge
   - High quality research software should be trivial to install and provide platform specific optimized binary builds by default
   - Building from source should be an option for development and debugging, not the default
* Contributions from .bold[broader HEP ecosystem]: ATLAS, CMS, LHCb, LEGEND, Belle II, SHiP, IRIS-HEP, Scikit-HEP, ROOT Team, DIRAC, CEDAR, theory and pheno community
   - Initial explorations with .bold[Jake Calcutt] for DUNE
* .bold[Over 120 HEP packages] added to <br>conda-forge
   - Most built for `x86_64` .bold[and] ARM-based architectures
]
]
.kol-1-2[
<div class="figure-stack" style="--height: 24em;">
   <figure style="--x: 0; --y: 0; --z: 1; --w: 70%;">
      <a href="https://hep-packaging-coordination.github.io/.github/">
         <img src="figures/hep-packaging-coordination-analysis.png">
      </a>
   </figure>
   <figure style="--x: 15%; --y: 18%; --z: 2; --w: 70%;">
         <a href="https://hep-packaging-coordination.github.io/.github/">
         <img src="figures/hep-packaging-coordination-simulation.png">
      </a>
   </figure>
   <figure style="--x: 30%; --y: 36%; --z: 3; --w: 70%;">
         <a href="https://hep-packaging-coordination.github.io/.github/">
         <img src="figures/hep-packaging-coordination-grid.png">
      </a>
   </figure>
</div>
.center.bold[[github.com/hep-packaging-coordination](https://github.com/hep-packaging-coordination)]
]

---
# Case study: ROOT

.kol-2-3[
.large[
* Easiest way to get robust builds of ROOT on your platform
<!--  -->
<p style="text-align:center;">
   <a href="https://github.com/conda-forge/root-feedstock">
      <img src="figures/root-feedstock-release-info.png"; width=100%>
   </a>
</p>
* `root_base` is a direct dependency of .bold[over 40 packages] across conda-forge
* In 2026 ROOT Team has done a great job of working with the other feedstock maintainers to support the conda-forge community (big thanks to [Vincenzo Padulano](https://github.com/vepadulano/) for leading)
   - Reduction of patches required for build, reducing runtime compiler requirements, improved `root_base` as dependency support
   - conda-forge support continued top level priority in 2026 <br>[ROOT Plan of Work](https://cern.ch/root-pow)
]
]
.kol-1-3[
<div class="figure-column">
<p style="text-align:center;">
   <a href="https://github.com/conda-forge/root-feedstock">
      <img src="figures/root-logo.svg"; width=100%>
   </a>
</p>
<div class="center">
<pre class="file-tree">
pixi global install root
pixi global expose add \
--environment root pyroot=python
</pre>
</div>
</div>

<!-- <div class="circle">
<p style="text-align:center;">
   <a href="https://github.com/vepadulano/">
      <img src="https://avatars.githubusercontent.com/u/15638895"; width=70%>
   </a>
</p>
.center[[Vincenzo Padulano](https://github.com/vepadulano/)]
</div> -->
]

---
# Case study: FastJet

<!-- Other than that what's interesting is that it has really great usage statistics for the python bindings and the lower level interface. I think another important thing to point out is that moving properly to conda required that whole cmake adventure and make fastjet waaay more easy to manage as a package for experiments with the cmake integration. -->

.kol-2-3[
.large[
<!-- * FastJet is a foundational library for HEP hadronic workflows -->
* Creation of `fastjet-cxx` conda-forge package in collaboration with FastJet authors has allowed for .bold[better FastJet distribution] (motivated by CMS analyses)
   - Previously, building from source for particular configurations was realistically only approach for bespoke configurations
   - Distribution of FastJet Contrib
* C++ and Python bindings into separate feedstock "output" packages to distribute only what is needed
<!-- 11.7 MB to 1.4 MB for `fastjet-cxx` and<br> `fastjet-cxx-python` -->
* Through upstreaming improvements to FastJet's <br>build system .bold[[reduced the package size by <br>over 10 MB](https://github.com/conda-forge/fastjet-cxx-feedstock/pull/18#issuecomment-3025784849)]
   - Migrate SISCone, FJ, FJ Contrib from Autotools to CMake
   - build Python bindings [on top of existing `fastjet-cxx`](https://gitlab.com/fastjet/fastjet/-/merge_requests/26)
]
]
.kol-1-3[
<div class="figure-column">
<p style="text-align:center;">
   <a href="https://github.com/conda-forge/fastjet-cxx-feedstock">
      <img src="figures/fastjet-logo.png"; width=100%>
   </a>
</p>
<div class="center">
<pre class="file-tree">
pixi init fastjet-example && cd fastjet-example
pixi add fastjet-contrib fastjet-cxx-python
pixi run python -c 'import fastjet_cxx as fj'
</pre>
</div>
</div>
]

---
# Bespoke environments distributed with CVMFS

.code-large[
* Through use of [Pixi](https://pixi.prefix.dev/), can trivially create multi-platform software environments .bold[locked to the digest level]
   - Byte-level reproduction indefinitely far into the future (as long as the conda channel exists)
* Deployment of bespoke software environments would ideally also be possible without use of Pixi itself (or [`pixi-pack`](https://github.com/Quantco/pixi-pack)): .bold[CVMFS is a natural fit]
* LHCb has already been doing this with [`lbcondawrappers`](https://github.com/conda-forge/lbcondawrappers-feedstock) (provides `lb-conda`) to [distribute locked environments](https://gitlab.cern.ch/lhcb-core/conda-environments)
]
<!--  -->
.center[
<pre class="file-tree">
# ssh &lt;cvmfs connected cluster&gt;
$ pixi global install lbcondawrappers
$ lb-conda experimental/scikit-hep  # activates new subshell with locked environment
$ python -c 'import awkward; print(awkward)'
&lt;module 'awkward' from '/cvmfs/lhcbdev.cern.ch/conda/envs/experimental/scikit-hep/.../awkward/__init__.py'&gt;
</pre>
]
<!--  -->
.code-large[
* Ongoing work to generalize and broaden support
   - c.f. [.bold[Chris Burr's CHEP 2026 plenary]](https://indico.cern.ch/event/1471803/contributions/6970826/)
]

---
# Practical use cases

.larger[
* [Experiment specific patched](https://github.com/conda-forge/spheno-feedstock/blob/391703127dceeae5399f9ae6429eb4d91e51a027/recipe/recipe.yaml#L20-L23) package variants from same feedstock
]

.center[
<pre class="file-tree">
pixi init build-variants && cd build-variants
pixi add spheno-atlas  # build variant of spheno
</pre>
<!--  -->
<p style="text-align:center;">
   <a href="https://github.com/conda-forge/spheno-feedstock">
      <img src="figures/spheno-feedstock-release-info.png"; width=45%>
   </a>
</p>
]

---
# Practical use cases

.larger[
* Hardware accelerated environments for AI/ML and CUDA accelerated simulation (leveraging full CUDA-stack on conda-forge)
]

.center[
<pre class="file-tree">
$ pixi init cuda-example && cd cuda-example
$ pixi workspace platform add --cuda 12 linux-64-cuda=linux-64
# Reorder priority from CLI API
$ pixi workspace platform remove linux-64 && pixi workspace platform add linux-64
$ time pixi add --platform linux-64-cuda --no-install cuda-compiler geant4 pytorch-gpu
...
real	0m3.097s  # warm repodata cache
</pre>
]

.larger[
* AI/ML assistive tooling (e.g. MCP servers) distribution that your agent can execute
]

.center[
<pre class="file-tree">
pixi exec --spec rucio-mcp sh -c 'rucio-mcp init atlas'  # only needed once
pixi exec --spec rucio-mcp sh -c '$X509_CERT_DIR/refresh_crls.sh'  # only needed once
pixi exec --spec rucio-mcp sh -c 'voms-proxy-init -voms atlas'
pixi exec --spec rucio-mcp sh -c 'RUCIO_ACCOUNT=&lt;your username&gt; rucio-mcp ping'
</pre>
]

---
# What do I (tool developer) need to do?

.huge[
* Can you .bold[write a build script] and .bold[install] your project?
   - ~90% of the the way to having your software be packaged on conda-forge.<img src="figures/paxton-mascot-flying.svg"; width=7%>
* Have all your .bold[dependencies on conda-forge] already (bootstrap system)
   - Might have to talk to your colleagues (or package them yourself)
* <img src="figures/conda-forge-logo.svg"; width=5%> Have your .bold[source code] exist from a .bold[stable and static official source]
   - No go🛑: Distributions on website that may disappear without warning / no long term archive
   <!-- - Not great: Tarballs on a distribution website with no long term preservation -->
   - Good✅: Public version controlled system with release tags / source on package index
* .bold[Ask for help] from people in HEP Packaging Coordination
]

---
# What do I (tool user) need to do?

.center.bold.huge[Very little! ✨]

.huge[
* Know what your .bold[software requirements] are
* Know what .bold[computing platforms] you want your analysis to run on
* Have .bold[Pixi installed] (lives in user space so you can do this yourself anywhere)
      - Or use the CVMFS distribution
]
.center[
<pre class="file-tree">
. /cvmfs/cms-griddata.cern.ch/cat/sw/pixi/latest/setup.sh
</pre>
]
.huge[
* Declaratively describe your environment needs with Pixi
]

---
# (Known) Limitations / Future work

.huge[
* Entire environment needs to be provided
   - .bold[Normally a feature], but you can imagine situations in which you want to .bold[extend] an existing experiment specific environment (e.g. LCG view) that is hardcoded to certain binaries (e.g. Python).
   - Chris Burr leading work on `rattler-fs` to allow for overlays on top of existing environments
* Environment robustness and stability means more files, can be problematic at HPC systems
   - .bold[Normally a feature]: conda environments are more complete forms of environments/distributions and provide all the required files down to `glibc`. They install more files and so the filesystem has to perform more file operations, which can be taxing at HPC facilities.
   - Workaround: [Trivially containerize](https://doi.org/10.25080/nwuf8465) the locked environment and use Apptainer
]

---
# (Possible?) DUNE questions / concerns

.large[
.bold.center[Can conda packages be built against development software?]

* Yes, with [`pixi-build`](https://pixi.prefix.dev/v0.72.1/build/getting_started/) &mdash; a "preview" Pixi feature that has already reached maturity
   - c.f. talk on Pixi + `pixi-build` by dev team at [SciPy 2026 on 2026-07-16](https://pretalx.com/scipy-2026/talk/MEKP9F/)
* Allows for building and installing source distributions into conda packages.
   - If a package repository has a Pixi manifest, it can build itself into a conda package for development
* Allows for [defining dependencies against development software sources](https://pixi.prefix.dev/v0.72.1/build/package_source/)
]
.code-large[
```toml
[package]
name = "tool-with-wire-cell-linkage-deps"
...
[package.host-dependencies]
wire-cell-toolkit.git = "https://github.com/WireCell/wire-cell-toolkit.git"
wire-cell-toolkit.rev = "61618538be4b6b2241d5be1e9abab6a3e0d4ad97"
...
```
]

---
# (Possible?) DUNE questions / concerns

.large[
.bold.center[Doesn't having dev source recipes and conda-forge recipes duplicate work?]

Yes and no (or, like all good question, "it depends")
* `pixi-build`: "Recipes" for building .bold[development] software against .bold[development] software dependencies
   - Uses minimal config and "build backends" to `rattler-build` recipe internally
   - Can use a full `rattler-build` recipe if desired
* conda-forge: `rattler-build` recipes for building .bold[released] software against .bold[released] software dependencies
* Think less "duplication" and more "defining the motivation and scope of software distribution"
* Counter to me: conda-forge feedstock maintainer might feel maintenance burden if not a core dev of software being released
   - Counter-counter: The age of agentic tooling means that you're .bold[reviewing] a recipe change, not creating it
]

---
# (Possible?) DUNE questions / concerns

.large[
.bold.center[We use Spack for a reason: performance at runtime]

* Does .italic[every] use of your software warrant a .bold[runtime-machine-specific-from-source build]?
* Has the performance gain from Spack compared to a platform-specific / [microarchitecture-optimized](https://conda-forge.org/docs/maintainer/knowledge_base/#microarch) package been benchmarked and quantified? How much is being gained?
* Are you using [Spack binary mirrors](https://cache.spack.io/)? If so, how much of a tradeoff do you have there?
   - Something like [Key4hep Spack + CVMFS approach](https://doi.org/10.1051/epjconf/202533701146)?
   - Note that [Spack "splicing"](https://arxiv.org/abs/2509.07728) doesn't seem fully(?) mature yet
* Answers might all be "yes"
]
---
# (Possible?) DUNE questions / concerns

.large[
.bold.center[When would you not use conda-forge?]

A hyper specific software distribution index: Recreating an LCG release for experiment physics stack

1. Put all your software releases on conda-forge
1. Construct the exact release configurations that you would like others to build from (the LCG collection) and create a Pixi lockfile for this
1. Construct a .bold[private conda channel] from this lockfile that people can now install/build against
   - A .bold[channel] of fully static, unambigious set of dependencies that are still conda packages
1. Use [`pixi publish`](https://pixi.prefix.dev/v0.72.1/reference/cli/pixi/publish/) to build and publish sensitive packages to private distribution channel
   <!-- - Either the first private conda channel or a new one -->
1. To update bump any dependencies, use [`rattler-build rebuild`](https://rattler-build.prefix.dev/v0.68.0/rebuild/) to .bold[reproduce] the original build of an upstream dependency and apply patches to make a new frozen channel
   - LCG terminology: LCG108 vs. LCG108a
]

---
# Summary

.larger[
* .bold[Conda packages] combined with the .bold[conda-forge ecosystem] offer the HEP community a way to address .bold[multi-platform, multi-language] software environment management of HEP tools
* .bold[Call to action]: If you maintain software for HEP, consider distribution on conda-forge
   - Distribute high quality builds, ABI migrations, optimizations across toolchains
* .bold[Opportunity] for HEP to contribute to broader ecosystem and benefit
   - Everyone gets optimized binaries built by experts, experts maintain less build software and infrastructure
]

<div class="figure-row">
   <figure>
      <a href="https://docs.conda.io/projects/conda/">
         <img src="figures/conda-logo.svg"; width=30%>
      </a>
   </figure>
   <figure>
      <a href="https://conda-forge.org/">
         <img src="figures/conda-forge-logo.svg"; width=65%>
      </a>
   </figure>
   <figure>
      <a href="https://pixi.prefix.dev/">
         <img src="figures/paxton-mascot-wand.svg"; width=40%>
      </a>
   </figure>
</div>

---
# Acknowledgements

.huge[This work was supported by the United States National Science Foundation under Cooperative Agreement [PHY-2323298](https://nsf.gov/awardsearch/showAward?AWD_ID=2323298) (Institute for Research and Innovation in Software for High Energy Physics (IRIS-HEP)).]

<p style="text-align:center;">
   <a href="https://iris-hep.org/">
      <img src="assets/logos/logo_IRIS-HEP.png" style="width:50%">
   </a>
</p>

---
class: end-slide, center

.large[Backup]

---
# References

.huge[
* [HEP Packaging Coordination](https://hep-packaging-coordination.github.io/.github/)
* .italic[[Packaging and Distributing the HEP Ecosystem on conda-forge](https://talks.chrisburr.me/2026-06-24-hsf-conda-forge/)], Chris Burr, Matthew Feickert, [June 2026 HSF Seminar](https://indico.cern.ch/event/1692605/contributions/7151271/)
* .italic[[HEP Packaging Coordination: Distributing the HEP software ecosystem on conda-forge](https://matthewfeickert-talks.github.io/talk-chep-2026/)], Matthew Feickert, [CHEP 2026](https://indico.cern.ch/event/1471803/contributions/6966833/)
* .italic[[Conda, Pixi and RattlerFS](https://talks.chrisburr.me/2026-06-22-pixi-and-rattlerfs/)], Chris Burr, [June 2026 LHCb Week](https://indico.cern.ch/event/1696907/contributions/7143130/)
]

---
# How do you create a conda package?

.huge[
* Create a .bold[recipe] in the form of a .bold[structured YAML file] (`recipe/recipe.yaml`) with a recipe build tool ([`rattler-build`](https://rattler-build.prefix.dev/))
* From the [`conda-forge/staged-recipes`](https://github.com/conda-forge/staged-recipes) repository, can create Python recipes automatically using [`grayskull`](https://github.com/conda/grayskull/) with
.center[
<pre class="file-tree">
pixi run pypi &lt;package name&gt;
</pre>
]
* [Searching conda-forge itself](https://github.com/search?q=org%3Aconda-forge%20path%3Arecipe%2Frecipe.yaml&type=code) is an excellent resource
]

---
# conda packages and Linux containers

.center.huge[
Different solutions for different problems:<br>
.bold[Linux containers are distribution methods, not packaging technologies]
]

.huge[
Linux containers for when you want to:

* Deploy an instantiated, bespoke environment as a single executable on a .bold[known platform]
* Sandbox an environment from the rest of the operating system

Containerization .bold[should be trivial install of existing locked environment]
.center[DOI: [10.25080/nwuf8465](https://doi.org/10.25080/nwuf8465)]
]

---
# Case study: Pythonic analysis

.kol-2-3[
.code-large[
* conda-forge Python builds currently fastest/optimally-built Python pre-built binaries
   - conda-forge has optimizations throughout the entire toolchain
   - [`python-build-standalone`](https://github.com/astral-sh/python-build-standalone) (now maintained by [Astral](https://github.com/astral-sh)) can be [.italic[slightly] faster](https://conda-forge.zulipchat.com/#narrow/channel/457337-general/topic/Performance.20of.20builds.20from.20.60python-feedstock.60.20vs.20upstream/with/504989455) now
* In most cases, the conda-forge versions of Python packages and Python are .bold[faster than the Python package builds on PyPI]
   - .italic[Probable] reasons: conda-forge builds have newer compilers, not statically linking and vendoring
* Benchmarking the IRIS-HEP CMS Analysis Grand Challenge (AGC) has shown .bold[faster analysis throughput with full conda-forge ecosystem environments]
   - Bigger impact comes from using .bold[newer Python versions]. With conda packaged Python updating is trivial.
   - Credit: [Peter Fackeldey](https://github.com/pfackeldey), [Iason Krommydas](https://github.com/ikrommyd)
]
]
.kol-1-3[
<div class="figure-column">
<p style="text-align:center;">
   <a href="https://github.com/conda-forge/python-feedstock">
      <img src="figures/python-logo.svg"; width=100%>
   </a>
</p>
<p style="text-align:center;">
   <a href="https://iris-hep.org/">
      <img src="assets/logos/logo_IRIS-HEP.png" style="width:80%">
   </a>
</p>
</div>
]

---
# What does typical end-user use look like?

.huge[Creating .bold[projects] defined through a .bold[workspace] for .bold[scripted or interactive] work]

.center[
<pre class="file-tree">
$ cd /tmp
$ pixi init example && cd example  # create workspace
$ pixi add contur  # declaratively add tools
✔ Added contur >=3.1.4,<4
$ pixi run contur ...  # execute commands or tasks
$ pixi list rivet  # inspect environments
Name   Version  Build                 Size  Kind   Source
rivet  4.1.3    py314h9404863_2  53.69 MiB  conda  https://conda.anaconda.org/conda-forge
$ pixi shell  # drop into interactive subshells

(debug) $ command -v contur
/tmp/example/.pixi/envs/default/bin/contur
</pre>
]

---
# pixi global

.large[
* Install CLI tools that are always available, each in its own isolated environment
* Only the exposed executables land on your `PATH` &mdash; no dependency clashes between tools
   - Can have a `pyroot640` and `pyroot642` installed at the same time, for example
]


.center[
<pre class="file-tree">
$ pixi global install root --with ipython
└── root (installed)
    ├─ dependencies: root 6.40.2, ipython 9.15.0
    └─ exposes: root
$ pixi global expose add --environment root pyroot=ipython
Exposed executable pyroot from environment root.
$ command -v pyroot
/home/feickert/.pixi/bin/pyroot
$ pyroot
Python 3.14.6 | packaged by conda-forge | (main, Jun 12 2026, 08:51:42) [GCC 14.3.0]
Type 'copyright', 'credits' or 'license' for more information
IPython 9.15.0 -- An enhanced Interactive Python. Type '?' for help.

In [1]: import ROOT
In [2]: h1 = ROOT.TH1F("hist1", "example", 10, 0, 10)
</pre>
]


---
# pixi exec

.large[
* Run a command and install it in an isolated temporary environment
   - Environment is cached but .bold[not installed]
* Pixi fetches what's needed, runs it, then it's gone. Great for one-offs and CI
]


.center[
<pre class="file-tree">
$ docker run --rm -ti ghcr.io/prefix-dev/pixi:latest
# time pixi exec root -l -b -q -e '1+1'  # cold cache
(int) 2

real	0m27.192s
user	0m22.731s
sys	0m14.317s
# time pixi exec root -l -b -q -e '1+1'  # warm cache
(int) 2

real	0m0.117s
user	0m0.061s
sys	0m0.062s
# command -v root  # not installed
</pre>
]

---
# Multiple conda channels

.larger[
* Multiple conda channels can be used together
* Most significant ones use conda-forge as a base
   - [Bioconda](https://bioconda.github.io/) for bioinformatics software (also [Snakemake](https://snakemake.readthedocs.io/)!)
   - [RoboStack](https://robostack.github.io/) for robotics software
   - [Emscripten Forge](https://emscripten-forge.org/) for the `emscripten-wasm32` platform
* .bold[Recommendation]: For HEP work within conda-forge instead of custom channels
   - Large benefit from the shared infrastructure and globally coherent builds (global pinning)
   - Avoids overlap with multi-purpose software (ROOT, Geant4, ...)
   - No concern with overly niche tooling being on conda-forge (this is welcomed by conda-forge/core)
]

---

class: end-slide, center
count: false

The end.
