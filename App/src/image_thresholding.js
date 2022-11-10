import React, { useState } from 'react';
import "./App.css";
import axios from "axios";



export default function Thresholding()  {
    const [image, setImage] = useState()
    const [thresholdedImages, setThresholdedImages] = useState()
    const runThresholding = () => {

        document.getElementById("submitImage").style.display = "none"
        document.getElementById("running").style.display = "block"

        const formData = new FormData()
        console.log(image.files)
        formData.append("image", image)
        console.log(image)
        const url = '/thresholdImage';
        axios.post(url, formData)
            .then((response) =>{
                if(response.data=="error"){ //If error
                    console.log("########ERROR########")
                }
                else{ //IF everyting okay
                    console.log(response)
                    let original_img = response.data["original_image"]
                    let min_thresh = response.data["min_thresh"]
                    let otsu_thresh = response.data["otsu_thresh"]
                    let sau_thresh = response.data["sau_thresh"]
                    let yen_thresh  =response.data["yen_thresh"]
                    let li_thresh = response.data["li_thresh"]
                    let triangle_thresh = response.data["triangle_thresh"]
                    let isodata_thresh  =response.data["isodata_thresh"]
                    let mean_thresh = response.data["mean_thresh"]

                    displayImages(original_img, min_thresh, otsu_thresh, sau_thresh, yen_thresh, li_thresh, triangle_thresh, isodata_thresh, mean_thresh) //Calling function which displays the images     
                    
                    document.getElementById("running").style.display = "none"
                }
        });      

        const displayImages = (original_img, min_thresh, otsu_thresh, sau_thresh, yen_thresh, li_thresh, triangle_thresh, isodata_thresh, mean_thresh) => { 
            
            console.log(original_img)
            console.log("../src/images/" + original_img)
            console.log("../src/images/" + min_thresh)
            console.log("../src/images/" + otsu_thresh)
            console.log("../src/images/" + sau_thresh)
            console.log("../src/images/" + yen_thresh)
            

            //src/images/test_thresholding/original_image.png
            //Map samples and set the images to variable
            setThresholdedImages(
                <div id="thresholdingResults" >
                    <div class="imageRow1">           
                        <div class = "imageColumn">
                            <p>Original:</p>
                            <img class="contain" id = "original" src={require("../src/images/test_thresholding/" + original_img) } onClick= {event => displayFullScreen("original")}></img>
                        </div>
                        <div class="imageColumn">
                            <p>Minimum:</p>
                            <img class="contain" id = "min"  src={require("../src/images/test_thresholding/" + min_thresh)} onClick= {event => displayFullScreen("min")}></img>
                        </div>
                        <div class="imageColumn">
                            <p>Otsu:</p>
                            <img class="contain" id = "otsu" src={require("../src/images/test_thresholding/" + otsu_thresh)} onClick= {event => displayFullScreen("otsu")}></img>
                        </div>
                    </div>
                    <div class="imageRow1">          
                        <div class="imageColumn">
                            <p>Sauvola:</p>
                            <img class="contain" id = "sau" src={require("../src/images/test_thresholding/" + sau_thresh)} onClick= {event => displayFullScreen("sau")}></img>
                        </div>
                        <div class="imageColumn">
                            <p>Yen:</p>
                            <img class="contain" id = "yen" src={require("../src/images/test_thresholding/" + yen_thresh)} onClick= {event => displayFullScreen("yen")}></img>
                        </div>
                        <div class="imageColumn">
                            <p>Li:</p>
                            <img class="contain" id = "li" src={require("../src/images/test_thresholding/" + li_thresh)} onClick= {event => displayFullScreen("li")}></img>
                        </div>
                    </div> 

                    <div class="imageRow1">          
                        <div class="imageColumn">
                            <p>Triangle:</p>
                            <img class="contain" id = "tri" src={require("../src/images/test_thresholding/" + triangle_thresh)} onClick= {event => displayFullScreen("tri")}></img>
                        </div>
                        <div class="imageColumn">
                            <p>Isodata:</p>
                            <img class="contain" id = "iso" src={require("../src/images/test_thresholding/" + isodata_thresh)} onClick= {event => displayFullScreen("iso")}></img>
                        </div>
                        <div class="imageColumn">
                            <p>Mean:</p>
                            <img class="contain" id = "mean" src={require("../src/images/test_thresholding/" + mean_thresh)} onClick= {event => displayFullScreen("mean")}></img>
                        </div>
                    </div> 
                    
    
                </div>
            )

        }
        const displayFullScreen = (id) => { 
            let elem = document.getElementById(id)
            if(document.fullscreenElement){
                document.exitFullscreen()
            }
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
        /**/
        

    }
    return( 
    <div>
        <form>
        <div id="submitImage">
            <div class="row">            
                <label for="tiff">Load tiff: &nbsp;</label>
                <input name="tiff" type = "file" onChange={(e)=>setImage(e.target.files[0])} />
                
            </div>
            <br></br>
            <button type="button" onClick={() => runThresholding()}>Thresholding</button>
        </div>
        <div id = "running" hidden>
            <p>Running thresholding algorithms</p>
        </div>

       
        
        
        </form>
        {thresholdedImages}
        
    </div>
    )
   
}



