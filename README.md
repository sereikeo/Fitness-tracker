# Fitness Tracker

This repository contains a fitness tracker application with a frontend built using React and a backend API built using FastAPI. The application is containerized using Docker and can be deployed locally or in the cloud.

## Local Development

To run the application locally, follow these steps:

1. Clone this repository.
2. Copy `.env.example` to `.env` and fill in your NOTION_API_KEY.
3. Run `docker-compose up`.

The frontend will be available at [http://localhost:3000](http://localhost:3000) and the API at [http://localhost:8000/api/workouts](http://localhost:8000/api/workouts).

## Deployment

The application can be deployed to Azure using Bicep templates. The deployment pipeline is triggered by pushes to the `main` branch.
