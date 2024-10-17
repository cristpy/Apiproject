import * as dotenv from 'dotenv';
import * as fs from 'fs';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config();
const apikey = process.env.API_KEY || ''; // More specific environment variable

if (!apikey) {
  console.error('Error: Missing AssemblyAI API key in environment variables');
  process.exit(1);
}

// Define interfaces for API responses
interface UploadResponse {
  upload_url: string;
}

interface TranscriptResponse {
  id: string;
}

interface TranscriptStatusResponse {
  status: 'completed' | 'failed' | 'processing';
  text?: string;
  error?: string;
}

// Convert audio to LINEAR16 WAV
async function convertAudio(inputPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-ar 16000', '-ac 1', '-f wav'])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err: Error) => {
        console.error('Error converting audio:', err.message);
        reject(err);
      });
  });
}

// Transcribe audio using AssemblyAI
async function transcribeAudio(filePath: string): Promise<string> {
  const convertedFilePath = `${filePath}.wav`;

  try {
    await convertAudio(filePath, convertedFilePath);

    // Upload audio to AssemblyAI
    const audioUrl = await uploadAudioToAssemblyAI(convertedFilePath);
    console.log('Uploaded audio URL:', audioUrl);

    // Request transcription
    const transcriptId = await requestTranscription(audioUrl);
    console.log(`Transcript ID: ${transcriptId}`);

    // Poll for transcription result
    const text = await pollTranscriptionResult(transcriptId, apikey);
    return text;
  } catch (error: any) {
    console.error('Transcription Error:', error.message);
    throw new Error('Failed to process the audio');
  } finally {
    await cleanUpFiles([convertedFilePath, filePath]);
  }
}

// Upload audio file to AssemblyAI
async function uploadAudioToAssemblyAI(filePath: string): Promise<string> {
  const stream = fs.createReadStream(filePath);

  const { data } = await axios.post<UploadResponse>(
    'https://api.assemblyai.com/v2/upload',
    stream,
    { headers: { authorization: apikey, 'Content-Type': 'multipart/form-data' } }
  );

  return data.upload_url;
}

// Request transcription from AssemblyAI
async function requestTranscription(audioUrl: string): Promise<string> {
  const { data } = await axios.post<TranscriptResponse>(
    'https://api.assemblyai.com/v2/transcript',
    { audio_url: audioUrl },
    { headers: { authorization: apikey } }
  );

  return data.id;
}

// Poll the transcription status with a timeout
async function pollTranscriptionResult(
  transcriptId: string,
  apiKey: string,
  timeout: number = 60000, // Timeout increased to 60 seconds, can be configurable
  pollInterval: number = 5000 // Poll every 5 seconds
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const { data: statusResponse } = await axios.get<TranscriptStatusResponse>(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      { headers: { authorization: apiKey } }
    );

    if (statusResponse.status === 'completed') {
      return statusResponse.text!;
    } else if (statusResponse.status === 'failed') {
      throw new Error('Transcription failed: ' + statusResponse.error);
    }

    await new Promise((res) => setTimeout(res, pollInterval)); // Wait pollInterval milliseconds
  }

  throw new Error('Transcription timed out.');
}

// Clean up files after processing (async version)
async function cleanUpFiles(files: string[]): Promise<void> {
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.unlink(file, (err) => {
        if (err) console.error(`Failed to delete file: ${file}`, err);
        else console.log(`Deleted file: ${file}`);
      });
    }
  }
}

// Translate text using LibreTranslate
async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const { data } = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: 'en', // Source language (adjust if needed)
        target: targetLanguage, // Target language passed to the function
        format: 'text',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log(`Translation result: ${data.translatedText}`);
    return data.translatedText;
  } catch (error: any) {
    console.error('Translation Error:', error.message);
    throw new Error('Failed to translate the text.');
  }
}

export { transcribeAudio, translateText };
