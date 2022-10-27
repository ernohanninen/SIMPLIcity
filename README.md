# researchproject
1. Clone the repo
```
git clone git@github.com:ernohanninen/researchproject.git
```

If you already have conda environment, skip steps 2-5 and navigate to App folder:             
cd researchproject/App

Otherwise:

2. Navigate to Conda folder

```
cd researchproject/Conda
```

3. Create the conda env
```
conda env create -f PYenv.yml
```

4. Activate the conda env
```
conda activate PYenv
```

5. Navigate to the App folder
```
cd ../App
```

6. You need to set up node modules (contains JavaScript libraries) by running:
```
npm install
```


This should create node_modules folder to your App dir

7. Now we can start the app. Run flask (takes care of the communication between frontend and backend):
```
flask run
```

8. Open a new terminal window (let the flask run on it's own window)

9. You should be in /researchproject/App folder, if not navigate there. Activate conda environment on new window: 
```
conda activate PYenv
```

10. Run yarn (starts the react app)
```
yarn start
```

You should now find the app from browser by typing: http://localhost:3000/

We can go thru together how to test the app, but otherwise:

1. Submit the first sample by selecting sample name, comparison group and color (red or blue, some of the colors don't work). Then choose one of the LMX images from the Data folder and select the corresponding marker. Click "add new tiff" and add TH image. Click "submit sample".
2. Add an other sample by selecting the images you didn't use in sample 1 USE A DIFFERENT comparison group. You should now have two samples in the table with two
3. Click next
4. Select the source of images: Operetta
5. Select following processes: Segmentation, identification, cell intensity
6. Click next
7. Select LMX model, set the probability threshold to 0.25
8. Be carefull with the cell type identification form, if you mess things up the metadata file is not filled correctly and SIMPLI will crash
   - cell name: LMX+ marker: LMX Threshold: anything between 0-1 or NA, color: red
   - Add new cell type
   - cell name: TH+ marker: TH Threshold: anything between 0-1 or NA, color: blue
   - And that's it DON't press the new cell type again
9. TO the intensity cell type add TH+
10. Press run and wait
11. From the terminal where flask is running you can follow if you got an error
12. Press display results, if everything went well you should have some plots.





