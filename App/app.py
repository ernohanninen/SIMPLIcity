"""
Title: gsea.py
Date: 2021-20-05
Author: Erno Hänninen
Description:
   
List of functions:
List of "non standard" modules:
Procedure:
"""
from concurrent.futures import process
from email.mime import image
from functools import cache
from genericpath import isdir, isfile
import json
#from msilib.schema import Directory
from flask import  Flask, request, jsonify, flash, redirect, url_for, session
from flask_restful import Api, Resource, reqparse
from werkzeug.utils import secure_filename
import csv
import subprocess #Allows running bash
import os, shutil
app = Flask(__name__)
import time
from PIL import Image
import cv2
from skimage.filters import threshold_minimum
from skimage.filters import threshold_otsu
from skimage.filters import threshold_sauvola
from skimage.filters import threshold_yen
from skimage.filters import threshold_li

from skimage.util import img_as_uint



from skimage import io
import numpy as np

#Change the file paths
#Check that the function which removes files from the src/images works

@app.route('/sampleMetadata', methods = ['POST'])
def write_metadata():
    table_state = request.values["table_state"]
    print("TABLE_STATE : ", table_state)
    print(request.values)
    print(request.files)
    #Metadata to sample_metadata.csv
    sample,color,comparison=request.values["sample"],request.values["color"], request.values["comparison"]
    #Metadata to tiff_input_metadata.csv    
    tiffs, markers,labels, thresholding=request.files.getlist("tiffs"), request.values["marker"], request.values["labels"], request.values["thresholds"]
    
    #Convert the  marker and label strings to lists
    markers = markers.split(",")
    labels = labels.split(",")
    thresholding = thresholding.split(",")
    
    #Creating the file structure 
    if table_state == "true": 
        
        if(os.path.isdir("run/metadata")):
            shutil.rmtree("run/metadata")  
        if(os.path.isdir("run/raw_tiff")):
            shutil.rmtree("run/raw_tiff")  
        if(not os.path.isdir("run")):
            os.mkdir("run")
        #os.mkdir("data/metadata")#Creatinf 
        os.mkdir("run/raw_tiff")
        os.mkdir("run/metadata")
        
    os.chdir("run/raw_tiff")#Change working dir
    
    tiff_paths = []
    for tiff in tiffs:
        #Storing the input files to raw_tiff folder
        tiff.save(secure_filename(tiff.filename))
        #Store image path to list
        tiff_paths.append(os.path.join(os.getcwd(), tiff.filename))

    os.chdir("../../")
    
    #Open sample_metadata file in append mode 
    with open("run/metadata/sample_metadata.csv", "a",encoding='UTF8', newline='') as sample_file:
        writer = csv.writer(sample_file)
        #If file is empty, write the header
        if os.stat("run/metadata/sample_metadata.csv").st_size == 0:
            writer.writerow(["sample_name","color","comparison"])
        #write sample metadata to file
        writer.writerow([sample,color,comparison])
        
        
    #Open tiff_input_metadata file in append mode    
    with open("run/metadata/tiff_input_metadata.csv", "a") as tiff_metadata:
        writer = csv.writer(tiff_metadata)
        #If file is empty, write the header line
        if os.stat("run/metadata/tiff_input_metadata.csv").st_size == 0:
            writer.writerow(["sample_name","marker","label","file_name", "thresholding"])
        #write every tiff image and the corresponding marker and label to newline
        for i in range(len(tiff_paths)):          
            writer.writerow([sample,markers[i],labels[i], tiff_paths[i], thresholding[i]])
      
    return "OK"

@app.route("/deleteSample", methods=["POST"])
def delete_sample():
    request_data = request.get_json()
    sample = request_data["sample"]
    #Deleting sample row from sample_metadata.csv
    with open("run/metadata/sample_metadata.csv", "r") as file:
        lines = file.readlines()
    
    with open("run/metadata/sample_metadata.csv", "w") as file:
        for line in lines:
            if not line.startswith(sample):
                file.write(line)
    
    #Deleting sample row from tiff_input_metadata.csv
    with open("run/metadata/tiff_input_metadata.csv", "r") as file:
        lines = file.readlines()
    
    with open("run/metadata/tiff_input_metadata.csv", "w") as file:
        for line in lines:
            if not line.startswith(sample):
                file.write(line)
                
    print("Sample deleted")
    return "OK"


@app.route('/thresholdImage', methods = ['POST'])
def threshold_image():
    print(request.files)
    tiff = request.files['image']
    print(tiff)
    #if(os.path.isdir("run/test_thresholding")):
    """if(os.path.isdir("run/test_thresholding")):
        for filename in os.listdir("run/test_thresholding"): #Get files of subdir
            file = os.path.join("run/test_thresholding", filename) #build the file path
            os.remove(file) #remove it
    else:
        os.mkdir("run/test_thresholding")  """ 
        
    if(os.path.isdir("src/images/test_thresholding")):
        for filename in os.listdir("src/images/test_thresholding"): #Get files of subdir
            file = os.path.join("src/images/test_thresholding", filename) #build the file path
            os.remove(file) #remove it
    else:
        os.mkdir("src/images/test_thresholding")
        
        
    
    #os.chdir("src/images/test_thresholding")#Change working dir
    
    print(tiff)

    #Storing the input files to raw_tiff folder
    tiff.save(secure_filename("original.tiff"))
    image = cv2.imread("original.tiff",0)
    io.imsave("src/images/test_thresholding/original_image.png", image) #Save to file
    
    thresholded = threshold_minimum(image)#Thresholding 
    min_thresholded_image = image > thresholded 
    min_thresholded_image = np.invert(min_thresholded_image) #Invert the mask
    #min_thresholded_image = img_as_uint(min_thresholded_image, force_copy = True) #Change format
    io.imsave("src/images/test_thresholding/min_thresh.png", min_thresholded_image) #Save to file
    
    thresholded = threshold_yen(image)
    yen_thresholded_image = image > thresholded
    yen_thresholded_image = np.invert(yen_thresholded_image)
    #yen_thresholded_image = img_as_uint(yen_thresholded_image, force_copy = True)
    io.imsave("src/images/test_thresholding/yen_thresh.png", yen_thresholded_image)
    
    thresholded = threshold_otsu(image)
    otsu_thresholded_image = image > thresholded
    otsu_thresholded_image = np.invert(otsu_thresholded_image)
    #otsu_thresholded_image = img_as_uint(otsu_thresholded_image, force_copy = True)
    io.imsave("src/images/test_thresholding/otsu_thresh.png", otsu_thresholded_image)
    
    thresholded = threshold_sauvola(image)
    sau_thresholded_image = image > thresholded
    sau_thresholded_image = np.invert(sau_thresholded_image)
    #sau_thresholded_image = img_as_uint(sau_thresholded_image, force_copy = True)
    io.imsave("src/images/test_thresholding/sau_thresh.png", sau_thresholded_image)
    
    thresholded = threshold_li(image)
    li_thresholded_image = image > thresholded
    li_thresholded_image = np.invert(li_thresholded_image)
    #li_thresholded_image = img_as_uint(li_thresholded_image, force_copy = True)
    io.imsave("src/images/test_thresholding/li_thresh.png", li_thresholded_image)
    
    thresholding_dict = {}#Dict where the file paths are stored
    
    """li_size = os.path.getsize("src/images/test_thresholding/li_thresh.png")
    while(li_size != os.path.getsize("src/images/test_thresholding/li_thresh.png")):
        
    #os.remove("original.tiff")
    
    
    if os.path.isfile("src/images/test_thresholding/li_thresh.png"):    
        print("_____________________________________________--")                 
    
    
    
    """
    time.sleep(1)
    
    
    directory = "src/images/test_thresholding/"
    if os.path.isdir(directory): #Check that directory exists  
        for filename in os.listdir(directory):
            file = os.path.join(directory, filename) #Building the file path
            #img = Image.open(file) #Reading the file
            temp, extension = filename.split(".")[0:2] #Splitting the filename so that it doesn't have any file extension
            print(temp,":",os.path.getsize(directory+filename))
            if extension == "png":
                #img.save("src/images/test_thresholding/" + temp + ".png") #Saving the file to other location in png format
                thresholding_dict.update({temp:filename})
    
    print(thresholding_dict)
    
    return jsonify(thresholding_dict)
    

    
@app.route('/submitSettings', methods = ["POST"])
def write_settings():

    
    instrument, area,segmentation,identification,intensity,cellArea, clustering=request.values["instrument"], request.values["area"], request.values["segmentation"],request.values["identification"], request.values["intensity"], request.values["cellArea"], request.values["clustering"]
    thresholding,homoInteractions,heteroInteractions, permutedInteractions=request.values["thresholding"], request.values["homoInteractions"],request.values["heteroInteractions"], request.values["permutedInteractions"]
    
    #os.remove("processes.txt")
    with open("processes.txt", "w") as file:
        #file.write(area)
        file.write(f"instrument:{instrument}\nexecute_area:{area}\nexecute_sd_segmentation:{segmentation}\nexecute_cell_type_identification:{identification}\nexecute_intensity:{intensity}\nexecute_measure_cell_areas:{cellArea}\nexecute_cell_clustering:{clustering}\nexecute_cell_thresholding:{thresholding}\nexecute_homotypic_interactions:{homoInteractions}\nexecute_heterotypic_interactions:{heteroInteractions}\nexecute_permuted_interactions:{permutedInteractions}")
    print("________________________________________________________________________")
    #print(th)
    with open("run/run_simpli.config", "w",encoding='UTF8', newline='') as config_file:
        #path="file.path"
        config_file.write(f'params.sample_metadata_file = "$projectDir/../App/run/metadata/sample_metadata.csv"\n')
        config_file.write(f'params.tiff_input_metadata_file = "$projectDir/../App/run/metadata/tiff_input_metadata.csv"\n')
        if area == "true":
            #config_file.write(f'params.area_measurements_metadata = "$projectDir/run/metadata/marker_area_metadata.csv"\n')
            config_file.write(f'params.area_measurements_metadata = "$projectDir/../App/run/metadata/marker_area_metadata.csv"\n')
        if identification == "true":
            config_file.write(f'params.cell_masking_metadata = "$projectDir/../App/run/metadata/cell_masking_metadata.csv"\n')
        if clustering == "true":
            config_file.write(f'params.cell_clustering_metadata = "$projectDir/run/metadata/cell_clustering_metadata"\n')
        if thresholding == "true":
            config_file.write(f'params.cell_thresholding_metadata = "$projectDir/run/metadata/cell_thresholding_metadata"\n')
        if homoInteractions == "true":
            config_file.write(f'params.homotypic_interactions_metadata = "$projectDir/run/metadata/homotypic_interactions_metadata.csv"\n')
        if heteroInteractions == "true":
            config_file.write(f'params.heterotypic_interactions_metadata = "$projectDir/run/metadata/heterotypic_interactions_metadata.csv"\n')
        #if permutedInteractions == "true":
            #config_file.write(f'params.shuffled_interactions_file = "{path}"\n')
        
        config_file.write("\n")
        config_file.write('params.permutations = "10000"\n')
        
        config_file.write('params.cell_source = "StarDist"\n')
        config_file.write('params.cp4_preprocessing_cppipe = "$projectDir/test/cellprofiler_pipelines/preprocessing_parameters.cppipe"\n')
        config_file.write('params.cp4_segmentation_cppipe = "$projectDir/test/cellprofiler_pipelines/cell_segmentation_example.cppipe"\n')
        
        config_file.write("\n")
        
       
        
        
  
        
        config_file.write("\n")
        #Type of tiff image
        config_file.write('params.tiff_type = "single"\n')
        config_file.write('params.output_folder = "$launchDir/output"\n')#Output folder
        
        config_file.write("\n")
        config_file.write("params.high_color = '"'#FF0000'"'\n")
        config_file.write("params.mid_color = '"'#FFFFFF'"'\n")
        config_file.write("params.low_color = '"'#0000FF'"'\n")
    
        config_file.write("\n")
        
        #processes to skip
        if instrument == "operetta":
            config_file.write('params.instrument_operetta = ' + "true\n")
        elif instrument == "other":
            config_file.write('params.instrument_operetta = ' + "false\n")
            
        
        
        config_file.write('params.skip_conversion = ' + "true\n")
        if instrument == "other":
            config_file.write('params.skip_normalization = ' + "false\n")
        else:
            config_file.write('params.skip_normalization = ' + "true\n")
        config_file.write('params.skip_preprocessing = ' + "false\n")
        config_file.write('params.skip_area = ' + ("true\n" if area == "false" else "false\n")) #These have currently wrong values
        config_file.write('params.skip_cp_segmentation = ' + "true\n")
        config_file.write('params.skip_sd_segmentation = ' + ("true\n" if segmentation == "false" else "false\n"))
        config_file.write('params.skip_cell_type_identification = ' + ("true\n" if identification == "false" else "false\n"))
        config_file.write('params.skip_cell_clustering = ' + ("true\n" if clustering == "false" else "false\n"))
        config_file.write('params.skip_cell_thresholding = ' + ("true\n" if thresholding == "false" else "false\n"))  
        config_file.write('params.skip_homotypic_interactions = ' + ("true\n" if homoInteractions == "false" else "false\n"))
        config_file.write('params.skip_heterotypic_interactions = ' + ("true\n" if heteroInteractions == "false" else "false\n"))
        config_file.write('params.skip_permuted_interactions = ' + ("true\n" if permutedInteractions == "false" else "false\n"))
        config_file.write('params.skip_visualization = ' + "false\n")
        config_file.write('params.skip_area_visualization = ' + ("true\n" if area == "false" else "false\n"))
        config_file.write('params.skip_type_visualization = ' + ("true\n" if identification == "false" else "false\n"))
        config_file.write('params.skip_intensity_visualization = ' + ("true\n" if intensity == "false" else "false\n"))
        config_file.write('params.skip_cluster_visualization = ' + ("true\n" if clustering == "false" else "false\n"))
        config_file.write('params.skip_thresholding_visualization = ' + ("true\n" if thresholding == "false" else "false\n"))
        config_file.write('params.skip_homotypic_visualization = ' + ("true\n" if homoInteractions == "false" else "false\n"))
        config_file.write('params.skip_heterotypic_visualization = ' + ("true\n" if heteroInteractions == "false" else "false\n"))
        config_file.write('params.skip_permuted_visualization = ' + ("true\n" if permutedInteractions == "false" else "false\n"))  
        config_file.write('params.skip_cell_area_measurements = ' + ("true\n" if cellArea == "false" else "false\n"))
        
        config_file.write("\n")
    
        config_file.write("params.raw_metadata_file = null\n")
        config_file.write("params.channel_metadata_file = null\n")
        config_file.write("params.normalized_metadata_file = null\n")
        config_file.write("params.preprocessed_metadata_file = null\n")
        if identification == "false":
            config_file.write("params.cell_masking_metadata = null\n")
        if area == "false":
            config_file.write("params.area_measurements_metadata = null\n")
        if clustering == "false":
            config_file.write("params.cell_clustering_metadata = null\n")
        if thresholding == "false":
            config_file.write("params.cell_thresholding_metadata = null\n")
        config_file.write("params.single_cell_masks_metadata = null\n")
        if homoInteractions =="false":
            config_file.write("params.homotypic_interactions_file = null\n")
        if heteroInteractions == "false":
            config_file.write("params.heterotypic_interactions_file = null\n")
        #if permutedInteractions == "false":
        config_file.write("params.shuffled_interactions_file = null\n")
        config_file.write("params.clustered_cell_data_file = null\n")
        config_file.write("params.thresholded_cell_data_file = null\n")
        config_file.write("params.annotated_cell_data_file = null\n\n") 

    return "OK"
           
                             
    
@app.route('/getSettings', methods = ["GET"])
def getSettings():
    processes_dict = {}
    with open("processes.txt", "r") as file:  

        #It might happen that the processes.txt file doesn't have enough time to update. To solve this issue the while loop waits that the file is not empty before the code run's forward
        filesize = os.path.getsize("processes.txt")
        if filesize == 0:
            while(filesize == 0):
                filesize = os.path.getsize("processes.txt")
                
        #Read the processes from file to dict
        for line in file:
            if line.endswith("\n"):
                line = line.replace("\n", "")
            line = line.split(":")   
            print(line)
            processes_dict.update({line[0]:line[1]})
   
    #Read the markers from file to dict and list
    with open("run/metadata/tiff_input_metadata.csv", "r") as file:
        marker_dict = {}
        marker_list = []
        file.readline() #Reads the header line
        counter = 0
        for line in file: #After header read line by line
            marker = line.split(",")[1]#Split the line and take the first two arguments from the list returned by split
            if marker not in marker_list:
                marker_dict.update({counter:{marker: marker}}) #Update the dictionary
                counter += 1
            marker_list.append(marker)
            
    print(processes_dict)
    
    return jsonify(processes_dict, marker_dict, marker_list)
    

#Check that this function handles also custom markers
@app.route('/submitMetadata', methods = ["POST"])
def writeMetadata():
    #Get the data, it is in python dictionary format ({id:{marker:main marker}})
    json_data = request.get_json()
    print(json_data)
    print(len(json_data))
    marker_dict, mask_dict, thresholds_dict, intensityCellType, cellAreaList = json_data["markers"], json_data["masks"], json_data["segmentingSettings"], json_data["intensityCellType"], json_data["cellAreaList"]
    print(marker_dict)
    print(type(marker_dict))
    print(mask_dict)
    print(type(mask_dict))
    print(thresholds_dict)
    print(type(cellAreaList))
    print(cellAreaList)
 
    
    #print(mask_dict)
        
    #Checks that the marker_dict is not empty    
    if all(d for d in marker_dict)==True:
        #Open the file where to write the data
        with open("run/metadata/marker_area_metadata.csv", "w",encoding='UTF8', newline='') as area_file:
            area_file.write("marker,main_marker\n") #Writing the header
            for key, value in marker_dict.items(): #Looping thru the marker dictionary
                #Get the marker and main marker
                marker = list(value.keys())[0]
                mainMarker = list(value.values())[0]
                area_file.write(marker+","+mainMarker+"\n") #Write to file
                
    #Checks that the mask_dict is not empty    
    if all(d for d in mask_dict)==True:
        #Open the file where to write the data
        with open("run/metadata/cell_masking_metadata.csv", "w",encoding='UTF8', newline='') as masking_file:
            masking_file.write("cell_type,threshold_marker,threshold_value,color\n") #Writing the header
            for key, value in mask_dict.items(): #Looping thru the marker dictionary
                #Get the marker and main marker
                metadata = []
                for elem in value: #Looping the list which contains the metadata
                    metadata.append(list(elem.values())[0]) #Storing the metadata to list
                
                masking_file.write(metadata[0]+","+metadata[1]+","+metadata[2]+","+metadata[3]+"\n") #Write to file
                
    #Checks that the thresholds_dict is not empty    
    if all(d for d in thresholds_dict)==True:
        with open("run/run_simpli.config", "a") as config_file:
            for key, value in thresholds_dict.items(): #Looping thru the thresholds dictionary
                #Get the marker and main marker
                if key == "model":
                    if value == "HuNu":
                        config_file.write('params.sd_labels_to_segment = "HuNu"\n')
                        config_file.write('params.sd_model_name = "HuNu_segment"\n')             
                        config_file.write('params.sd_model_path = "$projectDir/../App/run/models"\n')
                    elif value == "2D_versatile_fluo":
                        config_file.write('params.sd_labels_to_segment = "TH"\n')
                        config_file.write('params.sd_model_name = "2D_versatile_fluo"\n')             
                        config_file.write('params.sd_model_path = "default"\n')
                    elif value == "LMX":
                        config_file.write('params.sd_labels_to_segment = "TH,LMX"\n')
                        config_file.write('params.sd_model_name = "lmx_transfer_7"\n')             
                        config_file.write('params.sd_model_path = "$projectDir/../App/run/models"\n')
                        
                elif key == "probThreshold":        
                    config_file.write(f'params.sd_prob_thresh = "{value}"\n')
                elif key == "overlapThreshold":
                    config_file.write(f'params.sd_nms_thresh = "{value}"\n')
                
            if intensityCellType != "":
                config_file.write(f'params.cell_type_for_intensity = "{intensityCellType}"\n')
            
            if cellAreaList != []:
                config_file.write(f'params.cell_type_to_measure_area = "{",".join([cell for cell in cellAreaList])}"\n')
                
                
                            
    return "OK"

@app.route('/run', methods = ["POST"])
def runPipeline():
    
    
    print("RUN")
    if os.path.isdir("output"):shutil.rmtree("output") 
    if os.path.isdir("work"):shutil.rmdir("work")
    #Remove files from src/images subdirectories
    dir_list = ["Preprocessed", "Thresholded", "Area", "Overlays", "StarDist_Segmentation", "Intensity", "Cell_Area_Measurements"]
    for dir_name in dir_list: #Looping thru the subdirectories
        directory = "src/images/" + dir_name
        if os.path.isdir(directory):
            for filename in os.listdir(directory): #Get files of subdir
                file = os.path.join(directory, filename) #build the file path
                os.remove(file) #remove it
        
        
            
    #Running the simpli app by using Bash command
    bashCommand = "nextflow ../SIMPLI/main.nf -c run/run_simpli.config"
    process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    output, error = process.communicate()
    print("OUTPUT : ", output)
    #print("ERROR", error)
    
    if os.path.isfile("output/Plots/Area_Plots/Boxplots/total_ROI_area/total_ROI_area_boxplots.png"):                     
        #The copying takes a while so this might fail  
        shutil.copy("output/Plots/Area_Plots/Boxplots/total_ROI_area/total_ROI_area_boxplots.png", "src/images/Area/total_ROI_area_boxplots.png")
    
    #IF Cell_Intensity_Plots dir is not empty, moves all the files to other destination
    if os.path.isdir("output/Plots/Cell_Intensity_Plots"):
        if len(os.listdir("output/Plots/Cell_Intensity_Plots"))>0:
            for file in os.listdir("output/Plots/Cell_Intensity_Plots"):
                shutil.copy2(os.path.join("output/Plots/Cell_Intensity_Plots", file), "src/images/Intensity")
    
    if os.path.isdir("output/Cell_Area_Measurements"):
        shutil.copy2("output/Cell_Area_Measurements/Cell_area_measurements.json", "src/text/Cell_area_measurements.json")
    
    #shutil.move in try catche
    return "OK"

#Function that creates and returns a dictionary of the plots/images returned by SIMPLI
@app.route("/fetchResults", methods = ["GET"])
def fetchResults(): 
    #Variables
    file_dict, image_dict = {}, {} #Return dict and temp
    cell_counter,total_counter = 0,0 #cell counters
    prev_sample, prev_cell_type = "", ""
    seg_cell_dict,res_cell_dict = {}, {} #dict where to store counter values
    print("___________________________________________________-")
    #Count the number of segmented cells and cells after filtering
    if os.path.isfile("output/annotated_cells.csv"): #Check that file exists
        with open("output/annotated_cells.csv", "r") as file: 
            csv_reader = csv.reader(file, delimiter=",") #Csv reader
            next(csv_reader) #read the header away
            if False:
                for row in csv_reader: #loop over the file
                    sample = row[0] #First column of the csv is sample name
                    cell_type = row[-1] #Last column of the csv is cell type
                    #Update dict when sample name changes
                    if prev_sample != sample and prev_sample != "":   
                        seg_cell_dict.update({prev_sample : total_counter})           
                        res_cell_dict.update({prev_sample : cell_counter})
                        cell_counter,total_counter = 0,0 #Add the counters to zero
                    total_counter += 1 #Increse total counter every iteration
                    if cell_type != "UNASSIGNED": #Check that cell is not filtered away and increse the counter
                            cell_counter += 1                    
                    prev_sample = sample 
                #Update the counts of last sample to dict
                seg_cell_dict.update({sample : total_counter})           
                res_cell_dict.update({sample : cell_counter})
            else: 
                for row in csv_reader: #loop over the file
                    cell_type = row[-1] #Last column of the csv is cell type
                    if "UNASSIGNED" in cell_type: #If cell unassigned, remove the the UNASSIGNED label from cell name 
                        cell_type = cell_type.split("_")[1]
                    else:#Increase cell counter only when cell not unassigned
                        cell_counter += 1 
                    sample = row[0] + "-" + cell_type #First column of the csv is sample name
                    #Update dict when sample/cell name changes and counters to zer
                    if prev_sample != sample and prev_sample != "":   
                        seg_cell_dict.update({prev_sample : total_counter})           
                        res_cell_dict.update({prev_sample : cell_counter})
                        cell_counter,total_counter = 0,0 
                    total_counter += 1 #Increse total counter every iteration                 
                    prev_sample = sample 
                #Update the counts of last sample to dict
                seg_cell_dict.update({sample : total_counter})           
                res_cell_dict.update({sample : cell_counter}) 
    print(seg_cell_dict)
    print(res_cell_dict)   
      
            
    #Read the sample names from file
    with open("run/metadata/tiff_input_metadata.csv", "r") as file:
        sample_marker_list = []
        sample_list= []
        file.readline() #Reads the header line
        for line in file: #After header read line by line
            sample = line.split(",")[0]#Split the line and take the first argument from the list returned by split
            marker = line.split(",")[1]
            sample_marker = sample + "-" + marker
            if sample_marker not in sample_marker_list:          
                sample_marker_list.append(sample_marker)
            if sample not in sample_list:
                sample_list.append(sample)
            
        
    #Reading the output of SIMPLI, changing the image format to png and moving the file to src/images folder 
    dir_list = ["Preprocessed", "Thresholded", "Overlays", "StarDist_Segmentation"]
    for dir_name in dir_list:
        for sample_marker in sample_marker_list:
            temp_name = sample_marker.split("-")[0]
            if dir_name != "Overlays" and dir_name != "StarDist_Segmentation":
                directory = "output/Images/" + dir_name + "/" + temp_name
            elif dir_name == "Overlays":
                directory = "output/Plots/Cell_Type_Plots/" + dir_name  
            elif dir_name == "StarDist_Segmentation":
                directory = "output/" +dir_name +"/" + temp_name

            if os.path.isdir(directory): #Check that directory exists  
                for filename in os.listdir(directory):
                    sample = filename.split("-")[0]#Extracting the sample name from filename
                     
                    if filename.count("-") == 2 and "-overlay-unassigned-removed" not in filename:
                        marker = filename.split("-")[1].replace("+", "") #Extracting the sample name from filename
                        sample_temp = sample + "-" + marker
                        if sample_temp == sample_marker or marker == "ALL":
                            file = os.path.join(directory, filename) #Building the file path
                            img = Image.open(file) #Reading the file
                            temp = filename.split(".")[0] #Splitting the filename so that it doesn't have any file extension
                            img.save("src/images/" + dir_name + "/" + temp + ".png") #Saving the file to other location in png format
                            
                            
                            if sample not in image_dict.keys():#Adding new key to the dictionary, if the dict doesn't yet have the sample as a key
                                image_dict.update({sample:{}})
                            if marker not in image_dict[sample].keys() and marker != "ALL":#Adding new key to the dictionary, if the dict doesn't yet have the sample as a key
                                image_dict[sample].update({marker : []})
                            
                            
                            if dir_name == "Preprocessed": #if statement which updates the preprocessed images on image_dict temp dictionary
                                #preprocessed_dict = {"preprocessed": dir_name + "/" + temp + ".png"}
                                image_dict[sample][marker].append({"preprocessed": dir_name + "/" + temp + ".png"})
                                
                            elif dir_name == "Thresholded": #if statement which updates the preprocessed images on image_dict temp dictionary
                                #thresholded_dict =  {"thresholded": dir_name + "/" + temp + ".png"}     
                                image_dict[sample][marker].append({"thresholded": dir_name + "/" + temp + ".png"})
                                
                            elif dir_name == "Overlays" and sample_marker.split("-")[0] == temp.split("-")[0] and marker != "ALL":   
                            #elif dir_name == "Overlays" and sample == temp.split("-")[0] and len(image_dict[sample]) < 3:
                                image_dict[sample][marker].append({"overlays": dir_name + "/" + temp + ".png"})
                            
                            elif dir_name == "Overlays" and marker == "ALL":   
                            #elif dir_name == "Overlays" and sample == temp.split("-")[0] and len(image_dict[sample]) < 3:
                                image_dict[sample]["merged_overlays"] =  dir_name + "/" + temp + ".png"
                    
                    if "merged_1" in filename:
                        if "merged_tiff" not in image_dict[sample].keys():#Adding new key to the dictionary, if the dict doesn't yet have the sample as a key
                                file = os.path.join(directory, filename) #Building the file path
                                img = Image.open(file) #Reading the file
                                img.save("src/images/" + dir_name + "/" + filename) #Saving the file to other location in png format       
                                image_dict[sample].update({"merged_tiff": dir_name + "/" + filename})
                        
    print(image_dict)
    
    """for key, value in image_dict.items():
        print(key)
        print(value)
        if len(value) > 3: #More than one marker per sample
            
        for dict in value:"""                   
          
    #Copy the output of SIMPLI to src/images folder     
    area = ""
   # /home/ernohanninen/simpli-app/output/Plots/Area_Plots/Boxplots/total_ROI_area/total_ROI_area_boxplots.png
    if os.path.isfile("src/images/Area/total_ROI_area_boxplots.png"):                     
        area = "total_ROI_area_boxplots.png"
        
    intensity_dict = {}
    intensity_cell_type = ""
    intensity_directory = "src/images/Intensity"
    #IF Intensity dir is not empty, this if clause is executed
    if len(os.listdir(intensity_directory)) > 0:
        for filename in os.listdir(intensity_directory):
            if "group_pixel_intensity_kde_plot.png" in filename:
                intensity_dict["group_plot"] = filename
                intensity_cell_type = filename.split("-")[0]
            elif filename == "pixel_intensity_histogram.png":
                continue
            else:
                sample = filename.split("-")[0]
                intensity_dict[sample] = filename
                
        
        
    print(intensity_dict)
    
    file_dict.update({"samples":image_dict, "area" : area, "intensity" : intensity_dict}) #Update the dictionary which is returned to frontend
    
    cell_area_dict = {}
    if(os.path.isfile("src/text/Cell_area_measurements.json")):
        with open("src/text/Cell_area_measurements.json", "r") as file:
            cell_area_dict = json.load(file)
        
        for key, value in res_cell_dict.items():
            sample, cell = key.split("-")[0:2]
            if sample in cell_area_dict and cell in cell_area_dict[sample]:
                cell_area_dict[sample][cell]["cell_counts"] = value
                
        res_cell_dict = {} #Empty the res_cell_dict because it's information is now stored in cell_area_dict
        
    print(cell_area_dict)
    
   
    print(file_dict)
    time.sleep(1)
    
    return jsonify(file_dict, seg_cell_dict, res_cell_dict, intensity_cell_type, cell_area_dict)
#"../src/images/" 
