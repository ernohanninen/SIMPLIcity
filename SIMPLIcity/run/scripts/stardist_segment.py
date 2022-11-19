#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Source: https://github.com/ciccalab/SIMPLI/blob/master/scripts/stardist_segment.nf

Orignal code is from SIMPLI github page

Updated by Erno Hänninen
Since 23 March 2022

THe change: instead of mergining single channel images segment them individually
"""
import sys
import os
from os.path import exists
import argparse
import csv
import numpy
import cv2
import tifffile
import skimage
from skimage import io
from functools import partial
from csbdeep.utils import normalize
from stardist import random_label_cmap, _draw_polygons, export_imagej_rois
from stardist.models import StarDist2D

def get_arguments():	
	"""
	Parses and checks command line arguments, and provides an help text.
	Assumes at 7 and returns 7 positional command line arguments:
		sample_name = Name of the sample
		tiff_metadata_file = Path to the tiff metadata
		labels = Labels of the images to use as input in the same order as it is assumed by the model (comma separated)
		model_name = Model to use for the segmentation (name of default model or name of a pretrained one)
		model_path = Path to the model (name of default model or path to a pretrained one)
		prob_thresh = Probability threshold
		nms_thresh =  Overlap threshold to be used for NMS 
		output_table_file = Path to the output table
		output_mask_file = Path to output the cell mask
	"""
	parser = argparse.ArgumentParser(description = "Performs 2D segmentation with stardist.")
	parser.add_argument("sample_name", help = "name of the sample")
	parser.add_argument("tiff_metadata_file", help = "path to the preprocessed image metadadata file")
	parser.add_argument("labels", help = "markers to include in the image on which the segmentation is performed")
	parser.add_argument("model_name", help = "model to use for the segmentation (name of default model or name of a pretrained one)")
	parser.add_argument("model_path", help = "path to the model (name of default model or path to a pretrained one)")
	parser.add_argument("prob_thresh", help = "probability threshold")
	parser.add_argument("nms_thresh", help = "overlap threshold to be used for NMS")
	parser.add_argument("output_table_file", help = "path to the file for the cell data output")
	parser.add_argument("output_mask_file", help = "path to the file for the cell mask output")
	args = parser.parse_args()
	return args.sample_name, args.tiff_metadata_file, args.labels, args.model_name, args.model_path, \
		args.prob_thresh, args.nms_thresh, args.output_table_file, args.output_mask_file
  
  

def parse_labels(label):
	"""
	Splits the labels "," separated string and returns it as a list.
	Also removes the "URL_" portion of the labels if present.
	"""
    
	return label.split(",")

def parse_tiff_metadata(file_name, sample):
	"""
	Parses The tiff metadata file. Assumes the file has an header with at least these columns:
		Metadata_sample_name = sample_name
		URL_* = URL to the tiff file with label *
	Returns a list of dicts, one dict per line of the metadata file, containing the values for the two columns.	
	"""
	with open(file_name) as metadata_file:
		reader = csv.DictReader(metadata_file)

		all_labels=[]
		for row in reader:
			if row["label"] not in all_labels:
				all_labels.append(row["label"])
		print(all_labels)
		
	with open(file_name) as metadata_file:
		reader = csv.DictReader(metadata_file)
		image_metadata = {}
		for row in reader:
			if row["sample_name"] != sample:
				continue
			if row["label"] in row["file_name"]:
				image_metadata.update({row["label"] : row["file_name"]})
		
	return image_metadata

def make_target_image(tiff_image_metadata, labels):
	"""
	Loads the tiff images with the pahts in files_to_load.
	Then, it puts them in a list in the same order as labels and converts it to a [X, Y, C] numpy array.
	Then images are normalized by scaling from 0 to 1
	"""
	filenames = [tiff_image_metadata[label] for label in labels]
	image = numpy.dstack(list(map(tifffile.imread, filenames))) #YXC
	image = normalize(image, 0, 100, axis = (0, 1))
	return numpy.moveaxis(image, 0, 1) #XYC

def make_target_image2(images, labels):
	"""
	Loads the tiff images with the pahts in files_to_load.
	Then, it puts them in a list in the same order as labels and converts it to a [X, Y, C] numpy array.
	Then images are normalized by scaling from 0 to 1
	"""
	image = numpy.dstack(images) #YXC
	image = normalize(image, 0, 100, axis = (0, 1))
	return numpy.moveaxis(image, 0, 1) #XYC


def load_model(model_to_load, model_path = "default"):
	"""
	Loads a pretrained model from:
		- stardist.models.StarDist2D
		- StarDist2D(config = None, name = "pretrained", basedir = model_to_load)
	"""
	if model_path == "default":
		return StarDist2D.from_pretrained(model_to_load)
	print("CUSTOM MODEL IS USED")
 
	return StarDist2D(None, name = model_to_load, basedir = model_path)
	#return StarDist2D.builder(model_path)
def predict(model_to_use, target_image, prob, nms):
	"""
	Predicts the cells and returns the cell mask
	"""
	labels, details = model_to_use.predict_instances(target_image, axes = "XYC", prob_thresh = prob, nms_thresh = nms) #YXC
	return  numpy.moveaxis(labels, 0, 1) #XYC 

def extract_features(cell_label_image, tiff_image_metadata, sample, counter, marker):
	"""
	Extracts the cell features from the cell label image and renames them to make them
	the same as CellProfiler4 measurements
	"""
	all_labels, filenames = zip(*tiff_image_metadata.items())
	image_to_measure = numpy.dstack(list(map(tifffile.imread, filenames))) #YXC
	image_to_measure = normalize(image_to_measure, 1, 100, axis = (0, 1))
	image_to_measure = numpy.moveaxis(image_to_measure, 0, 1) #XYC
	measured_props = skimage.measure.regionprops(cell_label_image, image_to_measure)
	feature_list = []
	for prop in measured_props:
		counter += 1
		maxs = {"Intensity_MaxIntensity_" + label : prop["max_intensity"][index] for index, label in enumerate(all_labels)}
		means = {"Intensity_MeanIntensity_" + label : prop["mean_intensity"][index] for index, label in enumerate(all_labels)}
		mins = {"Intensity_MinIntensity_" + label : prop["min_intensity"][index] for index, label in enumerate(all_labels)}
		x = {"Location_Center_X" : prop["centroid"][0]}
		y = {"Location_Center_Y" : prop["centroid"][1]}
		single_features = {
				"label"					: "ObjectNumber",
				"area"					: "AreaShape_Area",
				"bbox_area"				: "AreaShape_BoundingBoxArea",
				"convex_area"			: "AreaShape_ConvexArea",
				"eccentricity"			: "AreaShape_Eccentricity",
				"equivalent_diameter"	: "AreaShape_EquivalentDiameter",
				"euler_number"			: "AreaShape_EulerNumber",
				"extent"				: "AreaShape_Extent",
				"feret_diameter_max"	: "AreaShape_MaxFeretDiameter",
				"filled_area"			: "AreaShape_FilledArea",
				"major_axis_length"		: "AreaShape_FilledArea",
				"minor_axis_length"		: "AreaShape_MinorAxisLength",
				"orientation"			: "AreaShape_Orientation",
				"perimeter"				: "AreaShape_Perimeter",
				"solidity"				: "AreaShape_Solidity"}
  
		single_feature_prop = {cp_name : prop[feature] for feature, cp_name in single_features.items()}
		features = {"Metadata_sample_name" : sample+"-"+marker, **single_feature_prop, **means, **maxs, **mins, **x, **y}
		feature_list.append(features)
	return feature_list, counter

def write_cells(cell_features, cell_table_filename):
	"""
	Writes out the cell features as a .csv file	
	"""
	with open(cell_table_filename, mode = 'w') as output_table:
		cell_writer = csv.DictWriter(output_table, fieldnames = cell_features[0].keys())
		cell_writer.writeheader()
		cell_writer.writerows(cell_features)

def write_mask(cell_mask, cell_mask_filename):
	"""
	Converts the cell mask to uint16 and writes it out as a tiff file
	"""
	cell_mask = cell_mask.astype("uint16")
	cell_mask = numpy.moveaxis(cell_mask, 0, 1) #YXC
	tifffile.imwrite(cell_mask_filename, cell_mask) #XYC

if __name__ == "__main__":
    
	sample_name, tiff_metadata_file, label_str, model_name, model_path, \
		prob_thresh, nms_thresh, output_table_file, output_mask_file = get_arguments()
	print(f"The selected sample name is: {sample_name}")

	try:
		prob_thresh = float(prob_thresh)
		print(f"The selected probability threshold is: {prob_thresh}")
	except ValueError:
		prob_thresh = None
		print(f"Using the model's default value for the probability threshold")

	try:
		nms_thresh = float(nms_thresh)
		print(f"The selected NMS threshold is: {nms_thresh}")
	except ValueError:
		nms_thresh = None
		print(f"Using the model's default value for NMS")

	if not os.path.isfile(tiff_metadata_file):
		print(f'The tiff metadata file path specified does not exist: {tiff_metadata_file}')
		sys.exit(1)

	print(f"Parsing metadata file: {tiff_metadata_file}")
	image_metadata = parse_tiff_metadata(tiff_metadata_file, sample_name)
	print(f"The files to be loaded are: {image_metadata}")
	
	labels = parse_labels(label_str)
	print(f"The parsed labels are: {labels}")
	
	print(f"Loading model: {model_name} {model_path}")
	model = load_model(model_name, model_path)
	#model = load_model(model_path)
	print(f"Model Loaded.")

    


	if model.config.n_channel_in == 1:
		output_file_csv =output_table_file
		output_file_tiff =output_mask_file
		counter = 0
		for key, value in image_metadata.items():
			print(f"Making the target image: ", value)		
			segmentation_image = make_target_image({key:value}, [key])
			print(f"Target image done.")
			print(f"segmentation start.")
			label_image = predict(model, segmentation_image, prob_thresh, nms_thresh)
			print(f"segmentation end.")
			print(f"Feature extraction start.")
			features, counter = extract_features(label_image, image_metadata, sample_name, counter, key)
			print(f"Feature extraction end.")
			sample, extension = output_file_csv.split("-", 1)[0:2]    
			output_table_file = sample + "-" + key + "-" + extension
			sample, extension = output_file_tiff.split("-", 1)[0:2]
			output_mask_file =  sample + "-" + key + "-" + extension
			print(f"Write cell table start: ", output_table_file)	
			write_cells(features, output_table_file)
			print(f"Write cell table end.")
			print(f"Write cell mask start: ", output_mask_file)
			write_mask(label_image, output_mask_file)
			print(f"Write cell mask end.")
		if len(image_metadata) == 2:
			#Read the tiff files
			filenames = [image_metadata[label] for label in labels]
			images = list(map(tifffile.imread,filenames))
			images.append(numpy.zeros_like(images[1])) #create artificial numpy array 
			merged_channels = make_target_image2(images, labels) #use these two tiffs and the artificial array to merge one color image
			merged_channels = numpy.flipud(merged_channels) #rotate it so that is in right way
			merged_channels = numpy.rot90(merged_channels, 3)
			merged_file_name_png_1 = sample_name + "-merged_1.png" #Store the output in different formats
			merged_file_name_png_2 = sample_name + "-merged_2.png"
			merged_file_name_tiff = sample_name + "-merged.tif"
		if len(image_metadata) == 3:
			#Same procedure as above, but without the artificial array, as now we have three image channels
			filenames = [image_metadata[label] for label in labels]
			images = list(map(tifffile.imread,filenames))
			merged_channels = make_target_image2(images, labels)
			merged_channels = numpy.flipud(merged_channels)
			merged_channels = numpy.rot90(merged_channels, 3)
			merged_file_name_png_1 = sample_name + "-merged_1.png"
			merged_file_name_png_2 = sample_name + "-merged_2.png"
			merged_file_name_tiff = sample_name + "-merged.tif"
   
		#Save the merged image to file
		if len(image_metadata) > 1:
			io.imsave(merged_file_name_png_1, merged_channels)
			cv2.imwrite(merged_file_name_png_2, merged_channels)
			tifffile.imwrite(merged_file_name_tiff, merged_channels) #XYC
		
	#Not tested
	else: 
		print(f"Making the target image.")
		segmentation_image = make_target_image(image_metadata, labels)
		print(f"Target image done.")
	
		print(f"segmentation start.")
		label_image = predict(model, segmentation_image, prob_thresh, nms_thresh)
		print(f"segmentation end.")
		
		print(f"Feature extraction start.")
		features = extract_features(label_image, image_metadata, sample_name)
		print(f"Feature extraction end.")
		
		print(f"Write cell table start.")
		write_cells(features, output_table_file)
		print(f"Write cell table end.")

		print(f"Write cell mask start.")
		write_mask(label_image, output_mask_file)
		print(f"Write cell mask end.")

