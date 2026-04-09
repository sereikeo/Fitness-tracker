from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from pydantic import BaseModel, Field
import asyncio
from datetime import datetime


class ExerciseInput(BaseModel):
    exercise: str
    muscle_group: str
    sets: int
    reps: int
    weight_kg: float
    notes: str = ""

class SessionPayload(BaseModel):
    date: str = Field(..., description="Date of the session in YYYY-MM-DD format")
    exercises: list[ExerciseInput] = Field(..., description="List of exercises for the session")

class WorkoutEntry(BaseModel):
    exercise: str
    date: str
    day: str
    muscle_group: str
    sets: int
    reps: int
    weight_kg: float
    notes: str = ""

class RoutineExerciseInput(BaseModel):
    routine_id: str
    exercise_id: str
    default_sets: int
    order: int

class ScheduleInput(BaseModel):
    routine_id: str
    scheduled_date: str
    status: str = "Scheduled"

app = FastAPI()

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_WORKOUT_DB = os.getenv("NOTION_DATABASE_ID", "5b69a72d028e406eb91e330519729213")
NOTION_EXERCISES_DB = "25763bd843c645828dc29e7e21ffb633"
NOTION_ROUTINES_DB = "79791a9fb06347159d07fad3b3f99727"
NOTION_ROUTINE_EXERCISES_DB = "e103ffbcfb9c47d1b1584f3f70c60ebe"
NOTION_SCHEDULE_DB = "9dc7abad0a3f4cc2a0bdcdb7413a1246"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def notion_headers():
    return {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

def build_properties(exercise: ExerciseInput, date: str, day: str):
    return {
        "Exercise": {"title": [{"text": {"content": exercise.exercise}}]},
        "Date": {"date": {"start": date, "end": None}},
        "Day": {"select": {"name": day}},
        "Muscle Group": {"select": {"name": exercise.muscle_group}},
        "Sets": {"number": exercise.sets},
        "Reps": {"number": exercise.reps},
        "Weight (kg)": {"number": exercise.weight_kg},
        "Notes": {"rich_text": [{"text": {"content": exercise.notes}}] if exercise.notes else []}
    }

async def notion_request(method, url, data=None):
    async with httpx.AsyncClient() as client:
        response = await client.request(method, url, headers=notion_headers(), json=data)
        if response.status_code not in [200, 201]:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()

async def query_db(db_id: str, filter_data: dict = None):
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    payload = filter_data or {}
    all_results = []
    has_more = True
    next_cursor = None
    while has_more:
        if next_cursor:
            payload["start_cursor"] = next_cursor
        response = await notion_request("POST", url, data=payload)
        all_results.extend(response.get("results", []))
        has_more = response.get("has_more", False)
        next_cursor = response.get("next_cursor")
    return all_results

# --- Health ---

@app.get("/health")
async def health():
    return {"status": "ok"}

# --- Exercises ---

@app.get("/api/exercises")
async def get_exercises():
    results = await query_db(NOTION_EXERCISES_DB, {"sorts": [{"property": "Name", "direction": "ascending"}]})
    exercises = []
    for r in results:
        props = r["properties"]
        name = props["Name"]["title"][0]["plain_text"] if props["Name"]["title"] else ""
        muscle_group = props["Muscle Group"]["select"]["name"] if props["Muscle Group"]["select"] else ""
        exercises.append({"id": r["id"], "name": name, "muscle_group": muscle_group})
    return exercises

# --- Routines ---

@app.get("/api/routines")
async def get_routines():
    results = await query_db(NOTION_ROUTINES_DB)
    routines = []
    for r in results:
        props = r["properties"]
        name = props["Name"]["title"][0]["plain_text"] if props["Name"]["title"] else ""
        day = props["Day"]["select"]["name"] if props["Day"]["select"] else ""
        routines.append({"id": r["id"], "name": name, "day": day})
    return routines

@app.post("/api/routines", status_code=201)
async def create_routine(payload: dict):
    url = "https://api.notion.com/v1/pages"
    data = {
        "parent": {"database_id": NOTION_ROUTINES_DB},
        "properties": {
            "Name": {"title": [{"text": {"content": payload["name"]}}]},
            "Day": {"select": {"name": payload["day"]}}
        }
    }
    result = await notion_request("POST", url, data)
    return {"id": result["id"]}

# --- Routine Exercises ---

@app.get("/api/routines/{routine_id}/exercises")
async def get_routine_exercises(routine_id: str):
    filter_data = {
        "filter": {"property": "Routine", "relation": {"contains": routine_id}},
        "sorts": [{"property": "Order", "direction": "ascending"}]
    }
    results = await query_db(NOTION_ROUTINE_EXERCISES_DB, filter_data)
    items = []
    for r in results:
        props = r["properties"]
        name = props["Name"]["title"][0]["plain_text"] if props["Name"]["title"] else ""
        default_sets = props["Default Sets"]["number"] or 3
        order = props["Order"]["number"] or 0
        exercise_relations = props["Exercise"]["relation"]
        exercise_id = exercise_relations[0]["id"] if exercise_relations else None
        items.append({
            "id": r["id"],
            "name": name,
            "exercise_id": exercise_id,
            "default_sets": default_sets,
            "order": order
        })
    return items

@app.post("/api/routines/{routine_id}/exercises", status_code=201)
async def add_routine_exercise(routine_id: str, payload: RoutineExerciseInput):
    url = "https://api.notion.com/v1/pages"
    data = {
        "parent": {"database_id": NOTION_ROUTINE_EXERCISES_DB},
        "properties": {
            "Name": {"title": [{"text": {"content": f"Routine exercise"}}]},
            "Routine": {"relation": [{"id": routine_id}]},
            "Exercise": {"relation": [{"id": payload.exercise_id}]},
            "Default Sets": {"number": payload.default_sets},
            "Order": {"number": payload.order}
        }
    }
    result = await notion_request("POST", url, data)
    return {"id": result["id"]}

# --- Schedule ---


@app.get("/api/schedule/today")
async def get_todays_schedule():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    filter_data = {
        "filter": {
            "and": [
                {"property": "Scheduled Date", "date": {"equals": today}},
                {"property": "Status", "select": {"equals": "Scheduled"}}
            ]
        }
    }
    results = await query_db(NOTION_SCHEDULE_DB, filter_data)
    if not results:
        return None
    r = results[0]
    props = r["properties"]
    routine_relations = props["Routine"]["relation"]
    routine_id = routine_relations[0]["id"] if routine_relations else None
    return {
        "id": r["id"],
        "routine_id": routine_id,
        "scheduled_date": today,
        "status": props["Status"]["select"]["name"]
    }
    
@app.get("/api/schedule")
async def get_schedule():
    results = await query_db(NOTION_SCHEDULE_DB, {"sorts": [{"property": "Scheduled Date", "direction": "ascending"}]})
    items = []
    for r in results:
        props = r["properties"]
        name = props["Name"]["title"][0]["plain_text"] if props["Name"]["title"] else ""
        status = props["Status"]["select"]["name"] if props["Status"]["select"] else ""
        scheduled_date = props["Scheduled Date"]["date"]["start"] if props["Scheduled Date"]["date"] else None
        logged_date = props["Logged Date"]["date"]["start"] if props["Logged Date"]["date"] else None
        routine_relations = props["Routine"]["relation"]
        routine_id = routine_relations[0]["id"] if routine_relations else None
        items.append({
            "id": r["id"],
            "name": name,
            "routine_id": routine_id,
            "scheduled_date": scheduled_date,
            "logged_date": logged_date,
            "status": status
        })
    return items

@app.post("/api/schedule", status_code=201)
async def create_schedule_entries(payload: dict):
    """Create multiple schedule entries for a routine over N weeks."""
    from datetime import timedelta
    routine_id = payload["routine_id"]
    start_date = datetime.strptime(payload["start_date"], "%Y-%m-%d")
    weeks = payload["weeks"]
    url = "https://api.notion.com/v1/pages"
    tasks = []
    for i in range(weeks):
        entry_date = (start_date + timedelta(weeks=i)).strftime("%Y-%m-%d")
        data = {
            "parent": {"database_id": NOTION_SCHEDULE_DB},
            "properties": {
                "Name": {"title": [{"text": {"content": entry_date}}]},
                "Routine": {"relation": [{"id": routine_id}]},
                "Scheduled Date": {"date": {"start": entry_date}},
                "Status": {"select": {"name": "Scheduled"}}
            }
        }
        tasks.append(notion_request("POST", url, data=data))
    results = await asyncio.gather(*tasks)
    return {"created": len(results)}

@app.patch("/api/schedule/{entry_id}")
async def update_schedule_entry(entry_id: str, payload: dict):
    url = f"https://api.notion.com/v1/pages/{entry_id}"
    properties = {}
    if "status" in payload:
        properties["Status"] = {"select": {"name": payload["status"]}}
    if "logged_date" in payload:
        properties["Logged Date"] = {"date": {"start": payload["logged_date"]}}
    result = await notion_request("PATCH", url, data={"properties": properties})
    return {"id": result["id"]}

# --- Workouts (existing) ---

@app.get("/api/workouts")
async def get_workouts():
    url = f"https://api.notion.com/v1/databases/{NOTION_WORKOUT_DB}/query"
    return await notion_request("POST", url)

@app.get("/api/workouts/{page_id}")
async def get_workout(page_id: str):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    return await notion_request("GET", url)

@app.post("/api/workouts", status_code=201)
async def create_workout(workout: WorkoutEntry):
    url = "https://api.notion.com/v1/pages"
    data = {"parent": {"database_id": NOTION_WORKOUT_DB}, "properties": build_properties(workout, workout.date, workout.day)}
    return await notion_request("POST", url, data)

@app.patch("/api/workouts/{page_id}")
async def update_workout(page_id: str, workout: WorkoutEntry):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    data = {"properties": build_properties(workout, workout.date, workout.day)}
    return await notion_request("PATCH", url, data)

@app.delete("/api/workouts/{page_id}", status_code=204)
async def delete_workout(page_id: str):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    await notion_request("PATCH", url, data={"archived": True})

# --- Sessions (existing) ---

@app.get("/api/sessions")
async def get_sessions():
    all_workouts = await query_db(NOTION_WORKOUT_DB, {"sorts": [{"property": "Date", "direction": "descending"}]})
    sessions = {}
    for workout in all_workouts:
        properties = workout["properties"]
        date_str = properties["Date"]["date"]["start"].split('T')[0]
        exercise = properties["Exercise"]["title"][0]["plain_text"]
        muscle_group = properties["Muscle Group"]["select"]["name"] if properties["Muscle Group"]["select"] else ""
        sets = properties["Sets"]["number"] or 0
        reps = properties["Reps"]["number"] or 0
        weight_kg = properties["Weight (kg)"]["number"] or 0.0
        day_of_week = datetime.strptime(date_str, "%Y-%m-%d").strftime("%A")
        if date_str not in sessions:
            sessions[date_str] = {"date": date_str, "day": day_of_week, "exercise_count": 0, "total_volume_kg": 0.0, "muscle_groups": []}
        session = sessions[date_str]
        session["exercise_count"] += 1
        session["total_volume_kg"] += sets * reps * weight_kg
        if muscle_group and muscle_group not in session["muscle_groups"]:
            session["muscle_groups"].append(muscle_group)
    return sorted(sessions.values(), key=lambda x: x["date"], reverse=True)

@app.get("/api/sessions/{date}")
async def get_session(date: str):
    filter_data = {"filter": {"property": "Date", "date": {"equals": date}}}
    workouts = await query_db(NOTION_WORKOUT_DB, filter_data)
    exercises = []
    for workout in workouts:
        properties = workout["properties"]
        exercises.append({
            "id": workout["id"],
            "exercise": properties["Exercise"]["title"][0]["plain_text"],
            "muscle_group": properties["Muscle Group"]["select"]["name"] if properties["Muscle Group"]["select"] else "",
            "sets": properties["Sets"]["number"] or 0,
            "reps": properties["Reps"]["number"] or 0,
            "weight_kg": properties["Weight (kg)"]["number"] or 0.0,
            "notes": properties["Notes"]["rich_text"][0]["plain_text"] if properties["Notes"]["rich_text"] else ""
        })
    return exercises

@app.post("/api/sessions", status_code=201)
async def create_session(session: SessionPayload):
    url = "https://api.notion.com/v1/pages"
    day_of_week = datetime.strptime(session.date, "%Y-%m-%d").strftime("%A")
    tasks = []
    for exercise in session.exercises:
        data = {
            "parent": {"database_id": NOTION_WORKOUT_DB},
            "properties": build_properties(exercise, session.date, day_of_week)
        }
        tasks.append(notion_request("POST", url, data=data))
    results = await asyncio.gather(*tasks)
    return {"created": len(results)}