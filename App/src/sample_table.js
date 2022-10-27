import React,  { useState, forwardRef, useImperativeHandle } from 'react';
import axios from "axios";

const Table = (({tableData, setTableData}) => {

    const deleteRow = (index, e) =>{
        let sampleDel = tableData[index]["sample"]
        console.log(sampleDel)
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
            {
                tableData.map((data, index)=>{
                    console.log("_____________________________")
                    console.log(data)
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