from fastapi import FastAPI, HTTPException
import os
import httpx

app = FastAPI()

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = "5b69a72d028e406eb91e330519729213"
NOTION_URL = f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/pages"

headers = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

@app.get("/api/workouts")
async def get_workouts():
    async with httpx.AsyncClient() as client:
        response = await client.post(NOTION_URL, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch workouts")

@app.post("/api/workouts")
async def create_workout(workout: dict):
    data = {
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

    async with httpx.AsyncClient() as client:
        response = await client.post(NOTION_URL, headers=headers, json=data)
        if response.status_code == 201:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to create workout")
