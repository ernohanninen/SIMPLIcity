#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: operetta_image_preprocessing.py
Date: 2022-10-07
Author: Erno Hänninen
Description:
    - Thresholds the input image
   
List of functions:
    - get_arguments, parse_metadata, preprocess_image, create_preprocessed_metadata_file   
List of "non standard" modules:
    -    cv2, skimage

Procedure:
    - Read the arguments
    - Parse metadata
    - threshold image 
    - create preprocessed metadata and store it to file 
"""

from random import sample
import sys, os, re
import argparse, csv
import cv2
from skimage import io
from skimage.util import img_as_uint
from skimage import morphology
from skimage.filters import threshold_minimum
from skimage.filters import threshold_otsu
from skimage.filters import threshold_sauvola
from skimage.filters import threshold_yen
from skimage.filters import threshold_triangle
from skimage.filters import threshold_isodata
from skimage.filters import threshold_mean
from skimage.filters import threshold_li

#Parse the input
def get_arguments():
    parser = argparse.ArgumentParser(description = "Performs image preprocessing")
    parser.add_argument("sample_name", help = "name of the sample")
    parser.add_argument("metadata_file", help = "path to a .csv file with the input metadata")
    parser.add_argument("output_path", help = "path to a output folder")
    parser.add_argument("output_metadata_file", help = "path to a .csv file with the output metadata")
    args = parser.parse_args()
    return args.sample_name, args.metadata_file, args.output_path, args.output_metadata_file



#Extract data from tiff_input_metadata.csv file
def parse_metadata(file_name, sample_name):
    #Open file for reading
    with open(file_name) as metadata_file:
        reader = csv.DictReader(metadata_file)
        metadata, marker=[], ""

        #Read the csv file to dictinary and store the dictinary in list
        for row in reader:
            if row["sample_name"] == sample_name:
                temp_dict={}
                marker = row["label"]
                thresholding = row["thresholding"]
                key = row["sample_name"] + "-" + marker
                temp_dict.update({key:row["file_name"]})
                metadata.append(temp_dict)
        return metadata, marker, thresholding

#Function which process the images
def preprocess_image(metadata, thresholding):
    preprocessed_metadata, thresholded_metadata = [], []
    for dictionary in metadata: #In metadata list the dictinary with images are stored
        temp_pre_dict, temp_tre_dict = {},{}
        for key, value in dictionary.items(): #Loop over the dictinary
            
            if value.endswith(".tif") or value.endswith(".tiff"):
                print(value)
                print(os.getcwd())
                image = cv2.imread(value,0) #read the image

                #re-name it and write it to file
                sample = key.split("-")[0]
                image_name = key + "-Preprocessed.tiff"
                cv2.imwrite(os.path.join(os.getcwd(), image_name), image)
                
                #Store the image path to dict, which is later used to initialize the output metadata file
                temp_pre_dict.update({sample:os.path.join(os.getcwd(), image_name)})
                preprocessed_metadata.append(temp_pre_dict)
                
                ############################################################################################## 
                thresholding = thresholding.lower()

                #Run the specified thresholding alogrithm
                if thresholding == "minimum":
                    thresholded = threshold_minimum(image)
                    thresholded_image = image > thresholded
                
                elif thresholding == "yen":
                    thresholded = threshold_yen(image)
                    thresholded_image = image > thresholded
                    
                elif thresholding == "otsu":
                    thresholded = threshold_otsu(image)
                    thresholded_image = image > thresholded
                
                elif thresholding == "sauvola":
                    thresholded = threshold_sauvola(image)
                    thresholded_image = image > thresholded
                    
                elif thresholding == "triangle":
                    thresholded = threshold_triangle(image)#Thresholding 
                    thresholded_image = image > thresholded  
                    
                elif thresholding == "li":
                    thresholded = threshold_li(image)
                    thresholded_image = image > thresholded 
                    
                elif thresholding == "mean":
                    thresholded = threshold_mean(image)
                    thresholded_image = image > thresholded
                    
                elif thresholding == "isodata":
                    thresholded = threshold_isodata(image)
                    thresholded_image = image > thresholded
                
                #Function which removes small artifacts from the thresholded image
                processed = morphology.remove_small_objects(thresholded_image, 4 ** 3)
                #Converting the image to 16 bit
                processed = img_as_uint(processed, force_copy = True)
                #Rename thresholded image and write the image to file
                image_name = image_name.replace("Preprocessed", "Thresholded")
                io.imsave(os.path.join(os.getcwd(), image_name), processed)
                #Store the metadata to dict                
                temp_tre_dict.update({key:os.path.join(os.getcwd(), image_name)})
                thresholded_metadata.append(temp_tre_dict)
                
                ################################################################################3
                
    return preprocessed_metadata, thresholded_metadata
#Create metadata file
#Preprocessed metadata file needs sample_name, label, file_name
def create_preprocessed_metadata_file(preprocessed_metadata, thresholded_metadata):
    metadata = []
    #Loop over the two dict
    for dic1, dic2 in zip(preprocessed_metadata, thresholded_metadata):
        for (key1, value1), (key2, value2) in zip(dic1.items(), dic2.items()):
            sample_name = key1
            file = os.path.basename(value1) #extracts the file name from the path
            #Using regex to find the label from the file name
            label = re.search("(?<=-)\w+(?=-)", file).group(0)
            file_name1, file_name2 = value1,value2
            #Store the items to list of dictinaries
            metadata.append({"sample_name":sample_name, "label":label, "file_name":file_name1, "file_name2": file_name2} )
    
    return metadata #Return the list
            
if __name__ == "__main__":
    sample_name, input_metadata_file, output_path, output_metadata_file = get_arguments() #extract the arguments
    metadata, marker,thresholding = parse_metadata(input_metadata_file, sample_name) #read the metadata
    preprocessed_metadata, thresholded_metadata = preprocess_image(metadata, thresholding) #process the image
    preprocessed_metadata_file = create_preprocessed_metadata_file(preprocessed_metadata, thresholded_metadata) #create preprocessed metadata
    
    #write the metadata to file
    with open(output_metadata_file, mode = 'w') as output_metadata:
        metadata_writer = csv.DictWriter(output_metadata, fieldnames = preprocessed_metadata_file[0].keys())
        metadata_writer.writeheader()
        metadata_writer.writerows(preprocessed_metadata_file)