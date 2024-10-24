import * as dotenv from 'dotenv';
import * as fs from 'fs';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

dotenv.config();
console.log('API_KEY:', process.env.API_KEY);

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
  words?: { start: number; end: number; text: string }[]; // Add word-level timestamps
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
        console.error('Error converting audio:', err);
        reject(err);
      });
  });
}

// Transcribe audio using AssemblyAI
async function transcribeAudio(filePath: string, timeout: number = 30000): Promise<{ text: string; srtPath: string }> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error('API key not found in environment variables.');

  const convertedFilePath = `${filePath}.wav`;
  const srtFilePath = `${filePath}.srt`;

  try {
    await convertAudio(filePath, convertedFilePath);

    // Upload audio to AssemblyAI
    const uploadResponse = await axios.post<UploadResponse>(
      'https://api.assemblyai.com/v2/upload',
      fs.createReadStream(convertedFilePath),
      { headers: { authorization: apiKey } }
    );

    const audioUrl = uploadResponse.data.upload_url;

    // Request transcription
    const transcriptResponse = await axios.post<TranscriptResponse>(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url: audioUrl, format_text: true },
      { headers: { authorization: apiKey } }
    );

    const transcriptId = transcriptResponse.data.id;

    // Poll for the transcription result
    const transcriptData = await pollTranscriptionResult(transcriptId, apiKey, timeout);

    return { text: transcriptData.text!, srtPath: srtFilePath };
  } catch (error: any) {
    console.error('Transcription Error:', error.response?.data || error.message);
    throw new Error('Failed to process the audio');
  } finally {
    cleanUpFiles([convertedFilePath, filePath]);
  }
}

// Poll the transcription status with a timeout
async function pollTranscriptionResult(
  transcriptId: string,
  apiKey: string,
  timeout: number
): Promise<TranscriptStatusResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const response = await axios.get<TranscriptStatusResponse>(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      { headers: { authorization: apiKey } }
    );

    const statusResponse = response.data;

    if (statusResponse.status === 'completed') {
      return statusResponse;
    } else if (statusResponse.status === 'failed') {
      throw new Error('Transcription failed: ' + statusResponse.error);
    }

    await new Promise((res) => setTimeout(res, 5000));
  }

  throw new Error('Transcription timed out.');
}

// Clean up files after processing
function cleanUpFiles(files: string[]) {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted file: ${file}`);
    }
  });
}

export { transcribeAudio };
