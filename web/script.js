// Select elements for video input and canvas output
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
let enableWebcamButton = document.getElementById("camButton");

// Initialize MediaPipe Holistic model with CDN source
const holistic = new Holistic({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
});

// Function to set canvas dimensions to square based on screen size
function adjustCanvasSize() {
    const screenWidth = window.innerWidth;
    const size = screenWidth <= 768 ? screenWidth * 0.9 : 480; // Responsive width
    canvasElement.width = size;
    canvasElement.height = size;
    videoElement.width = size;
    videoElement.height = size;
}

// Adjust canvas size on page load and window resize
window.addEventListener("resize", adjustCanvasSize);
adjustCanvasSize(); // Initial size adjustment

// Initialize camera and link with Holistic model
const camera = new Camera(videoElement, {
    onFrame: async () => await holistic.send({ image: videoElement }),
    width: canvasElement.width,
    height: canvasElement.height
});

// Enable camera on button click and start processing frames
function enableCam() {
    enableWebcamButton.style.display = "none";
    videoElement.style.display = "none";
    camera.start();
    holistic.onResults(onResults);
}

// Send landmark data to the FastAPI server for processing
async function sendLandmarkData(data) {
    try {
        const response = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById("pred").innerHTML = result.prediction;
            console.log('Response from FastAPI:', result);
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error in sending data:', error);
    }
}

// Draw landmarks and connectors on the canvas
function onResults(results) {
    const data = {
        poseLandmarks: results.poseLandmarks,
        faceLandmarks: results.faceLandmarks,
        leftHandLandmarks: results.leftHandLandmarks,
        rightHandLandmarks: results.rightHandLandmarks
    };
    sendLandmarkData(data);

    // Prepare canvas for mirroring and drawing
    canvasCtx.save();
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1); // Flip horizontally
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw camera feed onto canvas
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Draw landmarks and connections
    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2 });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2 });
    
    canvasCtx.restore(); // Restore canvas state
}

// Set options for Holistic model configuration
holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    refineFaceLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// Initialize and style enable webcam button
enableWebcamButton.innerHTML = "Enable Webcam";
enableWebcamButton.addEventListener("click", enableCam);
