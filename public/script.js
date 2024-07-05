// public/script.js
const video = document.getElementById('video');
const recommendationsDiv = document.getElementById('recommendations');

// Get access to the webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error('Error accessing the webcam: ', err);
  });

function captureImage() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

function getRecommendations(imageBase64) {
  fetch('/get-recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageBase64 })
  })
  .then(response => response.json())
  .then(data => {
    const recommendations = data.recommendations.split('\n').map(item => `<div class="bubble">${item}</div>`).join('');
    recommendationsDiv.innerHTML = recommendations;
  })
  .catch(err => {
    console.error('Error getting recommendations: ', err);
  });
}

setInterval(() => {
  const imageBase64 = captureImage();
  getRecommendations(imageBase64);
}, 30000);
