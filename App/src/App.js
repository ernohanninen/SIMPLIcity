


//created 15. may
import React, { useState, useRef } from 'react';
//import * as React from 'react';
import './App.css';
import axios from "axios";
//import React from "react";
import { v4 as uuidv4 } from 'uuid';
import Table from "./sample_table.js";
//import handleSettingsSubmit from "./getSettings.js";
import GetMetadata from "./getMetadata.js"
import GetSettings from "./getSettings.js"
import GetResults from "./getResults.js"
import Navbar from "./navbar.js";
import Thresholding from "./image_thresholding.js"
import About from "./about.js"
import PageNotFound from "./pageNotFound"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



//NExts steps: Prevent the user to submit sample with empyt input fields
//Check that markers among sample are unique
//Reformat the table
//allow only submitting  tiff files
//Be aware how the comparsion works
//Should the colors be unique
//Dropbox to the color?
//Check that the input fields are empty when submitting
//Check that file names are unique

function Home(){


  const [submitting, setSubmitting] = useState(false);
  const [sample, setSample] = useState("");
  const [color, setColor] = useState("");
  const [comparison, setComparison] = useState("");
  const [marker, setMarker] = useState("")
  const [inputFields, setInputFields] = useState([
    { id: uuidv4(), tiff: '', marker: '', label:'', thresholding:""}, ]);
  const [tableData, setTableData] = useState([])
  const [isHovering1, setIsHovering1] = useState(false)
  const [isHovering2, setIsHovering2] = useState(false)
  const [info, setInfo] = useState("")
  const [results, setResults] = useState(false)
  //const [sample_list, setSample_list] = useState([])
  const sample_list = []

  const handleSubmit = event => {
    event.preventDefault();    
    const markers = []
    const labels = []
    const thresholds = []
    const temp_tiffs = []



    for(let i=0;i<inputFields.length;i++){
        markers[i] = inputFields[i]["marker"]
        labels[i] = inputFields[i]["label"]
        thresholds[i] = inputFields[i]["thresholding"]
        temp_tiffs[i] = inputFields[i]["tiff"]
    }

    let markers_set = [... new Set(markers)]
    let labels_set = [... new Set(labels)]
    let temp_tiff_set = [... new Set(temp_tiffs)]


    if(sample == "" | comparison == "" | color == "" | temp_tiffs == "" |  markers == '' | labels == '' | thresholds == ''){
      alert("Fill the fields")
    }

    else if(markers_set.length != markers.length){
      alert("Use unique markers within sample")
    }
    else if(labels_set.length != labels.length){
      alert("Use unique marker labels within sample")
    }
    else if(temp_tiff_set.length != temp_tiffs.length){
      alert("Use unique tiff images within sample")
    }

    else{

      let empty = true
      if (tableData.length==0){ empty = true }
      else{ empty = false }

      let exists = false
      console.log(tableData)
      if(tableData.length != 0){
        for(let i = 0; i<tableData.length;i++){
          if(tableData[i]["sample"] === sample){       
            alert(sample +" already exists, use unique sample names")
            exists = true
          }
          if(tableData[i]["comparison"] == comparison & tableData[i]["color"] != color){
            alert("Colors within comparison group should match. Color to comparison group '" + comparison + "' should be set to '" + tableData[i]["color"] + "'")
            exists = true
          }
      
        }
      }
      if(exists==false){
        submitData()
      }
      
      function submitData(){
        //Creates fromdata object, which is then sended to the backend
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
            console.log(pair[1])
            newData[pair[0]] = pair[1].replaceAll(",", ",\n")
           } //If there are multiple markers/thresholding algorithms per sample, replace the "," with new line character 
    
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
        event.target.reset()//Empty variables
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
  
        //Changes the value in dropdown menu
        document.getElementById("colorSelector").value = "Select"
      }

    }


         
  }
  
  const handleChangeInput = (id, event) => {
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
              let drop_id ="thresholdingDropMenu"+id 
              let element = document.getElementById(drop_id) //Get HTML element
              //Depending to the marker the program automatically set's a default thresholding algorithm
              //These if statements set's the algorithm
              if(event.target.value == "HuNu"){ 
                i["thresholding"] = "Minimum"
                element.value = "Minimum"              
              }
              else if(event.target.value == "TH"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              else if(event.target.value == "ChAT"){
                i["thresholding"] = "Otsu" 
                element.value = "Otsu"              
              }
              else if(event.target.value == "LMX"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              else if(event.target.value == "DAPI"){
                i["thresholding"] = "Triangle" 
                element.value = "Triangle"              
              }
              console.log("OK")
            }
            
          }
          
        }
      }      
      return i;
    })   
    setInputFields(newInputFields);  //Update the state variable
  }

  const addNewTiff = event =>{
    setMarker("")
    setInputFields([...inputFields, { id: uuidv4(),  tiff: '', marker: '' }])
  }

  const handleRemoveFields = id => {
    const values  = [...inputFields];
    values.splice(values.findIndex(value => value.id === id), 1);
    setInputFields(values);
  }


  const handleChangeSelectColor = (event) => {
    setColor(event.target.value)
  }



  const settingsPage = event => {
    //event.preventDefault();
    document.getElementById("samplePage").style.display= "none";
    document.getElementById("nextButton1").style.display = "none"
    document.getElementById("settingsPage").style.display = "block";
    document.getElementById("returnButton").style.display = "block";
    document.getElementById("nextButton2").style.display = "block"     
  }

  const samplePage = event => {
    //event.preventDefault(); 
    document.getElementById("samplePage").style.display= "block";
    document.getElementById("returnButton").style.display = "none";
    document.getElementById("settingsPage").style.display = "none";
    document.getElementById("nextButton1").style.display = "block"
    document.getElementById("nextButton2").style.display = "none"
  }

  const returnSettingsPage = event => {
    //event.preventDefault(); 
    document.getElementById("settingsPage").style.display= "block";
    document.getElementById("nextButton2").style.display = "block";
    document.getElementById("returnButton").style.display = "block"
    document.getElementById("returnButton2").style.display = "none"
    document.getElementById("nextButton3").style.display = "none"
    document.getElementById("metadataPage").style.display = "none"

  }

  const metadataPage = event => {
    //Button functionality
    document.getElementById("settingsPage").style.display= "none";
    document.getElementById("nextButton2").style.display = "none";
    document.getElementById("returnButton").style.display = "none"
    document.getElementById("returnButton2").style.display = "block"
    document.getElementById("nextButton3").style.display = "block"
    document.getElementById("metadataPage").style.display = "block"

  }

  const resultsPage = event => {
    document.getElementById("metadataPage").style.display = "none"
    document.getElementById("resultsPage").style.display = "block";
    document.getElementById("returnButton2").style.display = "none"
    document.getElementById("nextButton3").style.display = "none"
    

  }
  
  const showInstructions = event => {
    //setInfo()
    document.getElementById("instructions").style.display="block"
    document.getElementById("infoBtn").style.display="none"
    document.getElementById("hideInfoBtn").style.display="block"    
  }

  const hideInstructions = event =>{
    document.getElementById("instructions").style.display="none"
    document.getElementById("infoBtn").style.display="block"
    document.getElementById("hideInfoBtn").style.display="none"
  }
  
  const settingsChildRef = useRef();
  const metadataChildRef = useRef();
  const resultsChildRef = useRef();

  return (
    <div>

  <div id="samplePage">
      
      <form  onSubmit={handleSubmit}>
        <b>Submit samples:</b>     
          <div class="row">
            <div class="col-1">    
                  <p name = "sample">Sample</p>
                  <input name="sample" onChange={(e)=>setSample(e.target.value)} size="10"/>                
            </div>
            <div class="col-2">    
                  <p>Comparison</p>
                  <input name="comparison" onChange={(e)=>setComparison(e.target.value)} size="10"/> 
                
            </div>
            <div class="col-3">    
                 
                  <p>Color</p>
                  <select  name="color" id="colorSelector" onChange={event => handleChangeSelectColor(event)}>
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

            { inputFields.map(inputField => (
         
            
            <div key={inputField.id}>
            <div class="row">
              <div class="col-1">    
                    <p>Load tiff</p>
                    <input id = {inputField.id} name="tiff" type = "file" onChange={event => handleChangeInput(inputField.id,event)}/>                

              </div>
              <div class="col-2">    
                  
                    
                  <p>Marker</p>
                  <select name="marker" id="marker" onChange={event => handleChangeInput(inputField.id,event)}>
                      <option selected="true" disabled="disabled">Select</option> 
                      <option value="ChAT">ChAT</option>
                      <option value="DAPI">DAPI</option>
                      <option value="HuNu">HuNu</option>
                      <option value="LMX">LMX</option>
                      <option value="TH">TH</option>
                      <option value="other">Other</option>


                  </select>
              
              </div>
              <div class="col-3">    
                    <p>Label</p>
                    <input name="label" value={inputField["label"]} onChange={event => handleChangeInput(inputField.id,event)} size="10"/>                

              </div>
              <div class="col-4">    
                    <p>Thresholding</p>
                    <select name="thresholding" id={"thresholdingDropMenu"+inputField.id} onChange={event => handleChangeInput(inputField.id,event)}>
                      <option selected="true" disabled="disabled">Select</option>    
                      <option value="Minimum">Minimum</option>
                      <option value="Otsu">Otsu</option>
                      <option value="Triangle">Triangle</option>
                      <option value="Yen">Yen</option>

                  </select>           

              </div>
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
                <b>Sample: </b>Identifier to be used to refer this sample in the analysis.<br></br> 
                <b>Color: </b>Color used to represent this sample in plots. <br></br>
                <b>Comparison: </b>Pairwise comparisons will be made only if there are two category names among samples. To exclude a sample from comparison, set comparsion field to NA.<br></br>
                <b>Load tiff: </b>Several single-channel TIFF files can be submitted for each sample.<br></br>
                <b>Marker: </b>Marker associated to the channel.<br></br>
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
            <button disabled={tableData.length === 0} type="button" onClick={settingsPage}>Next</button>
          </div>
          <div hidden class ="next-btn" id="nextButton2">
            <button type="button" onClick={()=>{settingsChildRef.current.submitSettings();metadataChildRef.current.getProcesses()}}>Next</button>           
          </div>
          <div hidden class ="run-btn" id="nextButton3">
            <button type="button" onClick={()=>{metadataChildRef.current.submitMetadata();resultsPage()}}>Run</button>
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

