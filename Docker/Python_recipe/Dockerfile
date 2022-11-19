FROM python:3.8.12

# make directory to mount the data

RUN apt-get update && apt-get install -y python3-opencv


RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir matplotlib numpy opencv-python seaborn scikit-image tifffile csbdeep stardist imctools tensorflow

