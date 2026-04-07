from fastapi import FastAPI, HTTPException
import os
import requests

app = FastAPI()

NOTION_API_KEY = os.getenv('NOTION_API_KEY')
NOTION_DATABASE_ID = '5b69a72d028e406eb91e330519729213'
HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

@app.get("/api/workouts")
async def get_workouts():
    response = requests.post(
        f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query",
        headers=HEADERS
    )
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Notion API error")
    return response.json()

@app.post("/api/workouts")
async def create_workout(workout: dict):
    data = {
        "parent": {"database_id": NOTION_DATABASE_ID},
        "properties": {
            "Exercise": {"title": [{"text": {"content": workout.get("exercise", "")}}]},
            "Date": {"date": {"start": workout.get("date", ""), "end": None}},
            "Day": {"select": {"name": workout.get("day", "")}},
            "Muscle Group": {"select": {"name": workout.get("muscle_group", "")}},
            "Sets": {"number": workout.get("sets", 0)},
            "Reps": {"number": workout.get("reps", 0)},
            "Weight (kg)": {"number": workout.get("weight_kg", 0)},
            "Notes": {"rich_text": [{"text": {"content": workout.get("notes", "")}}]}
        }
    }

    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers=HEADERS,
        json=data
    )
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Notion API error")
    return response.json()
