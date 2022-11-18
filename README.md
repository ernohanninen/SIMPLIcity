# SIMPLIcity




## Installation
Install the following dependencies:

- [Nextflow](https://www.nextflow.io/docs/latest/getstarted.html#installation) 

- [Conda](https://conda.io/projects/conda/en/latest/user-guide/install/index.html)

- [Docker](https://docs.docker.com/engine/install/)

For Nextflow version >= 20.07.1 is required. Installation of Nextflow requires Java 11 (or later, up to 18) to be installed.

### Installation of SIMPLIcity
1. Clone the repo
```
git clone git@github.com:ernohanninen/SIMPLIcity.git
```
2. Create the conda env
Run:
```
conda create --name APPenv
```
3. Activate the environment:
```
conda activate APPenv
```
4. Install packages
```
conda install nodejs=16.13.1 yarn=0.25.2 python-dotenv=0.20.0 flask=2.1.2 werkzeug=2.1.1 pillow scikit-image numpy opencv flask-restful=0.3.9
```


## Usage

### User-interface
To run the pipeline from web-based user-interface follow these instructions.
1. Navigate to the App folder
```
cd simpli_project/SIMPLIcity
```
2. Now we can start the app. Run flask (takes care of the communication between frontend and backend):
```
flask run
```
3. Open a new terminal window (let the flask run on it's terminal own window)

4. You should be in /simpli_project/App folder, if not navigate there. Activate conda environment on new window: 
```
conda activate APPenv
```
5. Run yarn (starts the react app). 
```
yarn start
```
You should now find the app from browser by typing: http://localhost:3000/


### Command-line
To run the pipeline from command line, follow these instructions.
For command line usage [nextflow configuration](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#nextflow-configuration-file) file and [SIMPLIcity metadata](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#simplicity-metadata-files) files needs to be set up.

1. To run the pipeline, navigate to folder where main.nf file is located
```
cd ~/simpli_project/SIMPLIcity/
```
2. Run the pipeline
```
nextflow run main.nf -c run/run_simplicity.config 
```

#### Nextflow configuration file
Parameters to SIMPLIcity are specified in nextflow configuartion file. Some of the SIMPLI features are not tested in SIMPLIcity, hence those are not described in here in detail. Regarding those processes, see the [documentation to run SIMPLI](https://github.com/ciccalab/SIMPLI/wiki/Run#simpli-parameters) 



##### Input
Path to the metadata files containing input samples and images.
- `sample_metadata_file` = Metadata file containing the samples used in analysis.
- `tiff_input_metadata_file` = Metadata file for single-channel TIFF input image.

##### Imaging platform

- `params.instrument_operetta` = If images are aqcuired with Operetta CLS system, set `params.instrument_operetta` to `true`, with other imaging platforms use `false`

##### Selection of analysis processes to run

Specify the processes to skip using either `true` or `false` as values. The processes which aren't executable/tested on SIMPLIcity are initialized to `true`, and threfore should be skipped
- `skip_conversion` = `true`
- `skip_normalization` = Do not perform image channel normalization. When using images aqcuired with Operetta CLS system, set `true`.
- `skip_preprocessing` = Do not perform image denoising and contrast enhancement
- `skip_area` = Do not perform thresholding based pixel-level analysis.
- `skip_cp_segmentation` = `true`
- `skip_sd_segmentation` = Do not perform deep-learning based cell segmentation with StarDist.
- `skip_cell_type_identification` = Do not perform cell type identification.
- `params.skip_cell_area_measurements` = Do not identify co-expressing cells or measure cell area of specified cell type.
- `skip_cell_clustering` = `true`
- `skip_cell_thresholding` = `true`
- `skip_homotypic_interactions` = `true`
- `skip_heterotypic_interactions` = `true`
- `skip_permuted_interactions` = `true`
- `skip_visualization` = Do not perform any of the following visualization steps.
- `skip_area_visualization` = `true`
- `skip_type_visualization` = Do not plot the results of the cell type identification.
- `params.skip_intensity_visualization` = Do not perform measure and visualize pixel intensity distribution between two groups. To plot pixel distribution between two groups make sure there are two comparison groups in sample metadata file.
- `skip_cluster_visualization` = `true`
- `skip_thresholding_visualization` = `true`
- `skip_homotypic_visualization` = `true`
- `skip_heterotypic_visualization` = `true`
- `skip_permuted_visualization` = `true`


##### Process specific metadata files

Path to files which contains user-specified settings for the processes. The files which are for processes not tested in SIMPLIcity are initialized to `null`.
- `area_measurements_metadata` = `null`
- `cell_clustering_metadata` = `null`
- `cell_thresholding_metadata` = `null`
- `cell_masking_metadata` = Metadata file with the parameters for cell type identification.
- `homotypic_interactions_metadata` = `null`
- `heterotypic_interactions_metadata` = `null`

##### Step specific metadata files
SIMPLI allows users to skip processes and instead enables users to supply the output data of a processs. However, this functionality is not tested in SIMPLIcity, therefore these parameters are initialized to `null`.
- `raw_metadata_file` = `null`
- `channel_metadata` = `null`
- `normalized_metadata_file` = `null`
- `preprocessed_metadata_file` = `null`
- `area_measurements` = `null`
- `single_cell_data_file` = `null`
- `annotated_cell_data_file` = `null`
- `clustered_cell_data_file` = `null`
- `thresholded_cell_data_file` = `null`
- `homotypic_interactions_file` = `null`
- `heterotypic_interactions_file` = `null`
- `single_cell_masks_metadata` = `null`
- `shuffled_interactions_file` = `null`

##### CellProfiler4 pipelines
Even though CellProfiler4 dependencies is removed from SIMPLIcity, the parameters needs to be initialized.
- `cp4_preprocessing_cppipe` = `null`
- `cp4_segmentation_cppipe` = `null`

##### StarDist segmentation settings
- `sd_labels_to_segment` = comma separated list of labels to include in the multichannel image used for segmentation. The labels much match the labels in tiff_input_metadata file. For example: "label1,label2"
- `sd_model_name` = name of the model to use
- `sd_model_path` = path to the model to use or "default" for the models included with StarDist. If model is stored in /home/user/SIMPLIcity/SIMPLIcity/run/models the value is `"/opt/models/"` 
- `sd_prob_thresh` = probability threshold used to segment cells: 0 < value < 1. Higher values leads to fewer segmented objects.
- `sd_nms_thresh` = threshold above which Non-Maximum Suppression is performed: 0 < value < 1. Higher values allows objects to overlap more substantially.

###### Pixel analysis settings
- `params.co_expression_fraction` =  The threshold fraction to identify cell overlapping other cell (co-expression). 0 < value < 1.
- `params.cell_type_to_measure_area` = Comma separated list of cells used to measure area or co-expression. For example: "cell1,cell2,cell3,cell1/cell2" computes area and number of cell1, cell2 and cell3 and in addition the amount of cell1 which are also cell2 (co-expression). Here the `co_expression_fraction` is used to detect the overlapping cells.
- `params.cell_type_for_intensity` = `cell_type_for_intensity` should match threshold one `cell_type` cell_masking_metadata.csv file. 

###### Permutation analysis
Even though the permutation analysis is not tested in SIMPLIcity, the parameter needs to be initialized

`params.permutations` = null

##### Cell clustering visualization
User specified colors for UMAP visualization. These needs to specified even though clustering is not executed.

- `high_color` = "'#FF0000'"
- `mid_color` = "'#FFFFFF'"
- `low_color` = "'#0000FF'"

##### Output
- `output_folder` = Specifies the path where all output of SIMPLIcity is stored
- `tiff_type` = `single`, the pipeline has been tested only with single channel images 



#### SIMPLIcity metadata files
To fill the metadata use the SIMPLIcity metadata templates provided in [SIMPLIcity metadata](https://github.com/ernohanninen/SIMPLIcity/tree/master/SIMPLIcity/run/metadata) folder
##### Sample metadata file
Contains all samples used in the analysis. By default this file is named sample_metadata.csv and the following fields are requried:
- `sample_name`: Identifier to be used to refer to this sample in the analysis.
- `color`: Color used to represent this sample in plots, input can be color name or hexadecimal in #RGB or #RGBA format
- `comparison column`: Each sample is associated a category name. To exclude a sample from the comparison, set its field to "NA". Pairwise comparisons will be made only if there are two category names among samples ("NA" excluded).

##### Tiff image metadata file
File that contains the images and their metadata for each sample. One sample can contain several image channels. SIMPLIcity has been tested with images containing max three image channels. SIMPLIcity has not been tested with RGB images. By default this file is named tiff_input_metadata.csv and the following fields are requried:
- `sample_name`: Identifier to be used to refer to this sample in the analysis, should correspond sample in sample metadata file. Note, the markers among samples should match.
- `marker`: Marker associated to the channel.
- `label`: Label used to name the channel in the analysis.
- `file_name`: Input file path.
- `thresholding`: Thresholding algorithm to be used to threshold the input tiff. The value needs to be one of the following thresholding algorithms:`sauvola`, `isodata`, `li`, `mean`, `minimum`, `otsu`, `triangle`, or `yen`.

##### Cell masking metadata file
File that contains the metadata for cell identification.  By default this file is named cell_masking_metadata.csv and the following fields are requried:
- `cell_type` = name of the cell type to be identified.
- `threshold_marker` = Marker corresponding the cell type. Should correspond one of the labels in ¸tiff_input_metadata¸ file.
- `threshold_value` = 1 - fraction of area overlap between the segmented object and the thresholded image. Object is classified as a cell, if it overlaps the mask by fraction higher than threshold marker. Higher threshold value leads to more objects classified as cells. Values between 0-1 or NA to classify all segmented objects to cells.
- `color` = Color used to represent this cell type in images.



1. Submit the first sample by selecting sample name, comparison group and color (red or blue, some of the colors don't work). Then choose one of the LMX images from the Data folder and select the corresponding marker. Click "add new tiff" and add TH image. Click "submit sample".
2. Add an other sample. Use unique sample name, USE A DIFFERENT comparison group than in sample1, select color. Then load the images you didn't use in sample1 and update the marker info. You should now have two samples with two markers in the table.
3. Click next
4. Select the source of images: Operetta
5. Select following processes: Segmentation, identification, cell intensity (cell area measurements is still on progress so don't run this)
6. Click next
7. Select LMX model
8. Fill the cell type identification: 
   - Some of the colours don't work, so use green, blue, red or yellow 
For example:
   - cell name: LMX+ marker: LMX Threshold: anything between 0-1 or NA, color: red
   - Add new cell type
   - cell name: TH+ marker: TH Threshold: anything between 0-1 or NA, color: blue
   
9. To the intensity cell type add TH+
10. Press run and wait
11. The run shouldn't take more than 2 min.
12. The app suppose to inform you about an error. 
