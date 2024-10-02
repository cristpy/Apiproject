import React,{useState} from `react`;
import axios from `axios`;
import { application } from "express";



function App() {
    const [file, setFile] = useState(null);
    const [transcription, setTranscription] = useState(``);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append(`audio`, file);

        try {
            const response = await axios.post(`http://localhost:3000/upload-audio`, formData, {
                headers: {
                    `Content-Type`: `multipart/form-data`,
                },
            });

            setTranscription(response.data.transcription);
        } catch (error) {
            console.error(`Error uploading the file:`, error);
        }
    };

            return {
                <div className= "App">
                <h1>Audio to Text Converter</h1>
                <input type="file" onChange={handleFileChange}/>
                <button onClick= {handleUpload}>Upload Audio</button>
                {transcription && <p>Transcription: {transcription}</p>}
                </div>
            );
        }

        const cors = require(`cors`);
        app.use(cors());

        export default App;
