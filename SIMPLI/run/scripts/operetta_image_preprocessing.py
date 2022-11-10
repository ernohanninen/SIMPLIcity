#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: operetta_image_preprocessing.py
Date: 2021-10-07
Author: Erno Hänninen
Description:
   
List of functions:
    -    
List of "non standard" modules:
    -    cv2 
Error handling:
    - Program starts when it is started with two arguments
Procedure:
Usage: python image_preprocessing.py <path_to_input_folder>

"""
#The input is by sample

#from random import sample
from random import sample
import sys, os, re
import argparse, csv
import cv2
#from skimage.filters import threshold_yen
from skimage import io
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
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

        for row in reader:
            if row["sample_name"] == sample_name:
                temp_dict={}
                marker = row["marker"]
                thresholding = row["thresholding"]
                key = row["sample_name"] + "-" + marker
                temp_dict.update({key:row["file_name"]})
                metadata.append(temp_dict)
                #channel_metadata = {row["sample_name"] : row["URL"] for row in reader} 
        print(metadata)
        return metadata, marker, thresholding

def preprocess_image(metadata, thresholding):
    preprocessed_metadata, thresholded_metadata = [], []
    for dictionary in metadata:
        temp_pre_dict, temp_tre_dict = {},{}
        for key, value in dictionary.items():
            #sample = key
            #file = value.replace("file:///", "")
            
            if value.endswith(".tif") or value.endswith(".tiff"):
                #Flag -1 returns the loaded image as it is
                #Image preprocessing
                print(value)
                image = cv2.imread(value,0)
                print(image)
                """imageBlurred = cv2.medianBlur(image, 3) 
                imageDenoised = cv2.fastNlMeansDenoising(imageBlurred,None,3,7,21)
                clahe = cv2.createCLAHE(clipLimit=0.6, tileGridSize=(8,8))
                imageClahe = clahe.apply(imageDenoised)"""

                #Write image to file
                sample = key.split("-")[0]
                image_name = key + "-Preprocessed.tiff"
                print(image_name)
                cv2.imwrite(os.path.join(os.getcwd(), image_name), image)
                print(f"writing {image_name} to : {os.path.join(os.getcwd(), image_name)}")
                
                temp_pre_dict.update({sample:os.path.join(os.getcwd(), image_name)})
                preprocessed_metadata.append(temp_pre_dict)
                
                ##############################################################################################
                #THreshold the image
                #sample_name = key
                #file = os.path.basename(value) #extracts the file name from the path
                #Using regex to find the label from the file name
                #label = re.search("(?<=-)\w+(?=-)", os.path.basename(value)).group(0)
                
                thresholding = thresholding.lower()
                print(thresholding)
                #Read the image 
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
                
                
                processed = morphology.remove_small_objects(thresholded_image, 4 ** 3)
                
                #processed = np.invert(processed)
                #thresholded_image = np.asarray(thresholded_image, dtype="uint8")
                #mask = np.zeros(image.shape[:2], dtype="uint8")
                #masked_image = cv2.bitwise_and(thresholded_image, mask)
                #print(masked_image)
                
                #Converting the image to 16 bit
                
                
                processed = img_as_uint(processed, force_copy = True)
                
     
                #cv2.imwrite(file+"_Morph", processed*255)
                
                
                #Write thresholded image to file
                image_name = image_name.replace("Preprocessed", "Thresholded")

                #thresholded_image = np.asarray(thresholded_image, dtype="uint8")
                io.imsave(os.path.join(os.getcwd(), image_name), processed)
                print(f"writing {image_name} to : {os.path.join(os.getcwd(), image_name)}")
                
                temp_tre_dict.update({key:os.path.join(os.getcwd(), image_name)})
                thresholded_metadata.append(temp_tre_dict)
                
                ################################################################################3
                
    return preprocessed_metadata, thresholded_metadata
     
#Preprocessed metadata file needs sample_name, label, file_name
def create_preprocessed_metadata_file(preprocessed_metadata, thresholded_metadata):
    #print("preprocessed : ", metadata)
    metadata = []
    for dic1, dic2 in zip(preprocessed_metadata, thresholded_metadata):

        
        for (key1, value1), (key2, value2) in zip(dic1.items(), dic2.items()):
            sample_name = key1
            file = os.path.basename(value1) #extracts the file name from the path
            #Using regex to find the label from the file name
            label = re.search("(?<=-)\w+(?=-)", file).group(0)
            file_name1, file_name2 = value1,value2
            metadata.append({"sample_name":sample_name, "label":label, "file_name":file_name1, "file_name2": file_name2} )
    
    print("Preprocessed_metadata: ", metadata)
    return metadata
            
if __name__ == "__main__":
    sample_name, input_metadata_file, output_path, output_metadata_file = get_arguments()
    print("______________________________________--")
    print(sample_name)
    print(output_metadata_file)
    metadata, marker,thresholding = parse_metadata(input_metadata_file, sample_name)
    
    preprocessed_metadata, thresholded_metadata = preprocess_image(metadata, thresholding)
    preprocessed_metadata_file = create_preprocessed_metadata_file(preprocessed_metadata, thresholded_metadata)
    #tiff_metadata = output_tiffs(acquisition, single_tiff_path, sample_name, roi_name, channel_metadata)
    #output(metadata, output_path)
    #print(f"The selected sample name is: {sample_name}")
    print(f"Metadata file {output_metadata_file} is writed to {os.getcwd()}")
    with open(output_metadata_file, mode = 'w') as output_metadata:
        metadata_writer = csv.DictWriter(output_metadata, fieldnames = preprocessed_metadata_file[0].keys())
        metadata_writer.writeheader()
        metadata_writer.writerows(preprocessed_metadata_file)
