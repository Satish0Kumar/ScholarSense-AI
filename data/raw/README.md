# Raw Data Directory

This directory contains raw datasets used for ML model training.

## Files:
- `student-mat.csv` - UCI Student Performance Dataset (Mathematics)
- `student-por.csv` - UCI Student Performance Dataset (Portuguese)
- `student_data.csv` - Processed student data for training

## Source:
UCI Machine Learning Repository - Student Performance Dataset
https://archive.ics.uci.edu/ml/datasets/Student+Performance

## Usage:
These files are used by:
- `backend/scripts/import_uci_data.py` - Import UCI data to database
- `scripts/train_model.py` - Train ML model
- `backend/scripts/retrain_model.py` - Retrain model with new data
