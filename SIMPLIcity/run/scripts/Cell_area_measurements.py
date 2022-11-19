#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title: Cell_area_measurements.py
Date: 2022-10-20
Author: Erno Hänninen
Description:
   - This script can be used to measure co-expression between two cells or three cells
   - And also to measure the area in pixels of individual and co-expressing markers
List of functions:
    -    area_measurements, overlap, test_overlap, watershed_and_contour
List of "non standard" modules:
    -    cv2, numpy, skimage, scipy, numpy

Procedure:
   - Read the input arguments and order it to dictinaries
   - call area_measurement function which loops over the dictionaries
   - if cell type contains / it means we are looking for co-expression
        - read the images and corresponding masks, run watershed to distinguish the clumped cells before detecting contours
        - take intersection of between the contour images
        - test for overlap between two cells, if two cells overlap more than user specified fraction, we have a co-expression
        - draw the co-expressing cell to result image
        - in case we are looking for triple co-expression, we have an additional step which filters out cells that don't have triple overlap. Here output from the overlap() function is used, and then draws the contours to the final image
        - Call watershed_and_contour function to extract the clumped objects in the resulting imgae
        - count the foreground pixels and the cells from the resulting image.
    - if no "/" mark in cell type, count the pixels which are not background
        - The cell counts of individual cells are computed else where from the annotated_cells.csv file
    - Resulting values are stored to dictinary

"""
import sys,os, csv
import cv2 as cv
import numpy as np
import json
from skimage.segmentation import watershed
from scipy import ndimage 
from skimage.filters import threshold_otsu
from skimage import io


def area_measurements(cell_types, img_dict, co_expression_fraction, cell_type_dict):
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
                marker_list = []
                #go thru the cell list and use the cell to get the corresponding marker from cell_type_dict created from mask_metadata file
                #THis ensures both the marker and celllist are in same order before reading the images
                for c in cellList:
                    for key1, value1 in cell_type_dict.items():
                        if key1 == c and key1 not in marker_list:
                            marker_list.append(value1) 
                            break
               
                print(marker_list)
                
                #Read the images
                #If the input is cell1/cell2/cell3
                #This will read cell1 mask and overlay images
                overlay = cv.imread([x for x in img_dict[key][0]["overlays"] if x.split("-")[1] in cellList[0]][0], 0)
                mask = cv.imread([x for x in img_dict[key][1]["masks"] if x.split("-")[1] in marker_list[0]][0], -1)

                #Read cell2 mask and overlay images
                overlay2 = cv.imread([x for x in img_dict[key][0]["overlays"] if x.split("-")[1] in cellList[1]][0], 0)
                mask2 = cv.imread([x for x in img_dict[key][1]["masks"] if x.split("-")[1] in marker_list[1]][0], -1)

                #In case we are looking for triple overlap read the third image
                if len(cellList) == 3:
                    overlay3 = cv.imread([x for x in img_dict[key][0]["overlays"] if x.split("-")[1] in cellList[2]][0], 0)
                    mask3 = cv.imread([x for x in img_dict[key][1]["masks"] if x.split("-")[1] in marker_list[2]][0], -1)

                #This function uses watershed to find the border of the cells in thresholded image and the finds the contours
                def watershed_and_contour(overlay, mask):
                    #Perform otsu thresholding
                    thresh = threshold_otsu(overlay)
                    thresholded = overlay > thresh
                    
                    #run euclidean distance transform to get the distances for watershed alogrithm
                    distance = ndimage.distance_transform_edt(thresholded)
                    
                    #run watershed, the masked image from segmentation and the thresholded image from cell identification is used
                    labels = watershed(-distance, mask, mask=thresholded)
                    contour_img = np.zeros_like((mask), np.uint8) #Create a image where the contours are stored
                    contour_list = []
                    count = 0
                    #Loop over the lables returned by thresholded algorithm
                    for label in np.unique(labels):
                        if label == 0:
                            continue
                        count += 1
                        mask = np.zeros(overlay.shape, dtype="uint8") #Create image where the watershed label is stored
                        mask[labels == label] = 255 
                        
                        #Run findcontours algorithm
                        contours,hierarchy = cv.findContours(mask, cv.RETR_TREE, cv.CHAIN_APPROX_NONE)
                        contour_list.append(contours[0]) #Update the return list
                        cv.drawContours(contour_img, contours[0], -1, 255, 1) #Run draw contours, the contours are drawn to the image created above
                    
                    contour_img = np.where(contour_img>0,contour_img,overlay) #Fade the contour borders
                    return contour_img, contour_list #Return the contour image and the list
                    
                #run watershed and get contours for the first and second cell
                target_img, target_contours = watershed_and_contour(overlay, mask)
                comp_img, comp_contours = watershed_and_contour(overlay2, mask2)	
                
                if len(cellList)==2:  #If we are looking for double overlap           
                    intersection1 = cv.bitwise_and(target_img, comp_img) #Run intersection between these images
                    intersection1[intersection1 != 0] = 255 #Update the foreground color to white
    
                if len(cellList)==3: #If triple overlap
                    comp_img2, comp_contours2 = watershed_and_contour(overlay3, mask3) #run watershed and get contours for the third image
                    #if input is cell1/cell2/cell3
                    intersection1 = cv.bitwise_and(target_img, comp_img) #take intersection between cell1 and cell2
                    intersection2 = cv.bitwise_and(target_img, comp_img2) #take intersection between cell1 and cell3
                    intersection3 = cv.bitwise_and(comp_img, comp_img2) #take intersection between cell2 and cell3
                    #Update the color
                    intersection1[intersection1 != 0] = 255
                    intersection2[intersection2 != 0] = 255
                    intersection3[intersection3 != 0] = 255
                    #Store the intersections, contour lists and countour images to lists
                    intersection_list, contours_list, image_list = [intersection1, intersection2, intersection3],[target_contours, comp_contours, comp_contours2],[target_img, comp_img,comp_img2]
                    
                #Function which tests overlap of two cells
                #THis function takes the intersection image of the two images, and the target and comparison contours and thresholded image
                def overlap(intersection, target_img,target_contours, comp_img, comp_contours):
                    #Create result img
                    result_img = np.zeros_like(target_img)
                    
                    #Function which test if cell overlaps other more than user specified factor
                    def test_overlap(x,y,w,h, x2,y2,w2,h2):
                        #Take the locations
                        locations_comparison = np.where(comp_img[y2:y2+h2, x2:x2+w2]!=0)
                        #Test if overlap divided by cell area is bigger than user specified co expression fraction
                        #Return true if condition is met
                        if len(np.where(intersection[y2:y2+h2, x2:x2+w2])[0]) / len(comp_img[locations_comparison]) >= co_expression_fraction:
                            return True
                        return False

                    #Loop over the contours 
                    for cnt in target_contours:	
                        x,y,w,h = cv.boundingRect(cnt) #Get the locations
                            
                        if len(np.where(intersection[y:y+h, x:x+w]!=0)[0]) != 0: #Check that the contour overlaps with intersection
                            for cnt2 in comp_contours: #Loop over the comparison contours
                                x2,y2,w2,h2 = cv.boundingRect(cnt2) #get locations of comparison contours

                                #Recursive function, which tests for intersection between target and comparison
                                def ccw(A,B,C):
                                        return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])	
                                
                                #Function which calls the ccw function which tests for intersection
                                def contour_intersect(cnt, cnt2):    
                                    for i in range(len(cnt)-1):
                                        A = cnt[i][0]
                                        B = cnt[i+1][0]
                                        
                                        for j in range(len(cnt2)-1):
                                            C = cnt2[j][0]
                                            D = cnt2[j+1][0]
                                            
                                            if ccw(A,C,D) != ccw(B,C,D) and ccw(A,B,C) != ccw(A,B,D):
                                                ## If true, break loop earlier
                                                return True
                                    
                                    return False
                                
                                #Test that the comparison contour intersects with the intersection
                                if len(np.where(intersection[y2:y2+h2, x2:x2+w2]!=0)[0]) != 0:
                                    #Call's the function which test for intersection between two contours
                                    #The intersection function returns false for conoturs which is subset of other
                                    #pointPolygonTest revails the overlapping contours which are missed in contour_intersect function
                                    if contour_intersect(cnt,cnt2) or cv.pointPolygonTest(cnt,(int(cnt2[0][0][0]),int(cnt2[0][0][1])), False) >0:	
                                        if test_overlap(x,y,w,h,x2,y2,w2,h2) : #Call function which test wheter the function overlaps more then user specified factor
                                            cv.drawContours(result_img, [cnt], -1, 255, -1) #If true draw the contour
                    
                    return result_img #Return the img where the overlapping contours is drawed
                        
                if len(cellList) == 2:
                    #Calls the function which determines if cells overlap more than user specified fraction
                    result_img = overlap(intersection1,target_img,target_contours, comp_img, comp_contours)
                    #Write resulting img to file
                    img_name = key + "-" + cell.replace("/", "-") + "_double_positive.png"
                    print(img_name)
                    io.imsave(img_name, result_img)
                    	
                if len(cellList) == 3:
                    result_imgs = []	
                    #Cell expressing multiple markers such as cell1/cell2/cell3 needs to fulfil following requirement cell1/cell2, cell1/cell3 and cell2/cell3
                    #Hence we need to call the overlap function three times to get the overlapping cells
                    result_imgs.append(overlap(intersection_list[0], image_list[0], contours_list[0], image_list[1], contours_list[1]))
                    result_imgs.append(overlap(intersection_list[1], image_list[0], contours_list[0], image_list[2], contours_list[2]))
                    result_imgs.append(overlap(intersection_list[2], image_list[1], contours_list[1], image_list[2], contours_list[2]))
                    
                    #Initialize result img
                    result_img = np.zeros_like(target_img)
                    for cnt in target_contours:	#Loop over the contours (cell1)
                        temp_img = np.zeros_like(target_img) #Create temp img where the looped contour is drawed
                        cv.drawContours(temp_img, [cnt], -1, 255, -1)
                        
                        #Check that the contour in temp_img overlaps with all the images in result_imgs list and that the contour overlaps with intersection of cell2 and cell3
                        if len(np.where(result_imgs[0][np.where(temp_img!=0)])[0]) != 0 and len(np.where(result_imgs[1][np.where(temp_img!=0)])[0]) !=0  and len(np.where(result_imgs[2][np.where(temp_img!=0)])[0]) != 0 and len(np.where(intersection3[np.where(temp_img!=0)])[0]) !=0:                            
                            cv.drawContours(result_img, [cnt], -1, 255, -1)

                    #Write resulting img to file
                    img_name = cell.replace("/", "-") + "_triple_positive.png"
                    print(img_name)
                    io.imsave(img_name, result_img)
                
                #Get the pixel counts from these double/triple positive cells
                locations = np.where(result_img==255)
                pixel_dict[sample][cell].update({"pixel_counts":len(result_img[locations])}) #Use the indices to extract the pixels from the image, take the lenght and update to dictinary        
                
                #Utilize the watershed_and_contour function to get the final contour count
                result_cnt_img, result_contours = watershed_and_contour(result_img, mask)
                io.imsave(img_name, result_cnt_img)
                #Update the cell counts to dict
                pixel_dict[sample][cell].update({"cell_counts":len(result_contours)})     
                     
            else:
                #Loop thru the files and check if a filename contains the cell type
                for file in img_dict[key][0]["overlays"]:
                    if cell in file: #This file should be measured
                        image = cv.imread(file, 0) #Read the image as gray scale
                        #Returns the indices of elementes in array where the condition is met
                        locations = np.where(image == np.unique(image)[1])
                        print(len(image[locations])) #Get the elements using the indices and take the length
                        pixel_dict[sample][cell].update({"pixel_counts":len(image[locations])})  #Use the indices to extract the pixels from the image, take the length and update to dictionary                   
                        pixel_dict[sample][cell].update({"cell_counts":""}) #Cell count for cells expressing only one marker is set to ""
                        

    print(pixel_dict)
    #Write the dict to file in json format
    with open('Cell_area_measurements.json', 'w') as file:
        file.write(json.dumps(pixel_dict))
                    
                    
                    

if __name__ == "__main__":
    #Read the arguments
    overlay_images = sys.argv[1:int(((len(sys.argv)-3)/2)+1)] #Overlay images
    cell_masks = sys.argv[int(((len(sys.argv)-3)/2)+1):len(sys.argv)-3] #Mask images
    cell_masking_metadata = sys.argv[len(sys.argv)-3] 
    cell_types = sys.argv[len(sys.argv)-2]
    co_expression_fraction = float(sys.argv[len(sys.argv)-1])
    cell_masks.sort() #Sort the mask list by name
    overlay_images.sort() #Sort the image filename list
    
    overlay_files,mask_files, img_dict= [],[], {} #Initialize data structures
    previous_sample = "" #Variable where prvious sample is stored

    for i in range(len(overlay_images)): #Loop over the overlay_images list
        sample = overlay_images[i].split("-")[0] #Extract the sample name from image name
        
        #Add key to dict if not exists yet
        if sample not in img_dict.keys():
            img_dict[sample] = []
        #When  sample changes store the previous sample to the list and empty the file variables
        if sample != previous_sample and previous_sample != "": 
            print(i, len(overlay_files))
            img_dict[previous_sample].append({"overlays":overlay_files}) #For each sample this dictionary contains a list of images
            img_dict[previous_sample].append({"masks":mask_files}) #For each sample this dictionary contains a list of images
            overlay_files = [] 
            mask_files = []
        #Update the file variables
        overlay_files.append(overlay_images[i]) 
        mask_files.append(cell_masks[i])
            
        
        previous_sample = sample
    
    #Set the last value to dict if not added yet
    if len(img_dict[sample]) ==0:
        img_dict[sample].append({"overlays":overlay_files}) #For each sample this dictionary contains a list of images
        img_dict[sample].append({"masks":mask_files}) #For each sample this dictionary contains a list of images
        
        
    print(img_dict)
    
    cell_type_dict = {}
    #Get the marker corresponding to cell
    with open(cell_masking_metadata, "r") as file:     
        file.readline() #Reads the header line
        for line in file: #After header read line by line
            cell_type = line.split(",")[0]#Split the line and take the first argument from the list returned by split
            marker = line.split(",")[1] 
            cell_type_dict[cell_type] = marker #Update dict
    print(cell_type_dict)
    
    #Calling area_measurements function and change the cell_types string to list
    area_measurements(cell_types.split(","), img_dict, co_expression_fraction,cell_type_dict)
    
    
    
    