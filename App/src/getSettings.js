import React,  { useState, forwardRef, useImperativeHandle } from 'react';
import axios from "axios";
import './App.css';
//import App from "./App.js"


const GetSettings = forwardRef((props, ref)=>{
//function GetSettings(){

    const [instrument, setInstrument] = useState("");

    const [area, setArea] = useState(false);
    const [segmentation, setSegmentation] = useState(false);
    const [identification, setIdentification] = useState(false);
    const [intensity, setIntensity] = useState(false);
    const [cellArea, setCellArea] = useState(false);


    const [clustering, setClustering] = useState(false);
    const [thresholding, setThresholding] = useState(false);
    const [homoInteractions, setHomoInteractions] = useState(false);
    const [heteroInteractions, setHeteroInteractions] = useState(false);
    const [permutedInteractions, setPermutedInteractions] = useState(false);
    const [th, setTh] = useState(false)
    const [hunu, setHunu] = useState(false)
    
    useImperativeHandle(ref, ()=>({
        submitSettings(){
            
            const formData = new FormData()
            formData.append("instrument", instrument)
            formData.append("area", area)
            formData.append("segmentation", segmentation)
            formData.append("identification", identification)
            formData.append("intensity", intensity)
            formData.append("cellArea", cellArea)
            
            formData.append("clustering", clustering)
            formData.append("thresholding", thresholding)
            formData.append("homoInteractions", homoInteractions)
            formData.append("heteroInteractions", heteroInteractions)
            formData.append("permutedInteractions", permutedInteractions)
            
            console.log(formData)
            async function submitData(){
                try {
                    let response = await axios({
                        url: "/submitSettings",
                        method: "post",
                        data: formData
                    })

                    return response.data
                }
                catch(err){
                    console.log(err)
                }
            }
           
            submitData()
            .then(function(response){

                //Get the values from formData to more usable format
                const newData = []   
                let j = 0
                for (const pair of formData.entries()) {
                newData[pair[0]] = pair[1] 
            
                }
            })
                
        
            
            
        }
    }))

    const handleChangeSelectInstrument = (event) => {
         
        setInstrument(event.target.value)
        
    }

    const showInstructions = event => {
        //setInfo()
        document.getElementById("instructionsSettings").style.display="block"
        document.getElementById("infoBtnSettings").style.display="none"
        document.getElementById("hideInfoBtnSettings").style.display="block"    
      }
    
      const hideInstructions = event =>{
        document.getElementById("instructionsSettings").style.display="none"
        document.getElementById("infoBtnSettings").style.display="block"
        document.getElementById("hideInfoBtnSettings").style.display="none"
      }


    return(
    <div>

    <div>
      
      <form class="settingsForm">

        <div class="row">
        <label for="instrumentDropMenu">Image acquisition platform:</label> 
        <select name="instrumentDropMenu" id="instrumentDropMenu" onChange={event => handleChangeSelectInstrument(event)}>
                      <option value="select" selected="true" disabled="disabled">Select</option>    
                      <option value="operetta">Operetta</option>
                      <option value="other">Brightfield</option>
                      
        </select>  
        </div>

        <br></br>
        <div class="row">
            <div class="col-1">
                <b>Select the processes to run:</b>
            </div>
            <div class="col-2">
                <div id = "infoBtnSettings" class="btn-instructions">  
                        <button type="button" onClick={showInstructions}>Info</button>
                </div>  
                <div  hidden id = "hideInfoBtnSettings" class="btn-instructions">  
                    <button type="button" onClick={hideInstructions}>Hide Info</button>
            </div>  
            </div>
        </div>

       
            
            {/*<div class="checkbox">   
                  <p>Area measurements: </p>
                  <input type = "checkbox" name="area" onChange={()=>setArea(!area)}/>                

             </div>*/}
            <div class="checkbox">    

                  <p>Image segmentation: </p>
                  <input type = "checkbox" name="segmentation" onChange={()=>setSegmentation(!segmentation)}/>
            </div>
            <div class="checkbox">    

                  <p>Cell type identification: </p>
              
                  <input type = "checkbox" name="identification" onChange={()=>setIdentification(!identification)}/>
            
            
            </div>

            <div class="checkbox">    

                  <p>Cell intensity measurements: </p>
              
                  <input type = "checkbox" name="intensity" onChange={()=>setIntensity(!intensity)}/>
            
            
            </div>
            <div class="checkbox">    

                  <p>Cell area measurements: </p>
              
                  <input type = "checkbox" name="cellArea" onChange={()=>setCellArea(!cellArea)}/>
            
            
            </div>
            

            {/*<div class="checkbox">    

            <p>Cell clustering: </p>

            <input type = "checkbox" name="clustering" onChange={()=>setClustering(!clustering)}/>


            </div>
            <div class="checkbox">    

            <p>Cell thresholding: </p>

            <input type = "checkbox" name="thresholding" onChange={()=>setThresholding(!thresholding)}/>


            </div>
            <div class="checkbox">    

            <p>Homotypic interactions: </p>

            <input type = "checkbox" name="homoInteractions" onChange={()=>setHomoInteractions(!homoInteractions)}/>


            </div>
            <div class="checkbox">    

            <p>Heterotypic interactions: </p>

            <input type = "checkbox" name="heteroInteractions" onChange={()=>setHeteroInteractions(!heteroInteractions)}/>


            </div>

            <div class="checkbox">    

            <p>Permuted interactions: </p>

            <input type = "checkbox" name="permutedInteractions" onChange={()=>setPermutedInteractions(!permutedInteractions)}/>
             
            </div>*/}
               

            <div hidden id="instructionsSettings" class="textarea-container">    
              <p disabled readonly rows="20" cols="50">
                <b>Instructions:<br></br><br></br></b>
                <b>Image acquisition platform: </b>If "Operetta" is selected as image acquisition platform the images are normalized, if "Other" is selected the images are noramlized, denoised and the contrast is adjusted<br></br> 
                <b>Image segmentation: </b>Deep learning segmentation. Cells from the background are segmented.<br></br>
                <b>Cell type identification: </b>Identifies cells belonging to different populations or tissue compartments according to their overlap with regions of interest in the thresholded image.<br></br>
                <b>Cell intensity measurements: </b>Computes pixel intensity distribution of segmented cells between two different groups.<br></br>
                <b>Cell area measurements: </b>Computes pixel counts of segmented cells. Enables analysis of cells expressing several markers<br></br>
              </p>        
        </div>
            
       
       </form>

    </div>


    </div>

    )
})
export default GetSettings;
 //      <App callparentFunction={()=>handleSettingsSubmit}/>

