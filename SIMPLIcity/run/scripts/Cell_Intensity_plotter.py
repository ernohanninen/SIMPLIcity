#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: Cell_intensity_plotter.py
Date: 2022-29-05
Author: Erno Hänninen
Description:
    - This script reads the input images and plots a pixel intensity distribution between two froups
   
List of functions:
    -    Histogram_plotter
List of "non standard" modules:
    -    cv2, numpy, matplotlib
Procedure:
    - Read input to a dictionary. discriminate the distinct groups 
    - Loop over the sample_dict containing the groups as a key and their corresponding cell masks and the original tiff
    - Read the mask and the tiff
        - Get the pixel values from there where the mask overlaps the tiff 
        - Plot the distribution for each sample
        - Store the pixel values to list
    - Repeate the process above for each image and store the group specific values to a list
    - Flatten the group specific lists and plot the distribution of two groups into a same plot

"""
import sys,os, csv
import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import itertools
def histogram_plotter(sample_dict, cell_type):
    
    temp = []
    pixel_dict = {}
    #Looping over the dictionary
    for key, values in sample_dict.items():
        pixels = []
        if key not in pixel_dict.keys():#Adding new key to the dictionary, if the dict doesn't yet have it
            pixel_dict.update({key:{"pixels": 0, "color" : values["color"]}})
        
        #Looping over the preprocessed and overlay files
        for i in range(len(values["preprocessed"])):
            preprocessed_img = cv.imread(values["preprocessed"][i], 0)
            overlay_img = cv.imread(values["overlays"][i], -1)
            #Picking the mask locations
            locations = np.where(overlay_img == 255)[0:2]
            
            #Use the mask locations to pick the pixel values from the preprocessed image
            #bincount counts the number of occurances of each value in array
            #Specifying the minimum number of bins with minlength parameter, so that the all arrays has the same length
            #Append the values to list and store the list to dictionary    
            pixels.append(preprocessed_img[locations])
            sns.kdeplot(preprocessed_img[locations], color=values["color"], fill = "True", cut = 0, label=values["preprocessed"][i].split("-")[0] + " (" + key + ")")
            plt.legend(loc='upper right')
            plt.title("KDE plot of pixels classified as "+ cell_type + "-cells in " + values["preprocessed"][i].split("-")[0])
            plt.xlabel("Pixel values")
            plt.tight_layout()
            plt.savefig(values["preprocessed"][i].split("-")[0] + "-pixel_intensity_kde_plot.png")
            plt.clf() #Reset the plot  
            
            temp.append(preprocessed_img[locations])
            pixel_dict[key]["pixels"] = pixels
        
    flattened_arrays, colors, groups = [], [], []
    #Looping thru the pixel dict which is created and updated in the loop above
    for key, values in pixel_dict.items():
        flattened_array = list(itertools.chain(*pixel_dict[key]["pixels"])) #Flatten the array's among comparison group
        #Store the values to separate lists
        flattened_arrays.append(flattened_array)
        colors.append(pixel_dict[key]["color"]) #Store color of the samples
        groups.append(key) #The key contains the comparison column
        
        
    fig, ax = plt.subplots()
    for i in range(len(flattened_arrays)):
        sns.kdeplot(flattened_arrays[i], color=colors[i], ax=ax, fill = "True", label=groups[i], cut = 0)
    ax.legend(loc='upper right')
    #sns.kdeplot(histograms, color = colors, label = groups, cut = 0, fill = True)
    plt.title("KDE plot of pixels classified as "+ cell_type + "-cells in groups: " + str(groups))
    plt.xlabel("Pixel values")
    plt.tight_layout()
    plt.savefig(cell_type + "-group_pixel_intensity_kde_plot.png")
    plt.clf() #Reset the plot  
    
        
         
  
    
if __name__ == "__main__":
    
    for elem in sys.argv:
        if "ALL-overlay" in elem:
            sys.argv.remove(elem)
    #Extracting preprocessed images and overlay images from the input and sorting the list
    overlay_images = sys.argv[1:int(((len(sys.argv)-3)/2)+1)]
    overlay_images.sort()
    preprocessed_images = sys.argv[int(((len(sys.argv)-3)/2)+1):len(sys.argv)-3]
    preprocessed_images.sort()
    #Get sample_metadata.csv file from the input
    sample_metadata_file = sys.argv[len(sys.argv)-3]
    cell_masking_metadata_file = sys.argv[len(sys.argv)-2]
    cell_type = sys.argv[len(sys.argv)-1]
    
    with open(cell_masking_metadata_file, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if cell_type == row["cell_type"]:
                marker = row["threshold_marker"]
                
    
    sample_dict,sample_list = {},[]
    #Going thru the csv file row by row
    with open(sample_metadata_file, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            #Read the column to variable
            if row["comparison"] != "NA":
                sample = row["sample_name"]
                color = row["color"]     
                comparison = row["comparison"]
                #Adding new keys to the dictionary, if the dict doesn't yet have it
                #This if is executed every time there is a comparison group which is not yet on dictionary
                if comparison not in sample_dict.keys():
                    sample_dict.update({comparison:{}}) #The comparison key contains a dictionary as value
                    #creating sample and color keys to the comparison dict
                    if "sample" not in sample_dict[comparison].keys():
                        sample_dict[comparison].update({"sample":[]})
                    if "color" not in sample_dict[comparison].keys():
                        sample_dict[comparison].update({"color":""})
                
                #There can be several samples in one group, that's why using list here
                sample_dict[comparison]["sample"].append(sample)
                sample_dict[comparison]["color"] = color #storing the color to the dict
                     
    
    #GOing thru the dictionary we just created above
    for key, value in sample_dict.items():
        preprocessed_files = []
        overlay_files = []
        #Looping over the sample names 
        for sample in value["sample"]:
            #Store the input files which has the same sample name to a list
            for i in range(len(preprocessed_images)):
                if sample in preprocessed_images[i].split("-")[0]:
                    if preprocessed_images[i].split("-")[1] == marker:
                        preprocessed_files.append(preprocessed_images[i])
                    if overlay_images[i].split("-")[1] == cell_type:
                        overlay_files.append(overlay_images[i])
                    
        #Create new keys and store the file lists to the dictionary
        if "overlays" not in sample_dict[key].keys():#Adding new key to the dictionary, if the dict doesn't yet have the sample as a key
            sample_dict[key].update({"preprocessed":preprocessed_files})
        if "mask" not in sample_dict[key].keys():#Adding new key to the dictionary, if the dict doesn't yet have the sample as a key
            sample_dict[key].update({"overlays":overlay_files})
                
            
    print(sample_dict)          
    
    #Calling the histogram plotter function
    histogram_plotter(sample_dict, cell_type)  