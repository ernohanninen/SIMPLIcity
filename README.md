# researchproject
1. Clone the repo
```
git clone git@github.com:ernohanninen/simpli_project.git
```

2. Navigate to Conda folder
```
cd simpli_project/Conda
```

3. Create the conda env
```
conda env create -f APPenv.yml
```
IN CASE OF ERROR IN THE CONDA ENV
If you get an error when building the yml file, you can also try to build the environment from scratch
Run:
```
conda create --name APPenv
```
And:
```
conda install nodejs yarn python-dotenv flask https://anaconda.org/conda-forge/flask-restful/0.3.9/download/noarch/flask-restful-0.3.9-pyhd8ed1ab_0.tar.bz2 werkzeug pillow scikit-image numpy opencv
```

4. When you have the environment activate it
```
conda activate APPenv
```

5. Navigate to the App folder
```
cd ../App
```

6. You suppose to have the my R docker container. Now you need to load also the python container, RUN:
```
docker pull ernohanninen/py_container
```

Until now you should have the app cloned from GitHub, the following containers: ernohanninen/py_container and ernohanninen/r_container, and on active APPenv environment

7. Now we can start the app. Run flask (takes care of the communication between frontend and backend):
```
flask run
```

8. Open a new terminal window (let the flask run on it's terminal own window)

9. You should be in /researchproject/App folder, if not navigate there. Activate conda environment on new window: 
```
conda activate APPenv
```

10. Run yarn (starts the react app)
```
yarn start
```

You should now find the app from browser by typing: http://localhost:3000/

We can go thru together how to test the app, but otherwise:

1. Submit the first sample by selecting sample name, comparison group and color (red or blue, some of the colors don't work). Then choose one of the LMX images from the Data folder and select the corresponding marker. Click "add new tiff" and add TH image. Click "submit sample".
2. Add an other sample. Use unique sample name, USE A DIFFERENT comparison group than in sample1, select color. Then load the images you didn't use in sample1 and update the marker info. You should now have two samples with two markers in the table.
3. Click next
4. Select the source of images: Operetta
5. Select following processes: Segmentation, identification, cell intensity
6. Click next
7. Select LMX model, set the probability threshold to 0.25
8. Be careful with the CELL TYPE IDENTIFICATION form, if you mess things up the metadata file is not filled correctly and SIMPLI will crash
Please fill the fields like this:
   - cell name: LMX+ marker: LMX Threshold: anything between 0-1 or NA, color: red
   - Add new cell type
   - cell name: TH+ marker: TH Threshold: anything between 0-1 or NA, color: blue
   - And that's it, DON't press the new cell type again, the remove button's might not work
9. To the intensity cell type add TH+
10. Press run and wait
11. From the terminal where flask is running you can follow if you got an error, the output might be difficult to interpret. The run shouldn't take more than 2 min.
12. Press display results, if everything went well you should have some plots. Otherwise you most likely get an error to the browser window.





