from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import joblib

app = FastAPI()
model = joblib.load("model.gz")
ohe = joblib.load('ohe.gz')
sc = joblib.load("sc.gz")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can specify a list of allowed origins instead of "*"
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Define the model structure to receive landmarks
class Landmark(BaseModel):
    x: float
    y: float
    z: Optional[float] = None
    visibility: Optional[float] = None

class LandmarkData(BaseModel):
    poseLandmarks: Optional[List[Landmark]] = None
    faceLandmarks: Optional[List[Landmark]] = None
    leftHandLandmarks: Optional[List[Landmark]] = None
    rightHandLandmarks: Optional[List[Landmark]] = None

@app.post("/predict")
async def predict(data: LandmarkData):
    # Process the received landmarks
    #print("Pose Landmarks:", data.poseLandmarks)
    #print("Face Landmarks:", data.faceLandmarks)
    #print("Left Hand Landmarks:", data.leftHandLandmarks)
    #print("Right Hand Landmarks:", data.rightHandLandmarks)

    if data.rightHandLandmarks is not None:
        X_data = []
        for i in range(len(data.rightHandLandmarks)):
            X_data.append([data.rightHandLandmarks[i].x, data.rightHandLandmarks[i].y, data.rightHandLandmarks[i].z])

        X_data = np.array([X_data])
        X_data = X_data.reshape(X_data.shape[0], -1)
        X_data = sc.transform(X_data)
        y_pred = ohe.inverse_transform(model.predict(X_data)).reshape(-1)[0]
    else:
        y_pred = None
    
    return {"status": 200, "prediction": y_pred}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)