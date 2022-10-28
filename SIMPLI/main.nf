"""
Source: https://github.com/ciccalab/SIMPLI/blob/master/main.nf

Orignal code is from SIMPLI github page

Updated by Erno Hänninen
Since 23 March 2022

The changes contains some external function calls and changed parameters
"""

nextflow.enable.dsl=2

script_folder = "$baseDir/run/scripts"

include {convert_metadata_to_cp4} from "$script_folder/workflows.nf"

include {convert_raw_data} from "$script_folder/workflows.nf"
include {normalize_images} from "$script_folder/workflows.nf"
include {preprocess_operetta_images} from "$script_folder/workflows.nf"
include {preprocess_images} from "$script_folder/workflows.nf"
include {measure_areas} from "$script_folder/workflows.nf"
include {cp_segment_cells} from "$script_folder/workflows.nf"
include {sd_segment_cells} from "$script_folder/workflows.nf"
include {identify_cell_types_mask} from "$script_folder/workflows.nf"
include {cluster_cells} from "$script_folder/workflows.nf"
include {threshold_expression} from "$script_folder/workflows.nf"
include {analyse_homotypic_interactions} from "$script_folder/workflows.nf"
include {calculate_heterotypic_distances} from "$script_folder/workflows.nf"
include {permute_heterotypic_interactions} from "$script_folder/workflows.nf"
include {visualize_areas} from "$script_folder/workflows.nf"
include {visualize_cell_types} from "$script_folder/workflows.nf"
include {visualize_cell_intensity} from "$script_folder/workflows.nf"
include {visualize_cell_clusters} from "$script_folder/workflows.nf"
include {visualize_cell_thresholds} from "$script_folder/workflows.nf"
include {visualize_homotypic_interactions} from "$script_folder/workflows.nf"
include {visualize_heterotypic_interactions} from "$script_folder/workflows.nf"
include {visualize_permuted_interactions} from "$script_folder/workflows.nf"
include {cell_area_measurements} from "$script_folder/workflows.nf"

workflow {
    
    //Sample names are collected from sample_metadata.csv file
    sample_names = channel.fromPath(params.sample_metadata_file).splitCsv(header: true).map{row -> row.sample_name}
    //This step is skipped when we are not using mass cytometry data
    if(params.raw_metadata_file && !params.skip_conversion){
        convert_raw_data(params.channel_metadata)       
    }    
    //This is the first step in our pipeline
    if((params.tiff_input_metadata_file || !params.skip_conversion) && !params.skip_normalization && !params.instrument_operetta){
        normalization_metadata = (params.skip_conversion) ? channel.fromPath(params.tiff_input_metadata_file) :
			convert_raw_data.out.converted_tiff_metadata        
        normalize_images(sample_names, normalization_metadata)
    }    

    //Preprocess operetta images
    if(!params.skip_preprocessing && params.tiff_input_metadata_file && params.instrument_operetta){
        preprocessing_metadata = (params.skip_conversion) ? channel.fromPath(params.tiff_input_metadata_file) :
			convert_raw_data.out.converted_tiff_metadata
        preprocess_operetta_images(sample_names, preprocessing_metadata)
    }
    //Preprocess leica images
    if(!params.skip_preprocessing && !params.instrument_operetta){
        //WITH our settings this is executed
        if(!params.skip_normalization){
            //The original input file
            //preprocessing_metadata = normalize_images.out.cp4_normalized_tiff_metadata_by_sample
            //In our case we don't need the cellprofiler compatible format
            preprocessing_metadata = normalize_images.out.normalized_tiff_metadata_by_sample

        }
        else if(params.skip_normalization && !params.skip_conversion){
            convert_metadata_to_cp4("-cp4_metadata.csv", convert_raw_data.out.converted_tiff_metadata.collect()) 
            preprocessing_metadata = convert_metadata_to_cp4.out.cp4_metadata.flatten()
        }    
        else{
            metadata_to_convert = channel.fromPath(params.normalized_metadata_file)
            convert_metadata_to_cp4("-cp4_metadata.csv", metadata_to_convert) 
            preprocessing_metadata = convert_metadata_to_cp4.out.cp4_metadata.flatten()
        }
        preprocessing_metadata = preprocessing_metadata
            .map{ file ->
                def key = file.name.toString().tokenize('-').get(0)
                return tuple(key, file)
            }
            .groupTuple()
        preprocess_images(preprocessing_metadata) 
    }    
    if(!params.skip_area){
        //Preprocessing for other images
        if(!params.skip_preprocessing && !params.instrument_operetta){
            area_measurement_metadata = preprocess_images.out.preprocessed_tiff_metadata
        }    
        //Preprocessing for operetta images
        else if(!params.skip_preprocessing && params.instrument_operetta){
            area_measurement_metadata = preprocess_operetta_images.out.preprocessed_tiff_metadata
        }   
        else{
            area_measurement_metadata = params.preprocessed_metadata_file
        }
        measure_areas(area_measurement_metadata, params.area_measurements_metadata)
    }    
    if(!params.skip_cp_segmentation | !params.skip_sd_segmentation){
        if(!params.skip_preprocessing && !params.instrument_operetta)
            segmentation_metadata = preprocess_images.out.preprocessed_tiff_metadata_by_sample
        else if(!params.skip_preprocessing && params.instrument_operetta)
            segmentation_metadata = preprocess_operetta_images.out.preprocessed_tiff_metadata_by_sample
        else{
            convert_metadata_to_cp4("-cp4_metadata.csv", params.preprocessed_metadata_file) 
            segmentation_metadata = convert_metadata_to_cp4.out.cp4_metadata
        }
        segmentation_metadata = segmentation_metadata.flatten()
            .map { file ->
                def key = file.name.toString().tokenize('-').get(0)
                return tuple(key, file)
             }
            .groupTuple()
        if(!params.skip_cp_segmentation){
			cp_segment_cells(segmentation_metadata)
		}
        if(!params.skip_sd_segmentation){
			sd_segment_cells(segmentation_metadata, params.sd_labels_to_segment, params.sd_model_name,
				params.sd_model_path, params.sd_prob_thresh, params.sd_nms_thresh)
		}
    }    
    if(!params.skip_cell_type_identification){
        if(!params.skip_cp_segmentation & (params.skip_sd_segmentation | params.cell_source == "CellProfiler4")){
            unannotated_cells = cp_segment_cells.out.unannotated_cell_data
            cell_mask_metadata = cp_segment_cells.out.cell_mask_metadata
        }    
        if(!params.skip_sd_segmentation & (params.skip_cp_segmentation | params.cell_source == "StarDist")){
            //unannotated_cells = sd_segment_cells.out.unannotated_cell_data
            unannotated_cells = sd_segment_cells.out.unannotated_cell_data
            cell_mask_metadata = sd_segment_cells.out.cell_mask_metadata
        }    
		if(params.skip_cp_segmentation && params.skip_sd_segmentation){
            unannotated_cells = params.single_cell_data_file
            cell_mask_metadata = params.single_cell_masks_metadata
        } 
        //The image metadata is derived from different place depending of the preprocessing executed
        if(!params.skip_preprocessing && !params.instrument_operetta)
            image_metadata = preprocess_images.out.preprocessed_tiff_metadata
        else if(!params.skip_preprocessing && params.instrument_operetta)
            image_metadata = preprocess_operetta_images.out.preprocessed_tiff_metadata
        else{
            image_metadata = params.preprocessed_metadata_file
        }
        identify_cell_types_mask(unannotated_cells, params.cell_masking_metadata,
            image_metadata, cell_mask_metadata)
        annotated_cell_data = identify_cell_types_mask.out.annotated_cell_data
    }  
      
    
    if(!params.skip_cell_thresholding){
        if(!params.skip_cell_type_identification)
            annotated_cells = annotated_cell_data 
        else{
            annotated_cells = params.annotated_cell_data_file
        }
        threshold_expression(annotated_cells, params.cell_thresholding_metadata)
    }    

    if(!params.skip_cell_clustering){
        if(!params.skip_cell_type_identification)
            annotated_cells = annotated_cell_data 
        else{
            annotated_cells = params.annotated_cell_data_file
        }
        annotated_cells.subscribe { print "cells (printed from: main) : " + it }
        channel.fromPath(params.cell_clustering_metadata).subscribe { print "metadata (printed from: main) : " + it }
        clustering_metadata = channel.fromPath(params.cell_clustering_metadata)
            .splitCsv(header:true)
            .map{row -> tuple(row.cell_type, row.clustering_markers, row.clustering_resolutions)}
            //.filter{!it.contains("NA")}
        clustering_metadata.subscribe { print "metadata (printed from: main) : " + it }
        
        cluster_cells(annotated_cells, clustering_metadata, params.sample_metadata_file)

    }

    coord_selecter_map = [
        "identification": (params.skip_cell_type_identification ? params.annotated_cell_data_file :
            identify_cell_types_mask.out.annotated_cell_data),
        "clustering": (params.skip_cell_clustering ? params.clustered_cell_data_file :
            cluster_cells.out.clustered_cell_data),
        "thresholding": (params.skip_cell_thresholding ? params.thresholded_cell_data_file :
            threshold_expression.out.thresholded_cell_data)
            ].withDefault{ key -> key}

    if(!params.skip_homotypic_interactions){
        homotypic_metadata = channel.fromPath(params.homotypic_interactions_metadata)
            .splitCsv(header:true)
            .map{row -> tuple(
                coord_selecter_map[row.cell_file].getClass() == String ? coord_selecter_map[row.cell_file] : 
                    coord_selecter_map[row.cell_file]?.get(),
                row.cell_type_column,
                row.cell_type_to_cluster,
                row.reachability_distance,
                row.min_cells)}
            .filter{!it.contains("NA")}
        analyse_homotypic_interactions(homotypic_metadata)
    }
    
    if(!params.skip_heterotypic_interactions){
        heterotypic_metadata = channel.fromPath(params.heterotypic_interactions_metadata)
            .splitCsv(header:true)
            .map{row -> tuple(
                coord_selecter_map[row.cell_file1].getClass() == String ? coord_selecter_map[row.cell_file1] :
                    coord_selecter_map[row.cell_file1]?.get(),
				row.cell_type_column1,
				row.cell_type1,
				coord_selecter_map[row.cell_file2].getClass() == String ? coord_selecter_map[row.cell_file2] :
                    coord_selecter_map[row.cell_file2]?.get(),
				row.cell_type_column2,
				row.cell_type2)}
        calculate_heterotypic_distances(heterotypic_metadata, params.heterotypic_interactions_metadata)
    }

    if(!params.skip_permuted_interactions){
        if(!params.skip_heterotypic_interactions){
            heterotypic_interactions_file = calculate_heterotypic_distances.out.collected_heterotypic_interactions
        }
        else{
            heterotypic_interactions_file = params.heterotypic_interactions_file
        }
        permute_heterotypic_interactions(params.permutations, heterotypic_interactions_file,
            params.heterotypic_interactions_metadata, params.sample_metadata_file)
    }
  
    if(!params.skip_visualization){
        if(!params.skip_area_visualization){
            if(params.skip_area){
				area_measurements = params.area_measurements_file
			}
            if(!params.skip_area){
				area_measurements = measure_areas.out.area_measurements
            }
            visualize_areas(area_measurements, params.sample_metadata_file)
        }
        if(!params.skip_type_visualization){
			if(!params.skip_cp_segmentation & (params.skip_sd_segmentation | params.cell_source == "CellProfiler4")){
				cell_masks = cp_segment_cells.out.cell_mask_tiffs.collect()
			}    
			if(!params.skip_sd_segmentation & (params.skip_cp_segmentation | params.cell_source == "StarDist")){
				cell_masks = sd_segment_cells.out.cell_mask_tiffs.collect()
			}    
            if(params.skip_cp_segmentation && params.skip_sd_segmentation){
                cell_masks = channel.fromPath(params.single_cell_masks_metadata)
                    .splitCsv(header:true)
                    .map{row -> row.file_name}
                    .collect() 
            }
            if(!params.skip_cell_type_identification){
                cell_types = annotated_cell_data 
            }
            if(params.skip_cell_type_identification){
                cell_types = params.annotated_cell_data_file
            }
            visualize_cell_types(cell_types,
                params.sample_metadata_file, params.cell_masking_metadata, cell_masks)
            cell_overlays = visualize_cell_types.out.cell_type_overlaysPdf.collect()
            cell_overlays_unassigned_removed = visualize_cell_types.out.cell_type_overlays_unassigned_removed
            //For operetta images it is possible to execute a pixel intenisty visualization of segmented objects
            if(!params.skip_intensity_visualization && params.instrument_operetta){      
                preprocessed_images = preprocess_operetta_images.out.preprocessed_tiff_images.collect()
                visualize_cell_intensity(cell_overlays, preprocessed_images, params.sample_metadata_file, params.cell_masking_metadata, params.cell_type_for_intensity)
            }
        }

        if(!params.skip_cluster_visualization){
            if(!params.skip_cell_clustering){
                clustered_cell_file = cluster_cells.out.clustered_cell_data
            }
            else{
                clustered_cell_file = params.clustered_cell_data_file
            }
            clustering_metadata = channel.fromPath(params.cell_clustering_metadata)
                .splitCsv(header:true)
                .map{row -> tuple(row.cell_type, row.clustering_markers, row.clustering_resolutions)}
                //.filter{!it.contains("NA")}
            visualize_cell_clusters(clustering_metadata, clustered_cell_file, params.sample_metadata_file)
        }
        if(!params.skip_thresholding_visualization){
            if(!params.skip_cell_thresholding){
                thresholded_cell_file = threshold_expression.out.thresholded_cell_data
            }
            else{
                thresholded_cell_file = params.thresholded_cell_data_file
            }
			if(!params.skip_cp_segmentation & (params.skip_sd_segmentation | params.cell_source == "CellProfiler4")){
				cell_masks = cp_segment_cells.out.cell_mask_tiffs.collect()
			}    
			if(!params.skip_sd_segmentation & (params.skip_cp_segmentation | params.cell_source == "StarDist")){
				cell_masks = sd_segment_cells.out.cell_mask_tiffs.collect()
			}    
            if(params.skip_cp_segmentation && params.skip_sd_segmentation){
                cell_masks = channel.fromPath(params.single_cell_masks_metadata)
                    .splitCsv(header:true)
                    .map{row -> row.file_name}
                    .collect() 
            }
            visualize_cell_thresholds(thresholded_cell_file, params.sample_metadata_file,
				params.cell_thresholding_metadata, cell_masks)
        }
        if(!params.skip_homotypic_visualization){
            if(!params.skip_homotypic_interactions){
                homotypic_interactions_file = analyse_homotypic_interactions.out.collected_homotypic_interactions
            }
            else{
                homotypic_interactions_file = params.homotypic_interactions_file
            }
			if(!params.skip_cp_segmentation & (params.skip_sd_segmentation | params.cell_source == "CellProfiler4")){
				cell_masks = cp_segment_cells.out.cell_mask_tiffs.collect()
			}    
			if(!params.skip_sd_segmentation & (params.skip_cp_segmentation | params.cell_source == "StarDist")){
				cell_masks = sd_segment_cells.out.cell_mask_tiffs.collect()
			}    
            if(params.skip_cp_segmentation && params.skip_sd_segmentation){
                cell_masks = channel.fromPath(params.single_cell_masks_metadata)
                    .splitCsv(header:true)
                    .map{row -> row.file_name}
                    .collect() 
            }
            visualize_homotypic_interactions(homotypic_interactions_file,
				params.homotypic_interactions_metadata, cell_masks)
        }
        if(!params.skip_heterotypic_visualization){
            if(!params.skip_heterotypic_interactions){
                heterotypic_interactions_file = calculate_heterotypic_distances.out.collected_heterotypic_interactions
            }
            else{
                heterotypic_interactions_file = params.heterotypic_interactions_file
            }
			visualize_heterotypic_interactions(heterotypic_interactions_file,
				params.heterotypic_interactions_metadata, params.sample_metadata_file)
        }
        if(!params.skip_permuted_visualization){
            if(!params.skip_permuted_interactions){
                shuffled_interactions_file = permute_heterotypic_interactions.out.permuted_heterotypic_interactions
            }
            else{
                shuffled_interactions_file = params.shuffled_interactions_file
            }
            if(!params.skip_heterotypic_interactions){
                heterotypic_interactions_file = calculate_heterotypic_distances.out.collected_heterotypic_interactions
            }
            else{
                heterotypic_interactions_file = params.heterotypic_interactions_file
            }
			visualize_permuted_interactions(heterotypic_interactions_file, shuffled_interactions_file,
				params.heterotypic_interactions_metadata, params.sample_metadata_file)
        }
        //Measure pixel areas for segmented cell types
        if(!params.skip_cell_area_measurements){
            //annotated_cell_data = identify_cell_types_mask.out.annotated_cell_data
            cell_area_measurements(annotated_cell_data, cell_overlays_unassigned_removed, params.cell_masking_metadata, params.cell_type_to_measure_area)
        }  
    }

}
