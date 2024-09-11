const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
let enableWebcamButton;

// Loading Model
const holistic = new Holistic({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
    }
});
// Setup Camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await holistic.send({ image: videoElement });
    },
    width: innerWidth,
    height: innerHeight
});

function enableCam(event) {
    enableWebcamButton.style.display = "none";
    videoElement.style.display = "none";
    camera.start();
    holistic.onResults(onResults);
}

function onResults(results) {       
    // Desktop 
    if (window.innerWidth >= window.innerHeight){
        canvasElement.width = window.innerWidth * 0.5;
        canvasElement.height = window.innerHeight * 0.5; 
    }
    // Mobile
    else{
        canvasElement.width = window.innerWidth * 0.5;
        canvasElement.height = window.innerHeight * 0.5; 
    }

    canvasCtx.save();
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Drawing Images from Camera
    canvasCtx.globalCompositeOperation = 'destination-atop';

    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: 2 });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
        { color: '#C0C0C070', lineWidth: 1 });
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
        { color: '#CC0000', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.leftHandLandmarks,
        { color: '#00FF00', lineWidth: 2 });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
        { color: '#00CC00', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.rightHandLandmarks,
        { color: '#FF0000', lineWidth: 2 });
    canvasCtx.restore();
}

holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    refineFaceLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

enableWebcamButton = document.getElementById("camButton");
enableWebcamButton.innerHTML = "Enable Webcam";
enableWebcamButton.addEventListener("click", enableCam);