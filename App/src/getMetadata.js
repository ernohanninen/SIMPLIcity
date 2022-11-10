import React,  { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from "axios";
import './App.css';







//If no markers prevent user to go forward add new textbox
//able user input non unique markers
//adding custom markers doesn't work
//Add random color generator for mask input
//Using boolean it should be possible to check wether the input is filled before adding more mask metadata
//If there is no marker the axios posts still sends data
//Even if the area is unchecked the axios posts the data that is submitted on the main page (CHECK THAT THIS IS FIXED)
//Delete existing marker from marker list

//Check that the colors for cell_masking_metadata are okay
var options = []
var maskTemp = ({cellType:"", thresholdMarker:"", thresholdValue:null, color:""})
var submitted_markers = []

const GetMetadata = forwardRef((props, ref)=>{

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
                        response[0][prop] = (response[0][prop] == 'true' || response[0][prop] == 'false')? response[0][prop] === 'true': response[0][prop] ;
                    }
                } 
                //Check that all the processes which are dependent on each other is checked
                //Alert user if some of the required processes is not checked
                if(response[0].instrument == ""){
                    alert("Select source of images")
                }
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
                    if(response[0].execute_area == true){
                        console.log("EXECUTE AREA")                   
                        setRenderArea(true)
                        setMarkerTextBox("")
                        let markers = response[1] //dictionary of markers
                        allMarkersChecked(markers)
                        setOriginalMarkers(response[2])
                        
                    }
                    else if(response[0].execute_area == false)setRenderArea(false)
                    
                    if(response[0].execute_sd_segmentation == true){
                        console.log("Execute segmentation")
                        setRenderSegmentation(true)
                        segmentationInput()
                    }
                    else if(response[0].execute_sd_segmentation == false)setRenderSegmentation(false)
                    if(response[0].execute_cell_type_identification == true){
                        let markers = response[1]
                        setRenderMasking(true)
                        maskingInput(markers)
                        console.log("RENDER SOMETHING")
                    }
                    else if(response[0].execute_cell_type_identification == false){
                        setRenderMasking(false)
                        setMaskingTextBox("")
    
                    }

                    if(response[0].execute_intensity == true){
                        setRenderIntensity(true)
                        intensityInput()
                    }
                    else if(response[0].execute_intensity == false)setRenderIntensity(false)

                    if(response[0].execute_measure_cell_areas == true){
                        setRenderCellArea(true)
                        cellAreaInput()
                    }
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

        //Function which makes a request call to the backend
        submitMetadata(){
            console.log("SUBMIT METADATA")
            console.log(renderCellArea)
            let error = false
            console.log(maskTemp)
            console.log(maskDict)
            var temp_list_markers = []
            if(maskTemp["thresholdMarker"] != ""){
                for(let i = 0;i < Object.values(maskDict).length; i++){
                    console.log(Object.values(Object.values(maskDict)[i])[1]["threshold_marker"])
                    temp_list_markers.push(Object.values(Object.values(maskDict)[i])[1]["threshold_marker"])
                }
                console.log(temp_list_markers)
                console.log(submitted_markers)

            }
            

            if(renderSegmentation == true && model =="" || probTreshold == "" || overlapThreshold == "" || isNaN(probTreshold) != false || isNaN(overlapThreshold) != false || probTreshold < 0 || probTreshold > 1 || overlapThreshold < 0 || overlapThreshold > 1){
                alert("Error in model or thresholds in cell segmentation settings. Probability and overlap threshold should have value between 0-1")
                error = true
            }   
            else if(renderMasking == true && maskTemp["thresholdMarker"] == "" || maskTemp["cellType"] == "" || maskTemp["thresholdValue"] == null || maskTemp["color"]==""){
                alert("Fill all the fields in cell type identification before proceeding")
                error = true
            }
            //else if((maskTemp["thresholdValue"] != "NA") && (maskTemp["thresholdValue"] < 0 || maskTemp["thresholdValue"] > 1)){
            else if((maskTemp["thresholdValue"] != "NA" && isNaN(maskTemp["thresholdValue"]) == true) || (isNaN(maskTemp["thresholdValue"]) == false && maskTemp["thresholdValue"] < 0 || maskTemp["thresholdValue"] > 1)){
                alert("Only values between 0-1 or NA are accepted in threshold value textbox")
                error = true
            }
            else if(temp_list_markers.length != submitted_markers.length){
                alert("All the submitted markers on submit sample page should be identified")
                error = true
            }
            else if(submitted_markers.every((item)=>temp_list_markers.includes(item))==false){
                alert("All the submitted markers on submit sample page should be identified_")
                error = true
            }
            else if(renderIntensity == true){
                let boolIntensity = false
                for(let i = 0;i < Object.values(maskDict).length; i++){
                    if(Object.values(Object.values(maskDict)[i])[0]["cell_type"] == intensityCellType){
                        boolIntensity = true
                    }
                }
                if(boolIntensity == false){
                    error = true
                    alert("Cell type in pixel intensity form should match one of the cell types in cell type identification")
                }      
            }
            if(renderCellArea == true && error==false){
                if(isNaN(expressionFraction)!=false || expressionFraction=="" || expressionFraction < 0 || expressionFraction > 1){
                    error = true
                    alert("Co-expression factor should set between 0-1")
                }
                if(error == false){
                    var temp_list_comparison = []
                    let temp_list_types = []
                    let boolCellArea = true
                    for(let i = 0; i < cellAreaList.length; i++){
                        if(cellAreaList[i].includes("/")){
                            let cells = cellAreaList[i].split("/")
                            temp_list_comparison = temp_list_comparison.concat(cells)
                        }
                        else{
                            temp_list_comparison.push(cellAreaList[i])
                        }
                        console.log(temp_list_comparison)
                    }
                    for(let i = 0;i < Object.values(maskDict).length; i++){
                        temp_list_types.push(Object.values(Object.values(maskDict)[i])[0]["cell_type"])
                    }
                    console.log(temp_list_types)
                    if(!temp_list_comparison.every(r => temp_list_types.includes(r))){
                        boolCellArea = false
                    }
                    if(boolCellArea == false){
                        error = true
                        alert("Some cell type(s) in cell area measurement form doesn't match the cell types in cell type identification")
                    }
                }
            }
            console.log(error)
            if(error == false) {
                 //store the parameters for segmentation to dictionary
                let segmentingDict = {"model" : model, "probThreshold": probTreshold, "overlapThreshold": overlapThreshold}

                const url = '/submitMetadata'; //url for the request
                //send data to backend
                axios.post(url, { 
                    "markers": markersDict,
                    "segmentingSettings" : segmentingDict,
                    "masks": maskDict,
                    "intensityCellType" : intensityCellType,
                    "fraction" : expressionFraction,
                    "cellAreaList" : cellAreaList
                    })
                    //Handle the response
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
                //Display load element
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
                        else{ //IF everyting okay

                            console.log("Analysis ready")
                            //Display results page for user

                            if(response.data.includes("Error")){
                                document.getElementById("pipelineStatus").innerHTML = "An error occured during the analysis. The error can be tracked from the message below or from nextflow.log file. Note, some of the results are missing because of the error."
                            }
                            else{
                                document.getElementById("pipelineStatus").innerHTML = "The pipeline ran successfully, please display the results"
                                
                            }
                            //'{Object.values(Object.values(maskDict)[i])[0]['color']}'
                            let color_elem = []
                            for(let i = 0;i < Object.values(maskDict).length; i++){
                                color_elem +=  Object.values(Object.values(maskDict)[i])[3]['color'] + ": " + Object.values(Object.values(maskDict)[i])[0]['cell_type'] + "     "
                            }


                            //color_elem+= Object.values(Object.values(maskDict)[i])[3]['color'] + ":"+ Object.values(Object.values(maskDict)[i])[0]["cell_type"] + "  "
                            console.log(color_elem)

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

    const allMarkersChecked = (markers) => {    
            console.log("ORIGINAL MARKERS", markers)
            setMarkersDict(markers)
            let count = -1;

            //let markers = originalMarkers //Using a temp list because the state variable doesn't update immediately 
            console.log(markers)
            console.log("MARKERS LENGTH : ", Object.keys(markers).length)
            setMarkerKeyCounter(Object.keys(markers).length) 

            setMarkerTextBox(Object.entries(markers).map(([key,index]) => {
                let obj = markers[key]
                console.log(obj)
                let marker = Object.keys(obj)[0]
                console.log(marker)
                //if(marker in originalMarkers){//THis doesn't work because the marker is located in 0:{marker:mainMarker}
                    console.log("INCLUDES")
                    count = count + 1
                    let id = "marker" + count
                    setCounter(count)  

                    console.log(count)
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

    const addMarkers = event =>{
        console.log(markersDict)
        console.log(counter)
        //Disables element after new one is added
        if(Object.keys(markersDict).includes(counter.toString())){
            let name = "marker" + counter
            console.log(name)
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
            console.log(inputError)
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
            console.log("OBJECT ENTRIES")
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
        console.log("INPUMarker", marker)
        var regex = /^[a-zA-Z0-9!&|]+$/;
        let inputError = false

        if(!marker.match(regex)){
            alert("Error in input: Only letters, numbers and logical operators (!&|) are accepted.")
        }
        else{
            console.log("VALIDATE")
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
                console.log(elem)
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
    const segmentationInput = () => {
        console.log("SEGMENTATION")

        setModelDropDown(
        <div class="dropbox">  
            <label for="model">Choose stardist model: </label>
            <select  name="model" id="model" onChange={event => handleChangeSelectModel(event)}>
                <option selected="true" disabled="disabled">Select</option>    
                <option value="HuNu">HuNu_model</option>
                <option value="TH">TH_model</option>
                <option value="ChAT">ChAT_model</option>
                <option value="LMX">LMX_TH_model</option>
                <option value="2D_versatile_fluo">2D_versatile_fluo</option>
            </select> 
        </div>)
     
    }

    const handleChangeSelectModel = (event) => {
         
        let selectedModel = event.target.value
        setModel(selectedModel)
        if(selectedModel === "HuNu"){
            setProbThreshold("0.58")
            setOverlapThreshold("0.3")
        }
        else if(selectedModel === "TH"){
            setProbThreshold("0.5")
            setOverlapThreshold("0.5")
        }
        else if(selectedModel === "ChAT"){
            setProbThreshold("0.4")
            setOverlapThreshold("0.4")
        }
        else if(selectedModel === "LMX"){
            setProbThreshold("0.20")
            setOverlapThreshold("0.15")
        }
        else if(selectedModel === "2D_versatile_fluo"){
            setProbThreshold("0.6")
            setOverlapThreshold("0.4")
        }

        console.log("MODEL :" , selectedModel)
    }


    // ################################################################### Metadata for cell identification #####################################################################################

    const maskingInput = (markers) => {   
        
        options = [<option value = "Select" selected="true" disabled="disabled">Select</option>]

        
        
        if(maskingTextBox == 0){

            Object.entries(markers).map(([key,index]) => {
                submitted_markers.push(Object.keys(markers[key])[0])
                options.push(<option value={Object.keys(markers[key])[0]}>{Object.keys(markers[key])[0]}</option>)       
            })

            let mask_id = "maskInput_" + maskCounter
            let value_id = "value_" + maskCounter
            console.log(mask_id)
            
            console.log("OPTIONS : ", options)
            setMarkerOptions(options)

        
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
                                <option value="purple">Purple</option>
                                <option value="orange">Orange</option>
                            </select>               
                        </div>
                        
                    </div>)
               
            }))
        }        
    }

    const addMasks = event =>{
        console.log(maskTemp["thresholdValue"])
        console.log(typeof maskTemp["thresholdValue"])
        console.log(maskTemp)
        console.log(newMask)
        if(maskTemp["thresholdMarker"] == "" || maskTemp["cellType"] == "" || maskTemp["thresholdValue"] == null || maskTemp["color"]==""){
            alert("Fill all the fields before adding new cell type")
        }
        
        else if((maskTemp["thresholdValue"] != "NA" && isNaN(maskTemp["thresholdValue"]) == true) || (isNaN(maskTemp["thresholdValue"]) == false && maskTemp["thresholdValue"] < 0 || maskTemp["thresholdValue"] > 1)){  
            alert("Only values between 0-1 or NA are accepted in threshold value textbox")
        }
        else{
            setNewMask(false)
            console.log(maskCounter)
            console.log("maskInput_"+maskCounter)

            
            //document.getElementById("maskInput_"+maskCounter).setAttribute("disabled","")
           // document.getElementsByName("mask0").setAttribute("disabled", "disabled")

            //This is a bit in a wrong place, the last row is never disabled
            //Disables element after new one is added
            /*if(Object.keys(maskDict).includes(maskCounter.toString())){
                let name = "mask" + maskCounter
                document.getElementsByName(name).forEach(e => {
                    e.disabled = true
                })        
            }*/

            //if(Object.keys(maskDict).includes(maskCounter.toString())){
                let name = "maskInput_" + maskCounter
                document.getElementsByName(name).forEach(e => {
                    e.disabled = true
                })        
            //}

            //let mask_id = "maskInput_" + maskCounter
            let count = maskCounter + 1
            let mask_id = "maskInput_" + count
            let value_id = "value_" + count
            setMaskCounter(count)
            
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
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>

                    </select>      
                                
                </div>
               

            </div>
            ])  
            maskTemp = ({cellType:"", thresholdMarker:"", thresholdValue:null, color:""})

        }
        
    }

    const handleChangeMask = (id,event, input, call) => {
        console.log("MASK LENGTH : ", Object.values(maskTemp).filter(x => x === "").length)
        setMaskKeyCounter(maskKeyCounter + 1) 
        //console.log("MaskKeyCounter," , maskKeyCounter)
        //Makes sure that all the fields are filled before adding new cell type
        
        //Checks what is the input of the function and stores the input to dictionary to right location
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
        console.log(maskTemp)
        console.log(maskDict)
        //After the temp dictionary is filled store the properties to the main dictionary
        if(call == "add"){
            if(Object.values(maskTemp).filter(x => x === "").length === 0){
                setMaskDict({...maskDict,[maskKeyCounter]:[{cell_type:maskTemp["cellType"]},{ threshold_marker:maskTemp["thresholdMarker"]}, {threshold_value:maskTemp["thresholdValue"]}, {color:maskTemp["color"]}]})     
            }   
        }
        else if(call =="reset"){
            if(Object.values(maskTemp).filter(x => x === "").length === 0){
                setMaskDict({[maskKeyCounter]:[{cell_type:maskTemp["cellType"]},{ threshold_marker:maskTemp["thresholdMarker"]}, {threshold_value:maskTemp["thresholdValue"]}, {color:maskTemp["color"]}]})     
            }   
        }
         
    }

    //Removes the mask metadata input field and the corresponding property from the dictionary

    const resetMask = () => {
        //document.getElementsByName("mask0").value = ""
        //document.getElementsByName("mask0").removeAttribute("disabled")
        //document.getElementById("maskInput_0").disabled = false
        maskTemp = ({cellType:"", thresholdMarker:"", thresholdValue:null, color:""})

        //if(Object.keys(maskDict).includes(maskCounter.toString())){
            let name = "maskInput_" + 0

            document.getElementsByName(name).forEach(e => {
                console.log(e)
                e.disabled = false
                e.value = ""
            })        
        //}

        setMaskDict([{}])
        setMaskCounter(0)
        let mask_id = "maskInput_0"
        let value_id = "value_0"

        

        //setMaskngTextBox(Object.entries(maskingTextBox+1).map(([key,index]) => {
            
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
    console.log(analysisReady)
    

    //#################################################################### Input for cell intensity measurements ######################################################################################

    const intensityInput = () => {

        setIntensityTb(
        <div>
            <br></br>
            <label for="intensity" >Cell type: </label>
            <input id = "intensity" size="10" onChange={event => handleChangeIntensity(event)}></input>
        </div>)   
    }

    const handleChangeIntensity = (event) => {
        setIntensityCellType(event.target.value)
        console.log(event.target.value)
    }

    const cellAreaInput = () => {
        //let counter = cellAreaCounter + 1
        let area_id = "cellAreaInput_" + cellAreaCounter
        //setCellAreaCounter(counter)
        if(Object.keys(cellAreaTb).length === 0){
            setCellAreaTb([...cellAreaTb,<div>
                <br></br>
                <label for={area_id} >Cell type(s) to measure: </label>
                <input id = {area_id} size="15" onChange={event => handleChangeCellArea(event,"add")}></input>
                </div>
            ])
        }
        
    }

    //######################################################################## Input for cell area measurements ###########################################################################

    const handleChangeCellArea = (event, call) => {
        if(!cellAreaList.includes(event.target.value) & call != "reset"){
            setCellAreaList([...cellAreaList, event.target.value])
        }
        else if(call == "reset"){
            setCellAreaList([event.target.value])
        }
    }

    const resetCellArea = () => {
    
        document.getElementById("cellAreaInput_0").value = ""
        document.getElementById("cellAreaInput_0").removeAttribute("disabled")


        setCellAreaList([])
        setCellAreaCounter(0)
        
        setCellAreaTb([<div id="firstArea">
            <br></br>
            <label for="cellAreaInput_0" >Cell type(s) to measure: </label>
            <input id = "cellAreaInput_0" size="15" onChange={event => handleChangeCellArea(event, "reset")}></input>
            </div>
          
        ])       
    }

    const addCells = (event) => {    
            //setCellAreaTb()
            console.log(cellAreaList)
            document.getElementById("cellAreaInput_"+cellAreaCounter).setAttribute("disabled","disabled")

            let counter = cellAreaCounter + 1
            let area_id = "cellAreaInput_" + counter
            setCellAreaCounter(counter)


            setCellAreaTb([...cellAreaTb,
                
                <div> 
                    <label for="cellArea" >Cell type(s) to measure: </label>
                    <input id={area_id} size="15" onChange={event => handleChangeCellArea(event, "add")}></input>

                </div>
            
            ])     
    }


    const showInstructions = ( arg1, arg2, arg3) => {
        //setInfo()
        console.log(arg1, arg2, arg3)
        document.getElementById(arg1).style.display="block"
        document.getElementById(arg2).style.display="none"
        document.getElementById(arg3).style.display="block"    
      }
    
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
                                <b>Co-expression fraction: </b>Value between 0-1. Describes the overlap threshold between two cells to be classified as co-expression. This need's to be specified even if you don't measure for douple positive cells.<br></br>
                                <b>Cell type(s) to measure: </b> Cell type(s) used to compute the area positve for cell type. To measure douple cells separate the different cell types with "/" (cell1/cell2), i.e cell1 which are also cell2. Cells should match the cell types listed above in cell type identification form.<br></br>
                                
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
//<div>{allMarkers && <p>Loading...</p>}</div>#setAllMarkes(!allMarkers);
