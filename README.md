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
To run the pipeline on command-line [nextflow configuration](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#nextflow-configuration-file) file and [SIMPLIcity input metadata](https://github.com/ernohanninen/SIMPLIcity/blob/master/README.md#simplicity-metadata-files) files needs to be set up.

1. To run the pipeline, navigate to folder where main.nf file is located
```
cd ~/simpli_project/SIMPLIcity/
```
2. Run the pipeline
```
nextflow run main.nf -c run/run_simplicity.config 
```

#### Nextflow configuration file


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
