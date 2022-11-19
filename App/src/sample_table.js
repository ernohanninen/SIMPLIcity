/*
Title: getResults.js
Date: 2021-23-05
Author: Erno Hänninen
Description:
  - This scipt contains the table element where the samples are stored after submitting

Procedure:
 - Map thru the input array and set the values to table
 - Remove elements from table after remove is clicked
*/

//Modules
import React,  { useState, forwardRef, useImperativeHandle } from 'react';
import axios from "axios";

//Function which adds element to the table and removes them from there and from the file
const Table = (({tableData, setTableData}) => {

    //Function is called if delete is called. Removes the corresponding sample row and the sample from the metadata file
    const deleteRow = (index, e) =>{
        let sampleDel = tableData[index]["sample"]
        //Delete the sample from the table
        setTableData(tableData.filter((v, i) => i !== index));

        //Send request to the backend to delete the sample from metadata file
        const url = '/deleteSample';
        axios.post(url, {sample: sampleDel}).then((response) =>{ //Sending data in JSON format
          if(response.data=="error"){ //If error
            console.log("########ERROR########")
          }
          else{ //IF everyting okay
            console.log("READY")
          }
        });
    }

    //Returns the html table
    return(
        
        <table striped bordered hover class="sampleTable" id ="table">
                    <thead>
                        <tr>
                            <id>Id</id>
                            <th>Sample</th>
                            <th>Color</th>
                            <th>Comparison</th>
                            <th>Tiff files</th>
                            <th>Marker</th>
                            <th>Label</th>
                            <th>Thresholding</th>


                        </tr>
                    </thead>
                    <tbody>
                    { //Here the items are dynamically added to the table using map function
                        tableData.map((data, index)=>{
                            return(
                                <tr key={index}>
                                    <td>{index+1}</td>
                                    <td>{data.sample}</td>
                                    <td>{data.color}</td>
                                    <td>{data.comparison}</td>
                                    <td>{data.tiffs}</td>
                                    <td>{data.marker}</td>
                                    <td>{data.labels}</td> 
                                    <td>{data.thresholds}</td>                         

                                    <td><button type="button" onClick={(e)=>deleteRow(index,e)}>Delete</button></td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
            </table>
    )
})
export default Table;