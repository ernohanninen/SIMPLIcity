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
Usage: python rgb_to_8bit.py <path_to_input_folder>

"""

import sys, os, cv2, random, shutil

def patches(dirPath):
    patch_size,count = 512, 0
    os.chdir(dirPath)
    patchDir = "../" + "patches"
    if os.path.exists(patchDir):
        shutil.rmtree(patchDir)
    os.mkdir(patchDir)
    #os.chdir("../preprocessed")
    print(dirPath)
    for file in os.listdir(dirPath):
        print(file)
        image = cv2.imread(file,0)
        while(True):
            row, column = image.shape
            x = random.randint(0,row-1)
            y = random.randint(0,column-1)
            element = image[x,y]
            if element < 230 and x + patch_size < row and y + patch_size < column:
                patch = image[x-256:x-256+patch_size, y-256:y-256+patch_size] 
                file = file.replace(".tiff", "") 
                cv2.imwrite(os.path.join("../patches/", f'{file}_patch{count}.tif'), patch)
                count += 1
                if count % 20==0:
                    break     
                     
if len(sys.argv) == 2:
    dirPath = sys.argv[1]
    patches(dirPath)
    
else:
    print("Error when starting the program")
    print("Usage: python image_preprocessing.py <path_to_input_folder>")       