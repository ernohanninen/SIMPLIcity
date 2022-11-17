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
To run the pipeline on command-line [nextflow configuration](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#nextflow-configuration-file) file and [SIMPLIcity metadata](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#simplicity-metadata-files) files needs to be set up.

1. To run the pipeline, navigate to folder where main.nf file is located
```
cd ~/simpli_project/SIMPLIcity/
```
2. Run the pipeline
```
nextflow run main.nf -c run/run_simplicity.config 
```

#### Nextflow configuration file
Parameters to SIMPLIcity are specified in nextflow configuartion file

params.instrument_operetta = true

##### Input
Path to the metadata files containing input samples and images.
- sample_metadata_file = Metadata file containing the samples used in analysis.
- tiff_input_metadata_file = Metadata file for single-channel TIFF input image.


##### Selection of analysis processes to run

Specify the processes to skip using either `true` or `false` as values. The processes which aren't executable/tested on SIMPLIcity are initialized to `true`, and threfore should be skipped
- skip_conversion = `true`
- skip_normalization = Do not perform image channel normalization. When using images aqcuired with Operetta CLS system, set true.
- skip_preprocessing = Do not perform image denoising and contrast enhancement
- skip_area = Do not perform thresholding based pixel-level analysis.
- skip_cp_segmentation = `true`
- skip_sd_segmentation = Do not perform deep-learning based cell segmentation with StarDist.
- skip_cell_type_identification = Do not perform cell type identification.
- params.skip_cell_area_measurements = Do not identify co-expressing cells or measure cell area of specified cell type.
- skip_cell_clustering = `true`
- skip_cell_thresholding = `true`
- skip_homotypic_interactions = `true`
- skip_heterotypic_interactions = `true`
- skip_permuted_interactions = `true`
- skip_visualization = Do not perform any of the following visualization steps.
- skip_area_visualization = `true`
- skip_type_visualization = Do not plot the results of the cell type identification.
- params.skip_intensity_visualization = Do not perform measure and visualize pixel intensity distribution between two groups
- skip_cluster_visualization = `true`
- skip_thresholding_visualization = `true`
- skip_homotypic_visualization = `true`
- skip_heterotypic_visualization = `true`
- skip_permuted_visualization = `true`


##### Process specific metadata files

Path to files which contains user-specified settings for the processes. The files which are for processes not tested in SIMPLIcity are initialized to `null`.
- area_measurements_metadata = `null`
- cell_clustering_metadata = `null`
- cell_thresholding_metadata = `null`
- cell_masking_metadata = Metadata file with the parameters for cell type identification.
- homotypic_interactions_metadata = `null`
- heterotypic_interactions_metadata = `null`

##### Step specific metadata files
SIMPLI allows users to skip processes and instead enables users to supply the output data of a processs. However, this functionality is not tested in SIMPLIcity, therefore these parameters are initialized to `null`.
- raw_metadata_file = `null`
- channel_metadata = `null`
- normalized_metadata_file = `null`
- preprocessed_metadata_file = `null`
- area_measurements = `null`
- single_cell_data_file = `null`
- annotated_cell_data_file = `null`
- clustered_cell_data_file = `null`
- thresholded_cell_data_file = `null`
- homotypic_interactions_file = `null`
- heterotypic_interactions_file = `null`
- single_cell_masks_metadata = `null`
- shuffled_interactions_file = `null`

##### CellProfiler4 pipelines
Even though CellProfiler4 dependencies is removed from SIMPLIcity, the parameters needs to be initialized.
- cp4_preprocessing_cppipe = `null`
. cp4_segmentation_cppipe = `null`

##### StarDist segmentation settings
sd_labels_to_segment = comma separated list of labels to include in the multichannel image used for segmentation. The labels mucnames must match those in the preprocessed_metadata_file
sd_model_name = name of the model to use
sd_model_path = path to the model to use or "default" for the models included with StarDist
sd_prob_thresh = probability threshold used for calling cells: 0 < value < 1 or "default" to use the default valuse saved in the model.
sd_nms_thresh = threshold above which Non-Maximum Suppression is performed: 0 < value < 1 or "default" to use the default valuse saved in the model

#### SIMPLIcity metadata files





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
