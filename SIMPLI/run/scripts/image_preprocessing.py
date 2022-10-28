#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: image_preprocessing.py
Date: 2021-05-04
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
import sys, os, re
import argparse, csv
import cv2
#from skimage.filters import threshold_yen
from skimage import io
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from skimage.util import img_as_uint

from skimage.filters import threshold_minimum
from skimage.filters import threshold_otsu
from skimage.filters import threshold_sauvola
from skimage.filters import threshold_yen

def get_arguments():
    parser = argparse.ArgumentParser(description = "Performs image preprocessing")
    parser.add_argument("sample_name", help = "name of the sample")
    parser.add_argument("normalized_metadata_file", help = "path to a .csv file with the input metadata")
    parser.add_argument("output_path", help = "path to a output folder")
    parser.add_argument("output_metadata_file", help = "path to a .csv file with the output metadata")
    #parser.add_argument("")
    args = parser.parse_args()
    return args.sample_name, args.normalized_metadata_file, args.output_path, args.output_metadata_file

#Extract data from sample-normalized_tiff_metadata.csv file
def parse_normalized_metadata(file_name):
    #Open file for reading
    with open(file_name) as metadata_file:
        reader = csv.DictReader(metadata_file)
        normalized_metadata, marker=[], ""

        print("READER: ", reader)
        for row in reader:
            temp_dict={}
            print("ROW: ", row)
            marker = row["marker"]
            thresholding = row["thresholding"]
            temp_dict.update({row["sample_name"]:row["URL"]})
            normalized_metadata.append(temp_dict)
            #channel_metadata = {row["sample_name"] : row["URL"] for row in reader} 
        print(normalized_metadata)
        return normalized_metadata, marker, thresholding

def preprocess_image(metadata, marker, thresholding):
    preprocessed_metadata, thresholded_metadata = [], []
    for dictionary in metadata:
        temp_pre_dict, temp_tre_dict = {},{}
        for key, value in dictionary.items():
            sample = key
            file = value.replace("file:///", "")
            
            if file.endswith(".tif") or file.endswith(".tiff"):
                #Flag -1 returns the loaded image as it is
                #Image preprocessing
                image = cv2.imread(file,0)
                imageBlurred = cv2.medianBlur(image, 3) 
                imageDenoised = cv2.fastNlMeansDenoising(imageBlurred,None,3,7,21)
                clahe = cv2.createCLAHE(clipLimit=0.6, tileGridSize=(8,8))
                imageClahe = clahe.apply(imageDenoised)
            
                #Write image to file
                file = file.replace("normalized", "Preprocessed")
                print("image : ", file)
                print("working dir : ", os.getcwd())

                image_name = os.path.basename(value)
                image_name = image_name.replace("normalized", "Preprocessed")
                cv2.imwrite(os.path.join(os.getcwd(), image_name), imageClahe)
                print(f"writing {image_name} to : {os.path.join(os.getcwd(), image_name)}")
                
                temp_pre_dict.update({key:os.path.join(os.getcwd(), image_name)})
                preprocessed_metadata.append(temp_pre_dict)
                
                ##############################################################################################
                #THreshold the image
                #sample_name = key
                #file = os.path.basename(value) #extracts the file name from the path
                #Using regex to find the label from the file name
                #label = re.search("(?<=-)\w+(?=-)", os.path.basename(value)).group(0)
                
                print("___________________________", marker)
                #Read the image 
                if thresholding == "Minimum":
                    thresholded = threshold_minimum(imageClahe)
                    thresholded_image = imageClahe > thresholded
                
                elif thresholding == "Yen":
                    thresholded = threshold_yen(imageClahe)
                    thresholded_image = image > thresholded
                    
                elif thresholding == "Otsu":
                    thresholded = threshold_otsu(imageClahe)
                    thresholded_image = image > thresholded
                
                elif thresholding == "Sauvola":
                    thresholded = threshold_sauvola(imageClahe)
                    thresholded_image = image > thresholded
                
                
                thresholded_image = np.invert(thresholded_image)
                print(thresholded_image)
                print(np.size(thresholded_image) - np.count_nonzero(thresholded_image))                       
                print(np.size(thresholded_image))
                #thresholded_image = np.asarray(thresholded_image, dtype="uint8")
                #mask = np.zeros(image.shape[:2], dtype="uint8")
                #masked_image = cv2.bitwise_and(thresholded_image, mask)
                #print(masked_image)
                
                #Converting the image to 16 bit
                thresholded_image = img_as_uint(thresholded_image, force_copy = True)
                
                #Write thresholded image to file
                image_name = os.path.basename(value)
                image_name = image_name.replace("normalized", "Thresholded")

                #thresholded_image = np.asarray(thresholded_image, dtype="uint8")
                io.imsave(os.path.join(os.getcwd(), image_name), thresholded_image)
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
    sample_name, normalized_metadata_file, output_path, output_metadata_file = get_arguments()
    print("______________________________________--")
    print(output_metadata_file)
    metadata, marker,thresholding = parse_normalized_metadata(normalized_metadata_file)
    
    preprocessed_metadata, thresholded_metadata = preprocess_image(metadata, marker, thresholding)
    preprocessed_metadata_file = create_preprocessed_metadata_file(preprocessed_metadata, thresholded_metadata)
    #tiff_metadata = output_tiffs(acquisition, single_tiff_path, sample_name, roi_name, channel_metadata)
    #output(metadata, output_path)
    #print(f"The selected sample name is: {sample_name}")
    print(f"Metadata file {output_metadata_file} is writed to {os.getcwd()}")
    with open(output_metadata_file, mode = 'w') as output_metadata:
        metadata_writer = csv.DictWriter(output_metadata, fieldnames = preprocessed_metadata_file[0].keys())
        metadata_writer.writeheader()
        metadata_writer.writerows(preprocessed_metadata_file)
