####### SETUP #######
rm(list = ls())
library(data.table)
library(uwot)
library(EBImage)
source("/opt/Plot_Functions.R")

arguments <- commandArgs(trailingOnly = TRUE)                                                                              
cell_file_name <- arguments[[1]]                                                                                             
sample_metadata_file_name <- arguments[[2]]
cell_cell_type_metadata_file_name <- arguments[[3]]
output_folder <- arguments[[4]]   
cell_mask_file_list <- unlist(arguments[5:length(arguments)])

######## Cell data #######
Cells <- fread(cell_file_name)
Samples <- fread(sample_metadata_file_name)
Samples[is.na(comparison), comparison := "NA" ]
suppressWarnings(Cells[, color := NULL])
suppressWarnings(Cells[, comparison := NULL])
Cells <- merge(Cells, Samples, by.x = "Metadata_sample_name", by.y = "sample_name")
sample_names <- Samples[, sample_name]

Comparison_Cells <- Cells[comparison != "NA",]
comparison_sample_names <- Samples[comparison != "NA", sample_name]

###################### Read cell type colors from the cell type metadata  ##########################
cell_type_color <- fread(cell_cell_type_metadata_file_name)
color_list <- cell_type_color$color


color_list[length(color_list) + 1] <- "#888888"
names(color_list) <- c(cell_type_color$cell_type, "UNASSIGNED")
rm(cell_type_color)
print("______________________________----")
print(color_list)

cell_mask_metadata <- fread(cell_cell_type_metadata_file_name)
cell_types <- cell_mask_metadata[, cell_type]
markers <- cell_mask_metadata[, threshold_marker]
print(cell_types)
print(markers)


###################### Cell Overlays ##########################
cell_mask_file_names <- sapply(sample_names, function(sample_name){
	cell_mask_file_name <- grep(sample_name, cell_mask_file_list, value = T)
})

print(cell_mask_file_names)
mask_files <- c()
for(i in 1:length(cell_mask_file_names)){
	sample <- strsplit(cell_mask_file_names[i],"-")
	sample <- unlist(sample)[1:2]
	sample <- paste0(sample[1],"-",sample[2])
	print(sample)
	mask_files[[sample]] <- cell_mask_file_names[i]

}
print(mask_files)
print(sample_names)

names(cell_mask_file_names) <- sample_names

cell_overlays <- c()
cell_overlays_for_merge <- c()
cell_overlays_remove_unassigned <- c()


for(k in 1:length(sample_names)){
	cell_overlays_by_type <- c()
	cell_overlays_by_type_remove_unassigned <- c()

	cell_overlays_for_merge_by_type <- c()
	print(sample_names[k])
	for(i in 1:length(names(color_list))){
		j <- 0
		cell_list <- c()	
		cell_list_remove_unassigned <- c()
		cell_list_for_merge <- c()
		print(names(color_list)[i])
		if(names(color_list)[i] != "UNASSIGNED"){
			while(TRUE){
				j <- j + 1
				if(grepl(markers[i], mask_files[j], fixed=TRUE) & grepl(sample_names[k], mask_files[j], fixed=TRUE)){
					filename <- mask_files[j]
					filename <- filename[[1]]
					print(filename)
					cell_mask <- load_image(filename)

					temp_cells <- Cells[cell_type==names(color_list)[i] | cell_type==paste0("UNASSIGNED_",names(color_list)[i])]
					temp_cells$cell_type[temp_cells$cell_type == paste0("UNASSIGNED_",names(color_list)[i])] <- "UNASSIGNED"

					if(length(cell_types) > 1){#IF SEVERAL cell typessample_names
						print("SEVERAL CELL TYPES")
						temp_cells_for_merge <- temp_cells[cell_type != "UNASSIGNED"] 
						#print(head(temp_cells_for_merge))
					}
					

					#cells$cell_type[cells$cell_type != 0] <- cell_type
					
					for(y in 1:length(names(color_list))){
						#print(names(color_list[y]))
						#print(sample_names[k])
						#print(Cells[Metadata_sample_name == sample_names[k] & cell_type == names(color_list)[y], ObjectNumber])
						#print(length(Cells[Metadata_sample_name == sample_names[k] & cell_type == names(color_list)[y], ObjectNumber]))
						print(names(color_list)[y])
						print(sample_names[k])
						if(length(temp_cells[Metadata_sample_name == sample_names[k] & cell_type == names(color_list)[y], ObjectNumber]) != 0){
							print("____________________________________________________________")
							
							cell_list[[y]] <- temp_cells[Metadata_sample_name == sample_names[k] & cell_type == names(color_list)[y], ObjectNumber]
							
						}

						if(length(temp_cells[Metadata_sample_name == sample_names[k] & cell_type == names(color_list)[y] & names(color_list)[y] != "UNASSIGNED", ObjectNumber]) != 0){
							print("____________________________________________________________")
							names(color_list)[y]
							cell_list_remove_unassigned[[y]] <- temp_cells[Metadata_sample_name == sample_names[k] & cell_type == names(color_list)[y], ObjectNumber]
							
						}
						#Note the index
						if(length(cell_types) > 1){#IF SEVERAL cell types
				
							if(length(temp_cells_for_merge[Metadata_sample_name == sample_names[k] & names(color_list)[y] == names(color_list)[i], ObjectNumber]) != 0){
								print("EXECUTED ONLY ONCE PER ITERATION")
								cell_list_for_merge[[i]] <- temp_cells_for_merge[Metadata_sample_name == sample_names[k] & cell_type == names(color_list)[i], ObjectNumber]
								cell_overlay_for_merge <- fillHull(cell_overlayer(0, cell_mask, cell_list_for_merge, color_list))
								cell_overlays_for_merge_by_type[[names(color_list[i])]] <-  cell_overlay_for_merge
							}
						}
						
					}
					
					print(cell_list)
					cell_overlay <- fillHull(cell_overlayer(0, cell_mask, cell_list, color_list))
					print(cell_overlay)
					cell_overlays_by_type[[names(color_list[i])]] <-  cell_overlay
					print("_____________________________________________________--")
					print(cell_list_remove_unassigned)

					cell_overlay_remove_unassigned <- fillHull(cell_overlayer(0, cell_mask, cell_list_remove_unassigned, color_list))
					cell_overlays_by_type_remove_unassigned[[names(color_list[i])]] <-  cell_overlay_remove_unassigned
					break
				}
			}
			#for(h in 1:length)
		}
		
		
	}
	
	
	
	
	#print(cell_overlays_by_type) #Prints correct
	cell_overlays[[sample_names[k]]] <- cell_overlays_by_type
	cell_overlays_for_merge[[sample_names[k]]] <- cell_overlays_for_merge_by_type
	cell_overlays_remove_unassigned[[sample_names[k]]] <- cell_overlays_by_type_remove_unassigned

	#names(cell_overlays[sample[k]]) <- sample_names[k]
	#print(names(cell_overlays[[sample[k]]]))
	#print(cell_overlays[[sample_names[k]]]) 


}
print("__________________")
	

legend_table <- data.table(cell_type = names(color_list), color = color_list)
legend_table[, X := 2 + 2 * (.I %% ceiling(sqrt(.N)))]
legend_table[, text_X := X - 0.35]
legend_table[, Y := 1 + .N - (1:.N), by = X]
legend_plot <- ggplot(data = legend_table) +
	geom_tile(mapping = aes(x = X, y = Y, fill = cell_type), width = 0.5, height = 0.5, color = "black") +
	geom_text(mapping = aes(x = text_X, y = Y, label = cell_type), hjust = "right", size = 1) +
	scale_fill_manual(values = color_list, guide = "none") +
	xlim(0, max(legend_table$X + 1)) +	
	ylim(0, max(legend_table$Y + 1)) +	
	coord_equal() +
	theme(axis.line=element_blank(), axis.text = element_blank(), axis.title = element_blank(),
		axis.ticks = element_blank(), panel.background = element_blank(), panel.border = element_blank(),
		panel.grid.major = element_blank(), panel.grid.minor = element_blank(), plot.background = element_blank())


###################### Stacked Barplots ##########################
if(length(sample_names) > 0){
	stacked_unassigned_sample_barplot <- stacked_barplotter(Cells, "Metadata_sample_name", "Metadata_sample_name", "cell_type",
		color_list, "Cell type cells / total cells %")
	stacked_assigned_sample_barplot <- stacked_barplotter(Cells[cell_type != "UNASSIGNED"], "Metadata_sample_name", "Metadata_sample_name",	
		"cell_type", color_list, "Cell type cells / total cells %")
	if(length(comparison_sample_names) > 1){
		stacked_unassigned_comparison_barplot <- stacked_barplotter(Comparison_Cells, "Metadata_sample_name", "comparison", "cell_type", color_list,
			"Cell type cells / total cells %")
		stacked_assigned_comparison_barplot <- stacked_barplotter(Comparison_Cells[cell_type != "UNASSIGNED"], "Metadata_sample_name", "comparison",
			"cell_type", color_list, "Cell type cells / total cells %")
	}
}

###################### Dodeged Barplots ##########################
if(length(sample_names) > 0){
	if(length(comparison_sample_names) > 1){
		dodged_unassigned_comparison_barplot <- dodged_barplotter(Comparison_Cells, "comparison", "cell_type", "Metadata_sample_name",
			color_list,	"Cell type cells / total cells %")
		dodged_assigned_comparison_barplot <- dodged_barplotter(Comparison_Cells[cell_type != "UNASSIGNED"], "comparison",
			"cell_type", "Metadata_sample_name", color_list, "Cell type cells / total cells %")
	}
}

###################### Boxplots by Population ##########################
n_categories <- length(unique(Samples[comparison != "NA", comparison]))
sample_colors <- Samples[, color]
names(sample_colors) <- Samples[, color]
if(n_categories == 2){
# Boxplots should be made only when we have 2 groups to compare
	unassigned_plot_data <- copy(Comparison_Cells)		
	unassigned_plot_data[, n_cells := .N, by = c("Metadata_sample_name", "cell_type")]
	unassigned_plot_data[, total := .N, by = "Metadata_sample_name"]
	unassigned_plot_data[, percentage := n_cells / total * 100]
	unassigned_cell_type_boxplots <- list_boxplotter(unassigned_plot_data, "Metadata_sample_name", "cell_type", "comparison", "percentage",
		"Cell type cells / total cells %", "color", sample_colors)
	unassigned_cell_type_boxplots <- lapply(unassigned_cell_type_boxplots, function(x){x$Plot})
	assigned_plot_data <- copy(Comparison_Cells)[cell_type != "UNASSIGNED", ]
	assigned_plot_data[, n_cells := .N, by = c("Metadata_sample_name", "cell_type")]
	assigned_plot_data[, total := .N, by = "Metadata_sample_name"]
	assigned_plot_data[, percentage := n_cells / total * 100]
	assigned_cell_type_boxplots <- list_boxplotter(assigned_plot_data, "Metadata_sample_name", "cell_type", "comparison", "percentage",
		"Cell type cells / total cells %", "color", sample_colors)
	assigned_cell_type_boxplots <- lapply(assigned_cell_type_boxplots, function(x){x$Plot})
}

################ Output ######################
# Cell Overlays
overlay_output_folder <- file.path(output_folder, "Overlays")  
dir.create(overlay_output_folder, recursive = T, showWarnings = F)
lapply(sample_names, function(sample){
	overlay_img <- c()
	for(i in 1:length(cell_overlays[[sample]])){
		if(length(cell_overlays_for_merge[[sample]]) > 1){
			print("_________")		
			print(names(cell_overlays_for_merge[[sample]][i]))

			overlay_img[[i]] <- imageData(cell_overlays_for_merge[[sample]][[i]])

		}

		print(cell_overlays[[sample]][[i]])
		writeImage(cell_overlays[[sample]][[i]], paste0(overlay_output_folder,"/", sample, "-", names(cell_overlays[[sample]][i]), "-overlay.tiff"), bits.per.sample = 8, compression = "LZW")
		writeImage(cell_overlays_remove_unassigned[[sample]][[i]], paste0(overlay_output_folder,"/", sample, "-", names(cell_overlays_remove_unassigned[[sample]][i]), "-overlay-unassigned-removed.tiff"), bits.per.sample = 8,  compression = "LZW")
		
	}
	#print(overlay_img)
	image <- overlay_img[[1]]
	if(length(overlay_img) > 1){
		for(i in 2:length(overlay_img)){
			print("ok")


			print(unique(as.vector(as.matrix(overlay_img[[i]]))))

			image[overlay_img[[i]] == 1] <- overlay_img[[i]][overlay_img[[i]] == 1.0000000]

			
			
		}
		img <- Image(image, colormode=Color)
		writeImage(img, paste0(overlay_output_folder,"/", sample, "-ALL", "-overlay.tiff"),
		bits.per.sample = 8, compression = "LZW")

	}
	

	#Loop over samples 
	#Loop over overlays plot, rename the plot
	# + 1 iteration merge all the overlays plots and rename 
	

})
pdf_plotter(file.path(overlay_output_folder, "overlay_legend.pdf"), legend_plot)



# Barlots
barplot_output_folder <- file.path(output_folder, "Barplots")  
dir.create(barplot_output_folder, recursive = T, showWarnings = F)
if(length(sample_names) > 1){
	multi_pdf_plotter(list(stacked_unassigned_sample_barplot, stacked_unassigned_comparison_barplot),
		filenamePng = paste0(barplot_output_folder, "/stacked_barplots.png"),
		filenamePdf = paste0(barplot_output_folder, "/stacked_barplots.pdf"), n_col = 1, n_row = 2)
	multi_pdf_plotter(list(stacked_assigned_sample_barplot, stacked_assigned_comparison_barplot),
		filenamePng = paste0(barplot_output_folder, "/stacked_assigned_only_barplots.png"), 
		filenamePdf = paste0(barplot_output_folder, "/stacked_assigned_only_barplots.pdf"), n_col = 1, n_row = 2)
	pdf_plotter(filename = paste0(barplot_output_folder, "/dodged_barplots.pdf"), plot = dodged_unassigned_comparison_barplot)
	pdf_plotter(filename = paste0(barplot_output_folder, "/dodged_assigned_ony_barplots.pdf"), plot = dodged_assigned_comparison_barplot)
} else if (length(sample_names > 0)){
	pdf_plotter(filename = paste0(barplot_output_folder, "/stacked_barplots.pdf"), plot = stacked_unassigned_sample_barplot)
	pdf_plotter(filename = paste0(barplot_output_folder, "/stacked_assigned_ony_barplots.pdf"), plot = stacked_assigned_sample_barplot) #stacked_assigned_sample_barplot

}


# Boxplots by comparison
if(n_categories == 2){	
	boxplot_output_folder <- file.path(output_folder, "Boxplots")  
	dir.create(boxplot_output_folder, recursive = T, showWarnings = F)
	multi_pdf_plotter(unassigned_cell_type_boxplots,filenamePng = paste0(boxplot_output_folder, "/boxplots.png"), filenamePdf = paste0(boxplot_output_folder, "/boxplots.pdf"))
	multi_pdf_plotter(assigned_cell_type_boxplots, filenamePng = paste0(boxplot_output_folder, "/assigned_only_boxplots.png"), filenamePdf = paste0(boxplot_output_folder, "/assigned_only_boxplots.pdf"))
}
