// public/script.js
const video = document.getElementById('video');
const recommendationsDiv = document.getElementById('recommendations');
const transcriptionDiv = document.getElementById('transcription');
const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');

let recognition;
let isRecording = false;
let transcript = '';

// Get access to the webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error('Error accessing the webcam: ', err);
  });

// Check for browser support of Web Speech API
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    transcriptionDiv.innerHTML = `<p><strong>Final:</strong> ${transcript}</p><p><strong>Interim:</strong> ${interimTranscript}</p>`;
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
} else {
  console.error('Web Speech API is not supported in this browser.');
}

startRecordingButton.addEventListener('click', () => {
  if (recognition && !isRecording) {
    recognition.start();
    isRecording = true;
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
  }
});

stopRecordingButton.addEventListener('click', () => {
  if (recognition && isRecording) {
    recognition.stop();
    isRecording = false;
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
  }
});

function captureImage(callback) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(callback, 'image/jpeg', 0.5); // Compress to JPEG with 50% quality
}

function getRecommendations(imageBlob) {
  const reader = new FileReader();
  reader.onloadend = () => {
    const imageBase64 = reader.result.split(',')[1];
    fetch('/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageBase64 })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.details);
      }
      const imageUri = data.uri;
      return fetch('/get-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUri, transcript })
      });
    })
    .then(response => response.json())
    .then(data => {
      const recommendations = data.recommendations.split('\n').map(item => `<div class="bubble">${item}</div>`).join('');
      recommendationsDiv.innerHTML = recommendations;
    })
    .catch(err => {
      console.error('Error getting recommendations:', err);
    });
  };
  reader.readAsDataURL(imageBlob);
}

setInterval(() => {
  captureImage(getRecommendations);
}, 10000);
