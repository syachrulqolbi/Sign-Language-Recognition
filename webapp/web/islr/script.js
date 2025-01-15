// Select elements for video input and canvas output
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const enableWebcamButton = document.getElementById("camButton");

// Get the ASL selection input and datalist options
const aslSelection = document.getElementById("aslSelection");
const aslOptions = Array.from(document.querySelectorAll("#aslOptions option")).map(opt => opt.value);
const playVideoButton = document.getElementById("playVideo");

// Add an event listener for validation and video playing
aslSelection.addEventListener("change", () => {
    const selectedValue = aslSelection.value.trim().toLowerCase(); // Trim and normalize input
    const isValidOption = aslOptions.some(option => option.toLowerCase() === selectedValue);

    if (!isValidOption) {
        // Show an error popup if the input is invalid
        alert("Error: The entered value is not in the list of allowed options.");
        aslSelection.value = ""; // Clear the invalid input
    }
});

playVideoButton.addEventListener("click", () => {
    const selectedValue = aslSelection.value.trim().toLowerCase(); // Trim and normalize input
    const matchedOption = aslOptions.find(option => option.toLowerCase() === selectedValue);
    
    if (matchedOption) {
        const videoPath = `web/islr/videos/${matchedOption}.mp4`; // Use the matched option for the path
    
        // Create a container for the video
        const videoContainer = document.createElement("div");
        videoContainer.style.position = "fixed";
        videoContainer.style.top = "50%";
        videoContainer.style.left = "50%";
        videoContainer.style.transform = "translate(-50%, -50%)";
        videoContainer.style.width = "600px";
        videoContainer.style.height = "400px";
        videoContainer.style.zIndex = 10000;
        videoContainer.style.backgroundColor = "black";
        videoContainer.style.border = "2px solid white";
        videoContainer.style.borderRadius = "10px";
        videoContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)";
        videoContainer.style.overflow = "hidden";
        videoContainer.style.display = "flex";
        videoContainer.style.flexDirection = "column";
        videoContainer.style.justifyContent = "space-between"; // Ensure space for the close button

        // Create a video element
        const videoPlayer = document.createElement("video");
        videoPlayer.src = videoPath;
        videoPlayer.autoplay = true;
        videoPlayer.controls = true;
        videoPlayer.style.width = "100%";
        videoPlayer.style.height = "calc(100% - 50px)"; // Leave space for the button
        videoPlayer.style.flex = "1";

        // Create a close button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.classList.add("btn"); // Use the same style as other buttons
        closeButton.style.padding = "1rem"; // Add padding
        closeButton.style.width = "20rem"; // Adjust width to fit content
        closeButton.style.maxWidth = "200px"; // Optional: Limit maximum width for consistency
        closeButton.style.boxSizing = "border-box"; // Ensure padding doesn't affect width
        closeButton.style.margin = "0 auto 20px"; // Center the button horizontally

        closeButton.addEventListener("click", () => {
            document.body.removeChild(videoContainer);
        });

        // Append the video and close button to the container
        videoContainer.appendChild(videoPlayer);
        videoContainer.appendChild(closeButton);

        // Append the container to the body
        document.body.appendChild(videoContainer);
    } else {
        alert("Please select a valid sign before playing the video.");
    }
});

// Original Modal elements and interactions
const modalContainer = document.getElementById("modal_container");
const settingsIcon = document.querySelector(".bx-menu");
const closeModalButton = document.getElementById("close");

// Handle modal open/close
settingsIcon.addEventListener("click", () => {
    modalContainer.classList.add("show");
});

closeModalButton.addEventListener("click", () => {
    modalContainer.classList.remove("show");
});

modalContainer.addEventListener("click", (event) => {
    if (event.target === modalContainer) {
        modalContainer.classList.remove("show");
    }
});

// Elements for mode selection and input container
const listenMode = document.getElementById("listenMode");
const inputContainer = document.getElementById("inputContainer");

// Handle mode selection changes
listenMode.addEventListener("change", () => {
    if (listenMode.value === "online") {
        inputContainer.innerHTML = `
            <p id="note" style="color: var(--main-color);">
                 Online mode may experience high latency due to the use of free web services. Occasionally, it may take up to 30 seconds to wake up the server. If you've waited longer than this, try reloading the webpage.
            </p>
        `;
    } else if (listenMode.value === "offline") {
        inputContainer.innerHTML = `
            <label for="offlineInput" style="display: block; margin-bottom: 0.5rem;">Listen to:</label>
            <input 
                type="text" 
                id="offlineInput" 
                placeholder="http://127.0.0.1:8000/predict" 
                style="width: 100%; padding: 0.5rem; border-radius: 5px; border: 1px solid var(--main-color);"
            />
        `;
    }
});

// Initialize MediaPipe Holistic model
const holistic = new Holistic({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
});

// Configure Holistic model options
holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    refineFaceLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// Frame counter, landmark data collection, and API call status
let frameCount = 0;
let landmarkData = [];
let lastSendTime = performance.now();
let isApiCallInProgress = false;

// Adjust canvas and video dimensions for responsiveness
function adjustCanvasSize() {
    const screenWidth = window.innerWidth;
    const size = screenWidth <= 768 ? screenWidth * 0.9 : 480;
    canvasElement.width = size;
    canvasElement.height = size;
    videoElement.width = size;
    videoElement.height = size;
}

// Resize canvas on page load and window resize
window.addEventListener("resize", adjustCanvasSize);
adjustCanvasSize();

// Initialize camera and process frames with Holistic model
const camera = new Camera(videoElement, {
    onFrame: async () => await holistic.send({ image: videoElement }),
    width: canvasElement.width,
    height: canvasElement.height
});

// Enable webcam and start processing
function enableCam() {
    enableWebcamButton.style.display = "none";
    videoElement.style.display = "none";
    camera.start();
    holistic.onResults(onResults);
}

enableWebcamButton.innerHTML = "Enable Webcam";
enableWebcamButton.addEventListener("click", enableCam);

// Update the sendLandmarkData function to use the selected API endpoint
async function sendLandmarkData(data) {
    isApiCallInProgress = true;

    // Determine the endpoint based on listenMode value
    const listenModeValue = listenMode.value;
    let apiEndpoint;

    if (listenModeValue === "online") {
        apiEndpoint = 'https://islr-api.onrender.com/islr/predict';
    } else if (listenModeValue === "offline") {
        const offlineInput = document.getElementById('offlineInput');
        apiEndpoint = offlineInput?.value || 'http://127.0.0.1:8000/islr/predict';
    } else {
        // Default to offline endpoint
        apiEndpoint = 'https://islr-api.onrender.com/islr/predict';
    }

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById("pred").textContent = result.sign;
            document.getElementById("pred_sentence").textContent = result.sentence;
            console.log('Response from API:', result);
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error in sending data:', error);
    } finally {
        isApiCallInProgress = false;
    }
}

// Initialize default state for the API endpoint
document.addEventListener("DOMContentLoaded", () => {
    if (listenMode.value === "online") {
        inputContainer.innerHTML = `
            <p id="note" style="color: var(--main-color);">
                Online mode may experience high latency due to the use of free web services. Occasionally, it may take up to 30 seconds to wake up the server. If you've waited longer than this, try reloading the webpage.
            </p>
        `;
    } else {
        inputContainer.innerHTML = `
            <label for="offlineInput" style="display: block; margin-bottom: 0.5rem;">Listen to:</label>
            <input 
                type="text" 
                id="offlineInput" 
                placeholder="http://127.0.0.1:8000/islr/predict" 
                style="width: 100%; padding: 0.5rem; border-radius: 5px; border: 1px solid var(--main-color);"
            />
        `;
    }
});

// Global flag to track skeleton drawing
let drawSkeleton = true;

// Add event listener for the skeleton toggle button
const skeletonButton = document.getElementById("toggleSkeleton");
skeletonButton.addEventListener("click", () => {
    drawSkeleton = !drawSkeleton; // Toggle the state
    skeletonButton.textContent = drawSkeleton ? "On" : "Off"; // Update button text
});

// Process results and draw landmarks
function onResults(results) {
    canvasCtx.save();
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (drawSkeleton) {
        canvasCtx.globalCompositeOperation = 'source-over';
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
        drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
        drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2 });
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
        drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2 });
    }

    canvasCtx.restore();

    canvasElement.style.opacity = isApiCallInProgress ? "0.5" : "1";

    if (isApiCallInProgress) return;

    frameCount++;
    const timeInSeconds = (performance.now() / 1000).toFixed(2);

    landmarkData.push({
        timeInSeconds,
        frameNumber: frameCount,
        poseLandmarks: results.poseLandmarks,
        faceLandmarks: results.faceLandmarks,
        leftHandLandmarks: results.leftHandLandmarks,
        rightHandLandmarks: results.rightHandLandmarks,
    });

    // Dynamically update frame count threshold
    const predictionSpeed = parseInt(predictionSpeedSlider.value, 10);
    console.log(predictionSpeed);
    if (frameCount >= predictionSpeed) {
        sendLandmarkData(landmarkData);
        landmarkData = [];
        frameCount = 0;
        lastSendTime = performance.now();
    }
}

// Initialize slider
const predictionSpeedSlider = document.getElementById('predictionSpeed');
const sliderValueDisplay = document.getElementById('sliderValue');

// Update slider value display
predictionSpeedSlider.addEventListener('input', () => {
    sliderValueDisplay.textContent = predictionSpeedSlider.value;
});