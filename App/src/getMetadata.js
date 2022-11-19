/*
Title: getMetadata.js
Date: 2021-09-03
Author: Erno Hänninen
Description:
  - In this page the settings regarding the selected processes are inputted
  - Collecting and validating input
  

Procedure:
 - Display the metadata forms for selected processes
 - Collect the data
 - Validate the input
 - Run the pipeline


*/

//Import libraries and css file
import React,  { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from "axios";
import './App.css';


//Check that the colors for cell_masking_metadata are okay


//Global variables
var options = []
var maskTemp = ({cellType:"", thresholdMarker:"", thresholdValue:null, color:""})
var submitted_markers = []

//Function which is called from APP.js script
const GetMetadata = forwardRef((props, ref)=>{

    //State variables
    const [renderArea, setRenderArea] = useState(false)
    const [renderSegmentation, setRenderSegmentation] = useState(false)
    const [renderMasking, setRenderMasking] = useState(false)
    const [renderIntensity, setRenderIntensity] = useState(false)
    const [renderCellArea, setRenderCellArea] = useState(false)
    const [intensityTb, setIntensityTb] = useState("")
    const [allMarkers, setAllMarkes]  = useState(false)
    const [markersDict, setMarkersDict] = useState([{}])
    const [counter, setCounter] = useState(0)
    const [markerKeyCounter, setMarkerKeyCounter] = useState(0)
    let markerTemp = ({marker:"", mainMarker:""})
    const [maskCounter, setMaskCounter] = useState(0)
    const [maskKeyCounter, setMaskKeyCounter] = useState(0)
    const [cellAreaCounter, setCellAreaCounter] = useState(0)
    const [newMask, setNewMask] = useState(false)
    let inputFields = []
    const [analysisReady, setAnalysisReady] = useState("")
    const[markerOptions, setMarkerOptions] = useState("")
    const [originalMarkers, setOriginalMarkers] = useState([]) //This list keeps in track about the markers that the user inputted
    const [markerTextBox, setMarkerTextBox] = useState("")
    const [modelDropDown, setModelDropDown] = useState("")
    const [model, setModel] = useState("")
    const [segmentationSettings, setSegmentationSettings] = useState("")
    const [probTreshold, setProbThreshold] = useState("")
    const [overlapThreshold, setOverlapThreshold] = useState("")
    const [maskingTextBox, setMaskingTextBox] = useState("")
    const [maskDict, setMaskDict] = useState([{}])
    const [errorMessageArea, setErrorMessageArea] = useState("")
    const [intensityCellType, setIntensityCellType] = useState("")
    const [cellAreaTb, setCellAreaTb] = useState([])
    const [cellAreaList, setCellAreaList] = useState([])
    const [expressionFraction, setExpressionFraction] = useState("")


    useImperativeHandle(ref, ()=>({
        //THis axios call is used to get the processes to run
        getProcesses(){
            async function getData(){
                try {
                    let response = await axios({
                        url: "/getSettings",
                        method: "get"
                    })

                    return response.data
                }
                catch(err){
                    console.log(err)
                }
            }
           
            getData()
            //If no error parse the response
            .then(function(response){
                //Parse values from response data to boolean format
                for (let prop in response[0]) {
                    if (response[0].hasOwnProperty(prop)) {
                        //Converts the objects properties from string to boolean values
                        response[0][prop] = (response[0][prop] == 'true' || response[0][prop] == 'false')? response[0][prop] === 'true': response[0][prop] ;
                    }
                } 

                //Before rendering any process settings forms, the settings inputted on sample page are validated
                //Check that the source of images is selected
                if(response[0].instrument == ""){
                    alert("Select source of images")
                }
                //Check that all the processes which are dependent on each other is checked
                //Alert user if some of the required processes is not checked
                else if(response[0].execute_sd_segmentation == false || response[0].execute_cell_type_identification == false){
                    alert("To run the analysis, check atleast image segmentation and cell type identification")

                }
                else if((response[0].execute_sd_segmentation == false || response[0].execute_cell_type_identification == false) && (response[0].execute_intensity == true || response[0].execute_measure_cell_areas == true)){
                    alert("To run cell-based analysis, check image segmentation and cell type identification")
                }
                else if(response[0].execute_cell_clustering == false && response[0].execute_cell_thresholding == true || response[0].execute_homotypic_interactions == true || response[0].execute_heterotypic_interactions == true || response[0].execute_permuted_interactions == true){
                    alert("To run cell clustering, check cell type identification")
                }
                else if(response[0].execute_cell_thresholding == false && response[0].execute_homotypic_interactions == true || response[0].execute_heterotypic_interactions == true || response[0].execute_permuted_interactions == true){
                    alert("To run cell thresholding, check cell clustering")
                }
                else if(response[0].execute_cell_thresholding == false && response[0].execute_homotypic_interactions == true){
                    alert("To run homotypic interactions, check cell thresholding")
                }
                else if(response[0].execute_cell_thresholding == false && response[0].execute_heterotypic_interactions == true){
                    alert("To run heterotypic interactions, check cell thresholding")
                }
                else if(response[0].execute_cell_thresholding == false && response[0].execute_permuted_interactions == true){
                    alert("To run permuted interactions, check cell thresholding")
                }
                //If the processes were correct display the getMetadata page and hide the getSettings page
                else{
                    document.getElementById("settingsPage").style.display= "none";
                    document.getElementById("nextButton2").style.display = "none";
                    document.getElementById("returnButton").style.display = "none"
                    document.getElementById("returnButton2").style.display = "block"
                    document.getElementById("nextButton3").style.display = "block"
                    document.getElementById("metadataPage").style.display = "block"

                    //These if statements contols which input fields are rendered. This depdends of the processes to run
                    //Calls the function to prepare the forms with default values

                    if(response[0].execute_area == true){ 
                        setRenderArea(true)
                        setMarkerTextBox("")
                        let markers = response[1] //dictionary of markers
                        allMarkersChecked(markers)
                        setOriginalMarkers(response[2])
                        
                    }
                    else if(response[0].execute_area == false)setRenderArea(false)
                    
                    //If segmentation is executed, display elements and call function
                    if(response[0].execute_sd_segmentation == true){
                        setRenderSegmentation(true)
                        segmentationInput()
                    }
                    else if(response[0].execute_sd_segmentation == false)setRenderSegmentation(false)
                    //If cell type identification is executed, display elements and call function
                    if(response[0].execute_cell_type_identification == true){
                        let markers = response[1]
                        setRenderMasking(true)
                        maskingInput(markers)
                    }
                    //if cell type identification is not executed, hide elements
                    else if(response[0].execute_cell_type_identification == false){
                        setRenderMasking(false)
                        setMaskingTextBox("")
    
                    }
                    //If cell type pixel intensity measuremnts is executed, display elements and call function
                    if(response[0].execute_intensity == true){
                        setRenderIntensity(true)
                        intensityInput()
                    }
                    //if pixel analysis is not executed, hide elements
                    else if(response[0].execute_intensity == false)setRenderIntensity(false)

                    //If cell area measuremnts is executed, display elements and call function
                    if(response[0].execute_measure_cell_areas == true){
                        setRenderCellArea(true)
                        cellAreaInput()
                    }
                    //Hide elements
                    else if(response[0].execute_measure_cell_areas == false)setRenderCellArea(false)

                    if(response[0].execute_cell_clustering == true){
                        console.log("RENDER SOMETHING")
                    }
                    if(response[0].execute_cell_thresholding == true){
                        console.log("RENDER SOMETHING")
                    }
                    if(response[0].execute_homotypic_interactions == true){
                        console.log("RENDER SOMETHING")
                    }
                    if(response[0].execute_heterotypic_interactions == true){
                        console.log("RENDER SOMETHING")
                    }
                    if(response[0].execute_permuted_interactions == true){
                        console.log("RENDER SOMETHING")
                    }
                }

            })
        },

        //Function which makes a request call to the backend to submit the settings
        submitMetadata(){
            let error = false
            var temp_list_markers = []

            //Reads the markers which the user wants to use to identify the corresponding cells
            if(maskTemp["thresholdMarker"] != ""){
                for(let i = 0;i < Object.values(maskDict).length; i++){
                    temp_list_markers.push(Object.values(Object.values(maskDict)[i])[1]["threshold_marker"])
                }
            }
            //Checks that the segmentation form is correctly filled
            if(renderSegmentation == true && model =="" || probTreshold == "" || overlapThreshold == "" || isNaN(probTreshold) != false || isNaN(overlapThreshold) != false || probTreshold < 0 || probTreshold > 1 || overlapThreshold < 0 || overlapThreshold > 1){
                alert("Error in model or thresholds in cell segmentation settings. Probability and overlap threshold should have value between 0-1")
                error = true
            }   
            //Check if cell type identification fields are empty
            else if(renderMasking == true && maskTemp["thresholdMarker"] == "" || maskTemp["cellType"] == "" || maskTemp["thresholdValue"] == null || maskTemp["color"]==""){
                alert("Fill all the fields in cell type identification before proceeding")
                error = true
            }
            //Checks that the threshold value field has accepted value
            else if((maskTemp["thresholdValue"] != "NA" && isNaN(maskTemp["thresholdValue"]) == true) || (isNaN(maskTemp["thresholdValue"]) == false && maskTemp["thresholdValue"] < 0 || maskTemp["thresholdValue"] > 1)){
                alert("Only values between 0-1 or NA are accepted in threshold value textbox")
                error = true
            }
            //Checks that all the markers submitted in submit sample page are identified, by checking the length of these lists
            else if(temp_list_markers.length != submitted_markers.length){
                alert("All the submitted markers on submit sample page should be identified")
                error = true
            }
            //Checks the same thing as above but by checking that all the items match
            else if(submitted_markers.every((item)=>temp_list_markers.includes(item))==false){
                alert("All the submitted markers on submit sample page should be identified")
                error = true
            }
            //Checks that the cell type in intensity form matches one of the cell types in the identification process
            else if(renderIntensity == true){
                let boolIntensity = false
                //Checks that the cell type in input field corresponds one of the cell types
                for(let i = 0;i < Object.values(maskDict).length; i++){
                    if(Object.values(Object.values(maskDict)[i])[0]["cell_type"] == intensityCellType){
                        boolIntensity = true
                    }
                }
                //Displays the error message
                if(boolIntensity == false){
                    error = true
                    alert("Cell type in pixel intensity form should match one of the cell types in cell type identification")
                }      
            }
            //Checks that the co expression value is between 0-1
            if(renderCellArea == true && error==false){
                if(isNaN(expressionFraction)!=false || expressionFraction=="" || expressionFraction < 0 || expressionFraction > 1){
                    error = true
                    alert("Co-expression factor should set between 0-1")
                }//If the value is okay, next check that the input are cells identified in cell identification process
                if(error == false){
                    var temp_list_comparison = []
                    let temp_list_types = []
                    let boolCellArea = true
                    // loops over the cell area measurements input field
                    for(let i = 0; i < cellAreaList.length; i++){
                        if(cellAreaList[i].includes("/")){ //If "/" we are looking for co-expressing cells -> cellAreaList contains more than 1 cell type
                            let cells = cellAreaList[i].split("/") //Splitting the different cell types to a list
                            temp_list_comparison = temp_list_comparison.concat(cells) //Concatenate the cells array to the temp arrray
                        }
                        else{
                            temp_list_comparison.push(cellAreaList[i]) // if no "/" -> only one cell type -> push it directly to the temp list
                        }
                    }
                    //Get the cell types identified in cell type identification
                    for(let i = 0;i < Object.values(maskDict).length; i++){
                        temp_list_types.push(Object.values(Object.values(maskDict)[i])[0]["cell_type"])
                    }
                    //If the cell area measurements has input which is not identified in cell type identification error is raisen
                    if(!temp_list_comparison.every(r => temp_list_types.includes(r))){
                        boolCellArea = false
                    }
                    if(boolCellArea == false){
                        error = true
                        alert("Some cell type(s) in cell area measurement form doesn't match the cell types in cell type identification")
                    }
                }
            }
            if(error == false) { //If no error in the input submit the data to backend

                //store the parameters for segmentation to dictionary
                let segmentingDict = {"model" : model, "probThreshold": probTreshold, "overlapThreshold": overlapThreshold}

                const url = '/submitMetadata'; //url for the request
                //send data to backend 
                axios.post(url, { 
                    //Collect the data to the post request
                    "markers": markersDict,
                    "segmentingSettings" : segmentingDict,
                    "masks": maskDict,
                    "intensityCellType" : intensityCellType,
                    "fraction" : expressionFraction,
                    "cellAreaList" : cellAreaList
                    })
                    //Handle the response from backend
                    .then((response) =>{
                        if(response.data=="error"){ //If error
                            console.log("########ERROR########")
                        }
                        else{ //IF everyting okay
                            console.log("READY")
                        }
                });   
                document.getElementById("metadataPage").style.display = "none"
                document.getElementById("resultsPage").style.display = "block";  
                document.getElementById("returnButton2").style.display = "none"
                document.getElementById("nextButton3").style.display = "none"
                document.getElementById('load').style.display = 'block';

                //This axios request sends request to /run url, from where the image analysis pipeline is executed
                const url2 = '/run';
                axios.post(url2, "RUN")
                    .then((response) =>{
                        if(response.data=="error"){ //If error
                            console.log("########ERROR########")
                            console.log("ERROR IN AXIOS CALL")
                            //alert("Error when performing the analysis, please check your input files and try again.")
                            document.getElementById('load').style.display = 'none';

                        } 
                        else{ //IF everything okay

                            //Display results page for user
                            //Parses the resonse.data which contains the output message from Nextflow pipeline
                            //If error string is found -> assume that error accured -> show error message
                            if(response.data.includes("Error")){
                                document.getElementById("pipelineStatus").innerHTML = "An error occured during the analysis. The error can be tracked from the message below or from nextflow.log file. Note, some of the results are missing because of the error."
                            }
                            else{
                                document.getElementById("pipelineStatus").innerHTML = "The pipeline ran successfully, please display the results"
                                
                            }
                            //Get the cell type and corresponding color. These are displayed in result page
                            let color_elem = []
                            for(let i = 0;i < Object.values(maskDict).length; i++){
                                color_elem +=  Object.values(Object.values(maskDict)[i])[3]['color'] + ": " + Object.values(Object.values(maskDict)[i])[0]['cell_type'] + "     "
                            }


                            //Display and hide elements
                            document.getElementById("color_label").innerHTML += color_elem
                            document.getElementById("outputB").style.display = "block"
                            document.getElementById("outputMessage").innerHTML = response.data
                            document.getElementById('load').style.display = 'none';
                            document.getElementById('results').style.display = 'block';                   
                        }
                });   
                

            }

              
        }
    }))

    // ################################################## Metadata for positive marker area measurements #################################################################################
    //THis is commented away from the pipeline
    const allMarkersChecked = (markers) => {    
            setMarkersDict(markers)
            let count = -1;

            //let markers = originalMarkers //Using a temp list because the state variable doesn't update immediately 
            setMarkerKeyCounter(Object.keys(markers).length) 

            setMarkerTextBox(Object.entries(markers).map(([key,index]) => {
                let obj = markers[key]
                let marker = Object.keys(obj)[0]
                //if(marker in originalMarkers){//THis doesn't work because the marker is located in 0:{marker:mainMarker}
                count = count + 1
                let id = "marker" + count
                setCounter(count)  

                return(<div class="row" id={id} value={marker}>
                    <div class="col-1">    
                        <input name={id} value={marker} disabled size="10"/>                
                    </div>
                    <div class="col-2">    
                        <input name={id} value={marker} disabled size="10"/>                
                    </div>
                    <div class="col-3">
                        <button  onClick={() => removeMarker(count)}>Remove</button>                  
                    </div>  
                </div>)        
            }
        ))             
    }
    //Set input fields when new cell is added
    const addMarkers = event =>{
        //Disables element after new one is added
        if(Object.keys(markersDict).includes(counter.toString())){
            let name = "marker" + counter
            document.getElementsByName(name).forEach(e => {
                e.disabled = true
            })        
        }

        let count = counter + 1
        let id = "marker" + count
        
        setMarkerTextBox([...markerTextBox,
        <div class="row" id={id}>
            <div class="col-1">    
                <input name={id}  onBlur={event => handleChangeMarker(id,event, "marker")} size="10"/>                
            </div>
            <div class="col-2">    
                <input name={id} onBlur={event => handleChangeMarker(id,event, "mainMarker")} size="10"/>                
            </div>
            <div class="col-3">
                <button disabled={markerTextBox.length === 0} onClick={() => removeMarker(id)}>Remove</button>        
            </div> 

        </div>
        ])  
        setCounter(count)       
    }

    
    const removeMarker = (id) => {
        let key = document.getElementById(id).getAttribute("value")
        delete markersDict[key]
        document.getElementById(id).remove()
    }

    const handleChangeMarker = (id, event, input) => {
        setMarkerKeyCounter(markerKeyCounter + 1) //Update the counter
        //Checks what is the input of the function and stores the input to a dictionary 
        if(input==="marker"){
            let inputError = validateMarker(event.target.value)
            if(inputError === true){
                alert("Error in marker input: There is no marker "+ event.target.value + " in the data")
            }
            else{
                markerTemp = {...markerTemp, marker:event.target.value}

            }
        }
        else if(input === "mainMarker"){
            let inputError = validateMarker(event.target.value)
            if(inputError === false){
                markerTemp = {...markerTemp, mainMarker:event.target.value}   
            }
            else{
                alert("Error in main marker input: There is no marker "+ event.target.value + " in the data")
            }
        }
        let exists = false
        //After the temp dictionary is filled store the properties to the main dictionary
        if(Object.values(markerTemp).filter(x => x === "").length === 0){
            Object.entries(markersDict).map(([key,value]) => {

                if(Object.keys(value)[0] === markerTemp["marker"] && Object.values(value)[0] === markerTemp["mainMarker"]){
                    exists = true
                }

            })
            if(exists === true){
                alert([markerTemp["marker"]]+" : "+markerTemp["mainMarker"] + " already exists, please change the input")
            }
            else{
                setMarkersDict({...markersDict,[markerKeyCounter]:{[markerTemp["marker"]]:markerTemp["mainMarker"]}})
            }
        }

    }

    function validateMarker(marker){
        let inputMarkers = []
        var regex = /^[a-zA-Z0-9!&|]+$/;
        let inputError = false

        if(!marker.match(regex)){
            alert("Error in input: Only letters, numbers and logical operators (!&|) are accepted.")
        }
        else{
            //Checks the logical operators the user inputted
            if(marker.includes("&") || marker.includes("|") || marker.includes("!")){
                inputMarkers = marker.split(/[&!|]+/) //Makes a list of the markers
            }
            else{
                //If the input didn't contain logical operators -> there was only one marker, hence we can put it directly to a list
                inputMarkers.push(marker)
            }
            //Loop that checks the user inputted a marker that that the tiff-images have
            for(let elem in inputMarkers){
                //If the marker is in the data returns false otherwise returns inputError true
                if(originalMarkers.includes(inputMarkers[elem])){ 
                    inputError = false
                }
                else{
                    inputError = true
                    break;
                }
            }
        }
        return inputError
    }

    // #################################################################### Settings for segmentation ################################################################################
    //Function which prepares the dropdown menu
    const segmentationInput = () => {
        //Set the models to dropdown
        setModelDropDown(
        <div class="dropbox">  
            <label for="model">Choose stardist model: </label>
            <select  name="model" id="model" onChange={event => handleChangeSelectModel(event)}>
                <option selected="true" disabled="disabled">Select</option>    
                <option value="HuNu">HuNu_model</option>
                <option value="ChAT">ChAT_model</option>
                <option value="LMX">LMX_TH_model</option>
                <option value="2D_versatile_fluo">2D_versatile_fluo</option>
            </select> 
        </div>)
     
    }
    //Checks the corresponding default threshold values for the selected model
    const handleChangeSelectModel = (event) => {
         
        let selectedModel = event.target.value
        setModel(selectedModel)
        if(selectedModel === "HuNu"){
            setProbThreshold("0.58")
            setOverlapThreshold("0.3")
        }
        else if(selectedModel === "ChAT"){
            setProbThreshold("0.3")
            setOverlapThreshold("0.3")
        }
        else if(selectedModel === "LMX"){
            setProbThreshold("0.06")
            setOverlapThreshold("0.30")
        }
        else if(selectedModel === "2D_versatile_fluo"){
            setProbThreshold("")
            setOverlapThreshold("")
        }

    }


    // ################################################################### Metadata for cell identification #####################################################################################

    //Input for cell type identification
    const maskingInput = (markers) => {   
        
        //Initialize drop down menu options for markers
        options = [<option value = "Select" selected="true" disabled="disabled">Select</option>]

        //First time the page rendered set the input fields
        if(maskingTextBox == 0){
            //Set the submitted markers to dropdown menu and to a list, which is later used to validate the input of cell area measuremnts
            Object.entries(markers).map(([key,index]) => {
                submitted_markers.push(Object.keys(markers[key])[0])
                options.push(<option value={Object.keys(markers[key])[0]}>{Object.keys(markers[key])[0]}</option>)       
            })

            //Initialize the id, the id is unique because maskCounter is updated after adding new item
            let mask_id = "maskInput_" + maskCounter
            let value_id = "value_" + maskCounter

            //set the options to the variable, which is now a dropdown menu
            setMarkerOptions(options)
        
            //set the input fields
            setMaskingTextBox(Object.entries(maskingTextBox+1).map(([key,index]) => {
            
                return(
                    <div  class="row" id={mask_id} >
                        <div class="col-1">  
                            <p>Cell type</p>
                            <input name = {mask_id} onChange={event => handleChangeMask(mask_id,event, "cellType", "add")}  size="10"/>  
                        </div>
                        <div class="col-2">   
                            <p>Marker</p>
                            <select  name = {mask_id} id="colorSelector" onChange={event => handleChangeMask(mask_id,event, "thresholdMarker", "add")}>
                                {options}
                            </select>           
                        </div>
                        <div class="col-3">  
                            <p>Threshold value</p>
                            <input id = {value_id} name = {mask_id} onChange={event => handleChangeMask(mask_id,event, "thresholdValue", "add")} size="10"/>                
                        </div>
                        <div class="col-4">  
                            <p>Color</p>
                            <select name = {mask_id} id="colorSelector" onChange={event => handleChangeMask(mask_id,event, "color", "add")}>
                                <option value = "Select" selected="true" disabled="disabled">Select</option>    
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                                <option value="yellow">Yellow</option>
                                <option value="green">Green</option>
                            </select>               
                        </div>
                        
                    </div>)
               
            }))
        }        
    }

    //add new cell type
    const addMasks = event =>{
 
        //Validates the input of previously added cell type
        //Chekcs that all values are filled
        if(maskTemp["thresholdMarker"] == "" || maskTemp["cellType"] == "" || maskTemp["thresholdValue"] == null || maskTemp["color"]==""){
            alert("Fill all the fields before adding new cell type")
        }
        //Checj that threshold value is NA or between 0-1
        else if((maskTemp["thresholdValue"] != "NA" && isNaN(maskTemp["thresholdValue"]) == true) || (isNaN(maskTemp["thresholdValue"]) == false && maskTemp["thresholdValue"] < 0 || maskTemp["thresholdValue"] > 1)){  
            alert("Only values between 0-1 or NA are accepted in threshold value textbox")
        }
        else{ //If no error in previous output add new input  fields
            setNewMask(false)
        
            let name = "maskInput_" + maskCounter
            //disable the previously added cell type, so that user can't edit it
            document.getElementsByName(name).forEach(e => {
                e.disabled = true
            })        
            //Update the counter and ID
            let count = maskCounter + 1
            let mask_id = "maskInput_" + count
            let value_id = "value_" + count
            setMaskCounter(count)


            //Create new inputfields
            setMaskingTextBox([...maskingTextBox,
            <div class="row" id={mask_id} >
                <div class="col-1">    
                    <p>Cell type</p>
                    <input name={mask_id}  onChange={event => handleChangeMask(mask_id,event, "cellType", "add")} size="10"/>                
                </div>
                <div class="col-2">    
                <p>Marker</p>
                    <select  name={mask_id} id="colorSelector" onChange={event => handleChangeMask(mask_id,event, "thresholdMarker", "add")}>
                        {markerOptions}
                    </select>     
                </div>
                <div class="col-3">    
                    <p>Threshold value</p>

                    <input id={value_id} name={mask_id}  disabled={Object.keys(maskDict).includes(maskKeyCounter-1)} onBlur={event => handleChangeMask(mask_id,event, "thresholdValue", "add")} size="10"/>                
                </div>
                <div class="col-4">    
                    <p>Color</p>
                    <select  name={mask_id} disabled={Object.keys(maskDict).includes(maskKeyCounter-1)} id="colorSelector" onChange={event => handleChangeMask(mask_id,event, "color", "add")}>
                                    <option value = "Select" selected="true" disabled="disabled">Select</option>    
                                    <option value="red">Red</option>
                                    <option value="blue">Blue</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="green">Green</option>
                    </select>                   
                </div>
            </div>
            ])  
            //Empty the temp variable
            maskTemp = ({cellType:"", thresholdMarker:"", thresholdValue:null, color:""})

        }
        
    }
    //Handels changes in the input fields
    const handleChangeMask = (id,event, input, call) => {
        setMaskKeyCounter(maskKeyCounter + 1) 
        
        //Checks from which component the function was called and stores the input to dictionary to the object
        if(input === "cellType"){
            maskTemp = {...maskTemp, cellType:event.target.value}  
        }
        else if(input === "thresholdMarker"){
                maskTemp = {...maskTemp, thresholdMarker:event.target.value}
        }
        else if(input === "thresholdValue"){   
                maskTemp ={...maskTemp, thresholdValue:event.target.value}   
        }
        else if(input === "color"){
            maskTemp ={...maskTemp, color:event.target.value}
        }
        if(Object.values(maskTemp).filter(x => x === "").length === 1){//counts the number of empty values
            setNewMask(true)
        }
        
        //After the temp dictionary is filled store the properties to the main dictionary
        if(call == "add"){
            if(Object.values(maskTemp).filter(x => x === "").length === 0){
                setMaskDict({...maskDict,[maskKeyCounter]:[{cell_type:maskTemp["cellType"]},{ threshold_marker:maskTemp["thresholdMarker"]}, {threshold_value:maskTemp["thresholdValue"]}, {color:maskTemp["color"]}]})     
            }   
        } //If the call came from reset we don't want to use the spread operator beacuse now we are updating to an empty array
        else if(call =="reset"){
            if(Object.values(maskTemp).filter(x => x === "").length === 0){
                setMaskDict({[maskKeyCounter]:[{cell_type:maskTemp["cellType"]},{ threshold_marker:maskTemp["thresholdMarker"]}, {threshold_value:maskTemp["thresholdValue"]}, {color:maskTemp["color"]}]})     
            }   
        }
         
    }

    //Resets the cell type identification form and empties the temp directory
        const resetMask = () => {
            maskTemp = ({cellType:"", thresholdMarker:"", thresholdValue:null, color:""})

            let name = "maskInput_" + 0
            //Removes the disabled property
            document.getElementsByName(name).forEach(e => {
                e.disabled = false
                e.value = ""
            })        

            //reinitialize the values
            setMaskDict([{}])
            setMaskCounter(0)
            let mask_id = "maskInput_0"
            let value_id = "value_0"

            //Set new input fields after resetting the form
            setMaskingTextBox([
                <div class="row" id={mask_id}>
                    <div class="col-1">  
                        <p>Cell type</p>
                        <input name = {mask_id} onChange={event => handleChangeMask(mask_id,event, "cellType", "reset")}  size="10"/>  
                    </div>
                    <div class="col-2">   
                        <p>Marker</p>
                        <select  name = {mask_id} id="colorSelector" onChange={event => handleChangeMask(mask_id,event, "thresholdMarker", "reset")}>
                            {options}
                        </select>           
                    </div>
                    <div class="col-3">  
                        <p>Threshold value</p>
                        <input id = {value_id} name = {mask_id} onChange={event => handleChangeMask(mask_id,event, "thresholdValue", "reset")} size="10"/>                
                    </div>
                    <div class="col-4">  
                        <p>Color</p>
                        <select  name = {mask_id} id="colorSelector" onChange={event => handleChangeMask(mask_id,event, "color", "reset")}>
                            <option value = "Select" selected="true" disabled="disabled">Select</option>    
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                            <option value="yellow">Yellow</option>
                            <option value="green">Green</option>
                            <option value="purple">Purple</option>
                            <option value="orange">Orange</option>
                        </select>               
                    </div>
                    
                </div>])
           
            
    }
    

    //#################################################################### Input for cell intensity measurements ######################################################################################

    //set the input field for intensity measurements
    const intensityInput = () => {

        setIntensityTb(
        <div>
            <br></br>
            <label for="intensity" >Cell type: </label>
            <input id = "intensity" size="10" onChange={event => handleChangeIntensity(event)}></input>
        </div>)   
    }
    //Handles change in intensity input field
    const handleChangeIntensity = (event) => {
        setIntensityCellType(event.target.value)
    }
    
    //######################################################################## Input for cell area measurements ###########################################################################
    //Prepares the input field for cell area measurements
    const cellAreaInput = () => {
        let area_id = "cellAreaInput_" + cellAreaCounter
        if(Object.keys(cellAreaTb).length === 0){
            setCellAreaTb([...cellAreaTb,<div>
                <br></br>
                <label for={area_id} >Cell type(s) to measure: </label>
                <input id = {area_id} size="20" onChange={event => handleChangeCellArea(event,"add")}></input>
                </div>
            ])
        }
        
    }

    //Handles change in cell area measurement input field
    const handleChangeCellArea = (event, call) => {
        if(!cellAreaList.includes(event.target.value) & call != "reset"){
            setCellAreaList([...cellAreaList, event.target.value])
        }
        else if(call == "reset"){
            setCellAreaList([event.target.value])
        }
    }

    //reset the textboxes of cell area measurement
    const resetCellArea = () => {
    
        //Empties the input field and removes the diabled property
        document.getElementById("cellAreaInput_0").value = ""
        document.getElementById("cellAreaInput_0").removeAttribute("disabled")

        //Updates statevariables
        setCellAreaList([])
        setCellAreaCounter(0)
        
        //Add new cell area measuement inputfields
        setCellAreaTb([<div id="firstArea">
            <br></br>
            <label for="cellAreaInput_0" >Cell type(s) to measure: </label>
            <input id = "cellAreaInput_0" size="20" onChange={event => handleChangeCellArea(event, "reset")}></input>
            </div>
          
        ])       
    }
    //Add more cell area measurement inputfields
    const addCells = (event) => {    
            //disable the previous input
            document.getElementById("cellAreaInput_"+cellAreaCounter).setAttribute("disabled","disabled")
            //Update variables
            let counter = cellAreaCounter + 1
            let area_id = "cellAreaInput_" + counter
            setCellAreaCounter(counter)

            //Create html element
            setCellAreaTb([...cellAreaTb,
                
                <div> 
                    <label for="cellArea" >Cell type(s) to measure: </label>
                    <input id={area_id} size="20" onChange={event => handleChangeCellArea(event, "add")}></input>

                </div>
            
            ])     
    }

    //Show instructions to the user
    const showInstructions = ( arg1, arg2, arg3) => {
        document.getElementById(arg1).style.display="block"
        document.getElementById(arg2).style.display="none"
        document.getElementById(arg3).style.display="block"    
      }
    //Hide instructions
    const hideInstructions = (arg1, arg2, arg3) =>{
        document.getElementById(arg1).style.display="none"
        document.getElementById(arg2).style.display="block"
        document.getElementById(arg3).style.display="none"
    }


      
   
    
    //############################################################################# HTML form to be rendered ###############################################################################################

    return(
        <div>
            <form class="metadataForm">

                {renderArea ? (
                    <div>
                    <React.Fragment> 
                        <b>Measurement of positive-marker areas</b>
                         <br></br>

                        <div class="row">
                                <div class="col-1">    
                                    <p>Marker</p>
                                </div>
                                <div class="col-2">    
                                    <p>Main marker</p>
                            </div>
                        </div>
                        {markerTextBox}
                        <button type="button" onClick={addMarkers}>Add markers</button>

                    </React.Fragment>
                    </div>                  
                ):(<></>)} 
                <br></br>
                <br></br>

                {renderSegmentation ? (
                    <div>
                    <React.Fragment> 
                    <div class="row">
                            <div class="col-1">
                                <b>Cell segmentation</b>
                            </div>
                            <div class="col-2">
                                <div id = "infoBtnSegment" class="btn-instructions2">  
                                    <button type="button" onClick={() => showInstructions("instructionsSegment", "infoBtnSegment", "hideInfoBtnSegment")}>Info</button>
                                </div>  
                                <div  hidden id = "hideInfoBtnSegment" class="btn-instructions2">  
                                    <button type="button" onClick={() => hideInstructions("instructionsSegment", "infoBtnSegment", "hideInfoBtnSegment")}>Hide info</button>
                                </div>  
                            </div>
                    </div>
                    <br></br>

                    <div class="row">
                        {modelDropDown}
                    </div>
                    <div class="row">
                        <div class="col-1">    
                            <p >Probability threshold</p>
                            <input value = {probTreshold} onChange={(e)=>setProbThreshold(e.target.value)}/>                
                        </div>
                        <div class="col-2">    
                            <p>Overlap threshold</p>
                            <input value= {overlapThreshold} onChange={(e)=>setOverlapThreshold(e.target.value)}/>
                        </div>
                    </div>
                    <div hidden id="instructionsSegment" class="textarea-container">    
                        <p disabled readonly rows="20" cols="50">
                            <b>Instructions:<br></br><br></br></b>
                            <b>Choose StarDist model: </b>Model to be used in cell segmentation.<br></br>
                            <b>Probability threshold: </b>Higher values leads to fewer segmented objects, but will likely avoid false positives.<br></br> 
                            <b>Overlap threshold: </b>Higher values allow segmented objects to overlap substantially.<br></br>
                            
                        </p>        
                    </div>
                                               
                    </React.Fragment>
                    </div>                  
                ):(<></>)
                
                }    
                <br></br>
                <br></br>

                {renderMasking ? (
                    <div>
                    <React.Fragment> 
                        <div class="row">
                            <div class="col-1">
                                <b>Cell type identification</b>
                            </div>
                            <div class="col-2">
                                <div id = "infoBtnIdentification" class="btn-instructions2">  
                                    <button type="button" onClick={() => showInstructions("instructionsIdentification", "infoBtnIdentification", "hideInfoBtnIdentification")}>Info</button>
                                </div>  
                                <div  hidden id = "hideInfoBtnIdentification" class="btn-instructions2">  
                                    <button type="button" onClick={() => hideInstructions("instructionsIdentification", "infoBtnIdentification", "hideInfoBtnIdentification")}>Hide info</button>
                                </div>  
                            </div>
                        </div>

                        {maskingTextBox}
                        <button type="button" onClick={addMasks}>New cell type</button>&nbsp;&nbsp;&nbsp;
                        <button type="button" onClick={() => resetMask()}>Reset</button>

                        <div hidden id="instructionsIdentification" class="textarea-container">    
                            <p disabled readonly rows="20" cols="50">
                                <b>Instructions: <br></br><br></br></b>
                                <b>Cell type: </b>Name of cell type.<br></br>
                                <b>Marker: </b>Marker corresponding the cell type. Should correspond a label column in submit samples page.<br></br> 
                                <b>Threshold value: </b>1 - fraction of area overlap between the segmented object and the thresholded image. Object is classified as a cell, if it overlaps the mask by fraction higher than threshold marker. Higher threshold value leads to more objects classified as cells. Values between 0-1 or NA to classify all segmented objects to cells.<br></br>
                                <b>Color: </b>Color used to represent this cell type<br></br>
                                
                            </p>        
                        </div>
                        

                    </React.Fragment>
                    </div>                  
                ):(<></>)
                
                }    

                <br></br>
                <br></br>

                {renderIntensity ? (
                    <div>
                    <React.Fragment> 
                        <div class="row">
                            <div class="col-1">
                                 <b>Pixel intensity measurement between groups</b>  
                            </div>
                            <div class="col-2">
                                <div id = "infoBtnIntensity" class="btn-instructions2">  
                                    <button type="button" onClick={() => showInstructions("instructionsIntensity", "infoBtnIntensity", "hideInfoBtnIntensity")}>Info</button>
                                </div>  
                                <div  hidden id = "hideInfoBtnIntensity" class="btn-instructions2">  
                                    <button type="button" onClick={() => hideInstructions("instructionsIntensity", "infoBtnIntensity", "hideInfoBtnIntensity")}>Hide info</button>
                                </div>  
                            </div>
                        </div>

                        {intensityTb}
                        <div hidden id="instructionsIntensity" class="textarea-container">    
                            <p disabled readonly rows="20" cols="50">
                                <b>Instructions:<br></br><br></br></b>
                                <b>Cell type: </b>Name of cell type to perform the intensity analysis, should match one of the cell types in cell type identification.<br></br>
                                
                            </p>        
                        </div>
                    </React.Fragment>
                    
                    </div>                  
                ):(<></>)
                
                }    

                <br></br>
                <br></br>

                {renderCellArea ? (
                    <div>
                    <React.Fragment> 
                        <div class="row">
                            <div class="col-1">
                                <b>Cell area measurements</b> 
                            </div>
                            <div class="col-2">
                                <div id = "infoBtnCellArea" class="btn-instructions2">  
                                    <button type="button" onClick={() => showInstructions("instructionsCellArea", "infoBtnCellArea", "hideInfoBtnCellArea")}>Info</button>
                                </div>  
                                <div  hidden id = "hideInfoBtnCellArea" class="btn-instructions2">  
                                    <button type="button" onClick={() => hideInstructions("instructionsCellArea", "infoBtnCellArea", "hideInfoBtnCellArea")}>Hide info</button>
                                </div>  
                            </div>
                        </div>
                        <div> 
                            <br></br>
                            <label for="fraction" >Co-expression fraction: </label>
                            <input id = "fraction" size="6" onChange={(event) => setExpressionFraction(event.target.value)}></input>
                             

                        </div>     
                        {cellAreaTb}
                        <button type="button" onClick={addCells}>Add new</button>&nbsp;&nbsp;&nbsp;
                        <button type="button" onClick={() => resetCellArea()}>Reset</button>
                        <br></br>

                        <div hidden id="instructionsCellArea" class="textarea-container">    
                            <p disabled readonly rows="20" cols="50">
                                <b>Instructions:<br></br><br></br></b>
                                <b>Co-expression fraction: </b>Value between 0-1. Describes the overlap fraction between two cells to be classified as co-expression. This need's to be specified even if you don't measure for douple positive cells.<br></br>
                                <b>Cell type(s) to measure: </b> Cell type(s) used to compute the area positve for cell type. To measure douple cells separate the different cell types with "/" (cell1/cell2), i.e cell1 which are also cell2. Measuring triple positive cells is also possible (cell1/cell2/cell3), i.e cell1 which is also positive for cell2 and cell3. Input cells needs to match the cell types listed above in cell type identification form.<br></br>
                                
                            </p>        
                        </div>
                    </React.Fragment>
                    </div>                  
                ):(<></>)
                
                }   

            <br></br>
            <br></br>

             
            </form>
            
        </div>
        ) 
})
export default GetMetadata;
