FROM bioconductor/bioconductor_docker:RELEASE_3_12

RUN apt-get update && apt-get install --yes --no-install-recommends \
    wget \
    locales \
    vim-tiny \
    git \
    cmake \
    build-essential \
    gcc-multilib 


# Install R
RUN apt-get -y install r-base

# Install R libraries
RUN R -e 'install.packages("dplyr", repos="https://cloud.r-project.org/"); install.packages("data.table", repos="https://cloud.r-project.org/"); install.packages("devtools", repos="https://cloud.r-project.org/"); BiocManager::install("multtest"); devtools::install_url("https://cran.r-project.org/src/contrib/Archive/SDMTools/SDMTools_1.1-221.2.tar.gz"); devtools::install_url("https://cran.r-project.org/src/contrib/Archive/mnormt/mnormt_1.5-7.tar.gz"); devtools::install_version(package = "Seurat", version = package_version("2.3.0")); BiocManager::install("EBImage"); install.packages("uwot", repos="https://cloud.r-project.org/"); install.packages("ggrepel", repos="https://cloud.r-project.org/"); install.packages("fpc", repos="https://cloud.r-project.org/"); install.packages("factoextra", repos="https://cloud.r-project.org/");'

