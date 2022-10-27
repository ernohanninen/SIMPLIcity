#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: rgb_to_8bit.py
Date: 2021-05-04
Author: Erno Hänninen
Description:
   
List of functions:
    -    convert_image
List of "non standard" modules:
    -    cv2 
Error handling:
    - Program starts when it is started with two arguments
Procedure:
Usage: python rgb_to_8bit.py <path_to_input_folder>
"""

import sys, os, cv2

def convert_image(dirPath):
    os.chdir(dirPath)
    for file in os.listdir(dirPath):
        if file.endswith(".tif") or file.endswith(".tiff"):
            #Flag -1 returns the loaded image as is
            image = cv2.imread(file,-1)
            print(image.shape)
            if len(image.shape) == 3:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
                print(image.shape)
                cv2.imwrite(file, image)
                
if len(sys.argv) == 2:
    dirPath = sys.argv[1]
    convert_image(dirPath)
    
else:
    print("Error when starting the program")
    print("Usage: python rgb_to_8bit.py <path_to_input_folder>")