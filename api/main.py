from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import uuid
import os

DB_PATH = os.getenv("DB_PATH", "/data/fitness.db")
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)

DDL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS exercises (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    muscle_group TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_exercises (
    id           TEXT PRIMARY KEY,
    program_id   TEXT NOT NULL REFERENCES programs(id),
    exercise_id  TEXT NOT NULL REFERENCES exercises(id),
    default_sets INTEGER NOT NULL DEFAULT 3 CHECK(default_sets > 0),
    "order"      INTEGER NOT NULL DEFAULT 0,
    UNIQUE(program_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS plans (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    day        TEXT,
    program_id TEXT REFERENCES programs(id)
);

CREATE TABLE IF NOT EXISTS workout_log (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    day         TEXT NOT NULL,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    sets        INTEGER NOT NULL CHECK(sets > 0),
    reps        INTEGER NOT NULL CHECK(reps > 0),
    weight_kg   REAL NOT NULL CHECK(weight_kg >= 0),
    notes       TEXT DEFAULT ''
);
"""

def get_conn():
    conn = engine.connect()
    conn.execute(text("PRAGMA foreign_keys = ON"))
    return conn

@asynccontextmanager
async def lifespan(app: FastAPI):
    with engine.connect() as conn:
        conn.execute(text("PRAGMA foreign_keys = ON"))
        for statement in DDL.strip().split(";"):
            s = statement.strip()
            if s:
                conn.execute(text(s))
        conn.commit()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic models ---

class ExerciseInput(BaseModel):
    exercise_id: str
    sets: int
    reps: int
    weight_kg: float
    notes: str = ""

class SessionPayload(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD")
    exercises: list[ExerciseInput]

class ProgramExerciseInput(BaseModel):
    program_id: str
    exercise_id: str
    default_sets: int
    order: int

# --- Health ---

@app.get("/health")
async def health():
    return {"status": "ok"}

# --- Exercises ---

@app.get("/api/exercises")
async def get_exercises():
    with get_conn() as conn:
        rows = conn.execute(
            text("SELECT id, name, muscle_group FROM exercises ORDER BY name ASC")
        ).fetchall()
    return [{"id": r.id, "name": r.name, "muscle_group": r.muscle_group} for r in rows]

@app.post("/api/exercises", status_code=201)
async def create_exercise(payload: dict):
    eid = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            text("INSERT INTO exercises (id, name, muscle_group) VALUES (:id, :name, :muscle_group)"),
            {"id": eid, "name": payload["name"], "muscle_group": payload["muscle_group"]}
        )
        conn.commit()
    return {"id": eid}

# --- Programs ---

@app.get("/api/programs")
async def get_programs():
    with get_conn() as conn:
        rows = conn.execute(text("SELECT id, name FROM programs ORDER BY name ASC")).fetchall()
    return [{"id": r.id, "name": r.name} for r in rows]

@app.get("/api/programs/{program_id}")
async def get_program(program_id: str):
    with get_conn() as conn:
        row = conn.execute(
            text("SELECT id, name FROM programs WHERE id = :id"),
            {"id": program_id}
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    return {"id": row.id, "name": row.name}

@app.post("/api/programs", status_code=201)
async def create_program(payload: dict):
    pid = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            text("INSERT INTO programs (id, name) VALUES (:id, :name)"),
            {"id": pid, "name": payload["name"]}
        )
        conn.commit()
    return {"id": pid}

@app.delete("/api/programs/{program_id}", status_code=204)
async def delete_program(program_id: str):
    with get_conn() as conn:
        conn.execute(
            text("DELETE FROM program_exercises WHERE program_id = :id"),
            {"id": program_id}
        )
        conn.execute(
            text("UPDATE plans SET program_id = NULL WHERE program_id = :id"),
            {"id": program_id}
        )
        conn.execute(
            text("DELETE FROM programs WHERE id = :id"),
            {"id": program_id}
        )
        conn.commit()

# --- Program Exercises ---

@app.get("/api/programs/{program_id}/exercises")
async def get_program_exercises(program_id: str):
    with get_conn() as conn:
        rows = conn.execute(
            text("""
                SELECT pe.id, pe.exercise_id, pe.default_sets, pe."order",
                       e.name, e.muscle_group
                FROM program_exercises pe
                JOIN exercises e ON e.id = pe.exercise_id
                WHERE pe.program_id = :program_id
                ORDER BY pe."order" ASC
            """),
            {"program_id": program_id}
        ).fetchall()
    return [
        {
            "id": r.id,
            "name": r.name,
            "exercise_id": r.exercise_id,
            "muscle_group": r.muscle_group,
            "default_sets": r.default_sets,
            "order": r.order
        }
        for r in rows
    ]

@app.post("/api/programs/{program_id}/exercises", status_code=201)
async def add_program_exercise(program_id: str, payload: ProgramExerciseInput):
    peid = str(uuid.uuid4())
    with get_conn() as conn:
        try:
            conn.execute(
                text("""
                    INSERT INTO program_exercises (id, program_id, exercise_id, default_sets, "order")
                    VALUES (:id, :program_id, :exercise_id, :default_sets, :order)
                """),
                {
                    "id": peid,
                    "program_id": program_id,
                    "exercise_id": payload.exercise_id,
                    "default_sets": payload.default_sets,
                    "order": payload.order
                }
            )
            conn.commit()
        except Exception as e:
            if "UNIQUE" in str(e):
                raise HTTPException(status_code=409, detail="Exercise already in program")
            raise
    return {"id": peid}

@app.delete("/api/programs/{program_id}/exercises/{exercise_id}", status_code=204)
async def delete_program_exercise(program_id: str, exercise_id: str):
    with get_conn() as conn:
        conn.execute(
            text("DELETE FROM program_exercises WHERE id = :id AND program_id = :program_id"),
            {"id": exercise_id, "program_id": program_id}
        )
        conn.commit()

# --- Plans ---

@app.get("/api/plans")
async def get_plans():
    with get_conn() as conn:
        rows = conn.execute(text("SELECT id, name, day, program_id FROM plans")).fetchall()
    return [{"id": r.id, "name": r.name, "day": r.day, "program_id": r.program_id} for r in rows]

@app.get("/api/plans/{plan_id}")
async def get_plan(plan_id: str):
    with get_conn() as conn:
        row = conn.execute(
            text("SELECT id, name, day, program_id FROM plans WHERE id = :id"),
            {"id": plan_id}
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"id": row.id, "name": row.name, "day": row.day, "program_id": row.program_id}

@app.post("/api/plans", status_code=201)
async def create_plan(payload: dict):
    pid = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            text("INSERT INTO plans (id, name, day, program_id) VALUES (:id, :name, :day, :program_id)"),
            {"id": pid, "name": payload["name"], "day": payload.get("day"), "program_id": payload.get("program_id")}
        )
        conn.commit()
    return {"id": pid}

@app.delete("/api/plans/{plan_id}", status_code=204)
async def delete_plan(plan_id: str):
    with get_conn() as conn:
        conn.execute(text("DELETE FROM plans WHERE id = :id"), {"id": plan_id})
        conn.commit()

# --- Schedule ---

@app.get("/api/schedule/today")
async def get_todays_schedule():
    today = datetime.now().strftime("%Y-%m-%d")
    day_name = datetime.now().strftime("%A")

    with get_conn() as conn:
        # Check if already logged today
        logged = conn.execute(
            text("SELECT id FROM workout_log WHERE date = :date LIMIT 1"),
            {"date": today}
        ).fetchone()
        status = "Completed" if logged else "Scheduled"

        # Find plan for today's day of week
        row = conn.execute(
            text("SELECT id, name, program_id FROM plans WHERE day = :day LIMIT 1"),
            {"day": day_name}
        ).fetchone()

    if not row:
        return None

    return {
        "id": row.id,
        "routine_id": row.program_id,
        "scheduled_date": today,
        "status": status
    }

# --- Sessions ---

@app.get("/api/sessions")
async def get_sessions(limit: int = Query(20, ge=1, le=200)):
    with get_conn() as conn:
        rows = conn.execute(
            text("""
                SELECT wl.date, wl.day,
                       COUNT(*) as exercise_count,
                       SUM(wl.sets * wl.reps * wl.weight_kg) as total_volume_kg,
                       GROUP_CONCAT(DISTINCT e.muscle_group) as muscle_groups
                FROM workout_log wl
                JOIN exercises e ON e.id = wl.exercise_id
                GROUP BY wl.date
                ORDER BY wl.date DESC
                LIMIT :limit
            """),
            {"limit": limit}
        ).fetchall()
    return [
        {
            "date": r.date,
            "day": r.day,
            "exercise_count": r.exercise_count,
            "total_volume_kg": round(r.total_volume_kg or 0, 2),
            "muscle_groups": r.muscle_groups.split(",") if r.muscle_groups else []
        }
        for r in rows
    ]

@app.get("/api/sessions/{date}")
async def get_session(date: str):
    with get_conn() as conn:
        rows = conn.execute(
            text("""
                SELECT wl.id, wl.sets, wl.reps, wl.weight_kg, wl.notes,
                       e.name as exercise, e.muscle_group
                FROM workout_log wl
                JOIN exercises e ON e.id = wl.exercise_id
                WHERE wl.date = :date
            """),
            {"date": date}
        ).fetchall()
    return [
        {
            "id": r.id,
            "exercise": r.exercise,
            "muscle_group": r.muscle_group,
            "sets": r.sets,
            "reps": r.reps,
            "weight_kg": r.weight_kg,
            "notes": r.notes or ""
        }
        for r in rows
    ]

@app.post("/api/sessions", status_code=201)
async def create_session(session: SessionPayload):
    day_of_week = datetime.strptime(session.date, "%Y-%m-%d").strftime("%A")
    with get_conn() as conn:
        for exercise in session.exercises:
            conn.execute(
                text("""
                    INSERT INTO workout_log (id, date, day, exercise_id, sets, reps, weight_kg, notes)
                    VALUES (:id, :date, :day, :exercise_id, :sets, :reps, :weight_kg, :notes)
                """),
                {
                    "id": str(uuid.uuid4()),
                    "date": session.date,
                    "day": day_of_week,
                    "exercise_id": exercise.exercise_id,
                    "sets": exercise.sets,
                    "reps": exercise.reps,
                    "weight_kg": exercise.weight_kg,
                    "notes": exercise.notes
                }
            )
        conn.commit()
    return {"created": len(session.exercises)}
    
@app.delete("/api/sessions/{date}", status_code=204)
async def delete_session(date: str):
    with get_conn() as conn:
        conn.execute(
            text("DELETE FROM workout_log WHERE date = :date"),
            {"date": date}
        )
        conn.commit()
# --- Workouts / Progress ---

@app.get("/api/workouts/week-summary")
async def get_week_summary():
    today = datetime.now().date()
    monday = today - timedelta(days=today.weekday())
    days = [monday + timedelta(days=i) for i in range(7)]
    day_labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    start_str = monday.strftime("%Y-%m-%d")

    with get_conn() as conn:
        rows = conn.execute(
            text("""
                SELECT date, SUM(sets * reps * weight_kg) as volume
                FROM workout_log
                WHERE date >= :start
                GROUP BY date
            """),
            {"start": start_str}
        ).fetchall()

    volume_map = {r.date: r.volume for r in rows}
    return [
        {"day": day_labels[i], "value": round(volume_map.get(d.strftime("%Y-%m-%d"), 0))}
        for i, d in enumerate(days)
    ]

@app.get("/api/workouts/progress")
async def get_progress(range: str = Query("all", regex="^(all|3months|1month)$")):
    now = datetime.now()
    if range == "1month":
        cutoff = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    elif range == "3months":
        cutoff = (now - timedelta(days=91)).strftime("%Y-%m-%d")
    else:
        cutoff = None

    with get_conn() as conn:
        where = "WHERE wl.date >= :cutoff" if cutoff else ""
        params = {"cutoff": cutoff} if cutoff else {}

        rows = conn.execute(
            text(f"""
                SELECT wl.date, wl.sets, wl.reps, wl.weight_kg, e.name as exercise_name
                FROM workout_log wl
                JOIN exercises e ON e.id = wl.exercise_id
                {where}
                ORDER BY wl.date ASC
            """),
            params
        ).fetchall()

    total_volume = 0.0
    volume_by_week = {}
    volume_by_month = {}
    prs = {}

    for r in rows:
        workout_date = datetime.strptime(r.date, "%Y-%m-%d")
        raw_volume = r.sets * r.reps * r.weight_kg
        total_volume += raw_volume

        year, week, _ = workout_date.isocalendar()
        volume_by_week.setdefault((year, week), 0.0)
        volume_by_week[(year, week)] += raw_volume

        month_key = (workout_date.year, workout_date.month)
        volume_by_month.setdefault(month_key, 0.0)
        volume_by_month[month_key] += raw_volume

        if r.exercise_name not in prs or r.weight_kg > prs[r.exercise_name]["value"]:
            prs[r.exercise_name] = {
                "name": r.exercise_name,
                "value": r.weight_kg,
                "date": workout_date.strftime("%b %d")
            }

    week_limit = 4 if range == "1month" else 12 if range == "3months" else 8
    sorted_weeks = sorted(volume_by_week.items())
    formatted_weeks = [
        {"label": datetime.fromisocalendar(y, w, 1).strftime("%b %d"), "value": round(v)}
        for (y, w), v in sorted_weeks[-week_limit:]
    ]

    month_limit = 1 if range == "1month" else 3 if range == "3months" else 12
    sorted_months = sorted(volume_by_month.items())
    formatted_months = [
        {"label": datetime(y, m, 1).strftime("%b %Y"), "value": round(v)}
        for (y, m), v in sorted_months[-month_limit:]
    ]

    return {
        "total_volume": total_volume,
        "volume_by_week": formatted_weeks,
        "volume_by_month": formatted_months,
        "prs": sorted(prs.values(), key=lambda x: x["value"], reverse=True)[:5]
    }