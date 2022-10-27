#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: Cell_area_measurements.py
Date: 2022-10-20
Author: Erno Hänninen
Description:
   
List of functions:
    -    
List of "non standard" modules:
    -    cv2, numpy, matplotlib
Error handling:
    - Program starts when it is started with two arguments
Procedure:

"""
import sys,os, csv
import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt
import json

"""
Todo:
 - Test with 3 images (LMX+/TH+)
 - Test for triple overlap


"""


def area_measurements(cell_types, img_dict, annotated_cell_file):
    print(cell_types)
    pixel_dict = {} #Dictionary where the result is stored
    #Loop over the dictionary where each sample has the corresponding images
    for key, values in img_dict.items():
        
        print(values) #files
        sample = key #Key contains the sample name
        print(sample)
        if sample not in pixel_dict.keys():
            pixel_dict.update({sample:{}})
        #Loop thru the cell_types
        print("__________________________________________________________________________________-")
        for cell in cell_types: #Loop over the cell types
            if cell not in pixel_dict[sample].keys():
                pixel_dict[sample].update({cell:{}})
                
            if "/" in cell: #Cells which contains "/" means we are looking for cells which expresses several markers
                cellList = cell.split("/") #COnvert the cell string to list
                print(cellList)
                temp_files = [x for x in values if x.split("-")[1] in cellList] #Get the files to a list which contains the cell type of interest
                print(temp_files)
                images = [] #List where the images are stored
                for i in range(len(temp_files)): #Loop over the image filesnames in list
                    images.append(cv.imread(temp_files[i], 0)) #Read the image in 8-bit grayscale format and store it to list
                print(np.unique(images[0])[1])
                print(np.unique(images[1])[1])

                locations = []
                #THese if statements does all the same thing
                #The if statement executed depends of how many files (different image channels) there are in a list
                #If the list contains two files we are looking for double positive cells
                #Using np.where function to extract the locations where the condition is met
                #From the grayscale image we are looking for pixel values 76, when the condition is met in both images, we have a double positive cell, etc.
                if len(images) == 2: #Double poisitive cells
                    locations = np.where((images[0] == np.unique(images[0])[1]) & (images[1] == np.unique(images[1])[1]))
                elif len(images) == 3: #Triple positive cells
                    locations = np.where((images[0] == 85) & (images[1] == 85) & (images[2] == 85))
                elif len(images) == 4: #Cells positive for 4 markers
                    locations = np.where((images[0] == 85) & (images[1] == 85) & (images[2] == 85) & (images[3] == 85))
                    
                print(len(images[0][locations]))
                pixel_dict[sample][cell].update({"pixel_counts":len(images[0][locations])}) #Use the indices to extract the pixels from the image, take the lenght and update to dictinary        
                
                #The raw counts
                img = np.zeros_like(images[0])
                img[locations] = 255
                img_name = sample + "_overlaps.png"
                contours, hierarchy = cv.findContours(img, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
                pixel_dict[sample][cell].update({"cell_counts":len(contours)})
                print(len(contours))    
                img = cv.drawContours(img, contours, -1, (60, 140, 140), 1)
                cv.imwrite(os.path.join(os.getcwd(), img_name), img)
                
                
                
                     
            else:
                #Loop thru the files and check if a filename contains the cell type
                for file in values:
                    if cell in file: #This file should be measured
                        print(cell)
                        print(file)
                        image = cv.imread(file, 0) #Read the image as gray scale
                        print(np.unique(image)[1])
                        #Returns the indices of elementes in array where the condition is met
                        locations = np.where(image == np.unique(image)[1])
                        print(len(image[locations])) #Get the elements using the indices and take the length
                        pixel_dict[sample][cell].update({"pixel_counts":len(image[locations])})  #Use the indices to extract the pixels from the image, take the length and update to dictionary                   
                        pixel_dict[sample][cell].update({"cell_counts":""}) #Cell count for cells expressing only one marker is set to ""
                        

    
    print(pixel_dict)
    with open('Cell_area_measurements.json', 'w') as file:
        file.write(json.dumps(pixel_dict))
                    
                    
                    

if __name__ == "__main__":
    #Read the arguments
    overlay_images = sys.argv[1:int(len(sys.argv)-3)] #Overlay images
    annotated_cell_file = sys.argv[len(sys.argv)-3]
    cell_masking_metadata = sys.argv[len(sys.argv)-2]
    cell_types = sys.argv[len(sys.argv)-1]

    overlay_images.sort() #Sort the image filename list
    overlay_files, img_dict= [], {} #Initialize data structures
    
    previous_sample = "" #Variable where prvious sample is stored
    for image in overlay_images: #Loop over the overlay_images list
        sample = image.split("-")[0] #Extract the sample name from image name
        if sample == previous_sample or previous_sample == "": #In case previous sample and sample are equal store the image to list
            overlay_files.append(image)
        else: #When the sample changes empty the list  and store the current sample to the list
            overlay_files = []
            overlay_files.append(image)
        img_dict[sample] = overlay_files #For each sample this dictionary contains a list of images
        previous_sample = sample #Update the previous sample variable
        
    print(img_dict)
        
    #Calling area_measurements function and change the cell_types string to list
    area_measurements(cell_types.split(","), img_dict, annotated_cell_file)
    
    
    
    