
#Source: https://github.com/ciccalab/SIMPLI/blob/master/scripts/Cell_type_selecter_mask.R

#Original code is from the SIMPLI github page

#The code is edited by: Erno Hänninen
#Updated: Oct 2 2022

#The original code has been modified to work with the changes we've made to other scripts


#Identifies cell types



####### SETUP #######
rm(list = ls())
library(tidyr)
library(data.table)
library(EBImage)
library(dplyr)

args <- commandArgs(trailingOnly = TRUE)                                                                                
unannotated_cells_file_name <- args[[1]]                                                                          
threshold_metadata_file_name <- args[[2]]
image_metadata_file_name <- args[[3]]                                                                               
cell_mask_metadata_file_name <- args[[4]]                                                                               
out_file_name <- args[[5]]   

cell_mask_metadata <- fread(cell_mask_metadata_file_name)  
cell_files <- cell_mask_metadata[, cell_file]
samples <- cell_mask_metadata[,sample_name]


threshold_metadata <- fread(threshold_metadata_file_name) 
threshold_markers <- threshold_metadata[, threshold_marker]

unannotated_cells <- fread(unannotated_cells_file_name) 
temp_cells <- unannotated_cells[, Metadata_sample_name]
collect_cells <- c()

#Loop thru the input files and identify the cekl types
for(i in 1:length(cell_files)){
  current_marker <- strsplit(samples[i],"-")
  current_marker <- unlist(current_marker)[2]
  name <- strsplit(samples[i],"-")
  name <- unlist(name)[1]
  cell_file <- cell_files[i]


  ############ Load the unannotated cells ##########                                                                
  cells <- fread(cell_file)   
  cells[, CellName := paste0(Metadata_sample_name, "-", ObjectNumber)]


  ############################# Marker combinations and Thresholds ###########################                                           
  # Expects a .csv file with 3 columns:                                                                                   
  # - cell_type                                                                                                           
  # - threshold_marker                                                                                                    
  # - threshold_value                                                                                                     
  #threshold_metadata <- fread(threshold_metadata_file_name)  
  cell_types <- threshold_metadata[, cell_type]
  ############################# Image Metadata ###########################                                           
  # Expects a .csv file with 3 columns:                                                                                      
  # - sample_name                                                                                                            
  # - label                                                                                                                  
  # - file_name                                                                                                              
  image_metadata <- fread(image_metadata_file_name, select = c("sample_name", "label", "file_name2"), col.names = c("sample_name", "label", "file_name"))   


  #image_metadata <- rename(image_metadata, replace = c("file_name2" = "file_name"))                                                                             
  all_samples <- unique(image_metadata$sample_name) 

  ############################# Cell Mask Metadata ###########################                                           
  # Expects a .csv file with 3 columns:                                                                                      
  # - sample_name                                                                                                            
  # - label = Cell_Mask                                                                                                                  
  # - file_name 

  #preprocessed_tiff_metadata.csv \
    #StarDist-cell_mask_metadata.csv 
  cell_mask_metadata <- fread(cell_mask_metadata_file_name, select = c("sample_name", "label", "file_name"), col.names = c("sample_name", "label", "file_name"))

  image_metadata <- rbind(cell_mask_metadata, image_metadata)
  rm(cell_mask_metadata)

  ############################# Cell Selection ###########################                                                
  load_image <- function(filename)
  {
    #Img <- readImage(filename, "tiff", all = FALSE)
    print(filename)
    Img <- readImage(filename, all = FALSE)
    if (length(dim(Img)) == 3) {return(Img[,,1])}
    return(Img)
  }

  outside_remover <- function(objs_mask, mask, fraction)
  {
    objs <- imageData(objs_mask)
    print("______________________________________")
    print(fraction)
    if(!is.na(fraction)){
        to_remove <- data.table(table(as.numeric(objs[which(objs & !imageData(mask), arr.ind = TRUE)])))
        all <- data.table(table(as.numeric(objs)))
        to_remove <- merge(to_remove, all, by = "V1", all = F)
        to_remove <- to_remove[N.x / N.y > fraction]$V1
        to_remove <- which(objs %in% to_remove, arr.ind = T)
    }else{
      to_remove = "NA"
    }
    print(to_remove)
    
    objs[to_remove] <- 0
    as.Image(objs)
  }

  process_sample <- function(sample_marker, name,fraction, marker_expression, cell_mask)
  { 
    markers <- as.character(unlist(sapply(sapply(marker_expression, function(expr){parse(text = expr)}), all.vars)))
    Marker_images <- lapply(markers, function(marker){
      if(current_marker == marker){
      
      load_image(image_metadata[sample_name == name & label == marker, file_name])}})

    Marker_images <- lapply(Marker_images, function(x){x & x})
    names(Marker_images) <- markers
    Marker_image <- as.Image(eval(parse(text = marker_expression), envir = Marker_images))
    Cell_image <- load_image(image_metadata[sample_name == paste0(name, "-", marker) & label == cell_mask, file_name])
    Cell_image <- Cell_image * (2^16 - 1)
    Marker_Cell_mask <- outside_remover(Cell_image, Marker_image, fraction)
    
    return(list(All_cells = unique(as.numeric(Cell_image@.Data)), Marker_Cells = unique(as.numeric(Marker_Cell_mask@.Data))))
  }

  cell_type <- ""
  ############# Identify cells #############
  for (type_n in seq_along(cell_types)){
    marker <- threshold_metadata[cell_type == cell_types[[type_n]], threshold_marker]
    if(current_marker == marker){
      cell_type <- cell_types[[type_n]]
      fraction <- threshold_metadata[cell_type == cell_types[[type_n]], threshold_value]
      type_cells <- process_sample(samples[i], name, fraction, marker, "Cell_Mask")[[2]]
      print(type_cells)
      type_cells <- type_cells[type_cells != 0]
      type_cells <- paste0(samples[i], "-", type_cells)
      cells[Metadata_sample_name == samples[i], c(cell_types[[type_n]]) := (CellName %in% unlist(type_cells)) * type_n]
      print(head(cells))
      ############# Prioritize Populations #############
      cells[, min_cell_type := apply(.SD, 1, function(x){ifelse(any(x) > 0, min(x[x > 0]), NA)}), .SDcols = cell_type] 
      ##:= assigns the cell type,
      #ifelse(test, yes, no)
      cells[, cell_type := ifelse(!is.na(min_cell_type), cell_type, paste0("UNASSIGNED_", cell_type)), by = CellName]    
      #Changes the column name                                                             
      cells[, c(cell_types, "min_cell_type") := NULL] 
      collect_cells <- rbind(collect_cells, cells) #After every iteration save the df to the resulting df

    }
  }

  #This if statement is executed after last iteration
  if(i==length(cell_files)){

    #Loop thru the collect_cells dataset so that we get it in the same form than it was in the original pipeline
    counter <- 0
    new_marker <- "" #This variable controls if the marker changes
    new_sample <- "" #Controls if sample changes
    for(i in 1:length(collect_cells$Metadata_sample_name)){
      #Remove the marker from the sample name
      sample = collect_cells$Metadata_sample_name[i]
      processed_sample <- strsplit(sample,"-") #Split the sample name
      collect_cells$Metadata_sample_name[i] <- unlist(processed_sample)[1] #Store the edited sample name to dataframe

      #Update the object number of samples, so that the object numbers are unique among samples
      counter <- counter + 1
      #Check if the sample changes
      if(unlist(processed_sample)[1] != new_sample){
        print("___________________________________--")
        #counter <- 1
        new_marker <- sample
      }
     # collect_cells$ObjectNumber[i] <- counter
      #Check if marker changes
     # if(sample != new_marker & new_marker != ""){
      #  print("_______________________________________________________")
         #When marker changes update the objectnumber
      #}
      #Update variables
      new_marker <- sample
      new_sample <- unlist(processed_sample)[1]

    }
    #Write the dataframe to file
    fwrite(collect_cells, out_file_name)
  }


}
