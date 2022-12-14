# SIMPLIcity

## Description
SIMPLIcity is an image analysis tool built upon the comprehensive [SIMPLI](https://github.com/ciccalab/SIMPLI) pipeline. With the custom image pre-processing step, three pre-trained image segmentation models, two external image-analysis scripts, and user-interface SIMPLIcity overcomes the limitations found in the SIMPLI pipeline. SIMPLIcity contains three pre-trained StarDist models for the following markers HuNu, ChAT, and a comprehensive model covering both LMX and TH image channels. In addition, the pre-trained model 2D_versatile_fluo, provided by StarDist, is available in SIMPLIcity, and user's can provide their StarDist models. SIMPLIcity can be used both as a command-line tool and via a web-based user interface.

SIMPLIcity pipeline contains the following steps image pre-processing, deep-learning image segmentation, cell type identification, pixel intensity distribution plotter for objects classified as cells, and cell-area measurements of segmented objects, which allows also co-expression analysis of two or three distinct markers. The clustering and spatial analysis implemented in SIMPLI, haven't been tested in SIMPLIcity nor implemented in the web app.

![alt text](https://github.com/ernohanninen/SIMPLIcity/blob/master/Assets/fig0.png)

It is recommended to use SIMPLIcity from the web-based user interface, as it can better handle mistakes made by the user. In case features of SIMPLI, which are not implemented in the user interface or tested in SIMPLIcity, are explored, use the SIMPLcity command-line approach.



## SIMPLIcity installation
Install the following dependencies:

- [Nextflow](https://www.nextflow.io/docs/latest/getstarted.html#installation) 

- [Conda](https://conda.io/projects/conda/en/latest/user-guide/install/index.html)

- [Docker](https://docs.docker.com/engine/install/)

For Nextflow version >= 20.07.1 is required. Installation of Nextflow requires Java 11 (or later, up to 18) to be installed.

### Installation of SIMPLIcity
1. Clone the repo:
```
git clone git@github.com:ernohanninen/SIMPLIcity.git
```
2. Create the conda environment
```
conda create --name APPenv
```
3. Activate the environment:
```
conda activate APPenv
```
4. Add anaconda channel to the conda:
```
conda config --env --add channels anaconda
```
5. Add anaconda channel to the conda:
```
conda config --env --add channels conda-forge
```
6. Install packages to the environment:
```
conda install nodejs=16.13.1 yarn=0.25.2 python-dotenv=0.20.0 flask=2.1.2 werkzeug=2.1.1 pillow scikit-image numpy opencv flask-restful=0.3.9
```

## Image analysis workflow



## Usage

### User-interface
To run the pipeline from web-based user-interface follow these instructions.
1. Navigate to the App folder
```
cd ~/SIMPLIcity/App
```
2. If the conda environment is not activated in the terminal window, activate it:
```
conda activate APPenv
```
3. Now we can start the app. Run flask (takes care of the communication between frontend and backend):
```
flask run
```
4. Open a new terminal window (let the flask run on it's terminal own window)

5. You should be in ~/SIMPLIcity/App folder, if not, navigate there. Activate conda environment in the new window: 
```
conda activate APPenv
```
6. Run yarn (starts the react app). 
```
yarn start
```
You should now find the app from browser by typing: http://localhost:3000/


The web page contains instructions on how to fill in the input fields. To test the app with the testing data, provided in ~/SIMPLIcity/Data folder, follow the instructions below. Additional information on the input fields can be found from[nextflow configuration file](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#nextflow-configuration-file), [SIMPLIcity metadata files](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#simplicity-metadata-files) and  [SIMPLIcity tips and limitations](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#simplicity-tips-and-limitations)

1. Submit the samples, note markers among samples needs to match:


![alt text](https://github.com/ernohanninen/SIMPLIcity/blob/master/Assets/fig1.png)


2. Select processes to run. Here the testing data provided is acquired with Operetta CLS system, therefore Operetta should be selected as imaging platform. Run all the processes:


![alt text](https://github.com/ernohanninen/SIMPLIcity/blob/master/Assets/fig2.png)


3. Submit settings for the chosen processes. Here images with LMX1A and TH image channels is used, threfore using LMX_TH model with the default parameters. Identify the cell types corresponding to the markers. Use threshold value NA to classify all segmented objects as cells. In cell pixel intensity measurements, TH_cells are compared. In cell area measurements, the co-expression factor is initialized to 0.4 and in the example we are looking for LMX positive cells which are also TH positive:


![alt text](https://github.com/ernohanninen/SIMPLIcity/blob/master/Assets/fig3.png)


4. Explore the results. The sample specific segmentation and pixel distributon results can be found using the drop-down menus:
![alt text](https://github.com/ernohanninen/SIMPLIcity/blob/master/Assets/fig4.png)


The output of the image analysis pipeline is stored in ~/SIMPLIcity/App/output

5. The web app contains thresholding page, which can be used to test the outcome of different thresholding algorithms. The page needs to be refreshed before submitting a image and running thresholding.

### Command-line
To run the pipeline from command line, follow these instructions. 
For command line usage [nextflow configuration](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#nextflow-configuration-file) file and [SIMPLIcity metadata](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#simplicity-metadata-files) files needs to be set up. 

The Nextflow configuration file and SIMPLIcity metadata files contains testing data. Threfore it is possible to test the pipeline without editing the configuration or metadata files.

1. To run the pipeline, navigate to folder where main.nf file is located
```
cd ~/SIMPLIcity/SIMPLIcity/
```
2. Run the pipeline
```
nextflow run main.nf -c run/run_simplicity.config 
```

If pipeline is used with settings in the Nextflow config file, the results are stored in ~/SIMPLIcity/SIMPLIcity/output folder

#### Nextflow configuration file
Parameters to SIMPLIcity are specified in nextflow configuartion file. Some of the SIMPLI features are not tested in SIMPLIcity, therefore those features are not described in detail. More information of those processes, see the [documentation to run SIMPLI](https://github.com/ciccalab/SIMPLI/wiki/Run#simpli-parameters) and [SIMPLI analysis page](https://github.com/ciccalab/SIMPLI/wiki/Analysis). However the parameters of all these processes needs to be initialized.



To fill the nextflow configuration file for SIMPLIcity use the provided [template](https://github.com/ernohanninen/SIMPLIcity/blob/master/SIMPLIcity/run/run_simplicity.config).



##### Input
Specify the path to the metadata files containing input samples and images.
- `params.sample_metadata_file` = Metadata file containing the samples used in analysis.
- `params.tiff_input_metadata_file` = Metadata file for single-channel TIFF input image.

##### Imaging platform

- `params.instrument_operetta` = If images are acquired with Operetta CLS system, set `params.instrument_operetta` to `true`, with other imaging platforms use `false`

##### Selection of analysis processes to run

Specify the processes to skip using either `true` or `false` as values. The processes which aren't executable/tested on SIMPLIcity are initialized to `true` in here, and threfore should be skipped.
- `params.skip_conversion` = `true`
- `params.skip_normalization` = Do not perform image channel normalization. Set this `true` if `params.instrument_operetta` is `true`.
- `params.skip_preprocessing` = If `instrument_operetta` = `false`, do not perform image denoising, contrast enhancement, and image thresholding for images.  If `instrument_operetta` = `true`, do not perform image thresholding. 
- `params.skip_area` = `true`
- `params.skip_cp_segmentation` = `true`
- `params.skip_sd_segmentation` = Do not perform deep-learning based cell segmentation with StarDist.
- `params.skip_cell_type_identification` = Do not perform cell type identification.
- `params.skip_cell_area_measurements` = Do not identify co-expressing cells or measure cell area and counts of specified cell types.
- `params.skip_cell_clustering` = `true`
- `params.skip_cell_thresholding` = `true`
- `params.skip_homotypic_interactions` = `true`
- `params.skip_heterotypic_interactions` = `true`
- `params.skip_permuted_interactions` = `true`
- `params.skip_visualization` = Do not perform any of the following visualization steps.
- `params.skip_area_visualization` = `true`
- `params.skip_type_visualization` = Do not plot the results of the cell type identification.
- `params.skip_intensity_visualization` = Do not perform measure and visualize cell pixel intensity distribution between two groups. To plot pixel distribution between two groups make sure there are two comparison groups in sample metadata file.
- `params.skip_cluster_visualization` = `true`
- `params.skip_thresholding_visualization` = `true`
- `params.skip_homotypic_visualization` = `true`
- `params.skip_heterotypic_visualization` = `true`
- `params.skip_permuted_visualization` = `true`


##### Process specific metadata files

Path to files which contains user-specified settings for the processes. The input files which are for processes not tested in SIMPLIcity are initialized to `null`.
- `params.area_measurements_metadata` = `null`
- `params.cell_clustering_metadata` = `null`
- `params.cell_thresholding_metadata` = `null`
- `params.cell_masking_metadata` = Metadata file with the parameters for cell type identification.
- `params.homotypic_interactions_metadata` = `null`
- `params.heterotypic_interactions_metadata` = `null`

##### Step specific metadata files
SIMPLI allows users to skip processes and instead enables users to supply the output data of a processs. However, this functionality is not tested in SIMPLIcity, therefore these parameters are initialized to `null`. However if for example preprocessing is skiped, the user should  provide the `preprocessed_metadata_file`. See [SIMPLI analysis page](https://github.com/ciccalab/SIMPLI/wiki/Analysis) for more information of the file format.
- `params.raw_metadata_file` = `null`
- `params.channel_metadata` = `null`
- `params.normalized_metadata_file` = `null`
- `params.preprocessed_metadata_file` = `null`
- `params.area_measurements` = `null`
- `params.single_cell_data_file` = `null`
- `params.annotated_cell_data_file` = `null`
- `params.clustered_cell_data_file` = `null`
- `params.thresholded_cell_data_file` = `null`
- `params.homotypic_interactions_file` = `null`
- `params.heterotypic_interactions_file` = `null`
- `params.single_cell_masks_metadata` = `null`
- `params.shuffled_interactions_file` = `null`

##### CellProfiler4 pipelines
Even though CellProfiler4 dependencies is removed from SIMPLIcity, the parameters needs to be initialized.
- `params.cp4_preprocessing_cppipe` = `null`
- `params.cp4_segmentation_cppipe` = `null`

##### StarDist segmentation settings
- `params.sd_labels_to_segment` = comma separated list of labels to include in the multichannel image used for segmentation. The labels must match the labels in tiff_input_metadata file. For example: "label1,label2"
- `params.sd_model_name` = name of the model to use, either `HuNu`, `ChAT` or `LMX` for LMX_TH model.
- `params.sd_model_path` = path to the model to use or "default" for the models included with StarDist. If model is stored in /home/user/SIMPLIcity/SIMPLIcity/run/models the value is `"/opt/models/"` 
- `params.sd_prob_thresh` = probability threshold used to segment cells: 0 < value < 1. Higher values leads to fewer segmented objects. In the study we used following values, `HuNu`:`0.58`, `LMX_TH`:`0.06` and `ChAT`:`0.3`.
- `params.sd_nms_thresh` = threshold above which Non-Maximum Suppression is performed: 0 < value < 1. Higher values allows objects to overlap more substantially.  In the study we used following values, `HuNu`:`0.3`, `LMX_TH`:`0.3` and `ChAT`:`0.3`

##### Pixel analysis settings
- `params.co_expression_fraction` =  The threshold fraction to identify cell overlapping other cell (co-expression). 0 < value < 1.
- `params.cell_type_to_measure_area` = Comma separated list of cells used to measure area or co-expression. For example: "cell1,cell2,cell3,cell1/cell2" computes area and number of cell1, cell2 and cell3 and in addition the amount of cell1 which are also cell2 (co-expression). Here the `params.co_expression_fraction` is used to detect the overlapping cells.
- `params.cell_type_for_intensity` = `cell_type_for_intensity` should match threshold one `cell_type` cell_masking_metadata.csv file. 

##### Permutation analysis
Even though the permutation analysis is not tested in SIMPLIcity, the parameter needs to be initialized

`params.permutations` = null

##### Cell clustering visualization
User specified colors for UMAP visualization. These needs to specified even though clustering is not executed.

- `params.high_color` = "'#FF0000'"
- `params.mid_color` = "'#FFFFFF'"
- `params.low_color` = "'#0000FF'"

##### Output
- `params.output_folder` = Specifies the path where all output of SIMPLIcity is stored
- `params.tiff_type` = `single`, the pipeline has been tested only with single channel images 




#### SIMPLIcity metadata files
To fill the metadata use the SIMPLIcity metadata templates provided in [SIMPLIcity metadata](https://github.com/ernohanninen/SIMPLIcity/tree/master/SIMPLIcity/run/metadata) folder
##### Sample metadata file
Contains all samples used in the analysis. By default this file is named sample_metadata.csv and the following fields are requried:
- `sample_name`: Identifier to be used to refer to this sample in the analysis.
- `color`: Color used to represent this sample in plots, input can be color name or hexadecimal in #RGB or #RGBA format
- `comparison column`: Each sample is associated a category name. To exclude a sample from the comparison, set its field to "NA". Pairwise comparisons will be made only if there are two category names among samples ("NA" excluded).

##### Tiff image metadata file
File which contains the images and their corresponding metadata for each sample. One sample can contain several image channels. SIMPLIcity has been tested with images containing max three image channels. SIMPLIcity has not been tested with RGB images. By default this file is named tiff_input_metadata.csv and the following fields are requried:
- `sample_name`: Identifier to be used to refer to this sample in the analysis, should correspond sample in sample metadata file. Note, the markers among samples should match.
- `marker`: Marker associated to the channel.
- `label`: Label used to name the channel in the analysis.
- `file_name`: Input file path.
- `thresholding`: Thresholding algorithm to be used to threshold the input tiff. The value needs to be one of the following thresholding algorithms:`sauvola`, `isodata`, `li`, `mean`, `minimum`, `otsu`, `triangle`, or `yen`.

##### Cell masking metadata file
File that contains the metadata for cell identification.  By default this file is named cell_masking_metadata.csv and the following fields are requried:
- `cell_type` = name of the cell type to be identified.
- `threshold_marker` = Marker corresponding the cell type. Should correspond one of the labels in ??tiff_input_metadata?? file.
- `threshold_value` = 1 - fraction of area overlap between the segmented object and the thresholded image. Object is classified as a cell, if it overlaps the mask by fraction higher than threshold marker. Higher threshold value leads to more objects classified as cells. Values between 0-1 or NA to classify all segmented objects to cells.
- `color` = Color used to represent this cell type in images.

#### SIMPLIcity tips and limitations
These instructions concerns both web-app and command-line usage. Even though the web-app validates user input, it is not completely robust for user mistakes.

##### Tips
- The SIMPLIcity web app contains a image thersholding module, which can be used to test different thresholding algorithms.
- The web app can throw an error (unhandled rejection) if the user makes something unexpected, in those cases it is recommended to refresh the page. 
- Do not use whitespaces in input. For example file named `graft3 no2.tiff` will lead to error.
- In input atleast following punctation marks are allowed `+`, `_`. In cell_type_for_intensity field `/` can be used. Do not use `-` or ` ` in naming.
- All samples within each experimental setup should contain the same markers.
- SIMPLIcity supports only single channel images and the pipeline has been tested with samples containing 1-3 image channels. Therefore use only models, trained with grayscale images
- The StarDist parameters for ChAT and LMX1A_TH model can be fine-tuned. 
- The page should be refreshed by the user after navigating between pages with the navigation bar


##### Limitations
- The web app doesn't contain all the features of SIMPLI. The clustering and spatial analysis of SIMPLI haven't been tested in the SIMPLIcity pipeline. However when filling the configuration files all fields in the provided [template](https://github.com/ernohanninen/SIMPLIcity/blob/master/SIMPLIcity/run/run_simplicity.config) needs to be filled.
- When default settings on submit sample page is unchecked, the input is not validated for the thresholding algorithm field.
- The CellProfiler4 pipelines developed for SIMPLI are not usable in SIMPLIcity. However when filling the configuration files, the settings for CellProfiler4 needs to be specified.
- When running SIMPLIcity's cell area measurements from command line, only the pixel counts are stored to output file. Cell counts can be achieved, by parsing the annotated_cells.csv file from the output folder.
- The `Cell_area_measurements.py` script, which measures cell area and detects co-expressing cells, uses `cv.boundingRect()` function to find cordinates of cell. `cv.boundingRect()` function draws approximate rectangle around object of interest. However cells are often circular. It is unknow if this function has negative impact to the analysis, therefore users should validate the results from the co-expression analysis. In addition the results of co-expression analysis is not validated in detail. The image, containing cells expressing multiple markers from where the area and amount of co-expressing cells is computed, is stored in the output folder. 
- Images acquired with Operetta CLS system are not pre-processed, this leads to non-optimal segmentation result.
- The result of `Cell_Intensity_plotter.py` script, which plots pixel intensity distribution between two groups, have not been validated in detail.
- The pipeline has been tested with immunofluorescence images acquired with Operetta CLS system and brightfield images acquired with Leica DMI6000B microscope.

## Processing images before model training and SIMPLIcity

### Reshape images from Operetta CLS system
Before deep-learning model training or the SIMPLIcity image analysis, the images acquired with Operetta CLS system needs to be processed using [Perkin Elmer Operetta Stitcher](https://c4science.ch/w/bioimaging_and_optics_platform_biop/image-processing/imagej_tools/perkinelmer-stitching/)

Operetta Stitcher can be used in [Fiji](https://imagej.net/software/fiji/) 

See the links above for installation and instructions.

After Fiji and Operetta Stitcher is installed the images can be reshaped for analysis in SIMPLIcity or for model training.
1. Open BIOP Operetta Import `Plugins` > `BIOP` > `Importers` > `BIOP` Operetta Import
2. Each image channel was exported individually, following settings was used:
   - Input directory is the Images folder in Operetta output 
   - Select the folder where the output is stored
   - `Export file(s) as`: `Fused fields`
   - `Project Z Slices`: `True`
   - `Z Projection Method`: `Standard deviation`
   - `Export Sub Channels`: `True`
   - `Channel(s) to Export`: 1
3. For each image steps above was executed four times, as the images composed of four image channels. The settings were otherwise the same but `Channel(s) to Export` value was changed for each run, as we needed to export channel 1, 2, 3 and 4.
5. The reshaped images were renamed, as SIMPLIcity doesn't allow whitespaces in image names.
6. The image format form 32 bit was changed to 8 bit. Select `Image` > `Type` > `8-bit`
7. Save the reformatted image.

### Reformat images aqcuired with Leica microscope
The images acquired with Leica microscope was saved in RGB format. Before model training the image type was changed using Fiji.
1. Open the image
2. Select `Image` > `Type` > `8-bit`
3. Save the reformatted image.

## Model training
SIMPLIcity comes with three pre-trained segmentation models hunu, chat, and lmx1a_th. These models can be found from ~/SIMPLIcity/SIMPLIcity/run/models


To train deep-learning model images with their corresponding masks are required, this requires image annotation. Before annotation the images were manually cat to 512x512 pixel patches using Fiji crop function, select `Image` > `Crop`. 


Four deep-learning models where trained for following image channels LMX1A and TH aqcuired with Operetta CLS system, and HuNu and ChAT aqcuired with Leica microscope. 34 HuNu, 65 ChAT, 22 LMX1A and 38 TH images was annotated. 

For model training install the [StarDist dependencies](https://github.com/stardist/stardist#installation) 

### Annotating images for StarDist and ZeroCostDL4Mic
The image annotations was created using [Labkit](https://imagej.net/plugins/labkit/) plugin in [Fiji](https://imagej.net/software/fiji/)

1. Install [Fiji](https://imagej.net/software/fiji/) and  [Labkit](https://imagej.net/plugins/labkit/)
2. Open the image patch and start Labkit. Select `Plugins` > `Segmentation` > `Labkit`
3. Enable allow overlapping labels
4. Add new label and annotate a cell
5. Repeate step 4. until each cell is annotated
6. Export labelling, select `Save Labeling..` > `File format` > `TIF Image`

### StarDist model training
To train the HuNu and LMX1A deep-learning image segmentation model we used a [script](https://nbviewer.org/github/stardist/stardist/blob/master/examples/2D/2_training.ipynb) provided by stardist.
- For HuNu-model the annotated HuNu patches were used and for LMX1A model the annotated LMX1A patches were used.
In addition to using custom model names, we adjusted the following parameters:
- `quick_demo` = false
- Regarding the hyperparameters, the best performing model was trained with the following parameters (if the parameter is not defined in the table, default value was used):

| Model  | Learning rate | Batch size | Epochs | Steps | Dropout |
| ------------- | ------------- | ------------- | ------------- | ------------- | ---------- |
| HuNu_model  | 0.0003  | 32  | 90 | 100  | 0.0  |
| LMX1A_model  | 0.0001  | 32  | 120 | 95  | 0.0  |

- The LMX1A and HuNu model was trainied on Kebnekaise HPC server, which uses SLURM workload manages. Here is an example of an SLURM script used to start the training:

```
#SBATCH -A ernohan
#SBATCH -n 8
#SBATCH --time=05:00:00
#SBATCH --error=job.%J.err 
#SBATCH --output=job.%J.out

# Clear the environment from any previously loaded modules
module purge > /dev/null 2>&1

# Activate python env 
source /proj/nobackup/snic2022-22-293/Public/TRAINenv/bin/activate

# Run the script
python3 train.py
```

- This script is named runSbatch.sh and the job can be submitted using:
```
sbatch runSbatch.sh
```

- Copy the trained model to local computer for further inspection and use.

### ZeroCostDL4Mic transfer learning
The HuNu and LMX1A models was used as pretrained models for training ChAT- and LMX1A_TH-model. Here the [script](https://github.com/HenriquesLab/ZeroCostDL4Mic/blob/master/Colab_notebooks/StarDist_2D_ZeroCostDL4Mic.ipynb) provided by ZeroCostDL4Mic was used.
- For ChAT-model the annotated ChAT patches were used and for LMX1A_TH-model the annotated LMX1A and TH patches were used.
In addition to using custom model names, we adjusted the following parameters:
- For ChAT model the pretrained model used was HuNu and for LMX1A model the pretrained model used was LMX1A
- For ChAT model 25 % of the input data was used for validation set, and for LMX1A_TH model 35 %
- Regarding the hyperparameters, the best performing model was trained with the following parameters (if the parameter is not defined in the table, default value was used):

| Model  | Learning rate | Batch size | Epochs | Steps | Dropout |
| ------------- | ------------- | ------------- | ------------- | ------------- | ---------- |
| ChAT_model  | 0.001  | 16  | 50 | 20  | 0.0  |
| LMX1A_TH_model  | 0.001  | 10  | 70 | 30  | 0.4  |

- The script was named transfer_learning.py and the training was started with following command:
```
python3 transfer_learning.py
```

### Linear regression
To evaluate the model performance of LMX1A_TH-model linear regression was used between manual and SIMPLIcity counts.

The linear regression script and the counts between SIMPLIcity and manual can be found from [StatisticalTests folder](https://github.com/ernohanninen/SIMPLIcity/tree/master/StatisticalTests)

The script was executed in Rstudio. 



## Creating docker images
The dependencies of SIMPLIcity's image analysis pipeline are managed in three different docker images, two of these created in the project. The one, that wasn't created is Ubuntu image, which contains Linux operating system. Two separate docker images for R and Python dependencies was created, using following workflow:

1. Navigate to folder where Dockerfile (recipe to create the image) is located, here using Python container as example:
```
~/SIMPLIcity/Docker/Python_recipe
```
2. Build the docker image
```
docker build -t py_container .
```
3. Check that the process was succesfull:
```
docker images
```
4. Check that the process was succesfull:
```
docker images
```
Output:
```
REPOSITORY                 TAG       IMAGE ID       CREATED          SIZE
py_container               latest    8b0855be67d0   32 seconds ago   3.86GB
```
5. To be able to push the created docker image to docker hub, a database where docker images are stored, the image needs to be tagged:
```
docker tag 8448fbd398b5 ernohanninen/py_container:latest
```
Now the local docker repo looks like this:
```
REPOSITORY                  TAG       IMAGE ID       CREATED          SIZE
ernohanninen/py_container   latest    8448fbd398b5   4 minutes ago    2.4GB
```
6. To push a image to docker hub, log in:
```
docker login --username=user
```
7. Push the image to docker hub:
```
docker push ernohanninen/py_container
```
Same procedure was executed to the r-container (the r-container was named r_container).
SIMPLIcity pulls the images automatically from docker hub.

