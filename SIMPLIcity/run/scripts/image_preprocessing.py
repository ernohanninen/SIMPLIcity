#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: image_preprocessing.py
Date: 2022-04-04
Author: Erno Hänninen

Description:
    - Preprocesses and thresholds the input image
    - Creates preprocessed metadata
List of functions:
    - get_arguments, parse_metadata, preprocess_image, create_preprocessed_metadata_file   
List of "non standard" modules:
    -    cv2, skimage, np

Procedure:
    - Read the arguments
    - Parse metadata
    - preprocess and threshold image 
    - create preprocessed metadata and store it to file 
"""
import sys, os, re
import argparse, csv
import cv2
from skimage import io
import numpy as np
from skimage.util import img_as_uint
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
    parser.add_argument("normalized_metadata_file", help = "path to a .csv file with the input metadata")
    parser.add_argument("output_path", help = "path to a output folder")
    parser.add_argument("output_metadata_file", help = "path to a .csv file with the output metadata")
    args = parser.parse_args()
    return args.sample_name, args.normalized_metadata_file, args.output_path, args.output_metadata_file

#Extract data from sample-normalized_tiff_metadata.csv file
def parse_normalized_metadata(file_name):
    #Open file for reading
    with open(file_name) as metadata_file:
        reader = csv.DictReader(metadata_file)
        normalized_metadata, marker=[], ""
        #Read the csv file to dictinary and store the dictinary in list
        for row in reader:
            temp_dict={}
            marker = row["marker"]
            thresholding = row["thresholding"]
            temp_dict.update({row["sample_name"]:row["URL"]})
            normalized_metadata.append(temp_dict)
        return normalized_metadata, marker, thresholding

#Function which process the images
def preprocess_image(metadata, marker, thresholding):
    preprocessed_metadata, thresholded_metadata = [], []
    for dictionary in metadata: #In metadata list the dictinary with images are stored
        temp_pre_dict, temp_tre_dict = {},{}
        for key, value in dictionary.items():#Loop over the dictinary
            sample = key
            file = value.replace("file:///", "")
            
            if file.endswith(".tif") or file.endswith(".tiff"):
                image = cv2.imread(file,0)#read the image
                
                #Run median blurring to image
                imageBlurred = cv2.medianBlur(image, 3) 
                #Denoise image
                imageDenoised = cv2.fastNlMeansDenoising(imageBlurred,None,3,7,21)
                #Run image clage
                clahe = cv2.createCLAHE(clipLimit=0.6, tileGridSize=(8,8))
                imageClahe = clahe.apply(imageDenoised)
            
                #re-name it and write it to file
                file = file.replace("normalized", "Preprocessed")
                image_name = os.path.basename(value)
                image_name = image_name.replace("normalized", "Preprocessed")
                cv2.imwrite(os.path.join(os.getcwd(), image_name), imageClahe) 
                #Store the image path to dict, which is later used to initialize the output metadata file               
                temp_pre_dict.update({key:os.path.join(os.getcwd(), image_name)})
                preprocessed_metadata.append(temp_pre_dict)
              
                thresholding = thresholding.lower()
                
                #Run the specified thresholding alogrithm
                if thresholding == "minimum":
                    thresholded = threshold_minimum(imageClahe)
                    thresholded_image = imageClahe > thresholded
                
                elif thresholding == "yen":
                    thresholded = threshold_yen(imageClahe)
                    thresholded_image = image > thresholded
                    
                elif thresholding == "otsu":
                    thresholded = threshold_otsu(imageClahe)
                    thresholded_image = image > thresholded
                
                elif thresholding == "sauvola":
                    thresholded = threshold_sauvola(imageClahe)
                    thresholded_image = image > thresholded
                
                elif thresholding == "triangle":
                    thresholded = threshold_triangle(imageClahe)#Thresholding 
                    thresholded_image = image > thresholded  
                    
                elif thresholding == "li":
                    thresholded = threshold_li(imageClahe)
                    thresholded_image = image > thresholded 
                    
                elif thresholding == "mean":
                    thresholded = threshold_mean(imageClahe)
                    thresholded_image = image > thresholded
                    
                elif thresholding == "isodata":
                    thresholded = threshold_isodata(imageClahe)
                    thresholded_image = image > thresholded
                
                #Invert the mask
                thresholded_image = np.invert(thresholded_image)
                #Converting the image to 16 bit
                thresholded_image = img_as_uint(thresholded_image, force_copy = True)
                #Rename thresholded image and write the image to file
                image_name = os.path.basename(value)
                image_name = image_name.replace("normalized", "Thresholded")
                #thresholded_image = np.asarray(thresholded_image, dtype="uint8")
                io.imsave(os.path.join(os.getcwd(), image_name), thresholded_image)
                print(f"writing {image_name} to : {os.path.join(os.getcwd(), image_name)}")
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
    
    return metadata
#This if statement is executed after the script is called
if __name__ == "__main__":
    sample_name, normalized_metadata_file, output_path, output_metadata_file = get_arguments()#extract the arguments
    metadata, marker,thresholding = parse_normalized_metadata(normalized_metadata_file) #read the metadata
    preprocessed_metadata, thresholded_metadata = preprocess_image(metadata, marker, thresholding)#process the image
    preprocessed_metadata_file = create_preprocessed_metadata_file(preprocessed_metadata, thresholded_metadata) #create preprocessed metadata
    
    #write the metadata to file
    with open(output_metadata_file, mode = 'w') as output_metadata:
        metadata_writer = csv.DictWriter(output_metadata, fieldnames = preprocessed_metadata_file[0].keys())
        metadata_writer.writeheader()
        metadata_writer.writerows(preprocessed_metadata_file)
