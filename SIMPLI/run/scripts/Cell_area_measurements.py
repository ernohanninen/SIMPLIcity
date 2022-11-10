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
from xml.dom import HierarchyRequestErr
import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt
import json
from itertools import takewhile

"""
Todo:
 - Test with 3 images (LMX+/TH+)
 - Test for triple overlap


"""


def area_measurements(cell_types, img_dict, co_expression_fraction, cell_type_dict):
    print(cell_types)
    pixel_dict = {} #Dictionary where the result is stored
    #Loop over the dictionary where each sample has the corresponding images
    for index, key in enumerate(img_dict):
        
        print(img_dict[key]) #files
        sample = key #Key contains the sample name
        print(sample)
        images_list, contours_list, contours_img_list =[], [], []
        if sample not in pixel_dict.keys():
            pixel_dict.update({sample:{}})
        #Loop thru the cell_types
        for cell in cell_types: #Loop over the cell types
            if cell not in pixel_dict[sample].keys():
                pixel_dict[sample].update({cell:{}})
                
            if "/" in cell: #Cells which contains "/" means we are looking for cells which expresses several markers
                cellList = cell.split("/") #COnvert the cell string to list
                print(cellList)
                temp_files = [x for x in img_dict[key][index]["overlays"] if x.split("-")[1] in cellList] #Get the files to a list which contains the cell type of interest
                marker_list = []
                for key1, value1 in cell_type_dict.items():
                    print(key1, value1)
                    if key1 in cellList:
                        marker_list.append(value1) 
                print(key)
                print(img_dict[key][index+1]["masks"])
                print(marker_list)
                temp_mask = [x for x in img_dict[key][index+1]["masks"] if x.split("-")[1] in marker_list]
                print(temp_files)
                print(temp_mask)
                images = [] #List where the images are stored
                for i in range(len(temp_files)): #Loop over the image filesnames in list
                    images.append(cv.imread(temp_files[i], 0)) #Read the image in 8-bit grayscale format and store it to list
              
                overlays_image_name = [x for x in temp_files if x.split("-")[1] == cellList[0]][0]
                overlay_image = cv.imread(overlays_image_name, 0)
                mask_image_name = [x for x in temp_mask if x.split("-")[1] == marker_list[0]][0]
                cell_mask = cv.imread(mask_image_name, 1)
                print(overlays_image_name)
                print(cell_mask)
                markers = cv.watershed(overlay_image, cell_mask)
                img_name = sample + "_markers.png"
                cv.imwrite(os.path.join(os.getcwd(), img_name), markers)
                
                
                
                
                contours, hierarchy = cv.findContours(overlay_image, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
                contour_image = cv.drawContours(np.zeros_like((overlay_image), np.uint8), contours, -1, 255, cv.FILLED)
                img_name = sample + "_overlaps.png"
                cv.imwrite(os.path.join(os.getcwd(), img_name), contour_image)
                locations = []
                
                overlays_images_list = [x for x in temp_files if x.split("-")[1] != cellList[0]]
                print(overlays_images_list)
                for i in range(len(overlays_images_list)): #Loop over the image filesnames in list
                    images_list.append(cv.imread(overlays_images_list[i], 0))
               
                for i in range(len(images_list)):
                    contours2, hierarchy = cv.findContours(images_list[i], cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
                    #contours_list.append(contours)
                    contours_img_list.append(cv.drawContours(np.zeros_like((overlay_image), np.uint8), contours2, -1, 255, cv.FILLED))
                    
                    img_name = sample + "LMX_overlaps.png"
                    cv.imwrite(os.path.join(os.getcwd(), img_name), contours_img_list[i])
                    
                mask_combined = cv.bitwise_and(contour_image, contours_img_list[0])#Intersection
                #img_name = sample + "Intersections_overlaps.png"
                #cv.imwrite(os.path.join(os.getcwd(), img_name), mask_combined)
                
                result_img = np.zeros_like(images[0])
                #print(contours)
                def test_overlap(x,y,w,h, x2,y2,w2,h2):
                    #print(len(np.where(mask_combined[y:y+h, x:x+w]==255)[0]))
                    #print(len(np.where(mask_combined[y2:y2+h2, x2:x2+w2]==255)[0]))
                   
                    if len(np.where(mask_combined[y2:y2+h2, x2:x2+w2]==255)[0]) == 0: #The comparison countour doesn't overlap with the intersection, return false
                        return False
                    print("Intersection")
                    locations = np.where(contour_image[y:y+h, x:x+w]==255)
                    locations_comparison = np.where(contours_img_list[0][y2:y2+h2, x2:x2+w2]==255)
                    print(len(np.where(mask_combined[y2:y2+h2, x2:x2+w2]==255)[0]))
                    print(len(contour_image[locations_comparison]))
                    if len(np.where(mask_combined[y:y+h, x:x+w]==255)[0]) / len(contour_image[locations_comparison]) < co_expression_fraction:
                        return False 
                    print("overlap")
                    return True
                
                for cnt in contours:
                    x,y,w,h = cv.boundingRect(cnt)
                    if len(np.where(mask_combined[y:y+h, x:x+w]==255)[0]) != 0: #Check that the contour overlaps with intersection
                        for cnt2 in contours2:                       
                            x2,y2,w2,h2 = cv.boundingRect(cnt2)                       
                            if test_overlap(x,y,w,h,x2,y2,w2,h2):
                                cv.drawContours(result_img, [cnt], -1, 255, -1)
                        
                img_name = sample + "-double_positive_overlaps.png"
                cv.imwrite(os.path.join(os.getcwd(), img_name), result_img)
                
                locations = np.where(result_img==255)
                pixel_dict[sample][cell].update({"pixel_counts":len(result_img[locations])}) #Use the indices to extract the pixels from the image, take the lenght and update to dictinary        
                
                contours, hierarchy = cv.findContours(result_img, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
                pixel_dict[sample][cell].update({"cell_counts":len(contours)})     
                     
            else:
                #Loop thru the files and check if a filename contains the cell type
                for file in img_dict[key][index]["overlays"]:
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
    
    """
    overlay_images = sys.argv[1:int(((len(sys.argv)-3)/2)+1)]
    overlay_images.sort()
    preprocessed_images = sys.argv[int(((len(sys.argv)-3)/2)+1):len(sys.argv)-3]
    preprocessed_images.sort()
    #Get sample_metadata.csv file from the input
    sample_metadata_file = sys.argv[len(sys.argv)-3]
    cell_masking_metadata_file = sys.argv[len(sys.argv)-2]
    cell_type = sys.argv[len(sys.argv)-1]
    """
    overlay_images = sys.argv[1:int(((len(sys.argv)-3)/2)+1)] #Overlay images
    cell_masks = sys.argv[int(((len(sys.argv)-3)/2)+1):len(sys.argv)-3] #Overlay images
    cell_masking_metadata = sys.argv[len(sys.argv)-3]
    cell_types = sys.argv[len(sys.argv)-2]
    co_expression_fraction = float(sys.argv[len(sys.argv)-1])
    print(co_expression_fraction)
    cell_masks.sort()
    overlay_images.sort() #Sort the image filename list
    overlay_files,mask_files, img_dict= [],[], {} #Initialize data structures
    previous_sample = "" #Variable where prvious sample is stored
    print(overlay_images)
    print(cell_masks)
    
    for i in range(len(overlay_images)): #Loop over the overlay_images list
        sample = overlay_images[i].split("-")[0] #Extract the sample name from image name
        if sample not in img_dict.keys():
            img_dict[sample] = []
        if sample == previous_sample or previous_sample == "": #In case previous sample and sample are equal store the image to list
            overlay_files.append(overlay_images[i])
            mask_files.append(cell_masks[i])
        else: #When the sample changes empty the list  and store the current sample to the list
            img_dict[sample].append({"overlays":overlay_files}) #For each sample this dictionary contains a list of images
            img_dict[sample].append({"masks":mask_files}) #For each sample this dictionary contains a list of images
            overlay_files = []
            mask_files = []
            overlay_files.append(overlay_images[i])
            mask_files.append(cell_masks[i])
        
        #if "overlays" not in img_dict.keys() or "masks" not in img_dict.keys():#Adding new key to the dictionary, if the dict doesn't yet have the sample as a key
        #img_dict.update({sample:{"overlays":overlay_files}})
        #img_dict.update({sample:{"masks":mask_files}})
        print("________________________________________________")
        previous_sample = sample
        
    img_dict[sample].append({"overlays":overlay_files}) #For each sample this dictionary contains a list of images
    img_dict[sample].append({"masks":mask_files}) #For each sample this dictionary contains a list of images
        
        
         #Update the previous sample variable
        
    print(img_dict)
    
    cell_type_dict = {}
    with open(cell_masking_metadata, "r") as file:     
        file.readline() #Reads the header line
        for line in file: #After header read line by line
            cell_type = line.split(",")[0]#Split the line and take the first argument from the list returned by split
            marker = line.split(",")[1]
            cell_type_dict[cell_type] = marker
    print(cell_type_dict)
    #Calling area_measurements function and change the cell_types string to list
    area_measurements(cell_types.split(","), img_dict, co_expression_fraction,cell_type_dict)
    
    
    
    