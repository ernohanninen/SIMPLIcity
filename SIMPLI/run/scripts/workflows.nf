"""
Source: https://github.com/ciccalab/SIMPLI/blob/master/scripts/workflows.nf

Orignal code is from SIMPLI github page

Updated by Erno Hänninen
Since 23 March 2022

The changes contains some added workflows and changed parameters
"""


nextflow.enable.dsl=2

script_folder = "$baseDir/run/scripts"

//Get processes from processes.nf file
include {cp4_format_convert} from "$script_folder/processes.nf"
include {convert_raw_data_to_tiffs} from "$script_folder/processes.nf"
include {collect_raw_tiff_metadata} from "$script_folder/processes.nf"
include {normalize_tiffs} from "$script_folder/processes.nf"
include {collect_normalized_tiff_metadata} from "$script_folder/processes.nf"
include {operetta_image_preprocessing} from "$script_folder/processes.nf"
include {image_preprocessing} from "$script_folder/processes.nf"
include {process_preprocessed_metadata} from "$script_folder/processes.nf"
include {measure_positive_areas} from "$script_folder/processes.nf"
include {area_visualization} from "$script_folder/processes.nf"
include {cp_cell_segmentation} from "$script_folder/processes.nf"
include {sd_cell_segmentation} from "$script_folder/processes.nf"
include {collect_single_cell_data} from "$script_folder/processes.nf"
include {cell_type_identification_mask} from "$script_folder/processes.nf"
include {cell_type_visualization} from "$script_folder/processes.nf"
include {cell_intensity_visualization} from "$script_folder/processes.nf"
include {cell_clustering} from "$script_folder/processes.nf"
include {collect_clustering_data} from "$script_folder/processes.nf"
include {cell_cluster_visualization} from "$script_folder/processes.nf"
include {threshold_cells} from "$script_folder/processes.nf"
include {cell_threshold_visualization} from "$script_folder/processes.nf"
include {homotypic_interaction_analysis} from "$script_folder/processes.nf"
include {collect_homotypic_interactions} from "$script_folder/processes.nf"
include {homotypic_interaction_visualization} from "$script_folder/processes.nf"
include{get_heterotypic_distances} from "$script_folder/processes.nf"
include{collect_heterotypic_distances} from "$script_folder/processes.nf"
include{permute_heterotypic_distances} from "$script_folder/processes.nf"
include{heterotypic_interaction_visualization} from "$script_folder/processes.nf"
include{permuted_interaction_visualization} from "$script_folder/processes.nf"
include{compute_cell_area} from "$script_folder/processes.nf"

workflow convert_metadata_to_cp4{
    take:
        output_suffix
        metadata_to_convert
    main:
        cp4_format_convert(output_suffix, metadata_to_convert)
    emit:
        cp4_metadata = cp4_format_convert.out.cp4_metadata
}

workflow convert_raw_data{
    take:
		channel_metadata_path
    main:
        raw_file_metadata = channel.fromPath(params.raw_metadata_file)
            .splitCsv(header:true)
            .map{row -> tuple(row.sample_name, row.roi_name, file(row.file_name))}
        convert_raw_data_to_tiffs(raw_file_metadata, channel_metadata_path)
        collect_raw_tiff_metadata(convert_raw_data_to_tiffs.out.raw_tiff_metadata_by_sample.collect())
    emit:
        tiff_images = convert_raw_data_to_tiffs.out.raw_tiff_images
        converted_tiff_metadata = collect_raw_tiff_metadata.out.converted_tiff_metadata
}

workflow normalize_images{
    take:
        //These sample names are from sample metadata file
        sample_names
        normalization_metadata_file
    main:
        //sample_names.subscribe { print "sample (printed from: workflow normalize_images) : " + it }
        normalize_tiffs(sample_names, normalization_metadata_file)
        collect_normalized_tiff_metadata(normalize_tiffs.out.normalized_tiff_metadata_by_sample.collect())
    emit:
        normalized_tiff_images = normalize_tiffs.out.normalized_tiff_images
        normalized_tiff_metadata = collect_normalized_tiff_metadata.out.normalized_tiff_metadata
        cp4_normalized_tiff_metadata_by_sample = normalize_tiffs.out.cp4_normalized_tiff_metadata_by_sample
        normalized_tiff_metadata_by_sample = normalize_tiffs.out.normalized_tiff_metadata_by_sample
}

//Workflow for operetta images
workflow preprocess_operetta_images{
    take:
        sample_names
        preprocessing_metadata_files
    main:
        //preprocessing_metadata_files.subscribe { print "preprocessing metadata_File (printed from: workflow preprocess_images) : " + it }
        operetta_image_preprocessing(sample_names, preprocessing_metadata_files)
        process_preprocessed_metadata(operetta_image_preprocessing.out.preprocessed_tiff_metadata_by_sample.collect())
    emit:
        preprocessed_tiff_images = operetta_image_preprocessing.out.preprocessed_tiff_files
        //thresholded_tiff_images = image_preprocessing.out.thresholded_tiff_files
        preprocessed_tiff_metadata_by_sample = operetta_image_preprocessing.out.preprocessed_tiff_metadata_by_sample
        preprocessed_tiff_metadata = process_preprocessed_metadata.out.preprocessed_tiff_metadata
        cp4_preprocessed_tiff_metadata_by_sample = process_preprocessed_metadata.out.cp4_preprocessed_tiff_metadata_by_sample
}

workflow preprocess_images{
    take:   
        preprocessing_metadata_files
    main:
        //preprocessing_metadata_files.subscribe { print "preprocessing metadata_File (printed from: workflow preprocess_images) : " + it }
        image_preprocessing(preprocessing_metadata_files)
        process_preprocessed_metadata(image_preprocessing.out.preprocessed_tiff_metadata_by_sample.collect())
    emit:
        preprocessed_tiff_images = image_preprocessing.out.preprocessed_tiff_files
        //thresholded_tiff_images = image_preprocessing.out.thresholded_tiff_files
        preprocessed_tiff_metadata_by_sample = image_preprocessing.out.preprocessed_tiff_metadata_by_sample
        preprocessed_tiff_metadata = process_preprocessed_metadata.out.preprocessed_tiff_metadata
        cp4_preprocessed_tiff_metadata_by_sample = process_preprocessed_metadata.out.cp4_preprocessed_tiff_metadata_by_sample
}

workflow measure_areas{
    take:
        image_metadata_file
        area_metadata
    main:
        measure_positive_areas(image_metadata_file, area_metadata)
    emit:
        area_measurements = measure_positive_areas.out.area_measurements
}

workflow cp_segment_cells{
    take:
        segmentation_metadata_files
    main:
        cp_cell_segmentation(segmentation_metadata_files)
        collect_single_cell_data(cp_cell_segmentation.out.cell_data_csv_by_sample.collect(),
            cp_cell_segmentation.out.cell_mask_tiffs.collect(), "CellProfiler4")
    emit:
        cell_mask_tiffs = cp_cell_segmentation.out.cell_mask_tiffs
        unannotated_cell_data = collect_single_cell_data.out.unannotated_cell_data
        cell_mask_metadata = collect_single_cell_data.out.cell_mask_metadata
}

workflow sd_segment_cells{
    take:
        segmentation_metadata_files
		labels_to_segment
		model_name
		model_path
		prob_thresh
		nms_thresh
    main:
        sd_cell_segmentation(segmentation_metadata_files, labels_to_segment, model_name, model_path, prob_thresh, nms_thresh)
        collect_single_cell_data(sd_cell_segmentation.out.cell_data_csv_by_sample.collect(),
            sd_cell_segmentation.out.cell_mask_tiffs.collect(), "StarDist")
    emit:
        cell_mask_tiffs = sd_cell_segmentation.out.cell_mask_tiffs
        cell_data_csv_by_sample = sd_cell_segmentation.out.cell_data_csv_by_sample
        unannotated_cell_data = collect_single_cell_data.out.unannotated_cell_data
        cell_mask_metadata = collect_single_cell_data.out.cell_mask_metadata
        mergedTiffs =  sd_cell_segmentation.out.merged_tiffs
}

workflow identify_cell_types_mask{
    take:
        unannotated_cell_data
        cell_type_metadata
        image_metadata
        mask_metadata
    main:
        cell_type_identification_mask(unannotated_cell_data, cell_type_metadata,
            image_metadata, mask_metadata)
    emit:
        annotated_cell_data = cell_type_identification_mask.out.annotated_cell_data
}

workflow cluster_cells{
    take:
        annotated_cell_data
        cell_type_metadata
        sample_metadata
    main:
        cell_clustering(annotated_cell_data, cell_type_metadata, sample_metadata)
        collect_clustering_data(cell_clustering.out.cluster_csv_files.collect())
    emit:
        cluster_csv_files = cell_clustering.out.cluster_csv_files
        cluster_rdata_files = cell_clustering.out.cluster_rdata_files
        clustered_cell_data = collect_clustering_data.out.clustered_cell_data
}

workflow threshold_expression{
    take:
        annotated_cell_data
        cell_thresholding_metadata
    main:
        threshold_cells(annotated_cell_data, cell_thresholding_metadata)
    emit:
        thresholded_cell_data = threshold_cells.out.thresholded_cell_data
}

workflow analyse_homotypic_interactions{
    take:
        homotypic_metadata
    main:
        homotypic_interaction_analysis(homotypic_metadata)
        collect_homotypic_interactions(homotypic_interaction_analysis.out.homotypic_clusters.collect())
    emit:
        collected_homotypic_interactions = collect_homotypic_interactions.out.collected_homotypic_interactions
}

workflow calculate_heterotypic_distances{
    take:
        heterotypic_metadata
        metadata_file_name
    main:
        get_heterotypic_distances(heterotypic_metadata)
        collect_heterotypic_distances(get_heterotypic_distances.out.heterotypic_distances.collect())
    emit:
        collected_heterotypic_interactions = collect_heterotypic_distances.out.collected_heterotypic_interactions
}

workflow permute_heterotypic_interactions{
    take:
        permutations
        distance_file_name
        metadata_file_name
        sample_file_name
    main:
        permute_heterotypic_distances(permutations, distance_file_name, metadata_file_name, sample_file_name)
    emit:
        permuted_heterotypic_interactions = permute_heterotypic_distances.out.permuted_heterotypic_interactions
}

workflow visualize_areas{
    take:
        area_measurement_file 
        sample_metadata_file
    main:
        area_visualization(area_measurement_file, sample_metadata_file)
    emit:
        area_plotsPdf =  area_visualization.out.area_plotsPdf
        area_plotsPng =  area_visualization.out.area_plotsPng
}

workflow visualize_cell_types{
    take:
        annotated_cell_file
        sample_metadata_file
        cell_metadata_file
        cell_mask_files 
    main:
        cell_type_visualization(annotated_cell_file, sample_metadata_file, cell_metadata_file, cell_mask_files)
    emit:
        cell_type_plots = cell_type_visualization.out.cell_type_plots
        cell_type_overlaysPdf = cell_type_visualization.out.cell_type_overlays
        cell_type_overlays_unassigned_removed = cell_type_visualization.out.cell_type_overlays_unassigned_removed
        //cell_type_overlaysPng = cell_type_visualization.out.cell_type_overlaysPng     
}

//Workflow for intensity visualization
workflow visualize_cell_intensity{
    take:
        cell_overlay_tiff
        preprocessed_tiff
        sample_metadata_file
        cell_masking_metadata
        cell_type
    main:
        cell_intensity_visualization(cell_overlay_tiff, preprocessed_tiff, sample_metadata_file, cell_masking_metadata, cell_type)
    emit:
        cell_intensity_plot = cell_intensity_visualization.out.cell_intensity_plot
        
}

workflow visualize_cell_clusters{
    take:
        cluster_visualization_metadata
        clustered_cell_file
        sample_metadata_file
    main:
        cell_cluster_visualization(cluster_visualization_metadata, clustered_cell_file, sample_metadata_file)
    emit:
        cell_cluster_plots = cell_cluster_visualization.out.cell_cluster_plots
}

workflow visualize_cell_thresholds{
    take:
        thresholded_cell_file
        sample_metadata_file
        threshold_metadata_file
        cell_mask_list
    main:
        cell_threshold_visualization(thresholded_cell_file, sample_metadata_file, threshold_metadata_file, cell_mask_list)
    emit:
        cell_threshold_plots = cell_threshold_visualization.out.cell_threshold_plots
}

workflow visualize_homotypic_interactions{
    take:
        dbscan_file_name
        metadata_file_name
        cell_mask_list
    main:
        homotypic_interaction_visualization(dbscan_file_name, metadata_file_name, cell_mask_list)
    emit:
        homotypic_interaction_plots = homotypic_interaction_visualization.out.homotypic_interaction_plots
}

workflow visualize_heterotypic_interactions{
    take:
        distance_file_name
        metadata_file_name
        sample_file_name
    main:
        heterotypic_interaction_visualization(distance_file_name, metadata_file_name, sample_file_name)
    emit:
        heterotypic_interaction_plots = heterotypic_interaction_visualization.out.heterotypic_interaction_plots
}

workflow visualize_permuted_interactions{
    take:
        distance_file_name
        shuffled_distance_file_name
        metadata_file_name
        sample_file_name
    main:
        permuted_interaction_visualization(distance_file_name, shuffled_distance_file_name, metadata_file_name, sample_file_name)
    emit:
        permuted_interaction_plots = permuted_interaction_visualization.out.permuted_interaction_plots
}

//Workflow for area measurements
workflow cell_area_measurements{
    take: 
        cell_masks
        cell_overlay_tiff
        cell_masking_metadata
        cell_types
        co_expression_fraction

    main:
        compute_cell_area(cell_masks, cell_overlay_tiff, cell_masking_metadata, cell_types, co_expression_fraction)
    emit:
        cell_areas = compute_cell_area.out.measurements_of_cell_overlays
}