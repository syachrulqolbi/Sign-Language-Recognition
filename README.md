# Sign Language Recognition

#### Project Status: In Progress

## Project Intro/Objective

This project is part of my Master's Degree final project and focuses on an end-to-end system for isolated sign language recognition, featuring data preprocessing, deep learning-based model training, real-time prediction, and a web interface for live sign recognition to enhance accessibility and communication.

## Methods Used
- 

## Technologies
- Python

## Project Description

This project involves p. The following steps are implemented:

1. **Dataset Preparation**: Fetching and organizing the COVID-19 Radiography Database using the Kaggle API and extracting the dataset with Patool.
2. **Preprocessing**: Performing data augmentation and ensuring data readiness for model training. Images are resized to 128x128 pixels, and training and validation datasets are split with a 70-30 ratio.
3. **Model Building**: Using a Convolutional Neural Network (CNN) architecture with varying configurations for binary (COVID-19 Positive/Negative) and categorical (Normal/Pneumonia/COVID) classification tasks.
4. **Evaluation**: Assessing the model's performance through accuracy and validation accuracy metrics.
5. **Visualization**: Plotting training vs validation loss and accuracy to analyze the model's performance.

## Dataset
The dataset used in this project is the **SignData Gatech**, which can be accessed at [SignData](https://signdata.cc.gatech.edu/).

## Directory Structure
```
├── model.ipynb        <- Jupyter Notebook containing the code for dataset preparation, model training, and evaluation.
├── README.md          <- Project documentation and instructions.
```

## Quick Links
- [SignData](https://signdata.cc.gatech.edu/)

## Requirements

The following packages and versions are required to run the project:

### Core Requirements
- Python 3.7.10

### Additional Requirements for Dataset Preparation
- Pandas 1.1.5

### Setup Instructions
1. Install the required Python packages:
   ```bash
   pip install 
   ```

## Results

### Covid Model (Positive/Negative)
| Metric       | Value |
|--------------|-------|
| Accuracy     | |
| Val_Accuracy | |

## Contributing Members

**Team Members**
* [Syachrul Qolbi Nur Septi](https://www.linkedin.com/in/syachrulqolbi)  
