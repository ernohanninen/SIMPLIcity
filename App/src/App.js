
/*
Title: app.js
Date: 2021-20-05
Author: Erno Hänninen
Description:
  - First page of the app
  - Here the samples are submitted and the sample information is sended to the backend
  - Takes also care of the navigation in the app

Procedure:
 - Read the sample fom the user
 - Validates the user input to prevent errors
 - Submit sample
 - Sends the data to backend
 - Updates the sample table
 - Removes items from the sample table and from metadata file
 - Click next to proceed

*/

//Imprt React and the requred scripts
import React, { useState, useRef } from 'react';
import './App.css';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import Table from "./sample_table.js";
import GetMetadata from "./getMetadata.js"
import GetSettings from "./getSettings.js"
import GetResults from "./getResults.js"
import Navbar from "./navbar.js";
import Thresholding from "./image_thresholding.js"
import About from "./about.js"
import PageNotFound from "./pageNotFound"
//Navigation module
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



//NExts steps

//When clicking DElete, empty the textboxes

var groupsSet  = new Set()

function Home(){
  //State variables
  const [submitting, setSubmitting] = useState(false);
  const [sample, setSample] = useState("");
  const [color, setColor] = useState("");
  const [comparison, setComparison] = useState("");
  const [marker, setMarker] = useState("")
  const [inputFields, setInputFields] = useState([
    { id: uuidv4(), tiff: '', marker: '', label:'', thresholding:""}, ]);
  const [tableData, setTableData] = useState([])
  const [defaultSettings, setDefaultSettings] = useState(true)
  //const [sample_list, setSample_list] = useState([])
  const sample_list = []

  //This function is executed when sample is submitted
  //Handles the event
  const handleSubmit = event => {
    event.preventDefault();    
    const markers = []
    const labels = []
    const thresholds = []
    const temp_tiffs = []

    //This is the tiff input data
    for(let i=0;i<inputFields.length;i++){
        markers[i] = inputFields[i]["marker"]
        labels[i] = inputFields[i]["label"]
        thresholds[i] = inputFields[i]["thresholding"]
        temp_tiffs[i] = inputFields[i]["tiff"]
    }
    //Using sets to, validata that each object in these list's are unique
    let markers_set = [... new Set(markers)]
    let labels_set = [... new Set(labels)]
    let temp_tiff_set = [... new Set(temp_tiffs)]
 
    //Input validation, error is raisen if error occurs -> the data is not submitted
    //Check if input fields are empty
    if(sample == "" | comparison == "" | color == "" | temp_tiffs == "" |  markers == '' | labels == '' | thresholds == ''){
      alert("Fill the fields")
    }
    //Checks that markers within sample are unique
    else if(markers_set.length != markers.length){
      alert("Use unique markers within sample")
    }
    //Check that labels are unique
    else if(labels_set.length != labels.length){
      alert("Use unique marker labels within sample")
    }
    //Check that tiff files are unique
    else if(temp_tiff_set.length != temp_tiffs.length){
      alert("Use unique tiff images within sample")
    }
    //Check that dynamically created textfields are not empty
    else if(Object.values(temp_tiff_set).includes("")){
      alert("Trying to submit empty tiff field")
    }
    else if(markers.includes(undefined)){
      alert("Trying to submit empty marker field")
    }
    else if(labels.includes(undefined)){
      alert("Trying to submit empty label field")
    }
    else if(thresholds.includes(undefined)){
      alert("Trying to submit empty thresholding field")
    }
  

    else{//If no error is raisen the else is executed
      let files = []
      //reads all the tiff names to array
      for(let i = 0; i<temp_tiffs.length; i++){
        files.push(temp_tiffs[i].name)
      }
      let empty = true
      //Checks if tableData is empty, to see if this is the first sample to be submitted
      if (tableData.length==0){ empty = true }
      else{ empty = false }
      let exists = false

      if(comparison != "NA"){//If comparison is NA this list contains the information of submitted comparison groups
        groupsSet.add(comparison)

      }
      //If this is not the first sample, perform some error control between the sample to be submitted and with the samples on the table
      if(tableData.length != 0){
        //Loop over the submitted samples
        for(let i = 0; i<tableData.length;i++){
        
          if(tableData[i]["sample"] === sample){   //Checks for unique sample names    
            alert(sample +" already exists, use unique sample names")
            exists = true
          }
          else if(groupsSet.size == 3 & comparison != "NA"){ //Checks that there are only two different comparison groups and the NA group
            alert("Can't handle more than two comparison groups. To exclude sample from comparison set NA to Comparison textbox.")
            exists = true
          }
          else if(tableData[i]["comparison"] == comparison & tableData[i]["color"] != color){ //Checks that the comperison groups are using same colors
            alert("Colors within comparison group should match. Color for comparison group '" + comparison + "' should be set to '" + tableData[i]["color"] + "'.")
            exists = true
          }
          else if(tableData[i]["comparison"] != comparison & tableData[i]["color"] == color){ //Checks if the color is used by other group
            alert("The color is already used by another comparison group. Comparison group '" + tableData[i]["comparison"] + "' already uses '" + color + "'.")
            exists = true
          }
          else if(files.includes(tableData[i]["tiffs"][0])){ //Checks that the tiff is not yet submitted
            alert("Failed to submit tiff. Image " + tableData[i]["tiffs"][0] + " exists in sample " + tableData[i]["sample"])
            exists = true
            
          }
          if(exists == true){ //If error occured delete the group from the groupsset
            groupsSet.delete(comparison)
            break;
          }
          

      
        }
      }
      if(exists==false){ //If no error call the function which submit the data to backend
        submitData()
      }
      
      function submitData(){
        //Creates fromdata object, which is then sended to the backend
        //Collect the data stored from different locations to the formdata
        const formData = new FormData()
        formData.append("table_state", empty)
        formData.append("sample", sample)
        formData.append("color", color)
        formData.append("comparison", comparison)
        for(let i = 0; i<inputFields.length;i++){
          formData.append("tiffs", inputFields[i]["tiff"])
        }
        formData.append("marker", markers)
        formData.append("labels", labels)    
        formData.append("thresholds", thresholds)    
  
        //####################################### Update the table ################################################################
        //Reformat the data so that it can be displayed on table
        const newData = [] //the reformed data is stored on newdata
        const tiffs = []
        let j = 0
        for (const pair of formData.entries()) {
          //Handles the images. The images are stored in tiffs array
          if(typeof(pair[1])=="object"){    
            tiffs[j] = (pair[1].name)
            j++
          }
          //Handles the rest of the input fields
          else{ 
            //If there are multiple markers/thresholding algorithms per sample, replace the "," with new line character 
            newData[pair[0]] = pair[1].replaceAll(",", ",\n")
           } 
    
        }
        //In case several images per sample add new line character
        //this is done to make the table readable
        if(tiffs.length > 1){
          for(let i = 0; i<tiffs.length-1; i++){ 
            tiffs[i] = tiffs[i] + "\n"
          }
        }
        newData["tiffs"] = tiffs //Updates the array to the newData
    
        //Display the form data in html table
        const d = (data)=>([...data,newData])
        setTableData(d)
  
        //####################################### Data request ######################################################################
        //Send formData to backend using axios
        const url = '/sampleMetadata'; //URL where the data is sended (see app.py)
        axios.post(url, formData).then((response) =>{
          if(response.data=="error"){ //If error
            console.log("########ERROR########")
          }
          else{ //IF everyting okay
            console.log("READY")
          }
        });
          
        //###################################### Update the form ##################################################################
        event.target.reset()//Empties sample and comparison textboxes
        //Changes the value in dropdown menu
        document.getElementById("colorSelector").value = "Select"
        document.getElementById("sampleTB").value = ""
        document.getElementById("comparisonTB").value = ""


        //Removes the dynamically created "add new tiff" elements
          inputFields.map(i => {
            const values  = inputFields
            values.splice(values.findIndex(value => value.id === i.id), inputFields.length-1);       
            setInputFields(values);
          })
        //Empty the inputfields and makes the form ready to submit new samples
        setInputFields([
          { id: uuidv4(), tiff: '', marker: '', label:'', thresholding:""}, ])
        setSubmitting(true);
        setTimeout(() => {
          setSubmitting(false);
        }, 1);
  
        
      }

    }        
  }
  //Handles the change in the input fields for tiff input
  const handleChangeInput = (id, event, call) => {
    const newInputFields = inputFields.map(i => { //Map over the entries
      if(id === i.id) { 
        //This if statement is executed if the function is called from file upload button
        if(event.target.name == "tiff"){
          //Checks the file extension, if file extension is not tiff or tif show error to user and empty the file uploader
          if(event.target.files[0].name.split(".").pop() != "tif" && event.target.files[0].name.split(".").pop() != "tiff"){
            alert("Accepted file extensions tif/tiff")         
            document.getElementById(id).value = ""
          }
          else{//if file extension is accepted then store the value to object
             i[event.target.name] = event.target.files[0]
          }
        }

        else{//if function is called from any other input field, the else is executed
          
          i[event.target.name] = event.target.value //store the value to object
          if(event.target.name == "marker"){ //if function is called from marker inputfield

            if(event.target.value == "other"){
              console.log("OK")
            }
            else{ 
              i["label"] = event.target.value //By default the label is the same as marker
              if(call =="dropdown"){
                let drop_id ="thresholdingDropMenu"+id 
              let element = document.getElementById(drop_id) //Get HTML element
              //Depending to the marker the program automatically set's a default thresholding algorithm
              //These if statements set's the thresholding algorithm
              if(event.target.value == "HuNu"){ 
                i["thresholding"] = "Minimum"
                element.value = "Minimum"              
              }
              else if(event.target.value == "TH"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              else if(event.target.value == "ChAT"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              else if(event.target.value == "LMX"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              else if(event.target.value == "DAPI"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              else if(event.target.value == "FOX"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              

              }
              
            }
            
          }
          
        }
      }      
      return i;
    })   
    setInputFields(newInputFields);  //Update the state variable
  }
  //add new tiff to sample
  const addNewTiff = event =>{
    setMarker("")
    setInputFields([...inputFields, { id: uuidv4(),  tiff: '', marker: '' }])
  }

  ///deletes the tiff input field
  const handleRemoveFields = id => {
    const values  = [...inputFields];
    values.splice(values.findIndex(value => value.id === id), 1);
    setInputFields(values);
  }

  //Dropdown menu for color
  const handleChangeSelectColor = (event) => {
    setColor(event.target.value)
  }

   // if the user tries to proceed with unsubmitted samplee, show an error
  const validateTextbox = event => {
    let sample_value = document.getElementById("sampleTB").value
    let comparison_value = document.getElementById("comparisonTB").value
    let color_value = document.getElementById("colorSelector").value
    if(sample_value != "" & color_value != "Select" & comparison_value !=""){
      alert("To proceed submit the unsubmitted sample")
    }
    else{
      //Otherwise call function which displays the settingspage
      settingsPage()
    }

  }

  //Control's the elements rendered on settingsPage
  const settingsPage = event => {
    //event.preventDefault();
    document.getElementById("samplePage").style.display= "none";
    document.getElementById("nextButton1").style.display = "none"
    document.getElementById("settingsPage").style.display = "block";
    document.getElementById("returnButton").style.display = "block";
    document.getElementById("nextButton2").style.display = "block"     
  }
  //Control's the elements rendered on samplePage
  const samplePage = event => {
    //event.preventDefault(); 
    document.getElementById("samplePage").style.display= "block";
    document.getElementById("returnButton").style.display = "none";
    document.getElementById("settingsPage").style.display = "none";
    document.getElementById("nextButton1").style.display = "block"
    document.getElementById("nextButton2").style.display = "none"
  }

  //Control's the elements rendered when to user goes back on settings page
  const returnSettingsPage = event => {
    //event.preventDefault(); 
    document.getElementById("settingsPage").style.display= "block";
    document.getElementById("nextButton2").style.display = "block";
    document.getElementById("returnButton").style.display = "block"
    document.getElementById("returnButton2").style.display = "none"
    document.getElementById("nextButton3").style.display = "none"
    document.getElementById("metadataPage").style.display = "none"

  }

  //Control's the elements rendered on metadatPage
  const metadataPage = event => {
    //Button functionality
    document.getElementById("settingsPage").style.display= "none";
    document.getElementById("nextButton2").style.display = "none";
    document.getElementById("returnButton").style.display = "none"
    document.getElementById("returnButton2").style.display = "block"
    document.getElementById("nextButton3").style.display = "block"
    document.getElementById("metadataPage").style.display = "block"

  }


  //Shows the instructions for sample page
  const showInstructions = event => {
    document.getElementById("instructions").style.display="block"
    document.getElementById("infoBtn").style.display="none"
    document.getElementById("hideInfoBtn").style.display="block"    
  }

  //Hides the info
  const hideInstructions = event =>{
    document.getElementById("instructions").style.display="none"
    document.getElementById("infoBtn").style.display="block"
    document.getElementById("hideInfoBtn").style.display="none"
  }
  
  //Allows calling functions from other scripts
  const settingsChildRef = useRef();
  const metadataChildRef = useRef();
  const resultsChildRef = useRef();

  //The return statment contains the return elements
  return (
    <div>

  <div id="samplePage">
      
      <form  onSubmit={handleSubmit}>
        <div class = "submitSamplesDiv">
          
            <b>Submit samples:</b>  
            
            <div class="checkboxDefault">  
              <p>Default settings: </p>
              <input type = "checkbox" name="defaultSettings" onChange={()=>setDefaultSettings(!defaultSettings)} defaultChecked={defaultSettings}/>
            
          </div>
        </div>
           
          <div class="row">
            <div class="col-1">    
                  <p name = "sample">Sample</p>
                  <input id="sampleTB" name="sample" onChange={(e)=>setSample(e.target.value)} size="10"/>                
            </div>
            <div class="col-2">    
                  <p>Comparison</p>
                  <input id = "comparisonTB" name="comparison" onChange={(e)=>setComparison(e.target.value)} size="10"/> 
                
            </div>
            <div class="col-3">    
                 
                  <p>Color</p>
                  <select  name="color" id="colorSelector" onChange={event => handleChangeSelectColor(event)}>
                    <option value = "Select" selected="true" disabled="disabled">Select</option>    
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="yellow">Yellow</option>
                    <option value="green">Green</option>
                </select>   
            </div>
                
          </div>

            { inputFields.map(inputField => (
         
            
              <div key={inputField.id}>
              <div class="row">
                <div class="col-1">    
                      <p>Load tiff</p>
                      <input id = {inputField.id} name="tiff" type = "file" onChange={event => handleChangeInput(inputField.id,event, "fileLoader")}/>                

                </div>

                {defaultSettings ? (
                <div class="col-2">            
                    <p>Marker</p>
                    <select name="marker" id="marker" onChange={event => handleChangeInput(inputField.id,event, "dropdown")}>
                        <option selected="true" disabled="disabled">Select</option> 
                        <option value="ChAT">ChAT</option>
                        <option value="DAPI">DAPI</option>
                        <option value="FOX">FOX</option>
                        <option value="HuNu">HuNu</option>
                        <option value="LMX">LMX</option>
                        <option value="TH">TH</option>
                    </select>    
                </div>
                ):(<div class="col-2">
                     
                  <p>Marker</p>
                  <input name = "marker"  onChange={event => handleChangeInput(inputField.id,event, "tb")} size="10"/>                

                  </div>)         
              }   


              <div class="col-3">    
                    <p>Label</p>
                    <input name="label" value={inputField["label"]} onChange={event => handleChangeInput(inputField.id,event, "tb")} size="10"/>                

              </div>
              {defaultSettings ? (
              <div class="col-4">    
                    <p>Thresholding</p>
                    <select name="thresholding" id={"thresholdingDropMenu"+inputField.id} onChange={event => handleChangeInput(inputField.id,event, "dropdown")}>
                      <option selected="true" disabled="disabled">Select</option>    
                      <option value="Minimum">Minimum</option>
                      <option value="Otsu">Otsu</option>
                      <option value="Triangle">Triangle</option>
                      <option value="Yen">Yen</option>
                      <option value="Sauvola">Sauvola</option>
                      <option value="Isodata">Isodata</option>
                      <option value="Mean">Mean</option>
                      <option value="Li">Li</option>





                  </select>           

              </div>
                ):(<div class="col-2">
                     
                <p>Thresholding</p>
                <input name = "thresholding"  onChange={event => handleChangeInput(inputField.id,event, "tb")} size="10"/>                

                </div>)         
            }   

              <div class="col-remove">
                <button disabled={inputFields.length === 1} onClick={() => handleRemoveFields(inputField.id)}>Remove</button>
                
              </div>    
            
            </div>
            </div>

          )) }
          <br></br>
          
          <div class="row">
            <div class="col-1">  
              <button type="button" onClick={addNewTiff}>Add new tiff</button>
            </div>
            <div class="col-2">  

              <button type="submit">Submit sample</button>
            </div>   
            <div >  

            <div id = "infoBtn" class="btn-instructions">  
                <button type="button" onClick={showInstructions}>Instructions</button>
          </div>  
          <div  hidden id = "hideInfoBtn" class="btn-instructions">  
                <button type="button" onClick={hideInstructions}>Hide Instructions</button>
          </div>  
          </div>    

          </div>

          <div hidden id="instructions" class="textarea-container">    
              <p disabled readonly rows="20" cols="50">
                <b>Instructions:<br></br><br></br></b>
                <b>Default settings:</b>Sample settings that are optimized for data used during the app development project<br></br> 
                <b>Sample: </b>Identifier to be used to refer this sample in the analysis.<br></br> 
                <b>Color: </b>Color used to represent this sample in plots. <br></br>
                <b>Comparison: </b>Pairwise comparisons between group of samples will be made only if there are two category names among samples. To exclude a sample from comparison, set comparsion field to NA.<br></br>
                <b>Load tiff: </b>Several single-channel TIFF files can be submitted for each sample.<br></br>
                <b>Marker: </b>Marker associated to the channel. Markers within the sample needs to be the same.<br></br>
                <b>Label: </b>Label used to name the channel (marker) in the analysis.<br></br>
                <b>Thresholding: </b>Thresholding algorithm to be executed for the image.
              </p>        
        </div>
          <div >  

        <Table tableData={tableData} setTableData = {setTableData} id="sampleTable" class="sampleTable"/>
        </div>
        <br></br>
        <br></br>
        <br></br>

      </form>
  </div> 
  <div hidden id="settingsPage" >
    <GetSettings ref={settingsChildRef}/>
    <br></br>
  </div>
  <div hidden id="metadataPage">
    <GetMetadata ref={metadataChildRef}/>
    <br></br>
  </div>
  <div hidden id="resultsPage">
    <GetResults ref={resultsChildRef}/> 
    <br></br>
  </div>
  <div class ="buttonRow" >
          <div class ="next-btn1" id="nextButton1">         
            <button disabled={tableData.length === 0} type="button" onClick={()=>{validateTextbox()}}>Next</button>
          </div>
          <div hidden class ="next-btn" id="nextButton2">
            <button type="button" onClick={()=>{settingsChildRef.current.submitSettings();metadataChildRef.current.getProcesses()}}>Next</button>           
          </div>
          <div hidden class ="run-btn" id="nextButton3">
            <button type="button" onClick={()=>{metadataChildRef.current.submitMetadata()}}>Run</button>
          </div>
          <div hidden class ="return-btn" id="returnButton">
            <button type="button" onClick={samplePage}>Return</button>
          </div>
          <div hidden class ="return-btn2" id="returnButton2">
            <button type="button" onClick={returnSettingsPage}>Return</button>
          </div>
        </div>
<br></br><br></br>

</div>

  );
}

//Funcntion which controls the navigationn on the app
export default function App() {
  return(
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/thresholding"   element={<Thresholding/>} />
          <Route path="/about" element={<About/>} />
          <Route path="*" element={<PageNotFound />} />

        </Routes>
      </div>
    </Router>
  )

}

