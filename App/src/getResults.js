/*
Title: getResults.js
Date: 2021-09-03
Author: Erno Hänninen
Description:
  - Result page of the app, diplays the results for user

Procedure:
 - Select the sample which you want to explore
 - Explore the reults


*/


import React,  { useState, forwardRef, useImperativeHandle } from 'react';
import axios from "axios";
import './App.css';


var PIPELINEoutput = ""
const GetResults = () => { 
    
    //Variables
    const [plotPaths, setPlotPaths] = useState("")
    const [areaPlots, setAreaPlots] = useState("")
    const [sampleImages, setSampleImages] = useState("")

    const [dropDownSamples, setDropDownSamples] = useState("")
    const [dropDownMarkers, setDropDownMarkers] = useState("")
    
    const [checkbox, setCheckbox] = useState("")
    const [displaySegmentationCb, setDisplaySegmentationCb] = useState(false)
    const [preprocessedCb, setPreprocessedCb] = useState(false)
    const [firstCall,setFirstCall] = useState(true)
    const [totalCells, setTotalCells] = useState({})
    const [resultingCells, setResultingCells] = useState({})
    const [markerImages, setMarkerImages] = useState("")
    const [mergedImages, setMergedImages] = useState([])
    const [pixelComparisonPlot, setPixelComparisonPlot] = useState("")
    const [pixelSamplePlot, setPixelSamplePlot] = useState("")
    const [dropDownPixel, setDropDownPixels] = useState("")
    const [cellArea, setCellArea] = useState("")
    
    var sample = ""
    var marker = ""
    var pixelImage = ""
    var cellTableG = ""

    //Function which get the images from backend
    const displayResults = () => {
        document.getElementById("resultsButton").style.display = "none"
        document.getElementById("outputMessage").style.display = "none"
        document.getElementById("pipelineStatus").style.display = "none"
        document.getElementById("outputB").style.display = "none"
        document.getElementById("color_label").style.display = "block"
        axios.get("/fetchResults")
        .then(function(response){
           setTotalCells(response.data[1])
           setResultingCells(response.data[2])
           console.log("PALUU ARVO")
           console.log(response.data)

           console.log(response.data[1])
           console.log(response.data[2])
           console.log(response.data[3])
           console.log(response.data[4])
           //Extracting values from dictionary
           let samples = response.data[0]["samples"]
           let area = response.data[0]["area"]
           let intensity = response.data[0]["intensity"]
           console.log(area)
           console.log(samples)
        
           setPlotPaths(area)    
           displayImages(area, samples, intensity, response.data[1], response.data[2], response.data[3], response.data[4]) //Calling function which displays the images         
        })
    }
    //Function which displays the images to the user
    const displayImages = (area, samples, intensity, totalCells, resultingCells, intensityCellType, cellAreaMeasurements) => { 

        let segmentation = false
        let merged = false
        let mergedOverlays = false
        let cellAreaExecuted = false

        let counter = 0

        Object.entries(samples[Object.keys(samples)[0]]).map(([key,value]) => {
            console.log(key)
            console.log(value)
            console.log(Object.keys(Object.assign({}, ...value)))
            if(Object.keys(Object.assign({}, ...value)).includes("overlays")){
                console.log("SEGMENTATION")
                segmentation = true
            }
        })

        var cellAreaList = []
        if(Object.keys(cellAreaMeasurements).length != 0){
            
            cellAreaExecuted = true

            console.log(cellAreaMeasurements)
            //Object.entries(cellAreaMeasurements).map(([key,value]) => { //Goes thru at sample level
            Object.entries(cellAreaMeasurements).map(([key, value]) => {

                
                var tableData = Object.entries(value).map(([key2,value2]) =>   //Goes thru at cell type level
                    <tr>
                        <td>{key2}</td>
                        <td>{value2["pixel_counts"]}</td>
                        <td>{value2["cell_counts"]}</td>
                    </tr>
                )
                

                let id = "measurementsTable" + key
                cellAreaList.push(
                    <div id={id} hidden>
                        <br></br>
                        <b>{key} cell area measurements</b>
                        <table>
                        <tr>
                            <th>Cell</th>
                            <th>Pixel count</th>
                            <th>Cell count</th>
                        </tr>
                        {tableData}
                        
    
                        </table>
                    </div>
                )
            })
            setCellArea(cellAreaList)
        }

        
        //Creates the options for sample dropdown menu
        var sampleOptions = Object.entries(Object.keys(samples)).map(([key,value]) => 
            <option value={value}>{value}</option>
        )
        //Creates the options for markers dropdown menu
        var markerOptions = Object.entries(samples[Object.keys(samples)[0]]).map(([key,value]) => {
            console.log(key)
            if(key == "merged_tiff"){
                merged = true
            }
            if(key == "merged_overlays"){
                mergedOverlays = true
            }

            if(key != "merged_tiff" && key != "merged_overlays"){
                return <option value={key}>{key}</option>
            }
        })

        
        //Create the dropdown list for samples
        //The options are created above
        setDropDownSamples(
        <div class="row">
            <p>Samples: </p>
            <select name="sampleSelector" id="sampleSelector" onChange={event => handleChangeSelect(event, segmentation, merged, "sampleDropDown", cellAreaExecuted)}>
                 <option id="optionNoneSample" value="None" selected="true">None</option>  
                 {sampleOptions}      
            </select>             
        </div>)
        
        //If the backend response contains images where channels are merged (multi channel images) this if clause is executed 
        if(merged == true){
            //Creates dropdown menu for markers
            //The options are passed in a varible. The variable is initialized above
            setDropDownMarkers(
                <div class="row">
                    <p>Markers: </p>
                    <select name="markerSelector" id="markerSelector" onChange={event => handleChangeSelect(event, segmentation, merged, "markerDropDown", cellAreaExecuted)} disabled>
                         <option id="optionNonemarker" value="None" selected="true">None</option>  
                         {markerOptions}         
                    </select>               
                </div>
            )
            //Temp lists where the html elements are stored
            let mergedImagesTemp = []
            let markerImagesTemp = []
            //Map thru a dictionary, with sample names and paths to the images/plots
            Object.entries(samples).map(([key1,value1]) => {

                //Add a counter in here

                //Id to images and divs, key1 contains the sample name
                let idMergedTiff = "idTiff" + key1
                let idMergedOverlay = "idOverlay" + key1
                let idMergedTiffDiv = "tiffDiv" + key1
                let idMergedOverlayDiv = "overlayDiv" + key1

                //Append the list with HTML element
                //These are the merged images
                mergedImagesTemp.push(<div id = {key1} hidden>
                    <b>Merged image channels</b>
                    <div id = {idMergedTiffDiv}>
                        <p>{key1} merged image channels:</p>    
                        <img class="contain" id ={idMergedTiff} src={require("../src/images/" + value1["merged_tiff"])} onClick= {event => displayFullScreen(idMergedTiff)}></img>
                    </div>
                    {mergedOverlays ? (
                    <div id = {idMergedOverlayDiv}>
                        <p> {key1} segmented cells:</p>
                        <img class="contain" id ={idMergedOverlay} src={require("../src/images/" + value1["merged_overlays"])}  onClick= {event => displayFullScreen(idMergedOverlay)}></img>
                    </div>
                    ):(<></>)         
                }   
                    
                </div>)    
                //Map thru the single channel images (preprocessed, segmented, thresholded)
                Object.entries(value1).map(([key,value]) => { 
                    if(key != "merged_tiff" && key != "merged_overlays"){ //The merged files are skipped

                        //Initialize id to images and divs, key1 is the sample name and key is the marker
                        let idPreprocessed = "idPre" + key1 + key
                        let idThresholded = "idThres" + key1+ key
                        let idSegmented = "idSeg" + key1+ key
        
                        let idPreprocessedDiv = "preDiv" + key1+ key
                        let idThresholdedDiv = "thresDiv"+ key1 + key
                        let idSegmentedDiv = "segDiv"+ key1 + key
                        
                        //Append the list with HTML element
                        //These are the single channel images
                        //THe segmented image is appended only if segmentation is executed
                        markerImagesTemp.push(<div id = {key1 + key} hidden>
                            <b>Single-channel image</b>
                            <div id = {idPreprocessedDiv}>
                                <p>{key1} preprocessed {key}:</p>    
                                <img class="contain" id ={idPreprocessed} src={require("../src/images/" + value[0]["preprocessed"])} onClick= {event => displayFullScreen(idPreprocessed)}></img>
                            </div>
                            <div id = {idThresholdedDiv}>
                                <p>{key1} thresholded {key}:</p>
                                <img class="contain" id ={idThresholded} src={require("../src/images/" + value[1]["thresholded"])}  onClick= {event => displayFullScreen(idThresholded)}></img>
                            </div>
                            {segmentation ? (
                                <div id = {idSegmentedDiv}>
                                    <p>{key1} segmented {key}:</p>
                                    <img class="contain" id ={idSegmented} src={require("../src/images/" + value[2]["overlays"])}  onClick= {event => displayFullScreen(idSegmented)}></img>         
                                    <br></br>
                                    <br></br>
                                </div>               
                            ):(<></>)         
                            }   
                            </div>)
                    }
                })
                
            })
            //Add the temp lists to the state variable
            setMergedImages(mergedImagesTemp)
            setMarkerImages(markerImagesTemp)


            
        }
        //If backend response contains single channel images, this if clause is executed
        else if(merged == false){
            //Map thru the samples and images
            //The return value is directly updated to state variable
            setSampleImages(Object.entries(samples).map(([key,value]) => {
                //Id to images and divs, key contains the sample name
                let idPreprocessed = "idPre" + key
                let idThresholded = "idThres" + key
                let idSegmented = "idSeg" + key

                let idPreprocessedDiv = "preDiv" + key
                let idThresholdedDiv = "thresDiv" + key
                let idSegmentedDiv = "segDiv" + key

                console.log(Object.values(value)[0][2]["overlays"])
                let temp_l = Object.values(value)[0][2]["overlays"].split("-")
                let key_for_cell_count = temp_l[0].split("/")[1] + "-" + temp_l[1]
                console.log(temp_l[0].split("/")[1])
                console.log(key_for_cell_count)
                //Return the html element
                //THe segmented image and the counts are appended to the list only if the segmentation is executed
                return([...sampleImages, 
                <div id = {key} hidden>
                    
                    <div id = {idPreprocessedDiv}>
                        <p>Preprocessed {key}:</p>    
                        <img class="contain" id ={idPreprocessed} src={require("../src/images/" + Object.values(value)[0][0]["preprocessed"])} onClick= {event => displayFullScreen(idPreprocessed)}></img>
                    </div>
                    <div id = {idThresholdedDiv}>
                        <p>Thresholded {key}:</p>
                        <img class="contain" id ={idThresholded} src={require("../src/images/" + Object.values(value)[0][1]["thresholded"])}  onClick= {event => displayFullScreen(idThresholded)}></img>
                    </div>
                    {segmentation ? (
                        <div id = {idSegmentedDiv}>
                            <p>Segmented {key}:</p>
                            <img class="contain" id ={idSegmented} src={require("../src/images/" + Object.values(value)[0][2]["overlays"])}  onClick= {event => displayFullScreen(idSegmented)}></img>  
                            <p>Number of cells detected in image segmentation : {totalCells[key_for_cell_count]}</p> 
                            <p>Number of cells after removing unassigned ones : {resultingCells[key_for_cell_count]}</p>       
                            <br></br>
                            <br></br>
                        </div>               
                    ):(<></>)         
                    }   
                </div>])
            }))

        }
       



        

        //If area measurements for the thresholded image is computed
        if(area != ""){
            //Add the plot to a state variable
            setAreaPlots(
                <div>
                    <b>Measurement of marker positive area:</b>
                    <br></br>
                    <img id ="areaPlot" src={require("../src/images/Area/" + area)} onClick= {event => displayFullScreen("areaPlot")}></img>
                </div>
            )
        }

        if(Object.keys(intensity).length != 0){

                   
            //Creates the options for markers dropdown menu
            var intensityOptions = []
            intensityOptions.push(Object.keys(intensity).map((key,index) => {
                console.log(key)
                if(key != "group_plot"){
                    return <option value={key}>{key}</option>
                }
            }))

            console.log(intensityOptions)

            var dropDownPixels = <div class="row">
                                    <p>Sample distributions: </p>
                                    <select name="pixelSampleSelector" id="pixelSampleSelector" onChange={event => handleChangeSelectPixel(event)}>
                                        <option id="optionNonePixel" value="None" selected="true">None</option>  
                                        {intensityOptions}              
                                    </select>                     
                                </div>
            console.log(dropDownPixel)
            var pixelTempList = []

            setPixelComparisonPlot(
                <div>
                    <br></br>
                    <br></br>
                    <b>Cell pixel intensity distribution</b>
                    {dropDownPixels}
                    {pixelTempList}                  
                    <p>{intensityCellType}-cell pixel intensity distribution between two groups:</p>
                    <img id="comparisonIntensityPlot" src={require("../src/images/Intensity/" + intensity["group_plot"])} onClick = {event => displayFullScreen("comparisonIntensityPlot")}></img>
                </div>
            )

            Object.keys(intensity).forEach((key,value) => {
                    console.log(key)
                    console.log(value)
                    if(key != "group_plot"){
                        //Id to images and divs, key contains the sample name
                        let idIntensityPlot = "idIntensity" + key
                        let idIntensityPlotDiv = "idIntensityDiv" + key
                        console.log(intensity[key])
        
                        //Return the html element
                        //The segmented image and the counts are appended to the list only if the segmentation is executed
                        pixelTempList.push(
                        <div id = {"intensity" + key} hidden>       
                            <div id = {idIntensityPlotDiv}>
                                <p>Pixel intensities of {intensityCellType}-cells in {key}:</p>    
                                <img class="contain" id ={idIntensityPlot} src={require("../src/images/Intensity/" + intensity[key])} onClick= {event => displayFullScreen(idIntensityPlot)}></img>
                            </div>
                        <br></br>    
                        </div>)

                    }             
                }
            )
            setPixelSamplePlot(pixelTempList)
            console.log(pixelSamplePlot)
            

        }    
    } 

    //Function which displays the images full screen
    const displayFullScreen = (id) => { 
        let elem = document.getElementById(id) //Get element based on id
        if(document.fullscreenElement){ //Exit if fullscreen
            document.exitFullscreen()
        }
        //Otherwise, no image is in fullscreen mode 
        //Display image fullscreen
        //THis function is dependent from the browser used
        else{
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
              } else if (elem.webkitRequestFullscreen) { /* Safari */
                elem.webkitRequestFullscreen();
              } else if (elem.msRequestFullscreen) { /* IE11 */
                elem.msRequestFullscreen();
              }
        }
        
    }

    //Handles changes in the sample drop-down list
    //segmentation and merged are boolean parameters
    //call parameter contains the source of the function call (sampleDropDown or markerDropDown)
    //THis function is both for multi and single channel images. It is specified in the comments which images the if clause handles
    const handleChangeSelect = (event, segmentation, merged, call, cellAreaExecuted) => { 

        //Displays the merged tiff and the merged masks
        //For multichannel images
        if(merged == true && event.target.value!="None" && call == "sampleDropDown"){
            //Format the variables based on the selected value in drop down menu
            let idMergedDiv = "tiffDiv" + event.target.value
            let idOverlayDiv = "overlayDiv" + event.target.value

            //For cell measurement table
            let idMeasurements = "measurementsTable" + event.target.value

            //When sample is changed, change the value of markerSelector to None 
            document.getElementById("markerSelector").value = "None" 
            document.getElementById("markerSelector").disabled = false //Display the markerSelector dropDown menu
            //Display the images
            document.getElementById(idMergedDiv).style.display = "block"
            document.getElementById(idOverlayDiv).style.display = "block" 

            //Check that cell area measurements is executed
            if(cellAreaExecuted == true){
                document.getElementById(idMeasurements).style.display = "block"           
            }
        }

        //If the sampleSelector value is changed to None, hide the markerSelector dropdown menu
        //For multichannel images
        else if(merged == true && event.target.value=="None" && call == "sampleDropDown"){
            document.getElementById("markerSelector").value = "None" //Changes value
            document.getElementById("markerSelector").disabled = true //Hide
        
        }

        //This if statement displays the the single channel images (input image, thresholded, and segmented)
        //Displays also the checkboxes which can be used to hide the images listed above
        //THis if statement is both for images which composes of multiple channels and single channels
        else if(merged == true && event.target.value!="None" && call == "markerDropDown" || merged == false && event.target.value != "None" && call == "sampleDropDown"){

            //IF the checkbox exists it is checked by default
            if(document.getElementById("preprocessedImgCheck") != null){
                document.getElementById("preprocessedImgCheck").checked = true;    
            }
            if(document.getElementById("thresholdImgCheck") != null){
                document.getElementById("thresholdImgCheck").checked = true; 
            }
            if(document.getElementById("segmentedImgCheck") != null){
                document.getElementById("segmentedImgCheck").checked = true;    
            }    

            let idPreprocessedDiv = ""
            let idThresholdedDiv = ""
            let idSegmentedDiv = ""

            //If statement for merged images (multiple channels)
            if(merged == true){
                //Get's the current sample from the sampleSelector
                let currentSample = document.getElementById("sampleSelector").value
                //THe current sample is used to create the id of the DIV where the images are stored
                //event.target value contains the marker 
                //The id is in form preDiv + sample + marker (e.g preDivSample1LMX)
                idPreprocessedDiv = "preDiv" + currentSample + event.target.value
                idThresholdedDiv = "thresDiv"+ currentSample + event.target.value
                idSegmentedDiv = "segDiv" + currentSample+ event.target.value

                //Using the id to display the images
                document.getElementById(idPreprocessedDiv).style.display = "block"
                document.getElementById(idThresholdedDiv).style.display = "block"
                document.getElementById(idSegmentedDiv).style.display = "block"
            }
            // If statement for single channel images
            else if(merged == false){
                //Build the div id from input value
                idPreprocessedDiv = "preDiv" + event.target.value
                idThresholdedDiv = "thresDiv" + event.target.value
                idSegmentedDiv = "segDiv" + event.target.value

                //If the image is hidden make them visible
                document.getElementById(idPreprocessedDiv).style.display = "block"
                document.getElementById(idThresholdedDiv).style.display = "block"
                if(segmentation == true){
                    document.getElementById(idSegmentedDiv).style.display = "block"
                }

                let idMeasurements = "measurementsTable" + event.target.value

                if(cellAreaExecuted == true){
                    document.getElementById(idMeasurements).style.display = "block"           
                }

            }
            
            //Creates the checkbox HTML element to each image
            setCheckbox(
                <div class="row">
                    <div class = "colQC-1">
                        <div class="checkbox">    
                            <p>Preprocessed image: </p>
                            <input type = "checkbox" id="preprocessedImgCheck" onClick={()=>handleCheckbox(idPreprocessedDiv, "preprocessedImgCheck")} defaultChecked/>                
                        </div>
                    </div>
                    <div class = "colQC-2">
                        <div class="checkbox">    
                            <p>Thresholded image: </p>
                            <input type = "checkbox" id="thresholdImgCheck" onClick={()=>handleCheckbox(idThresholdedDiv, "thresholdImgCheck")} defaultChecked/>                
                        </div>
                    </div>
                           
                    {segmentation ? (
                              <div class = "colQC-3">
                              <div class="checkbox">    
                                  <p>Segmented image: </p>
                                  <input type = "checkbox" id="segmentedImgCheck" onClick={()=>handleCheckbox(idSegmentedDiv, "segmentedImgCheck")} defaultChecked/>                
                              </div>         
    
                          </div>
                    ):(<></>)         
                    }         
                </div>    
            )             
        }

        //Displays the main div where the merged sample specific images are stored
        //Both for multi and single channel images
        if(event.target.value != "None" && call == "sampleDropDown"){
            document.getElementById(event.target.value).style.display = "block"
        }
        //Displays the main div where the marker specific images are stored
        //For multichannel images
        if(event.target.value != "None" && call == "markerDropDown"){
            document.getElementById(sample + event.target.value).style.display = "block"
        }

        //Hides the previously selected sample, so that only on sample is displayed at the time
        if(sample != "" && sample != "None" && sample != event.target.value && call == "sampleDropDown"){
            if(merged == true){
                setCheckbox("") //after the sample changes, hide the checkbox which is used to control the single channel images
            }
            document.getElementById(sample).style.display = "none"
            
            if(cellAreaExecuted == true){
                document.getElementById(cellTableG).style.display = "none"
            }

            //Hides the chosen marker image after sample changes
            if(marker != "" && marker != "None" && merged == true){
                document.getElementById(sample+marker).style.display = "none"
            }

        }
        //Hides the previously selected marker image, so that only one set of marker images is displayed at once
        //Multichannel images
        else if(marker != "" && marker != "None" && marker != event.target.value && call == "markerDropDown"){
            document.getElementById(sample + marker).style.display = "none"
        }
        //Empties (hides) the checkbox variable if marker is set to null
        //Multichannel images
        else if(call == "markerDropDown" && marker == "None" && checkbox != ""){
            setCheckbox("")
        }
        //Hides previous images
        //For single channel images
        else if(sample != "" && sample != "None" && merged == false){
            document.getElementById(sample).style.display = "none"
        }
        //Hides the checkboxes if condition is met
        //THis if statement is bot for single and multi channel images
        if(event.target.value == "None" && merged == false || event.target.value == "None" && call == "markerDropDown"){
            setCheckbox("")
        }

        //Update the current sample and marker values, these values are "previous" values when the function is called next time
        if(call == "sampleDropDown"){
            sample = event.target.value
            cellTableG = "measurementsTable" + event.target.value
        }
        if(call == "markerDropDown"){
            marker = event.target.value
        }     
    }

    //This function handles changes in checkboxes
    //Parameters are the id of image div and id of checkbox
    //The checkboxes are created in function above
    const handleCheckbox = (idDiv, idCb) => {

        var elem = document.getElementById(idDiv) //Get the div element
        //If clause which hides the element
        if(window.getComputedStyle(elem).display == "block"){
            elem.style.display = "none"
            document.getElementById(idCb).defaultChecked = false;
        }
        //If clause which displays the element
        else if(window.getComputedStyle(elem).display == "none"){
            elem.style.display ="block"
            document.getElementById(idCb).defaultChecked = true;
        }

    }
 
    const handleChangeSelectPixel = (event) =>{
        console.log(pixelImage)
        //displays images/nothing depending of the selected drop-down value
        let idIntensityDiv = "idIntensityDiv" + event.target.value
         
        console.log(idIntensityDiv)
        //Make the image DIV visible       
        if(event.target.value != "None"){
            //document.getElementById(idIntensityDiv).style.display = "block"
            document.getElementById("intensity" + event.target.value).style.display = "block"
        }

        //Hides images depending of the value
        if(pixelImage != "" && pixelImage != "intensityNone"){
            document.getElementById(pixelImage).style.display = "none"
        }
        pixelImage = "intensity" + event.target.value //Update the value to a global variable
        
    }
    //Display HTML to the user
    return(
        <div>
            <form class="resultsForm" id="resultsForm">
                <div hidden id="load">
                    <p>Running SIMPLIcity</p>         
                </div>
                
                <div hidden id="results">  
                    <b>SIMPLIcity results</b>  
                    <br></br>
                   
                    <p id="pipelineStatus"></p>
                    <br></br>

                    <button id="resultsButton" type="button" onClick={event => displayResults()}>Display results</button>

                    <div class = "row">
                        <div class = "colQC-1">
                            {dropDownSamples}     
                        </div>
                        <div class = "colQC-2">
                            {dropDownMarkers}     
                        </div>
                       
                    </div>
                    <div id = "color_label" hidden></div>


                    <div class = "colQC-1">
                            {checkbox}                     
                    </div>
                    
                    {sampleImages}
                    {markerImages}
                    {mergedImages}
                    {cellArea}
                    {areaPlots}
                    {pixelComparisonPlot}

                </div>
                <br></br>
                

                <br></br>
                <b id="outputB"hidden>Pipeline output message:</b>
                <p id="outputMessage" ></p>
            </form>
        </div>
    )
}
export default GetResults;