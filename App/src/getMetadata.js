import React,  { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from "axios";
import './App.css';
import GetResults from "./getResults.js"





//If no markers prevent user to go forward add new textbox
//able user input non unique markers
//adding custom markers doesn't work
//Add random color generator for mask input
//Using boolean it should be possible to check wether the input is filled before adding more mask metadata
//If there is no marker the axios posts still sends data
//Even if the area is unchecked the axios posts the data that is submitted on the main page (CHECK THAT THIS IS FIXED)
//Delete existing marker from marker list

//Check that the colors for cell_masking_metadata are okay

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
    let maskTemp = ({cellType:"", thresholdMarker:"", thresholdValue:"", color:""})
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
                else if(response[0].execute_sd_segmentation == false || response[0].execute_cell_type_identification == true && response[0].execute_intensity == true && response[0].execute_measure_cell_areas == true && response[0].execute_cell_clustering == true && response[0].execute_cell_thresholding == true && response[0].execute_homotypic_interactions == true && response[0].execute_heterotypic_interactions == true && response[0].execute_permuted_interactions == true){
                    alert("To run cell-based analysis, check image segmentation")
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

            //store the parameters for segmentation to dictionary
            let segmentingDict = {"model" : model, "probThreshold": probTreshold, "overlapThreshold": overlapThreshold}

            const url = '/submitMetadata'; //url for the request
            //send data to backend
            axios.post(url, { 
                "markers": markersDict,
                "segmentingSettings" : segmentingDict,
                "masks": maskDict,
                "intensityCellType" : intensityCellType,
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
                        document.getElementById('load').style.display = 'none';
                        document.getElementById('results').style.display = 'block';                   
                    }
            });      
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
                <option value="LMX">LMX_model</option>
                <option value="2D_versatile_fluo">2D_versatile_fluo</option>
            </select> 
        </div>)
     
    }

    const handleChangeSelectModel = (event) => {
         
        let selectedModel = event.target.value
        setModel(selectedModel)
        if(selectedModel === "HuNu"){
            setProbThreshold("0.6")
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
            setProbThreshold("0.6")
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
        console.log("MASKING")
        console.log(markers)
        console.log(typeof markers)
        let id = "mask0" 
        let options = [<option value = "Select" selected="true" disabled="disabled">Select</option>]

        Object.entries(markers).map(([key,index]) => {
            console.log(Object.keys(markers[key])[0])
            options.push(<option value={Object.keys(markers[key])[0]}>{Object.keys(markers[key])[0]}</option>)

           
        })
        console.log("OPTIONS : ", options)
        setMarkerOptions(options)
        //If you go back to previous page, this code mess up
        if(maskingTextBox === ""){
            setMaskingTextBox(Object.entries(maskingTextBox+1).map(([key,index]) => {
            
                return(
                    <div class="row" id={id}>
                        <div class="col-1">  
                            <p>Cell type</p>
                            <input name = "mask0" onBlur={event => handleChangeMask(id,event, "cellType")}  size="10"/>  
                        </div>
                        <div class="col-2">   
                            <p>Marker</p>
                            <select  name="mask0" id="colorSelector" onChange={event => handleChangeMask(id,event, "thresholdMarker")}>
                                {options}
                            </select>           
                        </div>
                        <div class="col-3">  
                            <p>Threshold value</p>
                            <input name = "mask0"  onBlur={event => handleChangeMask(id,event, "thresholdValue")} size="10"/>                
                        </div>
                        <div class="col-4">  
                            <p>Color</p>
                            <select  name="mask0" id="colorSelector" onChange={event => handleChangeMask(id,event, "color")}>
                                <option value = "Select" selected="true" disabled="disabled">Select</option>    
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                                <option value="yellow">Yellow</option>
                                <option value="green">Green</option>
                                <option value="purple">Purple</option>
                                <option value="orange">Orange</option>
                            </select>               
                        </div>
                        <div class="col-remove">
                            <button onClick={() => removeMask(id, maskKeyCounter)}>Remove</button>        
                        </div> 
                    </div>)
               
            }))
        }
        
    }

    const addMasks = event =>{

        console.log(newMask)
        if(newMask === false){
            alert("Fill all the fields before adding new cell type")
        }
        else{
            setNewMask(false)

            //This is a bit in a wrong place, the last row is never disabled
            //Disables element after new one is added
            if(Object.keys(maskDict).includes(maskCounter.toString())){
                let name = "mask" + maskCounter
                document.getElementsByName(name).forEach(e => {
                    e.disabled = true
                })        
            }
            let count = maskCounter + 1
            let id = "mask" + count
            setMaskCounter(count)
            
            setMaskingTextBox([...maskingTextBox,
            <div class="row" id={id} >
                <div class="col-1">    
                    <p>Cell type</p>
                    <input name={id}  onBlur={event => handleChangeMask(id,event, "cellType")} size="10"/>                
                </div>
                <div class="col-2">    
                <p>Marker</p>
                    <select  name="mask0" id="colorSelector" onChange={event => handleChangeMask(id,event, "thresholdMarker")}>
                        {markerOptions}
                    </select>     
                </div>
                <div class="col-3">    
                    <p>Threshold value</p>

                    <input name={id} disabled={Object.keys(maskDict).includes(maskKeyCounter-1)} onBlur={event => handleChangeMask(id,event, "thresholdValue")} size="10"/>                
                </div>
                <div class="col-4">    
                    <p>Color</p>
    

                    <select  name={id} disabled={Object.keys(maskDict).includes(maskKeyCounter-1)} id="colorSelector" onChange={event => handleChangeMask(id,event, "color")}>
                                    <option value = "Select" selected="true" disabled="disabled">Select</option>    
                                    <option value="red">Red</option>
                                    <option value="blue">Blue</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="green">Green</option>
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>

                    </select>      
                                
                </div>
                <div class="col-remove">
                    <button onClick={() => removeMask(id, maskKeyCounter)}>Remove</button>        
                </div> 

            </div>
            ])  
        }
        
    }

    const handleChangeMask = (id,event, input) => {
        console.log("MASK LENGTH : ", Object.values(maskTemp).filter(x => x === "").length)
        setMaskKeyCounter(maskKeyCounter + 1) 
        //console.log("MaskKeyCounter," , maskKeyCounter)
        //Makes sure that all the fields are filled before adding new cell type
        if(Object.values(maskTemp).filter(x => x === "").length === 1){//counts the number of empty values
            setNewMask(true)
        }
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
        //After the temp dictionary is filled store the properties to the main dictionary
        if(Object.values(maskTemp).filter(x => x === "").length === 0){
            setMaskDict({...maskDict,[maskKeyCounter]:[{cell_type:maskTemp["cellType"]},{ threshold_marker:maskTemp["thresholdMarker"]}, {threshold_value:maskTemp["thresholdValue"]}, {color:maskTemp["color"]}]})     
        }    
    }

    //Removes the mask metadata input field and the corresponding property from the dictionary
    const removeMask = (id,dictKey) => {
        delete maskDict[dictKey]
        document.getElementById(id).remove()
    }
    console.log(analysisReady)
    

    //#################################################################### Input for cell intensity measurements ######################################################################################

    const intensityInput = () => {

        setIntensityTb(
        <div>
            <br></br>
            <label for="intensity" >Cell type: </label>
            <input id = "intensity" size="10" onBlur={event => handleChangeIntensity(event)}></input>
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
                <input id = {area_id} size="10" onBlur={event => handleChangeCellArea(event,"add")}></input>
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
            <input id = "cellAreaInput_0" size="10" onBlur={event => handleChangeCellArea(event, "reset")}></input>
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
                    <br></br>
                    <label for="cellArea" >Cell type(s) to measure: </label>
                    <input id={area_id} size="10" onBlur={event => handleChangeCellArea(event, "add")}></input>

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
                        <b>Cell type identification</b>
                        <br></br>

                        {maskingTextBox}
                        <button type="button" onClick={addMasks}>New cell type</button>

                    </React.Fragment>
                    </div>                  
                ):(<></>)
                
                }    

                <br></br>
                <br></br>

                {renderIntensity ? (
                    <div>
                    <React.Fragment> 
                        <b>Pixel intensity measurement between groups</b>
                        <br></br>

                        {intensityTb}
                    </React.Fragment>
                    </div>                  
                ):(<></>)
                
                }    

                <br></br>
                <br></br>

                {renderCellArea ? (
                    <div>
                    <React.Fragment> 
                        <b>Cell area measurements</b>
                        
                        {cellAreaTb}
                        <button type="button" onClick={addCells}>Add new</button>&nbsp;&nbsp;&nbsp;
                        <button type="button" onClick={() => resetCellArea()}>Reset</button>


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
